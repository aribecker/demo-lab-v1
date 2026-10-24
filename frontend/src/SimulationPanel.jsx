import React, { useEffect, useId, useState } from 'react';

const usdt = value => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })} USDT`;
const btc = value => `${value.toFixed(8)} BTC`;
const assetAmount = (value, asset) => asset === 'BTC' ? btc(value) : usdt(value);

function RunMetrics({ metrics }) {
  const [elapsed, setElapsed] = useState(metrics.elapsedSeconds);
  useEffect(() => {
    setElapsed(metrics.elapsedSeconds);
    if (metrics.elapsedSeconds == null) return;
    const received = Date.now();
    const timer = setInterval(() => setElapsed(metrics.elapsedSeconds + Math.floor((Date.now() - received) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [metrics]);
  const duration = elapsed == null ? '—' : `${Math.floor(elapsed / 86400)}d ${String(Math.floor(elapsed / 3600) % 24).padStart(2, '0')}:${String(Math.floor(elapsed / 60) % 60).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  return <dl className="simulation__summary" aria-label="Simulation run metrics">
    <div><dt>Rate readings · since Start / Reset</dt><dd data-testid="run-readings">{metrics.readingCount ?? '—'}</dd></div>
    <div><dt>Simulation started · Buenos Aires</dt><dd>{metrics.startedAt ? new Date(metrics.startedAt).toLocaleString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Available after Start / Reset'}</dd></div>
    <div><dt>Elapsed since Start / Reset · includes pauses</dt><dd data-testid="run-elapsed">{duration}</dd></div>
  </dl>;
}

function LimitInput({ label, value, setValue, step, onCommit }) {
  const id = useId();
  const adjust = direction => {
    const next = String(Number((Number(value || 0) + direction * step).toFixed(2)));
    setValue(next); onCommit?.(next);
  };
  return <div className="simulation__field"><label htmlFor={id}>{label}</label><span className="simulation__limit-controls">
    <button className="button" type="button" aria-label={`Decrease ${label}`} disabled={!Number.isFinite(step) || step <= 0} onClick={() => adjust(-1)}>−</button>
    <input className="field" id={id} type="number" min="0.01" step={Number.isFinite(step) && step > 0 ? step : 10} placeholder="Auto on first quote" value={value} onChange={e => setValue(e.target.value)} onBlur={e => onCommit?.(e.target.value)} />
    <button className="button" type="button" aria-label={`Increase ${label}`} disabled={!Number.isFinite(step) || step <= 0} onClick={() => adjust(1)}>+</button>
  </span></div>;
}

export default function SimulationPanel({ simulation: s, settings, latest, start, valid, limitsValid, autoLimits, shared, onCommit, runMetrics }) {
  const { capital, setCapital, fee, setFee, minimum, setMinimum, maximum, setMaximum, step, setStep } = settings;
  const equity = s.usdt + s.btc * (latest?.price ?? 0);
  const started = s.phase !== 'inactive';
  const funded = started;
  const mode = !started ? 'Ready to start' : !limitsValid ? 'Invalid limits — orders suspended'
    : s.phase === 'holding_btc' ? 'Holding BTC · waiting for an upward sell crossing'
      : s.previousPrice === null ? 'Holding USDT · waiting for the first reference quote' : 'Holding USDT · waiting for a downward buy crossing';
  return <aside className="panel simulation__panel" aria-labelledby="simulation-title">
    <p className="text__eyebrow">VIRTUAL FUNDS · NO REAL ORDERS</p><h2 id="simulation-title">Trading simulator</h2>
    <p className="bitcoin__note">Start holding USDT. Buy only on a downward crossing below the minimum; then sell on an upward crossing above the maximum.</p>
    {shared && <RunMetrics metrics={runMetrics ?? { readingCount: null, startedAt: null, elapsedSeconds: null }} />}
    <div className="simulation__balances">
      <div><span>USDT balance</span><strong data-testid="usdt-balance">{usdt(s.usdt)}</strong></div>
      <div><span>Bitcoin balance</span><strong data-testid="btc-balance">{btc(s.btc)}</strong></div>
      <div><span>Total commissions · execution equivalent</span><strong data-testid="total-fees">{usdt(s.feesEquivalent)}</strong></div>
    </div>
    <dl className="simulation__summary"><div><dt>Fees deducted in BTC</dt><dd>{btc(s.feesBtc)}</dd></div><div><dt>Fees deducted in USDT</dt><dd>{usdt(s.feesUsdt)}</dd></div>
      <div><dt>Portfolio value · latest quote</dt><dd>{usdt(equity)}</dd></div><div><dt>P/L after fees</dt><dd className={equity - s.capital < 0 && funded ? 'text text--negative' : 'text text--positive'}>{usdt(funded ? equity - s.capital : 0)}</dd></div>
      <div><dt>Simulated trades</dt><dd data-testid="trade-count">{s.tradeCount}</dd></div></dl>
    <p className="simulation__state" aria-live="polite">{mode}</p>
    <fieldset className="simulation__settings"><legend>Live thresholds · USDT per BTC</legend>
      <LimitInput label="Buy minimum" value={minimum} setValue={setMinimum} step={Number(step)} onCommit={onCommit && (value => onCommit('minimum', value))} />
      <LimitInput label="Sell maximum" value={maximum} setValue={setMaximum} step={Number(step)} onCommit={onCommit && (value => onCommit('maximum', value))} />
      <label className="simulation__field">Adjustment step · USDT<input className="field" type="number" min="0.01" step="1" value={step} onChange={e => setStep(e.target.value)} onBlur={e => onCommit?.('step',e.target.value)} /></label>
      {!limitsValid && !autoLimits && <p className="text text--negative" role="alert">Enter positive thresholds with minimum below maximum. {shared ? 'Invalid drafts are not saved; the server keeps the saved limits.' : 'Orders are suspended.'}</p>}
      {(!Number.isFinite(Number(step)) || Number(step) <= 0) && <p className="text text--negative" role="alert">Use a positive adjustment step to enable the +/− buttons.</p>}
      <p className="bitcoin__note">Changes apply to the next quote; moving a line alone never executes a trade.</p>
    </fieldset>
    <fieldset className="simulation__settings"><legend>Next Start / Reset</legend>
      <label className="simulation__field">Initial capital · USDT<input className="field" type="number" min="0.01" max="1000000000000" step="100" value={capital} onChange={e => setCapital(e.target.value)} onBlur={e => onCommit?.('capital',e.target.value)} /></label>
      <label className="simulation__field">Trading fee · % per order<input className="field" type="number" min="0" max="5" step="0.01" value={fee} onChange={e => setFee(e.target.value)} onBlur={e => onCommit?.('fee',e.target.value)} /></label>
      {!valid && <p className="text text--negative" role="alert">Use capital above zero (up to 1 trillion USDT) and a fee from 0% to 5%.</p>}
      <button className="button button--primary simulation__start" type="button" disabled={!valid || (!limitsValid && !autoLimits)} onClick={start}>{started ? 'Reset simulation' : 'Start simulation'}</button>
      <p className="bitcoin__note">Reset restores the configured USDT, clears BTC, fees, trades and chart, and waits. The first quote sets a reference; a later downward crossing buys.</p>
      {started && <p className="bitcoin__note">Active run: {usdt(s.capital)} initial capital · {s.feePercent}% fee. Capital/fee edits take effect only after Reset.</p>}
    </fieldset>
    <details className="bitcoin__history"><summary>Simulated trades · latest 100</summary><div className="simulation__ledger"><table><caption>Fictitious executions at sampled prices</caption><thead><tr><th scope="col">Order / price</th><th scope="col">Spent → received</th><th scope="col">Fee deducted</th></tr></thead><tbody>
      {s.trades.slice().reverse().map(t => <tr key={t.id}><td>#{t.id} {t.side}<br />{usdt(t.price)}<br /><small>{new Date(t.retrievedAt).toLocaleTimeString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' })} · {t.reason}</small></td><td>{assetAmount(t.spent, t.spentAsset)}<br />→ {assetAmount(t.received, t.receivedAsset)}</td><td>{assetAmount(t.fee, t.feeAsset)}</td></tr>)}
    </tbody></table></div></details>
    <p className="bitcoin__note">Fee estimate: <a href="https://www.binance.com/en/fee/trading" target="_blank" rel="noreferrer">Binance standard spot 0.1%</a>, configurable. <a href="https://www.binance.com/en/support/faq/detail/e85d6e703b874674840122196b89780a" target="_blank" rel="noreferrer">Fees are deducted from the received asset</a>. No BNB/VIP discounts, pair promotions, spread, slippage or lot-size rules are modeled. Ten-second sampling can miss crossings. {shared ? 'Shared state is saved on the server; leaving the page changes nothing.' : 'Session data resets when you leave.'}</p>
  </aside>;
}

