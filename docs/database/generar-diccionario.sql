-- =============================================================================
-- generar-diccionario.sql — Generador del diccionario de datos de AtomReactChamber
-- -----------------------------------------------------------------------------
-- Lee el catálogo de PostgreSQL (pg_catalog + information_schema + COMMENT ON)
-- y produce el diccionario de datos en Markdown. Fuente única: la BD migrada con
-- Liquibase, de modo que el documento nunca se desactualiza respecto del esquema.
--
-- Uso (desde la raíz del repositorio):
--   psql "$DATABASE_URL" -X -q -A -t -f docs/database/generar-diccionario.sql \
--        > docs/database/diccionario-de-datos.md
--
-- Requisitos: PostgreSQL >= 13, esquema `public` migrado (db/changelog).
-- Las tablas internas de Liquibase (databasechangelog*) se excluyen.
-- Autora: Adriana Rafaela Laos González (2023077474) · UPT · Base de Datos II
-- =============================================================================

\set ON_ERROR_STOP on
\pset footer off
SET client_min_messages = warning;

-- Escapa texto para celdas de tablas Markdown (barras verticales y saltos de línea).
CREATE OR REPLACE FUNCTION pg_temp.md(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(replace(regexp_replace(t, '\s*\n\s*', ' ', 'g'), '|', '\|'), '')
$$;

-- Simplifica expresiones del catálogo: quita conversiones de tipo redundantes y un par de paréntesis externos.
CREATE OR REPLACE FUNCTION pg_temp.limpia(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(regexp_replace(regexp_replace(t,
           '::(character varying|text\[\]|text|"char"|regconfig|jsonb|bpchar)', '', 'g'),
           '\(\(([a-z_]+)\) = ANY \(\(?ARRAY\[(.*)\]\)\)\)', '\1 IN (\2)'),
         '^\((.*)\)$', '\1')
$$;

-- Conteo exacto de filas de una relación (sin depender de estadísticas).
CREATE OR REPLACE FUNCTION pg_temp.filas(rel regclass) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  IF rel IS NULL THEN RETURN NULL; END IF;
  EXECUTE format('SELECT count(*) FROM %s', rel) INTO n;
  RETURN n;
END $$;

-- Descripciones documentales para columnas y funciones que aún no tienen COMMENT ON en la BD.
-- (Liquibase elimina los comentarios /* */ del cuerpo de las funciones al aplicar el SQL.)
-- Se muestran marcadas con † en el documento. Recomendación: moverlas a un changeset COMMENT ON.
CREATE TEMP TABLE t_doc (tabla text, columna text, descripcion text);
INSERT INTO t_doc VALUES
  ('auditoria', 'id', 'Identificador correlativo del registro de auditoría.'),
  ('auditoria', 'tabla', 'Nombre de la tabla auditada (TG_TABLE_NAME).'),
  ('auditoria', 'registro_id', 'Clave del registro afectado (id o codigo), como texto.'),
  ('auditoria', 'usuario_bd', 'Rol de PostgreSQL que ejecutó el cambio (current_user).'),
  ('auditoria', 'ocurrido_en', 'Fecha y hora del cambio.'),
  ('aula', 'id', 'Identificador del aula.'),
  ('aula', 'codigo', 'Código de ingreso de 6 caracteres (A–Z sin I/O, 2–9); lo genera tg_aula_codigo si llega vacío.'),
  ('aula', 'nombre', 'Nombre visible del aula (ej. Ciencia y Tecnología 3.º A).'),
  ('aula', 'grado', 'Grado de secundaria del aula (1–5).'),
  ('aula', 'seccion', 'Sección del aula (ej. A).'),
  ('aula', 'docente_id', 'Docente (o administrador) dueño del aula; lo valida tg_aula_docente.'),
  ('aula', 'creado_en', 'Fecha y hora de creación.'),
  ('aula_nivel', 'aula_id', 'Aula a la que se asigna el nivel.'),
  ('aula_nivel', 'nivel_id', 'Nivel asignado.'),
  ('aula_nivel', 'fecha_limite', 'Fecha límite opcional para completar el nivel.'),
  ('aula_nivel', 'asignado_en', 'Fecha y hora de la asignación.'),
  ('elemento', 'simbolo', 'Símbolo químico (H, C, O, Na, Cl).'),
  ('elemento', 'nombre', 'Nombre del elemento en español.'),
  ('elemento', 'numero_atomico', 'Número atómico Z (1–118).'),
  ('elemento', 'color_hex', 'Color CPK de relleno del átomo (#RRGGBB).'),
  ('elemento', 'brillo_hex', 'Color de brillo/realce del átomo (#RRGGBB).'),
  ('especie', 'nombre', 'Nombre químico en español.'),
  ('especie', 'masa_molar', 'Masa molar en g/mol.'),
  ('especie', 'punto_fusion_k', 'Punto de fusión normal en K (nulo en radicales).'),
  ('especie', 't_triple_k', 'Temperatura del punto triple en K (solo especies que subliman).'),
  ('especie', 'dhvap_triple', 'Entalpía de sublimación usada bajo el punto triple (kJ/mol).'),
  ('especie', 'pubchem_cid', 'Identificador del compuesto en PubChem (trazabilidad del dato).'),
  ('especie', 'orden', 'Orden de presentación en el inyector y el catálogo.'),
  ('especie_atomo', 'especie_codigo', 'Especie a la que pertenece el átomo.'),
  ('especie_atomo', 'posicion', 'Posición del átomo dentro de la especie (1, 2, …).'),
  ('especie_atomo', 'simbolo', 'Elemento del átomo.'),
  ('especie_atomo', 'x', 'Desplazamiento horizontal relativo al centro de la molécula (px lógicos).'),
  ('especie_atomo', 'y', 'Desplazamiento vertical relativo al centro de la molécula (px lógicos).'),
  ('evento', 'id', 'Identificador correlativo del evento.'),
  ('evento', 'sesion_id', 'Sesión de uso en la que ocurrió el evento.'),
  ('evento', 'usuario_id', 'Usuario autenticado, o nulo si el uso es anónimo.'),
  ('evento', 'tipo', 'Tipo de evento de producto (lista cerrada; ver §6).'),
  ('evento', 'nivel_id', 'Nivel relacionado con el evento, si aplica.'),
  ('evento', 'creado_en', 'Fecha y hora del evento (base del índice BRIN).'),
  ('fotolisis', 'especie_codigo', 'Molécula que se rompe con luz UV.'),
  ('fotolisis', 'enlace_kj_mol', 'Energía del enlace que se rompe (kJ/mol); umbral de energía del fotón.'),
  ('fotolisis', 'etiqueta', 'Etiqueta corta mostrada en la interfaz (ej. Cl–Cl).'),
  ('fotolisis', 'producto_1', 'Primer fragmento producido.'),
  ('fotolisis', 'producto_2', 'Segundo fragmento producido.'),
  ('glosario', 'id', 'Identificador del término.'),
  ('glosario', 'termino', 'Término químico explicado por Quimi (único).'),
  ('glosario', 'definicion', 'Definición en lenguaje para escolares.'),
  ('insignia', 'codigo', 'Código estable de la insignia.'),
  ('insignia', 'nombre', 'Nombre visible de la insignia.'),
  ('insignia', 'descripcion', 'Qué hay que lograr para obtenerla.'),
  ('insignia', 'icono', 'Nombre del ícono (lucide) que la representa.'),
  ('insignia', 'tipo', 'Métrica que evalúa fn_otorgar_insignias (ver §6).'),
  ('insignia', 'umbral', 'Valor mínimo de la métrica para otorgarla.'),
  ('intento', 'id', 'Identificador del intento.'),
  ('intento', 'usuario_id', 'Estudiante que juega el nivel.'),
  ('intento', 'nivel_id', 'Nivel jugado.'),
  ('intento', 'estado', 'en_curso, completado o abandonado.'),
  ('intento', 'iniciado_en', 'Inicio del intento.'),
  ('intento', 'finalizado_en', 'Cierre del intento (nulo mientras está en curso; ck_intento_fin).'),
  ('intento', 'pasos_completados', 'Pasos completados en orden; lo incrementa fn_registrar_paso.'),
  ('intento', 'pistas_usadas', 'Cantidad de ayudas abiertas; lo incrementa tg_pista_usada_contar.'),
  ('intento', 'estrellas', 'Estrellas obtenidas (1–3); solo si está completado (ck_intento_estrellas).'),
  ('intento', 'xp_obtenido', 'XP ganada al cerrar el intento (fn_finalizar_intento).'),
  ('intento_paso', 'intento_id', 'Intento al que pertenece el paso completado.'),
  ('intento_paso', 'paso_id', 'Paso completado.'),
  ('intento_paso', 'segundos', 'Tiempo empleado en el paso, en segundos.'),
  ('intento_paso', 'completado_en', 'Fecha y hora en que se completó el paso.'),
  ('logro_usuario', 'usuario_id', 'Usuario que obtuvo la insignia.'),
  ('logro_usuario', 'insignia_codigo', 'Insignia obtenida.'),
  ('logro_usuario', 'obtenido_en', 'Fecha y hora de obtención.'),
  ('matricula', 'aula_id', 'Aula.'),
  ('matricula', 'estudiante_id', 'Estudiante matriculado.'),
  ('matricula', 'unido_en', 'Fecha y hora en que se unió con el código.'),
  ('mision', 'id', 'Identificador de la misión.'),
  ('mision', 'codigo', 'Código estable de la misión (estados, combustion, familias, luz).'),
  ('mision', 'titulo', 'Título visible de la misión.'),
  ('mision', 'descripcion', 'Descripción para el estudiante.'),
  ('mision', 'orden', 'Orden de la misión en el mapa.'),
  ('nivel', 'id', 'Identificador del nivel.'),
  ('nivel', 'codigo', 'Código estable del nivel (ej. n01-movimiento).'),
  ('nivel', 'mision_id', 'Misión a la que pertenece.'),
  ('nivel', 'orden', 'Orden global del nivel (secuencia de desbloqueo).'),
  ('nivel', 'titulo', 'Título visible del nivel.'),
  ('nivel', 'resumen', 'Resumen corto mostrado en el mapa.'),
  ('nivel', 'objetivo', 'Objetivo de aprendizaje del nivel.'),
  ('nivel', 'grado', 'Grado de secundaria sugerido (1–5).'),
  ('nivel', 'xp_base', 'XP base que otorga el nivel con 3 estrellas.'),
  ('nivel', 'minutos_estim', 'Duración estimada en minutos.'),
  ('nivel', 'casilla_fila', 'Fila (periodo) de la casilla en la tabla periódica (1–7).'),
  ('nivel', 'casilla_columna', 'Columna (grupo) de la casilla en la tabla periódica (1–18).'),
  ('nivel', 'casilla_nota', 'Dato curioso del elemento de la casilla.'),
  ('opcion', 'id', 'Identificador de la alternativa.'),
  ('opcion', 'pregunta_id', 'Pregunta a la que pertenece.'),
  ('opcion', 'orden', 'Orden de la alternativa (1, 2, 3…).'),
  ('opcion', 'texto', 'Texto de la alternativa.'),
  ('opcion', 'es_correcta', 'Indica la alternativa correcta (a lo más una por pregunta); nunca se envía al cliente.'),
  ('paso', 'id', 'Identificador del paso.'),
  ('paso', 'nivel_id', 'Nivel al que pertenece.'),
  ('paso', 'orden', 'Orden del paso dentro del nivel.'),
  ('paso', 'titulo', 'Título corto del paso.'),
  ('paso', 'instruccion', 'Instrucción que ve el estudiante.'),
  ('pista', 'id', 'Identificador de la ayuda.'),
  ('pista', 'paso_id', 'Paso al que pertenece.'),
  ('pista', 'nivel_ayuda', '1 = pista, 2 = explicación, 3 = solución.'),
  ('pista', 'texto', 'Texto de la ayuda; solo se entrega mediante fn_usar_pista.'),
  ('pista', 'costo_xp', 'XP que se descuenta al abrirla por primera vez.'),
  ('pista_usada', 'intento_id', 'Intento en que se abrió la ayuda.'),
  ('pista_usada', 'pista_id', 'Ayuda abierta.'),
  ('pista_usada', 'usada_en', 'Fecha y hora de apertura.'),
  ('pregunta', 'id', 'Identificador de la pregunta.'),
  ('pregunta', 'nivel_id', 'Nivel al que pertenece.'),
  ('pregunta', 'orden', 'Orden de la pregunta en el cuestionario.'),
  ('pregunta', 'enunciado', 'Enunciado de la pregunta.'),
  ('preset', 'codigo', 'Código estable del experimento predefinido.'),
  ('preset', 'nombre', 'Nombre visible del experimento.'),
  ('preset', 'ecuacion', 'Ecuación química mostrada.'),
  ('preset', 'sobre_flecha', 'Condición escrita sobre la flecha (ej. hν, chispa).'),
  ('preset', 'etiqueta', 'Etiqueta corta del botón.'),
  ('preset', 'pista', 'Sugerencia de qué observar.'),
  ('preset', 'orden', 'Orden de presentación.'),
  ('preset_carga', 'preset_codigo', 'Experimento predefinido.'),
  ('preset_carga', 'especie_codigo', 'Especie que se inyecta.'),
  ('preset_carga', 'cantidad', 'Número de partículas (1–500).'),
  ('reaccion', 'codigo', 'Código estable de la reacción (ej. co2).'),
  ('reaccion', 'etiqueta', 'Etiqueta legible de la reacción.'),
  ('reaccion_participante', 'reaccion_codigo', 'Reacción.'),
  ('reaccion_participante', 'papel', 'reactivo o producto.'),
  ('reaccion_participante', 'posicion', 'Posición dentro de su lado de la ecuación (1–2).'),
  ('reaccion_participante', 'especie_codigo', 'Especie participante.'),
  ('respuesta', 'intento_id', 'Intento en que se respondió.'),
  ('respuesta', 'pregunta_id', 'Pregunta respondida (una respuesta por pregunta e intento).'),
  ('respuesta', 'opcion_id', 'Alternativa elegida.'),
  ('respuesta', 'es_correcta', 'Resultado; lo fija tg_respuesta_validar desde opcion (ignora el valor del cliente).'),
  ('respuesta', 'respondida_en', 'Fecha y hora de la respuesta.'),
  ('rol', 'id', 'Identificador del rol.'),
  ('sesion', 'usuario_id', 'Usuario autenticado, o nulo si la sesión es anónima.'),
  ('sesion', 'origen', 'Canal de uso: web, vscode, claude o mcp.'),
  ('sesion', 'dispositivo', 'Tipo de dispositivo: escritorio, tablet o movil.'),
  ('sesion', 'iniciada_en', 'Inicio de la sesión (base del índice BRIN).'),
  ('sesion', 'ultima_actividad', 'Última actividad registrada (≥ iniciada_en).'),
  ('usuario', 'id', 'Identificador del usuario.'),
  ('usuario', 'nombre', 'Nombre o alias visible (mínimo 2 caracteres); el ranking usa este valor.'),
  ('usuario', 'rol_id', 'Rol de acceso.'),
  ('usuario', 'activo', 'Si la cuenta puede iniciar sesión.'),
  ('usuario', 'creado_en', 'Fecha y hora de registro.'),
  ('usuario', 'actualizado_en', 'Última modificación; la mantiene tg_usuario_actualizado.'),
  ('fn_auditar', '', 'Auditoría genérica: guarda la fila antes/después en JSON en la tabla auditoria, ocultando password_hash; ignora UPDATE sin cambios.'),
  ('fn_tg_aula_docente', '', 'Solo un usuario con rol docente o admin puede ser dueño de un aula (RAISE P0001 si no).'),
  ('fn_tg_respuesta_validar', '', 'La corrección la decide la BD: busca opcion.es_correcta, verifica que la opción pertenezca a la pregunta del nivel del intento y sobrescribe es_correcta.');

-- Tablas del dominio (sin las de Liquibase).
CREATE TEMP VIEW t_tablas AS
SELECT c.oid, c.relname AS tabla, obj_description(c.oid, 'pg_class') AS descripcion,
       row_number() OVER (ORDER BY c.relname) AS n
FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
WHERE s.nspname = 'public' AND c.relkind = 'r' AND c.relname NOT LIKE 'databasechangelog%';

-- =============================================================================
-- 1. Encabezado y resumen
-- =============================================================================
SELECT format($h$# Diccionario de datos — AtomReactChamber

> **Proyecto:** AtomReactChamber: laboratorio virtual gamificado de química para estudiantes de secundaria del Perú
> **Curso:** Base de Datos II · **Docente:** Ing. Patrick Cuadros Quiroga
> **Integrante:** Laos González, Adriana Rafaela (2023077474) · UPT – FAING – EPIS · Tacna, 2026
> **Documento generado automáticamente** con `docs/database/generar-diccionario.sql` a partir del catálogo de
> PostgreSQL (`pg_catalog`, `information_schema` y `COMMENT ON`). **No editar a mano:** volver a ejecutar el script.

# Control de versiones

| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
|---|---|---|---|---|---|
| 1.0 | Adriana Laos | Ing. Patrick Cuadros Quiroga (pendiente) | (pendiente) | %s | Primera versión, generada desde la BD migrada |

---

# 1. Introducción

## 1.1 Propósito

Describir cada objeto de la base de datos de AtomReactChamber —tablas, columnas, tipos, restricciones,
índices, claves foráneas, vistas, funciones y *triggers*— tal como existen en la base de datos migrada con
Liquibase (`db/changelog/db.changelog-master.yaml`). Es el anexo de datos del FD03 (SRS) y del FD04 (SAD).

## 1.2 Entorno de generación

| Dato | Valor |
|---|---|
| Motor | %s |
| Base de datos | `%s` (esquema `public`) |
| Fecha de generación | %s |
| *Changesets* Liquibase aplicados | %s |
| Extensiones | %s |
| Configuraciones de búsqueda de texto | %s |

## 1.3 Convenciones de lectura

| Abreviatura | Significado |
|---|---|
| PK | Clave primaria |
| FK → t(c) | Clave foránea hacia la columna `c` de la tabla `t` |
| UQ | Valor único (restricción o índice único de una sola columna) |
| IDENTITY | Columna autonumérica `GENERATED ALWAYS AS IDENTITY` |
| GENERADA | Columna calculada `GENERATED ALWAYS AS (...) STORED` |
| Nulo = No | La columna tiene `NOT NULL` |
| † | Descripción documental: la columna aún no tiene `COMMENT ON` en la BD; el texto proviene de este generador |
$h$,
  to_char(now() AT TIME ZONE 'America/Lima', 'YYYY-MM-DD'),
  split_part(version(), ' on ', 1),
  current_database(),
  to_char(now() AT TIME ZONE 'America/Lima', 'YYYY-MM-DD HH24:MI') || ' (America/Lima)',
  coalesce(pg_temp.filas(to_regclass('public.databasechangelog'))::text, '—'),
  (SELECT string_agg(format('`%s` %s', extname, extversion), ', ' ORDER BY extname) FROM pg_extension WHERE extname <> 'plpgsql'),
  (SELECT string_agg(format('`%s`', cfgname), ', ') FROM pg_ts_config c JOIN pg_namespace n ON n.oid = c.cfgnamespace WHERE n.nspname = 'public')
);

-- Inventario de objetos
SELECT E'## 1.4 Inventario de objetos\n\n| Tipo de objeto | Cantidad | Prefijo |\n|---|---|---|\n' ||
  format('| Tablas | %s | — |', (SELECT count(*) FROM t_tablas)) || E'\n' ||
  format('| Vistas | %s | `v_` |', (SELECT count(*) FROM pg_views WHERE schemaname = 'public')) || E'\n' ||
  format('| Vistas materializadas | %s | `mv_` |', (SELECT count(*) FROM pg_matviews WHERE schemaname = 'public')) || E'\n' ||
  format('| Funciones de negocio | %s | `fn_` |', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.prorettype <> 'trigger'::regtype
            AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'))) || E'\n' ||
  format('| Funciones de *trigger* | %s | `fn_tg_` / `fn_auditar` |', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.prorettype = 'trigger'::regtype)) || E'\n' ||
  format('| *Triggers* | %s | `tg_` |', (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND NOT t.tgisinternal)) || E'\n' ||
  format('| Índices (incluye PK y UQ) | %s | `ix_` / `ux_` / `*_pkey` / `*_key` |', (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public'
          AND tablename NOT LIKE 'databasechangelog%')) || E'\n' ||
  format('| Restricciones CHECK | %s | `ck_` (con nombre) / `*_check` |', (SELECT count(*) FROM pg_constraint k JOIN t_tablas t ON t.oid = k.conrelid WHERE k.contype = 'c')) || E'\n' ||
  format('| Claves foráneas | %s | `*_fkey` |', (SELECT count(*) FROM pg_constraint k JOIN t_tablas t ON t.oid = k.conrelid WHERE k.contype = 'f')) || E'\n';

-- Resumen de tablas
SELECT E'## 1.5 Resumen de tablas\n\n| N.° | Tabla | Descripción | Columnas | Filas* |\n|---|---|---|---|---|\n' ||
  string_agg(format('| %s | [`%s`](#t-%s) | %s | %s | %s |', t.n, t.tabla, t.tabla, pg_temp.md(t.descripcion),
                    (SELECT count(*) FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped),
                    pg_temp.filas(t.oid)), E'\n' ORDER BY t.n) ||
  E'\n\n\\* Filas en la base de datos local al momento de generar el documento (semilla + datos de demostración, contexto `demo`).\n'
FROM t_tablas t;

-- =============================================================================
-- 2. Tablas
-- =============================================================================
SELECT E'# 2. Tablas\n';

WITH cols AS (
  SELECT a.attrelid, a.attnum, a.attname,
         format_type(a.atttypid, a.atttypmod) AS tipo,
         CASE WHEN a.attnotnull THEN 'No' ELSE 'Sí' END AS nulo,
         CASE
           WHEN a.attidentity = 'a' THEN 'IDENTITY'
           WHEN a.attidentity = 'd' THEN 'IDENTITY (BY DEFAULT)'
           WHEN a.attgenerated = 's' THEN 'GENERADA: ' || pg_get_expr(ad.adbin, ad.adrelid)
           ELSE pg_get_expr(ad.adbin, ad.adrelid)
         END AS defecto,
         col_description(a.attrelid, a.attnum) AS descripcion
  FROM pg_attribute a
  LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
  WHERE a.attnum > 0 AND NOT a.attisdropped
), claves AS (
  -- PK, UQ de una columna y FK por columna
  SELECT k.conrelid AS attrelid, col.attnum,
         string_agg(
           CASE k.contype
             WHEN 'p' THEN 'PK'
             WHEN 'u' THEN CASE WHEN cardinality(k.conkey) = 1 THEN 'UQ' ELSE 'UQ(' || k.conname || ')' END
             WHEN 'f' THEN format('FK → %s(%s)', k.confrelid::regclass,
                                  (SELECT attname FROM pg_attribute WHERE attrelid = k.confrelid
                                     AND attnum = k.confkey[array_position(k.conkey, col.attnum)]))
           END, ', ' ORDER BY k.contype DESC) AS clave
  FROM pg_constraint k
  CROSS JOIN LATERAL unnest(k.conkey) AS col(attnum)
  WHERE k.contype IN ('p', 'u', 'f')
  GROUP BY k.conrelid, col.attnum
), uq_idx AS (
  -- índices únicos de una sola columna que no son restricciones (p. ej. ux_usuario_email sobre lower(email))
  SELECT i.indrelid AS attrelid, i.indkey[0] AS attnum, string_agg('UQ (' || ic.relname || ')', ', ') AS clave
  FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid
  WHERE i.indisunique AND NOT i.indisprimary AND i.indnatts = 1 AND i.indkey[0] > 0
    AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.indexrelid)
  GROUP BY i.indrelid, i.indkey[0]
), checks AS (
  SELECT k.conrelid AS attrelid, k.conkey[1] AS attnum,
         string_agg(regexp_replace(pg_get_constraintdef(k.oid), '^CHECK ', ''), '; ' ORDER BY k.conname) AS chk
  FROM pg_constraint k
  WHERE k.contype = 'c' AND cardinality(k.conkey) = 1
  GROUP BY k.conrelid, k.conkey[1]
)
SELECT string_agg(bloque, E'\n' ORDER BY n)
FROM (
  SELECT t.n,
    format(E'## 2.%s Tabla `%s` {#t-%s}\n\n**Descripción:** %s\n\n**Filas actuales:** %s\n\n',
           t.n, t.tabla, t.tabla, coalesce(pg_temp.md(t.descripcion), '*(sin comentario)*'), pg_temp.filas(t.oid))
    -- columnas
    || E'**Columnas**\n\n| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |\n|---|---|---|---|---|---|---|---|\n'
    || (SELECT string_agg(format('| %s | `%s` | %s | %s | %s | %s | %s | %s |',
                                 c.attnum, c.attname, pg_temp.md(c.tipo), c.nulo,
                                 CASE WHEN c.defecto IS NULL THEN '' ELSE '`' || pg_temp.md(pg_temp.limpia(c.defecto)) || '`' END,
                                 pg_temp.md(concat_ws(', ', k.clave, u.clave)),
                                 CASE WHEN ch.chk IS NULL THEN '' ELSE '`' || pg_temp.md(pg_temp.limpia(ch.chk)) || '`' END,
                                 pg_temp.md(coalesce(c.descripcion, (SELECT d.descripcion || ' †' FROM t_doc d WHERE d.tabla = t.tabla AND d.columna = c.attname::text)))), E'\n' ORDER BY c.attnum)
        FROM cols c
        LEFT JOIN claves k ON k.attrelid = c.attrelid AND k.attnum = c.attnum
        LEFT JOIN uq_idx u ON u.attrelid = c.attrelid AND u.attnum = c.attnum
        LEFT JOIN checks ch ON ch.attrelid = c.attrelid AND ch.attnum = c.attnum
        WHERE c.attrelid = t.oid)
    -- restricciones de tabla (CHECK multi-columna y UNIQUE compuestos)
    || coalesce(E'\n\n**Restricciones de tabla**\n\n| Restricción | Tipo | Definición |\n|---|---|---|\n' ||
         (SELECT string_agg(format('| `%s` | %s | `%s` |', k.conname,
                                   CASE k.contype WHEN 'c' THEN 'CHECK' WHEN 'u' THEN 'UNIQUE' WHEN 'p' THEN 'PRIMARY KEY' END,
                                   pg_temp.md(pg_temp.limpia(pg_get_constraintdef(k.oid)))), E'\n' ORDER BY k.contype, k.conname)
            FROM pg_constraint k
           WHERE k.conrelid = t.oid AND k.contype IN ('c', 'u', 'p') AND cardinality(k.conkey) > 1), '')
    -- claves foráneas
    || coalesce(E'\n\n**Claves foráneas**\n\n| Restricción | Columnas | Referencia | ON DELETE |\n|---|---|---|---|\n' ||
         (SELECT string_agg(format('| `%s` | %s | `%s` (%s) | %s |', k.conname,
                                   (SELECT string_agg(attname, ', ' ORDER BY array_position(k.conkey, attnum)) FROM pg_attribute
                                     WHERE attrelid = k.conrelid AND attnum = ANY (k.conkey)),
                                   k.confrelid::regclass,
                                   (SELECT string_agg(attname, ', ' ORDER BY array_position(k.confkey, attnum)) FROM pg_attribute
                                     WHERE attrelid = k.confrelid AND attnum = ANY (k.confkey)),
                                   CASE k.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
                                                      WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END), E'\n' ORDER BY k.conname)
            FROM pg_constraint k WHERE k.conrelid = t.oid AND k.contype = 'f'), '')
    -- referenciada por
    || coalesce(E'\n\n**Referenciada por:** ' ||
         (SELECT string_agg(DISTINCT format('`%s`', k.conrelid::regclass), ', ')
            FROM pg_constraint k WHERE k.confrelid = t.oid AND k.contype = 'f' AND k.conrelid <> t.oid), '')
    -- índices
    || E'\n\n**Índices**\n\n| Índice | Método | Único | Definición |\n|---|---|---|---|\n'
    || (SELECT string_agg(format('| `%s` | %s | %s | `%s` |', ic.relname, am.amname,
                                 CASE WHEN i.indisprimary THEN 'PK' WHEN i.indisunique THEN 'Sí' ELSE 'No' END,
                                 pg_temp.md(regexp_replace(pg_get_indexdef(i.indexrelid), '^CREATE (UNIQUE )?INDEX \S+ ON public\.\S+ ', ''))),
                          E'\n' ORDER BY i.indisprimary DESC, ic.relname)
        FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid JOIN pg_am am ON am.oid = ic.relam
        WHERE i.indrelid = t.oid)
    -- triggers
    || coalesce(E'\n\n**Triggers**\n\n| Trigger | Momento | Evento | Función |\n|---|---|---|---|\n' ||
         (SELECT string_agg(format('| `%s` | %s | %s | `%s()` |', tg.tgname,
                                   CASE WHEN tg.tgtype & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END,
                                   concat_ws(' OR ',
                                     CASE WHEN tg.tgtype & 4 = 4 THEN 'INSERT' END,
                                     CASE WHEN tg.tgtype & 16 = 16 THEN 'UPDATE' ||
                                       coalesce(' OF ' || (SELECT string_agg(attname, ', ') FROM pg_attribute
                                                            WHERE attrelid = tg.tgrelid AND attnum = ANY (tg.tgattr)), '') END,
                                     CASE WHEN tg.tgtype & 8 = 8 THEN 'DELETE' END) || ' (FOR EACH ROW)',
                                   tg.tgfoid::regproc), E'\n' ORDER BY tg.tgname)
            FROM pg_trigger tg WHERE tg.tgrelid = t.oid AND NOT tg.tgisinternal), '')
    || E'\n' AS bloque
  FROM t_tablas t
) x;

-- =============================================================================
-- 3. Vistas y vista materializada
-- =============================================================================
SELECT E'# 3. Vistas\n\n' || string_agg(
  format(E'## 3.%s Vista `%s`\n\n**Descripción:** %s\n\n**Tipo:** %s\n\n| N.° | Columna | Tipo |\n|---|---|---|\n%s\n',
         v.n, v.relname,
         pg_temp.md(obj_description(v.oid, 'pg_class')),
         CASE v.relkind WHEN 'v' THEN 'Vista (se calcula en cada consulta)'
                        ELSE 'Vista materializada (se guarda; se refresca con `fn_refrescar_dashboard()`)' END,
         (SELECT string_agg(format('| %s | `%s` | %s |', a.attnum, a.attname, format_type(a.atttypid, a.atttypmod)), E'\n' ORDER BY a.attnum)
            FROM pg_attribute a WHERE a.attrelid = v.oid AND a.attnum > 0 AND NOT a.attisdropped)
         || coalesce(E'\n\n**Índices:** ' || (SELECT string_agg(format('`%s` (%s)', ic.relname,
                       regexp_replace(pg_get_indexdef(i.indexrelid), '^.* USING ', '')), ', ')
                       FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid WHERE i.indrelid = v.oid), '')
  ), E'\n' ORDER BY v.n)
FROM (
  SELECT c.oid, c.relname, c.relkind, row_number() OVER (ORDER BY c.relkind DESC, c.relname) AS n
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')
) v;

-- =============================================================================
-- 4. Funciones
-- =============================================================================
SELECT E'# 4. Funciones\n\n## 4.1 Funciones de negocio\n\n| N.° | Función | Parámetros | Retorna | Lenguaje | Volatilidad | Descripción |\n|---|---|---|---|---|---|---|\n' ||
  string_agg(format('| %s | `%s` | %s | %s | %s | %s | %s |', n, proname, pg_temp.md(args), pg_temp.md(ret), lang, vol, pg_temp.md(descr)), E'\n' ORDER BY n)
FROM (
  SELECT row_number() OVER (ORDER BY p.proname) AS n, p.proname,
         pg_get_function_arguments(p.oid) AS args, pg_get_function_result(p.oid) AS ret, l.lanname AS lang,
         CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' ELSE 'VOLATILE' END AS vol,
         obj_description(p.oid, 'pg_proc') AS descr
  FROM pg_proc p JOIN pg_namespace s ON s.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang
  WHERE s.nspname = 'public' AND p.prorettype <> 'trigger'::regtype
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
) f;

SELECT E'\n## 4.2 Funciones de trigger\n\n| N.° | Función | Lenguaje | Usada por | Propósito |\n|---|---|---|---|---|\n' ||
  string_agg(format('| %s | `%s()` | %s | %s | %s |', n, proname, lang, pg_temp.md(usada), pg_temp.md(proposito)), E'\n' ORDER BY n)
FROM (
  SELECT row_number() OVER (ORDER BY p.proname) AS n, p.proname, l.lanname AS lang,
         (SELECT string_agg(format('`%s`', tg.tgname), ', ' ORDER BY tg.tgname) FROM pg_trigger tg WHERE tg.tgfoid = p.oid) AS usada,
         coalesce(obj_description(p.oid, 'pg_proc'),
                  (SELECT d.descripcion || ' †' FROM t_doc d WHERE d.tabla = p.proname::text AND d.columna = ''),
                  CASE p.proname
                    WHEN 'fn_tg_actualizado_en'     THEN 'Asigna now() a actualizado_en antes de cada actualización. †'
                    WHEN 'fn_tg_respuesta_contar'   THEN 'Suma 1 a intento.aciertos cuando la respuesta insertada es correcta. †'
                    WHEN 'fn_tg_pista_usada_contar' THEN 'Suma 1 a intento.pistas_usadas y el costo de la pista a intento.xp_pistas. †'
                    WHEN 'fn_tg_aula_codigo'        THEN 'Genera el código del aula con fn_generar_codigo_aula() si llega vacío. †'
                  END) AS proposito
  FROM pg_proc p JOIN pg_namespace s ON s.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang
  WHERE s.nspname = 'public' AND p.prorettype = 'trigger'::regtype
) f;

-- =============================================================================
-- 5. Triggers
-- =============================================================================
SELECT E'\n# 5. Triggers\n\n| N.° | Trigger | Tabla | Momento | Evento | Función |\n|---|---|---|---|---|---|\n' ||
  string_agg(format('| %s | `%s` | `%s` | %s | %s | `%s()` |', n, tgname, tabla, momento, evento, fn), E'\n' ORDER BY n)
FROM (
  SELECT row_number() OVER (ORDER BY c.relname, tg.tgname) AS n, tg.tgname, c.relname AS tabla,
         CASE WHEN tg.tgtype & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END AS momento,
         concat_ws(' OR ', CASE WHEN tg.tgtype & 4 = 4 THEN 'INSERT' END,
                           CASE WHEN tg.tgtype & 16 = 16 THEN 'UPDATE' || coalesce(' OF ' ||
                             (SELECT string_agg(attname, ', ') FROM pg_attribute WHERE attrelid = tg.tgrelid AND attnum = ANY (tg.tgattr)), '') END,
                           CASE WHEN tg.tgtype & 8 = 8 THEN 'DELETE' END) AS evento,
         tg.tgfoid::regproc AS fn
  FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid JOIN pg_namespace s ON s.oid = c.relnamespace
  WHERE s.nspname = 'public' AND NOT tg.tgisinternal
) t;

-- =============================================================================
-- 6. Dominios de valores (CHECK con listas cerradas)
-- =============================================================================
SELECT E'\n# 6. Dominios de valores enumerados\n\nValores permitidos por restricciones `CHECK (... IN (...))` o `= ANY (ARRAY[...])`.\n\n| Tabla | Columna | Valores permitidos |\n|---|---|---|\n' ||
  string_agg(format('| `%s` | `%s` | %s |', c.relname, a.attname,
                    pg_temp.md((SELECT string_agg(format('`%s`', m[1]), ', ')
                                  FROM regexp_matches(pg_get_constraintdef(k.oid), '''([^'']+)''::', 'g') AS m))),
             E'\n' ORDER BY c.relname, a.attname)
FROM pg_constraint k
JOIN pg_class c ON c.oid = k.conrelid
JOIN pg_namespace s ON s.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = k.conkey[1]
WHERE s.nspname = 'public' AND k.contype = 'c' AND cardinality(k.conkey) = 1
  AND pg_get_constraintdef(k.oid) ~ 'ANY \(\(?ARRAY\['
  AND c.relname NOT LIKE 'databasechangelog%';

SELECT E'\n# 7. Notas de diseño\n\n' ||
E'1. **3FN:** los valores derivables no se almacenan: ΔH de reacción se calcula en `v_reaccion_entalpia`; el progreso y el ranking, en `v_progreso_estudiante` y `v_ranking_aula`. Las únicas columnas derivadas persistidas (`intento.pasos_completados`, `pistas_usadas`, `xp_pistas`, `aciertos`, `usuario.xp`, rachas) son contadores mantenidos exclusivamente por funciones y *triggers* de la BD (desnormalización controlada por rendimiento y auditada).\n' ||
E'2. **Integridad en la BD:** la corrección de respuestas (`tg_respuesta_validar`), el orden de pasos (`fn_registrar_paso`), el orden de ayudas (`fn_usar_pista`) y el rol del dueño de un aula (`tg_aula_docente`) se validan en PostgreSQL, no en el cliente.\n' ||
E'3. **Índices especiales:** GIN sobre `glosario.busqueda` (búsqueda de texto completo), BRIN sobre `sesion.iniciada_en` y `evento.creado_en` (tablas *append-only* ordenadas en el tiempo), índices parciales `ux_opcion_una_correcta`, `ix_intento_completado` e `ix_respuesta_pregunta`, e índice de expresión `ux_usuario_email` sobre `lower(email)`.\n' ||
E'4. **Auditoría:** `fn_auditar()` registra en `auditoria` los cambios de `usuario`, `aula`, `nivel` y `paso`, sin guardar `password_hash`.\n' ||
E'5. **Regeneración:** `psql \"$DATABASE_URL\" -X -q -A -t -f docs/database/generar-diccionario.sql > docs/database/diccionario-de-datos.md`.\n';
