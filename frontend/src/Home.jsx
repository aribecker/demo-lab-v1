import React from 'react';
import { Link } from 'react-router';

export default function Home() {
  return <>
    <section className="intro home-intro" aria-labelledby="page-heading">
      <p className="eyebrow">ONE APP · A FEW SMALL EXPERIMENTS</p>
      <h1 id="page-heading" tabIndex={-1}>Small features.<br /><span>Real connections.</span></h1>
      <p className="subtitle">A demo application for exploring React, reusable components and a Java microservice. Choose a feature and take a look around.</p>
    </section>
    <section className="feature-grid" aria-label="Demo features">
      <Link className="feature-card" to="/bitcoin">
        <span className="feature-number" aria-hidden="true">04 / MARKET WATCH</span>
        <h2>Bitcoin tracker <span aria-hidden="true">↗</span></h2>
        <p>Follow BTC/USDT every 10 seconds and simulate buy/sell crossings with virtual balances, adjustable limits and fees.</p>
        <span className="feature-action">Open Bitcoin tracker →</span>
      </Link>
      <Link className="feature-card" to="/weather">
        <span className="feature-number" aria-hidden="true">01 / LIVE DATA</span>
        <h2>Weather demo <span aria-hidden="true">↗</span></h2>
        <p>Ask an independent Java microservice for the weather in Buenos Aires. See real data, loading states and provider details.</p>
        <span className="feature-action">Open Weather demo →</span>
      </Link>
      <Link className="feature-card" to="/components">
        <span className="feature-number" aria-hidden="true">02 / UI EXPLORER</span>
        <h2>Component gallery <span aria-hidden="true">↗</span></h2>
        <p>Explore the reusable Weather widget in isolation. Try its success, loading and error states with clearly labeled sample data.</p>
        <span className="feature-action">Open Component gallery →</span>
      </Link>
      <Link className="feature-card" to="/login">
        <span className="feature-number" aria-hidden="true">03 / IDENTITY</span>
        <h2>Login <span aria-hidden="true">↗</span></h2>
        <p>Sign in with Google, GitHub or Microsoft and see the profile you choose to share.</p>
        <span className="feature-action">Open Login →</span>
      </Link>
    </section>
    <aside className="home-note"><span className="dot" aria-hidden="true" /><p>Built as a small learning lab. Each feature has its own URL, so you can bookmark it or open it directly.</p></aside>
  </>;
}


