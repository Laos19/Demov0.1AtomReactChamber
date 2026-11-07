#!/usr/bin/env node
// Compara conteos de filas (CSV "tabla,filas") del origen y de la restauración.
// Uso: node compare-counts.mjs origen.csv restaurado.csv salida.md
// Sale con código 1 si alguna tabla difiere.
import { readFileSync, writeFileSync } from 'node:fs';

const [srcFile, dstFile, out] = process.argv.slice(2);
const load = (f) =>
  new Map(
    readFileSync(f, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const i = l.lastIndexOf(',');
        return [l.slice(0, i), Number(l.slice(i + 1))];
      }),
  );

const src = load(srcFile);
const dst = load(dstFile);
const tables = [...new Set([...src.keys(), ...dst.keys()])].sort();
let ok = 0;
let bad = 0;
let rowsTotal = 0;
const lines = ['| Tabla | Filas origen | Filas restauradas | Resultado |', '|---|---:|---:|---|'];
for (const t of tables) {
  const a = src.get(t);
  const b = dst.get(t);
  const same = a !== undefined && a === b;
  same ? ok++ : bad++;
  rowsTotal += a ?? 0;
  lines.push(`| \`${t}\` | ${a ?? '—'} | ${b ?? '—'} | ${same ? '✅' : '❌'} |`);
}
const md = [
  `**Verificación de restauración:** ${bad === 0 ? '✅ OK' : '❌ DIFERENCIAS'} — ${ok}/${tables.length} tablas coinciden, ${rowsTotal} filas en origen.`,
  '',
  ...lines,
  '',
].join('\n');
writeFileSync(out, md);
console.log(md);
process.exit(bad === 0 && tables.length > 0 ? 0 : 1);
