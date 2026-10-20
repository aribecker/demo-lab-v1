export const WEATHER_URL = import.meta.env.VITE_WEATHER_API_URL || '/api/weather';
export const DEFAULT_POLICY = Object.freeze({
  totalMs: 180_000, attemptMs: 45_000, maxAttempts: 20, initialDelayMs: 2_000, maxDelayMs: 8_000,
});

class WeatherError extends Error {
  constructor(message, retryable = false, requestId = '') {
    super(message);
    this.name = 'WeatherError';
    this.retryable = retryable;
    this.requestId = requestId;
  }
}

function abortError() { return new DOMException('Request cancelled.', 'AbortError'); }

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(abortError()); return; }
    const cancel = () => { clearTimeout(timer); reject(abortError()); };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, ms);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

function validate(data) {
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const instant = value => typeof value === 'string' && value.endsWith('Z') && Number.isFinite(Date.parse(value));
  const providers = { 'Open-Meteo': 'https://open-meteo.com/', 'MET Norway': 'https://www.met.no/' };
  if (!data || data.version !== '2.0.0' || data.city !== 'Buenos Aires, Argentina'
      || !finite(data.temperatureC) || !(data.feelsLikeC === null || finite(data.feelsLikeC))
      || !finite(data.humidityPercent) || data.humidityPercent < 0 || data.humidityPercent > 100
      || !finite(data.windKmh) || data.windKmh < 0 || !instant(data.observedAt) || !instant(data.requestedAt)
      || data.timezone !== 'America/Argentina/Buenos_Aires'
      || !Object.hasOwn(providers, data.provider) || data.providerUrl !== providers[data.provider]
      || data.dataType !== (data.provider === 'Open-Meteo' ? 'current model data' : 'nearest-hour forecast')
      || typeof data.requestId !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(data.requestId)) {
    throw new WeatherError('The weather service returned incomplete or invalid data. Please try again.');
  }
  return data;
}

async function attempt(fetchImpl, signal, timeoutMs) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) throw abortError();
  signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetchImpl(WEATHER_URL, {
      method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal,
    });
    if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      throw new WeatherError('The weather service is starting.', true);
    }
    let data;
    try { data = await response.json(); }
    catch {
      throw new WeatherError('The weather service returned unreadable JSON. Please try again.',
        !response.ok && [429, 502, 503, 504].includes(response.status));
    }
    if (!response.ok) {
      if (data?.retryable === false) {
        throw new WeatherError(typeof data.message === 'string' ? data.message : 'Weather is unavailable. Please try again.',
          false, typeof data.requestId === 'string' ? data.requestId : '');
      }
      throw new WeatherError('The weather service is temporarily unavailable.', [429, 502, 503, 504].includes(response.status));
    }
    return validate(data);
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (timedOut) throw new WeatherError('The weather service is taking longer to respond.', true);
    if (error instanceof WeatherError) throw error;
    throw new WeatherError('Waiting for a connection to the weather service.', true);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export async function loadWeather({ signal, onProgress = () => {}, fetchImpl = globalThis.fetch, policy = {} } = {}) {
  const limits = { ...DEFAULT_POLICY, ...policy };
  const deadline = Date.now() + limits.totalMs;
  for (let index = 0; index < limits.maxAttempts; index += 1) {
    if (signal?.aborted) throw abortError();
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    try {
      const data = await attempt(fetchImpl, signal, Math.min(limits.attemptMs, remaining));
      if (Date.now() >= deadline) break;
      return data;
    } catch (error) {
      if (error.name === 'AbortError' || !error.retryable) throw error;
      if (index + 1 >= limits.maxAttempts || Date.now() >= deadline) break;
      onProgress(`Waking the weather service… retrying (attempt ${index + 2}).`);
      const delay = Math.min(limits.initialDelayMs * (index + 1), limits.maxDelayMs, deadline - Date.now());
      await wait(delay, signal);
    }
  }
  throw new WeatherError('The weather service did not become ready in time. Please try again.');
}
