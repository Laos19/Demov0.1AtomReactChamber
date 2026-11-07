#!/usr/bin/env node
// Genera site/index.html: portada de la documentación técnica en GitHub Pages.
// Detecta qué secciones existen en site/ y enlaza solo a esas.
// Uso: node scripts/pages/build-index.mjs [carpetaSitio=site]
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const site = process.argv[2] ?? 'site';
const repo = process.env.GITHUB_REPOSITORY ?? 'laos19/demov0.1atomreactchamber';
const sha = (process.env.GITHUB_SHA ?? 'local').slice(0, 7);
const runUrl = process.env.GITHUB_RUN_ID
  ? `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null;
const fecha = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Lima',
}).format(new Date());

const has = (p) => existsSync(join(site, p));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sections = [
  {
    path: 'app/',
    title: 'Demo interactiva',
    desc: 'El laboratorio AtomReactChamber en modo demo (sin servidor): misiones, Quimi y tabla periódica.',
    tag: 'Aplicación',
  },
  {
    path: 'api/',
    title: 'Referencia de código (TypeDoc)',
    desc: 'API del backend Fastify y módulos del frontend generados desde los comentarios TSDoc.',
    tag: 'Código',
  },
  {
    path: 'db/',
    title: 'Base de datos',
    desc: 'Diagrama entidad-relación y diccionario de datos generados con tbls desde PostgreSQL 16 migrado con Liquibase.',
    tag: 'Datos',
  },
  {
    path: 'diagramas/',
    title: 'Diagramas de arquitectura',
    desc: 'Diagramas de clases, componentes y despliegue en Mermaid.',
    tag: 'Arquitectura',
  },
  {
    path: 'reportes/',
    title: 'Reportes de automatizaciones',
    desc: 'Pruebas superadas, costos de infraestructura, migraciones y copias de seguridad de la última ejecución.',
    tag: 'Calidad',
  },
  {
    path: 'docs/',
    title: 'Documentos del proyecto',
    desc: 'Documentos FD, estándar de programación, manuales y guía de automatizaciones.',
    tag: 'Documentos',
  },
].filter((s) => has(s.path));

// Subreportes disponibles (para listarlos bajo la tarjeta de reportes).
const reportes = has('reportes')
  ? readdirSync(join(site, 'reportes'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  : [];

const cards = sections
  .map((s) => {
    const extra =
      s.path === 'reportes/' && reportes.length
        ? `<ul class="sub">${reportes.map((r) => `<li><a href="reportes/${esc(r)}/">${esc(r.replace(/-/g, ' '))}</a></li>`).join('')}</ul>`
        : '';
    return `<article class="card">
  <span class="tag">${esc(s.tag)}</span>
  <h2><a href="${esc(s.path)}">${esc(s.title)}</a></h2>
  <p>${esc(s.desc)}</p>${extra}
</article>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AtomReactChamber · Documentación técnica</title>
<meta name="description" content="Documentación técnica, demo y reportes de AtomReactChamber, laboratorio virtual de química gamificado.">
<style>
:root{--bg:#fbfaf7;--fg:#1d2330;--muted:#5b6474;--line:#e3e0d8;--card:#ffffff;--accent:#0f766e}
@media (prefers-color-scheme:dark){:root{--bg:#12151c;--fg:#e7e9ee;--muted:#9aa3b2;--line:#2a2f3a;--card:#191d26;--accent:#5eead4}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1040px;margin:0 auto;padding:48px 16px 64px}
h1{font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.15;margin:0 0 8px}
.lead{color:var(--muted);max-width:60ch;margin:0 0 32px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px}
.card h2{font-size:1.15rem;margin:6px 0 6px}.card p{margin:0;color:var(--muted)}
.card a{color:var(--fg);text-decoration:none}.card a:hover{color:var(--accent);text-decoration:underline}
.tag{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);font-weight:600}
.sub{margin:10px 0 0;padding-left:18px;font-size:.92rem}.sub a{color:var(--accent)}
footer{margin-top:40px;color:var(--muted);font-size:.875rem;border-top:1px solid var(--line);padding-top:16px}
footer a{color:var(--accent)}
</style>
</head>
<body>
<main>
<h1>AtomReactChamber</h1>
<p class="lead">Laboratorio virtual de química gamificado para 1.º a 5.º de secundaria (Ciencia y Tecnología, CNEB).
Curso Base de Datos II · Universidad Privada de Tacna.</p>
<section class="grid">
${cards || '<p>Aún no hay secciones publicadas.</p>'}
</section>
<footer>
Generado automáticamente el ${esc(fecha)} (hora de Lima) desde el commit
<a href="https://github.com/${esc(repo)}/commit/${esc(sha)}"><code>${esc(sha)}</code></a>${runUrl ? ` · <a href="${esc(runUrl)}">ejecución del workflow</a>` : ''}
· <a href="https://github.com/${esc(repo)}">repositorio</a>
</footer>
</main>
</body>
</html>
`;

writeFileSync(join(site, 'index.html'), html);
writeFileSync(join(site, '.nojekyll'), '');
console.log(`✔ ${join(site, 'index.html')} con ${sections.length} secciones`);
