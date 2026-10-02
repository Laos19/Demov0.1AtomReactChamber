import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Atom,
  Box,
  FlaskConical,
  Gauge,
  Pause,
  Play,
  Plus,
  RotateCcw,
  StepForward,
  Sun,
  Terminal,
  Thermometer,
  Trash2,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------------ *
 *  AtomReactChamber v0.1
 *  Cámara de simulación termodinámica y molecular (prototipo funcional).
 *
 *  Modelo:
 *   - Discos rígidos 2D con colisiones elásticas y rejilla espacial.
 *   - Velocidades de Maxwell-Boltzmann: σ = K·√(T/M)  →  v ∝ √T.
 *   - Termostato de Berendsen hacia la temperatura de la cámara.
 *   - Reacción en colisión si E_rel ≥ Eₐ (con factor estérico y de presión).
 *   - ΔH a partir de entalpías de formación estándar (kJ/mol); el calor
 *     liberado eleva la temperatura de la cámara (posible ignición en cadena).
 *   - Fotólisis si la energía del fotón (119 627 / λ[nm] kJ/mol) supera el
 *     enlace. Las Eₐ son valores de modelo a escala pedagógica.
 * ------------------------------------------------------------------------ */

const R_KJ = 0.008314; // kJ/(mol·K)
const SPEED_K = 0.35; // px/frame por √(K/uma)
const HEAT_GAIN = 12; // K por (kJ/mol / molécula) liberados a la cámara
const LOCAL_FRAC = 0.05; // fracción de |ΔH| depositada como energía cinética local
const MAX_PARTICLES = 900;
const VMAX = 22;
const PHOTON_KJ_NM = 119627;

const ATOMS = {
  H: { color: '#e2e8f0', glow: '#ffffff', r: 4 },
  O: { color: '#f87171', glow: '#fecaca', r: 6 },
  Na: { color: '#a78bfa', glow: '#ddd6fe', r: 8 },
  Cl: { color: '#4ade80', glow: '#bbf7d0', r: 7 },
  C: { color: '#94a3b8', glow: '#e2e8f0', r: 6.5 },
};

// mp/bp en K a 1 atm, dHvap en kJ/mol, dHf en kJ/mol (estado estándar).
const SPECIES = {
  H2: { f: 'H₂', name: 'Hidrógeno', mass: 2.016, dHf: 0, mp: 14, bp: 20.3, dHvap: 0.9, cid: 783,
    layout: [['H', -3.5, 0], ['H', 3.5, 0]] },
  O2: { f: 'O₂', name: 'Oxígeno', mass: 31.998, dHf: 0, mp: 54.4, bp: 90.2, dHvap: 6.8, cid: 977,
    layout: [['O', -5, 0], ['O', 5, 0]] },
  Na: { f: 'Na', name: 'Sodio', mass: 22.99, dHf: 0, mp: 370.9, bp: 1156, dHvap: 97.4, cid: 5360545,
    layout: [['Na', 0, 0]] },
  H2O: { f: 'H₂O', name: 'Agua', mass: 18.015, dHf: -241.8, mp: 273.15, bp: 373.15, dHvap: 40.7, cid: 962,
    layout: [['O', 0, -1.5], ['H', -6, 3.5], ['H', 6, 3.5]] },
  Cl2: { f: 'Cl₂', name: 'Cloro', mass: 70.9, dHf: 0, mp: 171.6, bp: 239.1, dHvap: 20.4, cid: 24526,
    layout: [['Cl', -6, 0], ['Cl', 6, 0]] },
  C: { f: 'C', name: 'Carbono (grafito)', mass: 12.011, dHf: 0, mp: 3800, bp: 4100, dHvap: 715, cid: 5462310,
    layout: [['C', 0, 0]] },
  NaOH: { f: 'NaOH', name: 'Hidróxido de sodio', mass: 39.997, dHf: -425.8, mp: 591, bp: 1661, dHvap: 175, cid: 14798,
    layout: [['Na', -6, 0], ['O', 5, 0], ['H', 11, -3]] },
  NaCl: { f: 'NaCl', name: 'Cloruro de sodio', mass: 58.44, dHf: -411.2, mp: 1074, bp: 1686, dHvap: 171, cid: 5234,
    layout: [['Na', -6, 0], ['Cl', 6, 0]] },
  CO2: { f: 'CO₂', name: 'Dióxido de carbono', mass: 44.009, dHf: -393.5, mp: 216.6, bp: 194.7, dHvap: 25.2, cid: 280,
    sublimes: { P: 5.1, T: 216.6, dHvap: 16.7 }, layout: [['O', -10, 0], ['C', 0, 0], ['O', 10, 0]] },
  HCl: { f: 'HCl', name: 'Cloruro de hidrógeno', mass: 36.46, dHf: -92.3, mp: 159, bp: 188, dHvap: 16.2, cid: 313,
    layout: [['H', -6, 0], ['Cl', 3, 0]] },
  H: { f: 'H·', name: 'Hidrógeno atómico (radical)', mass: 1.008, dHf: 218.0, radical: true, layout: [['H', 0, 0]] },
  O: { f: 'O·', name: 'Oxígeno atómico (radical)', mass: 15.999, dHf: 249.2, radical: true, layout: [['O', 0, 0]] },
  Cl: { f: 'Cl·', name: 'Cloro atómico (radical)', mass: 35.45, dHf: 121.3, radical: true, layout: [['Cl', 0, 0]] },
};
for (const s of Object.values(SPECIES)) {
  s.radius = Math.max(...s.layout.map(([a, x, y]) => Math.hypot(x, y) + ATOMS[a].r));
  s.atoms = s.layout.length;
  s.color = ATOMS[s.layout[0][0]].color;
}
const INJECTABLE = ['H2', 'O2', 'Na', 'H2O', 'Cl2', 'C'];
const SPECIES_ORDER = ['H2', 'O2', 'Na', 'H2O', 'Cl2', 'C', 'NaOH', 'NaCl', 'CO2', 'HCl', 'H', 'O', 'Cl'];

// Reacciones elementales bimoleculares (Eₐ de modelo, kJ/mol).
const REACTIONS = [
  { id: 'h2o2', r: ['H2', 'O2'], p: ['H2O', 'O'], Ea: 34, steric: 0.6, bond: 'H–O', label: 'Iniciación térmica' },
  { id: 'oh2', r: ['O', 'H2'], p: ['H2O'], Ea: 10, steric: 0.8, bond: 'H–O', label: 'Propagación' },
  { id: 'naw', r: ['Na', 'H2O'], p: ['NaOH', 'H'], Ea: 34, steric: 0.8, bond: 'Na–O', label: 'Transferencia electrónica' },
  { id: 'hh', r: ['H', 'H'], p: ['H2'], Ea: 0, steric: 0.3, bond: 'H–H', label: 'Recombinación radicalaria' },
  { id: 'oo', r: ['O', 'O'], p: ['O2'], Ea: 0, steric: 0.25, bond: 'O=O', label: 'Recombinación radicalaria' },
  { id: 'nacl2', r: ['Na', 'Cl2'], p: ['NaCl', 'Cl'], Ea: 6, steric: 0.7, bond: 'Na–Cl', label: 'Oxidación del metal' },
  { id: 'nacl', r: ['Na', 'Cl'], p: ['NaCl'], Ea: 0, steric: 0.6, bond: 'Na–Cl', label: 'Captura de radical' },
  { id: 'co2', r: ['C', 'O2'], p: ['CO2'], Ea: 38, steric: 0.5, bond: 'C=O', label: 'Combustión del carbono' },
  { id: 'clh2', r: ['Cl', 'H2'], p: ['HCl', 'H'], Ea: 10, steric: 0.6, bond: 'H–Cl', label: 'Propagación (cadena)' },
  { id: 'hcl2', r: ['H', 'Cl2'], p: ['HCl', 'Cl'], Ea: 5, steric: 0.7, bond: 'H–Cl', label: 'Propagación (cadena)' },
  { id: 'hcl', r: ['H', 'Cl'], p: ['HCl'], Ea: 0, steric: 0.3, bond: 'H–Cl', label: 'Terminación' },
  { id: 'clcl', r: ['Cl', 'Cl'], p: ['Cl2'], Ea: 0, steric: 0.25, bond: 'Cl–Cl', label: 'Terminación' },
];
const pairKey = (a, b) => (a < b ? `${a}+${b}` : `${b}+${a}`);
const RX_BY_ID = {};
const RX_BY_PAIR = {};
for (const rx of REACTIONS) {
  rx.dH = rx.p.reduce((s, k) => s + SPECIES[k].dHf, 0) - rx.r.reduce((s, k) => s + SPECIES[k].dHf, 0);
  rx.eq = `${rx.r.map((k) => SPECIES[k].f).join(' + ')} → ${rx.p.map((k) => SPECIES[k].f).join(' + ')}`;
  RX_BY_ID[rx.id] = rx;
  (RX_BY_PAIR[pairKey(rx.r[0], rx.r[1])] ||= []).push(rx);
}

