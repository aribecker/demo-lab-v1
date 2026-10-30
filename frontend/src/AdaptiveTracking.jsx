import React from 'react';

const number = value => value == null || !Number.isFinite(value) ? 'Waiting' : value.toLocaleString('en-US', { maximumFractionDigits: 2 });
const money = value => value == null ? 'Waiting' : `${number(value)} USDT / BTC`;
const strategyName = value => value === 'adaptive' ? 'Adaptive rebound + trailing exit' : 'Classic minimum / maximum';
export const adaptiveDefaults = { strategy: 'adaptive', dipAtr: '1.5', reboundAtr: '0.75', trailAtr: '2', lossAtr: '3', minimumMovePercent: '0.2' };
export const adaptiveFields = [
  ['dipAtr', 'Dip size · ATR multiple', 'Arm a dip after the price falls this many ATR from its cycle high.'],
  ['reboundAtr', 'Rebound size · ATR multiple', 'After a dip, require this much recovery from its lowest sampled price.'],
  ['trailAtr', 'Trailing distance · ATR multiple', 'Follow the peak with a sell level that can only rise.'],
  ['lossAtr', 'Loss protection · ATR multiple', 'Set a hard stop once at purchase, below the entry price.'],
  ['minimumMovePercent', 'Minimum movement · %', 'A percentage floor prevents tiny price noise from triggering orders.'],
];

export function AdaptiveSettings({ draft, edit, commit, pending }) {
  return <fieldset className="simulation__settings"><legend>Strategy for the next Start / Reset</legend>
    <label className="simulation__field">Next strategy<select className="field simulation__select" value={draft.strategy} disabled={pending}
      onChange={event => { edit('strategy')(event.target.value); commit('strategy', event.target.value); }}>
      <option value="adaptive">Adaptive rebound + trailing exit</option><option value="classic">Classic minimum / maximum</option>
      <option value="gomez">Gómez · Bitcoin sell / rebuy cycles</option>
    </select></label>
    <p className="bitcoin__note">Saving these settings does not change the active run. Start / Reset applies them and clears virtual balances and history.</p>
    {draft.strategy === 'adaptive' && adaptiveFields.map(([key, label, explanation]) => <label className="simulation__field" key={key}>{label}
      <input className="field" type="number" min={key === 'minimumMovePercent' ? '0.01' : '0.1'} max={key === 'minimumMovePercent' ? '10' : '20'} step="0.05"
        value={draft[key]} onChange={event => edit(key)(event.target.value)} onBlur={event => commit(key, event.target.value)} />
      <span className="simulation__explanation">{explanation}</span>
      {(!String(draft[key]).trim() || !Number.isFinite(Number(draft[key])) || Number(draft[key]) < (key === 'minimumMovePercent' ? 0.01 : 0.1) || Number(draft[key]) > (key === 'minimumMovePercent' ? 10 : 20)) && <span className="simulation__explanation" role="alert">Use {key === 'minimumMovePercent' ? '0.01–10%' : '0.1–20 ATR'}. Invalid drafts are not applied.</span>}
    </label>)}
  </fieldset>;
}

function Metric({ title, value, explanation }) {
  return <div className="simulation__metric"><dt>{title}</dt><dd>{value}</dd><p>{explanation}</p></div>;
}

