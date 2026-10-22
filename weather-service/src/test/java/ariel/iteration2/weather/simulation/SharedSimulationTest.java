package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.net.http.HttpClient;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class SharedSimulationTest {
    final ObjectMapper json = new ObjectMapper();
    final MutableClock clock = new MutableClock();
    HttpServer market;
    final AtomicReference<String> price = new AtomicReference<>("100000");
    final AtomicInteger hits = new AtomicInteger();
    String database;
    SimulationStore store;
    SimulationService service;
    @BeforeEach void setup() throws Exception {
        market = HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        market.createContext("/price",exchange -> {
            hits.incrementAndGet(); byte[] body=("{\"symbol\":\"BTCUSDT\",\"price\":\""+price.get()+"\"}").getBytes();
            exchange.sendResponseHeaders(200,body.length); exchange.getResponseBody().write(body); exchange.close();
        }); market.start();
        database="jdbc:h2:mem:"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000";
        store=new SimulationStore(database,json); store.initialize(); service=service(store);
    }
    @AfterEach void close() { market.stop(0); }
    SimulationService service(SimulationStore data) {
        return new SimulationService(data,HttpClient.newHttpClient(),clock,json,
            "http://127.0.0.1:"+market.getAddress().getPort()+"/price",false);
    }
    JsonNode command(String id,long revision,String type,String fields) throws Exception {
        return json.readTree("{\"id\":\""+id+"\",\"expectedControlRevision\":"+revision+",\"type\":\""+type+"\""+fields+"}");
    }
    SharedState action(String type,String fields) throws Exception {
        return service.command(command(UUID.randomUUID().toString(),service.read().controlRevision,type,fields));
    }
    @Test void cashResetCrossingsFeesAndDurablePauseSurviveNewService() throws Exception {
        service.tick();
        var s=action("reset",",\"changes\":{\"capital\":1000,\"minimum\":99000,\"maximum\":101000}");
        assertEquals(1000,s.simulation.usdt); assertEquals(0,s.simulation.btc); assertEquals(0,s.simulation.tradeCount);
        s=service.tick(); assertEquals(0,s.simulation.tradeCount);
        clock.advance(); price.set("98000"); s=service.tick();
        assertEquals(1,s.simulation.tradeCount); assertEquals(1000.0/98000*0.999,s.simulation.btc,1e-12);
        assertEquals(1,s.simulation.feesEquivalent,1e-10);
        clock.advance(); price.set("102000"); s=service.tick();
        assertEquals(2,s.simulation.tradeCount); assertEquals(0,s.simulation.btc);
        double proceeds=(1000.0/98000*0.999)*102000*0.999;
        assertEquals(proceeds,s.simulation.usdt,1e-8);
        action("running",",\"running\":false");
        var newStore=new SimulationStore(database,json); newStore.initialize(); var restored=service(newStore);
        assertFalse(restored.read().running); assertEquals(proceeds,restored.read().simulation.usdt,1e-8);
        assertEquals(2,restored.read().simulation.trades.size());
        clock.advance(); price.set("97000"); int calls=hits.get();restored.tick();assertEquals(calls,hits.get());
        assertEquals(2,restored.read().simulation.tradeCount);
    }
    @Test void commandsAreIdempotentAndOnlyControlChangesConflict() throws Exception {
        var reset=command(UUID.randomUUID().toString(),0,"reset","");
        var first=service.command(reset); service.tick();
        assertEquals(1,service.read().controlRevision);
        var duplicate=service.command(reset); assertEquals(first.controlRevision,duplicate.controlRevision);
        assertEquals(1,duplicate.count); // A replay did not clear fresh history.
        assertThrows(SimulationService.Conflict.class,()->service.command(command(UUID.randomUUID().toString(),0,"running",",\"running\":false")));
        var paused=service.command(command(UUID.randomUUID().toString(),1,"running",",\"running\":false"));
        assertFalse(paused.running);
    }
    @Test void twoInstancesSerializePollSlotsAndConcurrentCommands() throws Exception {
        var secondStore=new SimulationStore(database,json);secondStore.initialize();var second=service(secondStore);
        var executor=Executors.newFixedThreadPool(4);
        try {
            var first=executor.submit(()->service.tick());var other=executor.submit(()->second.tick());
            first.get(10,TimeUnit.SECONDS);other.get(10,TimeUnit.SECONDS);
            assertEquals(1,hits.get());assertEquals(1,service.read().count);assertEquals(1,second.read().count);
            var cmd=command(UUID.randomUUID().toString(),0,"reset","");
            var a=executor.submit(()->service.command(cmd));var b=executor.submit(()->second.command(cmd));
            a.get(10,TimeUnit.SECONDS);b.get(10,TimeUnit.SECONDS);
            assertEquals(1,service.read().controlRevision);assertEquals(10000,second.read().simulation.usdt);
        } finally {executor.shutdownNow();}
    }
    @Test void invalidAndFailedStorageWorkRollBackAndProviderErrorKeepsBalances() throws Exception {
        action("reset","");service.tick();
        long before=service.read().revision;
        assertThrows(IllegalArgumentException.class,()->action("settings",",\"changes\":{\"minimum\":200000,\"maximum\":100000}"));
        assertEquals(before,service.read().revision);
        assertThrows(SimulationStore.StorageUnavailable.class,()->store.locked(s->{s.simulation.usdt=1;throw new RuntimeException("failure");}));
        assertEquals(10000,service.read().simulation.usdt);
        clock.advance();price.set("NaN");var s=service.tick();
        assertFalse(s.error.isBlank());assertEquals(10000,s.simulation.usdt);assertEquals(0,s.simulation.tradeCount);assertEquals(1,s.count);
        var missing=new SimulationStore("",json);assertThrows(SimulationStore.StorageUnavailable.class,missing::read);
    }
    @Test void settingsPersistAndDoNotChangeActiveCapitalOrFeeUntilReset() throws Exception {
        action("reset","");
        action("settings",",\"changes\":{\"capital\":20000,\"feePercent\":0.2,\"minimum\":90000,\"maximum\":110000,\"step\":5}");
        var newStore=new SimulationStore(database,json);newStore.initialize();var s=newStore.read();
        assertEquals(20000,s.settings.capital);assertEquals(0.2,s.settings.feePercent);assertEquals(10000,s.simulation.capital);assertEquals(0.1,s.simulation.feePercent);
        s=action("reset","");assertEquals(20000,s.simulation.usdt);assertEquals(0.2,s.simulation.feePercent);
    }
    static class MutableClock extends Clock {
        final AtomicReference<Instant> now=new AtomicReference<>(Instant.parse("2026-10-22T12:00:00Z"));
        void advance(){now.updateAndGet(t->t.plusSeconds(10));}
        public ZoneId getZone(){return ZoneOffset.UTC;}
        public Clock withZone(ZoneId zone){return this;}
        public Instant instant(){return now.get();}
    }
}