// Fotólisis: enlace (kJ/mol) y sección eficaz relativa.
const PHOTO = {
  O2: { bond: 498, sigma: 0.0015, into: ['O', 'O'], label: 'O=O' },
  H2: { bond: 436, sigma: 0.0006, into: ['H', 'H'], label: 'H–H' },
  Cl2: { bond: 243, sigma: 0.0008, into: ['Cl', 'Cl'], label: 'Cl–Cl' },
};
const photoDH = (sp) => PHOTO[sp].into.reduce((s, k) => s + SPECIES[k].dHf, 0) - SPECIES[sp].dHf;

const PRESETS = [
  {
    id: 'combustion', name: 'Combustión de Hidrógeno', eq: '2H₂ + O₂ → 2H₂O', over: 'ΔT', tag: 'Exotérmica',
    params: { T: 700, P: 1, V: 12, UV: 0, lambda: 254 }, load: { H2: 70, O2: 35 },
    steps: [['h2o2', 1], ['oh2', 1]],
    hint: 'Mezcla estable a 700 K: pulsa «Chispa de activación» para iniciar la ignición en cadena.',
  },
  {
    id: 'alkali', name: 'Reacción Álcali-Agua', eq: '2Na + 2H₂O → 2NaOH + H₂↑', over: '', tag: 'Violenta / exotérmica',
    params: { T: 760, P: 100, V: 10, UV: 0, lambda: 254 }, load: { Na: 30, H2O: 50 },
    steps: [['naw', 2], ['hh', 1]],
    hint: 'Sodio fundido bajo vapor de agua denso (100 atm, 760 K): cada H₂ formado libera calor y acelera la reacción (desbocamiento térmico).',
  },
  {
    id: 'uvwater', name: 'Síntesis de Agua (Presión + UV)', eq: '2H₂ + O₂ → 2H₂O', over: 'hν, 60 atm', tag: 'Fotoquímica',
    params: { T: 350, P: 60, V: 12, UV: 800, lambda: 185 }, load: { H2: 50, O2: 25 },
    steps: [['photo:O2', 1], ['oh2', 2]],
    hint: 'UV-C de 185 nm rompe O=O (498 kJ/mol); los radicales O· reaccionan con H₂ sin barrera térmica.',
  },
  {
    id: 'chlor', name: 'Cadena fotoquímica H₂ + Cl₂', eq: 'H₂ + Cl₂ → 2HCl', over: 'hν', tag: 'Reacción en cadena',
    params: { T: 320, P: 2, V: 12, UV: 700, lambda: 350 }, load: { H2: 60, Cl2: 60 },
    steps: [['photo:Cl2', 1], ['clh2', 1], ['hcl2', 1], ['clcl', 1]],
    hint: 'Luz UV-A (350 nm) basta para romper Cl–Cl; cada radical Cl· propaga una cadena.',
  },
];
const PRESET_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p]));

const DEFAULT_PARAMS = { T: 300, P: 1, V: 25, UV: 0, lambda: 254 };

/* ---------------------------- utilidades ------------------------------- */

