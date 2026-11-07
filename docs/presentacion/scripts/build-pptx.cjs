// Genera docs/presentacion/AtomReactChamber-presentacion.pptx (versión simplificada y fiel del deck reveal.js).
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const DIR = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const notas = [...html.matchAll(/<aside class="notes">([\s\S]*?)<\/aside>/g)].map((m) =>
  m[1].replace(/<[^>]+>/g, '').split('\n').map((l) => l.trim()).filter(Boolean).join('\n\n'));
if (notas.length !== 17) throw new Error('se esperaban 17 notas, hay ' + notas.length);

const K = { papel: 'F4F7FB', cuad: 'DCE5F0', tinta: '13233A', suave: '4A5B73', pizarra: '0E1A2B', sup: '15253B',
  cobre: '0F8C7E', calcio: 'E8590C', calcioO: 'C84C0A', litio: 'C2255C', potasio: '7048E8', sodio: 'F2B705', oro: '9A7300',
  tCobre: 'E3F3F1', tCalcio: 'FDEBDD', tLitio: 'F9E3EC', tPotasio: 'ECE7FD', tSodio: 'FDF3CF', blanco: 'FFFFFF', claro: 'E6EDF5' };
const H = 'Arial'; const B = 'Calibri'; const M = 'Consolas';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5
pres.author = 'Adriana Rafaela Laos González';
pres.title = 'AtomReactChamber v2';
pres.company = 'Universidad Privada de Tacna';
pres.theme = { headFontFace: H, bodyFontFace: B };

const W = 13.333;
function base(n, sym, label, color, eyebrow, title, pregunta, symColor = K.blanco) {
  const s = pres.addSlide();
  s.background = { color: K.papel };
  // casilla de elemento (motivo)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: W - 1.45, y: 0.3, w: 0.95, h: 1.02, rectRadius: 0.08, fill: { color }, line: { color: K.tinta, width: 2.5 }, objectName: 'casilla' });
  s.addText(String(n), { x: W - 1.42, y: 0.32, w: 0.5, h: 0.22, fontFace: M, fontSize: 9, color: symColor, margin: 0, isTextBox: true });
  s.addText(sym, { x: W - 1.45, y: 0.5, w: 0.95, h: 0.5, fontFace: H, bold: true, fontSize: 24, color: symColor, align: 'center', margin: 0, isTextBox: true });
  s.addText(label, { x: W - 1.45, y: 1.02, w: 0.95, h: 0.22, fontFace: B, bold: true, fontSize: 8, color: symColor, align: 'center', margin: 0, isTextBox: true });
  s.addText(eyebrow, { x: 0.6, y: 0.35, w: 10, h: 0.3, fontFace: M, fontSize: 11, color: K.suave, margin: 0, isTextBox: true });
  s.addText(title, { x: 0.6, y: 0.65, w: 10.9, h: 0.95, fontFace: H, bold: true, fontSize: 28, color: K.tinta, margin: 0, valign: 'top', isTextBox: true });
  if (pregunta) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 6.75, w: 11.6, h: 0.48, rectRadius: 0.24, fill: { color: K.sodio }, line: { color: K.tinta, width: 1.5 }, objectName: 'preguntame' });
    s.addText([{ text: 'Pregúntame  ', options: { bold: true, fontFace: H, fontSize: 11 } }, { text: pregunta, options: { fontSize: 13 } }],
      { x: 0.85, y: 6.75, w: 11.2, h: 0.48, fontFace: B, color: K.tinta, valign: 'middle', margin: 0, isTextBox: true });
  }
  s.addText(`${n} / 17`, { x: W - 1.2, y: 6.85, w: 0.9, h: 0.3, fontFace: M, fontSize: 10, color: K.suave, align: 'right', margin: 0, isTextBox: true });
  s.addNotes(notas[n - 1]);
  return s;
}
function card(s, x, y, w, h, fill = K.blanco) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: K.tinta, width: 1.5 } });
}
function txt(s, t, o) { s.addText(t, { fontFace: B, color: K.tinta, margin: 0, valign: 'top', isTextBox: true, ...o }); }
function bullets(s, items, o) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { fontFace: B, fontSize: 14, color: K.tinta, margin: 0, valign: 'top', paraSpaceAfter: 5, isTextBox: true, ...o });
}
function tabla(s, head, rows, o, fs = 12) {
  const hdr = head.map((t) => ({ text: t, options: { bold: true, fontFace: H, fontSize: 11, color: K.tinta, border: [{ type: 'none' }, { type: 'none' }, { pt: 1.5, color: K.tinta }, { type: 'none' }] } }));
  const body = rows.map((r) => r.map((t) => ({ text: t, options: { fontSize: fs, fontFace: B, color: K.tinta, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: K.cuad }, { type: 'none' }] } })));
  s.addTable([hdr, ...body], { margin: [3, 5, 3, 5], valign: 'top', ...o });
}

