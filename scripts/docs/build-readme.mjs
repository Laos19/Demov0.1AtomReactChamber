#!/usr/bin/env node
/**
 * Actualiza las secciones generadas del README.md (entre marcadores <!-- AUTO:x:inicio --> y <!-- AUTO:x:fin -->):
 * métricas del proyecto, diccionario de datos resumido y diagramas Mermaid de docs/diagramas.
 * Uso: npm run docs:readme   (después de npm run docs:diagrams)
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (p) => readFileSync(join(root, p), 'utf8');
const sqlDir = join(root, 'db', 'changelog', 'sql');
const sql = readdirSync(sqlDir).filter((f) => /^00\d/.test(f)).map((f) => readFileSync(join(sqlDir, f), 'utf8')).join('\n');

const contar = (re, txt) => [...txt.matchAll(re)].length;
const tablas = [...sql.matchAll(/COMMENT ON TABLE (\w+) IS '((?:[^']|'')*)'/g)].map((m) => [m[1], m[2].replace(/''/g, "'")]);
const rutas = leer('backend/src/routes/index.ts');
const testsApi = contar(/\bit\(/g, leer('backend/test/api.test.ts'));
const testsMotor = existsSync(join(root, 'frontend/src/engine/engine.test.ts')) ? contar(/\bit\(/g, leer('frontend/src/engine/engine.test.ts')) : 0;
const juego = JSON.parse(leer('db/data/juego.json'));

const metricas = `| Métrica | Valor |
|---|---|
| Tablas | ${contar(/CREATE TABLE /g, sql)} |
| Vistas / vistas materializadas | ${contar(/CREATE OR REPLACE VIEW /g, sql)} / ${contar(/CREATE MATERIALIZED VIEW /g, sql)} |
| Funciones PL/pgSQL y SQL | ${contar(/CREATE OR REPLACE FUNCTION /g, sql)} |
| Triggers | ${contar(/CREATE TRIGGER /g, sql)} |
| Índices declarados | ${contar(/CREATE (UNIQUE )?INDEX /g, sql)} |
| Changesets de Liquibase | ${contar(/--changeset /g, readdirSync(sqlDir).map((f) => readFileSync(join(sqlDir, f), 'utf8')).join('\n'))} |
| Endpoints REST | ${contar(/app\.(get|post)\('/g, rutas)} |
| Niveles / pasos / preguntas | ${juego.niveles.length} / ${juego.niveles.reduce((t, n) => t + n.pasos.length, 0)} / ${juego.niveles.reduce((t, n) => t + n.cuestionario.length, 0)} |
| Pruebas automáticas (API + motor) | ${testsApi} + ${testsMotor} |`;

const diccionario = `| Tabla | Descripción |
|---|---|
${tablas.map(([t, d]) => `| \`${t}\` | ${d} |`).join('\n')}

Diccionario completo (columnas, tipos, restricciones, índices): [docs/database](docs/database/).`;

const diagrama = (archivo) => {
  const p = join(root, 'docs', 'diagramas', archivo);
  if (!existsSync(p)) return `_Ejecuta \`npm run docs:diagrams\` para generar ${archivo}._`;
  const md = readFileSync(p, 'utf8');
  return md.slice(md.indexOf('```mermaid'));
};

const secciones = {
  metricas,
  diccionario,
  er: diagrama('er.md'),
  clases: diagrama('clases.md'),
  componentes: diagrama('componentes.md'),
  despliegue: diagrama('despliegue.md'),
  fecha: `_Secciones generadas automáticamente el ${new Date().toISOString().slice(0, 10)} por \`scripts/docs/build-readme.mjs\`._`,
};

let readme = leer('README.md');
for (const [k, v] of Object.entries(secciones)) {
  const re = new RegExp(`(<!-- AUTO:${k}:inicio -->)[\\s\\S]*?(<!-- AUTO:${k}:fin -->)`);
  if (!re.test(readme)) {
    console.warn(`⚠ marcador AUTO:${k} no encontrado en README.md`);
    continue;
  }
  readme = readme.replace(re, `$1\n${v}\n$2`);
}
writeFileSync(join(root, 'README.md'), readme);
console.log('✔ README.md actualizado');
