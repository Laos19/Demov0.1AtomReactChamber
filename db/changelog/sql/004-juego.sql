--liquibase formatted sql

--changeset adriana.laos:004-1 comment:Misiones (capítulos temáticos)
CREATE TABLE mision (
  id           smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo       varchar(20)  NOT NULL UNIQUE,
  titulo       varchar(60)  NOT NULL,
  descripcion  text         NOT NULL,
  competencia  text         NOT NULL,
  color        varchar(20)  NOT NULL,
  orden        smallint     NOT NULL UNIQUE
);
COMMENT ON TABLE mision IS 'Capítulos temáticos que agrupan niveles (ej. La materia y sus estados).';
COMMENT ON COLUMN mision.competencia IS 'Competencia del CNEB (MINEDU) que desarrolla la misión.';
COMMENT ON COLUMN mision.color IS 'Token de color de la categoría en el mapa (estados, combustion, familias, luz).';
--rollback DROP TABLE mision;

--changeset adriana.laos:004-2 comment:Niveles del mapa con forma de tabla periódica
CREATE TABLE nivel (
  id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo          varchar(30)  NOT NULL UNIQUE,
  mision_id       smallint     NOT NULL REFERENCES mision (id),
  orden           smallint     NOT NULL UNIQUE CHECK (orden >= 1),
  titulo          varchar(80)  NOT NULL,
  resumen         text         NOT NULL,
  objetivo        text         NOT NULL,
  grado           smallint     NOT NULL CHECK (grado BETWEEN 1 AND 5),
  xp_base         smallint     NOT NULL CHECK (xp_base > 0),
  minutos_estim   smallint     NOT NULL CHECK (minutos_estim > 0),
  casilla_simbolo varchar(3)   NOT NULL,
  casilla_fila    smallint     NOT NULL CHECK (casilla_fila BETWEEN 1 AND 7),
  casilla_columna smallint     NOT NULL CHECK (casilla_columna BETWEEN 1 AND 18),
  casilla_nota    text         NOT NULL,
  inicio          jsonb        NOT NULL CHECK (jsonb_exists(inicio, 'parametros') AND jsonb_exists(inicio, 'carga')),
  controles       text[]       NOT NULL,
  especies        text[]       NOT NULL,
  nivel_previo_id smallint     REFERENCES nivel (id),
  CONSTRAINT ux_nivel_casilla UNIQUE (casilla_fila, casilla_columna)
);
CREATE INDEX ix_nivel_mision ON nivel (mision_id);
COMMENT ON TABLE nivel IS 'Nivel jugable: una práctica guiada ubicada en una casilla de la tabla periódica.';
COMMENT ON COLUMN nivel.casilla_simbolo IS 'Símbolo del elemento de la casilla donde se ubica el nivel en el mapa.';
COMMENT ON COLUMN nivel.inicio IS 'Estado inicial del simulador: {parametros:{T,P,V,UV,lambda}, carga:{especie:cantidad}}.';
COMMENT ON COLUMN nivel.controles IS 'Controles habilitados en el nivel (T, P, V, UV, lambda, inyectar, chispa).';
COMMENT ON COLUMN nivel.especies IS 'Especies que el estudiante puede inyectar en el nivel.';
COMMENT ON COLUMN nivel.nivel_previo_id IS 'Nivel que debe completarse para desbloquear este (nulo = disponible desde el inicio).';
--rollback DROP TABLE nivel;

--changeset adriana.laos:004-3 comment:Pasos de cada nivel con condición verificable
CREATE TABLE paso (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nivel_id    smallint     NOT NULL REFERENCES nivel (id) ON DELETE CASCADE,
  orden       smallint     NOT NULL CHECK (orden >= 1),
  titulo      varchar(60)  NOT NULL,
  instruccion text         NOT NULL,
  concepto    text         NOT NULL,
  condicion   jsonb        NOT NULL CHECK (jsonb_typeof(condicion) = 'object' AND (jsonb_exists(condicion, 'todas') OR jsonb_exists(condicion, 'alguna'))),
  CONSTRAINT ux_paso_nivel_orden UNIQUE (nivel_id, orden)
);
COMMENT ON TABLE paso IS 'Paso de un nivel. La condición se evalúa en el motor del simulador (DSL {todas|alguna:[{metrica, op, valor}]}).';
COMMENT ON COLUMN paso.concepto IS 'Explicación del concepto científico para escolares.';
COMMENT ON COLUMN paso.condicion IS 'Regla verificable, ej. {"todas":[{"metrica":"temperatura","op":">=","valor":600}],"durante":2}.';
--rollback DROP TABLE paso;

