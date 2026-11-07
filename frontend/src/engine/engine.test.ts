/**
 * Pruebas del motor: termodinámica, DSL de condiciones y un "solucionador" que juega
 * cada nivel del juego aplicando su solución, para garantizar que todos son completables.
 */
import { describe, expect, it } from 'vitest';
import contenido from '../data/contenido.generated.json';
import { construirQuimica, ebullicionA, energiaFoton, faseDe, type Catalogo, type Parametros } from './chemistry';
import { Simulation } from './Simulation';
import { SeguidorDePaso, evaluarRegla, leerMetrica, type Condicion } from './conditions';

const q = construirQuimica(contenido.catalogo as unknown as Catalogo);

/** PRNG determinista (mulberry32) para que las pruebas sean reproducibles. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('química', () => {
  it('ΔH de la combustión del carbono = ΔHf(CO₂)', () => {
    expect(q.reaccionPorId.co2.dH).toBeCloseTo(-393.5);
    expect(q.reaccionPorId.co2.eq).toBe('C + O₂ → CO₂');
  });

  it('Clausius-Clapeyron: el agua hierve a ~394 K con 2 atm y ~354 K con 0.5 atm', () => {
    expect(ebullicionA(373.15, 40.7, 2)).toBeGreaterThan(390);
    expect(ebullicionA(373.15, 40.7, 2)).toBeLessThan(398);
    expect(ebullicionA(373.15, 40.7, 0.5)).toBeLessThan(360);
  });

  it('fases del agua a 1 atm', () => {
    expect(faseDe(q, 'H2O', 250, 1)).toBe('Sólido');
    expect(faseDe(q, 'H2O', 300, 1)).toBe('Líquido');
    expect(faseDe(q, 'H2O', 400, 1)).toBe('Gas');
    expect(faseDe(q, 'CO2', 250, 1)).toBe('Gas'); // sublima a 1 atm
  });

  it('energía del fotón: 240 nm rompe O=O (498 kJ/mol)', () => {
    expect(energiaFoton(240)).toBeGreaterThanOrEqual(498);
    expect(energiaFoton(250)).toBeLessThan(498);
  });
});

describe('DSL de condiciones', () => {
  const sim = new Simulation(q, 300, rng(1));
  sim.ajustarCaja(800, 500, 25, true);
  sim.inyectar('H2', 40);
  sim.inyectar('O2', 20);
  const p: Parametros = { T: 300, P: 1, V: 25, UV: 0, lambda: 254 };
  const s = sim.instantanea(p);

  it('lee métricas de conteo, razón y fase', () => {
    expect(leerMetrica('conteo:H2', s, p)).toBe(40);
    expect(leerMetrica('razon:H2:O2', s, p)).toBe(2);
    expect(leerMetrica('fase:H2', s, p)).toBe('Gas');
    expect(leerMetrica('fase:NaCl', s, p)).toBe('—');
  });

  it('evalúa operadores incluido approx con tolerancia', () => {
    expect(evaluarRegla({ metrica: 'razon:H2:O2', op: 'approx', valor: 2, tol: 0.1 }, s, p)).toBe(true);
    expect(evaluarRegla({ metrica: 'conteo:H2', op: '>=', valor: 41 }, s, p)).toBe(false);
  });
});

/** Solución de cada paso: acciones a aplicar antes de simular. */
type Accion = (sim: Simulation, p: Parametros) => void;
const set = (k: Partial<Parametros>): Accion => (_s, p) => Object.assign(p, k);
const iny = (sp: string, n: number): Accion => (s) => void s.inyectar(sp, n);
const chispa: Accion = (s) => s.chispa();

const SOLUCIONES: Record<string, Accion[][]> = {
  'n01-movimiento': [[iny('H2', 20)], [set({ T: 650 })], [set({ T: 5 })]],
  'n02-agua': [[set({ T: 300 })], [set({ T: 400 })], [set({ T: 320 })]],
  'n03-presion': [[set({ P: 2 })], [set({ T: 410 })], [set({ P: 0.5, T: 360 })]],
  'n04-hidrogeno': [[iny('H2', 40), iny('O2', 20)], [set({ T: 700 })], [chispa], [chispa]],
  'n05-carbono': [[set({ T: 2500 })], [chispa], [iny('O2', 10), chispa]],
  'n06-sodio': [[iny('Na', 20), iny('H2O', 30)], [set({ T: 760, P: 100 })], []],
  'n07-sal': [[iny('Na', 20), iny('Cl2', 12)], [set({ T: 500 })], [iny('Cl2', 10)]],
  'n08-fotolisis': [[set({ UV: 800 })], [set({ lambda: 185 })], [set({ UV: 1000 })]],
  'n09-cadena': [[set({ UV: 700, lambda: 350 })], [], [set({ UV: 1000 })], [set({ UV: 0 })]],
};

describe('todos los niveles son completables con su solución', () => {
  for (const nivel of contenido.juego.niveles) {
    it(`${nivel.codigo}: ${nivel.titulo}`, () => {
      const p: Parametros = { ...(nivel.inicio.parametros as Parametros) };
      const sim = new Simulation(q, p.T, rng(nivel.orden * 97));
      sim.ajustarCaja(800, 500, p.V, true);
      for (const [sp, n] of Object.entries(nivel.inicio.carga as Record<string, number>)) sim.inyectar(sp, n);
      nivel.pasos.forEach((paso, i) => {
        const seguidor = new SeguidorDePaso(paso.condicion as Condicion);
        for (const accion of SOLUCIONES[nivel.codigo][i]) accion(sim, p);
        let ok = false;
        // Hasta 90 s simulados por paso; si se estanca, repite la última acción (como haría un estudiante).
        for (let f = 0; f < 60 * 90 && !ok; f++) {
          sim.ajustarCaja(800, 500, p.V);
          sim.paso(p, 2);
          ok = seguidor.actualizar(sim.instantanea(p), p);
          if (!ok && f > 0 && f % 600 === 0) for (const a of SOLUCIONES[nivel.codigo][i]) if (a === chispa) a(sim, p);
        }
        expect(ok, `paso ${i + 1} «${paso.titulo}» no se completó`).toBe(true);
      });
    });
  }
});
