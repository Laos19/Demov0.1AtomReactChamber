import { energia, escapeHtml, estrellas, explicacionReaccion, grado, numero, temperatura, tipoTermico, urlPubChem } from './formato';
import { fila } from './html';
import { perfilEnergiaSvg } from './perfilEnergia';
import type { Catalogo, Especie, Perfil, Reaccion, RespuestaQuimi } from './tipos';

/** Cuerpo HTML de la ficha de una especie química. */
export function cuerpoEspecie(e: Especie, catalogo?: Catalogo): string {
  const pub = urlPubChem(e.cid);
  const participa = (catalogo?.reacciones ?? []).filter((r) => r.reactivos.includes(e.codigo) || r.productos.includes(e.codigo));
  const filas = [
    fila('Fórmula', e.formula),
    fila('Masa molar', `${numero(e.masa_molar, 3)} g/mol`),
    fila('ΔH° de formación', energia(e.dhf)),
    fila('Punto de fusión', temperatura(e.pf)),
    fila(e.sublimacion ? 'Sublimación' : 'Punto de ebullición', temperatura(e.sublimacion ?? e.pe)),
    fila('Tipo', e.radical ? 'Radical libre (muy reactivo: tiene un electrón desapareado)' : 'Especie estable'),
  ];
  if (e.atomos?.length) {
    const conteo = new Map<string, number>();
    for (const [s] of e.atomos) conteo.set(s, (conteo.get(s) ?? 0) + 1);
    filas.push(fila('Átomos', [...conteo].map(([s, n]) => `${n} × ${s}`).join(', ')));
  }
  return `
<h1><span class="formula">${escapeHtml(e.formula)}</span>${escapeHtml(e.nombre)}</h1>
<p class="sub">Código en el catálogo: <code>${escapeHtml(e.codigo)}</code></p>
<table>${filas.join('')}</table>
${
  participa.length
    ? `<h2>Participa en</h2><ul>${participa
        .map((r) => `<li><code>${escapeHtml(r.ecuacion)}</code> — ${escapeHtml(r.etiqueta)} (${escapeHtml(tipoTermico(r.dh))})</li>`)
        .join('')}</ul>`
    : ''
}
<h2>Más información</h2>
<p>${pub ? `<a href="${escapeHtml(pub)}">Ver ${escapeHtml(e.nombre)} en PubChem (CID ${escapeHtml(e.cid)})</a>` : 'Sin ficha en PubChem.'}</p>`;
}

/** Cuerpo HTML con la explicación y el perfil de energía de una reacción. */
export function cuerpoReaccion(r: Reaccion, catalogo?: Catalogo): string {
  const tipo = tipoTermico(r.dh);
  const clase = tipo === 'exotérmica' ? 'exo' : 'endo';
  const nombre = (c: string): string => {
    const e = catalogo?.especies.find((x) => x.codigo === c);
    return e ? `${e.formula} (${e.nombre})` : c;
  };
  return `
<h1>${escapeHtml(r.etiqueta)}</h1>
<p><span class="ecuacion">${escapeHtml(r.ecuacion)}</span></p>
<p><span class="chip ${clase}">${escapeHtml(tipo)}</span>${r.enlace ? `<span class="chip">enlace ${escapeHtml(r.enlace)}</span>` : ''}</p>
<p>${escapeHtml(explicacionReaccion(r))}</p>
<table>
${fila('Energía de activación (Eₐ)', `${numero(r.ea)} kJ/mol`)}
${fila('Variación de entalpía (ΔH)', energia(r.dh))}
${fila('Reactivos', r.reactivos.map(nombre).join(' + '))}
${fila('Productos', r.productos.map(nombre).join(' + '))}
</table>
<h2>Perfil de energía</h2>
${perfilEnergiaSvg(r.ea, r.dh, { titulo: `Perfil de energía de ${r.ecuacion}` })}
<p class="aviso">La curva sube hasta la energía de activación y baja hasta el nivel de los productos.
${tipo === 'exotérmica' ? 'Los productos quedan por debajo: se libera calor.' : 'Los productos quedan por encima: se absorbe calor.'}</p>`;
}

/** Cuerpo HTML de una respuesta de Quimi. */
export function cuerpoQuimi(pregunta: string, r: RespuestaQuimi): string {
  return `
<h1>Quimi responde</h1>
<p class="sub">Pregunta: «${escapeHtml(pregunta)}»</p>
<p>${escapeHtml(r.mensaje)}</p>
${r.concepto ? `<h2>Concepto del paso</h2><p>${escapeHtml(r.concepto)}</p>` : ''}
${
  r.terminos.length
    ? `<h2>Términos del glosario</h2>${r.terminos
        .map((t) => `<div class="termino"><b>${escapeHtml(t.termino)}</b>${escapeHtml(t.definicion)}</div>`)
        .join('')}`
    : ''
}
<p class="aviso">Quimi busca en el glosario de AtomReactChamber (búsqueda de texto completo en PostgreSQL).</p>`;
}

/** Cuerpo HTML del progreso del estudiante. */
export function cuerpoProgreso(p: Perfil): string {
  const r = p.resumen;
  const insignias = p.insignias.map((i) => i.nombre ?? i.codigo ?? '').filter(Boolean);
  return `
<h1>Hola, ${escapeHtml(p.usuario.nombre)}</h1>
<p class="sub">${escapeHtml(p.usuario.rol)} · ${escapeHtml(grado(p.usuario.grado))}</p>
<div class="kpis">
  <div class="kpi"><b>${escapeHtml(numero(r.xp, 0))}</b><span>XP acumulada</span></div>
  <div class="kpi"><b>${escapeHtml(numero(r.racha, 0))} 🔥</b><span>Racha (máx. ${escapeHtml(numero(r.racha_maxima, 0))})</span></div>
  <div class="kpi"><b>${escapeHtml(numero(r.estrellas_totales, 0))} ★</b><span>Estrellas</span></div>
  <div class="kpi"><b>${escapeHtml(numero(r.niveles_completados, 0))}</b><span>Niveles completados</span></div>
</div>
<h2>Insignias</h2>
<p>${insignias.length ? insignias.map((n) => `<span class="chip">${escapeHtml(n)}</span>`).join(' ') : 'Aún no tienes insignias: ¡completa tu primer nivel!'}</p>
<p class="aviso">Estrellas por nivel: ${escapeHtml(estrellas(3))} = sin pistas y cuestionario perfecto.</p>`;
}