const fmtSigned = (x, d = 1) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toFixed(d)}`;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function gauss() {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function boilAt(Tref, dH, P, Pref = 1) {
  const inv = 1 / Tref - (R_KJ * Math.log(P / Pref)) / dH;
  return inv <= 0 ? Infinity : 1 / inv;
}

function phaseOf(sp, T, P) {
  const s = SPECIES[sp];
  if (s.radical) return 'Gas';
  if (s.sublimes) {
    if (P < s.sublimes.P) return T < boilAt(s.bp, s.dHvap, P) ? 'Sólido' : 'Gas';
    if (T < s.sublimes.T) return 'Sólido';
    return T < boilAt(s.sublimes.T, s.sublimes.dHvap, P, s.sublimes.P) ? 'Líquido' : 'Gas';
  }
  if (T < s.mp) return 'Sólido';
  return T < boilAt(s.bp, s.dHvap, P) ? 'Líquido' : 'Gas';
}

const isPlasma = (T, prm) => T >= 2800 || (prm.UV >= 800 && prm.lambda <= 120);

const PHASE_STYLE = {
  Sólido: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
  Líquido: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
  Gas: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  Plasma: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10',
};
const TRANSITION = {
  'Gas>Líquido': 'condensación', 'Líquido>Gas': 'ebullición', 'Líquido>Sólido': 'solidificación',
  'Sólido>Líquido': 'fusión', 'Sólido>Gas': 'sublimación', 'Gas>Sólido': 'deposición',
};

// Color de la pared según temperatura (azul → cian → naranja → blanco).
const T_STOPS = [
  [0, [56, 189, 248]], [300, [34, 211, 238]], [900, [251, 146, 60]], [1800, [249, 115, 22]], [3000, [254, 240, 138]],
];
function tempColor(T, a = 1) {
  let i = 0;
  while (i < T_STOPS.length - 2 && T > T_STOPS[i + 1][0]) i++;
  const [t0, c0] = T_STOPS[i];
  const [t1, c1] = T_STOPS[i + 1];
  const k = clamp((T - t0) / (t1 - t0), 0, 1);
  const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/* ------------------------------ motor ---------------------------------- */

function createSim() {
  return {
    particles: [], effects: [], log: [], hist: [], pending: [],
    t: 0, Tch: DEFAULT_PARAMS.T, Tk: DEFAULT_PARAMS.T, nextId: 1, box: null,
    collCount: 0, rxCount: 0, rxById: {}, lastLog: {}, pendLog: {},
    lastPhase: {}, flags: { highP: false, plasma: false, tBand: 0 },
    rate: { t: 0, coll: 0, rx: 0, collRate: 0, rxRate: 0 },
  };
}

function pushLog(sim, type, text) {
  sim.log.unshift({ id: `${sim.t.toFixed(3)}-${Math.random()}`, t: sim.t, type, text });
  if (sim.log.length > 200) sim.log.length = 200;
}

function makeParticle(sim, sp, x, y, T) {
  const s = SPECIES[sp];
  const sig = SPEED_K * Math.sqrt(Math.max(T, 1) / s.mass);
  return {
    id: sim.nextId++, sp, x, y, vx: gauss() * sig, vy: gauss() * sig,
    a: Math.random() * Math.PI * 2, w: (Math.random() - 0.5) * 0.12,
    r: s.radius, m: s.mass, born: -10, dead: false,
  };
}

function inject(sim, sp, n, at) {
  const b = sim.box;
  if (!b) {
    sim.pending.push({ sp, n, at });
    return 0;
  }
  const s = SPECIES[sp];
  let added = 0;
  for (let k = 0; k < n && sim.particles.length < MAX_PARTICLES; k++) {
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 12; tries++) {
      if (at) {
        x = at.x + gauss() * 14;
        y = at.y + gauss() * 14;
      } else {
        x = b.x + s.radius + Math.random() * (b.w - 2 * s.radius);
        y = b.y + s.radius + Math.random() * (b.h - 2 * s.radius);
      }
      x = clamp(x, b.x + s.radius, b.x + b.w - s.radius);
      y = clamp(y, b.y + s.radius, b.y + b.h - s.radius);
      const free = sim.particles.every((q) => (q.x - x) ** 2 + (q.y - y) ** 2 > (q.r + s.radius) ** 2);
      if (free) break;
    }
    sim.particles.push(makeParticle(sim, sp, x, y, sim.Tch));
    added++;
  }
  return added;
}

function addEffect(sim, e) {
  sim.effects.push({ life: e.max, ...e });
  if (sim.effects.length > 160) sim.effects.shift();
}

function react(sim, p, q, rx, E) {
  p.dead = true;
  q.dead = true;
  const M = p.m + q.m;
  const Vx = (p.m * p.vx + q.m * q.vx) / M;
  const Vy = (p.m * p.vy + q.m * q.vy) / M;
  const cx = (p.m * p.x + q.m * q.x) / M;
  const cy = (p.m * p.y + q.m * q.y) / M;
  const born = [];
  if (rx.p.length === 1) {
    const np = makeParticle(sim, rx.p[0], cx, cy, 0);
    np.vx = Vx;
    np.vy = Vy;
    born.push(np);
  } else {
    const [s1, s2] = rx.p.map((k) => SPECIES[k]);
    const th = Math.random() * Math.PI * 2;
    const dx = Math.cos(th);
    const dy = Math.sin(th);
    const sep = s1.radius + s2.radius + 1;
    const a = makeParticle(sim, rx.p[0], cx - dx * sep * (s2.mass / M), cy - dy * sep * (s2.mass / M), 0);
    const b = makeParticle(sim, rx.p[1], cx + dx * sep * (s1.mass / M), cy + dy * sep * (s1.mass / M), 0);
    const Erel = rx.dH > 0 ? Math.max(0.15 * E, E - rx.dH) : E + -rx.dH * LOCAL_FRAC;
    const KE = (Erel / R_KJ) * SPEED_K * SPEED_K;
    const mu = (s1.mass * s2.mass) / (s1.mass + s2.mass);
    const prel = Math.sqrt(2 * KE * mu);
    a.vx = Vx - (prel / s1.mass) * dx;
    a.vy = Vy - (prel / s1.mass) * dy;
    b.vx = Vx + (prel / s2.mass) * dx;
    b.vy = Vy + (prel / s2.mass) * dy;
    born.push(a, b);
  }
  for (const np of born) np.born = sim.t;
  sim.spawn.push(...born);

  const N = Math.max(sim.particles.length, 30);
  sim.Tch = clamp(sim.Tch + (-rx.dH * HEAT_GAIN) / N, 0, 6000);
  sim.rxCount++;
  sim.rxById[rx.id] = (sim.rxById[rx.id] || 0) + 1;
  const exo = rx.dH < 0;
  addEffect(sim, {
    type: 'flash', x: cx, y: cy, max: 26,
    r: 10 + Math.min(40, Math.abs(rx.dH) / 12),
    color: exo ? '251,146,60' : '56,189,248',
  });

  sim.pendLog[rx.id] = (sim.pendLog[rx.id] || 0) + 1;
  if (sim.t - (sim.lastLog[rx.id] ?? -99) >= 2) {
    const k = sim.pendLog[rx.id];
    pushLog(sim, 'rx',
      `Colisión efectiva detectada a ${Math.round(sim.Tch)} K · ${rx.eq} (E = ${E.toFixed(1)} ≥ Eₐ ${rx.Ea} kJ/mol)${k > 1 ? ` ×${k}` : ''}`);
    pushLog(sim, exo ? 'bond' : 'endo',
      `Enlace ${rx.bond} formado · ΔH = ${fmtSigned(rx.dH)} kJ/mol (${exo ? 'liberación' : 'absorción'} de energía)`);
    sim.lastLog[rx.id] = sim.t;
    sim.pendLog[rx.id] = 0;
  }
}

function dissociate(sim, p, extraKJ, cause) {
  const ph = PHOTO[p.sp];
  p.dead = true;
  const [k1, k2] = ph.into;
  const th = Math.random() * Math.PI * 2;
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  const s = SPECIES[k1];
  const a = makeParticle(sim, k1, p.x - dx * s.radius, p.y - dy * s.radius, 0);
  const b = makeParticle(sim, k2, p.x + dx * s.radius, p.y + dy * s.radius, 0);
  const v = Math.sqrt((Math.max(0.5, extraKJ) / R_KJ) * SPEED_K * SPEED_K / s.mass);
  a.vx = p.vx - v * dx;
  a.vy = p.vy - v * dy;
  b.vx = p.vx + v * dx;
  b.vy = p.vy + v * dy;
  a.born = b.born = sim.t;
  sim.spawn.push(a, b);
  addEffect(sim, { type: 'photon', x: p.x, y: p.y, max: 22, r: 16, color: '192,132,252' });
  const key = `photo:${p.sp}:${cause}`;
  sim.pendLog[key] = (sim.pendLog[key] || 0) + 1;
  if (sim.t - (sim.lastLog[key] ?? -99) >= 2.5) {
    const n = sim.pendLog[key];
    pushLog(sim, 'photon', cause === 'uv'
      ? `Fotólisis: ${SPECIES[p.sp].f} + hν → 2 ${SPECIES[k1].f} (ruptura ${ph.label}, ${ph.bond} kJ/mol)${n > 1 ? ` ×${n}` : ''}`
      : `Disociación en plasma: ${SPECIES[p.sp].f} → 2 ${SPECIES[k1].f}${n > 1 ? ` ×${n}` : ''}`);
    sim.lastLog[key] = sim.t;
    sim.pendLog[key] = 0;
  }
}

function updateBox(sim, W, H, V, snap) {
  const s = 0.25 + 0.75 * Math.sqrt(V / 50);
  const tw = (W - 32) * s;
  const th = (H - 32) * s;
  const target = { x: (W - tw) / 2, y: (H - th) / 2, w: tw, h: th };
  if (!sim.box || snap) {
    sim.box = target;
    return;
  }
  for (const k of ['x', 'y', 'w', 'h']) sim.box[k] += (target[k] - sim.box[k]) * 0.18;
}

function phaseTable(sim, prm) {
  const plasma = isPlasma(sim.Tch, prm);
  const table = {};
  for (const sp of SPECIES_ORDER) table[sp] = plasma ? 'Plasma' : phaseOf(sp, sim.Tch, prm.P);
  return { table, plasma };
}

function stepSim(sim, prm, dtFrame) {
  const ps = sim.particles;
  const b = sim.box;
  sim.spawn = [];
  const { table: phase, plasma } = phaseTable(sim, prm);

  // Termostato de Berendsen (sobre partículas móviles).
  let ke = 0;
  let nm = 0;
  for (const p of ps) {
    if (phase[p.sp] === 'Sólido') continue;
    ke += p.m * (p.vx * p.vx + p.vy * p.vy);
    nm++;
  }
  sim.Tk = nm ? ke / (2 * SPEED_K * SPEED_K * nm) : 0;
  let lam = 1;
  if (sim.Tk > 0.5) lam = clamp(Math.sqrt(1 + 0.03 * dtFrame * (sim.Tch / sim.Tk - 1)), 0.9, 1.1);
  else if (sim.Tch > 1) {
    for (const p of ps) {
      const sig = SPEED_K * Math.sqrt(sim.Tch / p.m);
      p.vx += gauss() * sig * 0.3;
      p.vy += gauss() * sig * 0.3;
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
  const nSub = clamp(Math.ceil((vmax * dtFrame) / 3), 1, 12);
  const dt = dtFrame / nSub;
  const pm = 1 + 0.15 * Math.log10(prm.P); // sección eficaz efectiva
  const pf = Math.min(3, Math.sqrt(prm.P)); // factor de frecuencia de colisión

  for (let sub = 0; sub < nSub; sub++) {
    // Integración
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

    // Colisiones (rejilla espacial)
    const cell = 30;
    const cols = Math.ceil((b.x + b.w) / cell) + 2;
    const grid = new Map();
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
              sim.collCount++;
              const rules = RX_BY_PAIR[pairKey(p.sp, q.sp)];
              if (rules) {
                const mu = (p.m * q.m) / (p.m + q.m);
                const E = ((0.5 * mu * (rvx * rvx + rvy * rvy)) / (SPEED_K * SPEED_K)) * R_KJ;
                const boost = plasma ? 2 : 1;
                const rx = rules.find((r) => E >= r.Ea && Math.random() < r.steric * pf * boost);
                if (rx) {
                  react(sim, p, q, rx, E);
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
      const ph = PHOTO[p.sp];
      if (!ph) continue;
      if (prm.UV > 0 && Eph >= ph.bond && Math.random() < (prm.UV / 1000) * ph.sigma * dtFrame) {
        dissociate(sim, p, (Eph - ph.bond) * 0.05, 'uv');
      } else if (plasma && Math.random() < 0.003 * dtFrame) {
        dissociate(sim, p, 5, 'plasma');
      }
    }
  }

  if (sim.spawn.length || ps.some((p) => p.dead)) {
    sim.particles = ps.filter((p) => !p.dead).concat(sim.spawn).slice(0, MAX_PARTICLES);
  }

  // Relajación térmica de la cámara hacia la consigna (τ ≈ 6 s)
  sim.Tch += (prm.T - sim.Tch) * Math.min(1, dtFrame / 360);
  sim.t += dtFrame / 60;

  for (const e of sim.effects) e.life -= dtFrame;
  sim.effects = sim.effects.filter((e) => e.life > 0);

  watchThresholds(sim, prm, phase, plasma);
}

function watchThresholds(sim, prm, phase, plasma) {
  const f = sim.flags;
  if (prm.P > 50 && !f.highP) pushLog(sim, 'warn', `Umbral de presión superado: ${prm.P.toFixed(1)} atm > 50 atm (régimen de alta densidad)`);
  if (prm.P <= 50 && f.highP) pushLog(sim, 'info', `Presión normalizada: ${prm.P.toFixed(1)} atm`);
  f.highP = prm.P > 50;
  if (plasma !== f.plasma) {
    pushLog(sim, plasma ? 'warn' : 'info', plasma
      ? `Transición a PLASMA: ionización parcial a ${Math.round(sim.Tch)} K`
      : `Plasma extinguido (${Math.round(sim.Tch)} K)`);
    f.plasma = plasma;
  }
  const band = Math.floor(sim.Tch / 500);
  if (band > f.tBand && band > 0) pushLog(sim, 'heat', `T cámara supera ${band * 500} K (RT = ${(R_KJ * sim.Tch).toFixed(1)} kJ/mol)`);
  f.tBand = band;
  const present = new Set(sim.particles.map((p) => p.sp));
  for (const sp of present) {
    const now = phase[sp];
    const prev = sim.lastPhase[sp];
    if (prev && prev !== now && now !== 'Plasma' && prev !== 'Plasma' && !SPECIES[sp].radical) {
      pushLog(sim, 'phase', `${SPECIES[sp].f}: ${TRANSITION[`${prev}>${now}`] || 'cambio de fase'} → ${now} a ${Math.round(sim.Tch)} K`);
    }
    sim.lastPhase[sp] = now;
  }
}

function spark(sim) {
  const b = sim.box;
  if (!b) return;
  const x = b.x + b.w * (0.35 + Math.random() * 0.3);
  const y = b.y + b.h * (0.35 + Math.random() * 0.3);
  const R = Math.min(110, Math.max(60, b.w * 0.18));
  let n = 0;
  for (const p of sim.particles) {
    if ((p.x - x) ** 2 + (p.y - y) ** 2 > R * R) continue;
    const sig = SPEED_K * Math.sqrt(5000 / p.m);
    p.vx = gauss() * sig;
    p.vy = gauss() * sig;
    n++;
  }
  sim.Tch = Math.min(6000, sim.Tch + 300);
  addEffect(sim, { type: 'shock', x, y, max: 45, r: R, color: '253,224,71' });
  pushLog(sim, 'heat', `Pulso térmico / chispa: ${n} partículas a ≈5000 K (r = ${Math.round(R)} px)`);
}

function snapshot(sim, prm) {
  const counts = {};
  let atoms = 0;
  for (const p of sim.particles) {
    counts[p.sp] = (counts[p.sp] || 0) + 1;
    atoms += SPECIES[p.sp].atoms;
  }
  const { table, plasma } = phaseTable(sim, prm);
  const byPhase = {};
  for (const [sp, n] of Object.entries(counts)) byPhase[table[sp]] = (byPhase[table[sp]] || 0) + n;
  const phase = plasma ? 'Plasma' : Object.entries(byPhase).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const r = sim.rate;
  const dts = sim.t - r.t;
  if (dts >= 0.5) {
    r.collRate = (sim.collCount - r.coll) / dts;
    r.rxRate = (sim.rxCount - r.rx) / dts;
    r.t = sim.t;
    r.coll = sim.collCount;
    r.rx = sim.rxCount;
  }
  return {
    t: sim.t, Tch: sim.Tch, Tk: sim.Tk, N: sim.particles.length, atoms, counts, phases: table, phase, plasma,
    collRate: r.collRate, rxRate: r.rxRate, rxById: { ...sim.rxById }, log: sim.log.slice(0, 120),
    hist: sim.hist.slice(),
  };
}

/* ----------------------------- renderizado ----------------------------- */

function makeSprites(dpr) {
  const sprites = {};
  for (const [k, a] of Object.entries(ATOMS)) {
    const size = Math.ceil((a.r * 2 + 4) * dpr);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const R = a.r * dpr;
    const m = size / 2;
    const grad = g.createRadialGradient(m - R * 0.35, m - R * 0.35, R * 0.1, m, m, R);
    grad.addColorStop(0, a.glow);
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

function drawFrame(ctx, sim, prm, W, H, sprites, selected) {
  const b = sim.box;
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1224');
  bg.addColorStop(1, '#050a18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(148,163,184,0.07)';
  for (let x = 12; x < W; x += 24) for (let y = 12; y < H; y += 24) ctx.fillRect(x, y, 1, 1);
  if (!b) return;

  const T = sim.Tch;
  const plasma = isPlasma(T, prm);

  // Interior
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 10);
  const inner = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, 10, b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) * 0.7);
  inner.addColorStop(0, plasma ? 'rgba(217,70,239,0.16)' : tempColor(T, 0.07));
  inner.addColorStop(1, 'rgba(2,6,23,0.6)');
  ctx.fillStyle = inner;
  ctx.fill();
  ctx.clip();

  // Densidad por presión
  if (prm.P > 5) {
    ctx.fillStyle = `rgba(56,189,248,${Math.min(0.08, Math.log10(prm.P) * 0.04)})`;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  // Radiación UV
  if (prm.UV > 0) {
    const a = (prm.UV / 1000) * 0.22;
    const hue = prm.lambda < 200 ? '168,85,247' : prm.lambda < 300 ? '192,132,252' : '129,140,248';
    ctx.strokeStyle = `rgba(${hue},${a})`;
    ctx.lineWidth = 2;
    const off = (sim.t * 120) % 40;
    for (let x = b.x - b.h; x < b.x + b.w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + off, b.y);
      ctx.lineTo(x + off + b.h * 0.5, b.y + b.h);
      ctx.stroke();
    }
  }

  // Partículas
  const sel = selected?.kind === 'species' ? selected.key : null;
  for (const p of sim.particles) {
    const s = SPECIES[p.sp];
    const age = sim.t - p.born;
    if (age < 0.6) {
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
      ctx.strokeStyle = 'rgba(250,204,21,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (sel === p.sp) {
      ctx.strokeStyle = 'rgba(34,211,238,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    const ca = Math.cos(p.a);
    const sa = Math.sin(p.a);
    for (const [atom, dx, dy] of s.layout) {
      const sp = sprites[atom];
      const x = p.x + dx * ca - dy * sa;
      const y = p.y + dx * sa + dy * ca;
      ctx.drawImage(sp.c, x - sp.half, y - sp.half, sp.size, sp.size);
    }
  }

  // Efectos
  for (const e of sim.effects) {
    const k = e.life / e.max;
    if (e.type === 'flash') {
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * (1.6 - k * 0.6));
      g.addColorStop(0, `rgba(${e.color},${0.75 * k})`);
      g.addColorStop(1, `rgba(${e.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (1.6 - k * 0.6), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${e.color},${0.6 * k})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (2.2 - k * 1.4), 0, Math.PI * 2);
      ctx.stroke();
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
    } else if (e.type === 'shock') {
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

  // Paredes
  ctx.save();
  ctx.shadowColor = plasma ? 'rgba(232,121,249,0.8)' : tempColor(T, 0.7);
  ctx.shadowBlur = 16;
  ctx.strokeStyle = plasma ? 'rgba(232,121,249,0.9)' : tempColor(T, 0.85);
  ctx.lineWidth = 1.5 + Math.min(3, Math.log10(Math.max(1, prm.P)) * 1.4);
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 10);
  ctx.stroke();
  ctx.restore();

  // Marcas de presión
  if (prm.P > 10) {
    ctx.fillStyle = 'rgba(56,189,248,0.5)';
    const n = 5;
    for (let i = 1; i <= n; i++) {
      const x = b.x + (b.w * i) / (n + 1);
      const y = b.y + (b.h * i) / (n + 1);
      tri(ctx, x, b.y - 6, 0, 1);
      tri(ctx, x, b.y + b.h + 6, 0, -1);
      tri(ctx, b.x - 6, y, 1, 0);
      tri(ctx, b.x + b.w + 6, y, -1, 0);
    }
  }
}

