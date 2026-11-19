#!/usr/bin/env node
/**
 * Genera documentos/index.html con la lista de PDF del proyecto para GitHub Pages.
 * Uso: node scripts/pages/build-documentos.mjs <carpeta-con-pdf>
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'site/documentos';
const nombres = {
  'ENTREGA-Unidad-II.pdf': 'Documento de entrega de la Unidad II (enlaces y evidencia por criterio)',
  'FD01-Informe-Factibilidad.pdf': 'FD01 · Informe de Factibilidad',
  'FD02-Informe-Vision.pdf': 'FD02 · Informe de Visión',
  'FD03-Informe-SRS.pdf': 'FD03 · Especificación de Requerimientos (SRS)',
  'FD04-Informe-SAD.pdf': 'FD04 · Arquitectura de Software (SAD)',
  'FD05-Informe-Final.pdf': 'FD05 · Informe Final',
  'diccionario-de-datos.pdf': 'Diccionario de datos',
  'estandar-de-programacion.pdf': 'Estándar de programación',
  'manual-de-usuario.pdf': 'Manual de usuario',
  'manual-tecnico.pdf': 'Manual técnico',
};
const orden = Object.keys(nombres);
const pdfs = readdirSync(dir).filter((f) => f.endsWith('.pdf'))
  .sort((a, b) => (orden.indexOf(a) + 1 || 99) - (orden.indexOf(b) + 1 || 99));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const li = pdfs.map((f) => `<li><a href="${encodeURI(f)}">${esc(nombres[f] ?? f)}</a></li>`).join('\n');
writeFileSync(join(dir, 'index.html'), `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AtomReactChamber · Documentos</title>
<style>:root{--t:#13233A;--p:#F4F7FB;--c:#0A7266}@media(prefers-color-scheme:dark){:root{--t:#E6EDF5;--p:#0E1A2B;--c:#2DC4B0}}
body{margin:0;background:var(--p);color:var(--t);font:17px/1.6 system-ui,sans-serif}main{max-width:46rem;margin:0 auto;padding:3rem 1rem}
a{color:var(--c);font-weight:700}li{margin:.5rem 0}</style></head>
<body><main><h1>AtomReactChamber · Documentos del proyecto</h1>
<p>Universidad Privada de Tacna · Base de Datos II · Adriana Rafaela Laos González (2023077474)</p>
<ul>
${li}
</ul>
<p><a href="../">Volver a la portada</a></p></main></body></html>
`);
console.log(`✔ ${join(dir, 'index.html')} con ${pdfs.length} documentos`);
