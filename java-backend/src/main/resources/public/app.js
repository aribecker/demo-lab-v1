const card = document.querySelector('#weather-card');
const statusEl = document.querySelector('#status');
const message = document.querySelector('#message .slot-text');
const architecture = document.querySelector('#architecture .slot-text');
const timestamp = document.querySelector('#timestamp .slot-text');
const button = document.querySelector('#call');
const details = document.querySelector('#weather .slot-text');

async function callApi() {
  if (card.dataset.requestActive === 'true') return;
  card.dataset.requestActive = 'true';
  statusEl.textContent = 'Consultando clima…';
  button.disabled = true;
  for (const slot of [message, details, architecture, timestamp]) slot.textContent = '';
  card.classList.add('is-loading');
  card.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/api/hello', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    const weather = data.weather;
    statusEl.textContent = '✓ Clima actualizado';
    message.textContent = `${data.message} · ${weather.temperature} °C · ${weather.location}`;
    details.textContent = `${weather.apparentTemperature === null ? '' : 'Sensación térmica: ' + weather.apparentTemperature + ' °C · '}Humedad: ${weather.humidity}% · Viento: ${weather.windSpeed} km/h · Fuente: ${weather.source}${weather.dataKind ? ' · ' + weather.dataKind : ''}`;
    architecture.textContent = data.architecture;
    const observed = weather.observedAt.endsWith('Z')
      ? new Date(weather.observedAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hourCycle: 'h23' })
      : weather.observedAt.replace('T', ' ');
    const queried = new Date(data.timestamp).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hourCycle: 'h23' });
    timestamp.textContent = `Datos: ${observed} (Buenos Aires) · Consulta: ${queried}`;
  } catch (error) {
    statusEl.textContent = `✕ ${error.message}`;
    architecture.textContent = 'Podés volver a intentar con el botón.';
  } finally {
    card.classList.remove('is-loading');
    card.setAttribute('aria-busy', 'false');
    card.dataset.requestActive = 'false';
    button.disabled = false;
  }
}
button.addEventListener('click', callApi);
callApi();