function tri(ctx, x, y, dx, dy) {
  ctx.beginPath();
  ctx.moveTo(x + dx * 4, y + dy * 4);
  ctx.lineTo(x - dy * 4 - dx * 2, y - dx * 4 - dy * 2);
  ctx.lineTo(x + dy * 4 - dx * 2, y + dx * 4 - dy * 2);
  ctx.fill();
}

/* --------------------------- perfil energético -------------------------- */

function profileFor(selection) {
  let steps = [];
  if (selection.kind === 'preset') steps = PRESET_BY_ID[selection.id].steps;
  else if (selection.kind === 'reaction') steps = [[selection.id, 1]];
  else {
    const rx = REACTIONS.find((r) => r.r.includes(selection.key) || r.p.includes(selection.key));
    if (rx) steps = [[rx.id, 1]];
  }
  const pts = [{ E: 0, kind: 'R', label: 'Reactivos' }];
  const seg = [];
  let lvl = 0;
  const flat = steps.flatMap(([id, n]) => Array(n).fill(id));
  flat.forEach((id, i) => {
    const last = i === flat.length - 1;
    if (id.startsWith('photo:')) {
      const sp = id.slice(6);
      lvl += photoDH(sp);
      pts.push({ E: lvl, kind: last ? 'P' : 'I', label: `${SPECIES[sp].f} + hν → 2${SPECIES[PHOTO[sp].into[0]].f}` });
      seg.push('photon');
    } else {
      const rx = RX_BY_ID[id];
      pts.push({ E: lvl + Math.max(rx.Ea, rx.dH, 0), kind: 'TS', label: `ET‡ ${rx.eq}` });
      lvl += rx.dH;
      pts.push({ E: lvl, kind: last ? 'P' : 'I', label: last ? 'Productos' : 'Intermedio' });
      seg.push('thermal', 'thermal');
    }
  });
  const ts = pts.filter((p) => p.kind === 'TS');
  const EaApp = ts.length ? Math.max(...ts.map((p) => p.E)) : null;
  return { pts, seg, dH: lvl, EaApp, photo: flat.some((id) => id.startsWith('photo:')) };
}

