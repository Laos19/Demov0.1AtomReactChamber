/**
 * Modelo químico del simulador: construye las tablas de especies, reacciones y fotólisis
 * a partir del catálogo (API `/api/catalogo` o JSON offline) y ofrece las funciones
 * termodinámicas puras (fases, Clausius-Clapeyron, energía del fotón).
 * @module engine/chemistry
 */

/** Constante de los gases en kJ/(mol·K). */
export const R_KJ = 0.008314;
/** E(fotón) = PHOTON_KJ_NM / λ[nm] en kJ/mol. */
export const PHOTON_KJ_NM = 119627;

/** Estados de agregación que reconoce el motor. */
export type Fase = 'Sólido' | 'Líquido' | 'Gas' | 'Plasma';

/** Parámetros de la cámara controlados por el usuario. */
export interface Parametros {
  /** Temperatura objetivo en K (0–3000). */
  T: number;
  /** Presión en atm (0.1–100). */
  P: number;
  /** Volumen en L (1–50). */
  V: number;
  /** Intensidad UV en W/m² (0–1000). */
  UV: number;
  /** Longitud de onda en nm (100–400). */
  lambda: number;
}

/** Parámetros iniciales por defecto del laboratorio. */
export const PARAMETROS_INICIALES: Parametros = { T: 300, P: 1, V: 25, UV: 0, lambda: 254 };

/** Elemento del catálogo (color CPK y radio de dibujo). */
export interface ElementoCat {
  simbolo: string;
  nombre: string;
  numero_atomico: number;
  color: string;
  brillo: string;
  radio_px: number;
}

/** Especie tal como llega del catálogo. */
export interface EspecieCat {
  codigo: string;
  formula: string;
  nombre: string;
  masa_molar: number;
  dhf: number;
  pf?: number | null;
  pe?: number | null;
  dhvap?: number | null;
  cid?: number | null;
  radical?: boolean | null;
  inyectable?: boolean | null;
  sublimacion?: { p_triple_atm: number; t_triple_k: number; dhvap_triple: number } | null;
  atomos: Array<[string, number, number]>;
}

/** Reacción del catálogo. */
export interface ReaccionCat {
  codigo: string;
  reactivos: string[];
  productos: string[];
  ea: number;
  esterico: number;
  enlace: string;
  etiqueta: string;
}

/** Fotólisis del catálogo. */
export interface FotolisisCat {
  especie: string;
  enlace_kj: number;
  seccion_eficaz: number;
  productos: [string, string];
  etiqueta: string;
}

/** Preset del laboratorio libre. */
export interface PresetCat {
  codigo: string;
  nombre: string;
  ecuacion: string;
  sobre_flecha: string;
  etiqueta: string;
  parametros: Parametros;
  carga: Record<string, number>;
  pasos: Array<[string, number]>;
  pista: string;
}

/** Catálogo completo (misma forma que db/data/catalogo.json). */
export interface Catalogo {
  elementos: ElementoCat[];
  especies: EspecieCat[];
  reacciones: ReaccionCat[];
  fotolisis: FotolisisCat[];
  presets: PresetCat[];
}

/** Especie procesada para el motor. */
export interface Especie extends EspecieCat {
  /** Radio de colisión en px (envolvente de sus átomos). */
  radius: number;
  /** Número de átomos. */
  atoms: number;
  /** Color representativo (del primer átomo). */
  color: string;
}

/** Reacción procesada con ΔH calculado y ecuación legible. */
export interface Reaccion extends ReaccionCat {
  /** ΔH = ΣΔHf(productos) − ΣΔHf(reactivos), kJ/mol. */
  dH: number;
  /** Ecuación con fórmulas Unicode. */
  eq: string;
}

/** Tablas químicas listas para la simulación. */
export interface Quimica {
  elementos: Record<string, ElementoCat>;
  especies: Record<string, Especie>;
  orden: string[];
  inyectables: string[];
  reacciones: Reaccion[];
  reaccionPorId: Record<string, Reaccion>;
  reaccionesPorPar: Record<string, Reaccion[]>;
  fotolisis: Record<string, FotolisisCat>;
  presets: PresetCat[];
}

/** Clave canónica de un par de especies (orden alfabético). */
export const claveDePar = (a: string, b: string): string => (a < b ? `${a}+${b}` : `${b}+${a}`);

/**
 * Construye las tablas químicas a partir del catálogo.
 * @param cat Catálogo de la API o del JSON offline.
 */
