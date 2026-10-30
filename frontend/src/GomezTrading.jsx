import React, { useEffect, useState } from 'react';

export const gomezDefaults = { initialAction: 'SELL', initialBtc: '0.1', delta: '1', deltaUnit: 'percent', pollSeconds: '120' };
export const validGomez = draft => Number.isFinite(Number(draft.delta)) && Number(draft.delta) > 0
  && Number(draft.delta) <= 1e9 && (draft.deltaUnit !== 'percent' || Number(draft.delta) < 100)
  && ['percent', 'usdt'].includes(draft.deltaUnit) && Number.isInteger(Number(draft.pollSeconds))
  && Number(draft.pollSeconds) >= 10 && Number(draft.pollSeconds) <= 3600;
const money = value => value == null ? 'Waiting for a fresh quote' : `${value.toLocaleString('en-US', { maximumFractionDigits: 5 })} USDT / BTC`;
const btc = value => value == null ? 'Waiting' : `${value.toFixed(8)} BTC`;
const time = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Next scheduler check';

function DeltaFields({ draft, edit, prefix = '' }) {
  return <>
    <label className="simulation__field">{prefix}Delta unit<select className="field simulation__select" value={draft.deltaUnit} onChange={e => edit('deltaUnit')(e.target.value)}>
      <option value="percent">Percent of the last fill</option><option value="usdt">USDT per BTC</option>
    </select></label>
    <label className="simulation__field">{prefix}Delta margin<input className="field" type="number" min="0.000001" step="0.1" value={draft.delta} onChange={e => edit('delta')(e.target.value)} /></label>
    <label className="simulation__field">{prefix}Polling interval · seconds<input className="field" type="number" min="10" max="3600" step="1" value={draft.pollSeconds} onChange={e => edit('pollSeconds')(e.target.value)} /></label>
    {!validGomez(draft) && <p role="alert" className="text text--negative">Use a positive margin (below 100 for %) and 10–3600 whole seconds.</p>}
  </>;
}

export function GomezSettings({ draft, edit }) {
  return <fieldset className="simulation__settings"><legend>Gómez · parameters for the next Start / Reset</legend>
    <p className="bitcoin__note">Product: BTC / USDT. Default cycle: hold Bitcoin → SELL → hold USDT → BUY back Bitcoin. The first selected order executes at the next fresh quote after Start.</p>
    <label className="simulation__field">First action<select className="field simulation__select" value={draft.initialAction} onChange={e => edit('initialAction')(e.target.value)}>
      <option value="SELL">SELL Bitcoin · start holding BTC</option><option value="BUY">BUY Bitcoin · start holding USDT</option>
    </select></label>
    {draft.initialAction === 'SELL' ? <label className="simulation__field">Initial virtual Bitcoin<input className="field" type="number" min="0.00000001" max="1000000" step="0.01" value={draft.initialBtc} onChange={e => edit('initialBtc')(e.target.value)} /></label>
      : <p className="bitcoin__note">BUY entry uses Initial capital · USDT below. This first purchase is not a completed sell/rebuy cycle.</p>}
    <DeltaFields draft={draft} edit={edit} />
    <p className="bitcoin__note">These drafts apply on Start / Reset. Use Relaunch in the active-cycle panel to change a pending target without clearing funds.</p>
  </fieldset>;
}

