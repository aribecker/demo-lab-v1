package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AdaptiveTradingTest {
    final Instant start=Instant.parse("2026-10-24T12:00:00Z");
    long second;
    SharedState ready() {
        SharedState s=new SharedState();s.settings.strategy="adaptive";SimulationEngine.reset(s);
        for(int i=0;i<=126;i++) {second=i*10;SimulationEngine.quote(s,100,start.plusSeconds(second));}
        assertTrue(s.simulation.tracking.ready);assertEquals(0,s.simulation.tradeCount);
        return s;
    }
    void quote(SharedState s,double price) { SimulationEngine.quote(s,price,start.plusSeconds(++second)); }
    SharedState bought() {
        SharedState s=ready();quote(s,99.7);quote(s,99.95);
        assertEquals(1,s.simulation.tradeCount);assertEquals("holding_btc",s.simulation.phase);return s;
    }
    @Test void firstReferenceAndWarmupCannotTrade() {
        SharedState s=new SharedState();SimulationEngine.reset(s);
        SimulationEngine.quote(s,100,start);SimulationEngine.quote(s,90,start.plusSeconds(10));
        SimulationEngine.quote(s,110,start.plusSeconds(20));
        assertFalse(s.simulation.tracking.ready);assertEquals(0,s.simulation.tradeCount);
        assertEquals(0,s.simulation.tracking.completedCandles);
    }
    @Test void dipTracksNewLowsAndNeedsRecoveryAndTrend() {
        SharedState s=ready();quote(s,99.7);assertTrue(s.simulation.tracking.dipArmed);
        quote(s,99);assertEquals(99,s.simulation.tracking.dipLow);
        quote(s,99.1);assertEquals(0,s.simulation.tradeCount);
        s.simulation.tracking.emaFast=98.;s.simulation.tracking.emaSlow=100.;
        quote(s,99.3);assertEquals(0,s.simulation.tradeCount);
        assertTrue(s.simulation.tracking.decision.contains("blocks entry"));
        s.simulation.tracking.emaFast=100.;quote(s,99.3);
        assertEquals(1,s.simulation.tradeCount);assertTrue(s.simulation.trades.get(0).reason().contains("Confirmed rebound"));
    }
    @Test void feesBreakEvenAndTrailingExitConserveValue() {
        SharedState s=bought();double quantity=10000/99.95*.999;
        assertEquals(quantity,s.simulation.btc,1e-10);
        assertEquals(10,s.simulation.feesEquivalent,1e-8);
        assertEquals(99.95/(.999*.999),s.simulation.tracking.breakEven,1e-10);
        quote(s,101);double stop=s.simulation.tracking.trailingStop;
        assertEquals(101*.998,stop,1e-10);
        quote(s,100.9);assertEquals(stop,s.simulation.tracking.trailingStop);
        quote(s,100.7);assertEquals(2,s.simulation.tradeCount);
        assertEquals(quantity*100.7*.999,s.simulation.usdt,1e-8);
        assertEquals(0,s.simulation.btc);assertTrue(s.simulation.trades.get(1).reason().contains("Trailing stop"));
        quote(s,100.8);assertEquals(2,s.simulation.tradeCount);assertFalse(s.simulation.tracking.dipArmed);
    }
    @Test void higherVolatilityNeverLoosensTrailingStop() {
        SharedState s=bought();quote(s,102);double stop=s.simulation.tracking.trailingStop;
        s.simulation.tracking.atr=2.;quote(s,102.1);
        assertEquals(stop,s.simulation.tracking.trailingStop);
    }
    @Test void hardStopSellsAtSampledPriceEvenAtALoss() {
        SharedState s=bought();quote(s,95);
        assertEquals(2,s.simulation.tradeCount);assertTrue(s.simulation.usdt<10000);
        assertEquals(95,s.simulation.trades.get(1).price());
        assertTrue(s.simulation.trades.get(1).reason().startsWith("Hard stop"));
    }
    @Test void gapsRestartEntryWarmupButProtectExistingPosition() {
        SharedState s=ready();quote(s,99.7);
        second+=40;quote(s,100);
        assertEquals(0,s.simulation.tracking.completedCandles);assertFalse(s.simulation.tracking.dipArmed);
        assertEquals(0,s.simulation.tradeCount);
        s=bought();Double stop=s.simulation.tracking.hardStop;
        second+=40;quote(s,99.9);
        assertFalse(s.simulation.tracking.ready);assertEquals(stop,s.simulation.tracking.hardStop);
        quote(s,95);assertEquals(2,s.simulation.tradeCount);
    }
    @Test void pausedAndDuplicateQuotesNeverTrade() {
        SharedState s=bought();long count=s.count;
        SimulationEngine.quote(s,95,start.plusSeconds(second));
        assertEquals(count,s.count);assertEquals(1,s.simulation.tradeCount);
        s.running=false;quote(s,95);assertEquals(1,s.simulation.tradeCount);
    }
    @Test void atrUsesCompletedCandleTrueRangesAndWilderSmoothing() {
        var sim=new SharedState.Simulation();sim.phase="holding_usdt";
        for(int m=0;m<15;m++) {
            AdaptiveTrading.evaluate(sim,100,start.plusSeconds(m*60));
            AdaptiveTrading.evaluate(sim,102,start.plusSeconds(m*60+10));
            AdaptiveTrading.evaluate(sim,99,start.plusSeconds(m*60+20));
            AdaptiveTrading.evaluate(sim,100,start.plusSeconds(m*60+50));
        }
        assertNull(sim.tracking.atr);
        AdaptiveTrading.evaluate(sim,100,start.plusSeconds(900));
        assertEquals(3,sim.tracking.atr,1e-10);assertEquals(15,sim.tracking.completedCandles);
        AdaptiveTrading.evaluate(sim,106,start.plusSeconds(910));
        assertEquals(3,sim.tracking.atr,1e-10); // Incomplete candle excluded.
        AdaptiveTrading.evaluate(sim,100,start.plusSeconds(960));
        assertEquals((3.*13+6)/14,sim.tracking.atr,1e-10);
    }
    @Test void jsonRestartPreservesTrackingAndOldDocumentsKeepClassicRun() throws Exception {
        ObjectMapper mapper=new ObjectMapper();SharedState s=bought();quote(s,101);
        SharedState restored=mapper.readValue(mapper.writeValueAsString(s),SharedState.class);
        assertEquals(s.simulation.tracking.trailingStop,restored.simulation.tracking.trailingStop);
        quote(restored,100.7);assertEquals(2,restored.simulation.tradeCount);
        var legacy=mapper.readValue("{\"simulation\":{\"phase\":\"holding_btc\",\"btc\":0.1}}",SharedState.class);
        assertEquals("classic",legacy.simulation.strategy);assertEquals(.1,legacy.simulation.btc);
        assertEquals("adaptive",legacy.settings.strategy); // Next run only.
    }
    @Test void configIsCapturedAtResetAndValidated() {
        SharedState s=bought();s.settings.trailAtr=10;s.settings.strategy="classic";
        assertEquals(2,s.simulation.trailAtr);assertEquals("adaptive",s.simulation.strategy);
        SimulationEngine.reset(s);assertEquals("classic",s.simulation.strategy);assertEquals(10,s.simulation.trailAtr);
        s.settings.strategy="unknown";assertThrows(IllegalArgumentException.class,()->SimulationEngine.validate(s.settings));
        s.settings.strategy="adaptive";s.settings.reboundAtr=Double.NaN;
        assertThrows(IllegalArgumentException.class,()->SimulationEngine.validate(s.settings));
        s.settings.reboundAtr=.75;s.settings.minimumMovePercent=0;
        assertThrows(IllegalArgumentException.class,()->SimulationEngine.validate(s.settings));
    }
}
