/**
 * DSL de condiciones verificables de los pasos de cada nivel.
 *
 * Ejemplo (guardado en la columna `paso.condicion` de PostgreSQL):
 * ```json
 * { "todas": [ { "metrica": "temperatura", "op": ">=", "valor": 600 } ], "durante": 2 }
 * ```
 * Métricas: `temperatura`, `presion`, `volumen`, `uv`, `lambda`, `conteo:<sp>`, `fase:<sp>`,
 * `reacciones:<rx>`, `reacciones_total`, `fotolisis:<sp>`, `chispas`, `razon:<A>:<B>`, `fase_predominante`.
 * @module engine/conditions
 */
import type { Parametros } from './chemistry';
import type { Instantanea } from './Simulation';

/** Operadores soportados. */
export type Operador = '>=' | '<=' | '==' | '>' | '<' | 'approx';

/** Regla atómica. */
export interface Regla {
  metrica: string;
  op: Operador;
  valor: number | string;
  /** Tolerancia relativa para `approx` (ej. 0.35 = ±35 %). */
  tol?: number;
}

/** Condición compuesta de un paso. */
export interface Condicion {
  todas?: Regla[];
  alguna?: Regla[];
  /** Segundos que la condición debe sostenerse sin interrupción. */
  durante?: number;
}

/**
 * Lee el valor de una métrica desde la instantánea y los parámetros.
 * @returns Número, texto (fases) o `undefined` si la métrica no existe.
 */
export function leerMetrica(m: string, s: Instantanea, p: Parametros): number | string | undefined {
  const [k, a, b] = m.split(':');
  switch (k) {
    case 'temperatura': return s.Tch;
    case 'presion': return p.P;
    case 'volumen': return p.V;
    case 'uv': return p.UV;
    case 'lambda': return p.lambda;
    case 'chispas': return s.chispas;
    case 'reacciones_total': return Object.values(s.rxById).reduce((t, n) => t + n, 0);
    case 'conteo': return s.counts[a] ?? 0;
    case 'fase': return (s.counts[a] ?? 0) > 0 ? s.phases[a] : '—';
    case 'fase_predominante': return s.phase;
    case 'reacciones': return s.rxById[a] ?? 0;
    case 'fotolisis': return s.fotolisis[a] ?? 0;
    case 'razon': {
      const den = s.counts[b] ?? 0;
      return den ? (s.counts[a] ?? 0) / den : 0;
    }
    default: return undefined;
  }
}

/** Evalúa una regla atómica. */
export function evaluarRegla(r: Regla, s: Instantanea, p: Parametros): boolean {
  const v = leerMetrica(r.metrica, s, p);
  if (v === undefined) return false;
  if (r.op === '==') return v === r.valor;
  if (typeof v !== 'number' || typeof r.valor !== 'number') return false;
  switch (r.op) {
    case '>=': return v >= r.valor;
    case '<=': return v <= r.valor;
    case '>': return v > r.valor;
    case '<': return v < r.valor;
    case 'approx': return Math.abs(v - r.valor) <= Math.abs(r.valor) * (r.tol ?? 0.1);
    default: return false;
  }
}

/** Evalúa la condición compuesta (sin considerar `durante`). */
export function evaluar(c: Condicion, s: Instantanea, p: Parametros): boolean {
  const todas = c.todas ? c.todas.every((r) => evaluarRegla(r, s, p)) : true;
  const alguna = c.alguna ? c.alguna.some((r) => evaluarRegla(r, s, p)) : true;
  return todas && alguna;
}

/** Estado de cada regla para mostrar una lista de verificación al estudiante. */
export function detalle(c: Condicion, s: Instantanea, p: Parametros): Array<{ regla: Regla; ok: boolean; actual: number | string | undefined }> {
  return [...(c.todas ?? []), ...(c.alguna ?? [])].map((regla) => ({ regla, ok: evaluarRegla(regla, s, p), actual: leerMetrica(regla.metrica, s, p) }));
}

/**
 * Seguimiento de un paso con condición sostenida (`durante`).
 * Llamar `actualizar` en cada fotograma; devuelve verdadero cuando el paso se cumple.
 */
export class SeguidorDePaso {
  private desde: number | null = null;

  constructor(private readonly c: Condicion) {}

  /** Progreso 0–1 del tiempo sostenido (para una barra). */
  progreso = 0;

  /**
   * @param s Instantanea actual.
   * @param p Parámetros actuales.
   * @returns Verdadero cuando la condición se sostuvo el tiempo requerido.
   */
  actualizar(s: Instantanea, p: Parametros): boolean {
    const ok = evaluar(this.c, s, p);
    const req = this.c.durante ?? 0;
    if (!ok) {
      this.desde = null;
      this.progreso = 0;
      return false;
    }
    if (req <= 0) {
      this.progreso = 1;
      return true;
    }
    this.desde ??= s.t;
    this.progreso = Math.min(1, (s.t - this.desde) / req);
    return this.progreso >= 1;
  }
}

/** Texto legible de una regla, para la lista de verificación. */
export function describirRegla(r: Regla, formula: (sp: string) => string): string {
  const [k, a, b] = r.metrica.split(':');
  const op = { '>=': '≥', '<=': '≤', '==': '=', '>': '>', '<': '<', approx: '≈' }[r.op];
  const nombres: Record<string, string> = {
    temperatura: 'Temperatura', presion: 'Presión', volumen: 'Volumen', uv: 'Intensidad UV', lambda: 'Longitud de onda',
    chispas: 'Chispas', reacciones_total: 'Reacciones',
  };
  const unidades: Record<string, string> = { temperatura: ' K', presion: ' atm', volumen: ' L', uv: ' W/m²', lambda: ' nm' };
  switch (k) {
    case 'conteo': return `${formula(a)} en la cámara ${op} ${r.valor}`;
    case 'fase': return `${formula(a)} en estado ${String(r.valor).toLowerCase()}`;
    case 'reacciones': return `Reacciones «${a}» ${op} ${r.valor}`;
    case 'fotolisis': return `Fotólisis de ${formula(a)} ${op} ${r.valor}`;
    case 'razon': return `Proporción ${formula(a)} : ${formula(b)} ${op} ${r.valor} : 1`;
    default: return `${nombres[k] ?? k} ${op} ${r.valor}${unidades[k] ?? ''}`;
  }
}
