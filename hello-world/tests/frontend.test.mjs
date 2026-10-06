import test from 'node:test';
import assert from 'node:assert/strict';
import { createHelloController } from '../frontend/app.js';

const timestamp = '2026-10-06T15:00:00.123Z';
const expectedMessage = `Hello World! · Timestamp (UTC): ${timestamp}`;

test('AC3: carga, evita solicitudes duplicadas y muestra el saludo', async () => {
  const button = { disabled: false }, message = { textContent: '' };
  let finish, calls = 0;
  const fetcher = (url) => {
    assert.equal(url, '/api/hello');
    calls++;
    return new Promise(resolve => { finish = resolve; });
  };
  const load = createHelloController({ button, message, fetcher });
  const pending = load();
  assert.equal(button.disabled, true);
  assert.equal(message.textContent, 'Cargando…');
  await load();
  assert.equal(calls, 1);
  finish({ ok: true, json: async () => ({ message: 'Hello World!', timestamp }) });
  await pending;
  assert.equal(message.textContent, expectedMessage);
  assert.equal(button.disabled, false);
});

for (const [label, failure] of [
  ['HTTP', async () => ({ ok: false })],
  ['conexión', async () => { throw new Error('offline'); }],
  ['formato', async () => ({ ok: true, json: async () => ({}) })],
  ['timestamp ausente', async () => ({ ok: true, json: async () => ({ message: 'Hello World!' }) })],
  ['timestamp inválido', async () => ({ ok: true, json: async () => ({ message: 'Hello World!', timestamp: 'invalid' }) })],
  ['JSON inválido', async () => ({ ok: true, json: async () => { throw new SyntaxError(); } })],
]) {
  test(`AC4: error de ${label} permite reintentar`, async () => {
    const button = { disabled: false }, message = { textContent: '' };
    let attempts = 0;
    const load = createHelloController({ button, message, fetcher: (...args) => {
      return ++attempts === 1 ? failure(...args) : Promise.resolve({ ok: true, json: async () => ({ message: 'Hello World!', timestamp }) });
    } });
    await load();
    assert.match(message.textContent, /Inténtalo de nuevo/);
    assert.equal(button.disabled, false);
    await load();
    assert.equal(message.textContent, expectedMessage);
  });
}
