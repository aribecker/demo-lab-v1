package ariel.iteration2.weather.simulation;

import java.util.ArrayList;
import java.util.List;

public class SharedState {
    public int schemaVersion = 1;
    public long revision, controlRevision, count, lastPollAt, nextPollAt;
    public boolean running = true;
    public String error = "", updatedAt;
    public Double baseline;
    public Range range;
    public Settings settings = new Settings();
    public Simulation simulation = new Simulation();
    public List<Quote> samples = new ArrayList<>();
    public List<String> commandIds = new ArrayList<>();
    public record Quote(double price, String retrievedAt) {}
    public record Range(double min, double max) {}
    public static class Settings {
        public double capital = 10000, feePercent = 0.1, step = 10;
        public Double minimum, maximum;
        public String strategy = "adaptive";
        public double initialBtc = 0.1, delta = 1;
        public String initialAction = "SELL", deltaUnit = "percent";
        public int pollSeconds = 120;
        public double dipAtr = 1.5, reboundAtr = 0.75, trailAtr = 2, lossAtr = 3, minimumMovePercent = 0.2;
    }
    public static class Simulation {
        // Legacy documents have no strategy field: never change an existing run on deployment.
        public String strategy = "classic";
        public double dipAtr = 1.5, reboundAtr = 0.75, trailAtr = 2, lossAtr = 3, minimumMovePercent = 0.2;
        public Tracking tracking = new Tracking();
        public Gomez gomez = new Gomez();
        public String startedAt;
        public long readingCount;
        public String phase = "inactive";
        public double capital, feePercent, usdt, btc, feesBtc, feesUsdt, feesEquivalent;
        public long tradeCount, lastSequence;
        public Double previousPrice;
        public List<Trade> trades = new ArrayList<>();
    }
    public static class Gomez {
        public double delta = 1;
        public String deltaUnit = "percent", nextAction = "SELL";
        public int pollSeconds = 120;
        public Double initialBtcEquivalent, lastFillPrice, targetPrice;
        public double cycleStartBtc, lastCycleGainBtc;
        public long completedCycles;
        public boolean pendingSell, stopAfterCycle;
        public String decision = "Waiting for the first fresh quote.";
    }
    public static class Candle {
        public long minute;
        public double open, high, low, close;
        public Candle() {}
        public Candle(long minute, double price) { this.minute=minute; open=high=low=close=price; }
    }
    public static class Tracking {
        public Candle currentCandle;
        public int completedCandles, trueRangeCount;
        public double trueRangeSum;
        public Double previousClose, atr, emaFast, emaSlow;
        public Double cycleHigh, dipTrigger, dipLow, reboundDistance, buyTrigger;
        public Double entryPrice, peakPrice, hardStop, trailingStop, effectiveStop, breakEven;
        public boolean dipArmed, trendAllowed, ready;
        public String decision = "Waiting for a fresh quote and indicator warmup.";
    }
    public record Trade(long id, String side, double price, String retrievedAt, double spent,
        double received, double fee, String spentAsset, String receivedAsset, String feeAsset,
        double feeEquivalent, String reason) {}
}

