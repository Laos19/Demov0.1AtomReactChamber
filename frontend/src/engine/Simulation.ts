/**
 * Motor de simulación de la cámara: dinámica de discos rígidos 2D, termostato de Berendsen,
 * reacciones por colisión con energía de activación, fotólisis UV y cambios de fase.
 * Independiente del DOM: se puede ejecutar en Node (pruebas) o en el navegador.
 * @module engine/Simulation
 */
import {
  R_KJ, PHOTON_KJ_NM, TRANSICION, claveDePar, conSigno, esPlasma, faseDe,
  type Fase, type Parametros, type Quimica, type Reaccion,
} from './chemistry';

/** px/frame por √(K/uma). */
export const SPEED_K = 0.35;
/** K por (kJ/mol/molécula) liberados a la cámara. */
export const HEAT_GAIN = 12;
/** Fracción de |ΔH| depositada como energía cinética local. */
export const LOCAL_FRAC = 0.05;
/** Límite de partículas (rendimiento). */
export const MAX_PARTICULAS = 900;
const VMAX = 22;

/** Partícula (molécula, átomo o radical) en la cámara. */
export interface Particula {
  id: number;
  sp: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Ángulo de rotación (rad). */
  a: number;
  /** Velocidad angular. */
  w: number;
  r: number;
  m: number;
  /** Tiempo de nacimiento (s de simulación). */
  born: number;
  dead: boolean;
}

/** Efecto visual transitorio (destello, fotón, chispa). */
export interface Efecto {
  type: 'flash' | 'photon' | 'shock';
  x: number;
  y: number;
  r: number;
  max: number;
  life: number;
  color: string;
}

/** Entrada de la consola de eventos. */
export interface EntradaLog {
  id: string;
  t: number;
  type: 'rx' | 'bond' | 'endo' | 'photon' | 'heat' | 'phase' | 'warn' | 'info';
  text: string;
}

/** Rectángulo interior de la cámara (depende del volumen). */
export interface Caja { x: number; y: number; w: number; h: number }

/** Instantánea del estado para la interfaz y la evaluación de pasos. */
export interface Instantanea {
  t: number;
  Tch: number;
  Tk: number;
  N: number;
  atoms: number;
  counts: Record<string, number>;
  phases: Record<string, Fase>;
  phase: Fase | '—';
  plasma: boolean;
  collRate: number;
  rxRate: number;
  rxById: Record<string, number>;
  fotolisis: Record<string, number>;
  chispas: number;
  tMax: number;
  log: EntradaLog[];
}

/** Generador de números aleatorios en [0, 1). */
export type Rng = () => number;

/**
 * Cámara de simulación.
 *
 * @example
 * const sim = new Simulation(quimica);
 * sim.ajustarCaja(800, 500, 25, true);
 * sim.inyectar('H2', 40);
 * sim.paso(params, 1); // un fotograma a 60 FPS
 */
export class Simulation {
  particulas: Particula[] = [];
  efectos: Efecto[] = [];
  log: EntradaLog[] = [];
  caja: Caja | null = null;
  /** Tiempo de simulación (s). */
  t = 0;
  /** Temperatura de la cámara (K): relaja hacia la consigna y sube con reacciones exotérmicas. */
  Tch: number;
  /** Temperatura cinética medida de las partículas (K). */
  Tk: number;
  /** Máxima temperatura alcanzada. */
  tMax: number;
  rxCount = 0;
  rxById: Record<string, number> = {};
  fotolisis: Record<string, number> = {};
  chispas = 0;
  private nextId = 1;
  private collCount = 0;
  private pendientes: Array<{ sp: string; n: number; at?: { x: number; y: number } }> = [];
  private nacidos: Particula[] = [];
  private lastLog: Record<string, number> = {};
  private pendLog: Record<string, number> = {};
  private lastPhase: Record<string, Fase> = {};
  private flags = { highP: false, plasma: false, tBand: 0 };
  private rate = { t: 0, coll: 0, rx: 0, collRate: 0, rxRate: 0 };

  /**
   * @param q Tablas químicas.
   * @param T0 Temperatura inicial (K).
   * @param rng Generador aleatorio (inyectable para pruebas deterministas).
   */
  constructor(
    readonly q: Quimica,
    T0 = 300,
    private readonly rng: Rng = Math.random,
  ) {
    this.Tch = T0;
    this.Tk = T0;
    this.tMax = T0;
  }

