import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src');
const styles = path.join(source, 'styles');
const bem = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const cssImports = [];
for (const file of await readdir(source)) {
  if (!/\.(jsx|js)$/.test(file)) continue;
  const text = await readFile(path.join(source, file), 'utf8');
  for (const match of text.matchAll(/import\s+['"]([^'"]+\.css)['"]/g)) cssImports.push([file, match[1]]);
  if (!file.endsWith('.jsx')) continue;
  assert(!/\bstyle\s*=|<style\b|\b(?:stroke|fill)\s*=/.test(text), `${file}: presentation must use CSS`);
  for (const match of text.matchAll(/className="([^"]+)"/g)) {
    const classes = match[1].split(/\s+/);
    for (const name of classes) {
      assert(bem.test(name), `${file}: invalid BEM class ${name}`);
      if (name.includes('--')) assert(classes.includes(name.split('--')[0]), `${file}: modifier requires its base class`);
    }
  }
}
assert.deepEqual(cssImports, [['main.jsx', './styles/index.css']], 'Only main.jsx may import the central CSS entry');
const files = await readdir(styles);
const tokens = await readFile(path.join(styles, 'tokens.css'), 'utf8');
const allCss = (await Promise.all(files.map(file => readFile(path.join(styles, file), 'utf8')))).join('\n');
const defined = new Set([...allCss.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
for (const match of allCss.matchAll(/var\((--[\w-]+)/g)) assert(defined.has(match[1]), `Undefined token ${match[1]}`);
const entry = await readFile(path.join(styles, 'index.css'), 'utf8');
for (const file of files) {
  assert(file.endsWith('.css'));
  if (file !== 'index.css') assert(entry.includes(`"./${file}"`), `${file}: missing central import`);
  const text = await readFile(path.join(styles, file), 'utf8');
  if (file !== 'tokens.css') assert(!/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i.test(text), `${file}: color must use a token`);
  for (const match of text.matchAll(/\.([a-z][\w-]*)/g)) assert(bem.test(match[1]), `${file}: invalid selector ${match[1]}`);
  assert(!/#[a-z][\w-]*\s*[>{,:.\[]/i.test(text), `${file}: ID styling is forbidden`);
}
// R50 guards the responsive shared CRUD contract against the squeezed-title regression.
const records = await readFile(path.join(styles, 'records.css'), 'utf8');
const rule = selector => records.match(new RegExp(selector.replaceAll('.', '\\.') + '\\s*\\{([^}]+)\\}'))?.[1] ?? '';
assert(/flex-wrap\s*:\s*wrap/.test(rule('.record-list__item')), 'Record rows must wrap rather than squeeze names');
assert(/flex-wrap\s*:\s*wrap/.test(rule('.record-list__actions')), 'Record actions must wrap within their region');
for (const selector of ['.record-list__details', '.record-list__actions']) {
  assert(/min-width\s*:\s*0/.test(rule(selector)) && /max-width\s*:\s*100%/.test(rule(selector)), `${selector}: children must stay within the panel`);
}
assert(/flex\s*:\s*1\s+1\s+16rem/.test(rule('.record-list__details')), 'Record details must have space to grow');
assert(/@media\s*\(max-width\s*:\s*820px\)\s*\{\s*\.record-list__details\s*\{\s*flex-basis\s*:\s*100%;?\s*\}\s*\.record-list__actions\s*\{\s*width\s*:\s*100%;?\s*\}/.test(records), 'Small-screen record details and actions must each occupy a full row');
const colors = Object.fromEntries([...tokens.matchAll(/--color-([\w-]+):\s*(#[\da-f]{6});/g)].map(m => [m[1], m[2]]));
const specification = await readFile(path.join(root, '../specs/design-system.md'), 'utf8');
for (const [, value] of tokens.matchAll(/--color-[\w-]+:\s*([^;]+);/g)) assert(specification.includes(value.trim()), `Palette value absent from specification: ${value}`);
const luminance = hex => hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126,.7152,.0722][i], 0);
for (const [fg, bg, minimum] of [['text','surface',4.5],['text-secondary','surface-raised',4.5],['button-text','button',4.5],['button-text','surface-hover',4.5],['on-accent','accent',4.5],['button-border','surface',3],['focus','surface',3],['accent','surface',3],['accent','surface-hover',3]]) {
  const levels = [luminance(colors[fg]), luminance(colors[bg])].sort((a,b) => a-b);
  assert((levels[1]+.05)/(levels[0]+.05) >= minimum, `Insufficient contrast: ${fg}/${bg}`);
}
console.log(`Style contract passed: ${files.length} central CSS modules, BEM, import boundary, token resolution and 9 contrast pairs.`);
