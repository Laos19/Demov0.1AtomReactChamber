#!/usr/bin/env node
/**
 * Generador de semillas de AtomReactChamber.
 *
 * Única fuente de verdad: db/data/catalogo.json y db/data/juego.json.
 * Produce:
 *   - db/changelog/sql/900-semilla-catalogo.sql  (Liquibase, runOnChange, upserts idempotentes)
 *   - db/changelog/sql/901-semilla-juego.sql     (Liquibase, runOnChange, upserts idempotentes)
 *   - db/changelog/sql/902-datos-demo.sql        (usuarios, aula e historial de uso de demostración)
 *   - frontend/src/data/contenido.generated.json (modo offline del frontend)
 *
 * Uso: npm run seed:generate
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const catalogo = read('db/data/catalogo.json');
const juego = read('db/data/juego.json');

/** Literal SQL seguro (comillas simples escapadas). */
const q = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;
const arr = (a) => `ARRAY[${a.map(q).join(', ')}]::text[]`;
const header = '--liquibase formatted sql\n-- ARCHIVO GENERADO por db/scripts/generate-seed.mjs — no editar a mano.\n';

/* ------------------------------ catálogo ------------------------------ */
let cat = header;
cat += '\n--changeset adriana.laos:900-1 runOnChange:true comment:Semilla de roles\n';
cat += `INSERT INTO rol (codigo, nombre) VALUES ('estudiante', 'Estudiante'), ('docente', 'Docente'), ('admin', 'Administrador')\nON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;\n`;
cat += '--rollback DELETE FROM rol;\n';

cat += '\n--changeset adriana.laos:900-2 runOnChange:true comment:Semilla de elementos\n';
cat += 'INSERT INTO elemento (simbolo, nombre, numero_atomico, color_hex, brillo_hex, radio_px) VALUES\n';
cat += catalogo.elementos.map((e) => `  (${[e.simbolo, e.nombre, e.numero_atomico, e.color, e.brillo, e.radio_px].map(q).join(', ')})`).join(',\n');
cat += '\nON CONFLICT (simbolo) DO UPDATE SET nombre = EXCLUDED.nombre, numero_atomico = EXCLUDED.numero_atomico, color_hex = EXCLUDED.color_hex, brillo_hex = EXCLUDED.brillo_hex, radio_px = EXCLUDED.radio_px;\n';
cat += '--rollback DELETE FROM elemento;\n';

cat += '\n--changeset adriana.laos:900-3 runOnChange:true comment:Semilla de especies y su geometría\n';
cat += 'INSERT INTO especie (codigo, formula, nombre, masa_molar, dhf_kj_mol, punto_fusion_k, punto_ebull_k, dhvap_kj_mol, p_triple_atm, t_triple_k, dhvap_triple, pubchem_cid, es_radical, inyectable, orden) VALUES\n';
cat += catalogo.especies.map((s, i) => `  (${[s.codigo, s.formula, s.nombre, s.masa_molar, s.dhf, s.pf, s.pe, s.dhvap,
  s.sublimacion?.p_triple_atm, s.sublimacion?.t_triple_k, s.sublimacion?.dhvap_triple, s.cid, !!s.radical, !!s.inyectable, i + 1].map(q).join(', ')})`).join(',\n');
cat += `\nON CONFLICT (codigo) DO UPDATE SET formula = EXCLUDED.formula, nombre = EXCLUDED.nombre, masa_molar = EXCLUDED.masa_molar,
  dhf_kj_mol = EXCLUDED.dhf_kj_mol, punto_fusion_k = EXCLUDED.punto_fusion_k, punto_ebull_k = EXCLUDED.punto_ebull_k,
  dhvap_kj_mol = EXCLUDED.dhvap_kj_mol, p_triple_atm = EXCLUDED.p_triple_atm, t_triple_k = EXCLUDED.t_triple_k,
  dhvap_triple = EXCLUDED.dhvap_triple, pubchem_cid = EXCLUDED.pubchem_cid, es_radical = EXCLUDED.es_radical,
  inyectable = EXCLUDED.inyectable, orden = EXCLUDED.orden;\n`;