  /** Normal estándar (Box-Muller). */
  private gauss(): number {
    let u = 0;
    let v = 0;
    while (!u) u = this.rng();
    while (!v) v = this.rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Agrega una línea a la consola de eventos. */
  registrar(type: EntradaLog['type'], text: string): void {
    this.log.unshift({ id: `${this.t.toFixed(3)}-${this.rng()}`, t: this.t, type, text });
    if (this.log.length > 200) this.log.length = 200;
  }

  private crear(sp: string, x: number, y: number, T: number): Particula {
    const s = this.q.especies[sp];
    const sig = SPEED_K * Math.sqrt(Math.max(T, 1) / s.masa_molar);
    return {
      id: this.nextId++, sp, x, y, vx: this.gauss() * sig, vy: this.gauss() * sig,
      a: this.rng() * Math.PI * 2, w: (this.rng() - 0.5) * 0.12, r: s.radius, m: s.masa_molar, born: -10, dead: false,
    };
  }

  /**
   * Inyecta `n` partículas de una especie (al azar o alrededor de un punto).
   * Si la caja aún no existe, quedan pendientes hasta el primer `ajustarCaja`.
   * @returns Cantidad realmente agregada (respeta MAX_PARTICULAS).
   */
  inyectar(sp: string, n: number, at?: { x: number; y: number }): number {
    const b = this.caja;
    if (!b) {
      this.pendientes.push({ sp, n, at });
      return 0;
    }
    const s = this.q.especies[sp];
    let added = 0;
    for (let k = 0; k < n && this.particulas.length < MAX_PARTICULAS; k++) {
      let x = 0;
      let y = 0;
      for (let tries = 0; tries < 12; tries++) {
        if (at) {
          x = at.x + this.gauss() * 14;
          y = at.y + this.gauss() * 14;
        } else {
          x = b.x + s.radius + this.rng() * (b.w - 2 * s.radius);
          y = b.y + s.radius + this.rng() * (b.h - 2 * s.radius);
        }
        x = Math.min(b.x + b.w - s.radius, Math.max(b.x + s.radius, x));
        y = Math.min(b.y + b.h - s.radius, Math.max(b.y + s.radius, y));
        if (this.particulas.every((q) => (q.x - x) ** 2 + (q.y - y) ** 2 > (q.r + s.radius) ** 2)) break;
      }
      this.particulas.push(this.crear(sp, x, y, this.Tch));
      added++;
    }
    return added;
  }

  /** Elimina todas las partículas y efectos. */
  vaciar(): void {
    this.particulas = [];
    this.efectos = [];
  }

  /**
   * Reinicia la cámara a una temperatura dada (contadores a cero).
   * @param T0 Temperatura inicial (K).
   */
  reiniciar(T0: number): void {
    this.vaciar();
    this.log = [];
    this.t = 0;
    this.Tch = this.Tk = this.tMax = T0;
    this.rxCount = 0;
    this.rxById = {};
    this.fotolisis = {};
    this.chispas = 0;
    this.lastPhase = {};
    this.flags = { highP: false, plasma: false, tBand: Math.floor(T0 / 500) };
  }

  private efecto(e: Omit<Efecto, 'life'>): void {
    this.efectos.push({ ...e, life: e.max });
    if (this.efectos.length > 160) this.efectos.shift();
  }

  private reaccionar(p: Particula, q: Particula, rx: Reaccion, E: number): void {
    const S = this.q.especies;
    p.dead = true;
    q.dead = true;
    const M = p.m + q.m;
    const Vx = (p.m * p.vx + q.m * q.vx) / M;
    const Vy = (p.m * p.vy + q.m * q.vy) / M;
    const cx = (p.m * p.x + q.m * q.x) / M;
    const cy = (p.m * p.y + q.m * q.y) / M;
    const born: Particula[] = [];
    if (rx.productos.length === 1) {
      const np = this.crear(rx.productos[0], cx, cy, 0);
      np.vx = Vx;
      np.vy = Vy;
      born.push(np);
    } else {
      const [s1, s2] = rx.productos.map((k) => S[k]);
      const th = this.rng() * Math.PI * 2;
      const dx = Math.cos(th);
      const dy = Math.sin(th);
      const sep = s1.radius + s2.radius + 1;
      const a = this.crear(rx.productos[0], cx - dx * sep * (s2.masa_molar / M), cy - dy * sep * (s2.masa_molar / M), 0);
      const b = this.crear(rx.productos[1], cx + dx * sep * (s1.masa_molar / M), cy + dy * sep * (s1.masa_molar / M), 0);
      const Erel = rx.dH > 0 ? Math.max(0.15 * E, E - rx.dH) : E + -rx.dH * LOCAL_FRAC;
      const KE = (Erel / R_KJ) * SPEED_K * SPEED_K;
      const mu = (s1.masa_molar * s2.masa_molar) / (s1.masa_molar + s2.masa_molar);
      const prel = Math.sqrt(2 * KE * mu);
      a.vx = Vx - (prel / s1.masa_molar) * dx;
      a.vy = Vy - (prel / s1.masa_molar) * dy;
      b.vx = Vx + (prel / s2.masa_molar) * dx;
      b.vy = Vy + (prel / s2.masa_molar) * dy;
      born.push(a, b);
    }
    for (const np of born) np.born = this.t;
    this.nacidos.push(...born);

    const N = Math.max(this.particulas.length, 30);
    this.Tch = Math.min(6000, Math.max(0, this.Tch + (-rx.dH * HEAT_GAIN) / N));
    this.rxCount++;
    this.rxById[rx.codigo] = (this.rxById[rx.codigo] || 0) + 1;
    const exo = rx.dH < 0;
    this.efecto({ type: 'flash', x: cx, y: cy, max: 26, r: 10 + Math.min(40, Math.abs(rx.dH) / 12), color: exo ? '251,146,60' : '56,189,248' });

    this.pendLog[rx.codigo] = (this.pendLog[rx.codigo] || 0) + 1;
    if (this.t - (this.lastLog[rx.codigo] ?? -99) >= 2) {
      const k = this.pendLog[rx.codigo];
      this.registrar('rx', `Choque efectivo a ${Math.round(this.Tch)} K · ${rx.eq} (E = ${E.toFixed(1)} ≥ Eₐ ${rx.ea} kJ/mol)${k > 1 ? ` ×${k}` : ''}`);
      this.registrar(exo ? 'bond' : 'endo', `Enlace ${rx.enlace} formado · ΔH = ${conSigno(rx.dH)} kJ/mol (${exo ? 'libera' : 'absorbe'} energía)`);
      this.lastLog[rx.codigo] = this.t;
      this.pendLog[rx.codigo] = 0;
    }
  }

  private disociar(p: Particula, extraKJ: number, causa: 'uv' | 'plasma'): void {
    const S = this.q.especies;
    const ph = this.q.fotolisis[p.sp];
    p.dead = true;
    const [k1, k2] = ph.productos;
    const th = this.rng() * Math.PI * 2;
    const dx = Math.cos(th);
    const dy = Math.sin(th);
    const s = S[k1];
    const a = this.crear(k1, p.x - dx * s.radius, p.y - dy * s.radius, 0);
    const b = this.crear(k2, p.x + dx * s.radius, p.y + dy * s.radius, 0);
    const v = Math.sqrt(((Math.max(0.5, extraKJ) / R_KJ) * SPEED_K * SPEED_K) / s.masa_molar);
    a.vx = p.vx - v * dx;
    a.vy = p.vy - v * dy;
    b.vx = p.vx + v * dx;
    b.vy = p.vy + v * dy;
    a.born = b.born = this.t;
    this.nacidos.push(a, b);
    if (causa === 'uv') this.fotolisis[p.sp] = (this.fotolisis[p.sp] || 0) + 1;
    this.efecto({ type: 'photon', x: p.x, y: p.y, max: 22, r: 16, color: '192,132,252' });
    const key = `photo:${p.sp}:${causa}`;
    this.pendLog[key] = (this.pendLog[key] || 0) + 1;
    if (this.t - (this.lastLog[key] ?? -99) >= 2.5) {
      const n = this.pendLog[key];
      this.registrar('photon', causa === 'uv'
        ? `Fotólisis: ${S[p.sp].formula} + hν → 2 ${S[k1].formula} (rompe ${ph.etiqueta}, ${ph.enlace_kj} kJ/mol)${n > 1 ? ` ×${n}` : ''}`
        : `Disociación en plasma: ${S[p.sp].formula} → 2 ${S[k1].formula}${n > 1 ? ` ×${n}` : ''}`);
      this.lastLog[key] = this.t;
      this.pendLog[key] = 0;
    }
  }

  /**
   * Ajusta el rectángulo de la cámara al lienzo y al volumen (√V para que el área escale con V).
   * @param W Ancho del lienzo (px lógicos).
   * @param H Alto del lienzo.
   * @param V Volumen (L).
   * @param snap Si es verdadero, salta al tamaño final sin animación.
   */
  ajustarCaja(W: number, H: number, V: number, snap = false): void {
    const s = 0.25 + 0.75 * Math.sqrt(V / 50);
    const tw = (W - 32) * s;
    const th = (H - 32) * s;
    const target = { x: (W - tw) / 2, y: (H - th) / 2, w: tw, h: th };
    if (!this.caja || snap) {
      this.caja = target;
    } else {
      for (const k of ['x', 'y', 'w', 'h'] as const) this.caja[k] += (target[k] - this.caja[k]) * 0.18;
    }
    if (this.pendientes.length) {
      const p = this.pendientes;
      this.pendientes = [];
      for (const { sp, n, at } of p) this.inyectar(sp, n, at);
    }
  }

  /** Tabla de fases de todas las especies a la T y P actuales. */
  tablaDeFases(prm: Parametros): { table: Record<string, Fase>; plasma: boolean } {
    const plasma = esPlasma(this.Tch, prm);
    const table: Record<string, Fase> = {};
    for (const sp of this.q.orden) table[sp] = plasma ? 'Plasma' : faseDe(this.q, sp, this.Tch, prm.P);
    return { table, plasma };
  }

  /**
   * Avanza la simulación un fotograma.
   * @param prm Parámetros actuales de la cámara.
   * @param dtFrame Fotogramas a avanzar (1 = 1/60 s; la velocidad 2x usa 2).
   */
  paso(prm: Parametros, dtFrame = 1): void {
    const b = this.caja;
    if (!b) return;
    const S = this.q.especies;
    const ps = this.particulas;
    this.nacidos = [];
    const { table: phase, plasma } = this.tablaDeFases(prm);

    // Termostato de Berendsen (sobre partículas móviles).
    let ke = 0;
    let nm = 0;
    for (const p of ps) {
      if (phase[p.sp] === 'Sólido') continue;
      ke += p.m * (p.vx * p.vx + p.vy * p.vy);
      nm++;
    }
    this.Tk = nm ? ke / (2 * SPEED_K * SPEED_K * nm) : 0;
    let lam = 1;
    if (this.Tk > 0.5) lam = Math.min(1.1, Math.max(0.9, Math.sqrt(1 + 0.03 * dtFrame * (this.Tch / this.Tk - 1))));
    else if (this.Tch > 1) {
      for (const p of ps) {
        const sig = SPEED_K * Math.sqrt(this.Tch / p.m);
        p.vx += this.gauss() * sig * 0.3;
        p.vy += this.gauss() * sig * 0.3;
      }
    }

    let vmax = 0;
    for (const p of ps) {
      if (phase[p.sp] !== 'Sólido') {
        p.vx *= lam;
        p.vy *= lam;
      }
      vmax = Math.max(vmax, Math.abs(p.vx), Math.abs(p.vy));
    }
    const nSub = Math.min(12, Math.max(1, Math.ceil((vmax * dtFrame) / 3)));
    const dt = dtFrame / nSub;
    const pm = 1 + 0.15 * Math.log10(prm.P);
    const pf = Math.min(3, Math.sqrt(prm.P));

    for (let sub = 0; sub < nSub; sub++) {
      for (const p of ps) {
        if (p.dead) continue;
        const ph = phase[p.sp];
        if (ph === 'Sólido') {
          const d = Math.pow(0.9, dt);
          p.vx *= d;
          p.vy = p.vy * d + 0.12 * dt;
          p.w *= d;
        } else if (ph === 'Líquido') {
          p.vy += 0.05 * dt;
        }
        const sp2 = p.vx * p.vx + p.vy * p.vy;
        if (sp2 > VMAX * VMAX) {
          const k = VMAX / Math.sqrt(sp2);
          p.vx *= k;
          p.vy *= k;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.a += p.w * dt;
        const r = p.r;
        if (p.x < b.x + r) { p.x = b.x + r; p.vx = Math.abs(p.vx); }
        else if (p.x > b.x + b.w - r) { p.x = b.x + b.w - r; p.vx = -Math.abs(p.vx); }
        if (p.y < b.y + r) { p.y = b.y + r; p.vy = Math.abs(p.vy); }
        else if (p.y > b.y + b.h - r) { p.y = b.y + b.h - r; p.vy = -Math.abs(p.vy) * (ph === 'Sólido' ? 0.5 : 1); }
      }

      // Colisiones con rejilla espacial: O(n) en lugar de O(n²).
      const cell = 30;
      const cols = Math.ceil((b.x + b.w) / cell) + 2;
      const grid = new Map<number, number[]>();
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (p.dead) continue;
        const key = Math.floor(p.x / cell) + Math.floor(p.y / cell) * cols;
        const arr = grid.get(key);
        if (arr) arr.push(i);
        else grid.set(key, [i]);
      }
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (p.dead) continue;
        const cx = Math.floor(p.x / cell);
        const cy = Math.floor(p.y / cell);
        for (let oy = -1; oy <= 1 && !p.dead; oy++) {
          for (let ox = -1; ox <= 1 && !p.dead; ox++) {
            const arr = grid.get(cx + ox + (cy + oy) * cols);
            if (!arr) continue;
            for (const j of arr) {
              if (j <= i) continue;
              const q = ps[j];
              if (q.dead) continue;
              const dx = q.x - p.x;
              const dy = q.y - p.y;
              const rr = (p.r + q.r) * pm;
              const d2 = dx * dx + dy * dy;
              if (d2 >= rr * rr || d2 === 0) continue;
              const d = Math.sqrt(d2);
              const nx = dx / d;
              const ny = dy / d;
              const rvx = q.vx - p.vx;
              const rvy = q.vy - p.vy;
              const vn = rvx * nx + rvy * ny;
              if (vn < 0) {
                this.collCount++;
                const rules = this.q.reaccionesPorPar[claveDePar(p.sp, q.sp)];
                if (rules) {
                  const mu = (p.m * q.m) / (p.m + q.m);
                  const E = ((0.5 * mu * (rvx * rvx + rvy * rvy)) / (SPEED_K * SPEED_K)) * R_KJ;
                  const boost = plasma ? 2 : 1;
                  const rx = rules.find((r) => E >= r.ea && this.rng() < r.esterico * pf * boost);
                  if (rx) {
                    this.reaccionar(p, q, rx, E);
                    break;
                  }
                }
                const solid = phase[p.sp] === 'Sólido' && phase[q.sp] === 'Sólido';
                const e = solid ? 0.3 : 1;
                const jimp = ((1 + e) * vn) / (1 / p.m + 1 / q.m);
                p.vx += (jimp * nx) / p.m;
                p.vy += (jimp * ny) / p.m;
                q.vx -= (jimp * nx) / q.m;
                q.vy -= (jimp * ny) / q.m;
              }
              const ov = rr - d;
              const tot = p.m + q.m;
              p.x -= nx * ov * (q.m / tot);
              p.y -= ny * ov * (q.m / tot);
              q.x += nx * ov * (p.m / tot);
              q.y += ny * ov * (p.m / tot);
            }
          }
        }
      }
    }

    // Fotólisis UV / disociación en plasma
    if (prm.UV > 0 || plasma) {
      const Eph = PHOTON_KJ_NM / prm.lambda;
      for (const p of ps) {
        if (p.dead) continue;
        const ph = this.q.fotolisis[p.sp];
        if (!ph) continue;
        if (prm.UV > 0 && Eph >= ph.enlace_kj && this.rng() < (prm.UV / 1000) * ph.seccion_eficaz * dtFrame) {
          this.disociar(p, (Eph - ph.enlace_kj) * 0.05, 'uv');
        } else if (plasma && this.rng() < 0.003 * dtFrame) {
          this.disociar(p, 5, 'plasma');
        }
      }
    }

    if (this.nacidos.length || ps.some((p) => p.dead)) {
      this.particulas = ps.filter((p) => !p.dead).concat(this.nacidos).slice(0, MAX_PARTICULAS);
    }

    // Relajación térmica hacia la consigna (τ ≈ 6 s)
    this.Tch += (prm.T - this.Tch) * Math.min(1, dtFrame / 360);
    this.tMax = Math.max(this.tMax, this.Tch);
    this.t += dtFrame / 60;

    for (const e of this.efectos) e.life -= dtFrame;
    this.efectos = this.efectos.filter((e) => e.life > 0);

    this.vigilarUmbrales(prm, phase, plasma);
    void S;
  }

