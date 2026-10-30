import React, { useEffect, useReducer, useState } from 'react';
import useBitcoin from './useBitcoin.js';
import SimulationPanel from './SimulationPanel.jsx';
import { EMPTY_SIMULATION, simulationReducer, validLimits, validRun } from './simulation.js';

const money = value => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
const time = value => new Date(value).toLocaleTimeString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' });

export function BitcoinWidget({ tracker, minimum, maximum, rateHistory, readOnly=false }) {
  const { samples, baseline, range, count, error, pending, running, visible, toggle, refresh } = tracker;
  const latest = samples.at(-1);
  const delta = latest ? latest.price - baseline : 0;
  const values = samples.map(point => point.price);
  const chartLimits = validLimits(minimum, maximum) ? [minimum, maximum] : [];
  const low = Math.min(...values, ...chartLimits), high = Math.max(...values, ...chartLimits);
  const points = samples.map((point, i) => `${30 + i / Math.max(1, samples.length - 1) * 540},${150 - (point.price - low) / (high - low || 1) * 110}`).join(' ');
  const mode = !running ? 'Paused' : !visible ? 'Waiting for visible tab' : error ? 'Refresh failed' : pending ? 'Refreshing…' : 'Tracking';
  return <section className="panel bitcoin__panel" aria-label="Bitcoin price tracker">
    <div className="panel__heading"><p className="text__eyebrow">BTC / USDT</p><span className="bitcoin__mode">{mode}</span></div>
    <div className="bitcoin__quote" aria-live="off">{latest ? money(latest.price) : '—'}<span>USDT per Bitcoin · Binance</span></div>
    <p className={delta < 0 ? 'text text--negative' : 'text text--positive'}>{latest
      ? `${delta >= 0 ? '+' : ''}${money(delta)} (${(delta / baseline * 100).toFixed(3)}%) ${tracker.shared ? 'since shared baseline' : 'since opening'}`
      : 'Waiting for the first quote'}</p>
    <dl className="bitcoin__stats">
      <div><dt>{tracker.shared ? 'Shared low' : 'Session low'}</dt><dd>{range ? money(range.min) : '—'}</dd></div>
      <div><dt>{tracker.shared ? 'Shared high' : 'Session high'}</dt><dd>{range ? money(range.max) : '—'}</dd></div>
      <div><dt>Successful readings</dt><dd>{count}</dd></div>
      {rateHistory && <div className="bitcoin__history-stat"><dt>Provider attempts · lifetime</dt><dd>{rateHistory}</dd></div>}
      <div><dt>Last retrieved · Buenos Aires</dt><dd>{latest ? time(latest.retrievedAt) : '—'}</dd></div>
    </dl>
    <figure className="bitcoin__chart">
      <figcaption>{tracker.shared ? 'Shared progress' : 'Session progress'} · latest {samples.length} readings</figcaption>
      {samples.length > 1 ? <svg viewBox="0 0 600 180" role="img" aria-label={`Bitcoin session chart, ${samples.length} readings, from ${money(samples[0].price)} to ${money(latest.price)}`}>
        <path d="M30 160H570 M30 20V160" className="bitcoin__axis" />
        {chartLimits.map((limit, index) => <g key={index}>
          <line x1="30" x2="570" y1={150 - (limit - low) / (high - low || 1) * 110} y2={150 - (limit - low) / (high - low || 1) * 110} className={`bitcoin__threshold bitcoin__threshold--${index ? 'sell' : 'buy'}`} />
          <text x="34" y={145 - (limit - low) / (high - low || 1) * 110}>{index ? 'SELL max' : 'BUY min'} {money(limit)}</text>
        </g>)}
        <polyline points={points} className="bitcoin__series" />
        <text x="30" y="178">{time(samples[0].retrievedAt)}</text><text x="570" y="178" textAnchor="end">{time(latest.retrievedAt)}</text>
      </svg> : <p className="bitcoin__empty">{latest ? 'The chart starts with the next successful reading.' : 'Your session chart will appear here.'}</p>}
      <p className="bitcoin__note">{tracker.shared ? 'Latest 180 shared readings. History is saved on the server and only Reset clears it.' : 'Last 180 readings (about 30 minutes). History starts when you open this page and resets when you leave.'} Chart scale follows these readings.</p>
    </figure>
    <p role="status" className="bitcoin__status">{error ? `${error}${latest ? ' Showing the last successful quote — stale.' : ' No quote available yet.'}`
      : !running ? 'Tracking paused. Resume to get a fresh quote.' : !visible ? 'Automatic updates pause while this tab is hidden.'
        : pending ? 'Retrieving a Binance quote…' : tracker.shared ? 'Server checks Binance at its configured interval while running and awake.' : 'Automatic refresh every 10 seconds while this page is visible.'}</p>
    {!readOnly && <div className="bitcoin__actions"><button className="button" onClick={toggle}>{running ? 'Pause tracking' : 'Resume tracking'}</button>
      <button className="button" onClick={refresh} disabled={pending || !running || !visible}>Refresh now</button></div>}
    <p className="bitcoin__note">Source: <a href="https://www.binance.com/en/trade/BTC_USDT" target="_blank" rel="noreferrer">Binance BTC/USDT spot price</a>. Retrieval time is {tracker.shared ? 'the server retrieval time' : "your browser's time"}, not an exchange timestamp. Prices may repeat; provider caching can delay updates.</p>
    <details className="bitcoin__history"><summary>Recent readings (latest 10)</summary><table><caption>Successful quotes retrieved in this session</caption><thead><tr><th scope="col">Retrieved · Buenos Aires</th><th scope="col">BTC / USDT</th></tr></thead><tbody>
      {samples.slice(-10).reverse().map((point, i) => <tr key={`${point.retrievedAt}-${i}`}><td>{time(point.retrievedAt)}</td><td>{money(point.price)}</td></tr>)}
    </tbody></table></details>
  </section>;
}

