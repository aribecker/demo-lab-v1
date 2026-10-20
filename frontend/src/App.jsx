import React, { useRef, useState } from 'react';
import { useWeather } from './useWeather.js';

const number = value => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(value);
const time = value => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'medium',
}).format(new Date(value));

function Placeholder({ wide = false }) {
  return <span aria-hidden="true" className={`skeleton${wide ? ' wide' : ''}`} />;
}

export default function App({ loader }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const weatherSection = useRef(null);
  const state = useWeather(loader);
  const { data } = state;
  const loading = state.phase === 'loading';
  return (
    <main className="page">
      <header className="masthead">
        <div className="header-start">
          <div className="navigation" onKeyDown={event => {
            if (event.key === 'Escape' && menuOpen) {
              event.preventDefault();
              setMenuOpen(false);
              menuButton.current?.focus();
            }
          }}>
            <button ref={menuButton} type="button" className="menu-toggle" aria-label="Menu"
              aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(open => !open)}>
              <span className="hamburger" aria-hidden="true"><span /><span /><span /></span>
            </button>
            <nav id="main-navigation" aria-label="Main navigation" hidden={!menuOpen}>
              <a href="#weather" aria-current="page" onClick={() => {
                setMenuOpen(false);
                weatherSection.current?.focus({ preventScroll: true });
              }}>Weather demo</a>
            </nav>
          </div>
          <a href="#weather" className="brand" aria-label="Weather demonstration home"><span className="brand-icon">◒</span> WEATHER LAB</a>
        </div>
        <span className="version">ITERATION 02 <span>v2.0.0</span></span>
      </header>

      <section className="intro" aria-labelledby="title">
        <p className="eyebrow">A SMALL FULL-STACK EXPERIMENT</p>
        <h1 id="title">Weather, <span>full stack.</span></h1>
        <p className="subtitle">One React page. One Java microservice. The weather in Buenos Aires.</p>
      </section>

      <section id="weather" ref={weatherSection} tabIndex={-1} className={`weather-card ${state.phase}`} aria-label="Buenos Aires weather" aria-busy={loading}>
        <div className="card-heading">
          <div><p className="eyebrow">BUENOS AIRES, ARGENTINA</p><p className="zone">America/Argentina/Buenos_Aires · UTC−3</p></div>
          <span className="live-tag"><span className="dot" /> PUBLIC WEATHER API</span>
        </div>

        <div className="reading-area">
          <div className="temperature">
            <p className="label">TEMPERATURE</p>
            <div className="degrees">{data ? <>{number(data.temperatureC)}<span>°C</span></> : <Placeholder wide />}</div>
            <p className="feels-like">{data?.feelsLikeC != null ? `Feels like ${number(data.feelsLikeC)} °C` : data ? 'Feels-like value not supplied' : <Placeholder />}</p>
          </div>
          <div className="metrics">
            <div><p className="label">HUMIDITY</p><p className="metric">{data ? <>{number(data.humidityPercent)} <span>%</span></> : <Placeholder />}</p></div>
            <div><p className="label">WIND</p><p className="metric">{data ? <>{number(data.windKmh)} <span>km/h</span></> : <Placeholder />}</p></div>
          </div>
        </div>

        <div className="source-row"><span className="label">DATA SOURCE</span><span>{data ? <><a href={data.providerUrl} target="_blank" rel="noreferrer">{data.provider} ↗</a><span className="data-type">{data.dataType}</span></> : <Placeholder wide />}</span></div>
        <dl className="metadata">
          <div><dt>Data time</dt><dd>{data ? time(data.observedAt) : '—'}</dd></div>
          <div><dt>Requested</dt><dd>{data ? time(data.requestedAt) : '—'}</dd></div>
          <div><dt>Request ID</dt><dd className="request-id">{data?.requestId || state.requestId || '—'}</dd></div>
        </dl>

        <div className="actions">
          <p role="status" aria-live="polite" className="status"><span className={`status-light ${state.phase}`} />{state.message}</p>
          <button type="button" disabled={loading} onClick={state.refresh}><span aria-hidden="true">↻</span> {loading ? 'Getting weather…' : 'Get weather'}</button>
        </div>
      </section>

      <footer>
        <p><span>React {React.version}</span> <i>→</i> Weather microservice <i>→</i> Provider</p>
        <p>Data: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> / <a href="https://www.met.no/" target="_blank" rel="noreferrer">MET Norway</a> <span className="footer-note">· Times in Buenos Aires</span></p>
      </footer>
    </main>
  );
}
