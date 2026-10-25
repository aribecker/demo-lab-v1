package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

/** Explicit public market projection: never expose balances, settings or controls. */
@RestController
@RequestMapping("/api/bitcoin")
public class BitcoinMarketController {
    private final SimulationService service;
    private final ObjectMapper json;
    public BitcoinMarketController(SimulationService service,ObjectMapper json) { this.service=service;this.json=json; }
    @GetMapping public ResponseEntity<JsonNode> market() {
        var state=service.read();
        ObjectNode result=json.createObjectNode();
        result.put("revision",state.revision);result.put("running",state.running);
        result.set("samples",json.valueToTree(state.samples));result.set("baseline",json.valueToTree(state.baseline));
        result.set("range",json.valueToTree(state.range));result.put("count",state.count);
        result.put("lastPollAt",state.lastPollAt);result.put("error",state.error);
        result.set("rateQueries",json.valueToTree(service.rateSummary()));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(result);
    }
    @GetMapping("/rate-queries") public ResponseEntity<RateQueryHistory.Page> queries(@RequestParam(required=false) Long before,@RequestParam(defaultValue="25") int limit) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.rateQueries(before,limit));
    }
    @GetMapping("/rate-periods") public ResponseEntity<RateQueryHistory.PeriodPage> periods(@RequestParam(required=false) Long before,@RequestParam(defaultValue="25") int limit) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.ratePeriods(before,limit));
    }
    @ExceptionHandler(SimulationStore.StorageUnavailable.class) ResponseEntity<?> unavailable() {
        return ResponseEntity.status(503).cacheControl(CacheControl.noStore()).body(Map.of("code","SIMULATION_STORAGE_UNAVAILABLE","message","Market storage is unavailable. Please retry."));
    }
    @ExceptionHandler({IllegalArgumentException.class,org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class}) ResponseEntity<?> invalid() {
        return ResponseEntity.badRequest().cacheControl(CacheControl.noStore()).body(Map.of("message","Use a positive history cursor and a page size from 1 to 100."));
    }
}
