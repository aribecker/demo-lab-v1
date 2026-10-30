package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GomezTradingTest {
    SharedState start() {
        var s = new SharedState(); s.settings.strategy="gomez"; s.settings.initialBtc=1;
        s.settings.feePercent=0.1; SimulationEngine.reset(s); return s;
    }
    void quote(SharedState s, double price, int seconds) {
        SimulationEngine.quote(s,price,Instant.parse("2026-10-29T12:00:00Z").plusSeconds(seconds));
    }
    @Test void sellStartsInBitcoinAndRebuyClosesCycleWithBothFees() {
        var s=start(); var sim=s.simulation; var g=sim.gomez;
        assertEquals(1,sim.btc); assertEquals(0,sim.usdt); assertEquals(0,sim.tradeCount);
        quote(s,100000,0);
        assertEquals(1,sim.tradeCount);assertEquals("BUY",g.nextAction);assertTrue(g.pendingSell);
        assertEquals(99900,sim.usdt,1e-9);assertEquals(99000,g.targetPrice);assertEquals(100000,sim.capital);
        quote(s,99001,120);assertEquals(1,sim.tradeCount);
        quote(s,99000,240);
        double expected=99900.0/99000*0.999;
        assertEquals(expected,sim.btc,1e-12);assertEquals(expected-1,g.lastCycleGainBtc,1e-12);
        assertEquals(1,g.completedCycles);assertFalse(g.pendingSell);assertEquals("SELL",g.nextAction);
        assertEquals(99990,g.targetPrice,1e-8);assertEquals(199.9,sim.feesEquivalent,1e-8);
        quote(s,99990,360);assertEquals(3,sim.tradeCount);assertTrue(g.pendingSell);
    }
    @Test void initialBuyIsAnEntryAndNotACompletedCycle() {
        var s=start();s.simulation.gomez.pendingSell=false;s.settings.initialAction="BUY";
        SimulationEngine.reset(s);assertEquals(10000,s.simulation.usdt);assertEquals(0,s.simulation.btc);
        quote(s,100000,0);var g=s.simulation.gomez;
        assertEquals("BUY",s.simulation.trades.get(0).side());assertEquals(0,g.completedCycles);
        assertEquals(0.1,g.initialBtcEquivalent,1e-12);assertEquals(101000,g.targetPrice);
        quote(s,101000,120);quote(s,99990,240);assertEquals(1,g.completedCycles);
    }
    @Test void absoluteDeltaEqualityAndGapFillUseObservedPriceAndNeverDoubleTrade() {
        var s=start();s.simulation.gomez.deltaUnit="usdt";s.simulation.gomez.delta=1000;
        quote(s,100000,0);quote(s,98000,120);
        assertEquals(2,s.simulation.tradeCount);assertEquals(98000,s.simulation.trades.get(1).price());
        assertEquals(99000,s.simulation.gomez.targetPrice);quote(s,99000,240);
        assertEquals(3,s.simulation.tradeCount);
        quote(s,100,240);assertEquals(3,s.simulation.tradeCount); // same timestamp ignored
    }
    @Test void deltaMayLoseBitcoinAfterFeesAndNonpositiveTargetBlocksRatherThanClamps() {
        var s=start();s.simulation.gomez.delta=0.01;
        quote(s,100000,0);quote(s,99990,120);assertTrue(s.simulation.gomez.lastCycleGainBtc<0);
        s=start();s.simulation.gomez.deltaUnit="usdt";s.simulation.gomez.delta=200000;
        quote(s,100000,0);quote(s,1,120);
        assertEquals(1,s.simulation.tradeCount);assertTrue(s.simulation.gomez.decision.contains("not positive"));
    }
    @Test void stopAfterCyclePausesOnlyAfterRebuyAndPauseKeepsPendingLeg() {
        var s=start();s.simulation.gomez.stopAfterCycle=true;quote(s,100000,0);
        assertTrue(s.running);s.running=false;quote(s,98000,120);assertEquals(1,s.simulation.tradeCount);
        s.running=true;quote(s,98000,240);assertFalse(s.running);assertTrue(s.simulation.btc>1);
        assertFalse(s.simulation.gomez.stopAfterCycle);assertEquals("SELL",s.simulation.gomez.nextAction);
    }
    @Test void resetCannotDiscardASoldPositionEvenWhenPaused() {
        var s=start();quote(s,100000,0);s.running=false;s.settings.strategy="adaptive";
        assertThrows(IllegalArgumentException.class,()->SimulationEngine.reset(s));assertEquals(99900,s.simulation.usdt);
    }
    @Test void rejectsInvalidParametersAndLegacyDocumentKeepsClassic() throws Exception {
        for(double delta:new double[]{0,-1,100,Double.NaN}) assertThrows(IllegalArgumentException.class,()->GomezTrading.validate(delta,"percent",120));
        assertThrows(IllegalArgumentException.class,()->GomezTrading.validate(1,"bad",120));
        assertThrows(IllegalArgumentException.class,()->GomezTrading.validate(1,"percent",9));
        var restored=new ObjectMapper().readValue("{\"simulation\":{\"phase\":\"holding_btc\",\"btc\":0.25}}",SharedState.class);
        assertEquals("classic",restored.simulation.strategy);assertEquals(0.25,restored.simulation.btc);
    }
}
