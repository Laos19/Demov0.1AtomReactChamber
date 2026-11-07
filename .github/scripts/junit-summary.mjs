#!/usr/bin/env node
// Resume uno o más archivos JUnit XML en una tabla Markdown ("Reporte de pruebas superadas").
// Uso: node .github/scripts/junit-summary.mjs <salida.md> <Nombre=archivo.xml> [...]
// Sin dependencias: analiza los atributos de <testsuite>/<testcase> con expresiones regulares.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [out, ...specs] = process.argv.slice(2);
if (!out || specs.length === 0) {
  console.error('Uso: junit-summary.mjs <salida.md> <Nombre=archivo.xml> [...]');
  process.exit(2);
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : undefined;
};
const decode = (s = '') =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const rows = [];
const failures = [];
let total = { tests: 0, passed: 0, failed: 0, skipped: 0, time: 0 };

for (const spec of specs) {
  const [name, file] = spec.includes('=') ? spec.split(/=(.*)/s) : [spec, spec];
  if (!existsSync(file)) {
    rows.push(`| ${name} | — | — | — | — | — | ⚪ sin reporte (\`${file}\` no existe) |`);
    continue;
  }
  const xml = readFileSync(file, 'utf8');
  const cases = [...xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)];
  let tests = 0, failed = 0, skipped = 0, time = 0;
  for (const c of cases) {
    tests++;
    const head = `<testcase ${c[1]}`;
    time += Number(attr(head, 'time') ?? 0);
    const body = c[3] ?? '';
    if (/<(failure|error)\b/.test(body)) {
      failed++;
      const msg = body.match(/<(?:failure|error)\b[^>]*message="([^"]*)"/);
      failures.push(`- **${name}** › ${decode(attr(head, 'classname') ?? '')} › ${decode(attr(head, 'name') ?? '')}${msg ? `: ${decode(msg[1]).slice(0, 200)}` : ''}`);
    } else if (/<skipped\b/.test(body)) {
      skipped++;
    }
  }
  const passed = tests - failed - skipped;
  total = {
    tests: total.tests + tests, passed: total.passed + passed, failed: total.failed + failed,
    skipped: total.skipped + skipped, time: total.time + time,
  };
  const status = failed > 0 ? '❌ con fallos' : tests === 0 ? '⚪ sin casos' : '✅ superadas';
  rows.push(`| ${name} | ${tests} | ${passed} | ${failed} | ${skipped} | ${time.toFixed(2)} s | ${status} |`);
}

const pct = total.tests ? ((total.passed / (total.tests - total.skipped || 1)) * 100).toFixed(1) : '0.0';
const md = [
  '## 🧪 Reporte de pruebas superadas',
  '',
  `Fecha: ${new Date().toISOString()} · Commit: \`${(process.env.GITHUB_SHA ?? 'local').slice(0, 7)}\``,
  '',
  '| Suite | Casos | Superadas | Fallidas | Omitidas | Duración | Estado |',
  '|---|---:|---:|---:|---:|---:|---|',
  ...rows,
  `| **Total** | **${total.tests}** | **${total.passed}** | **${total.failed}** | **${total.skipped}** | **${total.time.toFixed(2)} s** | **${pct} % de éxito** |`,
  '',
  ...(failures.length ? ['### Pruebas fallidas', '', ...failures, ''] : []),
].join('\n');

writeFileSync(out, md + '\n');
console.log(md);
