--liquibase formatted sql

--changeset adriana.laos:005-1 comment:Aulas, matrículas y asignaciones
CREATE TABLE aula (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      char(6)     NOT NULL UNIQUE CHECK (codigo ~ '^[A-Z0-9]{6}$'),
  nombre      varchar(60) NOT NULL,
  grado       smallint    NOT NULL CHECK (grado BETWEEN 1 AND 5),
  seccion     varchar(3)  NOT NULL DEFAULT 'A',
  docente_id  bigint      NOT NULL REFERENCES usuario (id),
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_aula_docente ON aula (docente_id);
COMMENT ON TABLE aula IS 'Grupo de estudiantes a cargo de un docente. Los estudiantes se unen con el código de 6 caracteres.';

CREATE TABLE matricula (
  aula_id        integer     NOT NULL REFERENCES aula (id) ON DELETE CASCADE,
  estudiante_id  bigint      NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  unido_en       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (aula_id, estudiante_id)
);
CREATE INDEX ix_matricula_estudiante ON matricula (estudiante_id);
COMMENT ON TABLE matricula IS 'Pertenencia de estudiantes a aulas (relación N:M).';

CREATE TABLE aula_nivel (
  aula_id      integer  NOT NULL REFERENCES aula (id) ON DELETE CASCADE,
  nivel_id     smallint NOT NULL REFERENCES nivel (id),
  fecha_limite date,
  asignado_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (aula_id, nivel_id)
);
COMMENT ON TABLE aula_nivel IS 'Niveles que el docente asigna a un aula, con fecha límite opcional.';
--rollback DROP TABLE aula_nivel; DROP TABLE matricula; DROP TABLE aula;

--changeset adriana.laos:005-2 comment:Intentos de nivel y su detalle
CREATE TABLE intento (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id           bigint      NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  nivel_id             smallint    NOT NULL REFERENCES nivel (id),
  estado               varchar(12) NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'completado', 'abandonado')),
  iniciado_en          timestamptz NOT NULL DEFAULT now(),
  finalizado_en        timestamptz,
  pasos_completados    smallint    NOT NULL DEFAULT 0 CHECK (pasos_completados >= 0),
  pistas_usadas        smallint    NOT NULL DEFAULT 0 CHECK (pistas_usadas >= 0),
  xp_pistas            smallint    NOT NULL DEFAULT 0 CHECK (xp_pistas >= 0),
  aciertos             smallint    NOT NULL DEFAULT 0 CHECK (aciertos >= 0),
  estrellas            smallint    CHECK (estrellas BETWEEN 1 AND 3),
  xp_obtenido          integer     CHECK (xp_obtenido >= 0),
  CONSTRAINT ck_intento_fin CHECK ((estado = 'en_curso') = (finalizado_en IS NULL)),
  CONSTRAINT ck_intento_estrellas CHECK ((estado = 'completado') = (estrellas IS NOT NULL))
);
CREATE INDEX ix_intento_usuario_nivel ON intento (usuario_id, nivel_id);
CREATE INDEX ix_intento_completado ON intento (nivel_id, finalizado_en) WHERE estado = 'completado';
COMMENT ON TABLE intento IS 'Cada vez que un estudiante juega un nivel. Lo cierra fn_finalizar_intento (estrellas y XP).';
COMMENT ON COLUMN intento.xp_pistas IS 'XP gastada en pistas durante el intento (la suma el trigger de pista_usada).';
COMMENT ON COLUMN intento.aciertos IS 'Respuestas correctas del cuestionario (las cuenta el trigger de respuesta).';

CREATE TABLE intento_paso (
  intento_id     bigint      NOT NULL REFERENCES intento (id) ON DELETE CASCADE,
  paso_id        integer     NOT NULL REFERENCES paso (id),
  segundos       integer     NOT NULL CHECK (segundos >= 0),
  completado_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (intento_id, paso_id)
);
CREATE INDEX ix_intento_paso_paso ON intento_paso (paso_id);
COMMENT ON TABLE intento_paso IS 'Pasos completados dentro de un intento y el tiempo que tomaron (métrica del dashboard).';

CREATE TABLE pista_usada (
  intento_id bigint      NOT NULL REFERENCES intento (id) ON DELETE CASCADE,
  pista_id   integer     NOT NULL REFERENCES pista (id),
  usada_en   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (intento_id, pista_id)
);
COMMENT ON TABLE pista_usada IS 'Pistas de Quimi que el estudiante abrió en un intento (una vez por pista).';

CREATE TABLE respuesta (
  intento_id     bigint      NOT NULL REFERENCES intento (id) ON DELETE CASCADE,
  pregunta_id    integer     NOT NULL REFERENCES pregunta (id),
  opcion_id      integer     NOT NULL REFERENCES opcion (id),
  es_correcta    boolean     NOT NULL DEFAULT false,
  respondida_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (intento_id, pregunta_id)
);
CREATE INDEX ix_respuesta_pregunta ON respuesta (pregunta_id) WHERE NOT es_correcta;
COMMENT ON TABLE respuesta IS 'Respuesta elegida en el cuestionario. es_correcta la fija un trigger desde opcion (no confía en el cliente).';

CREATE TABLE logro_usuario (
  usuario_id      bigint      NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  insignia_codigo varchar(30) NOT NULL REFERENCES insignia (codigo),
  obtenido_en     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, insignia_codigo)
);
COMMENT ON TABLE logro_usuario IS 'Insignias obtenidas por cada usuario.';
--rollback DROP TABLE logro_usuario; DROP TABLE respuesta; DROP TABLE pista_usada; DROP TABLE intento_paso; DROP TABLE intento;
