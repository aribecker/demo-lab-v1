import React, { useId } from 'react';

const usdt = value => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })} USDT`;
const btc = value => `${value.toFixed(8)} BTC`;
const assetAmount = (value, asset) => asset === 'BTC' ? btc(value) : usdt(value);

function LimitInput({ label, value, setValue, step }) {
  const id = useId();
  const adjust = direction => setValue(String(Number((Number(value || 0) + direction * step).toFixed(2))));
  return <div className="simulation-field"><label htmlFor={id}>{label}</label><span className="limit-controls">
    <button type="button" aria-label={`Decrease ${label}`} disabled={!Number.isFinite(step) || step <= 0} onClick={() => adjust(-1)}>−</button>
    <input id={id} type="number" min="0.01" step={Number.isFinite(step) && step > 0 ? step : 10} placeholder="Auto on first quote" value={value} onChange={e => setValue(e.target.value)} />
    <button type="button" aria-label={`Increase ${label}`} disabled={!Number.isFinite(step) || step <= 0} onClick={() => adjust(1)}>+</button>
  </span></div>;
}

export default function SimulationPanel({ simulation: s, settings, latest, start, valid, limitsValid, autoLimits }) {
  const { capital, setCapital, fee, setFee, minimum, setMinimum, maximum, setMaximum, step, setStep } = settings;
  const equity = s.usdt + s.btc * (latest?.price ?? 0);
  const started = s.phase !== 'inactive';
  const funded = started;
  const mode = !started ? 'Ready to start' : !limitsValid ? 'Invalid limits — orders suspended'
    : s.phase === 'holding_btc' ? 'Holding BTC · waiting for an upward sell crossing'
      : s.previousPrice === null ? 'Holding USDT · waiting for the first reference quote' : 'Holding USDT · waiting for a downward buy crossing';
  return <aside className="simulation-card" aria-labelledby="simulation-title">
    <p className="eyebrow">VIRTUAL FUNDS · NO REAL ORDERS</p><h2 id="simulation-title">Trading simulator</h2>
    <p className="bitcoin-note">Start holding USDT. Buy only on a downward crossing below the minimum; then sell on an upward crossing above the maximum.</p>
    <div className="simulation-balances">
      <div><span>USDT balance</span><strong data-testid="usdt-balance">{usdt(s.usdt)}</strong></div>
      <div><span>Bitcoin balance</span><strong data-testid="btc-balance">{btc(s.btc)}</strong></div>
      <div><span>Total commissions · execution equivalent</span><strong data-testid="total-fees">{usdt(s.feesEquivalent)}</strong></div>
    </div>
    <dl className="simulation-summary"><div><dt>Fees deducted in BTC</dt><dd>{btc(s.feesBtc)}</dd></div><div><dt>Fees deducted in USDT</dt><dd>{usdt(s.feesUsdt)}</dd></div>
      <div><dt>Portfolio value · latest quote</dt><dd>{usdt(equity)}</dd></div><div><dt>P/L after fees</dt><dd className={equity - s.capital < 0 && funded ? 'bitcoin-down' : 'bitcoin-up'}>{usdt(funded ? equity - s.capital : 0)}</dd></div>
      <div><dt>Simulated trades</dt><dd data-testid="trade-count">{s.tradeCount}</dd></div></dl>
    <p className="simulation-state" aria-live="polite">{mode}</p>
    <fieldset className="simulation-settings"><legend>Live thresholds · USDT per BTC</legend>
      <LimitInput label="Buy minimum" value={minimum} setValue={setMinimum} step={Number(step)} />
      <LimitInput label="Sell maximum" value={maximum} setValue={setMaximum} step={Number(step)} />
      <label className="simulation-field">Adjustment step · USDT<input type="number" min="0.01" step="1" value={step} onChange={e => setStep(e.target.value)} /></label>
      {!limitsValid && !autoLimits && <p className="bitcoin-down" role="alert">Enter positive thresholds with minimum below maximum. Orders are suspended.</p>}
      {(!Number.isFinite(Number(step)) || Number(step) <= 0) && <p className="bitcoin-down" role="alert">Use a positive adjustment step to enable the +/− buttons.</p>}
      <p className="bitcoin-note">Changes apply to the next quote; moving a line alone never executes a trade.</p>
    </fieldset>
    <fieldset className="simulation-settings"><legend>Next Start / Reset</legend>
      <label className="simulation-field">Initial capital · USDT<input type="number" min="0.01" max="1000000000000" step="100" value={capital} onChange={e => setCapital(e.target.value)} /></label>
      <label className="simulation-field">Trading fee · % per order<input type="number" min="0" max="5" step="0.01" value={fee} onChange={e => setFee(e.target.value)} /></label>
      {!valid && <p className="bitcoin-down" role="alert">Use capital above zero (up to 1 trillion USDT) and a fee from 0% to 5%.</p>}
      <button className="simulation-start" type="button" disabled={!valid || (!limitsValid && !autoLimits)} onClick={start}>{started ? 'Reset simulation' : 'Start simulation'}</button>
      <p className="bitcoin-note">Reset restores the configured USDT, clears BTC, fees, trades and chart, and waits. The first quote sets a reference; a later downward crossing buys.</p>
      {started && <p className="bitcoin-note">Active run: {usdt(s.capital)} initial capital · {s.feePercent}% fee. Capital/fee edits take effect only after Reset.</p>}
    </fieldset>
    <details className="bitcoin-history"><summary>Simulated trades · latest 100</summary><div className="simulation-ledger"><table><caption>Fictitious executions at sampled prices</caption><thead><tr><th scope="col">Order / price</th><th scope="col">Spent → received</th><th scope="col">Fee deducted</th></tr></thead><tbody>
      {s.trades.slice().reverse().map(t => <tr key={t.id}><td>#{t.id} {t.side}<br />{usdt(t.price)}<br /><small>{new Date(t.retrievedAt).toLocaleTimeString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' })} · {t.reason}</small></td><td>{assetAmount(t.spent, t.spentAsset)}<br />→ {assetAmount(t.received, t.receivedAsset)}</td><td>{assetAmount(t.fee, t.feeAsset)}</td></tr>)}
    </tbody></table></div></details>
    <p className="bitcoin-note">Fee estimate: <a href="https://www.binance.com/en/fee/trading" target="_blank" rel="noreferrer">Binance standard spot 0.1%</a>, configurable. <a href="https://www.binance.com/en/support/faq/detail/e85d6e703b874674840122196b89780a" target="_blank" rel="noreferrer">Fees are deducted from the received asset</a>. No BNB/VIP discounts, pair promotions, spread, slippage or lot-size rules are modeled. Ten-second sampling can miss crossings. Session data resets when you leave.</p>
  </aside>;
}