  private vigilarUmbrales(prm: Parametros, phase: Record<string, Fase>, plasma: boolean): void {
    const f = this.flags;
    if (prm.P > 50 && !f.highP) this.registrar('warn', `Presión alta: ${prm.P.toFixed(1)} atm > 50 atm (gas muy denso)`);
    if (prm.P <= 50 && f.highP) this.registrar('info', `Presión normalizada: ${prm.P.toFixed(1)} atm`);
    f.highP = prm.P > 50;
    if (plasma !== f.plasma) {
      this.registrar(plasma ? 'warn' : 'info', plasma
        ? `Transición a PLASMA: ionización parcial a ${Math.round(this.Tch)} K`
        : `Plasma extinguido (${Math.round(this.Tch)} K)`);
      f.plasma = plasma;
    }
    const band = Math.floor(this.Tch / 500);
    if (band > f.tBand && band > 0) this.registrar('heat', `La cámara supera ${band * 500} K (RT = ${(R_KJ * this.Tch).toFixed(1)} kJ/mol)`);
    f.tBand = band;
    const present = new Set(this.particulas.map((p) => p.sp));
    for (const sp of present) {
      const now = phase[sp];
      const prev = this.lastPhase[sp];
      if (prev && prev !== now && now !== 'Plasma' && prev !== 'Plasma' && !this.q.especies[sp].radical) {
        this.registrar('phase', `${this.q.especies[sp].formula}: ${TRANSICION[`${prev}>${now}`] || 'cambio de fase'} → ${now} a ${Math.round(this.Tch)} K`);
      }
      this.lastPhase[sp] = now;
    }
  }

