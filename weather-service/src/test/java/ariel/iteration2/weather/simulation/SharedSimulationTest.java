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
        // Optional dedicated PostgreSQL test database; never point this at a deployed database.
        database=System.getenv("SIMULATION_TEST_DATABASE_URL");
        if (database == null || database.isBlank()) database="jdbc:h2:mem:"+UUID.randomUUID()+";MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000";
        else if (!database.matches("jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/.*")) {
            throw new IllegalArgumentException("Simulation integration tests require a disposable loopback PostgreSQL database.");
        } else try (var c=java.sql.DriverManager.getConnection(database);var statement=c.createStatement()) {
            statement.execute("CREATE SCHEMA IF NOT EXISTS bitcoin_shared");
            statement.execute("DROP TABLE IF EXISTS bitcoin_shared.simulation_state");
            statement.execute("CREATE TABLE IF NOT EXISTS public.unrelated_people_fixture(id integer primary key)");
            statement.execute("INSERT INTO public.unrelated_people_fixture SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.unrelated_people_fixture WHERE id=1)");
        }
        store=new SimulationStore(database,json); store.initialize();
        store.locked(s->{s.settings.strategy="classic";return s;}); // Legacy strategy regression fixture.
        service=service(store);
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
    @Test void unattendedSchedulerTradesAndRestoresWithoutClientReads() throws Exception {
        service=new SimulationService(store,HttpClient.newHttpClient(),clock,json,
            "http://127.0.0.1:"+market.getAddress().getPort()+"/price",true);
        action("reset",",\"changes\":{\"minimum\":99000,\"maximum\":101000}");
        // No browser or API reads between these scheduler cycles.
        service.scheduledTick(); clock.advance();price.set("98000");service.scheduledTick();
        clock.advance();price.set("102000");service.scheduledTick();
        var restarted=new SimulationStore(database,json);restarted.initialize();
        var saved=restarted.read();
        assertEquals(3,saved.count);assertEquals(2,saved.simulation.tradeCount);
        assertTrue(saved.running);assertEquals("holding_usdt",saved.simulation.phase);
        assertEquals(2,saved.simulation.trades.size());
        assertEquals("ok",service.execution().lastCycleStatus());
        assertEquals(clock.instant().toString(),service.execution().lastCycleAt());
        if (database.startsWith("jdbc:postgresql:")) try(var c=java.sql.DriverManager.getConnection(database);var st=c.createStatement();var rows=st.executeQuery("SELECT count(*) FROM public.unrelated_people_fixture")) {
            assertTrue(rows.next());assertEquals(1,rows.getInt(1));
        }
    }
    @Test void downtimeAndResumeRequireNewReferenceBeforeTrading() throws Exception {
        action("reset",",\"changes\":{\"minimum\":99000,\"maximum\":101000}");service.tick();
        for(int i=0;i<4;i++)clock.advance();
        price.set("98000");assertEquals(0,service.tick().simulation.tradeCount);
        clock.advance();price.set("100000");service.tick();
        clock.advance();price.set("98000");assertEquals(1,service.tick().simulation.tradeCount);
        action("running",",\"running\":false");clock.advance();price.set("102000");
        action("running",",\"running\":true");assertEquals(1,service.tick().simulation.tradeCount);
        clock.advance();price.set("100000");service.tick();
        clock.advance();price.set("102000");assertEquals(2,service.tick().simulation.tradeCount);
    }
    @Test void runMetricsResetPersistAndUseServerTime() throws Exception {
        service.tick();assertEquals(0L,service.runMetrics(service.read()).readingCount());
        assertNull(service.runMetrics(service.read()).startedAt());
        var reset=action("reset","");String start=reset.simulation.startedAt;
        assertEquals(clock.instant().toString(),start);assertEquals(0,reset.simulation.readingCount);
        service.tick();clock.advance();service.tick();
        assertEquals(2,service.read().simulation.readingCount);
        action("running",",\"running\":false");clock.advance();service.tick();
        var restored=new SimulationStore(database,json);restored.initialize();var saved=restored.read();
        assertEquals(start,saved.simulation.startedAt);assertEquals(2,saved.simulation.readingCount);
        assertEquals(20L,service.runMetrics(saved).elapsedSeconds());
        service.read();assertEquals(2,service.read().simulation.readingCount);
        action("running",",\"running\":true");price.set("NaN");service.tick();
        assertEquals(2,service.read().simulation.readingCount);
        reset=action("reset","");assertEquals(0,reset.simulation.readingCount);
        assertNotEquals(start,reset.simulation.startedAt);assertEquals(0L,service.runMetrics(reset).elapsedSeconds());
    }
    @Test void adaptiveConfigurationAndTrackingAreDurableAndNextRunOnly() throws Exception {
        action("reset",",\"changes\":{\"strategy\":\"adaptive\",\"trailAtr\":2.5}");
        for(int i=0;i<=126;i++) { price.set("100");service.tick();clock.advance(); }
        price.set("99.7");service.tick();clock.advance();
        price.set("99.95");service.tick();
        assertEquals(1,service.read().simulation.tradeCount);
        var previousStop=service.read().simulation.tracking.trailingStop;
        action("settings",",\"changes\":{\"strategy\":\"classic\",\"trailAtr\":10}");
        var restarted=new SimulationStore(database,json);restarted.initialize();var saved=restarted.read();
        assertEquals("adaptive",saved.simulation.strategy);assertEquals(2.5,saved.simulation.trailAtr);
        assertEquals("classic",saved.settings.strategy);assertEquals(previousStop,saved.simulation.tracking.trailingStop);
        action("running",",\"running\":false");action("running",",\"running\":true");
        assertFalse(service.read().simulation.tracking.ready);
        assertEquals(previousStop,service.read().simulation.tracking.trailingStop);
        clock.advance();price.set("90");service.tick();assertEquals(2,service.read().simulation.tradeCount);
        var reset=action("reset","");assertEquals("classic",reset.simulation.strategy);assertEquals(10,reset.simulation.trailAtr);
    }
    @Test void invalidAdaptiveSettingsRollBackAndDuplicateResetDoesNotReplay() throws Exception {
        var cmd=command(UUID.randomUUID().toString(),0,"reset",",\"changes\":{\"strategy\":\"adaptive\"}");
        service.command(cmd);service.tick();var before=service.read();
        service.command(cmd);assertEquals(before.count,service.read().count);
        for(String invalid:List.of("{\"strategy\":\"unknown\"}","{\"trailAtr\":0}","{\"minimumMovePercent\":11}","{\"strategy\":5}")) {
            assertThrows(IllegalArgumentException.class,()->action("settings",",\"changes\":"+invalid));
            assertEquals(before.controlRevision,service.read().controlRevision);
            assertEquals("adaptive",service.read().settings.strategy);assertEquals(2,service.read().settings.trailAtr);
        }
    }
    static class MutableClock extends Clock {
        final AtomicReference<Instant> now=new AtomicReference<>(Instant.parse("2026-10-22T12:00:00Z"));
        void advance(){now.updateAndGet(t->t.plusSeconds(10));}
        public ZoneId getZone(){return ZoneOffset.UTC;}
        public Clock withZone(ZoneId zone){return this;}
        public Instant instant(){return now.get();}
    }
}