/* 1 · Portada */
{
  const s = pres.addSlide();
  s.background = { color: K.pizarra };
  txt(s, 'Universidad Privada de Tacna · Facultad de Ingeniería\nEscuela Profesional de Ingeniería de Sistemas · Base de Datos II', { x: 0.7, y: 0.6, w: 7, h: 0.6, fontFace: M, fontSize: 11, color: '9DB0C7' });
  txt(s, 'AtomReactChamber', { x: 0.7, y: 1.9, w: 7.5, h: 0.9, fontFace: H, bold: true, fontSize: 42, color: K.claro });
  txt(s, 'Laboratorio virtual gamificado de química para estudiantes de secundaria del Perú', { x: 0.7, y: 2.9, w: 6.6, h: 0.9, fontSize: 20, color: K.claro });
  txt(s, [{ text: 'Expone: ', options: { color: '9DB0C7' } }, { text: 'Adriana Rafaela Laos González', options: { bold: true, color: K.claro } }, { text: ' · 2023077474', options: { color: '9DB0C7' } }], { x: 0.7, y: 4.4, w: 7, h: 0.35, fontSize: 15 });
  txt(s, 'Docente: Ing. Patrick Cuadros Quiroga · Tacna, noviembre de 2026', { x: 0.7, y: 4.8, w: 7, h: 0.35, fontSize: 15, color: '9DB0C7' });
  const tiles = [['1', 'H', K.cobre], null, null, ['18', 'Ar', K.potasio], null, ['6', 'C', K.calcio], ['8', 'O', K.calcio], null, ['11', 'Na', K.litio], null, ['17', 'Cl', K.litio], ['★', 'v2', K.sodio]];
  tiles.forEach((t, i) => {
    const x = 8.3 + (i % 4) * 1.15; const y = 0.8 + Math.floor(i / 4) * 1.2;
    if (!t) { s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.0, h: 1.07, rectRadius: 0.08, fill: { color: K.pizarra }, line: { color: '2A3B55', width: 1.5, dashType: 'dash' } }); return; }
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.0, h: 1.07, rectRadius: 0.08, fill: { color: t[2] }, line: { color: K.claro, width: 2 } });
    const c = t[1] === 'v2' ? K.tinta : K.blanco;
    txt(s, t[0], { x: x + 0.07, y: y + 0.04, w: 0.5, h: 0.2, fontFace: M, fontSize: 9, color: c });
    txt(s, t[1], { x, y: y + 0.3, w: 1.0, h: 0.5, fontFace: H, bold: true, fontSize: 26, color: c, align: 'center' });
  });
  txt(s, 'Esta exposición está hecha para que me interrumpan.\nBusquen la franja amarilla en cada diapositiva.', { x: 7.3, y: 6.3, w: 5.4, h: 0.6, fontSize: 13, color: '9DB0C7', align: 'right' });
  s.addNotes(notas[0]);
}

/* 2 · Problema */
{
  const s = base(2, 'Pr', 'problema', K.calcio, 'El problema', 'Aprendemos química sin poder experimentar, y se nota en los resultados',
    '¿Cuántos colegios tienen laboratorio? No hay cifra publicada: es mi objetivo OI-1.');
  const d = [['408', K.calcioO, 'puntos del Perú en Ciencia, PISA 2022 (promedio OCDE: 485)', 'Minedu (2023); Expreso (2023)'],
    ['47 %', K.calcioO, 'llega al nivel 2 o más en ciencias (OCDE: 76 %); solo 1 % a los niveles 5–6', 'OECD (2023), nota país Perú'],
    ['21,8 %', K.litio, 'en zona rural alcanza el nivel 2 o más en ciencias', 'Defensoría del Pueblo en Gestión (s. f.) · secundaria'],
    ['18,6 %', K.potasio, 'en Tacna, región líder, logra nivel satisfactorio en CyT (ECE 2019, 2.º sec.)', 'Andina (2020) · fuente secundaria']];
  d.forEach((c, i) => {
    const x = 0.6 + i * 3.0; card(s, x, 1.75, 2.8, 2.25);
    txt(s, c[0], { x: x + 0.2, y: 1.9, w: 2.5, h: 0.65, fontFace: H, bold: true, fontSize: 32, color: c[1] });
    txt(s, c[2], { x: x + 0.2, y: 2.6, w: 2.45, h: 0.95, fontSize: 13 });
    txt(s, c[3], { x: x + 0.2, y: 3.55, w: 2.45, h: 0.4, fontSize: 9.5, color: K.suave });
  });
  txt(s, 'Causas que sí podemos atacar con software', { x: 0.6, y: 4.25, w: 6.5, h: 0.35, fontFace: H, bold: true, fontSize: 15 });
  bullets(s, ['Reactivos peligrosos o caros (sodio, cloro, hidrógeno): no se hacen en el aula.', 'Simuladores en inglés, genéricos o caros (Labster: contratos «desde US$ 5 000/año»).', 'El docente no tiene datos de avance por estudiante y por paso.'], { x: 0.6, y: 4.65, w: 6.6, h: 1.9 });
  card(s, 7.6, 4.25, 4.6, 2.1, K.tCobre);
  txt(s, 'Por qué una solución web ligera', { x: 7.8, y: 4.4, w: 4.2, h: 0.35, fontFace: H, bold: true, fontSize: 14 });
  txt(s, '71 % de las IE públicas de secundaria tenía internet en 2022 (Edudatos 45): alcanza para una web, pero no para depender de ella. Por eso hay modo sin servidor.', { x: 7.8, y: 4.85, w: 4.2, h: 1.4, fontSize: 13 });
}

/* 3 · Objetivos */
{
  const s = base(3, 'Ob', 'objetivos', K.cobre, 'Objetivos medibles', 'Cada objetivo tiene indicador, meta, instrumento… y una consulta SQL',
    '¿Por qué el dashboard puede medir sus propios objetivos? (el modelo se diseñó desde los indicadores)');
  card(s, 0.6, 1.7, 11.6, 0.75, K.tCobre);
  txt(s, [{ text: 'General: ', options: { bold: true } }, { text: 'en 16 semanas, implementar AtomReactChamber con PostgreSQL para prácticas guiadas verificadas por un simulador 2D y seguimiento docente; en un piloto, ≥ 60 % de niveles completados y SUS ≥ 70.' }], { x: 0.8, y: 1.78, w: 11.2, h: 0.6, fontSize: 13, valign: 'middle' });
  tabla(s, ['ID', 'Indicador', 'Meta', 'Cómo se mide'], [
    ['OS-2', 'Tasa de niveles completados (completados / iniciados)', '≥ 60 %', 'vista v_estadisticas_nivel'],
    ['OI-2', 'Ganancia normalizada de Hake ⟨g⟩ pre/post', '≥ 0,30 con n ≥ 30', 'cuestionario en la BD'],
    ['OS-5', '% de pasos donde se pidió la «solución» de Quimi', '≤ 30 %', 'pista_usada ⋈ pista'],
    ['OS-4', 'Mediana de tiempo por paso', '≤ 3 min', 'v_tiempo_por_paso (percentile_cont)'],
    ['OS-8', 'Workflows en verde en main · cobertura backend', '100 % · ≥ 70 %', 'GitHub Actions'],
    ['OS-10', 'Costo mensual de infraestructura', 'S/ 0', 'reporte de costos de infra.yml']],
  { x: 0.6, y: 2.65, w: 11.6, colW: [0.9, 5.2, 2.2, 3.3] }, 14);
  txt(s, 'Lista completa en docs/investigacion/problema-y-objetivos.md y FD01 §1.4. Línea base SUS ≈ 68 (Bangor et al., 2009).', { x: 0.6, y: 6.15, w: 11.6, h: 0.3, fontSize: 10, color: K.suave });
}

