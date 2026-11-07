// Exporta docs/presentacion/index.html a PDF (16:9, 17 páginas) con Playwright + Chromium.
// Uso (desde la raíz del repo): node docs/presentacion/scripts/export-pdf.cjs
const path = require('path');
// PLAYWRIGHT_MODULE permite usar otra instalación de Playwright (p. ej. la global) si la del repo no tiene navegadores.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const dir = path.resolve(__dirname, '..');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + path.join(dir, 'index.html') + '?print-pdf', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  await p.pdf({ path: path.join(dir, 'AtomReactChamber-presentacion.pdf'), width: '1280px', height: '720px', printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log('PDF generado');
})();
