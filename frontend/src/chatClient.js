const API = (import.meta.env.VITE_CHAT_API_URL || import.meta.env.VITE_WEATHER_API_URL?.replace(/\/api\/weather\/?$/, '') || 'https://ariel-weather-api-iteration-2.onrender.com').replace(/\/$/, '');
async function request(path, signal, body) {
  const response = await fetch(`${API}/api/chat${path}`, {
    method: body ? 'POST' : 'GET', credentials: 'omit', signal,
    headers: { Accept: 'application/json', ...(body && { 'Content-Type': 'application/json' }) },
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'No se pudo conectar con el chatbot.');
  return data;
}
export const loadModels = signal => request('/models', signal);
export const sendChat = (body, signal) => request('', signal, body);
