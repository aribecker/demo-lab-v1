import { copyFile, mkdir } from 'node:fs/promises';

// Static route entry points preserve direct entry and reload on Render.
// React Router still owns navigation, history, and the rendered page.
for (const route of ['weather', 'components', 'login', 'hello-world', 'bitcoin', 'people']) {
  await mkdir(`dist/${route}`, { recursive: true });
  await copyFile('dist/index.html', `dist/${route}/index.html`);
}
await copyFile('dist/index.html', 'dist/404.html');


