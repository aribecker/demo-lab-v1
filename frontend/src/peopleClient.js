const API = (import.meta.env.VITE_PEOPLE_API_URL || 'https://ariel-sdd-people-api.onrender.com').replace(/\/$/, '');
async function request(path, { signal, body } = {}) {
  const response = await fetch(`${API}/api/people${path}`, {
    method: body ? 'POST' : 'GET', signal, credentials: 'omit', cache: 'no-store',
    headers: { Accept: 'application/json', ...(body && { 'Content-Type': 'application/json' }) },
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The people service could not complete this request.');
  return data;
}
export const listPeople = (before, signal) => request(before ? `?before=${encodeURIComponent(before)}` : '', { signal });
export const addPerson = (name, requestId, signal) => request('', { body: { name, requestId }, signal });