cat += 'DELETE FROM especie_atomo;\nINSERT INTO especie_atomo (especie_codigo, posicion, simbolo, x, y) VALUES\n';
cat += catalogo.especies.flatMap((s) => s.atomos.map(([a, x, y], i) => `  (${[s.codigo, i + 1, a, x, y].map(q).join(', ')})`)).join(',\n') + ';\n';
cat += '--rollback DELETE FROM especie_atomo; DELETE FROM especie;\n';

cat += '\n--changeset adriana.laos:900-4 runOnChange:true comment:Semilla de reacciones, participantes y fotólisis\n';
cat += 'INSERT INTO reaccion (codigo, etiqueta, ea_kj_mol, factor_esterico, enlace) VALUES\n';
cat += catalogo.reacciones.map((r) => `  (${[r.codigo, r.etiqueta, r.ea, r.esterico, r.enlace].map(q).join(', ')})`).join(',\n');
cat += '\nON CONFLICT (codigo) DO UPDATE SET etiqueta = EXCLUDED.etiqueta, ea_kj_mol = EXCLUDED.ea_kj_mol, factor_esterico = EXCLUDED.factor_esterico, enlace = EXCLUDED.enlace;\n';
cat += 'DELETE FROM reaccion_participante;\nINSERT INTO reaccion_participante (reaccion_codigo, papel, posicion, especie_codigo) VALUES\n';
cat += catalogo.reacciones.flatMap((r) => [
  ...r.reactivos.map((s, i) => `  (${[r.codigo, 'reactivo', i + 1, s].map(q).join(', ')})`),
  ...r.productos.map((s, i) => `  (${[r.codigo, 'producto', i + 1, s].map(q).join(', ')})`),
]).join(',\n') + ';\n';
cat += 'INSERT INTO fotolisis (especie_codigo, enlace_kj_mol, seccion_eficaz, etiqueta, producto_1, producto_2) VALUES\n';
cat += catalogo.fotolisis.map((f) => `  (${[f.especie, f.enlace_kj, f.seccion_eficaz, f.etiqueta, f.productos[0], f.productos[1]].map(q).join(', ')})`).join(',\n');
cat += '\nON CONFLICT (especie_codigo) DO UPDATE SET enlace_kj_mol = EXCLUDED.enlace_kj_mol, seccion_eficaz = EXCLUDED.seccion_eficaz, etiqueta = EXCLUDED.etiqueta, producto_1 = EXCLUDED.producto_1, producto_2 = EXCLUDED.producto_2;\n';
cat += '--rollback DELETE FROM fotolisis; DELETE FROM reaccion_participante; DELETE FROM reaccion;\n';

cat += '\n--changeset adriana.laos:900-5 runOnChange:true comment:Semilla de presets del laboratorio libre\n';
cat += 'INSERT INTO preset (codigo, nombre, ecuacion, sobre_flecha, etiqueta, pista, parametros, pasos, orden) VALUES\n';
cat += catalogo.presets.map((p, i) => `  (${[p.codigo, p.nombre, p.ecuacion, p.sobre_flecha, p.etiqueta, p.pista].map(q).join(', ')}, ${j(p.parametros)}, ${j(p.pasos)}, ${i + 1})`).join(',\n');
cat += `\nON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, ecuacion = EXCLUDED.ecuacion, sobre_flecha = EXCLUDED.sobre_flecha,
  etiqueta = EXCLUDED.etiqueta, pista = EXCLUDED.pista, parametros = EXCLUDED.parametros, pasos = EXCLUDED.pasos, orden = EXCLUDED.orden;\n`;
cat += 'DELETE FROM preset_carga;\nINSERT INTO preset_carga (preset_codigo, especie_codigo, cantidad) VALUES\n';
cat += catalogo.presets.flatMap((p) => Object.entries(p.carga).map(([s, n]) => `  (${[p.codigo, s, n].map(q).join(', ')})`)).join(',\n') + ';\n';
cat += '--rollback DELETE FROM preset_carga; DELETE FROM preset;\n';

