export function createHelloController({ button, message, fetcher = globalThis.fetch }) {
  return async function loadHello() {
    if (button.disabled) return;
    button.disabled = true;
    message.textContent = 'Cargando…';
    try {
      const response = await fetcher('/api/hello', { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('HTTP error');
      const data = await response.json();
      if (typeof data.message !== 'string' || !data.message.trim()) throw new Error('Invalid response');
      message.textContent = data.message;
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