--changeset adriana.laos:004-4 comment:Pistas escalonadas de Quimi
CREATE TABLE pista (
  id        integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  paso_id   integer  NOT NULL REFERENCES paso (id) ON DELETE CASCADE,
  nivel_ayuda smallint NOT NULL CHECK (nivel_ayuda BETWEEN 1 AND 3),
  texto     text     NOT NULL,
  costo_xp  smallint NOT NULL CHECK (costo_xp >= 0),
  CONSTRAINT ux_pista_paso_nivel UNIQUE (paso_id, nivel_ayuda)
);
COMMENT ON TABLE pista IS 'Ayudas de Quimi por paso: 1 = pista, 2 = explicación, 3 = solución. Cada una cuesta XP.';
--rollback DROP TABLE pista;

--changeset adriana.laos:004-5 comment:Cuestionario de cierre por nivel
CREATE TABLE pregunta (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nivel_id    smallint NOT NULL REFERENCES nivel (id) ON DELETE CASCADE,
  orden       smallint NOT NULL CHECK (orden >= 1),
  enunciado   text     NOT NULL,
  explicacion text     NOT NULL,
  CONSTRAINT ux_pregunta_nivel_orden UNIQUE (nivel_id, orden)
);
COMMENT ON TABLE pregunta IS 'Preguntas del cuestionario de cierre de cada nivel.';
COMMENT ON COLUMN pregunta.explicacion IS 'Retroalimentación inmediata mostrada tras responder.';

CREATE TABLE opcion (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pregunta_id integer  NOT NULL REFERENCES pregunta (id) ON DELETE CASCADE,
  orden       smallint NOT NULL CHECK (orden >= 1),
  texto       text     NOT NULL,
  es_correcta boolean  NOT NULL DEFAULT false,
  CONSTRAINT ux_opcion_pregunta_orden UNIQUE (pregunta_id, orden)
);
CREATE UNIQUE INDEX ux_opcion_una_correcta ON opcion (pregunta_id) WHERE es_correcta;
COMMENT ON TABLE opcion IS 'Alternativas de cada pregunta. El índice parcial ux_opcion_una_correcta garantiza a lo más una correcta.';
--rollback DROP TABLE opcion; DROP TABLE pregunta;

--changeset adriana.laos:004-6 comment:Insignias y glosario
CREATE TABLE insignia (
  codigo      varchar(30) PRIMARY KEY,
  nombre      varchar(40) NOT NULL,
  descripcion text        NOT NULL,
  icono       varchar(20) NOT NULL,
  tipo        varchar(30) NOT NULL CHECK (tipo IN ('niveles_completados', 'sin_pistas', 'racha', 'estrellas_totales', 'xp_total', 'cuestionarios_perfectos')),
  umbral      integer     NOT NULL CHECK (umbral > 0)
);
COMMENT ON TABLE insignia IS 'Logros desbloqueables. fn_otorgar_insignias evalúa tipo/umbral contra el progreso del usuario.';

CREATE TABLE glosario (
  id         smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  termino    varchar(60) NOT NULL UNIQUE,
  definicion text        NOT NULL,
  busqueda   tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('es_sin_tildes', termino), 'A') || setweight(to_tsvector('es_sin_tildes', definicion), 'B')
  ) STORED
);
CREATE INDEX ix_glosario_busqueda ON glosario USING gin (busqueda);
COMMENT ON TABLE glosario IS 'Términos que Quimi explica. Búsqueda de texto completo en español sin tildes (índice GIN).';
COMMENT ON COLUMN glosario.busqueda IS 'Vector de búsqueda generado: término con peso A, definición con peso B.';
--rollback DROP TABLE glosario; DROP TABLE insignia;
