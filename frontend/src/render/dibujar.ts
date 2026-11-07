/**
 * Dibujo de la cámara en un canvas 2D (visor oscuro en ambos temas).
 * @module render/dibujar
 */
import { esPlasma, type Parametros, type Quimica } from '../engine/chemistry';
import type { Simulation } from '../engine/Simulation';

/** Sprite pre-renderizado de un átomo (evita gradientes por partícula en cada fotograma). */
export interface Sprite { c: HTMLCanvasElement; half: number; size: number }

/** Paradas de color de la pared según temperatura (azul → cian → naranja → blanco). */
const T_STOPS: Array<[number, [number, number, number]]> = [
  [0, [56, 189, 248]], [300, [34, 211, 238]], [900, [251, 146, 60]], [1800, [249, 115, 22]], [3000, [254, 240, 138]],
];

/** Color RGBA de la pared para una temperatura. */
export function colorTemperatura(T: number, a = 1): string {
  let i = 0;
  while (i < T_STOPS.length - 2 && T > T_STOPS[i + 1][0]) i++;
  const [t0, c0] = T_STOPS[i];
  const [t1, c1] = T_STOPS[i + 1];
  const k = Math.min(1, Math.max(0, (T - t0) / (t1 - t0)));
  const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/**
 * Crea los sprites de cada elemento para la densidad de píxeles dada.
 * @param q Tablas químicas (colores CPK).
 * @param dpr devicePixelRatio.
 */
export function crearSprites(q: Quimica, dpr: number): Record<string, Sprite> {
  const sprites: Record<string, Sprite> = {};
  for (const [k, a] of Object.entries(q.elementos)) {
    const size = Math.ceil((a.radio_px * 2 + 4) * dpr);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    const R = a.radio_px * dpr;
    const m = size / 2;
    const grad = g.createRadialGradient(m - R * 0.35, m - R * 0.35, R * 0.1, m, m, R);
    grad.addColorStop(0, a.brillo);
    grad.addColorStop(0.45, a.color);
    grad.addColorStop(1, 'rgba(15,23,42,0.95)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(m, m, R, 0, Math.PI * 2);
    g.fill();
    sprites[k] = { c, half: size / 2 / dpr, size: size / dpr };
  }
  return sprites;
}

function triangulo(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number) {
  ctx.beginPath();
  ctx.moveTo(x + dx * 4, y + dy * 4);
  ctx.lineTo(x - dy * 4 - dx * 2, y - dx * 4 - dy * 2);
  ctx.lineTo(x + dy * 4 - dx * 2, y + dx * 4 - dy * 2);
  ctx.fill();
}

/**
 * Dibuja un fotograma completo.
 * @param resaltar Código de especie a resaltar (inspección).
 * @param reducido Si es verdadero, omite efectos decorativos (prefers-reduced-motion).
 */
export function dibujar(
  ctx: CanvasRenderingContext2D, sim: Simulation, prm: Parametros, W: number, H: number,
  sprites: Record<string, Sprite>, resaltar: string | null, reducido = false,
): void {
  const b = sim.caja;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b1524';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(148,163,184,0.08)';
  for (let x = 12; x < W; x += 24) for (let y = 12; y < H; y += 24) ctx.fillRect(x, y, 1, 1);
  if (!b) return;

  const T = sim.Tch;
  const plasma = esPlasma(T, prm);
  const S = sim.q.especies;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 10);
  const inner = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, 10, b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) * 0.7);
  inner.addColorStop(0, plasma ? 'rgba(217,70,239,0.16)' : colorTemperatura(T, 0.08));
  inner.addColorStop(1, 'rgba(2,6,23,0.6)');
  ctx.fillStyle = inner;
  ctx.fill();
  ctx.clip();

  if (prm.P > 5) {
    ctx.fillStyle = `rgba(56,189,248,${Math.min(0.08, Math.log10(prm.P) * 0.04)})`;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  if (prm.UV > 0) {
    const a = (prm.UV / 1000) * 0.22;
    const hue = prm.lambda < 200 ? '168,85,247' : prm.lambda < 300 ? '192,132,252' : '129,140,248';
    ctx.strokeStyle = `rgba(${hue},${a})`;
    ctx.lineWidth = 2;
    const off = reducido ? 0 : (sim.t * 120) % 40;
    for (let x = b.x - b.h; x < b.x + b.w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + off, b.y);
      ctx.lineTo(x + off + b.h * 0.5, b.y + b.h);
      ctx.stroke();
    }
  }

  for (const p of sim.particulas) {
    const s = S[p.sp];
    const age = sim.t - p.born;
    if (age < 0.6 && !reducido) {
      ctx.strokeStyle = `rgba(52,211,153,${0.8 * (1 - age / 0.6)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 4 + age * 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (plasma) {
      ctx.fillStyle = 'rgba(232,121,249,0.18)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (s.radical) {
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = 'rgba(250,204,21,0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (resaltar === p.sp) {
      ctx.strokeStyle = 'rgba(34,211,238,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    const ca = Math.cos(p.a);
    const sa = Math.sin(p.a);
    for (const [atom, dx, dy] of s.atomos) {
      const sp = sprites[atom];
      const x = p.x + dx * ca - dy * sa;
      const y = p.y + dx * sa + dy * ca;
      ctx.drawImage(sp.c, x - sp.half, y - sp.half, sp.size, sp.size);
    }
  }

  for (const e of sim.efectos) {
    const k = e.life / e.max;
    if (e.type === 'flash') {
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * (1.6 - k * 0.6));
      g.addColorStop(0, `rgba(${e.color},${0.75 * k})`);
      g.addColorStop(1, `rgba(${e.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (1.6 - k * 0.6), 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'photon') {
      ctx.strokeStyle = `rgba(${e.color},${k})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const an = (i / 6) * Math.PI * 2 + sim.t;
        ctx.moveTo(e.x + Math.cos(an) * 4, e.y + Math.sin(an) * 4);
        ctx.lineTo(e.x + Math.cos(an) * e.r * (1.5 - k), e.y + Math.sin(an) * e.r * (1.5 - k));
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(${e.color},${k})`;
      ctx.lineWidth = 3 * k + 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (1.3 - k), 0, Math.PI * 2);
      ctx.stroke();
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0, `rgba(254,240,138,${0.45 * k})`);
      g.addColorStop(1, 'rgba(251,146,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.shadowColor = plasma ? 'rgba(232,121,249,0.8)' : colorTemperatura(T, 0.7);
  ctx.shadowBlur = 16;
  ctx.strokeStyle = plasma ? 'rgba(232,121,249,0.9)' : colorTemperatura(T, 0.9);
  ctx.lineWidth = 1.5 + Math.min(3, Math.log10(Math.max(1, prm.P)) * 1.4);
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 10);
  ctx.stroke();
  ctx.restore();

  if (prm.P > 10) {
    ctx.fillStyle = 'rgba(56,189,248,0.55)';
    const n = 5;
    for (let i = 1; i <= n; i++) {
      const x = b.x + (b.w * i) / (n + 1);
      const y = b.y + (b.h * i) / (n + 1);
      triangulo(ctx, x, b.y - 6, 0, 1);
      triangulo(ctx, x, b.y + b.h + 6, 0, -1);
      triangulo(ctx, b.x - 6, y, 1, 0);
      triangulo(ctx, b.x + b.w + 6, y, -1, 0);
    }
  }
}