/* 4 · Solución */
{
  const s = base(4, 'So', 'solución', K.cobre, 'La solución', 'La tabla periódica es el tablero de juego', '¿Qué pasa si el servidor gratuito está dormido justo ahora? (spoiler: lo van a ver)');
  s.addImage({ path: path.join(DIR, 'img/mapa-recorte.png'), x: 0.6, y: 1.45, w: 7.6, h: 4.16, altText: 'Mapa de misiones con forma de tabla periódica' });
  txt(s, [{ text: '9 niveles', options: { bold: true } }, { text: ' en ' }, { text: '4 misiones', options: { bold: true } }, { text: ' del área Ciencia y Tecnología (CNEB):' }], { x: 8.6, y: 1.5, w: 3.8, h: 0.75, fontSize: 17 });
  [['Estados de la materia', K.cobre], ['Combustión', K.calcio], ['Familias de la tabla', K.litio], ['La luz también reacciona', K.potasio]].forEach((m, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.6, y: 2.35 + i * 0.45, w: 2.9, h: 0.36, rectRadius: 0.18, fill: { color: m[1] }, line: { color: K.tinta, width: 1.5 } });
    txt(s, m[0], { x: 8.75, y: 2.35 + i * 0.45, w: 2.7, h: 0.36, fontSize: 12, bold: true, color: K.blanco, valign: 'middle' });
  });
  txt(s, 'Los colores vienen del ensayo a la llama: cobre, calcio, litio, potasio y sodio.\n\nRoles: estudiante (juega), docente (aulas, ranking, dashboard) y admin.', { x: 8.6, y: 4.25, w: 3.8, h: 1.3, fontSize: 13 });
  card(s, 8.6, 5.65, 3.7, 0.75, K.tSodio);
  txt(s, 'Demo en vivo: estudiante@demo.arc.pe · quimica2026', { x: 8.75, y: 5.7, w: 3.45, h: 0.65, fontSize: 12.5, bold: true, valign: 'middle' });
}

