export function createHelloController({ button, message, fetcher = globalThis.fetch }) {
  return async function loadHello() {
    if (button.disabled) return;
    button.disabled = true;
    message.textContent = 'Cargando…';
    try {
      const response = await fetcher('/api/hello', { signal: AbortSignal.timeout(10000), cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP error');
      const data = await response.json();
      if (typeof data.message !== 'string' || !data.message.trim()) throw new Error('Invalid response');
      if (typeof data.timestamp !== 'string' || !data.timestamp.endsWith('Z') || !Number.isFinite(Date.parse(data.timestamp))) throw new Error('Invalid timestamp');
      message.textContent = `${data.message} · Timestamp (UTC): ${data.timestamp}`;
    } catch {
      message.textContent = 'No pudimos obtener el saludo. Inténtalo de nuevo.';
    } finally {
      button.disabled = false;
    }
  };
}

if (typeof document !== 'undefined') {
  const button = document.getElementById('hello-button');
  const message = document.getElementById('message');
  button.addEventListener('click', createHelloController({ button, message }));
}
