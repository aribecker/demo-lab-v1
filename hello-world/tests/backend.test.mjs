import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

test('AC1, AC2, AC5: contratos HTTP reales', { timeout: 15000 }, async () => {
  const java = process.env.JAVA_HOME ? `${process.env.JAVA_HOME}/bin/java` : 'java';
  const server = spawn(java, ['--add-modules', 'jdk.httpserver', '-cp', 'build/classes', 'HelloServer'], {
    env: { ...process.env, PORT: '0', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '', errors = '';
  server.stdout.on('data', chunk => { output += chunk; });
  server.stderr.on('data', chunk => { errors += chunk; });
  try {
    for (let i = 0; i < 100 && !output.match(/puerto (\d+)/); i++) {
      if (server.exitCode !== null) throw new Error(`Servidor terminó: ${errors}`);
      await delay(50);
    }
    const match = output.match(/puerto (\d+)/);
    assert.ok(match, `Servidor no inició: ${errors}`);
    const base = `http://127.0.0.1:${match[1]}`;
    const before = Date.now();
    const hello = await fetch(`${base}/api/hello`);
    assert.equal(hello.status, 200);
    assert.match(hello.headers.get('content-type'), /^application\/json/);
    const greeting = await hello.json();
    assert.equal(greeting.message, 'Hello World!');
    assert.match(greeting.timestamp, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    const generatedAt = Date.parse(greeting.timestamp);
    assert.ok(generatedAt >= before && generatedAt <= Date.now());
    assert.equal(hello.headers.get('cache-control'), 'no-store');
    await delay(20);
    const next = await (await fetch(`${base}/api/hello`)).json();
    assert.ok(Date.parse(next.timestamp) > generatedAt);
    assert.notEqual(next.timestamp, greeting.timestamp);
    const page = await fetch(base);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Hello World/);
    assert.match(html, /id="hello-button"/);
    assert.match(html, /aria-live="polite"/);
    for (const [path, type] of [['/app.js', 'text/javascript'], ['/styles.css', 'text/css']]) {
      const asset = await fetch(base + path);
      assert.equal(asset.status, 200);
      assert.ok(asset.headers.get('content-type').startsWith(type));
      assert.ok((await asset.text()).length > 0);
    }
    for (const path of ['/missing', '/api/hello/extra', '/%2e%2e/backend/src/HelloServer.java']) {
      assert.equal((await fetch(base + path)).status, 404);
    }
    const post = await fetch(base + '/api/hello', { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('allow'), 'GET');
  } finally {
    if (server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill('SIGTERM');
      await exited;
    }
  }
});
