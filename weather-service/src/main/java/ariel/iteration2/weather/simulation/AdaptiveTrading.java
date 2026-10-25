package ariel.iteration2.weather.simulation;

import ariel.iteration2.weather.simulation.SharedState.*;
import java.time.Instant;

/** Decisions use only already observed quotes and completed sampled-minute candles. */
public final class AdaptiveTrading {
    private AdaptiveTrading() {}
    public static void interrupt(Simulation sim) {
        Tracking old = sim.tracking, fresh = new Tracking();
        fresh.entryPrice=old.entryPrice; fresh.peakPrice=old.peakPrice;
        fresh.hardStop=old.hardStop; fresh.trailingStop=old.trailingStop;
        fresh.effectiveStop=old.effectiveStop; fresh.breakEven=old.breakEven;
        fresh.decision="Data continuity interrupted. Rebuilding indicators; existing protective stops remain active.";
        sim.tracking=fresh;
    }
    public static String evaluate(Simulation sim, double price, Instant now) {
        Tracking t=sim.tracking;
        boolean wasReady=t.ready;
        indicators(t, price, now.getEpochSecond()/60);
        t.trendAllowed=t.emaFast!=null && t.emaSlow!=null && t.emaFast>=t.emaSlow;
        if (sim.phase.equals("holding_btc")) {
            t.peakPrice=t.peakPrice==null?price:Math.max(t.peakPrice,price);
            if (t.ready) {
                double candidate=t.peakPrice-distance(t.peakPrice, sim.trailAtr, sim, t);
                t.trailingStop=t.trailingStop==null?candidate:Math.max(t.trailingStop,candidate);
            }
            t.effectiveStop=max(t.hardStop,t.trailingStop);
            if (t.hardStop!=null && price<=t.hardStop) return "Hard stop: price reached the loss-protection level";
            if (t.trailingStop!=null && price<=t.trailingStop) return "Trailing stop: price retraced from the tracked peak";
            t.decision=t.ready?"Holding BTC: following the peak; waiting for a protective exit.":
                "Rebuilding indicators while holding BTC. Saved protective stops remain active.";
            return null;
        }
        if (!t.ready) {
            t.decision="Warming up: "+t.completedCandles+" / 21 completed one-minute sampled candles. No entry allowed.";
            return null;
        }
        // Never enter on the quote that finishes warmup; establish a fresh cycle reference.
        if (!wasReady || t.cycleHigh==null) {
            t.cycleHigh=price;
            t.dipTrigger=price-distance(price,sim.dipAtr,sim,t);
            t.decision="Indicators ready. Reference set; waiting for a new dip.";
            return null;
        }
        if (!t.dipArmed) {
            t.cycleHigh=Math.max(t.cycleHigh,price);
            t.dipTrigger=t.cycleHigh-distance(t.cycleHigh,sim.dipAtr,sim,t);
            if (price<=t.dipTrigger) { t.dipArmed=true; t.dipLow=price; }
            else { t.decision="Waiting for a dip below the dynamic dip trigger."; return null; }
        }
        t.dipLow=Math.min(t.dipLow,price);
        t.reboundDistance=distance(t.dipLow,sim.reboundAtr,sim,t);
        t.buyTrigger=t.dipLow+t.reboundDistance;
        if (price<t.buyTrigger) t.decision="Dip detected. Following its low; waiting for a confirmed rebound.";
        else if (!t.trendAllowed) t.decision="Rebound reached, but trend filter blocks entry: EMA9 is below EMA21.";
        else return "Confirmed rebound from dip low with EMA9 >= EMA21";
        return null;
    }
    public static void bought(Simulation sim, double price) {
        Tracking t=sim.tracking;
        t.entryPrice=price; t.peakPrice=price;
        t.hardStop=price-distance(price,sim.lossAtr,sim,t);
        t.trailingStop=price-distance(price,sim.trailAtr,sim,t);
        t.effectiveStop=max(t.hardStop,t.trailingStop);
        double fee=sim.feePercent/100;
        t.breakEven=price/((1-fee)*(1-fee));
        t.decision="Bought after confirmed rebound. Tracking the peak and protective exits.";
    }
    public static void sold(Simulation sim, String reason) {
        Tracking t=sim.tracking;
        t.cycleHigh=t.dipTrigger=t.dipLow=t.buyTrigger=t.reboundDistance=null;
        t.entryPrice=t.peakPrice=t.hardStop=t.trailingStop=t.effectiveStop=t.breakEven=null;
        t.dipArmed=false;
        t.decision="Sold. "+reason+". A new dip and rebound are required for re-entry.";
    }
    private static Double max(Double a, Double b) { return a==null?b:b==null?a:Math.max(a,b); }
    private static double distance(double reference,double multiple,Simulation sim,Tracking t) {
        // Cap the distance below100% so extreme ATR values cannot create negative prices.
        return Math.min(reference*0.99,Math.max(multiple*t.atr,reference*sim.minimumMovePercent/100));
    }
    private static void indicators(Tracking t,double price,long minute) {
        Candle c=t.currentCandle;
        if (c==null) { t.currentCandle=new Candle(minute,price); return; }
        if (minute<c.minute) throw new IllegalArgumentException("Quote time cannot move backwards.");
        if (minute==c.minute) { c.high=Math.max(c.high,price);c.low=Math.min(c.low,price);c.close=price;return; }
        // Service/engine invalidates discontinuities before this method; no synthetic candles.
        t.completedCandles++;
        t.emaFast=t.emaFast==null?c.close:t.emaFast+(c.close-t.emaFast)*2/10;
        t.emaSlow=t.emaSlow==null?c.close:t.emaSlow+(c.close-t.emaSlow)*2/22;
        if (t.previousClose!=null) {
            double tr=Math.max(c.high-c.low,Math.max(Math.abs(c.high-t.previousClose),Math.abs(c.low-t.previousClose)));
            if (t.trueRangeCount<14) {
                t.trueRangeSum+=tr;t.trueRangeCount++;
                if(t.trueRangeCount==14) t.atr=t.trueRangeSum/14;
            } else t.atr=(t.atr*13+tr)/14;
        }
        t.previousClose=c.close;
        t.ready=t.completedCandles>=21 && t.atr!=null;
        t.currentCandle=new Candle(minute,price);
    }
}
