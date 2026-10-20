import { useWeather } from './useWeather.js';

export function ResultSlot({ as: Element, id, lines, children }) {
  return (
    <Element id={id} className={`result-slot ${lines === 2 ? 'two-lines' : 'one-line'}`}>
      <span className="slot-text">{children}</span>
      <span className="skeleton-lines" aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => <span key={index} />)}
      </span>
    </Element>
  );
}

export function WeatherCard() {
  const { phase, result, error, refresh } = useWeather();
  const loading = phase === 'loading';
  const status = loading ? 'Fetching weather…'
    : phase === 'success' ? '✓ Weather updated' : `✕ ${error}`;
  return (
    <section id="weather-card" className={loading ? 'is-loading' : undefined}
      aria-busy={loading} data-request-active={String(loading)}>
      <div className="label">WEATHER IN BUENOS AIRES</div>
      <div id="status" role="status" aria-live="polite">{status}</div>
      <ResultSlot as="h2" id="message" lines={2}>{result?.message}</ResultSlot>
      <ResultSlot as="p" id="weather" lines={2}>{result?.weather}</ResultSlot>
      <ResultSlot as="code" id="architecture" lines={1}>
        {phase === 'error' ? 'Use the button to try again.' : result?.architecture}
      </ResultSlot>
      <ResultSlot as="small" id="timestamp" lines={1}>{result?.timestamp}</ResultSlot>
      <button id="call" disabled={loading} onClick={refresh}>Get weather</button>
    </section>
  );
}

export default function App() {
  return (
    <main>
      <div className="badge">SPEC-DRIVEN DEVELOPMENT</div>
      <p className="badge" aria-label="Version 0.0.8 · Java">🔖 Version 0.0.8 · Java</p>
      <h1>Weather, full stack.</h1>
      <p className="lead">Each request travels through the frontend, backend, and an asynchronous weather service.</p>
      <WeatherCard />
      <footer>Frontend · React · HTTP API · Spring Boot · REST microservices · Java 17 · Asynchronous HttpClient · Data from <a href="https://open-meteo.com/">Open-Meteo</a> / <a href="https://www.met.no/">MET Norway</a></footer>
    </main>
  );
}