/* -------------------------------- juego ------------------------------- */
let jg = header;
jg += '\n--changeset adriana.laos:901-1 runOnChange:true comment:Semilla de misiones\n';
jg += 'INSERT INTO mision (codigo, titulo, descripcion, competencia, color, orden) VALUES\n';
jg += juego.misiones.map((m) => `  (${[m.codigo, m.titulo, m.descripcion, m.competencia, m.color, m.orden].map(q).join(', ')})`).join(',\n');
jg += '\nON CONFLICT (codigo) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, competencia = EXCLUDED.competencia, color = EXCLUDED.color, orden = EXCLUDED.orden;\n';
jg += '--rollback DELETE FROM mision;\n';

jg += '\n--changeset adriana.laos:901-2 runOnChange:true comment:Semilla de niveles, pasos, pistas y cuestionarios\n';
for (const n of juego.niveles) {
  const c = n.casilla;
  jg += `INSERT INTO nivel (codigo, mision_id, orden, titulo, resumen, objetivo, grado, xp_base, minutos_estim, casilla_simbolo, casilla_fila, casilla_columna, casilla_nota, inicio, controles, especies)
VALUES (${q(n.codigo)}, (SELECT id FROM mision WHERE codigo = ${q(n.mision)}), ${n.orden}, ${q(n.titulo)}, ${q(n.resumen)}, ${q(n.objetivo)}, ${n.grado}, ${n.xp}, ${n.minutos},
  ${q(c.simbolo)}, ${c.fila}, ${c.columna}, ${q(n.casilla_nota)}, ${j(n.inicio)}, ${arr(n.controles)}, ${arr(n.especies)})
ON CONFLICT (codigo) DO UPDATE SET mision_id = EXCLUDED.mision_id, orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, resumen = EXCLUDED.resumen,
  objetivo = EXCLUDED.objetivo, grado = EXCLUDED.grado, xp_base = EXCLUDED.xp_base, minutos_estim = EXCLUDED.minutos_estim,
  casilla_simbolo = EXCLUDED.casilla_simbolo, casilla_fila = EXCLUDED.casilla_fila, casilla_columna = EXCLUDED.casilla_columna,
  casilla_nota = EXCLUDED.casilla_nota, inicio = EXCLUDED.inicio, controles = EXCLUDED.controles, especies = EXCLUDED.especies;\n`;
  n.pasos.forEach((p, i) => {
    jg += `INSERT INTO paso (nivel_id, orden, titulo, instruccion, concepto, condicion)
VALUES ((SELECT id FROM nivel WHERE codigo = ${q(n.codigo)}), ${i + 1}, ${q(p.titulo)}, ${q(p.instruccion)}, ${q(p.concepto)}, ${j(p.condicion)})
ON CONFLICT (nivel_id, orden) DO UPDATE SET titulo = EXCLUDED.titulo, instruccion = EXCLUDED.instruccion, concepto = EXCLUDED.concepto, condicion = EXCLUDED.condicion;\n`;
    p.pistas.forEach((t, k) => {
      jg += `INSERT INTO pista (paso_id, nivel_ayuda, texto, costo_xp)
VALUES ((SELECT pa.id FROM paso pa JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = ${q(n.codigo)} AND pa.orden = ${i + 1}), ${k + 1}, ${q(t)}, ${juego.costos_pista[k + 1]})
ON CONFLICT (paso_id, nivel_ayuda) DO UPDATE SET texto = EXCLUDED.texto, costo_xp = EXCLUDED.costo_xp;\n`;
    });
  });
  n.cuestionario.forEach((pr, i) => {
    jg += `INSERT INTO pregunta (nivel_id, orden, enunciado, explicacion)
VALUES ((SELECT id FROM nivel WHERE codigo = ${q(n.codigo)}), ${i + 1}, ${q(pr.enunciado)}, ${q(pr.explicacion)})
ON CONFLICT (nivel_id, orden) DO UPDATE SET enunciado = EXCLUDED.enunciado, explicacion = EXCLUDED.explicacion;\n`;
    const pid = `(SELECT pr.id FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id WHERE nv.codigo = ${q(n.codigo)} AND pr.orden = ${i + 1})`;
    jg += `UPDATE opcion SET es_correcta = false WHERE pregunta_id = ${pid};\n`;
    pr.opciones.forEach(([texto, ok], k) => {
      jg += `INSERT INTO opcion (pregunta_id, orden, texto, es_correcta) VALUES (${pid}, ${k + 1}, ${q(texto)}, ${q(ok)})
ON CONFLICT (pregunta_id, orden) DO UPDATE SET texto = EXCLUDED.texto, es_correcta = EXCLUDED.es_correcta;\n`;
    });
  });
}
jg += 'UPDATE nivel n SET nivel_previo_id = (SELECT p.id FROM nivel p WHERE p.orden = n.orden - 1);\n';
jg += '--rollback DELETE FROM opcion; DELETE FROM pregunta; DELETE FROM pista; DELETE FROM paso; UPDATE nivel SET nivel_previo_id = NULL; DELETE FROM nivel;\n';

