import { escapeHtml, numero } from './formato';

/** Número con signo tipográfico (−/+). */
function conSigno(n: number): string {
  return `${n < 0 ? '−' : n > 0 ? '+' : ''}${numero(Math.abs(n))}`;
}

export interface OpcionesPerfil {
  ancho?: number;
  alto?: number;
  /** Texto de la ecuación para el título accesible. */
  titulo?: string;
}

/**
 * Construye el diagrama de perfil de energía (coordenada de reacción vs. energía) como SVG en línea.
 *
 * - Reactivos en energía 0, productos en ΔH, cima en max(Eₐ, ΔH).
 * - Escala lineal, pero con una joroba mínima visible cuando Eₐ > 0 para que reacciones con
 *   ΔH grande (p. ej. −491 kJ/mol) y Eₐ pequeña (10 kJ/mol) sigan mostrando la barrera.
 * - Usa `currentColor` y clases (`pe-curva`, `pe-exo`, `pe-endo`) que la hoja de estilos del webview
 *   puede redefinir; no usa atributos `style` para ser compatible con una CSP estricta.
 *
 * @param ea Energía de activación en kJ/mol (≥ 0).
 * @param dh Entalpía de reacción en kJ/mol.
 */
export function perfilEnergiaSvg(ea: number, dh: number, opciones: OpcionesPerfil = {}): string {
  const W = opciones.ancho ?? 480;
  const H = opciones.alto ?? 280;
  const m = { izq: 56, der: 24, sup: 36, inf: 40 };
  const eaSeguro = Math.max(0, Number.isFinite(ea) ? ea : 0);
  const dhSeguro = Number.isFinite(dh) ? dh : 0;

  const cimaReal = Math.max(eaSeguro, dhSeguro, 0);
  const minimo = Math.min(0, dhSeguro);
  let rango = cimaReal - minimo || 1;
  // Joroba mínima visible: 8 % del rango si hay barrera.
  const cimaDibujo = eaSeguro > 0 ? Math.max(cimaReal, Math.max(0, dhSeguro) + rango * 0.08) : cimaReal;
  rango = cimaDibujo - minimo || 1;

  const altoUtil = H - m.sup - m.inf;
  const y = (e: number): number => m.sup + ((cimaDibujo - e) / rango) * altoUtil;
  const x0 = m.izq;
  const x1 = W - m.der;
  const xr = x0 + (x1 - x0) * 0.22; // fin meseta reactivos
  const xc = x0 + (x1 - x0) * 0.5; // cima
  const xp = x0 + (x1 - x0) * 0.78; // inicio meseta productos

  const yR = y(0);
  const yP = y(dhSeguro);
  const yC = y(cimaDibujo);

  const camino =
    eaSeguro > 0
      ? `M ${x0} ${yR} L ${xr} ${yR} C ${xr + (xc - xr) * 0.55} ${yR}, ${xc - (xc - xr) * 0.45} ${yC}, ${xc} ${yC} ` +
        `C ${xc + (xp - xc) * 0.45} ${yC}, ${xp - (xp - xc) * 0.55} ${yP}, ${xp} ${yP} L ${x1} ${yP}`
      : `M ${x0} ${yR} L ${xr} ${yR} C ${xc} ${yR}, ${xc} ${yP}, ${xp} ${yP} L ${x1} ${yP}`;

  const exo = dhSeguro < 0;
  const colorDh = exo ? '#e5534b' : '#4493f8';
  const claseDh = exo ? 'pe-exo' : 'pe-endo';
  const f = (n: number): string => n.toFixed(1);
  const titulo = escapeHtml(opciones.titulo ?? 'Perfil de energía');

  const partes: string[] = [];
  partes.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-labelledby="pe-t pe-d" class="perfil-energia">`,
    `<title id="pe-t">${titulo}</title>`,
    `<desc id="pe-d">Energía de activación ${escapeHtml(numero(eaSeguro))} kJ/mol; variación de entalpía ${escapeHtml(numero(dhSeguro))} kJ/mol.</desc>`,
    `<defs><marker id="pe-flecha" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>`,
    // Ejes
    `<line x1="${x0}" y1="${m.sup - 8}" x2="${x0}" y2="${H - m.inf}" stroke="currentColor" stroke-opacity="0.6" marker-start="url(#pe-flecha)"/>`,
    `<line x1="${x0}" y1="${H - m.inf}" x2="${x1 + 8}" y2="${H - m.inf}" stroke="currentColor" stroke-opacity="0.6" marker-end="url(#pe-flecha)"/>`,
    `<text x="14" y="${f(m.sup + altoUtil / 2)}" transform="rotate(-90 14 ${f(m.sup + altoUtil / 2)})" text-anchor="middle" font-size="12" fill="currentColor">Energía (kJ/mol)</text>`,
    `<text x="${f((x0 + x1) / 2)}" y="${H - 12}" text-anchor="middle" font-size="12" fill="currentColor">Avance de la reacción</text>`,
    // Niveles de referencia
    `<line x1="${x0}" y1="${f(yR)}" x2="${x1}" y2="${f(yR)}" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="4 4"/>`,
    `<line x1="${f(xp)}" y1="${f(yP)}" x2="${x1}" y2="${f(yP)}" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="4 4"/>`,
    // Curva
    `<path d="${camino}" fill="none" class="pe-curva" stroke="#a371f7" stroke-width="3" stroke-linecap="round"/>`,
    `<text x="${f(x0 + 4)}" y="${f(yR - 6)}" font-size="12" fill="currentColor">Reactivos</text>`,
    `<text x="${f(x1 - 4)}" y="${f(yP + (exo ? 16 : -6))}" font-size="12" text-anchor="end" fill="currentColor">Productos</text>`,
  );

  if (eaSeguro > 0) {
    const xa = xc - 18;
    partes.push(
      `<line x1="${f(xa)}" y1="${f(yR)}" x2="${f(xa)}" y2="${f(yC + 3)}" stroke="currentColor" stroke-width="1.5" marker-end="url(#pe-flecha)"/>`,
      yR - yC >= 28
        ? `<text x="${f(xa - 6)}" y="${f((yR + yC) / 2 + 4)}" font-size="12" text-anchor="end" fill="currentColor">Eₐ = ${escapeHtml(numero(eaSeguro))}</text>`
        : `<text x="${f(xc)}" y="${f(yC - 8)}" font-size="12" text-anchor="middle" fill="currentColor">Eₐ = ${escapeHtml(numero(eaSeguro))}</text>`,
    );
  } else {
    partes.push(`<text x="${f(xc)}" y="${f(Math.min(yR, yP) - 10)}" font-size="12" text-anchor="middle" fill="currentColor">Sin barrera (Eₐ ≈ 0)</text>`);
  }

  if (dhSeguro !== 0) {
    const xd = x1 - 36;
    partes.push(
      `<line x1="${f(xd)}" y1="${f(yR)}" x2="${f(xd)}" y2="${f(yP + (exo ? -3 : 3))}" class="pe-linea ${claseDh}" stroke="${colorDh}" stroke-width="2" marker-end="url(#pe-flecha)"/>`,
      `<text x="${f(xd - 6)}" y="${f((yR + yP) / 2 + 4)}" font-size="12" text-anchor="end" class="pe-texto ${claseDh}" fill="${colorDh}">ΔH = ${escapeHtml(conSigno(dhSeguro))}</text>`,
    );
  }

  partes.push('</svg>');
  return partes.join('');
}
