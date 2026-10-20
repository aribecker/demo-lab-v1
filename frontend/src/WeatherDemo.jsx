import React from 'react';
import WeatherWidget from './WeatherWidget.jsx';
import { useWeather } from './useWeather.js';

export default function WeatherDemo({ loader }) {
  const state = useWeather(loader);
  return <>
    <section className="intro" aria-labelledby="page-heading">
      <p className="eyebrow">WEATHER DEMO</p>
      <h1 id="page-heading" tabIndex={-1}>Weather, <span>full stack.</span></h1>
      <p className="subtitle">One React page. One Java microservice. The weather in Buenos Aires.</p>
    </section>
    <WeatherWidget state={state} />
  </>;
}
