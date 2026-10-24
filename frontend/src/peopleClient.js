const backend = import.meta.env.VITE_WEATHER_API_URL;
export const PEOPLE_API_URL = (backend?.startsWith('http') ? new URL(backend).origin : '').replace(/\/$/, '');
async function request(path, { signal, body } = {}) {
  const response = await fetch(`${PEOPLE_API_URL}/api/people${path}`, {
    method: body ? 'POST' : 'GET', signal, credentials: 'omit', cache: 'no-store',
    headers: { Accept: 'application/json', ...(body && { 'Content-Type': 'application/json' }) },
    ...(body && { body: JSON.stringify(body) }),
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error('The shared backend may be waking up. Please refresh the list.'); }
  if (!response.ok) throw new Error(data.message || 'The people service could not complete this request.');
  return data;
}
export const listPeople = (before, signal) => request(before ? `?before=${encodeURIComponent(before)}` : '', { signal });
export const addPerson = (name, requestId, signal) => request('', { body: { name, requestId }, signal });
