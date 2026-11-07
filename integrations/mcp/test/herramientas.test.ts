import { describe, expect, it } from 'vitest';
import { buscarEspecies, buscarReacciones, explicarReaccion, fichaEspecie, listarNiveles, normalizar, resumenDashboard } from '../src/herramientas.js';
import { catalogo, dashboard, juego } from './fixtures.js';

describe('normalizar', () => {
  it('quita tildes, subíndices y radicales', () => {
    expect(normalizar('H₂O')).toBe('h2o');
    expect(normalizar('  Óxido   de  Sodio ')).toBe('oxido de sodio');
    expect(normalizar('O· + H₂ -> H₂O')).toBe('o + h2 → h2o');
  });
});

describe('buscarEspecies', () => {
  it('encuentra por fórmula ASCII o Unicode y por nombre', () => {
    expect(buscarEspecies(catalogo, 'H2O')[0].codigo).toBe('H2O');
    expect(buscarEspecies(catalogo, 'H₂O')[0].codigo).toBe('H2O');
    expect(buscarEspecies(catalogo, 'agua')[0].codigo).toBe('H2O');
    expect(buscarEspecies(catalogo, 'cloruro')[0].codigo).toBe('NaCl');
    expect(buscarEspecies(catalogo, 'oxigeno').map((e) => e.codigo)).toEqual(['O2', 'O']);
    expect(buscarEspecies(catalogo, 'xenón')).toEqual([]);
  });

  it('la ficha incluye PubChem y reacciones', () => {
    const f = fichaEspecie(catalogo.especies[2], catalogo);
    expect(f).toContain('https://pubchem.ncbi.nlm.nih.gov/compound/962');
    expect(f).toContain('−241.8 kJ/mol');
    expect(f).toContain('373.2 K (100 °C)');
    expect(f).toContain('`oh2`');
  });
});

describe('buscarReacciones', () => {
  it('por código, ecuación y especies', () => {
    expect(buscarReacciones(catalogo, 'oh2').map((r) => r.codigo)).toEqual(['oh2']);
    expect(buscarReacciones(catalogo, 'O· + O· → O₂').map((r) => r.codigo)).toEqual(['oo']);
    expect(buscarReacciones(catalogo, 'H2 + O2').map((r) => r.codigo)).toContain('h2o2');
    expect(buscarReacciones(catalogo, 'agua').map((r) => r.codigo).sort()).toEqual(['h2o2', 'oh2']);
    expect(buscarReacciones(catalogo, 'propagación').map((r) => r.codigo)).toEqual(['oh2']);
    expect(buscarReacciones(catalogo, 'uranio')).toEqual([]);
  });

  it('explica exotérmica, endotérmica y sin barrera', () => {
    expect(explicarReaccion(catalogo.reacciones[1], catalogo)).toMatch(/exotérmica[\s\S]*libera\*\* 491/);
    expect(explicarReaccion(catalogo.reacciones[0], catalogo)).toMatch(/endotérmica[\s\S]*absorbe\*\* 7.4/);
    expect(explicarReaccion(catalogo.reacciones[2], catalogo)).toContain('No tiene barrera');
  });
});

describe('listarNiveles', () => {
  it('filtra por grado y misión', () => {
    const t = listarNiveles(juego, { grado: 3 });
    expect(t).toContain('Hidrógeno explosivo');
    expect(t).not.toContain('Moléculas en movimiento');
    expect(listarNiveles(juego, { mision: 'estados' })).toContain('Moléculas en movimiento');
    expect(listarNiveles(juego, { grado: 5 })).toBe('No hay niveles que coincidan con el filtro.');
    expect(listarNiveles(juego, { detalle: true })).toContain('Paso 2: Chispa — Pulsa chispa');
  });
});

describe('resumenDashboard', () => {
  it('incluye KPIs y uso por origen', () => {
    const t = resumenDashboard(dashboard);
    expect(t).toContain('Estudiantes: 13');
    expect(t).toContain('Eventos (30 días): 15');
    expect(t).toContain('- mcp: 3 sesiones (5 %)');
    expect(t).toContain('Produce agua');
  });
});