export default function BitcoinTracker({ loader }) {
  const tracker = useBitcoin(loader);
  const [simulation, dispatch] = useReducer(simulationReducer, EMPTY_SIMULATION);
  const [capital, setCapital] = useState('10000');
  const [fee, setFee] = useState('0.1');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [step, setStep] = useState('10');
  const [limitsInitialized, setLimitsInitialized] = useState(false);
  const latest = tracker.samples.at(-1);
  const number = value => value.trim() ? Number(value) : NaN;
  const limitsValid = validLimits(number(minimum), number(maximum));
  useEffect(() => {
    if (!latest || !tracker.running || !tracker.visible || tracker.error) return;
    let min = number(minimum), max = number(maximum);
    if (!limitsInitialized && minimum === '' && maximum === '') {
      min = Number((latest.price * 0.995).toFixed(2));
      max = Number((latest.price * 1.005).toFixed(2));
      setMinimum(String(min)); setMaximum(String(max));
      setLimitsInitialized(true);
    }
    dispatch({ type: 'quote', sequence: tracker.count, quote: latest, minimum: min, maximum: max });
  }, [latest, tracker.count, tracker.running, tracker.visible, tracker.error, minimum, maximum, limitsInitialized]);
  const start = () => {
    dispatch({ type: 'reset', capital: number(capital), feePercent: number(fee) });
    tracker.reset();
  };
  return <>
    <section className="page-intro" aria-labelledby="page-heading"><p className="text__eyebrow">LIVE QUOTES · YOUR SESSION</p>
      <h1 className="page-intro__title" id="page-heading" tabIndex={-1}>Bitcoin <span>tracker.</span></h1>
      <p className="page-intro__subtitle">Live Binance BTC/USDT quotes every 10 seconds, with a virtual buy-low / sell-high simulator.</p></section>
    <ol className="bitcoin__guide" aria-label="Tracking guide"><li><strong>Configure</strong><span>Choose virtual capital, fee and buy/sell limits.</span></li><li><strong>Start & watch</strong><span>Start holds USDT; buy below the minimum and sell above the maximum on crossings.</span></li><li><strong>Adjust or reset</strong><span>Move limits live, pause, or restart with virtual USDT and wait for a buy crossing.</span></li></ol>
    <div className="bitcoin__workspace"><BitcoinWidget tracker={tracker} minimum={number(minimum)} maximum={number(maximum)} />
      <SimulationPanel simulation={simulation} latest={latest} valid={validRun(number(capital), number(fee))} limitsValid={limitsValid} autoLimits={!limitsInitialized && minimum === '' && maximum === ''} start={start}
        settings={{ capital, setCapital, fee, setFee, minimum, setMinimum, maximum, setMaximum, step, setStep }} /></div>
  </>;
}