/* 5 · Juego */
{
  const s = base(5, 'Ju', 'juego', K.calcio, 'Cómo se juega', 'Un nivel = pasos que el simulador verifica, no que el estudiante marca', '¿Qué impide que alguien marque los pasos desde la consola del navegador?');
  const p = [['1', 'Elige casilla', 'Se desbloquea si completaste el nivel previo (nivel_previo_id).', K.cobre],
    ['2', 'Experimenta', 'Temperatura, presión, UV, inyector, chispa. Partículas en 2D.', K.calcio],
    ['3', 'Paso cumplido', 'Una regla JSON lo verifica: conteo:H2 ≥ 50, sostenido 2 s.', K.litio],
    ['4', 'Quimi ayuda', 'Pista → explicación → solución: 5, 10 y 20 XP, en orden.', K.potasio],
    ['5', 'Cuestionario', 'La BD corrige. Estrellas 1–3, XP, racha e insignias.', K.oro]];
  p.forEach((c, i) => {
    const x = 0.6 + i * 2.35; card(s, x, 1.75, 2.2, 2.3);
    txt(s, c[0], { x: x + 0.15, y: 1.85, w: 1, h: 0.45, fontFace: H, bold: true, fontSize: 22, color: c[3] });
    txt(s, c[1], { x: x + 0.15, y: 2.3, w: 1.95, h: 0.35, fontFace: H, bold: true, fontSize: 13 });
    txt(s, c[2], { x: x + 0.15, y: 2.7, w: 1.95, h: 1.25, fontSize: 12 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.3, w: 5.8, h: 2.15, rectRadius: 0.08, fill: { color: K.pizarra }, line: { color: K.pizarra } });
  txt(s, '-- paso.condicion (jsonb), nivel 1, paso 2\n{ "todas": [ { "metrica": "temperatura",\n             "op": ">=", "valor": 600 } ],\n  "durante": 2 }\n-- evaluado en engine/conditions.ts\n-- (SeguidorDePaso, 60 veces por segundo)', { x: 0.8, y: 4.42, w: 5.5, h: 1.95, fontFace: M, fontSize: 12, color: K.claro });
  txt(s, 'Regla de estrellas (fn_calcular_estrellas)', { x: 6.8, y: 4.3, w: 5.4, h: 0.35, fontFace: H, bold: true, fontSize: 14 });
  bullets(s, ['Empiezas con ★★★', '−1 si abriste la explicación; −1 más si pediste la solución', '−1 si aciertas menos de 2/3 del cuestionario · mínimo ★', 'Repetir un nivel completado da solo 25 % de XP (anti-farming)'], { x: 6.8, y: 4.75, w: 5.4, h: 1.8 });
}

/* 6 · Arquitectura (diagrama con formas) */
{
  const s = base(6, 'Ar', 'arquitectura', K.potasio, 'Arquitectura', 'Una API, cuatro clientes y PostgreSQL como fuente de verdad', '¿Por qué un monolito modular y no microservicios? ¿Por qué Fastify y no Spring Boot?');
  const cl = [['Web React 18', 'Vite · Canvas 2D · origen=web', K.tCobre], ['Extensión VS Code', 'origen=vscode · .vsix', K.blanco], ['Servidor MCP', 'origen=mcp · stdio', K.blanco], ['Skill Claude Code', 'origen=claude · curl', K.blanco]];
  cl.forEach((c, i) => {
    const y = 1.75 + i * 0.85; card(s, 0.6, y, 3.0, 0.72, c[2]);
    txt(s, c[0], { x: 0.75, y: y + 0.06, w: 2.8, h: 0.3, fontFace: H, bold: true, fontSize: 12 });
    txt(s, c[1], { x: 0.75, y: y + 0.38, w: 2.8, h: 0.28, fontFace: M, fontSize: 9.5, color: K.suave });
    const y1 = y + 0.36, y2 = 2.6 + i * 0.45;
    s.addShape(pres.shapes.LINE, y2 >= y1 ? { x: 3.6, y: y1, w: 0.9, h: Math.max(0.01, y2 - y1), line: { color: K.tinta, width: 1.5, endArrowType: 'triangle' } }
      : { x: 3.6, y: y2, w: 0.9, h: y1 - y2, flipV: true, line: { color: K.tinta, width: 1.5, endArrowType: 'triangle' } });
  });
  card(s, 4.5, 2.0, 3.6, 2.6, K.tPotasio);
  txt(s, 'API Fastify 5 · Node 22', { x: 4.7, y: 2.1, w: 3.3, h: 0.35, fontFace: H, bold: true, fontSize: 13 });
  txt(s, 'Render Web Service (free)\n21 rutas /api/* · Swagger en /api/docs\nJWT + roles · zod → Ajv + OpenAPI\nServices: Intento, Quimi, Aula\nRepos: Catálogo, Juego, Dashboard\nhelmet · CORS · rate-limit', { x: 4.7, y: 2.5, w: 3.3, h: 2.0, fontSize: 11.5 });
  s.addShape(pres.shapes.LINE, { x: 8.1, y: 3.3, w: 0.8, h: 0, line: { color: K.tinta, width: 1.5, endArrowType: 'triangle' } });
  txt(s, 'pg · TLS', { x: 8.1, y: 3.0, w: 0.8, h: 0.25, fontFace: M, fontSize: 9, color: K.suave, align: 'center' });
  card(s, 8.9, 1.75, 3.3, 3.1, K.tSodio);
  txt(s, 'PostgreSQL 16 · Neon', { x: 9.05, y: 1.85, w: 3.0, h: 0.35, fontFace: H, bold: true, fontSize: 13 });
  txt(s, 'serverless free · PITR 6 h\n29 tablas en 3FN · 48 changesets\n16 funciones PL/pgSQL · 10 triggers\n6 vistas + 1 materializada\nFTS español sin tildes (GIN)\nauditoría JSONB · BRIN\n\nReglas: fn_finalizar_intento, fn_usar_pista, fn_registrar_paso, tg_respuesta_*', { x: 9.05, y: 2.25, w: 3.05, h: 2.55, fontSize: 11 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.25, w: 3.0, h: 1.2, rectRadius: 0.08, fill: { color: K.papel }, line: { color: K.tinta, width: 1.5, dashType: 'dash' } });
  txt(s, 'Modo demo (web)\nSi la API no responde: FuenteDemo replica estrellas/XP en el navegador', { x: 0.75, y: 5.32, w: 2.75, h: 1.05, fontSize: 11 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.5, y: 5.05, w: 7.7, h: 1.45, rectRadius: 0.08, fill: { color: K.tinta }, line: { color: K.tinta } });
  txt(s, [{ text: 'GitHub  ', options: { bold: true, color: K.sodio, fontFace: H } }, { text: '8 workflows: infra · db · backup · release · docs · pages · ci · codeql\nTerraform (Neon + Render, estado en HCP) → Liquibase update → deploy hooks → smoke test /api/health\npg_dump diario cifrado · release-please (.vsix, zips) · Pages: TypeDoc, ER, reportes, demo /app/' }], { x: 4.7, y: 5.12, w: 7.4, h: 1.3, fontSize: 11.5, color: K.claro });
}

/* 7 · Modelo de datos */
{
  const s = base(7, 'Bd', 'datos', K.sodio, 'Modelo de datos', '29 tablas, 5 dominios, tercera forma normal', '¿Guardar usuario.xp rompe la 3FN? ¿Y usar jsonb en una BD relacional?', K.tinta);
  const d = [['Seguridad', 'rol\nusuario\nauditoria', K.tLitio], ['Catálogo', 'elemento\nespecie\nespecie_atomo\nreaccion\nreaccion_participante\nfotolisis\npreset\npreset_carga', K.tCobre],
    ['Juego', 'mision\nnivel\npaso\npista\npregunta\nopcion\ninsignia\nglosario', K.tCalcio], ['Progreso', 'aula\nmatricula\naula_nivel\nintento\nintento_paso\npista_usada\nrespuesta\nlogro_usuario', K.tPotasio], ['Telemetría', 'sesion\nevento', K.tSodio]];
  d.forEach((c, i) => {
    const x = 0.6 + i * 2.35; card(s, x, 1.55, 2.2, 2.75, c[2]);
    txt(s, c[0], { x: x + 0.15, y: 1.63, w: 1.95, h: 0.32, fontFace: H, bold: true, fontSize: 13 });
    txt(s, c[1], { x: x + 0.15, y: 2.0, w: 2.0, h: 2.25, fontFace: M, fontSize: 10.5 });
  });
  txt(s, 'Decisiones de normalización', { x: 0.6, y: 4.45, w: 5.6, h: 0.32, fontFace: H, bold: true, fontSize: 14 });
  bullets(s, ['ΔH no se guarda: se deriva de ΔHf° en v_reaccion_entalpia.', 'N:M explícitas: especie_atomo, reaccion_participante, matricula.', 'Correo único sin mayúsculas: índice sobre lower(email).'], { x: 0.6, y: 4.82, w: 5.7, h: 1.8, fontSize: 13 });
  txt(s, 'Desnormalización consciente', { x: 6.6, y: 4.45, w: 5.6, h: 0.32, fontFace: H, bold: true, fontSize: 14 });
  bullets(s, ['usuario.xp e intento.aciertos: contadores mantenidos solo por funciones y triggers.', 'paso.condicion y nivel.inicio son jsonb validado con CHECK: el DSL cambia sin migrar.'], { x: 6.6, y: 4.82, w: 5.6, h: 1.8, fontSize: 13 });
}

/* 8 · Reglas en la BD */
{
  const s = base(8, 'Pg', 'PL/pgSQL', K.sodio, 'Base de Datos II, en serio', 'Las reglas de negocio viven en PostgreSQL', '¿Qué pasa si el mismo estudiante pulsa «Finalizar» dos veces a la vez? ¿Por qué BRIN y no B-tree?', K.tinta);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.5, w: 6.1, h: 4.95, rectRadius: 0.08, fill: { color: K.pizarra }, line: { color: K.pizarra } });
  txt(s, "-- 007-funciones.sql · fn_finalizar_intento\nSELECT * INTO v_i FROM intento\n WHERE id = p_intento FOR UPDATE;\nIF v_i.estado <> 'en_curso' THEN RAISE ...\nIF v_i.pasos_completados < v_total_pasos THEN\n  RAISE EXCEPTION 'faltan pasos'; -- HTTP 409\nv_estrellas := fn_calcular_estrellas(\n   v_max_ayuda, v_i.aciertos, v_total_preg);\nv_xp := round(v_xp_base * v_estrellas / 3.0)\n        + 10 * v_i.aciertos - v_i.xp_pistas;\nIF v_rep THEN v_xp := round(v_xp * 0.25);\nUPDATE usuario SET xp = xp + v_xp ...;\nv_racha := fn_actualizar_racha(...);\nRETURN QUERY SELECT ..., fn_otorgar_insignias(...);", { x: 0.8, y: 1.62, w: 5.8, h: 4.75, fontFace: M, fontSize: 11.5, color: K.claro });
  tabla(s, ['Objeto', 'Para qué'], [
    ['tg_respuesta_validar', 'la BD decide si la respuesta es correcta; ignora al cliente'],
    ['tg_pista_usada_contar', 'suma pistas y XP gastada en el intento'],
    ['fn_auditar()', 'auditoría JSONB antes/después, sin password_hash'],
    ['índice parcial', 'ux_opcion_una_correcta … WHERE es_correcta'],
    ['índice GIN', 'glosario de Quimi: tsvector generado, sin tildes'],
    ['índice BRIN', 'evento.creado_en, sesion.iniciada_en (append-only)'],
    ['mv_uso_diario', 'vista materializada, REFRESH … CONCURRENTLY'],
    ['v_ranking_aula', 'RANK() OVER (PARTITION BY aula_id …)']],
  { x: 6.95, y: 1.5, w: 5.25, colW: [2.0, 3.25] }, 11.5);
}

