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
    }
    public static class Simulation {
        public String phase = "inactive";
        public double capital, feePercent, usdt, btc, feesBtc, feesUsdt, feesEquivalent;
        public long tradeCount, lastSequence;
        public Double previousPrice;
        public List<Trade> trades = new ArrayList<>();
    }
    public record Trade(long id, String side, double price, String retrievedAt, double spent,
        double received, double fee, String spentAsset, String receivedAsset, String feeAsset,
        double feeEquivalent, String reason) {}
}
