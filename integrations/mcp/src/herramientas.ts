import type { Catalogo, Dashboard, Especie, Juego, Reaccion, RespuestaQuimi } from './api.js';

/** Normaliza texto químico: minúsculas, sin tildes, subíndices → dígitos, sin "·" ni espacios extra. */
export function normalizar(t: string): string {
  const sub: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  return t
    .replace(/[₀-₉]/g, (c) => sub[c] ?? c)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[·↑↓]/g, '')
    .replace(/->|=>|⟶/g, '→')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const num = (n: number | null | undefined, d = 1): string =>
  n === null || n === undefined || Number.isNaN(n) ? '—' : Number(`${Math.round(Number(`${n}e${d}`))}e-${d}`).toString();
const kj = (n: number): string => `${n > 0 ? '+' : n < 0 ? '−' : ''}${num(Math.abs(n))} kJ/mol`;
const kelvin = (k: number | null | undefined): string => (k === null || k === undefined ? '—' : `${num(k)} K (${num(k - 273.15)} °C)`);

export function tipoTermico(dh: number): 'exotérmica' | 'endotérmica' | 'neutra' {
  return dh < 0 ? 'exotérmica' : dh > 0 ? 'endotérmica' : 'neutra';
}

/** Busca especies por código, fórmula (H2O o H₂O) o nombre (con o sin tildes). Devuelve ordenadas por relevancia. */
export function buscarEspecies(cat: Catalogo, consulta: string): Especie[] {
  const q = normalizar(consulta);
  if (!q) return [];
  const puntuar = (e: Especie): number => {
    const codigo = normalizar(e.codigo);
    const formula = normalizar(e.formula);
    const nombre = normalizar(e.nombre);
    if (codigo === q || formula === q) return 100;
    if (nombre === q) return 90;
    if (nombre.startsWith(q)) return 70;
    if (nombre.includes(q)) return 50;
    if (formula.includes(q) || codigo.includes(q)) return 30;
    return 0;
  };
  return cat.especies
    .map((e) => ({ e, p: puntuar(e) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p)
    .map((x) => x.e);
}

/** Ficha en Markdown de una especie. */
export function fichaEspecie(e: Especie, cat: Catalogo): string {
  const participa = cat.reacciones.filter((r) => r.reactivos.includes(e.codigo) || r.productos.includes(e.codigo));
  const lineas = [
    `### ${e.formula} — ${e.nombre} (\`${e.codigo}\`)`,
    `- Masa molar: ${num(e.masa_molar, 3)} g/mol`,
    `- ΔH° de formación: ${kj(e.dhf)}`,
    `- Punto de fusión: ${kelvin(e.pf)}`,
    `- ${e.sublimacion ? 'Sublimación' : 'Punto de ebullición'}: ${kelvin(e.sublimacion ?? e.pe)}`,
    `- Tipo: ${e.radical ? 'radical libre (electrón desapareado, muy reactivo)' : 'especie estable'}`,
  ];
  if (e.cid) lineas.push(`- PubChem: https://pubchem.ncbi.nlm.nih.gov/compound/${e.cid}`);
  if (participa.length) {
    lineas.push('- Participa en:');
    for (const r of participa) lineas.push(`  - \`${r.codigo}\`: ${r.ecuacion} (${r.etiqueta}, ${tipoTermico(r.dh)})`);
  }
  return lineas.join('\n');
}

/** Busca reacciones por código, ecuación o especies involucradas ("H2 + O2", "cloro"). */
export function buscarReacciones(cat: Catalogo, consulta: string): Reaccion[] {
  const q = normalizar(consulta);
  if (!q) return [];
  const exacta = cat.reacciones.filter((r) => normalizar(r.codigo) === q || normalizar(r.ecuacion) === q);
  if (exacta.length) return exacta;
  const porTexto = cat.reacciones.filter((r) => normalizar(r.ecuacion).includes(q) || normalizar(r.etiqueta).includes(q));
  if (porTexto.length) return porTexto;
  // Por especies: cada término separado por "+", "," o "y" debe aparecer entre reactivos o productos.
  const terminos = q.split(/\s*(?:\+|,|\by\b|→)\s*/).filter(Boolean);
  const codigos = terminos.map((t) => buscarEspecies(cat, t).map((e) => e.codigo));
  if (!codigos.length || codigos.some((c) => !c.length)) return [];
  return cat.reacciones.filter((r) => {
    const todas = [...r.reactivos, ...r.productos];
    return codigos.every((opciones) => opciones.some((c) => todas.includes(c)));
  });
}

/** Perfil de energía en texto (para clientes que no muestran imágenes). */
export function perfilTexto(ea: number, dh: number): string {
  const ead = `Eₐ = ${num(ea)} kJ/mol`;
  const dhd = `ΔH = ${kj(dh)}`;
  let filas: string[];
  if (dh < 0) {
    filas =
      ea > 0
        ? [`              ╭──╮        ← ${ead}`, ` reactivos ───╯  ╲`, `                  ╲       ${dhd}`, `                   ╰───── productos (exotérmica: se libera calor)`]
        : [` reactivos ───╮             sin barrera (Eₐ ≈ 0)`, `              ╲           ${dhd}`, `               ╰───────── productos (exotérmica: se libera calor)`];
  } else {
    filas =
      ea > 0
        ? [`              ╭──╮        ← ${ead}`, `              │  ╰─────── productos (endotérmica: se absorbe calor)`, ` reactivos ───╯            ${dhd}`]
        : [`              ╭────────── productos (endotérmica: se absorbe calor)`, ` reactivos ───╯            ${dhd}`];
  }
  return ['```', ' Energía ↑', ...filas, '           └──────────────────────→ avance de la reacción', '```'].join('\n');
}

/** Explicación en Markdown de una reacción, para estudiantes de secundaria. */
export function explicarReaccion(r: Reaccion, cat: Catalogo): string {
  const nombre = (c: string): string => {
    const e = cat.especies.find((x) => x.codigo === c);
    return e ? `${e.formula} (${e.nombre})` : c;
  };
  const tipo = tipoTermico(r.dh);
  const calor =
    tipo === 'exotérmica'
      ? `**libera** ${num(Math.abs(r.dh))} kJ por mol: los productos quedan con menos energía que los reactivos y el sistema se calienta.`
      : tipo === 'endotérmica'
        ? `**absorbe** ${num(r.dh)} kJ por mol: los productos guardan más energía que los reactivos.`
        : 'no cambia la energía total.';
  const barrera =
    r.ea <= 0
      ? 'No tiene barrera de activación (Eₐ ≈ 0): ocurre casi en cada choque, típico de la unión de dos radicales.'
      : `Necesita superar una energía de activación de ${num(r.ea)} kJ/mol; al subir la temperatura más choques la superan y la reacción se acelera.`;
  return [
    `### ${r.ecuacion}`,
    `**${r.etiqueta}** · código \`${r.codigo}\`${r.enlace ? ` · enlace ${r.enlace}` : ''}`,
    '',
    `- Reactivos: ${r.reactivos.map(nombre).join(' + ')}`,
    `- Productos: ${r.productos.map(nombre).join(' + ')}`,
    `- Energía de activación (Eₐ): ${num(r.ea)} kJ/mol`,
    `- Variación de entalpía (ΔH): ${kj(r.dh)} → **${tipo}**`,
    '',
    `Es una reacción ${tipo} que ${calor} ${barrera}`,
    '',
    perfilTexto(r.ea, r.dh),
  ].join('\n');
}

/** Lista de niveles en Markdown, filtrable por grado o misión. */
export function listarNiveles(j: Juego, filtro: { grado?: number; mision?: string; detalle?: boolean } = {}): string {
  const mq = filtro.mision ? normalizar(filtro.mision) : undefined;
  const misiones = [...j.misiones]
    .sort((a, b) => a.orden - b.orden)
    .filter((m) => !mq || normalizar(m.codigo).includes(mq) || normalizar(m.titulo).includes(mq));
  const salida: string[] = [];
  for (const m of misiones) {
    const niveles = j.niveles
      .filter((n) => n.mision === m.codigo && (!filtro.grado || n.grado === filtro.grado))
      .sort((a, b) => a.orden - b.orden);
    if (!niveles.length) continue;
    salida.push(`## Misión: ${m.titulo} (\`${m.codigo}\`)`, m.descripcion, '');
    for (const n of niveles) {
      salida.push(`- **${n.orden}. ${n.titulo}** (\`${n.codigo}\`) — ${n.grado}.º sec. · ${n.xp} XP · ~${n.minutos} min`);
      salida.push(`  - Objetivo: ${n.objetivo}`);
      if (filtro.detalle) for (const p of n.pasos) salida.push(`  - Paso ${p.orden}: ${p.titulo} — ${p.instruccion} _(Concepto: ${p.concepto})_`);
      else salida.push(`  - ${n.pasos.length} pasos: ${n.pasos.map((p) => p.titulo).join(' → ')}`);
    }
    salida.push('');
  }
  return salida.length ? salida.join('\n').trim() : 'No hay niveles que coincidan con el filtro.';
}

/** Respuesta de Quimi en Markdown. */
export function formatoQuimi(r: RespuestaQuimi): string {
  const l = [r.mensaje];
  if (r.concepto) l.push('', `**Concepto del paso:** ${r.concepto}`);
  if (r.terminos.length) {
    l.push('', '**Términos del glosario:**');
    for (const t of r.terminos) l.push(`- **${t.termino}** (relevancia ${num(t.relevancia, 2)}): ${t.definicion}`);
  }
  return l.join('\n');
}

/** Resumen ejecutivo del dashboard docente. */
export function resumenDashboard(d: Dashboard): string {
  const k = d.kpis;
  const eventos30 = d.usoDiario.reduce((a, x) => a + Number(x.eventos ?? 0), 0);
  const totalOrigen = d.origen.reduce((a, x) => a + x.sesiones, 0) || 1;
  const l = [
    '## Dashboard de AtomReactChamber',
    `- Estudiantes: ${k.estudiantes ?? 0} · Aulas: ${k.aulas ?? 0}`,
    `- Sesiones (7 días): ${k.sesiones_7d ?? 0} · Activos (7 días): ${k.activos_7d ?? 0} · Eventos (30 días): ${eventos30}`,
    `- Niveles completados: ${k.niveles_completados ?? 0} · Tasa de completado: ${k.tasa_completado ?? 0} %`,
    `- Aciertos en cuestionarios: ${k.aciertos_cuestionario ?? 0} % · Pistas por nivel: ${k.pistas_por_nivel ?? 0}`,
    '',
    '### Uso por integración (origen)',
    ...d.origen.map((o) => `- ${o.origen}: ${o.sesiones} sesiones (${Math.round((o.sesiones / totalOrigen) * 100)} %)`),
    '',
    '### Pasos más lentos',
    ...d.pasosLentos.map((p) => `- ${p.nivel_codigo} · paso ${p.orden} «${p.titulo}»: ${num(p.segundos_promedio, 0)} s de promedio (${p.veces} veces)`),
    '',
    '### Preguntas con más error',
    ...d.preguntas.map((p) => `- ${p.nivel_codigo}: «${p.enunciado}» — ${num(p.porcentaje_error)} % de error (${p.respuestas} respuestas)`),
    '',
    '### Niveles',
    ...d.niveles.map(
      (n) => `- ${n.codigo} ${n.titulo}: ${n.completados}/${n.intentos} completados (${n.tasa_completado} %), ★ ${num(n.estrellas_promedio, 2)}, pistas ${num(n.pistas_promedio, 2)}, ${num(n.minutos_promedio)} min`,
    ),
  ];
  return l.join('\n');
}
