import React from 'react';
import useBitcoin from './useBitcoin.js';

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const time = value => new Date(value).toLocaleTimeString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires' });

export function BitcoinWidget({ tracker }) {
  const { samples, baseline, range, count, error, pending, running, visible, toggle, refresh } = tracker;
  const latest = samples.at(-1);
  const delta = latest ? latest.price - baseline : 0;
  const values = samples.map(point => point.price);
  const low = Math.min(...values), high = Math.max(...values);
  const points = samples.map((point, i) => `${30 + i / Math.max(1, samples.length - 1) * 540},${150 - (point.price - low) / (high - low || 1) * 110}`).join(' ');
  const mode = !running ? 'Paused' : !visible ? 'Waiting for visible tab' : error ? 'Refresh failed' : pending ? 'Refreshing…' : 'Tracking';
  return <section className="bitcoin-card" aria-label="Bitcoin price tracker">
    <div className="card-heading"><p className="eyebrow">BTC / USD</p><span className="bitcoin-mode">{mode}</span></div>
    <div className="bitcoin-quote" aria-live="off">{latest ? money(latest.price) : '—'}<span>USD per Bitcoin</span></div>
    <p className={delta < 0 ? 'bitcoin-down' : 'bitcoin-up'}>{latest
      ? `${delta >= 0 ? '+' : ''}${money(delta)} (${(delta / baseline * 100).toFixed(3)}%) since opening`
      : 'Waiting for the first quote'}</p>
    <dl className="bitcoin-stats">
      <div><dt>Session low</dt><dd>{range ? money(range.min) : '—'}</dd></div>
      <div><dt>Session high</dt><dd>{range ? money(range.max) : '—'}</dd></div>
      <div><dt>Successful readings</dt><dd>{count}</dd></div>
      <div><dt>Last retrieved · Buenos Aires</dt><dd>{latest ? time(latest.retrievedAt) : '—'}</dd></div>
    </dl>
    <figure className="bitcoin-chart">
      <figcaption>Session progress · latest {samples.length} readings</figcaption>
      {samples.length > 1 ? <svg viewBox="0 0 600 180" role="img" aria-label={`Bitcoin session chart, ${samples.length} readings, from ${money(samples[0].price)} to ${money(latest.price)}`}>
        <path d="M30 160H570 M30 20V160" stroke="#365466" fill="none" />
        <polyline points={points} fill="none" stroke="#75dae9" strokeWidth="3" strokeLinejoin="round" />
        <text x="30" y="178">{time(samples[0].retrievedAt)}</text><text x="570" y="178" textAnchor="end">{time(latest.retrievedAt)}</text>
      </svg> : <p className="bitcoin-empty">{latest ? 'The chart starts with the next successful reading.' : 'Your session chart will appear here.'}</p>}
      <p className="bitcoin-note">Last 180 readings (about 30 minutes). History starts when you open this page and resets when you leave. Chart scale follows this session.</p>
    </figure>
    <p role="status" className="bitcoin-status">{error ? `${error}${latest ? ' Showing the last successful quote — stale.' : ' No quote available yet.'}`
      : !running ? 'Tracking paused. Resume to get a fresh quote.' : !visible ? 'Automatic updates pause while this tab is hidden.'
        : pending ? 'Retrieving a Coinbase quote…' : 'Automatic refresh every 10 seconds while this page is visible.'}</p>
    <div className="bitcoin-actions"><button onClick={toggle}>{running ? 'Pause tracking' : 'Resume tracking'}</button>
      <button onClick={refresh} disabled={pending || !running || !visible}>Refresh now</button></div>
    <p className="bitcoin-note">Source: <a href="https://www.coinbase.com/price/bitcoin" target="_blank" rel="noreferrer">Coinbase spot price</a>. Retrieval time is your browser's time, not an exchange timestamp. Prices may repeat; provider caching and browser throttling can delay updates.</p>
    <details className="bitcoin-history"><summary>Recent readings (latest 10)</summary><table><caption>Successful quotes retrieved in this session</caption><thead><tr><th scope="col">Retrieved · Buenos Aires</th><th scope="col">BTC / USD</th></tr></thead><tbody>
      {samples.slice(-10).reverse().map((point, i) => <tr key={`${point.retrievedAt}-${i}`}><td>{time(point.retrievedAt)}</td><td>{money(point.price)}</td></tr>)}
    </tbody></table></details>
  </section>;
}

export default function BitcoinTracker({ loader }) {
  const tracker = useBitcoin(loader);
  return <>
    <section className="intro" aria-labelledby="page-heading"><p className="eyebrow">LIVE QUOTES · YOUR SESSION</p>
      <h1 id="page-heading" tabIndex={-1}>Bitcoin <span>tracker.</span></h1>
      <p className="subtitle">Follow the price of one Bitcoin in US dollars, with a new request every 10 seconds.</p></section>
    <ol className="bitcoin-guide" aria-label="Tracking guide"><li><strong>Open</strong><span>Your first quote loads automatically.</span></li><li><strong>Watch</strong><span>Compare the price and your session progress.</span></li><li><strong>Take a break</strong><span>Pause and resume whenever you like.</span></li></ol>
    <BitcoinWidget tracker={tracker} />
  </>;
}