  /** Chispa: calienta una región a ≈5000 K (energía de activación puntual) y +300 K a la cámara. */
  chispa(): void {
    const b = this.caja;
    if (!b) return;
    const x = b.x + b.w * (0.35 + this.rng() * 0.3);
    const y = b.y + b.h * (0.35 + this.rng() * 0.3);
    const R = Math.min(110, Math.max(60, b.w * 0.18));
    let n = 0;
    for (const p of this.particulas) {
      if ((p.x - x) ** 2 + (p.y - y) ** 2 > R * R) continue;
      const sig = SPEED_K * Math.sqrt(5000 / p.m);
      p.vx = this.gauss() * sig;
      p.vy = this.gauss() * sig;
      n++;
    }
    this.chispas++;
    this.Tch = Math.min(6000, this.Tch + 300);
    this.efecto({ type: 'shock', x, y, max: 45, r: R, color: '253,224,71' });
    this.registrar('heat', `Chispa: ${n} partículas a ≈5000 K`);
  }

  /** Partícula más cercana a un punto (para inspeccionar con clic). */
  particulaEn(x: number, y: number): Particula | null {
    let best: Particula | null = null;
    let bd = Infinity;
    for (const p of this.particulas) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < (p.r + 6) ** 2 && d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  /**
   * Instantánea del estado actual.
   * @param prm Parámetros actuales.
   */
  instantanea(prm: Parametros): Instantanea {
    const counts: Record<string, number> = {};
    let atoms = 0;
    for (const p of this.particulas) {
      counts[p.sp] = (counts[p.sp] || 0) + 1;
      atoms += this.q.especies[p.sp].atoms;
    }
    const { table, plasma } = this.tablaDeFases(prm);
    const byPhase: Record<string, number> = {};
    for (const [sp, n] of Object.entries(counts)) byPhase[table[sp]] = (byPhase[table[sp]] || 0) + n;
    const phase = plasma ? 'Plasma' : ((Object.entries(byPhase).sort((a, b) => b[1] - a[1])[0]?.[0] as Fase) ?? '—');
    const r = this.rate;
    const dts = this.t - r.t;
    if (dts >= 0.5) {
      r.collRate = (this.collCount - r.coll) / dts;
      r.rxRate = (this.rxCount - r.rx) / dts;
      r.t = this.t;
      r.coll = this.collCount;
      r.rx = this.rxCount;
    }
    return {
      t: this.t, Tch: this.Tch, Tk: this.Tk, N: this.particulas.length, atoms, counts, phases: table, phase, plasma,
      collRate: r.collRate, rxRate: r.rxRate, rxById: { ...this.rxById }, fotolisis: { ...this.fotolisis },
      chispas: this.chispas, tMax: this.tMax, log: this.log.slice(0, 80),
    };
  }
}