/* 9 · Seguridad */
{
  const s = base(9, 'Se', 'seguridad', K.litio, 'Seguridad y datos de menores', 'Los usuarios tienen entre 12 y 17 años: la seguridad no es opcional', '¿Por qué JWT en localStorage y no cookie httpOnly? ¿Cómo se revoca un token robado?');
  const c = [['Identidad', ['bcrypt costo 10 (AuthService)', 'JWT firmado, 7 días; secreto ≥ 32 caracteres', "Roles: requiereRol('docente','admin')", 'Docente solo con código de invitación', 'Login con mensaje genérico']],
    ['API', ['SQL 100 % parametrizado ($1, $2…)', 'Validación zod → Ajv; removeAdditional', 'Rate limit 300/min; 10/min en login', 'helmet + CORS con lista de orígenes', 'Logs con authorization y password redactados']],
    ['Datos', ['Ley 29733 y DS 016-2024-JUS', 'Telemetría anónima con UUID', 'Respaldos cifrados AES-256', 'Auditoría sin hashes · TLS hacia Neon', 'CodeQL semanal + Dependabot']]];
  c.forEach((k, i) => {
    const x = 0.6 + i * 3.9; card(s, x, 1.65, 3.7, 3.25);
    txt(s, k[0], { x: x + 0.2, y: 1.75, w: 3.3, h: 0.35, fontFace: H, bold: true, fontSize: 14 });
    bullets(s, k[1], { x: x + 0.2, y: 2.15, w: 3.35, h: 2.7, fontSize: 12.5 });
  });
  card(s, 0.6, 5.1, 11.6, 1.0, K.tCalcio);
  txt(s, [{ text: 'Lo que todavía falta: ', options: { bold: true } }, { text: 'el JWT vive en localStorage (riesgo ante XSS), no hay refresh token ni revocación, y el consentimiento de padres para menores de 14 años (D. S. 016-2024-JUS) es trabajo futuro.' }], { x: 0.8, y: 5.15, w: 11.2, h: 0.9, fontSize: 13, valign: 'middle' });
}

