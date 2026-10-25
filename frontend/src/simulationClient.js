import { bearerHeaders, accessDenied } from './authClient.js';
import { BACKEND_API_URL } from './backendConfig.js';
const configured = import.meta.env.VITE_SIMULATION_API_URL;
export const SIMULATION_URL = configured || `${BACKEND_API_URL}/api/simulation`;

export function validateSnapshot(state) {
  if (state?.schemaVersion !== 1 || !Number.isSafeInteger(state.revision) || !Number.isSafeInteger(state.controlRevision)
    || typeof state.running !== 'boolean' || !Array.isArray(state.samples) || !state.simulation || !state.settings
    || !['inactive', 'holding_usdt', 'holding_btc'].includes(state.simulation.phase)
    || !['usdt', 'btc', 'feesEquivalent', 'capital', 'feePercent'].every(key => Number.isFinite(state.simulation[key]))) {
    throw new Error('The shared simulation returned an invalid snapshot.');
  }
  return state;
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 12000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store', credentials: 'omit',
      headers: { ...bearerHeaders(), Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
    let body;
    try { body = await response.json(); } catch { throw new Error('The shared server may be waking up. Waiting to reconnect.'); }
    if (!response.ok) {
      accessDenied(response.status);
      const error = new Error(body?.message || `Shared server unavailable (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return validateSnapshot(body);
  } finally {
    clearTimeout(timer); options.signal?.removeEventListener('abort', abort);
  }
}
export const readSimulation = ({ signal } = {}) => request(SIMULATION_URL, { signal });
export const sendSimulationCommand = command => request(`${SIMULATION_URL}/commands`, { method: 'POST', body: JSON.stringify(command) });

