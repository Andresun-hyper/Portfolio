import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(scriptPath), '..');
const projectRoot = path.resolve(appRoot, '..');
const distRoot = path.resolve(appRoot, 'dist');

function assertInside(parent, target) {
  const relative = path.relative(parent, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parent}: ${target}`);
  }
}

function ensureDir(dir) {
  assertInside(projectRoot, dir);
  fs.mkdirSync(dir, { recursive: true });
}

function copyEntry(src, dest) {
  assertInside(projectRoot, dest);
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyEntry(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(distRoot)) {
  throw new Error(`Missing dist directory: ${distRoot}`);
}

for (const entry of fs.readdirSync(distRoot)) {
  const src = path.join(distRoot, entry);
  const dest = path.join(projectRoot, entry);
  copyEntry(src, dest);
}

const htmlPath = path.join(distRoot, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(
  /<link rel="stylesheet" crossorigin href="\.\/assets\/([^"]+\.css)">/g,
  (_, file) => {
    const cssPath = path.join(distRoot, 'assets', file);
    const css = fs.readFileSync(cssPath, 'utf8');
    return `<style data-inline="${file}">\n${css}\n</style>`;
  },
);

html = html.replace(
  /<script type="module" crossorigin src="\.\/assets\/([^"]+\.js)"><\/script>/g,
  (_, file) => {
    const jsPath = path.join(distRoot, 'assets', file);
    const js = fs.readFileSync(jsPath, 'utf8');
    return `<script type="module" data-inline="${file}">\n${js}\n</script>`;
  },
);

const output = path.join(projectRoot, 'index.html');
fs.writeFileSync(output, html, 'utf8');
console.log(`Standalone portfolio written to ${output}`);
