import { describe, expect, it } from 'vitest';
import { pagina, politicaCsp } from '../src/lib/html';
import type { Especie, Reaccion } from '../src/lib/tipos';
import { cuerpoEspecie, cuerpoQuimi, cuerpoReaccion } from '../src/lib/vistas';

const agua: Especie = { codigo: 'H2O', formula: 'H₂O', nombre: 'Agua', masa_molar: 18.015, dhf: -241.8, pf: 273.15, pe: 373.15, cid: 962, radical: false };
const r: Reaccion = { codigo: 'oh2', etiqueta: 'Propagación', ea: 10, dh: -491, ecuacion: 'O· + H₂ → H₂O', reactivos: ['O', 'H2'], productos: ['H2O'] };

describe('vistas', () => {
  it('CSP sin scripts y con nonce de estilos', () => {
    const csp = politicaCsp('abc', 'vscode-webview://x');
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'none'");
    expect(csp).toContain("style-src 'nonce-abc'");
  });

  it('la página incluye la CSP y escapa el título', () => {
    const html = pagina({ titulo: '<b>x</b>', cuerpo: '<p>ok</p>', nonce: 'n1', cspSource: 'vscode-webview://x' });
    expect(html).toContain('http-equiv="Content-Security-Policy"');
    expect(html).toContain('<title>&lt;b&gt;x&lt;/b&gt;</title>');
    expect(html).toContain('<style nonce="n1">');
  });

  it('ficha de especie con enlace a PubChem y reacciones donde participa', () => {
    const html = cuerpoEspecie(agua, { elementos: [], especies: [agua], reacciones: [r], fotolisis: [], presets: [] });
    expect(html).toContain('https://pubchem.ncbi.nlm.nih.gov/compound/962');
    expect(html).toContain('−241.8 kJ/mol');
    expect(html).toContain('O· + H₂ → H₂O');
  });

  it('reacción con perfil SVG', () => {
    const html = cuerpoReaccion(r);
    expect(html).toContain('<svg');
    expect(html).toContain('exotérmica');
  });

  it('Quimi escapa la pregunta del usuario', () => {
    const html = cuerpoQuimi('<script>alert(1)</script>', { mensaje: 'm', terminos: [{ termino: 'Mol', definicion: 'd', relevancia: 1 }] });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<b>Mol</b>');
  });
});
