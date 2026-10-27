import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import WeatherWidget from './WeatherWidget.jsx';

const sample = Object.freeze({
  version: '2.0.0', city: 'Buenos Aires, Argentina', temperatureC: 21.4, feelsLikeC: 20.1,
  humidityPercent: 64, windKmh: 12.3, observedAt: '2026-10-20T12:00:00Z', requestedAt: '2026-10-20T12:10:00Z',
  timezone: 'America/Argentina/Buenos_Aires', provider: 'Open-Meteo', providerUrl: 'https://open-meteo.com/',
  dataType: 'current model data', requestId: 'gallery-sample-only',
});

const states = {
  success: { phase: 'success', data: sample, message: 'Sample preview ready. No live request was made.' },
  loading: { phase: 'loading', message: 'Sample loading state. No live request is running.' },
  error: { phase: 'error', message: 'Sample error: weather is unavailable. Try the preview again.', requestId: 'gallery-sample-only' },
};

export default function ComponentGallery() {
  const [selected, setSelected] = useState('success');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  function select(value) {
    clearTimeout(timer.current);
    setSelected(value);
  }

  function refreshPreview() {
    select('loading');
    timer.current = setTimeout(() => setSelected('success'), 900);
  }

  return <>
    <section className="page-intro" aria-labelledby="page-heading">
      <p className="text__eyebrow">UI EXPLORER · 1 COMPONENT</p>
      <h1 className="page-intro__title" id="page-heading" tabIndex={-1}>Component <span>gallery.</span></h1>
      <p className="page-intro__subtitle">Reusable UI, shown in isolation. Explore how each component looks and behaves before using it in a feature.</p>
    </section>
    <section className="gallery__description" aria-labelledby="widget-title">
      <div><p className="text__eyebrow">COMPONENT 01</p><h2 id="widget-title">Weather widget</h2><p>The same component used by the live demo, with a small set of controlled display states.</p></div>
      <Link className="text__link" to="/weather">Open live Weather demo →</Link>
    </section>
    <div className="gallery__toolbar">
      <div className="gallery__state-controls" role="group" aria-label="Preview state">
        {['success', 'loading', 'error'].map(value => <button className="button" key={value} type="button"
          aria-pressed={selected === value} onClick={() => select(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
      </div>
      <p className="gallery__notice">COMPONENT PREVIEW · SAMPLE DATA · NO NETWORK REQUESTS</p>
    </div>
    <WeatherWidget preview state={{ ...states[selected], refresh: refreshPreview }} />
    <aside className="gallery__notes" aria-label="Component usage">
      <h3>How to use it</h3>
      <p>Pass a display state, weather data when available and a refresh handler. The widget renders the interface; the page decides where its data comes from.</p>
      <p>Try the state buttons above, or use Get weather in the preview to simulate a short loading cycle. For real provider data, open the Weather demo.</p>
    </aside>
  </>;
}

