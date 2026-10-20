import React from 'react';

const number = value => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(value);
const time = value => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'medium',
}).format(new Date(value));

function Placeholder({ wide = false }) {
  return <span aria-hidden="true" className={`skeleton${wide ? ' wide' : ''}`} />;
}

export default function WeatherWidget({ state, preview = false }) {
  const { data } = state;
  const loading = state.phase === 'loading';
  return (
      <section id={preview ? "weather-preview" : "weather"} className={`weather-card ${state.phase}`} aria-label={preview ? "Weather widget preview" : "Buenos Aires weather"} aria-busy={loading}>
        <div className="card-heading">
          <div><p className="eyebrow">BUENOS AIRES, ARGENTINA</p><p className="zone">America/Argentina/Buenos_Aires · UTC−3</p></div>
          <span className="live-tag"><span className="dot" /> {preview ? "SAMPLE DATA" : "PUBLIC WEATHER API"}</span>
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
  );
}
