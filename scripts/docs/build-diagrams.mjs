#!/usr/bin/env node
/**
 * Genera los diagramas técnicos en Mermaid desde el código fuente (docs/diagramas/):
 *  - clases.md      → clases TypeScript del backend y del motor (API del compilador de TypeScript)
 *  - er.md          → modelo entidad-relación (desde la BD si hay DATABASE_URL; si no, desde los changelogs SQL)
 *  - componentes.md → paquetes del monorepo y sus dependencias
 *  - despliegue.md  → infraestructura declarada en Terraform (infra/terraform/envs/prod)
 * Uso: npm run docs:diagrams   (lo ejecuta .github/workflows/docs.yml)
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'docs', 'diagramas');
mkdirSync(out, { recursive: true });
const archivos = (dir, ext = '.ts') => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  if (statSync(p).isDirectory()) return f === 'node_modules' || f === 'dist' ? [] : archivos(p, ext);
  return p.endsWith(ext) && !p.endsWith('.test.ts') && !p.endsWith('.d.ts') ? [p] : [];
});
const escribir = (nombre, titulo, descripcion, mermaid) => {
  writeFileSync(join(out, nombre), `# ${titulo}\n\n> Generado automáticamente por \`scripts/docs/build-diagrams.mjs\`. No editar a mano.\n\n${descripcion}\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n`);
  console.log(`✔ docs/diagramas/${nombre}`);
  return mermaid;
};

/* ------------------------------ clases ------------------------------- */
function diagramaDeClases() {
  const fuentes = [...archivos(join(root, 'backend', 'src')), ...archivos(join(root, 'frontend', 'src', 'engine'))];
  const clases = [];
  for (const f of fuentes) {
    const sf = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
    sf.forEachChild((n) => {
      if (!ts.isClassDeclaration(n) || !n.name) return;
      const c = { nombre: n.name.text, archivo: relative(root, f), miembros: [], usa: new Set(), hereda: n.heritageClauses?.[0]?.types[0]?.expression.getText(sf) };
      for (const m of n.members) {
        const mods = ts.getCombinedModifierFlags(m);
        const priv = mods & ts.ModifierFlags.Private || mods & ts.ModifierFlags.Protected;
        const vis = priv ? '-' : '+';
        if (ts.isConstructorDeclaration(m)) {
          for (const p of m.parameters) {
            const tipo = p.type?.getText(sf) ?? '';
            if (/^[A-Z]\w+$/.test(tipo)) c.usa.add(tipo);
            if (p.modifiers?.some((x) => x.kind === ts.SyntaxKind.ReadonlyKeyword || x.kind === ts.SyntaxKind.PrivateKeyword)) {
              const pv = p.modifiers.some((x) => x.kind === ts.SyntaxKind.PrivateKeyword) ? '-' : '+';
              c.miembros.push(`${pv}${p.name.getText(sf)} : ${tipo.replace(/[<>{}]/g, '')}`);
            }
          }
        } else if (ts.isMethodDeclaration(m) && m.name) {
          const params = m.parameters.map((p) => p.name.getText(sf)).join(', ');
          c.miembros.push(`${vis}${m.name.getText(sf)}(${params})${mods & ts.ModifierFlags.Static ? '$' : ''}`);
        } else if (ts.isPropertyDeclaration(m) && m.name && !priv) {
          const tipo = (m.type?.getText(sf) ?? '').replace(/[<>{}\[\];|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28);
          c.miembros.push(`${vis}${m.name.getText(sf)}${tipo ? ` : ${tipo}` : ''}`);
        }
      }
      clases.push(c);
    });
  }
  const nombres = new Set(clases.map((c) => c.nombre));
  let m = 'classDiagram\n  direction LR\n';
  for (const c of clases) {
    m += `  class ${c.nombre} {\n${c.miembros.map((x) => `    ${x}`).join('\n')}\n  }\n`;
  }
  for (const c of clases) {
    if (c.hereda && nombres.has(c.hereda)) m += `  ${c.hereda} <|-- ${c.nombre}\n`;
    if (c.hereda === 'Error') m += `  class ${c.nombre}:::error\n`;
    for (const u of c.usa) if (nombres.has(u)) m += `  ${c.nombre} --> ${u} : usa\n`;
  }
  const tabla = clases.map((c) => `| \`${c.nombre}\` | \`${c.archivo}\` | ${c.miembros.length} |`).join('\n');
  return escribir('clases.md', 'Diagrama de clases',
    `Clases de la API (Fastify) y del motor de simulación. Las flechas indican dependencias inyectadas por constructor.\n\n| Clase | Archivo | Miembros |\n|---|---|---|\n${tabla}`, m.trimEnd());
}

/* -------------------------------- ER --------------------------------- */
async function diagramaER() {
  let tablas = [];
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    const cols = await c.query(`
      SELECT c.table_name, c.column_name, c.data_type, c.ordinal_position,
             EXISTS (SELECT 1 FROM information_schema.key_column_usage k JOIN information_schema.table_constraints t
                       ON t.constraint_name = k.constraint_name AND t.constraint_type = 'PRIMARY KEY'
                      WHERE k.table_name = c.table_name AND k.column_name = c.column_name) AS pk
        FROM information_schema.columns c JOIN information_schema.tables t ON t.table_name = c.table_name AND t.table_schema = c.table_schema
       WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE' AND c.table_name NOT LIKE 'databasechangelog%'
       ORDER BY c.table_name, c.ordinal_position`);
    const fks = await c.query(`
      SELECT conrelid::regclass::text AS desde, confrelid::regclass::text AS hacia, (SELECT attname FROM pg_attribute WHERE attrelid = conrelid AND attnum = conkey[1]) AS col
        FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace`);
    await c.end();
    const porTabla = new Map();
    for (const r of cols.rows) {
      if (!porTabla.has(r.table_name)) porTabla.set(r.table_name, { nombre: r.table_name, cols: [], fks: [] });
      porTabla.get(r.table_name).cols.push({ nombre: r.column_name, tipo: r.data_type.split(' ')[0], pk: r.pk });
    }
    for (const f of fks.rows) porTabla.get(f.desde)?.fks.push({ hacia: f.hacia, col: f.col });
    tablas = [...porTabla.values()];
  } else {
    const dir = join(root, 'db', 'changelog', 'sql');
    const sql = readdirSync(dir).filter((f) => /^00\d/.test(f)).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
    for (const bloque of sql.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g)) {
      const t = { nombre: bloque[1], cols: [], fks: [] };
      for (const linea of bloque[2].split('\n')) {
        const mm = linea.trim().match(/^(\w+)\s+([a-z]+)/);
        if (!mm || ['constraint', 'primary', 'check'].includes(mm[1].toLowerCase())) continue;
        t.cols.push({ nombre: mm[1], tipo: mm[2], pk: /PRIMARY KEY/.test(linea) });
        const ref = linea.match(/REFERENCES (\w+)/);
        if (ref) t.fks.push({ hacia: ref[1], col: mm[1] });
      }
      const pkComp = bloque[2].match(/PRIMARY KEY \(([^)]+)\)/);
      if (pkComp) for (const k of pkComp[1].split(',').map((s) => s.trim())) { const col = t.cols.find((x) => x.nombre === k); if (col) col.pk = true; }
      tablas.push(t);
    }
  }
  let m = 'erDiagram\n';
  for (const t of tablas) {
    m += `  ${t.nombre} {\n${t.cols.map((c) => `    ${c.tipo.replace(/\W/g, '_')} ${c.nombre}${c.pk ? ' PK' : t.fks.some((f) => f.col === c.nombre) ? ' FK' : ''}`).join('\n')}\n  }\n`;
  }
  for (const t of tablas) for (const f of t.fks) m += `  ${f.hacia} ||--o{ ${t.nombre} : "${f.col}"\n`;
  return escribir('er.md', 'Diagrama entidad-relación',
    `${tablas.length} tablas del esquema \`public\` (${process.env.DATABASE_URL ? 'leído de la base de datos migrada' : 'leído de los changelogs de Liquibase'}). El diccionario de datos completo está en [docs/database](../database/).`, m.trimEnd());
}

