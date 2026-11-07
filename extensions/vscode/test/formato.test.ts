import { describe, expect, it } from 'vitest';
import { energia, escapeHtml, estrellas, explicacionReaccion, normalizarApiUrl, temperatura, tipoTermico, urlPubChem } from '../src/lib/formato';
import { cuerpoEventos } from '../src/lib/telemetria';

describe('formato', () => {
  it('escapa HTML peligroso', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">&\'')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
    expect(escapeHtml(null)).toBe('');
  });

  it('formatea energías con signo y unidad', () => {
    expect(energia(-242.6)).toBe('−242.6 kJ/mol');
    expect(energia(4.4)).toBe('+4.4 kJ/mol');
    expect(energia(0)).toBe('0 kJ/mol');
    expect(energia(null)).toBe('—');
  });

  it('convierte kelvin a °C', () => {
    expect(temperatura(373.15)).toBe('373.2 K (100 °C)');
  });

  it('clasifica por el signo de ΔH', () => {
    expect(tipoTermico(-1)).toBe('exotérmica');
    expect(tipoTermico(34)).toBe('endotérmica');
    expect(tipoTermico(0)).toBe('neutra');
  });

  it('explica reacciones sin barrera y con barrera', () => {
    const base = { codigo: 'x', reactivos: [], productos: [], ecuacion: 'A → B' };
    expect(explicacionReaccion({ ...base, etiqueta: 'Terminación', ea: 0, dh: -242.6 })).toMatch(/exotérmica.*libera 242.6 kJ.*No tiene barrera/);
    expect(explicacionReaccion({ ...base, etiqueta: 'Transferencia', ea: 34, dh: 34 })).toMatch(/endotérmica.*absorbe 34 kJ.*34 kJ\/mol/);
  });

  it('dibuja estrellas acotadas', () => {
    expect(estrellas(2)).toBe('★★☆');
    expect(estrellas(9)).toBe('★★★');
    expect(estrellas(-1)).toBe('☆☆☆');
  });

  it('normaliza la URL de la API', () => {
    expect(normalizarApiUrl('https://x.onrender.com/api/ ')).toBe('https://x.onrender.com');
    expect(normalizarApiUrl('http://localhost:8080//')).toBe('http://localhost:8080');
  });

  it('construye la URL de PubChem', () => {
    expect(urlPubChem(962)).toBe('https://pubchem.ncbi.nlm.nih.gov/compound/962');
    expect(urlPubChem(null)).toBeUndefined();
  });

  it('arma el cuerpo de /api/eventos con origen vscode', () => {
    const c = cuerpoEventos('00000000-0000-4000-8000-000000000000', 'vscode', [{ tipo: 'quimi_consulta', datos: { q: 'mol' } }, { tipo: 'pagina_vista', nivel: 'n01' }]);
    expect(c).toEqual({
      sesion: '00000000-0000-4000-8000-000000000000',
      origen: 'vscode',
      dispositivo: 'escritorio',
      eventos: [{ tipo: 'quimi_consulta', datos: { q: 'mol' } }, { tipo: 'pagina_vista', nivel: 'n01', datos: {} }],
    });
    expect(cuerpoEventos('s', 'vscode', Array.from({ length: 80 }, () => ({ tipo: 'chispa' as const }))).eventos).toHaveLength(50);
  });
});