export default function GomezTracking({ data, send, pending }) {
  const s = data.simulation, g = s.gomez;
  const [draft, setDraft] = useState(() => ({ delta: String(g.delta), deltaUnit: g.deltaUnit, pollSeconds: String(g.pollSeconds) }));
  useEffect(() => setDraft({ delta: String(g.delta), deltaUnit: g.deltaUnit, pollSeconds: String(g.pollSeconds) }), [g.delta, g.deltaUnit, g.pollSeconds]);
  const edit = key => value => setDraft(old => ({ ...old, [key]: value }));
  const price = data.samples.at(-1)?.price;
  const equivalent = price ? s.btc + s.usdt / price : null;
  const distance = price && g.targetPrice > 0 ? Math.max(0, g.nextAction === 'BUY' ? price - g.targetPrice : g.targetPrice - price) : null;
  const formula = g.lastFillPrice == null ? 'First order: next fresh successful quote.'
    : `${g.lastFillPrice} ${g.nextAction === 'BUY' ? '−' : '+'} ${g.deltaUnit === 'percent' ? `(${g.lastFillPrice} × ${g.delta} / 100)` : g.delta} = ${g.targetPrice} USDT / BTC`;
  const freshness = !data.running ? 'Paused; pending action and funds are retained.' : data.error ? data.error
    : !data.lastPollAt || Date.now() - data.lastPollAt > g.pollSeconds * 1000 + 30000 ? 'Waiting for a fresh server reading; these are saved values.' : 'Latest successful sampled price; the next order uses a new reading.';
  return <section className="panel simulation__tracking" aria-labelledby="gomez-title">
    <p className="text__eyebrow">GÓMEZ · BTC / USDT · SIMULATED CYCLES</p><h2 id="gomez-title">Sell Bitcoin, then buy it back</h2>
    <ol className="simulation__steps" aria-label="Gomez cycle steps">
      <li><strong>1. Hold BTC</strong><span>Default starting asset</span></li><li><strong>2. SELL</strong><span>Receive USDT, less the estimated fee</span></li>
      <li><strong>3. Wait for the delta</strong><span>Keep the proceeds and watch the rebuy target</span></li><li><strong>4. BUY back BTC</strong><span>Close the cycle and measure the BTC change after fees</span></li>
    </ol>
    <p className="simulation__state" role="status">{freshness}</p>
    <p className="simulation__decision">Last engine decision: {g.decision}</p>
    <dl className="simulation__metrics">
      <div className="simulation__metric"><dt>Next action</dt><dd>{g.nextAction}</dd><p>{g.pendingSell ? 'A sale is awaiting its rebuy. Reset is blocked until this cycle closes.' : 'No sale is awaiting rebuy.'}</p></div>
      <div className="simulation__metric"><dt>Reference · last actual fill</dt><dd>{money(g.lastFillPrice)}</dd><p>Relaunch preserves this price; it does not use the current market as a new reference.</p></div>
      <div className="simulation__metric"><dt>Target price</dt><dd>{money(g.targetPrice)}</dd><p>{formula}</p></div>
      <div className="simulation__metric"><dt>Latest market price</dt><dd>{money(price)}</dd><p>{price ? `1 USDT = ${(1 / price).toFixed(10)} BTC, derived from the same real BTC/USDT quote.` : 'No dollar peg is assumed.'}</p></div>
      <div className="simulation__metric"><dt>Remaining price movement</dt><dd>{money(distance)}</dd><p>BUY at or below the target; SELL at or above. An order fills at the next sampled price, which may differ from the target.</p></div>
      <div className="simulation__metric"><dt>Active delta / polling</dt><dd>{g.delta}{g.deltaUnit === 'percent' ? '%' : ' USDT'} / {g.pollSeconds}s</dd><p>Next scheduled request · Buenos Aires: {time(data.nextPollAt)}. Scheduler checks may add up to 10s. Refresh now makes an extra request.</p></div>
      <div className="simulation__metric"><dt>Completed SELL → BUY cycles</dt><dd>{g.completedCycles}</dd><p>Last completed cycle BTC change after both fees: {btc(g.completedCycles ? g.lastCycleGainBtc : null)}.</p></div>
      <div className="simulation__metric"><dt>Portfolio · BTC equivalent</dt><dd>{btc(equivalent)}</dd><p>BTC + USDT ÷ latest price. Change from the initial BTC equivalent: {btc(equivalent == null || g.initialBtcEquivalent == null ? null : equivalent - g.initialBtcEquivalent)}. While holding USDT this value changes with the market.</p></div>
    </dl>
    <fieldset className="simulation__settings"><legend>Relaunch the active cycle · preserve funds</legend>
      <DeltaFields draft={draft} edit={edit} prefix="Active " />
      <button className="button button--primary" disabled={pending || !validGomez(draft)} onClick={() => send('relaunch', { changes: { delta: Number(draft.delta), deltaUnit: draft.deltaUnit, pollSeconds: Number(draft.pollSeconds) } })}>Relaunch with these parameters</button>
      <p className="bitcoin__note">Applies the margin to the last fill, resumes and schedules a new quote after the interval. No immediate order, balance reset or side flip.</p>
      <button className="button" disabled={pending} onClick={() => send('finish-cycle', { enabled: !g.stopAfterCycle })}>{g.stopAfterCycle ? 'Cancel stop after cycle' : 'Stop after completing SELL → BUY'}</button>
      <p className="bitcoin__note">{g.stopAfterCycle ? 'Stop armed: finish the next rebuy, then pause holding BTC.' : 'Immediate Pause is also available; it retains a pending rebuy even while holding USDT.'}</p>
    </fieldset>
    <p className="bitcoin__note">Delta is a gross price margin. Estimated fee: {s.feePercent}% per order, deducted from the received asset. Both fees can consume the price margin. BNB balances and BNB fee payment are not simulated; a lower custom fee is only an estimate. Market polling can miss prices between readings.</p>
  </section>;
}
