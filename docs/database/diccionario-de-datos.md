# Diccionario de datos — AtomReactChamber

> **Proyecto:** AtomReactChamber: laboratorio virtual gamificado de química para estudiantes de secundaria del Perú
> **Curso:** Base de Datos II · **Docente:** Ing. Patrick Cuadros Quiroga
> **Integrante:** Laos González, Adriana Rafaela (2023077474) · UPT – FAING – EPIS · Tacna, 2026
> **Documento generado automáticamente** con `docs/database/generar-diccionario.sql` a partir del catálogo de
> PostgreSQL (`pg_catalog`, `information_schema` y `COMMENT ON`). **No editar a mano:** volver a ejecutar el script.

# Control de versiones

| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
|---|---|---|---|---|---|
| 1.0 | Adriana Laos | Ing. Patrick Cuadros Quiroga (pendiente) | (pendiente) | 2026-11-07 | Primera versión, generada desde la BD migrada |

---

# 1. Introducción

## 1.1 Propósito

Describir cada objeto de la base de datos de AtomReactChamber —tablas, columnas, tipos, restricciones,
índices, claves foráneas, vistas, funciones y *triggers*— tal como existen en la base de datos migrada con
Liquibase (`db/changelog/db.changelog-master.yaml`). Es el anexo de datos del FD03 (SRS) y del FD04 (SAD).

## 1.2 Entorno de generación

| Dato | Valor |
|---|---|
| Motor | PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) |
| Base de datos | `arc` (esquema `public`) |
| Fecha de generación | 2026-11-07 00:56 (America/Lima) |
| *Changesets* Liquibase aplicados | 47 |
| Extensiones | `unaccent` 1.1 |
| Configuraciones de búsqueda de texto | `es_sin_tildes` |

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

## 1.4 Inventario de objetos

| Tipo de objeto | Cantidad | Prefijo |
|---|---|---|
| Tablas | 29 | — |
| Vistas | 6 | `v_` |
| Vistas materializadas | 1 | `mv_` |
| Funciones de negocio | 9 | `fn_` |
| Funciones de *trigger* | 7 | `fn_tg_` / `fn_auditar` |
| *Triggers* | 10 | `tg_` |
| Índices (incluye PK y UQ) | 62 | `ix_` / `ux_` / `*_pkey` / `*_key` |
| Restricciones CHECK | 61 | `ck_` (con nombre) / `*_check` |
| Claves foráneas | 36 | `*_fkey` |

## 1.5 Resumen de tablas