jg += '\n--changeset adriana.laos:901-3 runOnChange:true comment:Semilla de insignias y glosario de Quimi\n';
jg += 'INSERT INTO insignia (codigo, nombre, descripcion, icono, tipo, umbral) VALUES\n';
jg += juego.insignias.map((b) => `  (${[b.codigo, b.nombre, b.descripcion, b.icono, b.tipo, b.umbral].map(q).join(', ')})`).join(',\n');
jg += '\nON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, icono = EXCLUDED.icono, tipo = EXCLUDED.tipo, umbral = EXCLUDED.umbral;\n';
jg += 'INSERT INTO glosario (termino, definicion) VALUES\n';
jg += juego.glosario.map(([t, d]) => `  (${q(t)}, ${q(d)})`).join(',\n');
jg += '\nON CONFLICT (termino) DO UPDATE SET definicion = EXCLUDED.definicion;\n';
jg += '--rollback DELETE FROM glosario; DELETE FROM insignia;\n';

/* ---------------------------- datos de demo ---------------------------- */
// PRNG determinista (mulberry32) para que el archivo generado sea estable entre ejecuciones.
let seed = 20261107;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const DEMO_PASSWORD = 'quimica2026';
// Sal fija ⇒ hash determinista (solo para cuentas de demostración públicas).
const hash = bcrypt.hashSync(DEMO_PASSWORD, '$2b$10$AtomReactChamberDemo.u');
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const estudiantes = ['Valeria Quispe', 'Mateo Mamani', 'Camila Flores', 'Thiago Condori', 'Luciana Huamán', 'Santiago Ramos',
  'Ariana Chura', 'Joaquín Ticona', 'Fernanda Apaza', 'Diego Vargas', 'Isabella Cutipa', 'Gael Pari'];
