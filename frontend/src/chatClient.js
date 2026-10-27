import { BACKEND_API_URL } from './backendConfig.js';
export const CHAT_API_URL = BACKEND_API_URL;
async function request(path, signal, body) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, body ? 60000 : 90000);
  try {
    const response = await fetch(`${CHAT_API_URL}/api/chat${path}`, {
      method: body ? 'POST' : 'GET', credentials: 'omit', cache: 'no-store', signal: controller.signal,
      headers: { Accept: 'application/json', ...(body && { 'Content-Type': 'application/json' }) },
      ...(body && { body: JSON.stringify(body) }),
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('El servidor puede estar iniciándose. Reintentá en unos segundos.'); }
    if (!response.ok) throw new Error(data.message || 'No se pudo conectar con el chatbot.');
    return data;
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
export const loadModels = signal => request('/models', signal);
export const sendChat = (body, signal) => request('', signal, body);