/* ---------------------------- componentes ---------------------------- */
function diagramaDeComponentes() {
  const raiz = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const paquetes = raiz.workspaces.filter((w) => existsSync(join(root, w, 'package.json'))).map((w) => ({ w, pkg: JSON.parse(readFileSync(join(root, w, 'package.json'), 'utf8')) }));
  const id = (w) => w.replace(/\W/g, '_');
  const consume = (w) => archivos(join(root, w, 'src'), '.ts').concat(existsSync(join(root, w, 'src')) ? archivos(join(root, w, 'src'), '.tsx') : []).some((f) => /\/api\//.test(readFileSync(f, 'utf8')));
  let m = 'flowchart LR\n  subgraph Clientes\n';
  for (const { w, pkg } of paquetes.filter((p) => p.w !== 'backend')) m += `    ${id(w)}["${pkg.name}<br/><small>${(pkg.description ?? w).slice(0, 48)}</small>"]\n`;
  m += '    skill["Skill Claude Code<br/><small>.claude/skills/atomreactchamber</small>"]\n  end\n';
  m += '  subgraph Servidor\n    backend["@arc/backend<br/><small>Fastify · JWT · OpenAPI</small>"]\n  end\n';
  m += '  subgraph Datos\n    db[("PostgreSQL 16<br/><small>funciones · triggers · vistas</small>")]\n    lb["Liquibase<br/><small>db/changelog</small>"]\n  end\n';
  for (const { w } of paquetes.filter((p) => p.w !== 'backend')) if (consume(w)) m += `  ${id(w)} -- "REST /api" --> backend\n`;
  m += '  skill -- "REST /api" --> backend\n  backend -- "SQL (pg)" --> db\n  lb -- "migra" --> db\n';
  m += '  frontend -. "modo demo: JSON incluido" .-> datosLocales["contenido.generated.json"]\n  gen["db/data/*.json"] -- "seed:generate" --> lb\n  gen -- "seed:generate" --> datosLocales\n';
  return escribir('componentes.md', 'Diagrama de componentes',
    `Paquetes del monorepo (workspaces npm) y cómo se comunican. \`db/data/*.json\` es la fuente única del contenido: genera la semilla SQL y el modo offline.`, m.trimEnd());
}

/* ---------------------------- despliegue ----------------------------- */
function diagramaDeDespliegue() {
  const dir = join(root, 'infra', 'terraform', 'envs', 'prod');
  const tf = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.tf')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n') : '';
  const modulos = [...tf.matchAll(/module "(\w+)"\s*{[^}]*?source\s*=\s*"([^"]+)"/g)].map((x) => `${x[1]} (${x[2].split('/').pop()})`);
  const m = `flowchart TB
  usuario(["Estudiante / Docente<br/>navegador"])
  dev(["Desarrolladora<br/>git push"])
  subgraph GitHub
    repo["Repositorio"]
    gha["GitHub Actions<br/>infra · db · backup · release · docs · pages"]
    pages["GitHub Pages<br/>docs técnicas + demo offline"]
    rel["Releases<br/>dist + .vsix + backups"]
  end
  subgraph Render["Render (free tier)"]
    web["Sitio estático<br/>frontend/dist"]
    api["Web service Node 22<br/>backend/dist/server.js"]
  end
  subgraph Neon["Neon (free tier)"]
    pg[("PostgreSQL 16")]
  end
  hcp["HCP Terraform<br/>estado remoto"]
  dev --> repo --> gha
  gha -- "terraform apply" --> Render
  gha -- "terraform apply" --> Neon
  gha -. "estado" .-> hcp
  gha -- "liquibase update" --> pg
  gha -- "pg_dump diario" --> rel
  gha -- "deploy pages" --> pages
  gha -- "deploy hook" --> api
  usuario -- HTTPS --> web
  usuario -- "HTTPS /api" --> api
  usuario -- HTTPS --> pages
  api -- "TLS 5432" --> pg`;
  return escribir('despliegue.md', 'Diagrama de despliegue',
    `Infraestructura aprovisionada con Terraform${modulos.length ? ` (módulos: ${modulos.join(', ')})` : ''} y automatizada con GitHub Actions. Costo mensual en free tier: US$ 0 (ver infra/terraform/cost-reference).`, m);
}

diagramaDeClases();
await diagramaER();
diagramaDeComponentes();
diagramaDeDespliegue();
writeFileSync(join(out, 'README.md'), `# Diagramas\n\n> Generados por \`npm run docs:diagrams\`.\n\n- [Clases](clases.md)\n- [Entidad-relación](er.md)\n- [Componentes](componentes.md)\n- [Despliegue](despliegue.md)\n`);
