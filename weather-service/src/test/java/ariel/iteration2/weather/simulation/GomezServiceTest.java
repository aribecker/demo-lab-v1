package ariel.iteration2.weather.simulation;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.UUID;

/** Reuses the audited loopback provider and disposable database fixture. */
class GomezServiceTest {
    final SharedSimulationTest fixture = new SharedSimulationTest();
    final SharedSimulationTest.MutableClock clock = fixture.clock;
    final java.util.concurrent.atomic.AtomicReference<String> price = fixture.price;
    final java.util.concurrent.atomic.AtomicInteger hits = fixture.hits;
    final com.fasterxml.jackson.databind.ObjectMapper json = fixture.json;
    SimulationService service;
    String database;
    @org.junit.jupiter.api.BeforeEach void setup() throws Exception { fixture.setup(); service=fixture.service; database=fixture.database; }
    @org.junit.jupiter.api.AfterEach void close() { fixture.close(); }
    SharedState action(String type, String fields) throws Exception { return fixture.action(type,fields); }
    com.fasterxml.jackson.databind.JsonNode command(String id,long revision,String type,String fields) throws Exception { return fixture.command(id,revision,type,fields); }
    SimulationService service(SimulationStore data) { return fixture.service(data); }
    SharedState startGomez() throws Exception {
        return action("reset",",\"changes\":{\"strategy\":\"gomez\",\"initialBtc\":1,\"delta\":2,\"pollSeconds\":120}");
    }
    @Test void pollingIntervalAndRelaunchPreserveSoldFundsAndFillReferenceAcrossRestart() throws Exception {
        startGomez();var s=service.tick();assertEquals(1,hits.get());assertEquals("BUY",s.simulation.gomez.nextAction);
        clock.advance();service.tick();assertEquals(1,hits.get());
        var cmd=command(UUID.randomUUID().toString(),s.controlRevision,"relaunch",",\"changes\":{\"delta\":0.5,\"pollSeconds\":30}");
        s=service.command(cmd);assertEquals(99900,s.simulation.usdt);assertEquals(1,s.simulation.tradeCount);
        assertEquals(99500,s.simulation.gomez.targetPrice);assertEquals(100000,s.simulation.gomez.lastFillPrice);
        service.command(cmd);assertEquals(s.controlRevision,service.read().controlRevision);
        var restoredStore=new SimulationStore(database,json);restoredStore.initialize();var restored=service(restoredStore);
        assertEquals(99500,restored.read().simulation.gomez.targetPrice);assertTrue(restored.read().simulation.gomez.pendingSell);
        price.set("99400");clock.advance();restored.tick();clock.advance();restored.tick();assertEquals(1,hits.get());
        clock.advance();s=restored.tick();assertEquals(2,hits.get());assertEquals(1,s.simulation.gomez.completedCycles);
        assertEquals(30000,restored.execution(s).pollIntervalMs());
    }
    @Test void invalidRelaunchAndPendingResetRollBackWithoutSideEffects() throws Exception {
        startGomez();service.tick();long revision=service.read().controlRevision;
        for(String changes:new String[]{"{\"delta\":100}","{\"pollSeconds\":10.5}","{\"initialAction\":\"SELL\"}","{\"deltaUnit\":\"invalid\"}","{}"}) {
            assertThrows(IllegalArgumentException.class,()->action("relaunch",",\"changes\":"+changes));
            assertEquals(revision,service.read().controlRevision);assertEquals(99900,service.read().simulation.usdt);
        }
        assertThrows(IllegalArgumentException.class,()->action("reset",",\"changes\":{\"strategy\":\"classic\"}"));
        assertEquals("gomez",service.read().settings.strategy);
    }
    @Test void errorRetriesOnIntervalAndStopFlagSurvivesRestart() throws Exception {
        long baseline=service.rateSummary().total();
        startGomez();service.tick();action("finish-cycle",",\"enabled\":true");
        price.set("NaN");for(int i=0;i<12;i++)clock.advance();var failed=service.tick();
        assertEquals(1,failed.simulation.tradeCount);assertTrue(failed.simulation.gomez.pendingSell);
        assertTrue(failed.error.contains("INVALID_RESPONSE"));assertEquals(98000,failed.simulation.gomez.targetPrice);
        var restoredStore=new SimulationStore(database,json);restoredStore.initialize();var restored=service(restoredStore);
        assertTrue(restored.read().simulation.gomez.stopAfterCycle);
        price.set("98000");for(int i=0;i<12;i++)clock.advance();var done=restored.tick();
        assertFalse(done.running);assertEquals(1,done.simulation.gomez.completedCycles);assertTrue(done.simulation.btc>1);
        assertEquals(baseline+3,restored.rateSummary().total());
    }
    @Test void backwardsClockDoesNotReuseQuoteAndForwardJumpDoesNotCatchUpBurst() throws Exception {
        startGomez();service.tick();clock.now.updateAndGet(t->t.minusSeconds(1000));service.tick();assertEquals(1,hits.get());
        clock.now.updateAndGet(t->t.plusSeconds(100000));service.tick();service.tick();assertEquals(2,hits.get());
        assertEquals(1,service.read().simulation.tradeCount);
    }
}