function EnergyProfile({ selection }) {
  const prof = useMemo(() => profileFor(selection), [selection]);
  const [hover, setHover] = useState(null);
  const { pts, seg } = prof;
  if (pts.length < 2) {
    return <div className="text-xs text-slate-500 py-6 text-center">Sin reacciones asociadas.</div>;
  }
  const W = 340;
  const H = 170;
  const pad = { l: 40, r: 44, t: 16, b: 22 };
  const Es = pts.map((p) => p.E);
  const lo = Math.min(0, ...Es);
  const hi = Math.max(0, ...Es);
  const span = hi - lo || 1;
  const X = (i) => pad.l + (i * (W - pad.l - pad.r)) / (pts.length - 1);
  const Y = (E) => pad.t + ((hi - E) * (H - pad.t - pad.b)) / span;
  const dx = (W - pad.l - pad.r) / (pts.length - 1);
  const tsMax = pts.reduce((m, p, i) => (p.kind === 'TS' && (m < 0 || p.E > pts[m].E) ? i : m), -1);
  const last = pts.length - 1;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label={`Perfil energético: ΔH ${fmtSigned(prof.dH)} kJ/mol`}>
        <line x1={pad.l} x2={W - pad.r} y1={Y(0)} y2={Y(0)} stroke="#334155" strokeDasharray="3 3" />
        <line x1={pad.l} x2={W - pad.r} y1={Y(prof.dH)} y2={Y(prof.dH)} stroke="#334155" strokeDasharray="3 3" />
        <text x={pad.l - 6} y={Y(0) + 3} textAnchor="end" className="fill-slate-400" fontSize="9">0</text>
        <text x={pad.l - 6} y={Y(hi) + 3} textAnchor="end" className="fill-slate-500" fontSize="9">{hi.toFixed(0)}</text>
        {lo < 0 && <text x={pad.l - 6} y={Y(lo) + 3} textAnchor="end" className="fill-slate-500" fontSize="9">{lo.toFixed(0)}</text>}
        <text x={8} y={H / 2} transform={`rotate(-90 8 ${H / 2})`} textAnchor="middle" className="fill-slate-500" fontSize="9">kJ/mol</text>
        {pts.slice(1).map((p, k) => {
          const a = pts[k];
          const x0 = X(k);
          const x1 = X(k + 1);
          const photon = seg[k] === 'photon';
          const d = photon
            ? `M${x0},${Y(a.E)} L${x1},${Y(p.E)}`
            : `M${x0},${Y(a.E)} C${x0 + dx / 2},${Y(a.E)} ${x1 - dx / 2},${Y(p.E)} ${x1},${Y(p.E)}`;
          return (
            <path key={k} d={d} fill="none" stroke={photon ? '#c084fc' : '#22d3ee'} strokeWidth="2"
              strokeDasharray={photon ? '4 3' : undefined} strokeLinecap="round" />
          );
        })}
        {tsMax >= 0 && Y(0) - Y(pts[tsMax].E) >= 14 && (
          <g>
            <line x1={X(tsMax) - 10} x2={X(tsMax) - 10} y1={Y(0)} y2={Y(pts[tsMax].E) + 2} stroke="#fb923c" strokeWidth="1.2"
              markerEnd="url(#arr-o)" />
            <text x={X(tsMax) - 14} y={(Y(0) + Y(pts[tsMax].E)) / 2 + 3} textAnchor="end" className="fill-slate-300" fontSize="9">Eₐ</text>
          </g>
        )}
        <line x1={W - pad.r + 14} x2={W - pad.r + 14} y1={Y(0)} y2={Y(prof.dH) + (prof.dH < 0 ? -2 : 2)} stroke="#34d399"
          strokeWidth="1.2" markerEnd="url(#arr-g)" />
        <text x={W - pad.r + 18} y={(Y(0) + Y(prof.dH)) / 2 + 3} className="fill-slate-300" fontSize="9">ΔH</text>
        <defs>
          <marker id="arr-o" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 z" fill="#fb923c" />
          </marker>
          <marker id="arr-g" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 z" fill="#34d399" />
          </marker>
        </defs>
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={X(i)} cy={Y(p.E)} r="12" fill="transparent" />
            <circle cx={X(i)} cy={Y(p.E)} r={hover === i ? 4.5 : 3} fill="#0f172a"
              stroke={p.kind === 'TS' ? '#fb923c' : seg[i - 1] === 'photon' ? '#c084fc' : '#22d3ee'} strokeWidth="2" />
            {(i === 0 || i === last || p.kind === 'TS') && (
              <text x={X(i)} y={p.kind === 'TS' ? Y(p.E) - 7 : Y(p.E) + 14} textAnchor="middle" className="fill-slate-400" fontSize="9">
                {p.kind === 'TS' ? '‡' : i === 0 ? 'R' : 'P'}
              </text>
            )}
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute left-2 top-1 rounded border border-slate-700 bg-slate-900/95 px-2 py-1 text-[11px] text-slate-200 shadow-lg">
          <div className="text-slate-400">{pts[hover].label}</div>
          <div className="font-mono tabular-nums">{fmtSigned(pts[hover].E)} kJ/mol</div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- UI bits -------------------------------- */

function Sparkline({ values }) {
  const [hi, setHi] = useState(null);
  const W = 90;
  const H = 22;
  if (values.length < 2) return <svg width={W} height={H} />;
  const max = Math.max(1, ...values);
  const X = (i) => (i * W) / (values.length - 1);
  const Y = (v) => H - 2 - (v / max) * (H - 4);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return (
    <div className="relative">
      <svg width={W} height={H} className="overflow-visible"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHi(clamp(Math.round(((e.clientX - r.left) / r.width) * (values.length - 1)), 0, values.length - 1));
        }}
        onMouseLeave={() => setHi(null)}>
        <path d={d} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
        {hi !== null && (
          <>
            <line x1={X(hi)} x2={X(hi)} y1={0} y2={H} stroke="#475569" />
            <circle cx={X(hi)} cy={Y(values[hi])} r="2.5" fill="#e2e8f0" />
          </>
        )}
      </svg>
      {hi !== null && (
        <div className="pointer-events-none absolute -top-6 right-0 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-100">
          {values[hi]} · −{((values.length - 1 - hi) / 4).toFixed(1)} s
        </div>
      )}
    </div>
  );
}