/* 10 · Automatizaciones */
{
  const s = base(10, 'Au', 'CI/CD', K.oro, 'Automatizaciones · rúbrica → workflow → reporte', 'Cada fila de la rúbrica: un workflow y un reporte', '¿Cómo sé que un respaldo sirve? ¿Qué pasa si el despliegue falla a la mitad?');
  tabla(s, ['Fila de la rúbrica', 'Workflow', 'Reporte que produce'], [
    ['Terraform + pruebas + costos', 'infra.yml', 'fmt/validate/tflint/checkov · pruebas superadas (JUnit) · costos USD 0 vs. AWS/Azure'],
    ['Base de datos (Liquibase)', 'db.yml', 'validate · status · update-sql · update · update-testing-rollback · history'],
    ['Copias de seguridad', 'backup.yml', 'diario 03:17 Lima · pg_dump → restaura y compara filas · SHA-256 · GFS 7/4/3'],
    ['Release y despliegue', 'release.yml', 'release-please + CHANGELOG · zips + .vsix · Liquibase → Render → smoke test'],
    ['Docs en README', 'docs.yml', 'tbls (ER + diccionario) · diagramas Mermaid · secciones del README'],
    ['Docs técnicas (Pages)', 'pages.yml', 'TypeDoc · BD · diagramas · /reportes/ · demo offline /app/'],
    ['Calidad continua', 'ci.yml · codeql.yml', 'lint · typecheck · actionlint · pruebas · alertas de seguridad']],
  { x: 0.6, y: 1.6, w: 11.6, colW: [2.9, 2.0, 6.7] }, 15);
  txt(s, 'Todos escriben en el Job summary y suben un artefacto. Sin secrets, los pasos de nube se omiten («omitido: falta secret X») y el workflow queda en verde.', { x: 0.6, y: 6.0, w: 11.6, h: 0.6, fontSize: 13 });
}

/* 11 · Costos */
{
  const s = base(11, 'In', 'infra y costos', K.cobre, 'Infraestructura como código y costos', 'Producción a USD 0 hoy, migrable a AWS o Azure mañana', '¿Cuál es el costo oculto del plan gratuito? (pista: el primer estudiante espera ~1 min)');
  [['Producción actual', 'USD 0/mes', 'Neon Free + Render Free + GitHub Pages + HCP Terraform Free', K.tCobre, K.cobre], ['Referencia AWS', '≈ 38 USD/mes', 'RDS t4g.micro + ECS Fargate + ALB + S3/CloudFront', K.blanco, K.tinta], ['Referencia Azure', '≈ 38 USD/mes', 'Flexible Server B1ms + App Service B1 + Static Web Apps', K.blanco, K.tinta]].forEach((c, i) => {
    const x = 0.6 + i * 3.9; card(s, x, 1.65, 3.7, 1.95, c[3]);
    txt(s, c[0], { x: x + 0.2, y: 1.75, w: 3.3, h: 0.3, fontFace: M, fontSize: 11, color: K.suave });
    txt(s, c[1], { x: x + 0.2, y: 2.05, w: 3.3, h: 0.65, fontFace: H, bold: true, fontSize: 28, color: c[4] });
    txt(s, c[2], { x: x + 0.2, y: 2.8, w: 3.3, h: 0.7, fontSize: 12.5 });
  });
  txt(s, 'Terraform modular', { x: 0.6, y: 3.85, w: 6, h: 0.32, fontFace: H, bold: true, fontSize: 14 });
  bullets(s, ['modules/database-neon y modules/app-render, compuestos en envs/prod', 'Contrato de salidas estable: connection_uri, jdbc_url, api_url, web_url', 'Estado remoto cifrado y con bloqueo en HCP (alternativa: backend pg)', 'cost-reference/aws|azure: solo para Infracost, nunca se aplica'], { x: 0.6, y: 4.22, w: 6.4, h: 2.3, fontSize: 12.5 });
  card(s, 7.4, 3.85, 4.8, 2.35, K.tSodio);
  txt(s, 'FD01 · factibilidad económica', { x: 7.6, y: 3.95, w: 4.4, h: 0.32, fontFace: H, bold: true, fontSize: 13 });
  txt(s, 'Desarrollo: S/ 4 253,98 (antes S/ 35 155,16 por errores de la v0.1). Escenario base: VAN 10 % S/ 4 514,41, B/C 1,727, TIR 64,14 %. El escenario pesimista no es viable: lo dejé visible.', { x: 7.6, y: 4.35, w: 4.4, h: 1.75, fontSize: 12.5 });
}

/* 12 · Integraciones */
{
  const s = base(12, 'I', 'integraciones', K.potasio, 'Reto de integraciones', 'El laboratorio fuera del navegador: editor, agentes de IA y GitHub', '¿Qué es MCP y en qué se diferencia de llamar a la API con curl?');
  [['VS Code', 'Árboles de misiones y catálogo, «Preguntar a Quimi», ficha con PubChem, perfil de energía en SVG. JWT en SecretStorage; CSP estricta.', 'extensions/vscode · .vsix · 19 pruebas', K.tCobre],
    ['Servidor MCP', '5 herramientas (buscar_especie, explicar_reaccion, listar_niveles, preguntar_quimi, resumen_dashboard) + recurso arc://catalogo.', 'integrations/mcp · stdio · 12 pruebas', K.tPotasio],
    ['Claude Code', 'Skill atomreactchamber (curl + Node) y subagente tutor-quimi: explica en 3 capas y no revela respuestas.', '.claude/skills · .claude/agents', K.tCalcio],
    ['GitHub', 'CI de todos los workspaces, Release con el .vsix adjunto y Pages con la documentación y la demo.', '.github/workflows', K.tSodio]].forEach((c, i) => {
    const x = 0.6 + i * 2.95; card(s, x, 1.65, 2.8, 3.0, c[3]);
    txt(s, c[0], { x: x + 0.15, y: 1.75, w: 2.5, h: 0.35, fontFace: H, bold: true, fontSize: 14 });
    txt(s, c[1], { x: x + 0.15, y: 2.15, w: 2.5, h: 1.9, fontSize: 12 });
    txt(s, c[2], { x: x + 0.15, y: 4.15, w: 2.5, h: 0.4, fontSize: 9.5, color: K.suave });
  });
  card(s, 0.6, 4.9, 11.6, 1.55);
  txt(s, "Clientes delgados: ninguno duplica datos ni reglas. Todos envían eventos con su origen, restringido en la BD con CHECK (origen IN ('web','vscode','claude','mcp')). Así el dashboard mide qué canal se usa de verdad.", { x: 0.8, y: 5.0, w: 6.3, h: 1.35, fontSize: 12.5, valign: 'middle' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.4, y: 5.1, w: 4.6, h: 1.15, rectRadius: 0.08, fill: { color: K.pizarra }, line: { color: K.pizarra } });
  txt(s, 'SELECT origen, count(*) AS sesiones\n  FROM sesion GROUP BY origen\n ORDER BY 2 DESC;', { x: 7.55, y: 5.18, w: 4.35, h: 1.0, fontFace: M, fontSize: 11.5, color: K.claro, valign: 'middle' });
}

