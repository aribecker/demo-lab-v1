package ariel.iteration2.weather.simulation;

import ariel.iteration2.weather.simulation.SharedState.*;
import java.time.Instant;

public final class SimulationEngine {
    private SimulationEngine() {}
    public static void validate(Settings s) {
        if (!Double.isFinite(s.capital) || s.capital <= 0 || s.capital > 1e12
            || !Double.isFinite(s.feePercent) || s.feePercent < 0 || s.feePercent > 5
            || !Double.isFinite(s.step) || s.step <= 0 || s.step > 1e9) throw new IllegalArgumentException("Invalid capital, fee or step.");
        if (s.minimum == null && s.maximum == null) return;
        if (s.minimum == null || s.maximum == null || !Double.isFinite(s.minimum) || !Double.isFinite(s.maximum)
            || s.minimum <= 0 || s.maximum <= s.minimum || s.maximum > 1e12) throw new IllegalArgumentException("Minimum must be positive and below maximum.");
    }
    public static void reset(SharedState s) {
        validate(s.settings);
        s.simulation = new Simulation();
        s.simulation.phase = "holding_usdt";
        s.simulation.capital = s.settings.capital;
        s.simulation.feePercent = s.settings.feePercent;
        s.simulation.usdt = s.settings.capital;
        s.samples.clear(); s.count = 0; s.baseline = null; s.range = null;
        s.running = true; s.error = ""; s.lastPollAt = 0; s.nextPollAt = 0;
    }
    public static void quote(SharedState s, double price, Instant now) {
        if (!s.running) return;
        if (!Double.isFinite(price) || price <= 0 || price > 1e12) throw new IllegalArgumentException("Invalid market quote.");
        var q = new Quote(price, now.toString());
        s.samples.add(q); if (s.samples.size() > 180) s.samples.remove(0);
        s.count++; s.baseline = s.baseline == null ? price : s.baseline;
        s.range = s.range == null ? new Range(price, price) : new Range(Math.min(price,s.range.min()), Math.max(price,s.range.max()));
        if (s.settings.minimum == null && s.settings.maximum == null) {
            s.settings.minimum = Math.round(price * 0.995 * 100) / 100.0;
            s.settings.maximum = Math.round(price * 1.005 * 100) / 100.0;
        }
        validate(s.settings);
        var sim = s.simulation;
        if (!sim.phase.equals("inactive")) {
            if (sim.startedAt != null) sim.readingCount++;
            Double previous = sim.previousPrice;
            sim.previousPrice = price; sim.lastSequence = s.count;
            if (previous != null && sim.phase.equals("holding_usdt") && previous >= s.settings.minimum && price < s.settings.minimum)
                trade(s, q, true);
            else if (previous != null && sim.phase.equals("holding_btc") && previous <= s.settings.maximum && price > s.settings.maximum)
                trade(s, q, false);
        }
        s.lastPollAt = now.toEpochMilli(); s.error = "";
    }
    private static void trade(SharedState s, Quote q, boolean buy) {
        var sim = s.simulation;
        double spent = buy ? sim.usdt : sim.btc;
        double gross = buy ? spent / q.price() : spent * q.price();
        double fee = gross * sim.feePercent / 100;
        double net = gross - fee, equivalent = buy ? fee * q.price() : fee;
        sim.tradeCount++;
        sim.trades.add(new Trade(sim.tradeCount, buy ? "BUY" : "SELL", q.price(), q.retrievedAt(), spent, net, fee,
            buy ? "USDT" : "BTC", buy ? "BTC" : "USDT", buy ? "BTC" : "USDT", equivalent,
            buy ? "Crossed below minimum" : "Crossed above maximum"));
        if (sim.trades.size() > 100) sim.trades.remove(0);
        sim.usdt = buy ? 0 : net; sim.btc = buy ? net : 0;
        sim.feesBtc += buy ? fee : 0; sim.feesUsdt += buy ? 0 : fee; sim.feesEquivalent += equivalent;
        sim.phase = buy ? "holding_btc" : "holding_usdt";
    }
}