export function construirQuimica(cat: Catalogo): Quimica {
  const elementos = Object.fromEntries(cat.elementos.map((e) => [e.simbolo, e]));
  const especies: Record<string, Especie> = {};
  for (const s of cat.especies) {
    const radius = Math.max(...s.atomos.map(([a, x, y]) => Math.hypot(x, y) + elementos[a].radio_px));
    especies[s.codigo] = { ...s, radius, atoms: s.atomos.length, color: elementos[s.atomos[0][0]].color };
  }
  const reacciones: Reaccion[] = cat.reacciones.map((r) => ({
    ...r,
    dH: r.productos.reduce((t, k) => t + especies[k].dhf, 0) - r.reactivos.reduce((t, k) => t + especies[k].dhf, 0),
    eq: `${r.reactivos.map((k) => especies[k].formula).join(' + ')} → ${r.productos.map((k) => especies[k].formula).join(' + ')}`,
  }));
  const reaccionPorId = Object.fromEntries(reacciones.map((r) => [r.codigo, r]));
  const reaccionesPorPar: Record<string, Reaccion[]> = {};
  for (const r of reacciones) (reaccionesPorPar[claveDePar(r.reactivos[0], r.reactivos[1])] ||= []).push(r);
  return {
    elementos,
    especies,
    orden: cat.especies.map((s) => s.codigo),
    inyectables: cat.especies.filter((s) => s.inyectable).map((s) => s.codigo),
    reacciones,
    reaccionPorId,
    reaccionesPorPar,
    fotolisis: Object.fromEntries(cat.fotolisis.map((f) => [f.especie, f])),
    presets: cat.presets,
  };
}

/**
 * Temperatura de ebullición corregida por presión (Clausius-Clapeyron).
 * @param Tref Temperatura de ebullición a la presión de referencia (K).
 * @param dH Entalpía de vaporización (kJ/mol).
 * @param P Presión actual (atm).
 * @param Pref Presión de referencia (atm).
 * @returns Temperatura de ebullición a la presión P (K); Infinity si no hierve.
 */
export function ebullicionA(Tref: number, dH: number, P: number, Pref = 1): number {
  const inv = 1 / Tref - (R_KJ * Math.log(P / Pref)) / dH;
  return inv <= 0 ? Infinity : 1 / inv;
}

/**
 * Fase de una especie a temperatura y presión dadas.
 * @param q Tablas químicas.
 * @param sp Código de especie.
 * @param T Temperatura (K).
 * @param P Presión (atm).
 */
export function faseDe(q: Quimica, sp: string, T: number, P: number): Fase {
  const s = q.especies[sp];
  if (s.radical || s.pf == null || s.pe == null || s.dhvap == null) return 'Gas';
  if (s.sublimacion) {
    const sb = s.sublimacion;
    if (P < sb.p_triple_atm) return T < ebullicionA(s.pe, s.dhvap, P) ? 'Sólido' : 'Gas';
    if (T < sb.t_triple_k) return 'Sólido';
    return T < ebullicionA(sb.t_triple_k, sb.dhvap_triple, P, sb.p_triple_atm) ? 'Líquido' : 'Gas';
  }
  if (T < s.pf) return 'Sólido';
  return T < ebullicionA(s.pe, s.dhvap, P) ? 'Líquido' : 'Gas';
}

/** Plasma: T ≥ 2800 K o UV de vacío intenso. */
export const esPlasma = (T: number, prm: Parametros): boolean => T >= 2800 || (prm.UV >= 800 && prm.lambda <= 120);

/** Energía de un fotón en kJ/mol para una longitud de onda en nm. */
export const energiaFoton = (lambdaNm: number): number => PHOTON_KJ_NM / lambdaNm;

/** ΔH de la fotólisis de una especie (kJ/mol). */
export function dHFotolisis(q: Quimica, sp: string): number {
  const f = q.fotolisis[sp];
  return f.productos.reduce((t, k) => t + q.especies[k].dhf, 0) - q.especies[sp].dhf;
}

/** Nombres de las transiciones de fase. */
export const TRANSICION: Record<string, string> = {
  'Gas>Líquido': 'condensación', 'Líquido>Gas': 'ebullición', 'Líquido>Sólido': 'solidificación',
  'Sólido>Líquido': 'fusión', 'Sólido>Gas': 'sublimación', 'Gas>Sólido': 'deposición',
};

/** Formatea con signo tipográfico (− en vez de -). */
export const conSigno = (x: number, d = 1): string => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toFixed(d)}`;