/* 13 · Dashboard */
{
  const s = base(13, 'Dy', 'dashboard', K.cobre, 'Dashboard de uso', 'El docente ve dónde se traban sus estudiantes', '¿Por qué una vista materializada para el uso diario y vistas normales para lo demás?');
  s.addImage({ path: path.join(DIR, 'img/dashboard-recorte.png'), x: 0.6, y: 1.5, w: 5.0, h: 5.08, altText: 'Dashboard de uso', sizing: { type: 'crop', w: 5.0, h: 5.08 } });
  tabla(s, ['Bloque', 'Fuente en la BD'], [['KPIs', 'consulta en DashboardRepository'], ['Uso diario (30 días)', 'mv_uso_diario'], ['Embudo por nivel', 'v_estadisticas_nivel'], ['Pasos más lentos', 'v_tiempo_por_paso'], ['Preguntas con más errores', 'v_preguntas_dificiles'], ['Origen y dispositivo', 'sesion'], ['Ranking del aula', 'v_ranking_aula (RANK)']],
    { x: 6.0, y: 1.55, w: 6.2, colW: [2.7, 3.5] }, 13);
  txt(s, 'En los datos de demostración, «Formación de la sal» cae a 57 % de completado y «El CO₂ es un gas que…» tiene 67 % de error: información accionable.\n\nDatos semilla ficticios (aula QUIM3A, 13 estudiantes).', { x: 6.0, y: 4.65, w: 6.2, h: 1.8, fontSize: 13 });
}

/* 14 · Calidad */
{
  const s = base(14, 'Qa', 'calidad', K.litio, 'Calidad', '63 pruebas automáticas, y una que juega los 9 niveles', '¿Por qué pruebas de integración con BD real y no mocks? ¿Qué no cubren?');
  [['17', 'API · integración', 'Contra PostgreSQL real: orden de pasos, ayudas, 25 %, aulas, telemetría.', K.potasio], ['15', 'Motor', 'ΔH, Clausius-Clapeyron, fases, fotón, DSL… y 9 pruebas que resuelven cada nivel.', K.cobre], ['19', 'Extensión', 'Formato, SVG del perfil de energía, CSP y escape de las vistas.', K.calcioO], ['12', 'MCP', 'Herramientas y servidor MCP en memoria con fetch simulado.', K.litio]].forEach((c, i) => {
    const x = 0.6 + i * 2.95; card(s, x, 1.65, 2.8, 2.6);
    txt(s, c[0], { x: x + 0.15, y: 1.75, w: 2.5, h: 0.65, fontFace: H, bold: true, fontSize: 32, color: c[3] });
    txt(s, c[1], { x: x + 0.15, y: 2.45, w: 2.5, h: 0.35, fontFace: H, bold: true, fontSize: 13 });
    txt(s, c[2], { x: x + 0.15, y: 2.85, w: 2.5, h: 1.3, fontSize: 12 });
  });
  txt(s, 'El «solucionador» de niveles', { x: 0.6, y: 4.5, w: 5.6, h: 0.32, fontFace: H, bold: true, fontSize: 14 });
  txt(s, 'Para cada nivel aplica su solución, simula hasta 90 s por paso con un PRNG determinista (mulberry32) y exige que el SeguidorDePaso se cumpla. Si un dato del catálogo vuelve imposible un nivel, la CI falla.', { x: 0.6, y: 4.88, w: 5.7, h: 1.6, fontSize: 13 });
  txt(s, 'Además', { x: 6.6, y: 4.5, w: 5.6, h: 0.32, fontFace: H, bold: true, fontSize: 14 });
  bullets(s, ['Playwright e2e sobre el build en modo demo', 'JUnit → «Reporte de pruebas superadas» en infra.yml', 'Rollback de Liquibase probado en cada cambio de db/**'], { x: 6.6, y: 4.88, w: 5.6, h: 1.6, fontSize: 13 });
}

/* 15 · Evidencias */
{
  const s = base(15, 'Ev', 'evidencias', K.calcio, 'Dónde está cada cosa', 'Mapa de evidencias para la evaluación', '¿Qué genera el README automáticamente y qué escribí a mano?');
  tabla(s, ['Rúbrica', 'Evidencia'], [['Problemática y objetivos', 'diap. 2–3 · docs/investigacion'], ['FD01–FD04', 'docs/fd (FD01/02 en .md, .docx y .pdf)'], ['Código y BD en GitHub', 'repo · db/changelog (48 changesets)'], ['Contribuciones', 'commits Conventional → CHANGELOG'], ['Terraform + tests + costos', 'diap. 10–11 · infra.yml'], ['Liquibase + reporte', 'db.yml · Pages /reportes/liquibase'], ['Backups + reporte', 'backup.yml · Pages /reportes/backup']],
    { x: 0.6, y: 1.55, w: 5.65, colW: [2.4, 3.25] }, 14);
  tabla(s, ['Rúbrica', 'Evidencia'], [['Release + despliegue', 'release.yml · página Releases'], ['README: diccionario, ER, clases, componentes, despliegue', 'docs.yml (tbls + Mermaid) · docs/database'], ['GitHub Pages', '/api · /db · /diagramas · /reportes · /app'], ['Dashboard de uso', 'diap. 13 · demo como docente'], ['Integraciones', 'diap. 12 · docs/integraciones.md'], ['Presentación', 'docs/presentacion (HTML, PDF, PPTX)'], ['Preguntas', 'ahora mismo · banco-de-preguntas.md']],
    { x: 6.55, y: 1.55, w: 5.65, colW: [2.6, 3.05] }, 14);
}

