#!/usr/bin/env node
// Convierte una carpeta de Markdown a HTML estático para GitHub Pages.
// - Reescribe enlaces *.md → *.html
// - Renderiza bloques ```mermaid con Mermaid (CDN)
// - Copia el resto de archivos (svg, png, mmd, …)
// - README.md también se publica como index.html; si no hay, genera un índice.
//
// Uso: node scripts/pages/render-markdown.mjs <origen> <destino> [título]
// Requiere el paquete "marked". En CI se instala aparte y se indica con
// MARKED_MODULE=/ruta/node_modules/marked/lib/marked.esm.js
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const [src, dst, title = 'Documentación'] = process.argv.slice(2);
if (!src || !dst) {
  console.error('Uso: render-markdown.mjs <origen> <destino> [título]');
  process.exit(2);
}
if (!existsSync(src)) {
  console.warn(`⚠️  ${src} no existe; nada que renderizar.`);
  process.exit(0);
}

const markedPath = process.env.MARKED_MODULE;
const { marked } = await import(markedPath ? pathToFileURL(markedPath).href : 'marked');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderer = new marked.Renderer();
const baseCode = renderer.code.bind(renderer);
renderer.code = function (token, ...rest) {
  const lang = typeof token === 'object' ? token.lang : rest[0];
  const text = typeof token === 'object' ? token.text : token;
  if (lang === 'mermaid') return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
  return baseCode(token, ...rest);
};
marked.use({ renderer, gfm: true });

export const page = (pageTitle, body, depth = 0) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pageTitle)} · AtomReactChamber</title>
<style>
:root{--bg:#fbfaf7;--fg:#1d2330;--muted:#5b6474;--line:#e3e0d8;--accent:#0f766e;--code:#f1efe9}
@media (prefers-color-scheme:dark){:root{--bg:#12151c;--fg:#e7e9ee;--muted:#9aa3b2;--line:#2a2f3a;--accent:#5eead4;--code:#1b1f29}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{border-bottom:1px solid var(--line);padding:12px 16px}header a{color:var(--accent);text-decoration:none;font-weight:600}
main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}a{color:var(--accent)}
table{border-collapse:collapse;display:block;overflow-x:auto;margin:1em 0}th,td{border:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}
th{background:var(--code)}code,pre{background:var(--code);border-radius:6px;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
code{padding:1px 5px}pre{padding:12px;overflow-x:auto}pre code{padding:0}img{max-width:100%;height:auto}
pre.mermaid{background:transparent;text-align:center}
</style>
</head>
<body>
<header><a href="${'../'.repeat(depth) || './'}">← AtomReactChamber · Documentación técnica</a></header>
<main>
${body}
</main>
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: true, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default' });
</script>
</body>
</html>
`;

const rewriteLinks = (html) =>
  html.replace(/(href=")([^"#?]+)\.md([#?][^"]*)?"/g, (_m, a, path, tail = '') =>
    /^[a-z]+:\/\//i.test(path) ? `${a}${path}.md${tail}"` : `${a}${path}.html${tail}"`,
  );

// Profundidad respecto a la raíz del sitio (dst se asume un nivel bajo site/).
const siteDepth = Number(process.env.SITE_DEPTH ?? 1);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

function walkDirs(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => [join(dir, d.name), ...walkDirs(join(dir, d.name))]);
}

const files = walk(src);
const pages = [];
for (const file of files) {
  const rel = relative(src, file);
  const out = join(dst, rel);
  mkdirSync(dirname(out), { recursive: true });
  if (extname(file).toLowerCase() !== '.md') {
    copyFileSync(file, out);
    continue;
  }
  const md = readFileSync(file, 'utf8');
  const h1 = md.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? basename(file, '.md');
  const depth = siteDepth + rel.split(/[\\/]/).length - 1;
  const html = page(h1, rewriteLinks(marked.parse(md)), depth);
  const outHtml = out.replace(/\.md$/i, '.html');
  writeFileSync(outHtml, html);
  pages.push({ rel: relative(dst, outHtml), title: h1 });
  if (basename(file).toLowerCase() === 'readme.md') {
    writeFileSync(join(dirname(out), 'index.html'), html);
  }
}

// Genera index.html en cada carpeta que no tenga uno (listado de páginas y archivos).
const dirs = [dst, ...walkDirs(dst)];
for (const dir of dirs) {
  if (existsSync(join(dir, 'index.html'))) continue;
  const depth = siteDepth + (relative(dst, dir) ? relative(dst, dir).split(/[\\/]/).length : 0);
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.name !== 'index.html' && !d.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => {
      const href = d.isDirectory() ? `${d.name}/` : d.name;
      const own = pages.find((p) => join(dst, p.rel) === join(dir, d.name));
      const label = own ? own.title : href;
      return `<li><a href="${encodeURI(href)}">${escapeHtml(label)}</a>${own ? ` <small>${escapeHtml(d.name)}</small>` : ''}</li>`;
    })
    .join('\n');
  const heading = dir === dst ? title : `${title} · ${relative(dst, dir)}`;
  writeFileSync(join(dir, 'index.html'), page(heading, `<h1>${escapeHtml(heading)}</h1>\n<ul>\n${entries}\n</ul>`, depth));
}
console.log(`✔ ${pages.length} páginas Markdown → ${dst}`);
