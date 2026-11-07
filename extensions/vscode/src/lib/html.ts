import { randomBytes } from 'node:crypto';
import { escapeHtml } from './formato';

/** Genera un nonce aleatorio para la Content-Security-Policy. */
export function crearNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * CSP estricta para los webviews: sin scripts, estilos solo con nonce, imágenes solo `data:` y
 * el origen del webview. Se puede habilitar un script con nonce si `conScript` es true.
 */
export function politicaCsp(nonce: string, cspSource: string, conScript = false): string {
  return [
    "default-src 'none'",
    `img-src ${cspSource} data: https:`,
    `style-src 'nonce-${nonce}'`,
    `font-src ${cspSource}`,
    conScript ? `script-src 'nonce-${nonce}'` : "script-src 'none'",
  ].join('; ');
}

const ESTILOS = `
:root { --pe-exo: #e5534b; --pe-endo: #4493f8; }
body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground);
  background: var(--vscode-editor-background); padding: 0 20px 24px; line-height: 1.5; max-width: 760px; }
h1 { font-size: 1.6em; margin: 0.6em 0 0.2em; }
h1 .formula { font-family: var(--vscode-editor-font-family); color: var(--vscode-textLink-foreground); margin-right: .35em; }
h2 { font-size: 1.1em; margin-top: 1.4em; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: .2em; }
.sub { color: var(--vscode-descriptionForeground); margin-top: 0; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--vscode-panel-border); vertical-align: top; }
th { color: var(--vscode-descriptionForeground); font-weight: 600; width: 40%; }
.ecuacion { font-family: var(--vscode-editor-font-family); font-size: 1.35em; padding: 10px 14px; border-radius: 6px;
  background: var(--vscode-textCodeBlock-background); display: inline-block; }
.chip { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: .85em; font-weight: 600;
  border: 1px solid currentColor; margin-right: 6px; }
.exo { color: var(--pe-exo); } .endo { color: var(--pe-endo); }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 12px 0; }
.kpi { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 10px 12px; }
.kpi b { display: block; font-size: 1.6em; }
.kpi span { color: var(--vscode-descriptionForeground); font-size: .9em; }
.termino { border-left: 3px solid var(--vscode-textLink-foreground); padding: 4px 12px; margin: 10px 0; }
.termino b { display: block; }
.aviso { color: var(--vscode-descriptionForeground); font-size: .9em; }
a { color: var(--vscode-textLink-foreground); }
.perfil-energia { max-width: 560px; color: var(--vscode-foreground); }
.pe-curva { stroke: var(--vscode-charts-purple, #a371f7); }
.pe-linea.pe-exo { stroke: var(--pe-exo); } .pe-texto.pe-exo { fill: var(--pe-exo); }
.pe-linea.pe-endo { stroke: var(--pe-endo); } .pe-texto.pe-endo { fill: var(--pe-endo); }
`;

export interface PaginaOpciones {
  titulo: string;
  /** HTML del cuerpo. Debe estar construido con `escapeHtml` para todo dato externo. */
  cuerpo: string;
  nonce: string;
  cspSource: string;
}

/** Documento HTML completo para un webview, con CSP y estilos del tema de VS Code. */
export function pagina({ titulo, cuerpo, nonce, cspSource }: PaginaOpciones): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(politicaCsp(nonce, cspSource))}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(titulo)}</title>
<style nonce="${escapeHtml(nonce)}">${ESTILOS}</style>
</head>
<body>
${cuerpo}
</body>
</html>`;
}

/** Fila de tabla "propiedad | valor" con escape. */
export function fila(etiqueta: string, valor: string): string {
  return `<tr><th scope="row">${escapeHtml(etiqueta)}</th><td>${escapeHtml(valor)}</td></tr>`;
}
