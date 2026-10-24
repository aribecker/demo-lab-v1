// Only specification Markdown is bundled. No runtime repository or backend access.
const sources = import.meta.glob('../../specs/**/*.md', { query: '?raw', import: 'default' });
export const specifications = Object.entries(sources)
  .map(([path, read]) => ({ path: path.replace('../../', ''), read }))
  .sort((a, b) => a.path.localeCompare(b.path));
