import { bearerHeaders, accessDenied } from './authClient.js';
import { BACKEND_API_URL } from './backendConfig.js';

async function read(path, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 90000);
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/database${path}`, {
      signal: controller.signal, credentials: 'omit', cache: 'no-store', headers: { ...bearerHeaders(), Accept: 'application/json' },
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('The backend may be waking up. Please retry in a moment.'); }
    if (!response.ok) { accessDenied(response.status); throw new Error(data.message || 'The database could not be read. Please retry.'); }
    return data;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
export const loadDatabase = signal => read('', signal);
export const loadTable = (schema, table, offset = 0, signal) => read(`/rows?${new URLSearchParams({ schema, table, offset: String(offset), limit: '25' })}`, signal);
