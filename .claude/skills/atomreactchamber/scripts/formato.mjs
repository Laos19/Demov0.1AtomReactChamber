#!/usr/bin/env node
// formato.mjs — convierte el JSON de la API de AtomReactChamber (stdin) en texto legible (Markdown).
// Uso interno de arc.sh:  curl …/api/catalogo | node formato.mjs especie H2O
const [cmd, ...args] = process.argv.slice(2);
let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (entrada += d));
process.stdin.on('end', () => {
  let datos;
  try {
    datos = JSON.parse(entrada);
  } catch {
    process.stdout.write(entrada);
    return;
  }
  if (datos && typeof datos === 'object' && 'error' in datos && !Array.isArray(datos)) {
    console.error(`Error de la API (${datos.error}): ${datos.mensaje ?? ''}`);
    process.exit(1);
  }
  const salida = (FORMATOS[cmd] ?? ((d) => JSON.stringify(d, null, 2)))(datos, args);
  console.log(salida);
});

const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
const norm = (t) =>
  String(t ?? '')
    .replace(/[₀-₉]/g, (c) => SUB[c])
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[·↑↓]/g, '')
    .replace(/->|=>/g, '→')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
const num = (n, d = 1) => (n === null || n === undefined || Number.isNaN(n) ? '—' : String(Number(`${Math.round(Number(`${n}e${d}`))}e-${d}`)));
const kj = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${num(Math.abs(n))} kJ/mol`;
const kelvin = (k) => (k === null || k === undefined ? '—' : `${num(k)} K (${num(k - 273.15)} °C)`);
const tipo = (dh) => (dh < 0 ? 'exotérmica' : dh > 0 ? 'endotérmica' : 'neutra');

function buscarEspecies(cat, q0) {
  const q = norm(q0);
  const p = (e) => {
    const [c, f, n] = [norm(e.codigo), norm(e.formula), norm(e.nombre)];
    if (c === q || f === q) return 100;
    if (n === q) return 90;
    if (n.startsWith(q)) return 70;
    if (n.includes(q)) return 50;
    if (f.includes(q) || c.includes(q)) return 30;
    return 0;
  };
  return cat.especies.map((e) => [e, p(e)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([e]) => e);
}

function buscarReacciones(cat, q0) {
  const q = norm(q0);
  const exacta = cat.reacciones.filter((r) => norm(r.codigo) === q || norm(r.ecuacion) === q);
  if (exacta.length) return exacta;
  const texto = cat.reacciones.filter((r) => norm(r.ecuacion).includes(q) || norm(r.etiqueta).includes(q));
  if (texto.length) return texto;
  const grupos = q.split(/\s*(?:\+|,|\by\b|→)\s*/).filter(Boolean).map((t) => buscarEspecies(cat, t).map((e) => e.codigo));
  if (!grupos.length || grupos.some((g) => !g.length)) return [];
  return cat.reacciones.filter((r) => grupos.every((g) => g.some((c) => [...r.reactivos, ...r.productos].includes(c))));
}

const FORMATOS = {
  salud: (d) => `API ${d.estado} · base de datos ${d.db} · versión ${d.version} · ${d.hora}`,

  especie(cat, args) {
    const q = args.join(' ');
    const res = buscarEspecies(cat, q).slice(0, 3);
    if (!res.length) return `No encontré «${q}». Disponibles: ${cat.especies.map((e) => `${e.formula} (${e.nombre})`).join(', ')}`;
    return res
      .map((e) => {
        const rs = cat.reacciones.filter((r) => r.reactivos.includes(e.codigo) || r.productos.includes(e.codigo));
        return [
          `### ${e.formula} — ${e.nombre} (\`${e.codigo}\`)`,
          `- Masa molar: ${num(e.masa_molar, 3)} g/mol`,
          `- ΔH° de formación: ${kj(e.dhf)}`,
          `- Punto de fusión: ${kelvin(e.pf)}`,
          `- ${e.sublimacion ? 'Sublimación' : 'Punto de ebullición'}: ${kelvin(e.sublimacion ?? e.pe)}`,
          `- Tipo: ${e.radical ? 'radical libre (muy reactivo)' : 'especie estable'}`,
          e.cid ? `- PubChem: https://pubchem.ncbi.nlm.nih.gov/compound/${e.cid}` : '- PubChem: —',
          ...(rs.length ? ['- Participa en:', ...rs.map((r) => `  - \`${r.codigo}\`: ${r.ecuacion} (${r.etiqueta}, ${tipo(r.dh)})`)] : []),
        ].join('\n');
      })
      .join('\n\n');
  },

  reaccion(cat, args) {
    const q = args.join(' ');
    const res = buscarReacciones(cat, q).slice(0, 3);
    if (!res.length) return `No encontré una reacción para «${q}». Usa «arc.sh reacciones» para ver la lista.`;
    const nom = (c) => {
      const e = cat.especies.find((x) => x.codigo === c);
      return e ? `${e.formula} (${e.nombre})` : c;
    };
    return res
      .map((r) => {
        const t = tipo(r.dh);
        return [
          `### ${r.ecuacion}`,
          `**${r.etiqueta}** · código \`${r.codigo}\`${r.enlace ? ` · enlace ${r.enlace}` : ''}`,
          `- Reactivos: ${r.reactivos.map(nom).join(' + ')}`,
          `- Productos: ${r.productos.map(nom).join(' + ')}`,
          `- Energía de activación (Eₐ): ${num(r.ea)} kJ/mol${r.ea <= 0 ? ' (sin barrera)' : ''}`,
          `- ΔH: ${kj(r.dh)} → **${t}** (${t === 'exotérmica' ? 'libera calor; productos por debajo de los reactivos' : 'absorbe calor; productos por encima de los reactivos'})`,
          `- Perfil: reactivos (0) → cima (${num(Math.max(r.ea, r.dh, 0))} kJ/mol) → productos (${num(r.dh)} kJ/mol)`,
        ].join('\n');
      })
      .join('\n\n');
  },

  reacciones: (cat) =>
    cat.reacciones.map((r) => `- \`${r.codigo}\`: ${r.ecuacion} — ${r.etiqueta} · Eₐ ${num(r.ea)} · ΔH ${kj(r.dh)} (${tipo(r.dh)})`).join('\n'),

  niveles(j, args) {
    const detalle = args.includes('--detalle');
    const grado = Number(args.find((a) => /^[1-5]$/.test(a))) || undefined;
    const out = [];
    for (const m of [...j.misiones].sort((a, b) => a.orden - b.orden)) {
      const ns = j.niveles.filter((n) => n.mision === m.codigo && (!grado || n.grado === grado)).sort((a, b) => a.orden - b.orden);
      if (!ns.length) continue;
      out.push(`## ${m.titulo} (\`${m.codigo}\`)`);
      for (const n of ns) {
        out.push(`- **${n.orden}. ${n.titulo}** (\`${n.codigo}\`) — ${n.grado}.º sec. · ${n.xp} XP · ~${n.minutos} min — ${n.objetivo}`);
        if (detalle) for (const p of n.pasos) out.push(`  - Paso ${p.orden}: ${p.titulo} — ${p.instruccion} (Concepto: ${p.concepto})`);
      }
    }
    return out.join('\n') || 'No hay niveles para ese filtro.';
  },

  quimi(r) {
    const l = [r.mensaje];
    if (r.concepto) l.push(`Concepto del paso: ${r.concepto}`);
    for (const t of r.terminos ?? []) l.push(`- ${t.termino} (relevancia ${num(t.relevancia, 2)}): ${t.definicion}`);
    return l.join('\n');
  },

  dashboard(d) {
    const k = d.kpis;
    const total = d.origen.reduce((a, o) => a + o.sesiones, 0) || 1;
    return [
      '## Dashboard de AtomReactChamber',
      `- Estudiantes ${k.estudiantes} · aulas ${k.aulas} · sesiones 7 d ${k.sesiones_7d} · activos 7 d ${k.activos_7d}`,
      `- Niveles completados ${k.niveles_completados} · tasa ${k.tasa_completado} % · aciertos ${k.aciertos_cuestionario} % · pistas/nivel ${k.pistas_por_nivel}`,
      '### Uso por integración',
      ...d.origen.map((o) => `- ${o.origen}: ${o.sesiones} sesiones (${Math.round((o.sesiones / total) * 100)} %)`),
      '### Pasos más lentos',
      ...d.pasosLentos.map((p) => `- ${p.nivel_codigo} paso ${p.orden} «${p.titulo}»: ${num(p.segundos_promedio, 0)} s`),
      '### Preguntas con más error',
      ...d.preguntas.map((p) => `- ${p.nivel_codigo}: «${p.enunciado}» ${num(p.porcentaje_error)} % de error`),
    ].join('\n');
  },
};
