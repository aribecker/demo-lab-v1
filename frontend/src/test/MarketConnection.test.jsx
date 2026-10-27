import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MarketTracker from '../MarketTracker.jsx';
import { readMarket, MARKET_TIMEOUT_MS, MARKET_WAIT_MESSAGE } from '../marketClient.js';
import { sharedSnapshot } from './sharedFixture.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const reply = () => ({ ok: true, json: async () => sharedSnapshot() });
function waitingFetch() {
  return vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('signal is aborted without reason', 'AbortError')), { once: true });
  }));
}

it('accepts a waking backend response after the former twelve-second deadline', async () => {
  vi.useFakeTimers();
  let answer;
  const fetcher = vi.fn(() => new Promise(resolve => { answer = resolve; }));
  vi.stubGlobal('fetch', fetcher);
  const pending = readMarket();
  await vi.advanceTimersByTimeAsync(20_000);
  expect(fetcher.mock.calls[0][1].signal.aborted).toBe(false);
  answer(reply());
  await expect(pending).resolves.toEqual(sharedSnapshot());
  expect(vi.getTimerCount()).toBe(0);
});

it('replaces the browser abort text with a recoverable timeout message', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', waitingFetch());
  const result = readMarket().catch(error => error);
  await vi.advanceTimersByTimeAsync(MARKET_TIMEOUT_MS);
  expect((await result).message).toBe(MARKET_WAIT_MESSAGE);
  expect(vi.getTimerCount()).toBe(0);
});

it('cancels immediately when the caller leaves and never fetches for an already cancelled signal', async () => {
  vi.useFakeTimers();
  const fetcher = waitingFetch();
  vi.stubGlobal('fetch', fetcher);
  const controller = new AbortController();
  const result = readMarket({ signal: controller.signal }).catch(error => error);
  controller.abort();
  expect((await result).name).toBe('AbortError');
  await expect(readMarket({ signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('automatically reconnects after timeout using reads only and clears the connection error', async () => {
  vi.useFakeTimers();
  let recover;
  const fetcher = waitingFetch().mockImplementationOnce((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('signal is aborted without reason', 'AbortError')), { once: true });
  })).mockImplementationOnce(() => new Promise(resolve => { recover = resolve; }));
  vi.stubGlobal('fetch', fetcher);
  render(<MarketTracker api={{ read: readMarket }} />);
  expect(screen.getByRole('status')).toHaveTextContent('backend may take a minute');
  await act(() => vi.advanceTimersByTimeAsync(MARKET_TIMEOUT_MS));
  expect(screen.getByRole('alert')).toHaveTextContent(MARKET_WAIT_MESSAGE);
  await act(() => vi.advanceTimersByTimeAsync(3_000));
  await act(async () => { recover(reply()); });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Bitcoin price tracker' })).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const [, options] of fetcher.mock.calls) {
    expect(options.method).toBeUndefined();
    expect(options.body).toBeUndefined();
  }
});

it('normalizes network and unreadable startup responses without exposing browser errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce({ ok: true, json: async () => { throw new SyntaxError('Unexpected HTML'); } }));
  await expect(readMarket()).rejects.toThrow(MARKET_WAIT_MESSAGE);
  await expect(readMarket()).rejects.toThrow(MARKET_WAIT_MESSAGE);
});
