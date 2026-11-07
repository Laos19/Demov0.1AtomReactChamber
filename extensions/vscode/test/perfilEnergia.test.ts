import { describe, expect, it } from 'vitest';
import { perfilEnergiaSvg } from '../src/lib/perfilEnergia';

/** Extrae las coordenadas Y de la curva (primer valor de cada punto del path). */
function yDe(svg: string): { reactivos: number; productos: number } {
  const d = /<path d="([^"]+)" fill="none" class="pe-curva"/.exec(svg)![1];
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return { reactivos: nums[1], productos: nums[nums.length - 1] };
}

describe('perfilEnergiaSvg', () => {
  it('genera un SVG accesible con Eₐ y ΔH', () => {
    const svg = perfilEnergiaSvg(38, -393.5, { titulo: 'C + O₂ → CO₂' });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('<title id="pe-t">C + O₂ → CO₂</title>');
    expect(svg).toContain('Eₐ = 38');
    expect(svg).toContain('ΔH = −393.5');
    expect(svg).toContain('pe-exo');
    expect(svg).not.toContain('style=');
  });

  it('exotérmica: productos por debajo de reactivos (y mayor en SVG)', () => {
    const { reactivos, productos } = yDe(perfilEnergiaSvg(10, -491));
    expect(productos).toBeGreaterThan(reactivos);
  });

  it('endotérmica: productos por encima y clase pe-endo', () => {
    const svg = perfilEnergiaSvg(34, 34);
    const { reactivos, productos } = yDe(svg);
    expect(productos).toBeLessThan(reactivos);
    expect(svg).toContain('pe-endo');
  });

  it('reacción sin barrera lo indica', () => {
    expect(perfilEnergiaSvg(0, -242.6)).toContain('Sin barrera');
  });

  it('escapa el título y tolera valores no finitos', () => {
    const svg = perfilEnergiaSvg(Number.NaN, Number.POSITIVE_INFINITY, { titulo: '<script>' });
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).not.toContain('NaN');
  });
});
