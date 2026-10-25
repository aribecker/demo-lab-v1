import React from 'react';
import { Link } from 'react-router';

export default function Home({canUseSimulator=false}) {
  return <>
    <section className="page-intro page-intro--home" aria-labelledby="page-heading">
      <p className="text__eyebrow">ONE APP · A FEW SMALL EXPERIMENTS</p>
      <h1 className="page-intro__title" id="page-heading" tabIndex={-1}>Small features.<br /><span>Real connections.</span></h1>
      <p className="page-intro__subtitle">A demo application for exploring React, reusable components and a Java microservice. Choose a feature and take a look around.</p>
    </section>
    <section className="home__grid" aria-label="Demo features">
      <Link className="home__card" to="/specifications">
        <span className="home__number" aria-hidden="true">08 / SPECIFICATIONS · SDD</span>
        <h2>Specifications <span aria-hidden="true">↗</span></h2>
        <p>Read all system specifications with syntax highlighting, adjustable text and original source downloads.</p>
        <span className="home__action">Open Specifications →</span>
      </Link>
      <Link className="home__card" to="/database">
        <span className="home__number" aria-hidden="true">07 / DATABASE · EXPLORER</span>
        <h2>Database <span aria-hidden="true">↗</span></h2>
        <p>Browse PostgreSQL schemas and tables, expand rows and inspect each column in a read-only panel.</p>
        <span className="home__action">Open Database →</span>
      </Link>
      <Link className="home__card" to="/chatbot">
        <span className="home__number" aria-hidden="true">06 / CHATBOT · SPRING AI</span>
        <h2>Chatbot <span aria-hidden="true">↗</span></h2>
        <p>Choose a free text model, keep a conversation and try optional dictation or read-aloud. A server-side OpenRouter API key is required.</p>
        <span className="home__action">Open Chatbot →</span>
      </Link>
      <Link className="home__card" to="/people">
        <span className="home__number" aria-hidden="true">05 / PEOPLE · POSTGRESQL</span>
        <h2>People <span aria-hidden="true">↗</span></h2>
        <p>Add sample names and browse the persistent people list in the same application as Login and the trading simulator.</p>
        <span className="home__action">Open People →</span>
      </Link>
      {canUseSimulator&&<Link className="home__card" to="/trading-simulator"><span className="home__number">OWNER ACCESS · VIRTUAL FUNDS</span><h2>Trading Simulator ↗</h2><p>Manage the saved simulation, strategy, balances and tracking decisions.</p><span className="home__action">Open Trading Simulator →</span></Link>}
      <Link className="home__card" to="/bitcoin">
        <span className="home__number" aria-hidden="true">04 / MARKET WATCH</span>
        <h2>Bitcoin tracker <span aria-hidden="true">↗</span></h2>
        <p>Follow BTC/USDT market prices, charts and the complete saved reading history.</p>
        <span className="home__action">Open Bitcoin tracker →</span>
      </Link>
      <Link className="home__card" to="/weather">
        <span className="home__number" aria-hidden="true">01 / LIVE DATA</span>
        <h2>Weather demo <span aria-hidden="true">↗</span></h2>
        <p>Ask an independent Java microservice for the weather in Buenos Aires. See real data, loading states and provider details.</p>
        <span className="home__action">Open Weather demo →</span>
      </Link>
      <Link className="home__card" to="/components">
        <span className="home__number" aria-hidden="true">02 / UI EXPLORER</span>
        <h2>Component gallery <span aria-hidden="true">↗</span></h2>
        <p>Explore the reusable Weather widget in isolation. Try its success, loading and error states with clearly labeled sample data.</p>
        <span className="home__action">Open Component gallery →</span>
      </Link>
      <Link className="home__card" to="/login">
        <span className="home__number" aria-hidden="true">03 / IDENTITY</span>
        <h2>Login <span aria-hidden="true">↗</span></h2>
        <p>Sign in to see your profile. Trading Simulator access is reserved for the authorized Google account.</p>
        <span className="home__action">Open Login →</span>
      </Link>
    </section>
    <aside className="home__note"><span className="status-dot" aria-hidden="true" /><p>Built as a small learning lab. Each feature has its own URL, so you can bookmark it or open it directly.</p></aside>
  </>;
}



