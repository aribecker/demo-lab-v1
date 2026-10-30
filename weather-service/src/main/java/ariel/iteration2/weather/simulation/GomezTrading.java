package ariel.iteration2.weather.simulation;

import ariel.iteration2.weather.simulation.SharedState.*;

/** Deterministic, virtual SELL -> BUY cycles. Never calls an exchange. */
public final class GomezTrading {
    private GomezTrading() {}
    public static void validate(double delta, String unit, int seconds) {
        if (!java.util.Set.of("percent", "usdt").contains(unit == null ? "" : unit)
            || !Double.isFinite(delta) || delta <= 0 || delta > 1e9
            || ("percent".equals(unit) && delta >= 100) || seconds < 10 || seconds > 3600)
            throw new IllegalArgumentException("Use a positive delta (<100 for percent) and an integer polling interval from 10 to 3600 seconds.");
    }
    public static void start(SharedState state) {
        var s = state.simulation; var settings = state.settings; var g = s.gomez;
        g.delta = settings.delta; g.deltaUnit = settings.deltaUnit; g.pollSeconds = settings.pollSeconds;
        g.nextAction = settings.initialAction;
        if (g.nextAction.equals("SELL")) {
            s.btc = settings.initialBtc; s.usdt = 0; s.phase = "holding_btc";
            // USDT mark-to-market baseline is established only by the first fresh quote.
            s.capital = 0; g.initialBtcEquivalent = settings.initialBtc;
        }
        updateTarget(s);
    }
    public static void updateTarget(Simulation s) {
        var g = s.gomez;
        if (g.lastFillPrice == null) {
            g.targetPrice = null;
            g.decision = "First " + g.nextAction + " will execute at the next fresh successful quote.";
            return;
        }
        double distance = g.deltaUnit.equals("percent") ? g.lastFillPrice * g.delta / 100 : g.delta;
        g.targetPrice = g.lastFillPrice + (g.nextAction.equals("BUY") ? -distance : distance);
        g.decision = g.targetPrice <= 0 ? "Rebuy target is not positive. Reduce the delta and relaunch; funds are retained."
            : "Waiting to " + g.nextAction + (g.nextAction.equals("BUY") ? " at or below " : " at or above ") + g.targetPrice + " USDT per BTC.";
    }
    public static boolean ready(Simulation s, double price) {
        var g = s.gomez;
        if (g.initialBtcEquivalent == null) g.initialBtcEquivalent = s.usdt / price + s.btc;
        if (g.lastFillPrice == null && s.capital == 0) s.capital = s.usdt + s.btc * price;
        updateTarget(s);
        return g.targetPrice == null || g.targetPrice > 0
            && (g.nextAction.equals("BUY") ? price <= g.targetPrice : price >= g.targetPrice);
    }
    public static void filled(SharedState state, double price, boolean buy) {
        var s = state.simulation; var g = s.gomez;
        g.lastFillPrice = price;
        if (buy && g.pendingSell) {
            g.lastCycleGainBtc = s.btc - g.cycleStartBtc;
            g.completedCycles++; g.pendingSell = false;
            if (g.stopAfterCycle) { state.running = false; g.stopAfterCycle = false; }
        }
        g.nextAction = buy ? "SELL" : "BUY";
        updateTarget(s);
        if (!state.running) g.decision = "Cycle completed. Paused holding BTC; balances and next SELL target are saved.";
    }
}
