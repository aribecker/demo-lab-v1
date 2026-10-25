package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.*;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SimulationService {
    private static final Logger LOG = LoggerFactory.getLogger(SimulationService.class);
    private final String processStartedAt = Instant.now().toString();
    private volatile String lastCycleAt, lastCycleStatus = "waiting";
    @Value("${simulation.hosting-mode:free}") private String hostingMode = "free";
    public record Execution(String hostingMode, boolean schedulingEnabled, long pollIntervalMs,
        String processStartedAt, String lastCycleAt, String lastCycleStatus) {}
    public Execution execution() {
        return new Execution(hostingMode, scheduling, 10000, processStartedAt, lastCycleAt, lastCycleStatus);
    }
    private final SimulationStore store;
    private final HttpClient http;
    private final Clock clock;
    private final ObjectMapper json;
    private final URI market;
    private final boolean scheduling;
    public SimulationService(SimulationStore store, HttpClient http, Clock clock, ObjectMapper json,
        @Value("${simulation.price-url:https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT}") String url,
        @Value("${simulation.scheduling-enabled:true}") boolean scheduling) {
        this.store=store; this.http=http; this.clock=clock; this.json=json; this.market=URI.create(url); this.scheduling=scheduling;
    }
    @PostConstruct public void initialize() {
        if (store.configured()) try { store.initialize(); } catch (SimulationStore.StorageUnavailable ignored) { }
    }
    public SharedState read() { return store.read(); }
    public record RunMetrics(Long readingCount, String startedAt, Long elapsedSeconds) {}
    public RunMetrics runMetrics(SharedState state) {
        var sim = state.simulation;
        if (sim.startedAt == null) return new RunMetrics(sim.phase.equals("inactive") ? 0L : null, null, null);
        return new RunMetrics(sim.readingCount, sim.startedAt,
            Math.max(0, Duration.between(Instant.parse(sim.startedAt), clock.instant()).getSeconds()));
    }
    @Scheduled(fixedDelayString="${simulation.poll-ms:10000}", initialDelayString="${simulation.initial-delay-ms:1000}")
    public void scheduledTick() {
        if (!scheduling) return;
        try {
            store.initialize(); tick(); lastCycleStatus = "ok";
        } catch (SimulationStore.StorageUnavailable unavailable) {
            if (!lastCycleStatus.equals("storage_unavailable"))
                LOG.warn("Simulation scheduler storage unavailable; durable state retained, retrying next cycle.");
            lastCycleStatus = "storage_unavailable";
        } catch (RuntimeException failure) {
            lastCycleStatus = "failed";
            LOG.warn("Simulation scheduler cycle failed; retrying next cycle.");
        } finally { lastCycleAt = clock.instant().toString(); }
    }
    public SharedState tick() {
        return store.locked(s -> {
            if (s.running && clock.millis() >= s.nextPollAt) {
                if (s.lastPollAt > 0 && clock.millis() - s.lastPollAt > 30000) s.simulation.previousPrice = null;
                poll(s);
            }
            return s;
        });
    }
    public RateQueryHistory.Summary rateSummary() { return store.history().summary(); }
    public RateQueryHistory.Page rateQueries(Long before,int limit) { return store.history().page(before,limit); }
    public RateQueryHistory.PeriodPage ratePeriods(Long before,int limit) { return store.history().periods(before,limit); }
    private void poll(SharedState s) {
        Instant now = clock.instant();
        s.nextPollAt = now.toEpochMilli() + 10000;
        // Reserve durably before any network call. Storage failure means no unaudited request.
        long attempt = store.history().begin(now);
        java.math.BigDecimal rate = null;
        Integer httpStatus = null;
        String errorCode = null;
        boolean interrupted = false;
        try {
            var response = http.send(HttpRequest.newBuilder(market).timeout(Duration.ofSeconds(5))
                .header("Accept","application/json").GET().build(),HttpResponse.BodyHandlers.ofString());
            httpStatus=response.statusCode();
            if(httpStatus!=200) errorCode="HTTP_ERROR";
            else {
                JsonNode data=json.readTree(response.body());
                if(data==null || !"BTCUSDT".equals(data.path("symbol").asText()) || !data.path("price").isTextual())
                    throw new IllegalArgumentException("Invalid response");
                String text=data.path("price").asText();
                if(text.length()>128)throw new IllegalArgumentException("Invalid price");
                rate=new java.math.BigDecimal(text);
                if(rate.signum()<=0 || rate.compareTo(new java.math.BigDecimal("1000000000000"))>0 || rate.scale()>12)
                    throw new IllegalArgumentException("Price outside database contract");
            }
        } catch (InterruptedException failure) {
            interrupted=true;errorCode="INTERRUPTED";
        } catch (java.net.http.HttpTimeoutException failure) {
            errorCode="TRANSPORT_ERROR";
        } catch (java.io.IOException failure) {
            errorCode=httpStatus==null?"TRANSPORT_ERROR":"INVALID_RESPONSE";
        } catch (RuntimeException failure) {
            errorCode="INVALID_RESPONSE";
        }
        Instant completed=clock.instant();
        try {
            store.history().complete(attempt,completed,errorCode==null?rate:null,httpStatus,errorCode);
        } finally { if(interrupted)Thread.currentThread().interrupt(); }
        if(errorCode==null) SimulationEngine.quote(s,rate.doubleValue(),completed);
        else s.error="Binance quote unavailable or invalid ("+errorCode+"). Last successful quote retained; no simulated trade executed.";
        s.revision++; s.updatedAt=completed.toString();
    }
    public SharedState command(JsonNode command) {
        if (command == null || !command.isObject()) throw new IllegalArgumentException("Invalid command.");
        String id=command.path("id").asText();
        try { if (!UUID.fromString(id).toString().equalsIgnoreCase(id)) throw new IllegalArgumentException(); }
        catch (Exception invalid) { throw new IllegalArgumentException("A valid command UUID is required."); }
        if (!command.path("expectedControlRevision").isIntegralNumber() || !command.path("expectedControlRevision").canConvertToLong() || command.path("expectedControlRevision").asLong()<0)
            throw new IllegalArgumentException("Control revision is required.");
        String type=command.path("type").asText();
        if (!java.util.Set.of("settings","reset","running","refresh").contains(type)) throw new IllegalArgumentException("Unknown command.");
        return store.locked(s -> {
            if (s.commandIds.contains(id)) return s;
            if (s.controlRevision != command.path("expectedControlRevision").asLong()) throw new Conflict();
            switch(type) {
                case "settings" -> settings(s,command.path("changes"));
                case "reset" -> {
                    if (command.has("changes")) settings(s,command.get("changes"));
                    SimulationEngine.reset(s);
                    s.simulation.startedAt=clock.instant().toString();
                }
                case "running" -> {
                    if (!command.path("running").isBoolean()) throw new IllegalArgumentException("Running must be true or false.");
                    boolean resume = !s.running && command.path("running").asBoolean();
                    s.running=command.path("running").asBoolean();
                    if (resume) { s.nextPollAt=0; s.simulation.previousPrice=null; AdaptiveTrading.interrupt(s.simulation); }
                }
                case "refresh" -> {
                    if (!s.running) throw new IllegalArgumentException("Resume tracking before refreshing.");
                    if (s.lastPollAt > 0 && clock.millis() - s.lastPollAt > 30000) s.simulation.previousPrice=null;
                    poll(s);
                }
            }
            s.commandIds.add(id); if (s.commandIds.size()>128) s.commandIds.remove(0);
            s.controlRevision++; s.revision++; s.updatedAt=clock.instant().toString();
            return s;
        });
    }
    private void settings(SharedState s,JsonNode changes) {
        if (!changes.isObject() || changes.isEmpty()) throw new IllegalArgumentException("Settings changes are required.");
        var fields=changes.fields();
        while(fields.hasNext()) {
            var field=fields.next();
            if(field.getKey().equals("strategy")) {
                if(!field.getValue().isTextual()) throw new IllegalArgumentException("Strategy must be text.");
                s.settings.strategy=field.getValue().asText();continue;
            }
            if (!field.getValue().isNumber() || !Double.isFinite(field.getValue().asDouble())) throw new IllegalArgumentException("Settings must be finite numbers.");
            double value=field.getValue().asDouble();
            switch(field.getKey()) {
                case "capital" -> s.settings.capital=value;
                case "feePercent" -> s.settings.feePercent=value;
                case "minimum" -> s.settings.minimum=value;
                case "maximum" -> s.settings.maximum=value;
                case "step" -> s.settings.step=value;
                case "dipAtr" -> s.settings.dipAtr=value;
                case "reboundAtr" -> s.settings.reboundAtr=value;
                case "trailAtr" -> s.settings.trailAtr=value;
                case "lossAtr" -> s.settings.lossAtr=value;
                case "minimumMovePercent" -> s.settings.minimumMovePercent=value;
                default -> throw new IllegalArgumentException("Unknown setting.");
            }
        }
        SimulationEngine.validate(s.settings);
    }
    public static class Conflict extends RuntimeException { public Conflict() { super("Shared controls changed in another view. Review the current state and try again."); } }
}