function Slider({ icon: Icon, label, value, min, max, step, onChange, display, sub, accent = 'accent-cyan-400' }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Icon className="h-3.5 w-3.5 text-slate-400" />
          {label}
        </span>
        <span className="font-mono tabular-nums text-slate-100">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className={`w-full ${accent}`} aria-label={label} />
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}

function Panel({ title, icon: Icon, children, className = '', right }) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-slate-900/60 ${className}`}>
      <header className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {Icon && <Icon className="h-3.5 w-3.5 text-cyan-400" />}
          {title}
        </h2>
        {right}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function AtomDot({ sp, size = 10 }) {
  const atoms = SPECIES[sp].layout;
  return (
    <span className="inline-flex -space-x-1">
      {atoms.slice(0, 3).map(([a], i) => (
        <span key={i} className="rounded-full ring-1 ring-slate-950"
          style={{ width: size, height: size, background: ATOMS[a].color }} />
      ))}
    </span>
  );
}

const LOG_STYLE = {
  rx: 'text-emerald-300', bond: 'text-orange-300', endo: 'text-sky-300', photon: 'text-violet-300',
  warn: 'text-amber-300', heat: 'text-orange-400', phase: 'text-cyan-300', info: 'text-slate-400',
};

/* ------------------------------ componente ------------------------------ */

export default function AtomReactChamber() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const simRef = useRef(null);
  if (!simRef.current) simRef.current = createSim();
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const [running, setRunning] = useState(true);
  const runningRef = useRef(running);
  runningRef.current = running;
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const stepReq = useRef(0);
  const [stats, setStats] = useState(() => snapshot(simRef.current, DEFAULT_PARAMS));
  const [selection, setSelection] = useState({ kind: 'preset', id: 'combustion' });
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const [injectSp, setInjectSp] = useState('H2');
  const [qty, setQty] = useState(20);
  const [activePreset, setActivePreset] = useState('combustion');
  const sizeRef = useRef({ W: 0, H: 0, dpr: 1 });

  const setParam = (k) => (v) => setParams((p) => ({ ...p, [k]: v }));

  const loadPreset = useCallback((id) => {
    const pr = PRESET_BY_ID[id];
    const sim = simRef.current;
    const keepBox = sim.box;
    Object.assign(sim, createSim());
    sim.box = keepBox;
    sim.Tch = pr.params.T;
    sim.flags.tBand = Math.floor(pr.params.T / 500);
    setParams({ ...pr.params });
    paramsRef.current = { ...pr.params };
    const { W, H } = sizeRef.current;
    if (W) updateBox(sim, W, H, pr.params.V, true);
    for (const [sp, n] of Object.entries(pr.load)) inject(sim, sp, n);
    pushLog(sim, 'info', `Preset cargado: ${pr.name} — ${pr.eq}`);
    pushLog(sim, 'info', pr.hint);
    setActivePreset(id);
    setSelection({ kind: 'preset', id });
    setStats(snapshot(sim, pr.params));
  }, []);

  const reset = useCallback(() => {
    if (activePreset) {
      loadPreset(activePreset);
      return;
    }
    const sim = simRef.current;
    const keepBox = sim.box;
    Object.assign(sim, createSim());
    sim.box = keepBox;
    setParams(DEFAULT_PARAMS);
    pushLog(sim, 'info', 'Cámara reiniciada.');
    setStats(snapshot(sim, DEFAULT_PARAMS));
  }, [activePreset, loadPreset]);

  const doInject = (sp, n, at) => {
    const sim = simRef.current;
    const added = inject(sim, sp, n, at);
    if (added || !sim.box) pushLog(sim, 'info', `Inyección: ${added || n} × ${SPECIES[sp].f} (${SPECIES[sp].name})`);
    if (sim.box && added < n) pushLog(sim, 'warn', `Capacidad máxima de la cámara (${MAX_PARTICLES} partículas)`);
    setStats(snapshot(sim, paramsRef.current));
  };

  const clearChamber = () => {
    const sim = simRef.current;
    sim.particles = [];
    sim.effects = [];
    sim.lastPhase = {};
    pushLog(sim, 'info', 'Cámara purgada: 0 partículas.');
    setActivePreset(null);
    setStats(snapshot(sim, paramsRef.current));
  };

  const doSpark = () => {
    spark(simRef.current);
    setStats(snapshot(simRef.current, paramsRef.current));
  };

  // Carga inicial
  useEffect(() => {
    loadPreset('combustion');
  }, [loadPreset]);

  // Bucle de render/simulación
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let sprites = makeSprites(window.devicePixelRatio || 1);
    let raf = 0;
    let lastStats = 0;
    let lastHist = 0;

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { W: r.width, H: r.height, dpr };
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sprites = makeSprites(dpr);
      const sim = simRef.current;
      updateBox(sim, r.width, r.height, paramsRef.current.V, !sim.box);
      if (sim.pending.length) {
        const pend = sim.pending;
        sim.pending = [];
        for (const { sp, n, at } of pend) inject(sim, sp, n, at);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapRef.current);
    resize();

    const frame = (now) => {
      const sim = simRef.current;
      const prm = paramsRef.current;
      const { W, H } = sizeRef.current;
      if (W > 0) {
        updateBox(sim, W, H, prm.V, false);
        const doStep = runningRef.current || stepReq.current > 0;
        if (doStep) {
          const dt = runningRef.current ? speedRef.current : 1;
          if (dt <= 1) stepSim(sim, prm, dt);
          else for (let i = 0; i < dt; i++) stepSim(sim, prm, 1);
          if (stepReq.current > 0) stepReq.current--;
          if (now - lastHist > 250) {
            const counts = {};
            for (const p of sim.particles) counts[p.sp] = (counts[p.sp] || 0) + 1;
            sim.hist.push(counts);
            if (sim.hist.length > 120) sim.hist.shift();
            lastHist = now;
          }
        } else {
          // Mantener las paredes dentro del contenedor aunque esté en pausa
          for (const p of sim.particles) {
            p.x = clamp(p.x, sim.box.x + p.r, sim.box.x + sim.box.w - p.r);
            p.y = clamp(p.y, sim.box.y + p.r, sim.box.y + sim.box.h - p.r);
          }
        }
        drawFrame(ctx, sim, prm, W, H, sprites, selectionRef.current);
      }
      if (now - lastStats > 200) {
        setStats(snapshot(sim, prm));
        lastStats = now;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    if (typeof window !== 'undefined') window.__ARC = { simRef, paramsRef };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const onCanvasClick = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const sim = simRef.current;
    const hit = sim.particles.find((p) => (p.x - x) ** 2 + (p.y - y) ** 2 <= (p.r + 3) ** 2);
    if (hit) {
      setSelection({ kind: 'species', key: hit.sp });
      return;
    }
    const b = sim.box;
    if (b && x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) doInject(injectSp, 5, { x, y });
  };

  const T = params.T;
  const status = !running ? 'Pausado' : stats.rxRate > 0.3 ? 'Reacción en curso' : 'En ejecución';
  const statusStyle = !running
    ? 'border-slate-600 bg-slate-800 text-slate-300'
    : status === 'Reacción en curso'
      ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
      : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
  const Eph = PHOTON_KJ_NM / params.lambda;
  const band = params.lambda < 200 ? 'UV-C (vacío)' : params.lambda < 280 ? 'UV-C' : params.lambda < 315 ? 'UV-B' : 'UV-A';
  const histFor = (sp) => stats.hist.map((h) => h[sp] || 0);
  const present = SPECIES_ORDER.filter((sp) => stats.counts[sp] || stats.hist.some((h) => h[sp]));

  return (
    <div className="flex min-h-full flex-col bg-slate-950 text-slate-200 lg:h-screen">
      {/* Barra superior */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-400/40">
            <Atom className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-50">
              AtomReactChamber <span className="text-cyan-400">v0.1</span>
            </h1>
            <p className="text-xs text-slate-400">Cámara de Simulación Termodinámica y Molecular</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyle}`}>
          <span className={`h-2 w-2 rounded-full ${!running ? 'bg-slate-400' : status === 'Reacción en curso' ? 'animate-pulse bg-orange-400' : 'bg-emerald-400'}`} />
          {status}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-700">
            <button onClick={() => setRunning(true)} disabled={running} title="Play"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-slate-800 disabled:text-emerald-300 disabled:bg-emerald-500/10">
              <Play className="h-4 w-4" /> Play
            </button>
            <button onClick={() => setRunning(false)} disabled={!running} title="Pausa"
              className="flex items-center gap-1.5 border-l border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800 disabled:text-amber-300 disabled:bg-amber-500/10">
              <Pause className="h-4 w-4" /> Pausa
            </button>
            <button onClick={() => { setRunning(false); stepReq.current += 1; }} title="Paso a paso (1 fotograma)"
              className="flex items-center gap-1.5 border-l border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800">
              <StepForward className="h-4 w-4" /> Paso
            </button>
            <button onClick={reset} title="Reiniciar"
              className="flex items-center gap-1.5 border-l border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-slate-700" role="group" aria-label="Velocidad de simulación">
            {[0.5, 1, 2, 5].map((s) => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`px-2.5 py-1.5 font-mono text-xs ${speed === s ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-slate-800'} ${s !== 0.5 ? 'border-l border-slate-700' : ''}`}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Inyector */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900/40 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <FlaskConical className="h-3.5 w-3.5 text-cyan-400" /> Inyector
        </span>
        <div className="flex flex-wrap gap-1.5">
          {INJECTABLE.map((sp) => (
            <button key={sp} onClick={() => { setInjectSp(sp); setSelection({ kind: 'species', key: sp }); }}
              title={SPECIES[sp].name}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs transition ${injectSp === sp ? 'border-cyan-400/70 bg-cyan-500/10 text-cyan-100' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
              <AtomDot sp={sp} />
              <span className="font-semibold">{SPECIES[sp].f}</span>
              <span className="hidden text-slate-500 xl:inline">{SPECIES[sp].name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <input type="number" min={1} max={200} value={qty} aria-label="Cantidad de partículas"
            onChange={(e) => setQty(clamp(Number(e.target.value) || 1, 1, 200))}
            className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-slate-100" />
          <button onClick={() => doInject(injectSp, qty)}
            className="flex items-center gap-1 rounded-lg bg-cyan-500/90 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400">
            <Plus className="h-3.5 w-3.5" /> Inyectar
          </button>
          <button onClick={clearChamber}
            className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-rose-500/60 hover:text-rose-300">
            <Trash2 className="h-3.5 w-3.5" /> Limpiar
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
          <span className="text-[11px] text-slate-500">Presets:</span>
          {PRESETS.map((pr, i) => (
            <button key={pr.id} onClick={() => loadPreset(pr.id)} title={pr.hint}
              className={`rounded-lg border px-2.5 py-1 text-left text-xs ${activePreset === pr.id ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
              <span className="text-slate-500">{i + 1}.</span> {pr.name}
            </button>
          ))}
        </div>
      </div>

      {/* Cuerpo */}
      <main className="grid flex-1 grid-cols-1 gap-3 p-3 lg:min-h-0 lg:grid-cols-[270px_minmax(0,1fr)_350px]">
        {/* Panel izquierdo */}
        <div className="space-y-3 lg:overflow-y-auto">
          <Panel title="Parámetros ambientales" icon={Gauge}>
            <div className="space-y-4">
              <Slider icon={Thermometer} label="Temperatura" value={T} min={0} max={3000} step={5} onChange={setParam('T')}
                display={`${T} K`} accent="accent-orange-400"
                sub={`${(T - 273.15).toFixed(0)} °C · RT = ${(R_KJ * T).toFixed(2)} kJ/mol`} />
              <Slider icon={Gauge} label="Presión" value={Math.log10(params.P)} min={-1} max={2} step={0.01}
                onChange={(v) => setParam('P')(Number((10 ** v).toPrecision(3)))}
                display={`${params.P < 10 ? params.P.toFixed(2) : params.P.toFixed(1)} atm`}
                sub={`Factor de colisión ×${Math.min(3, Math.sqrt(params.P)).toFixed(2)} · escala log`} />
              <Slider icon={Box} label="Volumen del contenedor" value={params.V} min={1} max={50} step={1} onChange={setParam('V')}
                display={`${params.V} L`} sub={`Densidad: ${(stats.N / params.V).toFixed(1)} partículas/L`} />
              <Slider icon={Sun} label="Radiación UV" value={params.UV} min={0} max={1000} step={10} onChange={setParam('UV')}
                display={`${params.UV} W/m²`} accent="accent-violet-400" />
              <Slider icon={Activity} label="Longitud de onda" value={params.lambda} min={100} max={400} step={1}
                onChange={setParam('lambda')} display={`${params.lambda} nm`} accent="accent-violet-400"
                sub={`${band} · E fotón = ${Eph.toFixed(0)} kJ/mol`} />
              <div className="flex flex-wrap gap-1">
                {Object.entries(PHOTO).map(([sp, ph]) => {
                  const ok = Eph >= ph.bond && params.UV > 0;
                  return (
                    <span key={sp} className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${ok ? 'border-violet-400/60 bg-violet-500/15 text-violet-200' : 'border-slate-700 text-slate-500'}`}>
                      {ph.label} {ph.bond}
                    </span>
                  );
                })}
              </div>
              <button onClick={doSpark}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(251,146,60,0.35)] hover:brightness-110">
                <Zap className="h-4 w-4" /> Pulso Térmico / Chispa de Activación
              </button>
            </div>
          </Panel>
          <Panel title="Estado termodinámico" icon={Thermometer}>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <dt className="text-slate-500">T consigna</dt><dd className="text-right font-mono tabular-nums">{T} K</dd>
              <dt className="text-slate-500">T cámara</dt><dd className="text-right font-mono tabular-nums text-orange-300">{stats.Tch.toFixed(0)} K</dd>
              <dt className="text-slate-500">T cinética</dt><dd className="text-right font-mono tabular-nums">{stats.Tk.toFixed(0)} K</dd>
              <dt className="text-slate-500">Colisiones/s</dt><dd className="text-right font-mono tabular-nums">{stats.collRate.toFixed(0)}</dd>
              <dt className="text-slate-500">Reacciones/s</dt><dd className="text-right font-mono tabular-nums text-emerald-300">{stats.rxRate.toFixed(1)}</dd>
              <dt className="text-slate-500">Tiempo sim.</dt><dd className="text-right font-mono tabular-nums">{stats.t.toFixed(1)} s</dd>
            </dl>
          </Panel>
        </div>

        {/* Viewport central */}
        <div className="relative order-first min-h-[420px] overflow-hidden lg:order-none rounded-xl border border-slate-800 bg-slate-950 lg:min-h-0" ref={wrapRef}>
          <canvas ref={canvasRef} onClick={onCanvasClick} className="absolute inset-0 cursor-crosshair" />
          <div className="pointer-events-none absolute left-3 top-3 space-y-1 rounded-lg border border-slate-800 bg-slate-950/75 px-3 py-2 backdrop-blur">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Temperatura</div>
            <div className="font-mono text-xl tabular-nums" style={{ color: tempColor(stats.Tch) }}>
              {stats.Tch.toFixed(0)} <span className="text-sm text-slate-400">K</span>
            </div>
            <div className="text-[10px] text-slate-500">{(stats.Tch - 273.15).toFixed(0)} °C · consigna {T} K</div>
          </div>
          <div className="pointer-events-none absolute right-3 top-3 space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/75 px-3 py-2 text-right backdrop-blur">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Moléculas / átomos</div>
            <div className="font-mono text-xl tabular-nums text-slate-100">
              {stats.N} <span className="text-sm text-slate-500">/ {stats.atoms}</span>
            </div>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${PHASE_STYLE[stats.phase] || 'border-slate-700 text-slate-400'}`}>
              {stats.phase}
            </span>
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 font-mono text-[11px] text-slate-400">
            <span className="rounded bg-slate-950/75 px-2 py-1">P {params.P < 10 ? params.P.toFixed(2) : params.P.toFixed(1)} atm</span>
            <span className="rounded bg-slate-950/75 px-2 py-1">V {params.V} L</span>
            {params.UV > 0 && <span className="rounded bg-violet-950/70 px-2 py-1 text-violet-300">UV {params.UV} W/m² · {params.lambda} nm</span>}
            {speed !== 1 && <span className="rounded bg-slate-950/75 px-2 py-1 text-cyan-300">{speed}x</span>}
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 hidden rounded bg-slate-950/75 px-2 py-1 text-[11px] text-slate-500 sm:block">
            Clic en vacío: inyectar 5 {SPECIES[injectSp].f} · clic en partícula: inspeccionar
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-3 lg:overflow-y-auto">
          <Panel title="Telemetría · PubChem (simulado)" icon={Activity}>
            <SelectionCard selection={selection} stats={stats} params={params} onSelect={setSelection} />
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                <span>Perfil energético</span>
                <span className="normal-case tracking-normal">R → ET‡ → P</span>
              </div>
              <EnergyProfile selection={selection} />
            </div>
          </Panel>

          <Panel title="Composición de la cámara" icon={Atom} right={<span className="text-[10px] text-slate-500">últimos 30 s</span>}>
            {present.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-500">Cámara vacía. Inyecta especies o carga un preset.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="pb-1 text-left font-medium">Especie</th>
                    <th className="pb-1 text-left font-medium">Fase</th>
                    <th className="pb-1 text-right font-medium">n</th>
                    <th className="pb-1 text-right font-medium">Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {present.map((sp) => (
                    <tr key={sp} className="cursor-pointer border-t border-slate-800/70 hover:bg-slate-800/40"
                      onClick={() => setSelection({ kind: 'species', key: sp })}>
                      <td className="py-1"><span className="flex items-center gap-2"><AtomDot sp={sp} size={8} />{SPECIES[sp].f}</span></td>
                      <td className="py-1 text-slate-400">{SPECIES[sp].radical ? 'Radical' : stats.phases[sp]}</td>
                      <td className="py-1 text-right font-mono tabular-nums">{stats.counts[sp] || 0}</td>
                      <td className="py-1"><div className="flex justify-end"><Sparkline values={histFor(sp)} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Consola de eventos" icon={Terminal}
            right={<button onClick={() => { simRef.current.log = []; }} className="text-[10px] text-slate-500 hover:text-slate-300">limpiar</button>}>
            <div className="h-56 overflow-y-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] leading-relaxed">
              {stats.log.length === 0 && <div className="text-slate-600">Esperando eventos…</div>}
              {stats.log.map((l) => (
                <div key={l.id} className="flex gap-2">
                  <span className="shrink-0 text-slate-600">[{l.t.toFixed(1).padStart(6, ' ')}s]</span>
                  <span className={LOG_STYLE[l.type]}>{l.text}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-mono text-sm tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function SelectionCard({ selection, stats, params, onSelect }) {
  if (selection.kind === 'species') {
    const sp = selection.key;
    const s = SPECIES[sp];
    const rxs = REACTIONS.filter((r) => r.r.includes(sp) || r.p.includes(sp));
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-2xl font-semibold text-slate-50">{s.f}</div>
            <div className="text-xs text-slate-400">{s.name}</div>
          </div>
          <AtomDot sp={sp} size={14} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Masa molar" value={`${s.mass.toFixed(3)} g/mol`} />
          <Stat label="ΔHf°" value={`${fmtSigned(s.dHf)} kJ/mol`} />
          {s.radical ? (
            <Stat label="Tipo" value="Radical libre" tone="text-amber-300" />
          ) : (
            <Stat label={s.sublimes ? 'Sublimación' : 'Fusión / ebull.'}
              value={s.sublimes ? `${s.bp} K` : `${s.mp} / ${s.bp} K`} />
          )}
          <Stat label={`Fase @ ${params.P.toPrecision(3)} atm`} value={s.radical ? 'Gas' : stats.phases[sp]} tone="text-cyan-300" />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>En cámara: <span className="font-mono text-slate-200">{stats.counts[sp] || 0}</span></span>
          {s.cid ? (
            <a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${s.cid}`} target="_blank" rel="noreferrer"
              className="text-cyan-400 hover:underline">PubChem CID {s.cid}</a>
          ) : <span>Especie transitoria</span>}
        </div>
        {rxs.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Reacciones asociadas</div>
            <div className="flex flex-wrap gap-1">
              {rxs.map((r) => (
                <button key={r.id} onClick={() => onSelect({ kind: 'reaction', id: r.id })}
                  className="rounded border border-slate-700 px-1.5 py-0.5 text-[11px] text-slate-300 hover:border-cyan-500/60">{r.eq}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (selection.kind === 'reaction') {
    const rx = RX_BY_ID[selection.id];
    const M = rx.r.reduce((a, k) => a + SPECIES[k].mass, 0);
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Paso elemental · {rx.label}</div>
          <div className="mt-1 text-lg font-semibold text-slate-50">{rx.eq}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="ΔH reacción" value={`${fmtSigned(rx.dH)} kJ/mol`} tone={rx.dH < 0 ? 'text-orange-300' : 'text-sky-300'} />
          <Stat label="Eₐ (modelo)" value={`${rx.Ea} kJ/mol`} tone="text-amber-300" />
          <Stat label="Masa reactivos" value={`${M.toFixed(2)} g/mol`} />
          <Stat label="Eventos" value={stats.rxById[rx.id] || 0} tone="text-emerald-300" />
        </div>
        <div className="text-[11px] text-slate-500">
          Enlace formado: <span className="text-slate-300">{rx.bond}</span> · factor estérico {rx.steric} ·
          fracción con E ≥ Eₐ a {stats.Tch.toFixed(0)} K ≈ <span className="font-mono text-slate-300">
            {(Math.exp(-rx.Ea / (R_KJ * Math.max(stats.Tch, 1))) * 100).toPrecision(2)}%</span>
        </div>
      </div>
    );
  }

  const pr = PRESET_BY_ID[selection.id];
  const prof = profileFor(selection);
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">{pr.name} · {pr.tag}</div>
        <div className="mt-1 text-lg font-semibold text-slate-50">
          {pr.eq.replace('→', pr.over ? `→[${pr.over}]` : '→')}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="ΔH global" value={`${fmtSigned(prof.dH)} kJ/mol`} tone={prof.dH < 0 ? 'text-orange-300' : 'text-sky-300'} />
        <Stat label={prof.photo ? 'Iniciación' : 'Eₐ aparente'} value={prof.photo ? 'Fotoquímica (hν)' : `${prof.EaApp?.toFixed(0)} kJ/mol`}
          tone={prof.photo ? 'text-violet-300' : 'text-amber-300'} />
      </div>
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Mecanismo</div>
        <ol className="space-y-1 text-[11px]">
          {pr.steps.map(([id, n]) => {
            const photo = id.startsWith('photo:');
            const sp = photo && id.slice(6);
            return (
              <li key={id}>
                <button disabled={photo} onClick={() => onSelect({ kind: 'reaction', id })}
                  className="flex w-full items-center justify-between rounded border border-slate-800 px-2 py-1 text-left text-slate-300 enabled:hover:border-cyan-500/60">
                  <span>
                    {n > 1 && <span className="text-slate-500">{n}× </span>}
                    {photo ? `${SPECIES[sp].f} + hν → 2${SPECIES[PHOTO[sp].into[0]].f}` : RX_BY_ID[id].eq}
                  </span>
                  <span className="font-mono text-slate-500">
                    {fmtSigned(photo ? photoDH(sp) : RX_BY_ID[id].dH, 0)}
                    {!photo && <span className="ml-2 text-slate-400">({stats.rxById[id] || 0})</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-[11px] text-slate-500">{pr.hint}</p>
    </div>
  );
}