/* 16 · Limitaciones */
{
  const s = base(16, 'Li', 'limitaciones', K.litio, 'Limitaciones honestas y trabajo futuro', 'Lo que el sistema NO hace (todavía)', 'Si yo fuera su docente de química, ¿por qué debería confiar en lo que muestra el simulador?');
  txt(s, 'Límites conocidos', { x: 0.6, y: 1.5, w: 5.6, h: 0.32, fontFace: H, bold: true, fontSize: 14 });
  bullets(s, ['Eₐ pedagógicas: ΔHf° son datos NIST, pero las Eₐ están escaladas para verse en segundos.', '2D y pocas partículas: discos rígidos + termostato de Berendsen.', 'La verificación física corre en el cliente; la BD exige orden y pertenencia de pasos.', 'Arranque en frío: la API gratuita tarda ~1 min tras 15 min sin uso.', 'Esta versión trae 9 niveles; ≥ 12 (OS-1) es meta futura. El piloto aún no se hizo.', 'Sin índice único parcial de intentos en curso; sin Lighthouse CI todavía.'], { x: 0.6, y: 1.88, w: 5.8, h: 4.6, fontSize: 12.5 });
  txt(s, 'Trabajo futuro', { x: 6.7, y: 1.5, w: 5.5, h: 0.32, fontFace: H, bold: true, fontSize: 14 });
  bullets(s, ['Quimi con LLM en la 3.ª unidad, detrás de QuimiService.', 'Laboratorio 3D, números cuánticos, editor de prácticas.', 'Piloto en un colegio de Tacna: Hake ⟨g⟩, SUS y OS-2.', 'Ampliar a ≥ 12 niveles en ≥ 4 temas.', 'Cookie httpOnly + refresh token y revocación.', 'Reportes PDF para el docente; monitoreo de disponibilidad.'], { x: 6.7, y: 1.88, w: 5.5, h: 2.75, fontSize: 12.5 });
  card(s, 6.7, 4.75, 5.5, 1.35, K.tCalcio);
  txt(s, [{ text: 'Nota visible: ', options: { bold: true } }, { text: 'el flujo de consentimiento de padres o tutores para menores de 14 años (Ley 29733 y D. S. 016-2024-JUS) es trabajo futuro y requisito antes de cualquier piloto con menores reales.' }], { x: 6.85, y: 4.82, w: 5.2, h: 1.2, fontSize: 12.5, valign: 'middle' });
  txt(s, 'Complementa al laboratorio físico; no lo reemplaza (Li y Liang, 2024).', { x: 6.7, y: 6.2, w: 5.5, h: 0.3, fontSize: 10, color: K.suave });
}

/* 17 · Preguntas */
{
  const s = pres.addSlide();
  s.background = { color: K.pizarra };
  txt(s, 'Ahora les toca a ustedes', { x: 0.7, y: 0.6, w: 6, h: 0.3, fontFace: M, fontSize: 11, color: '9DB0C7' });
  txt(s, 'Preguntas', { x: 0.7, y: 0.95, w: 8, h: 1.0, fontFace: H, bold: true, fontSize: 50, color: K.claro });
  txt(s, 'Elijan una casilla y pregúntenme por ella. Las más difíciles valen tres estrellas.', { x: 0.7, y: 2.0, w: 9, h: 0.45, fontSize: 17, color: K.claro });
  [['Base de datos', '¿Reglas en PL/pgSQL o en la API? ¿Qué harían ustedes?', '7FD6CB'], ['Concurrencia', 'Dos «Finalizar» simultáneos: ¿FOR UPDATE basta?', 'FFB27A'], ['Seguridad', '¿Cómo harían trampa en el juego? Atáquenlo.', 'F28DB2'],
    ['Arquitectura', '¿Qué rompería primero con 10 000 estudiantes?', 'B9A6FF'], ['DevOps', '¿Qué pasa si Liquibase falla a mitad del despliegue?', 'FFD45C'], ['Pedagogía', '¿Las estrellas motivan o distraen? ¿Ustedes jugarían?', '7FD6CB']].forEach((c, i) => {
    const x = 0.7 + (i % 3) * 3.95; const y = 2.85 + Math.floor(i / 3) * 1.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.75, h: 1.35, rectRadius: 0.08, fill: { color: K.sup }, line: { color: K.claro, width: 1.5 } });
    txt(s, c[0], { x: x + 0.2, y: y + 0.12, w: 3.4, h: 0.3, bold: true, fontSize: 13, color: c[2] });
    txt(s, c[1], { x: x + 0.2, y: y + 0.45, w: 3.4, h: 0.8, fontSize: 15, color: K.claro });
  });
  txt(s, 'Repositorio: github.com/Laos19/Demov0.1AtomReactChamber · Adriana Rafaela Laos González · 2023077474', { x: 0.7, y: 6.75, w: 11, h: 0.3, fontSize: 12, color: '9DB0C7' });
  s.addNotes(notas[16]);
}

pres.writeFile({ fileName: path.join(DIR, 'AtomReactChamber-presentacion.pptx') }).then((f) => console.log('ok', f));
