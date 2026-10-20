import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_POLICY, loadWeather, WEATHER_URL } from '../weatherClient.js';
import { json, sample } from './fixture.js';

afterEach(() => vi.useRealTimers());
const quick = { initialDelayMs: 10, maxDelayMs: 20, totalMs: 100, attemptMs: 30, maxAttempts: 3 };

describe('weather API client', () => {
  it('requests the configured JSON endpoint and returns the validated contract', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json());
    expect(await loadWeather({ fetchImpl })).toEqual(sample);
    expect(fetchImpl).toHaveBeenCalledWith(WEATHER_URL, expect.objectContaining({
      method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store', signal: expect.any(AbortSignal),
    }));
    expect(DEFAULT_POLICY).toEqual({ totalMs: 180000, attemptMs: 45000, maxAttempts: 20, initialDelayMs: 2000, maxDelayMs: 8000 });
  });

  it('waits through Render startup HTML and reports retry progress', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('<html>Starting</html>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(json());
    const progress = vi.fn();
    const result = loadWeather({ fetchImpl, onProgress: progress, policy: quick });
    await vi.runAllTimersAsync();
    expect(await result).toEqual(sample);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(progress).toHaveBeenCalledWith(expect.stringContaining('Waking'));
  });

  it.each([429, 502, 503, 504])('retries platform status %s', async status => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockResolvedValueOnce(json({ message: 'starting' }, status)).mockResolvedValueOnce(json());
    const result = loadWeather({ fetchImpl, policy: quick });
    await vi.runAllTimersAsync();
    expect(await result).toEqual(sample);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries a network failure', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce(json());
    const result = loadWeather({ fetchImpl, policy: quick });
    await vi.runAllTimersAsync();
    expect(await result).toEqual(sample);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry an explicit provider error even with a transient HTTP status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ code: 'PROVIDER_UNAVAILABLE', retryable: false,
      message: 'Please try again.', requestId: sample.requestId }, 502));
    await expect(loadWeather({ fetchImpl })).rejects.toMatchObject({ message: 'Please try again.', requestId: sample.requestId });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([{ ...sample, humidityPercent: 150 }, { ...sample, observedAt: 'yesterday' },
    { ...sample, providerUrl: 'javascript:alert(1)' }, { ...sample, temperatureC: null }, { ...sample, dataType: 'observation' }])(
    'fails clearly on invalid success data', async bad => {
      const fetchImpl = vi.fn().mockResolvedValue(json(bad));
      await expect(loadWeather({ fetchImpl })).rejects.toThrow('incomplete or invalid');
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

  it('fails clearly on malformed application JSON success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{bad', { headers: { 'Content-Type': 'application/json' } }));
    await expect(loadWeather({ fetchImpl })).rejects.toThrow('unreadable JSON');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('stops after the attempt cap', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('network'));
    const result = expect(loadWeather({ fetchImpl, policy: quick })).rejects.toThrow('did not become ready');
    await vi.runAllTimersAsync();
    await result;
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('enforces per-attempt timeout and the total deadline', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
    }));
    const started = Date.now();
    const result = expect(loadWeather({ fetchImpl, policy: { ...quick, totalMs: 50 } })).rejects.toThrow('did not become ready');
    await vi.runAllTimersAsync();
    await result;
    expect(Date.now() - started).toBe(50);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('cancels a pending fetch without retrying', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
    }));
    const result = expect(loadWeather({ fetchImpl, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await result;
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('cancels the wait between retries', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('network'));
    const result = expect(loadWeather({ fetchImpl, signal: controller.signal, policy: quick })).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(1);
    controller.abort();
    await result;
    await vi.runAllTimersAsync();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