export default function AdaptiveTracking({ data }) {
  const s=data.simulation, t=s.tracking ?? {}, latest=data.samples.at(-1), price=latest?.price;
  const adaptive=s.strategy === 'adaptive';
  const stale=!data.lastPollAt || Date.now()-data.lastPollAt>30000;
  const usable=data.running && !stale && !data.error;
  const cash=s.phase === 'holding_usdt';
  const count=t.completedCandles ?? 0;
  const remaining = target => target == null || price == null ? 'Waiting' : money(Math.max(0, target-price));
  const exitRemaining=t.effectiveStop == null || price == null ? null : Math.max(0, price-t.effectiveStop);
  const drawdown=t.peakPrice && price ? (t.peakPrice-price)/t.peakPrice*100 : null;
  const fee=s.feePercent/100;
  return <section className="panel simulation__tracking" aria-labelledby="tracking-title">
    <p className="text__eyebrow">FOLLOW THE DECISION · SERVER SNAPSHOT</p>
    <h2 id="tracking-title">Why does the simulator buy, sell or wait?</h2>
    <p><strong>Active strategy:</strong> {strategyName(s.strategy)} · <strong>Next Start / Reset:</strong> {strategyName(data.settings.strategy ?? 'adaptive')}</p>
    <p className="simulation__state" role="status">{!data.running ? 'Paused: no quotes or orders are processed.' : stale ? 'Stale snapshot: waiting for a fresh server quote. These are saved values, not a current signal.' : data.error ? `Quote provider error: ${data.error}` : 'Fresh server quote. The backend is the only trading engine.'}</p>
    <p className="bitcoin__note">Quote: {money(price)} · {latest?.retrievedAt ? new Date(latest.retrievedAt).toLocaleString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Waiting'} · Buenos Aires</p>
    {!adaptive ? <p className="bitcoin__note">This run keeps the original crossing rules. Choose Adaptive in the next-run settings, then explicitly Start / Reset to try the new strategy. Chart minimum/maximum lines belong to the classic strategy.</p> : <>
      <ol className="simulation__steps" aria-label="Adaptive decision steps">
        <li><strong>1. Observe</strong><span>{Math.min(count,21)} / 21 completed minutes · {t.ready ? 'Indicators ready' : 'Warming up'}</span></li>
        <li><strong>2. Find a dip</strong><span>{t.dipArmed ? 'Dip detected; following its low' : 'Waiting for the dynamic dip level'}</span></li>
        <li><strong>3. Confirm a rebound</strong><span>Rebound + trend filter: {t.ready ? t.trendAllowed ? 'Trend passes' : 'Trend blocks entry' : 'Waiting for indicators'}</span></li>
        <li><strong>4. Follow the peak</strong><span>{cash ? 'After purchase, protective exits become active' : 'Holding BTC; following the peak and exit levels'}</span></li>
      </ol>
      <p className="simulation__decision"><strong>{usable ? 'Latest engine decision' : 'Last saved engine decision'}:</strong> {t.decision ?? 'Waiting for a server decision.'}</p>
      <details className="simulation__lesson" open><summary>Indicators · how the thresholds adapt</summary>
        <progress className="simulation__progress" max="21" value={Math.min(count,21)} aria-label="Indicator warmup" />
        <p className="bitcoin__note">{count} completed sampled candles. Entry needs 21 consecutive one-minute candles, about 22 minutes after Reset. Only successful sampled quotes form OHLC; intraminute extremes may be missed. A data gap over 30 seconds restarts warmup. Existing exits remain active.</p>
        <dl className="simulation__metrics">
          <Metric title="ATR14 · volatility" value={money(t.atr)} explanation="Wilder average of 14 true ranges from completed minute candles. It measures movement, not price direction." />
          <Metric title="ATR as % of price" value={t.atr == null || !price ? 'Waiting' : `${number(t.atr/price*100)}%`} explanation="The same ATR expressed relative to the latest BTC price." />
          <Metric title="Fast trend · EMA9" value={money(t.emaFast)} explanation="Exponential moving average of completed minute closes; reacts faster." />
          <Metric title="Slow trend · EMA21" value={money(t.emaSlow)} explanation="Slower moving average. New buys require EMA9 ≥ EMA21 after warmup." />
        </dl>
      </details>
      <details className="simulation__lesson" open><summary>Entry · wait for a dip, then a recovery</summary>
        <p className="bitcoin__note">Active settings: dip {s.dipAtr} × ATR; rebound {s.reboundAtr} × ATR; minimum movement {s.minimumMovePercent}%. Each distance is the larger of its ATR multiple and percentage floor, capped at 99% of the reference price.</p>
        <dl className="simulation__metrics">
          <Metric title="Cycle high" value={money(t.cycleHigh)} explanation="Highest sampled price while waiting for a new dip." />
          <Metric title="Dip trigger" value={money(t.dipTrigger)} explanation="Cycle high − max(dip × ATR, percentage floor). Price must reach or fall below this level." />
          <Metric title="Lowest price in the dip" value={money(t.dipLow)} explanation="Moves down if the sampled price makes a new low after the dip is armed." />
          <Metric title="Required rebound distance" value={money(t.reboundDistance)} explanation="max(rebound × ATR, dip low × minimum movement %)." />
          <Metric title="Buy trigger" value={money(t.buyTrigger)} explanation="Dip low + required rebound distance. Buy only with the trend filter passing." />
          <Metric title="Remaining rise to buy trigger" value={remaining(t.buyTrigger)} explanation="max(0, buy trigger − current price). Zero alone does not mean a buy: warmup and trend must also pass." />
        </dl>
      </details>
      <details className="simulation__lesson" open><summary>Exit · follow the peak and limit losses</summary>
        <p className="bitcoin__note">Active settings: trailing {s.trailAtr} × ATR; loss protection {s.lossAtr} × ATR. Exits use the next sampled price; a gap can fill below the stop. Either stop can realize a loss.</p>
        <dl className="simulation__metrics">
          <Metric title="Entry price" value={money(t.entryPrice)} explanation="Price actually sampled at the last adaptive purchase." />
          <Metric title="Peak since purchase" value={money(t.peakPrice)} explanation="Highest sampled price since entry; follows a continuing rise." />
          <Metric title="Hard stop" value={money(t.hardStop)} explanation="Entry − max(loss × ATR at entry, percentage floor). Fixed until the position closes." />
          <Metric title="Trailing stop" value={money(t.trailingStop)} explanation="Peak − max(trailing × ATR, percentage floor). Ratchets upward and never loosens." />
          <Metric title="Effective exit level" value={money(t.effectiveStop)} explanation="Higher of hard stop and trailing stop. Sell when sampled price reaches or falls below it." />
          <Metric title="Room before exit" value={money(exitRemaining)} explanation="max(0, current price − effective exit). This is a distance, not guaranteed execution value." />
          <Metric title="Retracement from peak" value={drawdown == null ? 'Waiting' : `${number(drawdown)}%`} explanation="(Peak − current price) ÷ peak × 100." />
          <Metric title="Fee-adjusted break-even" value={money(t.breakEven)} explanation="Entry ÷ (1 − fee)². Sale price needed to recover the cash spent, with both received-asset commissions." />
        </dl>
      </details>
      <p className="bitcoin__note">Classic minimum/maximum chart lines are reference lines only in adaptive mode. Dynamic decision levels are the server values above.</p>
    </>}
    <p className="bitcoin__note">Active commission: {s.feePercent}% per order · estimated round-trip cost at an unchanged price: {number((1-(1-fee)**2)*100)}%. Balances and net P/L below include simulated fees. Spread, slippage and exchange lot sizes are not modeled. Parameters are experimental; no profitability claim.</p>
  </section>;
}
