import { BACKEND_API_URL } from './backendConfig.js';
export const MARKET_URL = `${BACKEND_API_URL}/api/bitcoin`;
export const MARKET_TIMEOUT_MS = 90_000;
export const MARKET_WAIT_MESSAGE = 'The market server is taking longer to respond. It may be waking up. Retrying automatically…';

export async function readMarket({ signal } = {}) {
  if (signal?.aborted) throw new DOMException('Request cancelled.', 'AbortError');
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, MARKET_TIMEOUT_MS);
  try {
    const response = await fetch(MARKET_URL, {
      signal: controller.signal, cache: 'no-store', credentials: 'omit', headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Market readings are unavailable. The server may be waking up. Retrying automatically…');
    const state = await response.json();
    if (!Number.isSafeInteger(state?.revision) || !Array.isArray(state.samples) || typeof state.running !== 'boolean') {
      throw new Error('Invalid market response.');
    }
    return state;
  } catch (failure) {
    if (signal?.aborted) throw new DOMException('Request cancelled.', 'AbortError');
    if (timedOut || failure?.name === 'AbortError' || failure instanceof TypeError || failure instanceof SyntaxError) {
      throw new Error(MARKET_WAIT_MESSAGE);
    }
    throw failure;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
