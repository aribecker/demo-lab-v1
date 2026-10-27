import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import BitcoinTracker from '../BitcoinTracker.jsx';
import App from '../App.jsx';
import { loadBitcoin, BITCOIN_URL } from '../bitcoinClient.js';
import { appendSample } from '../useBitcoin.js';
import { sharedSnapshot } from './sharedFixture.js';

const quote = price => ({ price, retrievedAt: new Date().toISOString() });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const flush = () => act(async () => { await Promise.resolve(); });

describe('Bitcoin tracking lifecycle', () => {
  it('loads immediately, polls every ten seconds, pauses/resumes and aborts on exit', async () => {
    vi.useFakeTimers();
    const signals = [];
    const loader = vi.fn(({ signal }) => { signals.push(signal); return Promise.resolve(quote(80000 + signals.length)); });
    const view = render(<BitcoinTracker loader={loader} />);
    await flush();
    expect(loader).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(9999));
    expect(loader).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(loader).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('img')).toHaveAccessibleName(/2 readings/);
    fireEvent.click(screen.getByRole('button', { name: 'Pause tracking' }));
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(loader).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Resume tracking' }));
    await flush();
    expect(loader).toHaveBeenCalledTimes(3);
    view.unmount();
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(loader).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('prevents overlap and cancels pending requests on pause and unmount', async () => {
    vi.useFakeTimers();
    const requests = [];
    const loader = vi.fn(options => new Promise(resolve => requests.push({ ...options, resolve })));
    const view = render(<BitcoinTracker loader={loader} />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh now' }));
    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(loader).toHaveBeenCalledTimes(1);
    expect(requests[0].signal.aborted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Pause tracking' }));
    await act(() => requests[0].resolve(quote(1)));
    expect(screen.queryByText('1.00 USDT')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume tracking' }));
    view.unmount();
    expect(requests[1].signal.aborted).toBe(true);
  });

  it('suspends hidden-tab requests and resumes when visible', async () => {
    vi.useFakeTimers();
    let visibility = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    const loader = vi.fn().mockResolvedValue(quote(80000));
    render(<BitcoinTracker loader={loader} />);
    await flush();
    visibility = 'hidden';
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(loader).toHaveBeenCalledTimes(1);
    visibility = 'visible';
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await flush();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('keeps a stale quote after failure and recovers on the next tick', async () => {
    vi.useFakeTimers();
    const loader = vi.fn().mockResolvedValueOnce(quote(80000)).mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValue(quote(81000));
    render(<BitcoinTracker loader={loader} />);
    await flush();
    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(screen.getByRole('status')).toHaveTextContent('stale');
    expect(screen.getAllByText('80,000.00 USDT').length).toBeGreaterThan(0);
    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(screen.getByRole('status')).not.toHaveTextContent('stale');
    expect(screen.getByText(/1.250%/)).toBeInTheDocument();
  });

  it('shows timeout errors and permits the next automatic retry', async () => {
    vi.useFakeTimers();
    const loader = vi.fn(({ signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })));
    render(<BitcoinTracker loader={loader} />);
    await act(() => vi.advanceTimersByTimeAsync(8000));
    expect(screen.getByRole('status')).toHaveTextContent('timed out');
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('bounds history to 180 real readings', () => {
    let history = [];
    for (let i = 0; i < 200; i++) history = appendSample(history, quote(i + 1));
    expect(history).toHaveLength(180);
    expect(history[0].price).toBe(21);
    expect(history.at(-1).price).toBe(200);
  });

  it('integrates shared menu navigation and cancels view polling on route exit', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => sharedSnapshot() });
    vi.stubGlobal('fetch', fetcher);
    render(<MemoryRouter><App authApi={{initialize:async()=>null,profile:async()=>null}} /></MemoryRouter>);
    expect(fetcher).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('link', { name: 'Bitcoin Tracker', exact: true }));
    await flush();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bitcoin Tracker.');
    expect(fetcher).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('link', { name: 'Bitcoin Tracker', exact: true })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('link', { name: 'Home', exact: true }));
    await act(() => vi.advanceTimersByTimeAsync(20000));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('public Binance client', () => {
  it('validates the public response and never sends credentials', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ price: '80000.12', symbol: 'BTCUSDT' }) });
    vi.stubGlobal('fetch', fetcher);
    expect(await loadBitcoin()).toEqual({ price: 80000.12, retrievedAt: expect.any(String) });
    expect(fetcher).toHaveBeenCalledWith(BITCOIN_URL, expect.objectContaining({ cache: 'no-store', credentials: 'omit' }));
  });
  it.each(['', 'NaN', 'Infinity', '-10', null, '0', true])('rejects invalid price %s', async amount => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ price: amount, symbol: 'BTCUSDT' }) }));
    await expect(loadBitcoin()).rejects.toThrow('invalid');
  });
  it.each([429, 500])('reports HTTP %s honestly', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(loadBitcoin()).rejects.toThrow(status === 429 ? /rate limit/ : /HTTP 500/);
  });
  it('rejects a mismatched trading pair', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ price: '80000', symbol: 'BTCEUR' }) }));
    await expect(loadBitcoin()).rejects.toThrow('invalid');
  });
});