| N.° | Tabla | Descripción | Columnas | Filas* |
|---|---|---|---|---|
| 1 | [`auditoria`](#t-auditoria) | Registro de cambios (insert/update/delete) en tablas sensibles, llenado por fn_auditar(). | 8 | 113 |
| 2 | [`aula`](#t-aula) | Grupo de estudiantes a cargo de un docente. Los estudiantes se unen con el código de 6 caracteres. | 7 | 1 |
| 3 | [`aula_nivel`](#t-aula_nivel) | Niveles que el docente asigna a un aula, con fecha límite opcional. | 4 | 6 |
| 4 | [`elemento`](#t-elemento) | Elementos químicos que aparecen como átomos en el simulador (color CPK y radio de dibujo). | 6 | 5 |
| 5 | [`especie`](#t-especie) | Especies químicas del catálogo con datos termodinámicos estándar (NIST/CRC) y CID de PubChem. | 15 | 13 |
| 6 | [`especie_atomo`](#t-especie_atomo) | Átomos que componen cada especie y su posición relativa para dibujarla (relación N:M especie–elemento). | 5 | 24 |
| 7 | [`evento`](#t-evento) | Eventos de telemetría de producto (append-only). Índice BRIN por fecha: tabla grande y ordenada en el tiempo. | 7 | 261 |
| 8 | [`fotolisis`](#t-fotolisis) | Moléculas que se rompen con fotones de energía ≥ enlace (E = 119 627 / λ kJ/mol). | 6 | 3 |
| 9 | [`glosario`](#t-glosario) | Términos que Quimi explica. Búsqueda de texto completo en español sin tildes (índice GIN). | 4 | 39 |
| 10 | [`insignia`](#t-insignia) | Logros desbloqueables. fn_otorgar_insignias evalúa tipo/umbral contra el progreso del usuario. | 6 | 8 |
| 11 | [`intento`](#t-intento) | Cada vez que un estudiante juega un nivel. Lo cierra fn_finalizar_intento (estrellas y XP). | 12 | 73 |
| 12 | [`intento_paso`](#t-intento_paso) | Pasos completados dentro de un intento y el tiempo que tomaron (métrica del dashboard). | 4 | 205 |
| 13 | [`logro_usuario`](#t-logro_usuario) | Insignias obtenidas por cada usuario. | 3 | 52 |
| 14 | [`matricula`](#t-matricula) | Pertenencia de estudiantes a aulas (relación N:M). | 3 | 13 |
| 15 | [`mision`](#t-mision) | Capítulos temáticos que agrupan niveles (ej. La materia y sus estados). | 7 | 4 |
| 16 | [`nivel`](#t-nivel) | Nivel jugable: una práctica guiada ubicada en una casilla de la tabla periódica. | 18 | 9 |
| 17 | [`opcion`](#t-opcion) | Alternativas de cada pregunta. El índice parcial ux_opcion_una_correcta garantiza a lo más una correcta. | 5 | 85 |
| 18 | [`paso`](#t-paso) | Paso de un nivel. La condición se evalúa en el motor del simulador (DSL {todas\|alguna:[{metrica, op, valor}]}). | 7 | 29 |
| 19 | [`pista`](#t-pista) | Ayudas de Quimi por paso: 1 = pista, 2 = explicación, 3 = solución. Cada una cuesta XP. | 5 | 87 |
| 20 | [`pista_usada`](#t-pista_usada) | Pistas de Quimi que el estudiante abrió en un intento (una vez por pista). | 3 | 46 |
| 21 | [`pregunta`](#t-pregunta) | Preguntas del cuestionario de cierre de cada nivel. | 5 | 27 |
| 22 | [`preset`](#t-preset) | Experimentos listos para cargar en el laboratorio libre. | 9 | 4 |
| 23 | [`preset_carga`](#t-preset_carga) | Partículas que se inyectan al cargar un preset. | 3 | 8 |
| 24 | [`reaccion`](#t-reaccion) | Reacciones elementales que el motor evalúa en cada colisión. ΔH se calcula en la vista v_reaccion_entalpia. | 5 | 12 |
| 25 | [`reaccion_participante`](#t-reaccion_participante) | Especies que participan en cada reacción como reactivo o producto (máx. 2 por lado). | 4 | 41 |
| 26 | [`respuesta`](#t-respuesta) | Respuesta elegida en el cuestionario. es_correcta la fija un trigger desde opcion (no confía en el cliente). | 5 | 195 |
| 27 | [`rol`](#t-rol) | Roles de acceso de la aplicación (estudiante, docente, administrador). | 3 | 3 |
| 28 | [`sesion`](#t-sesion) | Sesión de uso (anónima o autenticada) desde la web, VS Code, Claude Code o MCP. | 6 | 66 |
| 29 | [`usuario`](#t-usuario) | Cuentas de estudiantes, docentes y administradores, con su experiencia (XP) y racha. | 13 | 15 |

\* Filas en la base de datos local al momento de generar el documento (semilla + datos de demostración, contexto `demo`).

# 2. Tablas

## 2.1 Tabla `auditoria` {#t-auditoria}

**Descripción:** Registro de cambios (insert/update/delete) en tablas sensibles, llenado por fn_auditar().

**Filas actuales:** 113

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | bigint | No | `IDENTITY` | PK |  | Identificador correlativo del registro de auditoría. † |
| 2 | `tabla` | character varying(63) | No |  |  |  | Nombre de la tabla auditada (TG_TABLE_NAME). † |
| 3 | `operacion` | character(1) | No |  |  | `(operacion = ANY (ARRAY['I', 'U', 'D']))` | I = inserción, U = actualización, D = eliminación. |
| 4 | `registro_id` | text | Sí |  |  |  | Clave del registro afectado (id o codigo), como texto. † |
| 5 | `usuario_bd` | character varying(63) | No | `CURRENT_USER` |  |  | Rol de PostgreSQL que ejecutó el cambio (current_user). † |
| 6 | `datos_antes` | jsonb | Sí |  |  |  | Fila anterior en JSON (sin password_hash). |
| 7 | `datos_despues` | jsonb | Sí |  |  |  | Fila nueva en JSON (sin password_hash). |
| 8 | `ocurrido_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora del cambio. † |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `auditoria_pkey` | btree | PK | `USING btree (id)` |
| `ix_auditoria_tabla_fecha` | btree | No | `USING btree (tabla, ocurrido_en DESC)` |

## 2.2 Tabla `aula` {#t-aula}

**Descripción:** Grupo de estudiantes a cargo de un docente. Los estudiantes se unen con el código de 6 caracteres.

**Filas actuales:** 1

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | integer | No | `IDENTITY` | PK |  | Identificador del aula. † |
| 2 | `codigo` | character(6) | No |  | UQ | `(codigo ~ '^[A-Z0-9]{6}$')` | Código de ingreso de 6 caracteres (A–Z sin I/O, 2–9); lo genera tg_aula_codigo si llega vacío. † |
| 3 | `nombre` | character varying(60) | No |  |  |  | Nombre visible del aula (ej. Ciencia y Tecnología 3.º A). † |
| 4 | `grado` | smallint | No |  |  | `((grado >= 1) AND (grado <= 5))` | Grado de secundaria del aula (1–5). † |
| 5 | `seccion` | character varying(3) | No | `'A'` |  |  | Sección del aula (ej. A). † |
| 6 | `docente_id` | bigint | No |  | FK → usuario(id) |  | Docente (o administrador) dueño del aula; lo valida tg_aula_docente. † |
| 7 | `creado_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora de creación. † |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `aula_docente_id_fkey` | docente_id | `usuario` (id) | NO ACTION |

**Referenciada por:** `aula_nivel`, `matricula`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `aula_pkey` | btree | PK | `USING btree (id)` |
| `aula_codigo_key` | btree | Sí | `USING btree (codigo)` |
| `ix_aula_docente` | btree | No | `USING btree (docente_id)` |

**Triggers**

| Trigger | Momento | Evento | Función |
|---|---|---|---|
| `tg_aula_auditoria` | AFTER | INSERT OR UPDATE OR DELETE (FOR EACH ROW) | `fn_auditar()` |
| `tg_aula_codigo` | BEFORE | INSERT (FOR EACH ROW) | `fn_tg_aula_codigo()` |
| `tg_aula_docente` | BEFORE | INSERT OR UPDATE OF docente_id (FOR EACH ROW) | `fn_tg_aula_docente()` |

## 2.3 Tabla `aula_nivel` {#t-aula_nivel}

**Descripción:** Niveles que el docente asigna a un aula, con fecha límite opcional.

**Filas actuales:** 6

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `aula_id` | integer | No |  | PK, FK → aula(id) |  | Aula a la que se asigna el nivel. † |
| 2 | `nivel_id` | smallint | No |  | PK, FK → nivel(id) |  | Nivel asignado. † |
| 3 | `fecha_limite` | date | Sí |  |  |  | Fecha límite opcional para completar el nivel. † |
| 4 | `asignado_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora de la asignación. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `aula_nivel_pkey` | PRIMARY KEY | `PRIMARY KEY (aula_id, nivel_id)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `aula_nivel_aula_id_fkey` | aula_id | `aula` (id) | CASCADE |
| `aula_nivel_nivel_id_fkey` | nivel_id | `nivel` (id) | NO ACTION |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `aula_nivel_pkey` | btree | PK | `USING btree (aula_id, nivel_id)` |

## 2.4 Tabla `elemento` {#t-elemento}

**Descripción:** Elementos químicos que aparecen como átomos en el simulador (color CPK y radio de dibujo).

**Filas actuales:** 5

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `simbolo` | character varying(3) | No |  | PK | `((simbolo) ~ '^[A-Z][a-z]{0,2}$')` | Símbolo químico (H, C, O, Na, Cl). † |
| 2 | `nombre` | character varying(30) | No |  | UQ |  | Nombre del elemento en español. † |
| 3 | `numero_atomico` | smallint | No |  | UQ | `((numero_atomico >= 1) AND (numero_atomico <= 118))` | Número atómico Z (1–118). † |
| 4 | `color_hex` | character(7) | No |  |  | `(color_hex ~ '^#[0-9a-fA-F]{6}$')` | Color CPK de relleno del átomo (#RRGGBB). † |
| 5 | `brillo_hex` | character(7) | No |  |  | `(brillo_hex ~ '^#[0-9a-fA-F]{6}$')` | Color de brillo/realce del átomo (#RRGGBB). † |
| 6 | `radio_px` | numeric(4,1) | No |  |  | `(radio_px > (0)::numeric)` | Radio de dibujo del átomo en píxeles lógicos. |

**Referenciada por:** `especie_atomo`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `elemento_pkey` | btree | PK | `USING btree (simbolo)` |
| `elemento_nombre_key` | btree | Sí | `USING btree (nombre)` |
| `elemento_numero_atomico_key` | btree | Sí | `USING btree (numero_atomico)` |

## 2.5 Tabla `especie` {#t-especie}

**Descripción:** Especies químicas del catálogo con datos termodinámicos estándar (NIST/CRC) y CID de PubChem.

**Filas actuales:** 13

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `codigo` | character varying(10) | No |  | PK |  | Código interno usado por el motor (ej. H2, H2O, Cl). |
| 2 | `formula` | character varying(12) | No |  |  |  | Fórmula para mostrar, con subíndices Unicode (ej. H₂O). |
| 3 | `nombre` | character varying(60) | No |  |  |  | Nombre químico en español. † |
| 4 | `masa_molar` | numeric(9,3) | No |  |  | `(masa_molar > (0)::numeric)` | Masa molar en g/mol. † |
| 5 | `dhf_kj_mol` | numeric(8,2) | No |  |  |  | Entalpía estándar de formación ΔHf° en kJ/mol. |
| 6 | `punto_fusion_k` | numeric(7,2) | Sí |  |  | `(punto_fusion_k > (0)::numeric)` | Punto de fusión normal en K (nulo en radicales). † |
| 7 | `punto_ebull_k` | numeric(7,2) | Sí |  |  | `(punto_ebull_k > (0)::numeric)` | Punto de ebullición normal (1 atm) en K; se corrige por presión con Clausius-Clapeyron. |
| 8 | `dhvap_kj_mol` | numeric(7,2) | Sí |  |  | `(dhvap_kj_mol > (0)::numeric)` | Entalpía de vaporización (kJ/mol), usada en Clausius-Clapeyron. |
| 9 | `p_triple_atm` | numeric(6,2) | Sí |  |  |  | Presión del punto triple para especies que subliman (CO₂). |
| 10 | `t_triple_k` | numeric(7,2) | Sí |  |  |  | Temperatura del punto triple en K (solo especies que subliman). † |
| 11 | `dhvap_triple` | numeric(7,2) | Sí |  |  |  | Entalpía de sublimación usada bajo el punto triple (kJ/mol). † |
| 12 | `pubchem_cid` | integer | Sí |  |  | `(pubchem_cid > 0)` | Identificador del compuesto en PubChem (trazabilidad del dato). † |
| 13 | `es_radical` | boolean | No | `false` |  |  | Verdadero para radicales (H·, O·, Cl·): siempre en fase gas. |
| 14 | `inyectable` | boolean | No | `false` |  |  | Si aparece en el inyector del laboratorio. |
| 15 | `orden` | smallint | No |  |  |  | Orden de presentación en el inyector y el catálogo. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `ck_especie_radical_sin_fases` | CHECK | `CHECK ((es_radical OR ((punto_fusion_k IS NOT NULL) AND (punto_ebull_k IS NOT NULL) AND (dhvap_kj_mol IS NOT NULL))))` |
| `ck_especie_sublimacion_completa` | CHECK | `CHECK ((num_nulls(p_triple_atm, t_triple_k, dhvap_triple) = ANY (ARRAY[0, 3])))` |

**Referenciada por:** `especie_atomo`, `fotolisis`, `preset_carga`, `reaccion_participante`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `especie_pkey` | btree | PK | `USING btree (codigo)` |

## 2.6 Tabla `especie_atomo` {#t-especie_atomo}

**Descripción:** Átomos que componen cada especie y su posición relativa para dibujarla (relación N:M especie–elemento).

**Filas actuales:** 24

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `especie_codigo` | character varying(10) | No |  | PK, FK → especie(codigo) |  | Especie a la que pertenece el átomo. † |
| 2 | `posicion` | smallint | No |  | PK | `(posicion >= 1)` | Posición del átomo dentro de la especie (1, 2, …). † |
| 3 | `simbolo` | character varying(3) | No |  | FK → elemento(simbolo) |  | Elemento del átomo. † |
| 4 | `x` | numeric(5,1) | No |  |  |  | Desplazamiento horizontal relativo al centro de la molécula (px lógicos). † |
| 5 | `y` | numeric(5,1) | No |  |  |  | Desplazamiento vertical relativo al centro de la molécula (px lógicos). † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `especie_atomo_pkey` | PRIMARY KEY | `PRIMARY KEY (especie_codigo, posicion)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `especie_atomo_especie_codigo_fkey` | especie_codigo | `especie` (codigo) | CASCADE |
| `especie_atomo_simbolo_fkey` | simbolo | `elemento` (simbolo) | NO ACTION |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `especie_atomo_pkey` | btree | PK | `USING btree (especie_codigo, posicion)` |
| `ix_especie_atomo_simbolo` | btree | No | `USING btree (simbolo)` |

## 2.7 Tabla `evento` {#t-evento}

**Descripción:** Eventos de telemetría de producto (append-only). Índice BRIN por fecha: tabla grande y ordenada en el tiempo.

**Filas actuales:** 261

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | bigint | No | `IDENTITY` | PK |  | Identificador correlativo del evento. † |
| 2 | `sesion_id` | uuid | No |  | FK → sesion(id) |  | Sesión de uso en la que ocurrió el evento. † |
| 3 | `usuario_id` | bigint | Sí |  | FK → usuario(id) |  | Usuario autenticado, o nulo si el uso es anónimo. † |
| 4 | `tipo` | character varying(30) | No |  |  | `tipo IN ('pagina_vista', 'nivel_iniciado', 'paso_completado', 'pista_usada', 'nivel_completado', 'cuestionario_respondido', 'preset_cargado', 'chispa', 'reaccion_observada', 'quimi_consulta', 'insignia_obtenida', 'error_cliente')` | Tipo de evento de producto (lista cerrada; ver §6). † |
| 5 | `nivel_id` | smallint | Sí |  | FK → nivel(id) |  | Nivel relacionado con el evento, si aplica. † |
| 6 | `datos` | jsonb | No | `'{}'` |  |  | Carga útil libre en JSON (ej. {"paso":2,"segundos":31}). |
| 7 | `creado_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora del evento (base del índice BRIN). † |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `evento_nivel_id_fkey` | nivel_id | `nivel` (id) | NO ACTION |
| `evento_sesion_id_fkey` | sesion_id | `sesion` (id) | CASCADE |
| `evento_usuario_id_fkey` | usuario_id | `usuario` (id) | SET NULL |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `evento_pkey` | btree | PK | `USING btree (id)` |
| `ix_evento_creado` | brin | No | `USING brin (creado_en)` |
| `ix_evento_tipo_fecha` | btree | No | `USING btree (tipo, creado_en)` |

## 2.8 Tabla `fotolisis` {#t-fotolisis}

**Descripción:** Moléculas que se rompen con fotones de energía ≥ enlace (E = 119 627 / λ kJ/mol).

**Filas actuales:** 3

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `especie_codigo` | character varying(10) | No |  | PK, FK → especie(codigo) |  | Molécula que se rompe con luz UV. † |
| 2 | `enlace_kj_mol` | numeric(6,1) | No |  |  | `(enlace_kj_mol > (0)::numeric)` | Energía del enlace que se rompe (kJ/mol); umbral de energía del fotón. † |
| 3 | `seccion_eficaz` | numeric(7,5) | No |  |  | `(seccion_eficaz > (0)::numeric)` | Probabilidad relativa de absorción por fotogramas. |
| 4 | `etiqueta` | character varying(8) | No |  |  |  | Etiqueta corta mostrada en la interfaz (ej. Cl–Cl). † |
| 5 | `producto_1` | character varying(10) | No |  | FK → especie(codigo) |  | Primer fragmento producido. † |
| 6 | `producto_2` | character varying(10) | No |  | FK → especie(codigo) |  | Segundo fragmento producido. † |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `fotolisis_especie_codigo_fkey` | especie_codigo | `especie` (codigo) | NO ACTION |
| `fotolisis_producto_1_fkey` | producto_1 | `especie` (codigo) | NO ACTION |
| `fotolisis_producto_2_fkey` | producto_2 | `especie` (codigo) | NO ACTION |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `fotolisis_pkey` | btree | PK | `USING btree (especie_codigo)` |

## 2.9 Tabla `glosario` {#t-glosario}

**Descripción:** Términos que Quimi explica. Búsqueda de texto completo en español sin tildes (índice GIN).

**Filas actuales:** 39

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | smallint | No | `IDENTITY` | PK |  | Identificador del término. † |
| 2 | `termino` | character varying(60) | No |  | UQ |  | Término químico explicado por Quimi (único). † |
| 3 | `definicion` | text | No |  |  |  | Definición en lenguaje para escolares. † |
| 4 | `busqueda` | tsvector | Sí | `GENERADA: (setweight(to_tsvector('es_sin_tildes', (termino)), 'A') \|\| setweight(to_tsvector('es_sin_tildes', definicion), 'B'))` |  |  | Vector de búsqueda generado: término con peso A, definición con peso B. |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `glosario_pkey` | btree | PK | `USING btree (id)` |
| `glosario_termino_key` | btree | Sí | `USING btree (termino)` |
| `ix_glosario_busqueda` | gin | No | `USING gin (busqueda)` |

## 2.10 Tabla `insignia` {#t-insignia}

**Descripción:** Logros desbloqueables. fn_otorgar_insignias evalúa tipo/umbral contra el progreso del usuario.

**Filas actuales:** 8

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `codigo` | character varying(30) | No |  | PK |  | Código estable de la insignia. † |
| 2 | `nombre` | character varying(40) | No |  |  |  | Nombre visible de la insignia. † |
| 3 | `descripcion` | text | No |  |  |  | Qué hay que lograr para obtenerla. † |
| 4 | `icono` | character varying(20) | No |  |  |  | Nombre del ícono (lucide) que la representa. † |
| 5 | `tipo` | character varying(30) | No |  |  | `tipo IN ('niveles_completados', 'sin_pistas', 'racha', 'estrellas_totales', 'xp_total', 'cuestionarios_perfectos')` | Métrica que evalúa fn_otorgar_insignias (ver §6). † |
| 6 | `umbral` | integer | No |  |  | `(umbral > 0)` | Valor mínimo de la métrica para otorgarla. † |

**Referenciada por:** `logro_usuario`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `insignia_pkey` | btree | PK | `USING btree (codigo)` |

## 2.11 Tabla `intento` {#t-intento}

**Descripción:** Cada vez que un estudiante juega un nivel. Lo cierra fn_finalizar_intento (estrellas y XP).

**Filas actuales:** 73

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | bigint | No | `IDENTITY` | PK |  | Identificador del intento. † |
| 2 | `usuario_id` | bigint | No |  | FK → usuario(id) |  | Estudiante que juega el nivel. † |
| 3 | `nivel_id` | smallint | No |  | FK → nivel(id) |  | Nivel jugado. † |
| 4 | `estado` | character varying(12) | No | `'en_curso'` |  | `estado IN ('en_curso', 'completado', 'abandonado')` | en_curso, completado o abandonado. † |
| 5 | `iniciado_en` | timestamp with time zone | No | `now()` |  |  | Inicio del intento. † |
| 6 | `finalizado_en` | timestamp with time zone | Sí |  |  |  | Cierre del intento (nulo mientras está en curso; ck_intento_fin). † |
| 7 | `pasos_completados` | smallint | No | `0` |  | `(pasos_completados >= 0)` | Pasos completados en orden; lo incrementa fn_registrar_paso. † |
| 8 | `pistas_usadas` | smallint | No | `0` |  | `(pistas_usadas >= 0)` | Cantidad de ayudas abiertas; lo incrementa tg_pista_usada_contar. † |
| 9 | `xp_pistas` | smallint | No | `0` |  | `(xp_pistas >= 0)` | XP gastada en pistas durante el intento (la suma el trigger de pista_usada). |
| 10 | `aciertos` | smallint | No | `0` |  | `(aciertos >= 0)` | Respuestas correctas del cuestionario (las cuenta el trigger de respuesta). |
| 11 | `estrellas` | smallint | Sí |  |  | `((estrellas >= 1) AND (estrellas <= 3))` | Estrellas obtenidas (1–3); solo si está completado (ck_intento_estrellas). † |
| 12 | `xp_obtenido` | integer | Sí |  |  | `(xp_obtenido >= 0)` | XP ganada al cerrar el intento (fn_finalizar_intento). † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `ck_intento_estrellas` | CHECK | `CHECK ((((estado) = 'completado') = (estrellas IS NOT NULL)))` |
| `ck_intento_fin` | CHECK | `CHECK ((((estado) = 'en_curso') = (finalizado_en IS NULL)))` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `intento_nivel_id_fkey` | nivel_id | `nivel` (id) | NO ACTION |
| `intento_usuario_id_fkey` | usuario_id | `usuario` (id) | CASCADE |

**Referenciada por:** `intento_paso`, `pista_usada`, `respuesta`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `intento_pkey` | btree | PK | `USING btree (id)` |
| `ix_intento_completado` | btree | No | `USING btree (nivel_id, finalizado_en) WHERE ((estado)::text = 'completado'::text)` |
| `ix_intento_usuario_nivel` | btree | No | `USING btree (usuario_id, nivel_id)` |

## 2.12 Tabla `intento_paso` {#t-intento_paso}

**Descripción:** Pasos completados dentro de un intento y el tiempo que tomaron (métrica del dashboard).

**Filas actuales:** 205

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `intento_id` | bigint | No |  | PK, FK → intento(id) |  | Intento al que pertenece el paso completado. † |
| 2 | `paso_id` | integer | No |  | PK, FK → paso(id) |  | Paso completado. † |
| 3 | `segundos` | integer | No |  |  | `(segundos >= 0)` | Tiempo empleado en el paso, en segundos. † |
| 4 | `completado_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora en que se completó el paso. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `intento_paso_pkey` | PRIMARY KEY | `PRIMARY KEY (intento_id, paso_id)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `intento_paso_intento_id_fkey` | intento_id | `intento` (id) | CASCADE |
| `intento_paso_paso_id_fkey` | paso_id | `paso` (id) | NO ACTION |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `intento_paso_pkey` | btree | PK | `USING btree (intento_id, paso_id)` |
| `ix_intento_paso_paso` | btree | No | `USING btree (paso_id)` |

## 2.13 Tabla `logro_usuario` {#t-logro_usuario}

**Descripción:** Insignias obtenidas por cada usuario.

**Filas actuales:** 52

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `usuario_id` | bigint | No |  | PK, FK → usuario(id) |  | Usuario que obtuvo la insignia. † |
| 2 | `insignia_codigo` | character varying(30) | No |  | PK, FK → insignia(codigo) |  | Insignia obtenida. † |
| 3 | `obtenido_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora de obtención. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `logro_usuario_pkey` | PRIMARY KEY | `PRIMARY KEY (usuario_id, insignia_codigo)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `logro_usuario_insignia_codigo_fkey` | insignia_codigo | `insignia` (codigo) | NO ACTION |
| `logro_usuario_usuario_id_fkey` | usuario_id | `usuario` (id) | CASCADE |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `logro_usuario_pkey` | btree | PK | `USING btree (usuario_id, insignia_codigo)` |

## 2.14 Tabla `matricula` {#t-matricula}

**Descripción:** Pertenencia de estudiantes a aulas (relación N:M).

**Filas actuales:** 13

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `aula_id` | integer | No |  | PK, FK → aula(id) |  | Aula. † |
| 2 | `estudiante_id` | bigint | No |  | PK, FK → usuario(id) |  | Estudiante matriculado. † |
| 3 | `unido_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora en que se unió con el código. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `matricula_pkey` | PRIMARY KEY | `PRIMARY KEY (aula_id, estudiante_id)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `matricula_aula_id_fkey` | aula_id | `aula` (id) | CASCADE |
| `matricula_estudiante_id_fkey` | estudiante_id | `usuario` (id) | CASCADE |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `matricula_pkey` | btree | PK | `USING btree (aula_id, estudiante_id)` |
| `ix_matricula_estudiante` | btree | No | `USING btree (estudiante_id)` |

## 2.15 Tabla `mision` {#t-mision}

**Descripción:** Capítulos temáticos que agrupan niveles (ej. La materia y sus estados).

**Filas actuales:** 4

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | smallint | No | `IDENTITY` | PK |  | Identificador de la misión. † |
| 2 | `codigo` | character varying(20) | No |  | UQ |  | Código estable de la misión (estados, combustion, familias, luz). † |
| 3 | `titulo` | character varying(60) | No |  |  |  | Título visible de la misión. † |
| 4 | `descripcion` | text | No |  |  |  | Descripción para el estudiante. † |
| 5 | `competencia` | text | No |  |  |  | Competencia del CNEB (MINEDU) que desarrolla la misión. |
| 6 | `color` | character varying(20) | No |  |  |  | Token de color de la categoría en el mapa (estados, combustion, familias, luz). |
| 7 | `orden` | smallint | No |  | UQ |  | Orden de la misión en el mapa. † |

**Referenciada por:** `nivel`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `mision_pkey` | btree | PK | `USING btree (id)` |
| `mision_codigo_key` | btree | Sí | `USING btree (codigo)` |
| `mision_orden_key` | btree | Sí | `USING btree (orden)` |

## 2.16 Tabla `nivel` {#t-nivel}

**Descripción:** Nivel jugable: una práctica guiada ubicada en una casilla de la tabla periódica.

**Filas actuales:** 9

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | smallint | No | `IDENTITY` | PK |  | Identificador del nivel. † |
| 2 | `codigo` | character varying(30) | No |  | UQ |  | Código estable del nivel (ej. n01-movimiento). † |
| 3 | `mision_id` | smallint | No |  | FK → mision(id) |  | Misión a la que pertenece. † |
| 4 | `orden` | smallint | No |  | UQ | `(orden >= 1)` | Orden global del nivel (secuencia de desbloqueo). † |
| 5 | `titulo` | character varying(80) | No |  |  |  | Título visible del nivel. † |
| 6 | `resumen` | text | No |  |  |  | Resumen corto mostrado en el mapa. † |
| 7 | `objetivo` | text | No |  |  |  | Objetivo de aprendizaje del nivel. † |
| 8 | `grado` | smallint | No |  |  | `((grado >= 1) AND (grado <= 5))` | Grado de secundaria sugerido (1–5). † |
| 9 | `xp_base` | smallint | No |  |  | `(xp_base > 0)` | XP base que otorga el nivel con 3 estrellas. † |
| 10 | `minutos_estim` | smallint | No |  |  | `(minutos_estim > 0)` | Duración estimada en minutos. † |
| 11 | `casilla_simbolo` | character varying(3) | No |  |  |  | Símbolo del elemento de la casilla donde se ubica el nivel en el mapa. |
| 12 | `casilla_fila` | smallint | No |  | UQ(ux_nivel_casilla) | `((casilla_fila >= 1) AND (casilla_fila <= 7))` | Fila (periodo) de la casilla en la tabla periódica (1–7). † |
| 13 | `casilla_columna` | smallint | No |  | UQ(ux_nivel_casilla) | `((casilla_columna >= 1) AND (casilla_columna <= 18))` | Columna (grupo) de la casilla en la tabla periódica (1–18). † |
| 14 | `casilla_nota` | text | No |  |  |  | Dato curioso del elemento de la casilla. † |
| 15 | `inicio` | jsonb | No |  |  | `(jsonb_exists(inicio, 'parametros') AND jsonb_exists(inicio, 'carga'))` | Estado inicial del simulador: {parametros:{T,P,V,UV,lambda}, carga:{especie:cantidad}}. |
| 16 | `controles` | text[] | No |  |  |  | Controles habilitados en el nivel (T, P, V, UV, lambda, inyectar, chispa). |
| 17 | `especies` | text[] | No |  |  |  | Especies que el estudiante puede inyectar en el nivel. |
| 18 | `nivel_previo_id` | smallint | Sí |  | FK → nivel(id) |  | Nivel que debe completarse para desbloquear este (nulo = disponible desde el inicio). |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_nivel_casilla` | UNIQUE | `UNIQUE (casilla_fila, casilla_columna)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `nivel_mision_id_fkey` | mision_id | `mision` (id) | NO ACTION |
| `nivel_nivel_previo_id_fkey` | nivel_previo_id | `nivel` (id) | NO ACTION |

**Referenciada por:** `aula_nivel`, `evento`, `intento`, `paso`, `pregunta`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `nivel_pkey` | btree | PK | `USING btree (id)` |
| `ix_nivel_mision` | btree | No | `USING btree (mision_id)` |
| `nivel_codigo_key` | btree | Sí | `USING btree (codigo)` |
| `nivel_orden_key` | btree | Sí | `USING btree (orden)` |
| `ux_nivel_casilla` | btree | Sí | `USING btree (casilla_fila, casilla_columna)` |

**Triggers**

| Trigger | Momento | Evento | Función |
|---|---|---|---|
| `tg_nivel_auditoria` | AFTER | UPDATE OR DELETE (FOR EACH ROW) | `fn_auditar()` |

## 2.17 Tabla `opcion` {#t-opcion}

**Descripción:** Alternativas de cada pregunta. El índice parcial ux_opcion_una_correcta garantiza a lo más una correcta.

**Filas actuales:** 85

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | integer | No | `IDENTITY` | PK |  | Identificador de la alternativa. † |
| 2 | `pregunta_id` | integer | No |  | UQ(ux_opcion_pregunta_orden), FK → pregunta(id), UQ (ux_opcion_una_correcta) |  | Pregunta a la que pertenece. † |
| 3 | `orden` | smallint | No |  | UQ(ux_opcion_pregunta_orden) | `(orden >= 1)` | Orden de la alternativa (1, 2, 3…). † |
| 4 | `texto` | text | No |  |  |  | Texto de la alternativa. † |
| 5 | `es_correcta` | boolean | No | `false` |  |  | Indica la alternativa correcta (a lo más una por pregunta); nunca se envía al cliente. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_opcion_pregunta_orden` | UNIQUE | `UNIQUE (pregunta_id, orden)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `opcion_pregunta_id_fkey` | pregunta_id | `pregunta` (id) | CASCADE |

**Referenciada por:** `respuesta`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `opcion_pkey` | btree | PK | `USING btree (id)` |
| `ux_opcion_pregunta_orden` | btree | Sí | `USING btree (pregunta_id, orden)` |
| `ux_opcion_una_correcta` | btree | Sí | `USING btree (pregunta_id) WHERE es_correcta` |

## 2.18 Tabla `paso` {#t-paso}

**Descripción:** Paso de un nivel. La condición se evalúa en el motor del simulador (DSL {todas\|alguna:[{metrica, op, valor}]}).

**Filas actuales:** 29

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | integer | No | `IDENTITY` | PK |  | Identificador del paso. † |
| 2 | `nivel_id` | smallint | No |  | UQ(ux_paso_nivel_orden), FK → nivel(id) |  | Nivel al que pertenece. † |
| 3 | `orden` | smallint | No |  | UQ(ux_paso_nivel_orden) | `(orden >= 1)` | Orden del paso dentro del nivel. † |
| 4 | `titulo` | character varying(60) | No |  |  |  | Título corto del paso. † |
| 5 | `instruccion` | text | No |  |  |  | Instrucción que ve el estudiante. † |
| 6 | `concepto` | text | No |  |  |  | Explicación del concepto científico para escolares. |
| 7 | `condicion` | jsonb | No |  |  | `((jsonb_typeof(condicion) = 'object') AND (jsonb_exists(condicion, 'todas') OR jsonb_exists(condicion, 'alguna')))` | Regla verificable, ej. {"todas":[{"metrica":"temperatura","op":">=","valor":600}],"durante":2}. |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_paso_nivel_orden` | UNIQUE | `UNIQUE (nivel_id, orden)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `paso_nivel_id_fkey` | nivel_id | `nivel` (id) | CASCADE |

**Referenciada por:** `intento_paso`, `pista`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `paso_pkey` | btree | PK | `USING btree (id)` |
| `ux_paso_nivel_orden` | btree | Sí | `USING btree (nivel_id, orden)` |

**Triggers**

| Trigger | Momento | Evento | Función |
|---|---|---|---|
| `tg_paso_auditoria` | AFTER | UPDATE OR DELETE (FOR EACH ROW) | `fn_auditar()` |

## 2.19 Tabla `pista` {#t-pista}

**Descripción:** Ayudas de Quimi por paso: 1 = pista, 2 = explicación, 3 = solución. Cada una cuesta XP.

**Filas actuales:** 87

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | integer | No | `IDENTITY` | PK |  | Identificador de la ayuda. † |
| 2 | `paso_id` | integer | No |  | UQ(ux_pista_paso_nivel), FK → paso(id) |  | Paso al que pertenece. † |
| 3 | `nivel_ayuda` | smallint | No |  | UQ(ux_pista_paso_nivel) | `((nivel_ayuda >= 1) AND (nivel_ayuda <= 3))` | 1 = pista, 2 = explicación, 3 = solución. † |
| 4 | `texto` | text | No |  |  |  | Texto de la ayuda; solo se entrega mediante fn_usar_pista. † |
| 5 | `costo_xp` | smallint | No |  |  | `(costo_xp >= 0)` | XP que se descuenta al abrirla por primera vez. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_pista_paso_nivel` | UNIQUE | `UNIQUE (paso_id, nivel_ayuda)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `pista_paso_id_fkey` | paso_id | `paso` (id) | CASCADE |

**Referenciada por:** `pista_usada`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `pista_pkey` | btree | PK | `USING btree (id)` |
| `ux_pista_paso_nivel` | btree | Sí | `USING btree (paso_id, nivel_ayuda)` |

## 2.20 Tabla `pista_usada` {#t-pista_usada}

**Descripción:** Pistas de Quimi que el estudiante abrió en un intento (una vez por pista).

**Filas actuales:** 46

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `intento_id` | bigint | No |  | PK, FK → intento(id) |  | Intento en que se abrió la ayuda. † |
| 2 | `pista_id` | integer | No |  | PK, FK → pista(id) |  | Ayuda abierta. † |
| 3 | `usada_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora de apertura. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `pista_usada_pkey` | PRIMARY KEY | `PRIMARY KEY (intento_id, pista_id)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `pista_usada_intento_id_fkey` | intento_id | `intento` (id) | CASCADE |
| `pista_usada_pista_id_fkey` | pista_id | `pista` (id) | NO ACTION |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `pista_usada_pkey` | btree | PK | `USING btree (intento_id, pista_id)` |

**Triggers**

| Trigger | Momento | Evento | Función |
|---|---|---|---|
| `tg_pista_usada_contar` | AFTER | INSERT (FOR EACH ROW) | `fn_tg_pista_usada_contar()` |

## 2.21 Tabla `pregunta` {#t-pregunta}

**Descripción:** Preguntas del cuestionario de cierre de cada nivel.

**Filas actuales:** 27

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | integer | No | `IDENTITY` | PK |  | Identificador de la pregunta. † |
| 2 | `nivel_id` | smallint | No |  | UQ(ux_pregunta_nivel_orden), FK → nivel(id) |  | Nivel al que pertenece. † |
| 3 | `orden` | smallint | No |  | UQ(ux_pregunta_nivel_orden) | `(orden >= 1)` | Orden de la pregunta en el cuestionario. † |
| 4 | `enunciado` | text | No |  |  |  | Enunciado de la pregunta. † |
| 5 | `explicacion` | text | No |  |  |  | Retroalimentación inmediata mostrada tras responder. |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_pregunta_nivel_orden` | UNIQUE | `UNIQUE (nivel_id, orden)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `pregunta_nivel_id_fkey` | nivel_id | `nivel` (id) | CASCADE |

**Referenciada por:** `opcion`, `respuesta`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `pregunta_pkey` | btree | PK | `USING btree (id)` |
| `ux_pregunta_nivel_orden` | btree | Sí | `USING btree (nivel_id, orden)` |

## 2.22 Tabla `preset` {#t-preset}

**Descripción:** Experimentos listos para cargar en el laboratorio libre.

**Filas actuales:** 4

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `codigo` | character varying(20) | No |  | PK |  | Código estable del experimento predefinido. † |
| 2 | `nombre` | character varying(60) | No |  |  |  | Nombre visible del experimento. † |
| 3 | `ecuacion` | character varying(40) | No |  |  |  | Ecuación química mostrada. † |
| 4 | `sobre_flecha` | character varying(20) | No | `''` |  |  | Condición escrita sobre la flecha (ej. hν, chispa). † |
| 5 | `etiqueta` | character varying(30) | No |  |  |  | Etiqueta corta del botón. † |
| 6 | `pista` | text | No |  |  |  | Sugerencia de qué observar. † |
| 7 | `parametros` | jsonb | No |  |  | `jsonb_exists_all(parametros, ARRAY['T', 'P', 'V', 'UV', 'lambda'])` | Condiciones iniciales {T (K), P (atm), V (L), UV (W/m²), lambda (nm)}. |
| 8 | `pasos` | jsonb | No | `'[]'` |  | `(jsonb_typeof(pasos) = 'array')` | Mecanismo para el perfil energético: [[codigo_reaccion, coeficiente], ...]. |
| 9 | `orden` | smallint | No |  |  |  | Orden de presentación. † |

**Referenciada por:** `preset_carga`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `preset_pkey` | btree | PK | `USING btree (codigo)` |

## 2.23 Tabla `preset_carga` {#t-preset_carga}

**Descripción:** Partículas que se inyectan al cargar un preset.

**Filas actuales:** 8

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `preset_codigo` | character varying(20) | No |  | PK, FK → preset(codigo) |  | Experimento predefinido. † |
| 2 | `especie_codigo` | character varying(10) | No |  | PK, FK → especie(codigo) |  | Especie que se inyecta. † |
| 3 | `cantidad` | smallint | No |  |  | `((cantidad >= 1) AND (cantidad <= 500))` | Número de partículas (1–500). † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `preset_carga_pkey` | PRIMARY KEY | `PRIMARY KEY (preset_codigo, especie_codigo)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `preset_carga_especie_codigo_fkey` | especie_codigo | `especie` (codigo) | NO ACTION |
| `preset_carga_preset_codigo_fkey` | preset_codigo | `preset` (codigo) | CASCADE |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `preset_carga_pkey` | btree | PK | `USING btree (preset_codigo, especie_codigo)` |

## 2.24 Tabla `reaccion` {#t-reaccion}

**Descripción:** Reacciones elementales que el motor evalúa en cada colisión. ΔH se calcula en la vista v_reaccion_entalpia.

**Filas actuales:** 12

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `codigo` | character varying(12) | No |  | PK |  | Código estable de la reacción (ej. co2). † |
| 2 | `etiqueta` | character varying(40) | No |  |  |  | Etiqueta legible de la reacción. † |
| 3 | `ea_kj_mol` | numeric(6,2) | No |  |  | `(ea_kj_mol >= (0)::numeric)` | Energía de activación del modelo (valor pedagógico, kJ/mol). |
| 4 | `factor_esterico` | numeric(4,3) | No |  |  | `((factor_esterico > (0)::numeric) AND (factor_esterico <= (1)::numeric))` | Probabilidad de orientación favorable (0–1]. |
| 5 | `enlace` | character varying(8) | No |  |  |  | Enlace que se forma (ej. H–O). |

**Referenciada por:** `reaccion_participante`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `reaccion_pkey` | btree | PK | `USING btree (codigo)` |

## 2.25 Tabla `reaccion_participante` {#t-reaccion_participante}

**Descripción:** Especies que participan en cada reacción como reactivo o producto (máx. 2 por lado).

**Filas actuales:** 41

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `reaccion_codigo` | character varying(12) | No |  | PK, FK → reaccion(codigo) |  | Reacción. † |
| 2 | `papel` | character varying(9) | No |  | PK | `papel IN ('reactivo', 'producto')` | reactivo o producto. † |
| 3 | `posicion` | smallint | No |  | PK | `((posicion >= 1) AND (posicion <= 2))` | Posición dentro de su lado de la ecuación (1–2). † |
| 4 | `especie_codigo` | character varying(10) | No |  | FK → especie(codigo) |  | Especie participante. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `reaccion_participante_pkey` | PRIMARY KEY | `PRIMARY KEY (reaccion_codigo, papel, posicion)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `reaccion_participante_especie_codigo_fkey` | especie_codigo | `especie` (codigo) | NO ACTION |
| `reaccion_participante_reaccion_codigo_fkey` | reaccion_codigo | `reaccion` (codigo) | CASCADE |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `reaccion_participante_pkey` | btree | PK | `USING btree (reaccion_codigo, papel, posicion)` |
| `ix_participante_especie` | btree | No | `USING btree (especie_codigo)` |

## 2.26 Tabla `respuesta` {#t-respuesta}

**Descripción:** Respuesta elegida en el cuestionario. es_correcta la fija un trigger desde opcion (no confía en el cliente).

**Filas actuales:** 195

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `intento_id` | bigint | No |  | PK, FK → intento(id) |  | Intento en que se respondió. † |
| 2 | `pregunta_id` | integer | No |  | PK, FK → pregunta(id) |  | Pregunta respondida (una respuesta por pregunta e intento). † |
| 3 | `opcion_id` | integer | No |  | FK → opcion(id) |  | Alternativa elegida. † |
| 4 | `es_correcta` | boolean | No | `false` |  |  | Resultado; lo fija tg_respuesta_validar desde opcion (ignora el valor del cliente). † |
| 5 | `respondida_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora de la respuesta. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `respuesta_pkey` | PRIMARY KEY | `PRIMARY KEY (intento_id, pregunta_id)` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `respuesta_intento_id_fkey` | intento_id | `intento` (id) | CASCADE |
| `respuesta_opcion_id_fkey` | opcion_id | `opcion` (id) | NO ACTION |
| `respuesta_pregunta_id_fkey` | pregunta_id | `pregunta` (id) | NO ACTION |

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `respuesta_pkey` | btree | PK | `USING btree (intento_id, pregunta_id)` |
| `ix_respuesta_pregunta` | btree | No | `USING btree (pregunta_id) WHERE (NOT es_correcta)` |

**Triggers**

| Trigger | Momento | Evento | Función |
|---|---|---|---|
| `tg_respuesta_contar` | AFTER | INSERT (FOR EACH ROW) | `fn_tg_respuesta_contar()` |
| `tg_respuesta_validar` | BEFORE | INSERT (FOR EACH ROW) | `fn_tg_respuesta_validar()` |

## 2.27 Tabla `rol` {#t-rol}

**Descripción:** Roles de acceso de la aplicación (estudiante, docente, administrador).

**Filas actuales:** 3

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | smallint | No | `IDENTITY` | PK |  | Identificador del rol. † |
| 2 | `codigo` | character varying(20) | No |  | UQ | `codigo IN ('estudiante', 'docente', 'admin')` | Código estable usado por la API para autorizar (estudiante\|docente\|admin). |
| 3 | `nombre` | character varying(40) | No |  |  |  | Nombre legible del rol. |

**Referenciada por:** `usuario`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `rol_pkey` | btree | PK | `USING btree (id)` |
| `rol_codigo_key` | btree | Sí | `USING btree (codigo)` |

## 2.28 Tabla `sesion` {#t-sesion}

**Descripción:** Sesión de uso (anónima o autenticada) desde la web, VS Code, Claude Code o MCP.

**Filas actuales:** 66

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | uuid | No |  | PK |  | UUID generado por el cliente; permite registrar uso anónimo sin datos personales. |
| 2 | `usuario_id` | bigint | Sí |  | FK → usuario(id) |  | Usuario autenticado, o nulo si la sesión es anónima. † |
| 3 | `origen` | character varying(10) | No | `'web'` |  | `origen IN ('web', 'vscode', 'claude', 'mcp')` | Canal de uso: web, vscode, claude o mcp. † |
| 4 | `dispositivo` | character varying(10) | No | `'escritorio'` |  | `dispositivo IN ('escritorio', 'tablet', 'movil')` | Tipo de dispositivo: escritorio, tablet o movil. † |
| 5 | `iniciada_en` | timestamp with time zone | No | `now()` |  |  | Inicio de la sesión (base del índice BRIN). † |
| 6 | `ultima_actividad` | timestamp with time zone | No | `now()` |  |  | Última actividad registrada (≥ iniciada_en). † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `ck_sesion_fechas` | CHECK | `CHECK ((ultima_actividad >= iniciada_en))` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `sesion_usuario_id_fkey` | usuario_id | `usuario` (id) | SET NULL |

**Referenciada por:** `evento`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `sesion_pkey` | btree | PK | `USING btree (id)` |
| `ix_sesion_inicio` | brin | No | `USING brin (iniciada_en)` |
| `ix_sesion_usuario` | btree | No | `USING btree (usuario_id)` |

## 2.29 Tabla `usuario` {#t-usuario}

**Descripción:** Cuentas de estudiantes, docentes y administradores, con su experiencia (XP) y racha.

**Filas actuales:** 15

**Columnas**

| N.° | Columna | Tipo | Nulo | Defecto | Clave | Restricción CHECK | Descripción |
|---|---|---|---|---|---|---|---|
| 1 | `id` | bigint | No | `IDENTITY` | PK |  | Identificador del usuario. † |
| 2 | `email` | character varying(120) | No |  |  | `((email) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')` | Correo de acceso; único sin distinguir mayúsculas (índice ux_usuario_email). |
| 3 | `nombre` | character varying(80) | No |  |  | `(length(TRIM(BOTH FROM nombre)) >= 2)` | Nombre o alias visible (mínimo 2 caracteres); el ranking usa este valor. † |
| 4 | `password_hash` | character varying(100) | No |  |  |  | Hash bcrypt de la contraseña (nunca se guarda en texto plano). |
| 5 | `rol_id` | smallint | No |  | FK → rol(id) |  | Rol de acceso. † |
| 6 | `grado` | smallint | Sí |  |  | `((grado >= 1) AND (grado <= 5))` | Grado de secundaria (1–5). Nulo para docentes y administradores. |
| 7 | `xp` | integer | No | `0` |  | `(xp >= 0)` | Experiencia acumulada; la actualiza fn_finalizar_intento. |
| 8 | `racha_actual` | smallint | No | `0` |  | `(racha_actual >= 0)` | Días consecutivos con al menos un nivel terminado. |
| 9 | `racha_maxima` | smallint | No | `0` |  |  | Mejor racha histórica. |
| 10 | `ultimo_dia_activo` | date | Sí |  |  |  | Último día (America/Lima) en que terminó un nivel; base del cálculo de racha. |
| 11 | `activo` | boolean | No | `true` |  |  | Si la cuenta puede iniciar sesión. † |
| 12 | `creado_en` | timestamp with time zone | No | `now()` |  |  | Fecha y hora de registro. † |
| 13 | `actualizado_en` | timestamp with time zone | No | `now()` |  |  | Última modificación; la mantiene tg_usuario_actualizado. † |

**Restricciones de tabla**

| Restricción | Tipo | Definición |
|---|---|---|
| `usuario_check` | CHECK | `CHECK ((racha_maxima >= racha_actual))` |

**Claves foráneas**

| Restricción | Columnas | Referencia | ON DELETE |
|---|---|---|---|
| `usuario_rol_id_fkey` | rol_id | `rol` (id) | NO ACTION |

**Referenciada por:** `aula`, `evento`, `intento`, `logro_usuario`, `matricula`, `sesion`

**Índices**

| Índice | Método | Único | Definición |
|---|---|---|---|
| `usuario_pkey` | btree | PK | `USING btree (id)` |
| `ix_usuario_rol` | btree | No | `USING btree (rol_id)` |
| `ux_usuario_email` | btree | Sí | `USING btree (lower((email)::text))` |

**Triggers**

| Trigger | Momento | Evento | Función |
|---|---|---|---|
| `tg_usuario_actualizado` | BEFORE | UPDATE (FOR EACH ROW) | `fn_tg_actualizado_en()` |
| `tg_usuario_auditoria` | AFTER | INSERT OR UPDATE OR DELETE (FOR EACH ROW) | `fn_auditar()` |

# 3. Vistas

## 3.1 Vista `v_estadisticas_nivel`

**Descripción:** Tasa de completado, estrellas, pistas y minutos promedio por nivel.

**Tipo:** Vista (se calcula en cada consulta)

| N.° | Columna | Tipo |
|---|---|---|
| 1 | `nivel_id` | smallint |
| 2 | `codigo` | character varying(30) |
| 3 | `titulo` | character varying(80) |
| 4 | `orden` | smallint |
| 5 | `intentos` | integer |
| 6 | `completados` | integer |
| 7 | `tasa_completado` | numeric |
| 8 | `estrellas_promedio` | numeric |
| 9 | `pistas_promedio` | numeric |
| 10 | `minutos_promedio` | numeric |

## 3.2 Vista `v_preguntas_dificiles`

**Descripción:** Porcentaje de error por pregunta del cuestionario (errores más comunes).

**Tipo:** Vista (se calcula en cada consulta)

| N.° | Columna | Tipo |
|---|---|---|
| 1 | `pregunta_id` | integer |
| 2 | `nivel_codigo` | character varying(30) |
| 3 | `enunciado` | text |
| 4 | `respuestas` | integer |
| 5 | `porcentaje_error` | numeric |

## 3.3 Vista `v_progreso_estudiante`

**Descripción:** Resumen de progreso de cada estudiante (mejor puntaje por nivel).

**Tipo:** Vista (se calcula en cada consulta)

| N.° | Columna | Tipo |
|---|---|---|
| 1 | `usuario_id` | bigint |
| 2 | `nombre` | character varying(80) |
| 3 | `grado` | smallint |
| 4 | `xp` | integer |
| 5 | `racha_actual` | smallint |
| 6 | `racha_maxima` | smallint |
| 7 | `niveles_completados` | integer |
| 8 | `estrellas_totales` | integer |
| 9 | `insignias` | integer |
| 10 | `ultima_actividad` | timestamp with time zone |

## 3.4 Vista `v_ranking_aula`

**Descripción:** Ranking de estudiantes dentro de cada aula (RANK sobre XP y estrellas).

**Tipo:** Vista (se calcula en cada consulta)

| N.° | Columna | Tipo |
|---|---|---|
| 1 | `aula_id` | integer |
| 2 | `usuario_id` | bigint |
| 3 | `nombre` | character varying(80) |
| 4 | `xp` | integer |
| 5 | `estrellas_totales` | integer |
| 6 | `niveles_completados` | integer |
| 7 | `puesto` | bigint |

## 3.5 Vista `v_reaccion_entalpia`

**Descripción:** Reacciones con ecuación legible y ΔH derivado de las entalpías de formación (no se almacena: evita redundancia, 3FN).

**Tipo:** Vista (se calcula en cada consulta)

| N.° | Columna | Tipo |
|---|---|---|
| 1 | `codigo` | character varying(12) |
| 2 | `etiqueta` | character varying(40) |
| 3 | `ea_kj_mol` | numeric(6,2) |
| 4 | `factor_esterico` | numeric(4,3) |
| 5 | `enlace` | character varying(8) |
| 6 | `ecuacion` | text |
| 7 | `delta_h_kj_mol` | numeric(8,2) |
| 8 | `tipo` | text |

## 3.6 Vista `v_tiempo_por_paso`

**Descripción:** Tiempo promedio y mediana por paso: detecta pasos difíciles.

**Tipo:** Vista (se calcula en cada consulta)

| N.° | Columna | Tipo |
|---|---|---|
| 1 | `paso_id` | integer |
| 2 | `nivel_codigo` | character varying(30) |
| 3 | `orden` | smallint |
| 4 | `titulo` | character varying(60) |
| 5 | `veces` | integer |
| 6 | `segundos_promedio` | numeric |
| 7 | `segundos_mediana` | double precision |

## 3.7 Vista `mv_uso_diario`

**Descripción:** Uso de los últimos 30 días para el dashboard. Se refresca con fn_refrescar_dashboard() (REFRESH CONCURRENTLY).

**Tipo:** Vista materializada (se guarda; se refresca con `fn_refrescar_dashboard()`)

| N.° | Columna | Tipo |
|---|---|---|
| 1 | `dia` | date |
| 2 | `sesiones` | integer |
| 3 | `usuarios_activos` | integer |
| 4 | `eventos` | integer |
| 5 | `niveles_completados` | integer |
| 6 | `pistas_usadas` | integer |

**Índices:** `ux_mv_uso_diario_dia` (btree (dia))

# 4. Funciones

## 4.1 Funciones de negocio

| N.° | Función | Parámetros | Retorna | Lenguaje | Volatilidad | Descripción |
|---|---|---|---|---|---|---|
| 1 | `fn_actualizar_racha` | p_usuario bigint, p_hoy date DEFAULT ((now() AT TIME ZONE 'America/Lima'::text))::date | smallint | plpgsql | VOLATILE | Actualiza la racha: +1 si jugó ayer, se reinicia a 1 si hubo un día sin jugar. |
| 2 | `fn_calcular_estrellas` | p_max_ayuda smallint, p_aciertos smallint, p_total_preguntas smallint | smallint | plpgsql | IMMUTABLE | Regla de estrellas (1–3) según ayudas usadas y aciertos del cuestionario. |
| 3 | `fn_finalizar_intento` | p_intento bigint | TABLE(estrellas smallint, xp_obtenido integer, xp_total integer, racha smallint, es_repeticion boolean, insignias_nuevas text[]) | plpgsql | VOLATILE | Cierra un intento en una sola transacción y devuelve estrellas, XP, racha e insignias nuevas. |
| 4 | `fn_generar_codigo_aula` |  | character | plpgsql | VOLATILE | Código de aula único de 6 caracteres sin letras ambiguas (sin I, O, 0, 1). |
| 5 | `fn_otorgar_insignias` | p_usuario bigint | text[] | plpgsql | VOLATILE | Otorga las insignias cuyo umbral ya alcanzó el usuario; idempotente. |
| 6 | `fn_quimi_buscar` | p_consulta text, p_limite integer DEFAULT 3 | TABLE(termino character varying, definicion text, relevancia real) | sql | STABLE | Motor de respuestas de Quimi: búsqueda de texto completo en el glosario, ordenada por relevancia. |
| 7 | `fn_refrescar_dashboard` |  | void | plpgsql | VOLATILE | Refresca mv_uso_diario sin bloquear lecturas. |
| 8 | `fn_registrar_paso` | p_intento bigint, p_paso integer, p_segundos integer | smallint | plpgsql | VOLATILE | Marca un paso como completado validando pertenencia y orden secuencial. |
| 9 | `fn_usar_pista` | p_intento bigint, p_paso integer, p_nivel_ayuda smallint | TABLE(pista_id integer, texto text, costo_xp smallint, ya_usada boolean) | plpgsql | VOLATILE | Entrega una ayuda de Quimi respetando el orden pista → explicación → solución. |

## 4.2 Funciones de trigger

| N.° | Función | Lenguaje | Usada por | Propósito |
|---|---|---|---|---|
| 1 | `fn_auditar()` | plpgsql | `tg_aula_auditoria`, `tg_nivel_auditoria`, `tg_paso_auditoria`, `tg_usuario_auditoria` | Auditoría genérica: guarda la fila antes/después en JSON en la tabla auditoria, ocultando password_hash; ignora UPDATE sin cambios. † |
| 2 | `fn_tg_actualizado_en()` | plpgsql | `tg_usuario_actualizado` | Asigna now() a actualizado_en antes de cada actualización. † |
| 3 | `fn_tg_aula_codigo()` | plpgsql | `tg_aula_codigo` | Genera el código del aula con fn_generar_codigo_aula() si llega vacío. † |
| 4 | `fn_tg_aula_docente()` | plpgsql | `tg_aula_docente` | Solo un usuario con rol docente o admin puede ser dueño de un aula (RAISE P0001 si no). † |
| 5 | `fn_tg_pista_usada_contar()` | plpgsql | `tg_pista_usada_contar` | Suma 1 a intento.pistas_usadas y el costo de la pista a intento.xp_pistas. † |
| 6 | `fn_tg_respuesta_contar()` | plpgsql | `tg_respuesta_contar` | Suma 1 a intento.aciertos cuando la respuesta insertada es correcta. † |
| 7 | `fn_tg_respuesta_validar()` | plpgsql | `tg_respuesta_validar` | La corrección la decide la BD: busca opcion.es_correcta, verifica que la opción pertenezca a la pregunta del nivel del intento y sobrescribe es_correcta. † |

# 5. Triggers

| N.° | Trigger | Tabla | Momento | Evento | Función |
|---|---|---|---|---|---|
| 1 | `tg_aula_auditoria` | `aula` | AFTER | INSERT OR UPDATE OR DELETE | `fn_auditar()` |
| 2 | `tg_aula_codigo` | `aula` | BEFORE | INSERT | `fn_tg_aula_codigo()` |
| 3 | `tg_aula_docente` | `aula` | BEFORE | INSERT OR UPDATE OF docente_id | `fn_tg_aula_docente()` |
| 4 | `tg_nivel_auditoria` | `nivel` | AFTER | UPDATE OR DELETE | `fn_auditar()` |
| 5 | `tg_paso_auditoria` | `paso` | AFTER | UPDATE OR DELETE | `fn_auditar()` |
| 6 | `tg_pista_usada_contar` | `pista_usada` | AFTER | INSERT | `fn_tg_pista_usada_contar()` |
| 7 | `tg_respuesta_contar` | `respuesta` | AFTER | INSERT | `fn_tg_respuesta_contar()` |
| 8 | `tg_respuesta_validar` | `respuesta` | BEFORE | INSERT | `fn_tg_respuesta_validar()` |
| 9 | `tg_usuario_actualizado` | `usuario` | BEFORE | UPDATE | `fn_tg_actualizado_en()` |
| 10 | `tg_usuario_auditoria` | `usuario` | AFTER | INSERT OR UPDATE OR DELETE | `fn_auditar()` |

# 6. Dominios de valores enumerados

Valores permitidos por restricciones `CHECK (... IN (...))` o `= ANY (ARRAY[...])`.

| Tabla | Columna | Valores permitidos |
|---|---|---|
| `auditoria` | `operacion` | `I`, `U`, `D` |
| `evento` | `tipo` | `pagina_vista`, `nivel_iniciado`, `paso_completado`, `pista_usada`, `nivel_completado`, `cuestionario_respondido`, `preset_cargado`, `chispa`, `reaccion_observada`, `quimi_consulta`, `insignia_obtenida`, `error_cliente` |
| `insignia` | `tipo` | `niveles_completados`, `sin_pistas`, `racha`, `estrellas_totales`, `xp_total`, `cuestionarios_perfectos` |
| `intento` | `estado` | `en_curso`, `completado`, `abandonado` |
| `reaccion_participante` | `papel` | `reactivo`, `producto` |
| `rol` | `codigo` | `estudiante`, `docente`, `admin` |
| `sesion` | `dispositivo` | `escritorio`, `tablet`, `movil` |
| `sesion` | `origen` | `web`, `vscode`, `claude`, `mcp` |

# 7. Notas de diseño

1. **3FN:** los valores derivables no se almacenan: ΔH de reacción se calcula en `v_reaccion_entalpia`; el progreso y el ranking, en `v_progreso_estudiante` y `v_ranking_aula`. Las únicas columnas derivadas persistidas (`intento.pasos_completados`, `pistas_usadas`, `xp_pistas`, `aciertos`, `usuario.xp`, rachas) son contadores mantenidos exclusivamente por funciones y *triggers* de la BD (desnormalización controlada por rendimiento y auditada).
2. **Integridad en la BD:** la corrección de respuestas (`tg_respuesta_validar`), el orden de pasos (`fn_registrar_paso`), el orden de ayudas (`fn_usar_pista`) y el rol del dueño de un aula (`tg_aula_docente`) se validan en PostgreSQL, no en el cliente.
3. **Índices especiales:** GIN sobre `glosario.busqueda` (búsqueda de texto completo), BRIN sobre `sesion.iniciada_en` y `evento.creado_en` (tablas *append-only* ordenadas en el tiempo), índices parciales `ux_opcion_una_correcta`, `ix_intento_completado` e `ix_respuesta_pregunta`, e índice de expresión `ux_usuario_email` sobre `lower(email)`.
4. **Auditoría:** `fn_auditar()` registra en `auditoria` los cambios de `usuario`, `aula`, `nivel` y `paso`, sin guardar `password_hash`.
5. **Regeneración:** `psql "$DATABASE_URL" -X -q -A -t -f docs/database/generar-diccionario.sql > docs/database/diccionario-de-datos.md`.

