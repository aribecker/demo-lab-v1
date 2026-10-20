import { readFile } from 'node:fs/promises';

// Set this before importing React or Vite so the client receives production React.
process.env.NODE_ENV = 'production';
const [{ createElement }, { renderToString }, { build, createServer }] = await Promise.all([
  import('react'), import('react-dom/server'), import('vite'),
]);

// Use the same component tree for the initial HTML and the interactive page.
// This server exists during the build only; the deployed runtime remains Java.
const renderer = await createServer({
  mode: 'production',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});
let shell;
try {
  const { default: App } = await renderer.ssrLoadModule('/src/App.jsx');
  shell = renderToString(createElement(App));
} finally {
  await renderer.close();
}
await build({
  plugins: [{
    name: 'initial-weather-shell',
    transformIndexHtml: { order: 'post', handler: html => html.replace('<!--app-shell-->', shell) },
  }],
});
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
if (!html.includes('Version 0.0.8') || !html.includes('/app.js') || !html.includes('/styles.css')) {
  throw new Error('The packaged page must retain the version, initial shell and stable asset URLs.');
}