let demo = header;
demo += `\n--changeset adriana.laos:902-1 runOnChange:true context:demo comment:Cuentas, aula e historial de demostración (contraseña: ${DEMO_PASSWORD})\n`;
demo += `DELETE FROM sesion WHERE id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM aula WHERE docente_id IN (SELECT id FROM usuario WHERE email LIKE '%@demo.arc.pe');
DELETE FROM usuario WHERE email LIKE '%@demo.arc.pe';
INSERT INTO usuario (email, nombre, password_hash, rol_id, grado) VALUES
  ('admin@demo.arc.pe', 'Administración ARC', ${q(hash)}, (SELECT id FROM rol WHERE codigo = 'admin'), NULL),
  ('docente@demo.arc.pe', 'Prof. Rosa Mendoza', ${q(hash)}, (SELECT id FROM rol WHERE codigo = 'docente'), NULL),
  ('estudiante@demo.arc.pe', 'Estudiante Demo', ${q(hash)}, (SELECT id FROM rol WHERE codigo = 'estudiante'), 3),
${estudiantes.map((n, i) => `  (${q(`e${String(i + 1).padStart(2, '0')}@demo.arc.pe`)}, ${q(n)}, ${q(hash)}, (SELECT id FROM rol WHERE codigo = 'estudiante'), 3)`).join(',\n')};
INSERT INTO aula (codigo, nombre, grado, seccion, docente_id)
VALUES ('QUIM3A', 'Ciencia y Tecnología 3.º A', 3, 'A', (SELECT id FROM usuario WHERE email = 'docente@demo.arc.pe'));
INSERT INTO matricula (aula_id, estudiante_id)
SELECT (SELECT id FROM aula WHERE codigo = 'QUIM3A'), id FROM usuario WHERE email ~ '^(e[0-9]{2}|estudiante)@demo\\.arc\\.pe$';
INSERT INTO aula_nivel (aula_id, nivel_id, fecha_limite)
SELECT (SELECT id FROM aula WHERE codigo = 'QUIM3A'), id, (current_date + (orden * 3))::date FROM nivel WHERE orden <= 6;
`;
// Historial: cada estudiante avanza un número distinto de niveles en los últimos 21 días.
let sesionN = 1;
const lines = [];
estudiantes.forEach((_, si) => {
  const email = `e${String(si + 1).padStart(2, '0')}@demo.arc.pe`;
  const u = `(SELECT id FROM usuario WHERE email = ${q(email)})`;
  const avance = Math.max(1, Math.min(juego.niveles.length, Math.round(2 + rnd() * 6)));
  let dia = 20 - Math.floor(rnd() * 4);
  for (let k = 0; k < avance; k++) {
    const n = juego.niveles[k];
    dia = Math.max(0, dia - Math.floor(rnd() * 3));
    const sid = uuid(sesionN++);
    const minutos = n.minutos * (0.6 + rnd() * 0.9);
    const ayuda = rnd() < 0.45 ? (rnd() < 0.6 ? 1 : rnd() < 0.7 ? 2 : 3) : 0;
    const aciertos = n.cuestionario.filter(() => rnd() < 0.78).length;
    let e = 3; if (ayuda >= 2) e--; if (ayuda >= 3) e--; if (aciertos * 3 < n.cuestionario.length * 2) e--; e = Math.max(1, e);
    const pistasCosto = [0, 5, 15, 35][ayuda];
    const xp = Math.max(0, Math.round((n.xp * e) / 3) + 10 * aciertos - pistasCosto);
    const ini = `now() - interval '${dia} days' - interval '${Math.floor(rnd() * 8) + 8} hours'`;
    const fin = `${ini} + interval '${minutos.toFixed(1)} minutes'`;
    lines.push(`INSERT INTO sesion (id, usuario_id, origen, dispositivo, iniciada_en, ultima_actividad) VALUES ('${sid}', ${u}, ${q(rnd() < 0.85 ? 'web' : pick(['vscode', 'claude']))}, ${q(pick(['escritorio', 'escritorio', 'escritorio', 'tablet', 'movil']))}, ${ini}, ${fin});`);
    lines.push(`WITH i AS (INSERT INTO intento (usuario_id, nivel_id, estado, iniciado_en, finalizado_en, pasos_completados, estrellas, xp_obtenido)
  VALUES (${u}, (SELECT id FROM nivel WHERE codigo = ${q(n.codigo)}), 'completado', ${ini}, ${fin}, ${n.pasos.length}, ${e}, ${xp}) RETURNING id)
INSERT INTO intento_paso (intento_id, paso_id, segundos, completado_en)
SELECT i.id, p.id, ${Math.round(15 + rnd() * 25)} + (p.orden * ${Math.round(20 + rnd() * 60)}),${ini} + (p.orden * interval '1 minute') FROM i, paso p WHERE p.nivel_id = (SELECT id FROM nivel WHERE codigo = ${q(n.codigo)});`);
    const intentoSel = `(SELECT max(id) FROM intento WHERE usuario_id = ${u} AND nivel_id = (SELECT id FROM nivel WHERE codigo = ${q(n.codigo)}))`;
    for (let a = 1; a <= ayuda; a++) {
      lines.push(`INSERT INTO pista_usada (intento_id, pista_id, usada_en) SELECT ${intentoSel}, pi.id, ${ini} + interval '2 minutes' FROM pista pi JOIN paso pa ON pa.id = pi.paso_id JOIN nivel nv ON nv.id = pa.nivel_id WHERE nv.codigo = ${q(n.codigo)} AND pa.orden = 2 AND pi.nivel_ayuda = ${a};`);
    }
    n.cuestionario.forEach((pr, pi) => {
      const correcta = pi < aciertos;
      const idx = correcta ? pr.opciones.findIndex(([, ok]) => ok) : pr.opciones.findIndex(([, ok]) => !ok);
      lines.push(`INSERT INTO respuesta (intento_id, pregunta_id, opcion_id, respondida_en) SELECT ${intentoSel}, pr.id, op.id, ${fin} FROM pregunta pr JOIN nivel nv ON nv.id = pr.nivel_id JOIN opcion op ON op.pregunta_id = pr.id WHERE nv.codigo = ${q(n.codigo)} AND pr.orden = ${pi + 1} AND op.orden = ${idx + 1};`);
    });
    lines.push(`INSERT INTO evento (sesion_id, usuario_id, tipo, nivel_id, datos, creado_en) SELECT '${sid}', ${u}, t.tipo, (SELECT id FROM nivel WHERE codigo = ${q(n.codigo)}), t.datos::jsonb, ${ini} + t.desfase FROM (VALUES
  ('pagina_vista', '{"ruta":"/mapa"}', interval '0 minutes'), ('nivel_iniciado', '{}', interval '1 minute'),
  ('paso_completado', '{"paso":1}', interval '2 minutes'), ('nivel_completado', '{"estrellas":${e}}', interval '${Math.round(minutos)} minutes')) AS t(tipo, datos, desfase);`);
  }
  // Algunos estudiantes abandonan el siguiente nivel a medias (la tasa de completado no es 100 %).
  const sig = juego.niveles[avance];
  if (sig && rnd() < 0.65) {
    const hechos = Math.floor(rnd() * sig.pasos.length);
    lines.push(`INSERT INTO intento (usuario_id, nivel_id, estado, iniciado_en, finalizado_en, pasos_completados)
  VALUES (${u}, (SELECT id FROM nivel WHERE codigo = ${q(sig.codigo)}), 'abandonado', now() - interval '${Math.max(0, dia - 1)} days', now() - interval '${Math.max(0, dia - 1)} days' + interval '6 minutes', ${hechos});`);
  }
});
demo += lines.join('\n') + '\n';
demo += `UPDATE usuario u SET xp = coalesce((SELECT sum(xp_obtenido) FROM intento i WHERE i.usuario_id = u.id), 0) WHERE email LIKE '%@demo.arc.pe';
UPDATE usuario u SET ultimo_dia_activo = (SELECT max(finalizado_en)::date FROM intento i WHERE i.usuario_id = u.id),
  racha_actual = 0, racha_maxima = 1 + (u.id % 4) WHERE email ~ '^e[0-9]{2}@demo\\.arc\\.pe$';
SELECT fn_otorgar_insignias(id) FROM usuario WHERE email LIKE '%@demo.arc.pe';
REFRESH MATERIALIZED VIEW mv_uso_diario;
`;
demo += "--rollback DELETE FROM sesion WHERE id::text LIKE '00000000-0000-4000-8000-%'; DELETE FROM aula WHERE docente_id IN (SELECT id FROM usuario WHERE email LIKE '%@demo.arc.pe'); DELETE FROM usuario WHERE email LIKE '%@demo.arc.pe';\n";

/* ---------------------------- salida ---------------------------- */
const out = (p, s) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), s); console.log(`✔ ${p}`); };
out('db/changelog/sql/900-semilla-catalogo.sql', cat);
out('db/changelog/sql/901-semilla-juego.sql', jg);
out('db/changelog/sql/902-datos-demo.sql', demo);
out('frontend/src/data/contenido.generated.json', JSON.stringify({ catalogo, juego }, null, 0) + '\n');
