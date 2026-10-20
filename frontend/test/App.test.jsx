import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import App from '../src/App.jsx';
import { useWeather } from '../src/useWeather.js';

const fixture = {
  message: 'Hello World · Version 0.0.8', version: '0.0.8',
  architecture: 'Spring Boot API → Weather microservice → Open-Meteo',
  timestamp: '2026-10-19T21:00:00Z',
  weather: {
    location: 'Buenos Aires, Argentina', temperature: 18,
    apparentTemperature: 17, humidity: 60, windSpeed: 12,
    source: 'Open-Meteo', observedAt: '2026-10-19T17:45', dataKind: null,
  },
};
const pending = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (body = fixture, status = 200) => ({
  ok: status >= 200 && status < 300, status, json: async () => structuredClone(body),
});
const slot = id => document.querySelector(`#${id} .slot-text`);
const updated = () => screen.findByText('✓ Weather updated');

beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Feature 003 — same visible behavior on React', () => {
  it('starts one same-origin request and preserves the accessible loading state', () => {
    fetch.mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('/api/hello');
    expect(fetch.mock.calls[0][1].cache).toBe('no-store');
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(screen.getByRole('button', { name: 'Get weather' }).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('Fetching weather…');
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
    expect(document.querySelector('#weather-card').getAttribute('aria-busy')).toBe('true');
    expect(document.querySelector('#weather-card').className).toBe('is-loading');
    expect(document.querySelectorAll('.skeleton-lines > span')).toHaveLength(6);
    for (const id of ['message', 'weather', 'architecture', 'timestamp']) expect(slot(id).textContent).toBe('');
  });

  it('renders the existing success copy, weather values, architecture and Buenos Aires times', async () => {
    fetch.mockResolvedValue(response());
    render(<App />);
    await updated();
    expect(slot('message').textContent).toBe('Hello World · Version 0.0.8 · 18 °C · Buenos Aires, Argentina');
    expect(slot('weather').textContent).toBe('Feels like: 17 °C · Humidity: 60% · Wind: 12 km/h · Source: Open-Meteo');
    expect(slot('architecture').textContent).toBe(fixture.architecture);
    expect(slot('timestamp').textContent).toBe('Data: 2026-10-19 17:45 (Buenos Aires) · Requested: 18:00:00');
    expect(screen.getByRole('button', { name: 'Get weather' }).disabled).toBe(false);
    expect(document.querySelector('#weather-card').getAttribute('aria-busy')).toBe('false');
    expect(document.querySelector('#weather-card').classList.contains('is-loading')).toBe(false);
  });

  it('omits null apparent temperature and preserves fallback forecast attribution', async () => {
    fetch.mockResolvedValue(response({ ...fixture, weather: { ...fixture.weather,
      source: 'MET Norway', apparentTemperature: null, dataKind: 'Forecast for the nearest hour',
    } }));
    render(<App />);
    await updated();
    expect(slot('weather').textContent).toBe('Humidity: 60% · Wind: 12 km/h · Source: MET Norway · Forecast for the nearest hour');
  });

  it('converts UTC observation times to Buenos Aires', async () => {
    fetch.mockResolvedValue(response({ ...fixture, weather: { ...fixture.weather, observedAt: '2026-10-19T20:45:00Z' } }));
    render(<App />);
    await updated();
    expect(slot('timestamp').textContent).toContain('19/10/2026, 17:45:00 (Buenos Aires)');
  });

  it('shows the HTTP error and recovers on a manual retry', async () => {
    fetch.mockResolvedValueOnce(response({ error: 'Unable to retrieve the weather. Please try again.' }, 502))
      .mockResolvedValueOnce(response());
    render(<App />);
    await screen.findByText('✕ Unable to retrieve the weather. Please try again.');
    expect(slot('architecture').textContent).toBe('Use the button to try again.');
    expect(screen.getByRole('button', { name: 'Get weather' }).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Get weather' }));
    await updated();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('uses the HTTP status when the API supplies no error text', async () => {
    fetch.mockResolvedValue(response({}, 504));
    render(<App />);
    await screen.findByText('✕ HTTP 504');
    expect(slot('architecture').textContent).toBe('Use the button to try again.');
  });

  it('recovers from a network failure without changing the retry policy', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(response());
    render(<App />);
    await screen.findByText('✕ Failed to fetch');
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Get weather' }));
    await updated();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles non-JSON responses instead of crashing the React tree', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('Unexpected token <'); } });
    render(<App />);
    await screen.findByText('✕ Unexpected token <');
    expect(screen.getByRole('button', { name: 'Get weather' }).disabled).toBe(false);
  });

  it('handles an incomplete success payload and keeps retry available', async () => {
    fetch.mockResolvedValue(response({}));
    render(<App />);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^✕ /));
    expect(slot('architecture').textContent).toBe('Use the button to try again.');
    expect(screen.getByRole('button', { name: 'Get weather' }).disabled).toBe(false);
  });

  it('clears prior values on refresh and on a later error, retaining all result slots', async () => {
    const next = pending();
    fetch.mockResolvedValueOnce(response()).mockReturnValueOnce(next.promise);
    render(<App />);
    await updated();
    fireEvent.click(screen.getByRole('button', { name: 'Get weather' }));
    expect(screen.getByRole('status').textContent).toBe('Fetching weather…');
    for (const id of ['message', 'weather', 'architecture', 'timestamp']) expect(slot(id).textContent).toBe('');
    await act(async () => next.resolve(response({ error: 'Temporarily unavailable' }, 502)));
    await screen.findByText('✕ Temporarily unavailable');
    expect(document.querySelectorAll('.result-slot')).toHaveLength(4);
    expect(slot('message').textContent).toBe('');
    expect(slot('weather').textContent).toBe('');
    expect(slot('timestamp').textContent).toBe('');
  });

  it('suppresses concurrent refreshes and does not refetch on rerender', async () => {
    const first = pending();
    fetch.mockReturnValue(first.promise);
    const { result, rerender } = renderHook(() => useWeather());
    act(() => { result.current.refresh(); result.current.refresh(); });
    rerender();
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => first.resolve(response()));
    expect(result.current.phase).toBe('success');
  });

  it('aborts the pending request on unmount', () => {
    fetch.mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<App />);
    const signal = fetch.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('ignores an older lifecycle response even if the transport ignores abort', async () => {
    const old = pending(), current = pending();
    fetch.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    render(<StrictMode><App /></StrictMode>);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => current.resolve(response({ ...fixture, weather: { ...fixture.weather, temperature: 27 } })));
    await updated();
    expect(slot('message').textContent).toContain('27 °C');
    await act(async () => old.resolve(response({ ...fixture, weather: { ...fixture.weather, temperature: -9 } })));
    expect(slot('message').textContent).toContain('27 °C');
    expect(screen.getByRole('button', { name: 'Get weather' }).disabled).toBe(false);
  });

  it('renders external text literally rather than interpreting HTML', async () => {
    fetch.mockResolvedValue(response({ ...fixture, message: '<img src=x onerror=alert(1)>' }));
    const { container } = render(<App />);
    await updated();
    expect(slot('message').textContent).toContain('<img src=x onerror=alert(1)>');
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('Feature 003 — parity against the frozen 79d1185 baseline', () => {
  it('retains the exact original stylesheet, including reserved geometry and accessibility CSS', () => {
    const css = readFileSync(resolve('src/styles.css'));
    const hash = createHash('sha1').update(`blob ${css.length}\0`).update(css).digest('hex');
    expect(hash).toBe('d9a837a08a18436b40c93196baf434ad76f5e424');
  });

  it('preserves the original semantic tree, selectors, skeletons, labels and links', () => {
    fetch.mockReturnValue(new Promise(() => {}));
    const baseline = new DOMParser().parseFromString(readFileSync(resolve('test/fixtures/v008-index.html'), 'utf8'), 'text/html');
    const { container } = render(<App />);
    const signature = node => ({
      tag: node.tagName,
      attrs: Object.fromEntries(['id', 'class', 'role', 'aria-live', 'aria-hidden', 'aria-label', 'aria-busy', 'href']
        .filter(name => node.hasAttribute(name)).map(name => [name, node.getAttribute(name)])),
      disabled: node.tagName === 'BUTTON' ? node.disabled : undefined,
      children: [...node.children].map(signature),
    });
    expect(signature(container.querySelector('main'))).toEqual(signature(baseline.querySelector('main')));
    for (const selector of ['.badge', 'p.badge', 'h1', '.lead', '.label', '#status', '#call']) {
      expect(container.querySelector(selector).textContent).toBe(baseline.querySelector(selector).textContent);
    }
    const normalize = text => text.replace(/\s+/g, ' ').trim();
    expect(normalize(container.querySelector('footer').textContent))
      .toBe(normalize(baseline.querySelector('footer').textContent).replace('Frontend · HTTP', 'Frontend · React · HTTP'));
  });
});
