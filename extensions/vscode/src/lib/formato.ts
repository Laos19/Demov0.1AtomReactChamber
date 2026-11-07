import type { Reaccion } from './tipos';

/** Escapa texto para insertarlo de forma segura en HTML (contenido y atributos). */
export function escapeHtml(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Formatea un número con separadores locales (es-PE) y hasta `decimales` decimales. */
export function numero(valor: number | null | undefined, decimales = 1): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  // Redondeo decimal exacto (evita 373.15 → 373.1 por representación binaria).
  const fijo = Number(`${Math.round(Number(`${valor}e${decimales}`))}e-${decimales}`);
  if (!Number.isFinite(fijo)) return valor.toFixed(decimales);
  return fijo.toLocaleString('es-PE', { maximumFractionDigits: decimales });
}

/** Energía en kJ/mol con signo explícito: "+4.4 kJ/mol", "−242.6 kJ/mol". */
export function energia(kj: number | null | undefined): string {
  if (kj === null || kj === undefined || Number.isNaN(kj)) return '—';
  const signo = kj > 0 ? '+' : kj < 0 ? '−' : '';
  return `${signo}${numero(Math.abs(kj))} kJ/mol`;
}

/** Temperatura en kelvin con su equivalente en °C. */
export function temperatura(k: number | null | undefined): string {
  if (k === null || k === undefined || Number.isNaN(k)) return '—';
  return `${numero(k)} K (${numero(k - 273.15)} °C)`;
}

export type TipoTermico = 'exotérmica' | 'endotérmica' | 'neutra';

/** Clasifica una reacción por el signo de ΔH. */
export function tipoTermico(dh: number): TipoTermico {
  if (dh < 0) return 'exotérmica';
  if (dh > 0) return 'endotérmica';
  return 'neutra';
}

/** Explicación breve, para escolares, de una reacción del catálogo. */
export function explicacionReaccion(r: Reaccion): string {
  const tipo = tipoTermico(r.dh);
  const calor =
    tipo === 'exotérmica'
      ? `libera ${numero(Math.abs(r.dh))} kJ por mol: los productos tienen menos energía que los reactivos y la cámara se calienta.`
      : tipo === 'endotérmica'
        ? `absorbe ${numero(r.dh)} kJ por mol: los productos guardan más energía que los reactivos y la cámara se enfría.`
        : 'no cambia la energía total del sistema.';
  const barrera =
    r.ea <= 0
      ? 'No tiene barrera de activación: ocurre casi en cada choque entre las partículas.'
      : `Para que ocurra, el choque debe superar una barrera (energía de activación) de ${numero(r.ea)} kJ/mol; por eso la temperatura acelera la reacción.`;
  return `Es una reacción ${tipo} (${r.etiqueta.toLowerCase()}) que ${calor} ${barrera}`;
}

/** Estrellas ★★☆ para 0–3. */
export function estrellas(n: number, max = 3): string {
  const k = Math.max(0, Math.min(max, Math.round(n)));
  return '★'.repeat(k) + '☆'.repeat(max - k);
}

/** "3.º de secundaria". */
export function grado(n: number | null | undefined): string {
  return n ? `${n}.º de secundaria` : 'sin grado';
}

/** Normaliza la URL base de la API: sin barra final y sin sufijo /api. */
export function normalizarApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').replace(/\/api$/, '');
}

/** URL de la ficha de PubChem para un CID. */
export function urlPubChem(cid: number | null | undefined): string | undefined {
  return cid ? `https://pubchem.ncbi.nlm.nih.gov/compound/${encodeURIComponent(String(cid))}` : undefined;
}
