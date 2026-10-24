import React from 'react';

const number = value => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(value);
const time = value => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'medium',
}).format(new Date(value));

function Placeholder({ wide = false }) {
  return <span aria-hidden="true" className={`skeleton${wide ? ' skeleton--wide' : ''}`} />;
}

export default function WeatherWidget({ state, preview = false }) {
  const { data } = state;
  const loading = state.phase === 'loading';
  return (
      <section id={preview ? "weather-preview" : "weather"} className={`panel weather-widget weather-widget--${state.phase}`} aria-label={preview ? "Weather widget preview" : "Buenos Aires weather"} aria-busy={loading}>
        <div className="panel__heading">
          <div><p className="text__eyebrow">BUENOS AIRES, ARGENTINA</p><p className="weather-widget__zone">America/Argentina/Buenos_Aires · UTC−3</p></div>
          <span className="weather-widget__live-tag"><span className="status-dot" /> {preview ? "SAMPLE DATA" : "PUBLIC WEATHER API"}</span>
        </div>

        <div className="weather-widget__readings">
          <div className="weather-widget__temperature">
            <p className="weather-widget__label">TEMPERATURE</p>
            <div className="weather-widget__degrees">{data ? <>{number(data.temperatureC)}<span>°C</span></> : <Placeholder wide />}</div>
            <p className="weather-widget__feels-like">{data?.feelsLikeC != null ? `Feels like ${number(data.feelsLikeC)} °C` : data ? 'Feels-like value not supplied' : <Placeholder />}</p>
          </div>
          <div className="weather-widget__metrics">
            <div><p className="weather-widget__label">HUMIDITY</p><p className="weather-widget__metric">{data ? <>{number(data.humidityPercent)} <span>%</span></> : <Placeholder />}</p></div>
            <div><p className="weather-widget__label">WIND</p><p className="weather-widget__metric">{data ? <>{number(data.windKmh)} <span>km/h</span></> : <Placeholder />}</p></div>
          </div>
        </div>

        <div className="weather-widget__source"><span className="weather-widget__label">DATA SOURCE</span><span>{data ? <><a href={data.providerUrl} target="_blank" rel="noreferrer">{data.provider} ↗</a><span className="weather-widget__data-type">{data.dataType}</span></> : <Placeholder wide />}</span></div>
        <dl className="weather-widget__metadata">
          <div><dt>Data time</dt><dd>{data ? time(data.observedAt) : '—'}</dd></div>
          <div><dt>Requested</dt><dd>{data ? time(data.requestedAt) : '—'}</dd></div>
          <div><dt>Request ID</dt><dd className="weather-widget__request-id">{data?.requestId || state.requestId || '—'}</dd></div>
        </dl>

        <div className="weather-widget__actions">
          <p role="status" aria-live="polite" className="weather-widget__status"><span className={`weather-widget__status-light weather-widget__status-light--${state.phase}`} />{state.message}</p>
          <button className="button button--primary" type="button" disabled={loading} onClick={state.refresh}><span aria-hidden="true">↻</span> {loading ? 'Getting weather…' : 'Get weather'}</button>
        </div>
      </section>
  );
}

