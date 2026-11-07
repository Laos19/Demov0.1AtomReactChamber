--liquibase formatted sql

--changeset adriana.laos:003-1 comment:Elementos químicos usados por el simulador
CREATE TABLE elemento (
  simbolo        varchar(3)   PRIMARY KEY CHECK (simbolo ~ '^[A-Z][a-z]{0,2}$'),
  nombre         varchar(30)  NOT NULL UNIQUE,
  numero_atomico smallint     NOT NULL UNIQUE CHECK (numero_atomico BETWEEN 1 AND 118),
  color_hex      char(7)      NOT NULL CHECK (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  brillo_hex     char(7)      NOT NULL CHECK (brillo_hex ~ '^#[0-9a-fA-F]{6}$'),
  radio_px       numeric(4,1) NOT NULL CHECK (radio_px > 0)
);
COMMENT ON TABLE elemento IS 'Elementos químicos que aparecen como átomos en el simulador (color CPK y radio de dibujo).';
COMMENT ON COLUMN elemento.radio_px IS 'Radio de dibujo del átomo en píxeles lógicos.';
--rollback DROP TABLE elemento;

--changeset adriana.laos:003-2 comment:Especies químicas (moléculas, compuestos y radicales)
CREATE TABLE especie (
  codigo          varchar(10)  PRIMARY KEY,
  formula         varchar(12)  NOT NULL,
  nombre          varchar(60)  NOT NULL,
  masa_molar      numeric(9,3) NOT NULL CHECK (masa_molar > 0),
  dhf_kj_mol      numeric(8,2) NOT NULL,
  punto_fusion_k  numeric(7,2) CHECK (punto_fusion_k > 0),
  punto_ebull_k   numeric(7,2) CHECK (punto_ebull_k > 0),
  dhvap_kj_mol    numeric(7,2) CHECK (dhvap_kj_mol > 0),
  p_triple_atm    numeric(6,2),
  t_triple_k      numeric(7,2),
  dhvap_triple    numeric(7,2),
  pubchem_cid     integer      CHECK (pubchem_cid > 0),
  es_radical      boolean      NOT NULL DEFAULT false,
  inyectable      boolean      NOT NULL DEFAULT false,
  orden           smallint     NOT NULL,
  CONSTRAINT ck_especie_radical_sin_fases CHECK (es_radical OR (punto_fusion_k IS NOT NULL AND punto_ebull_k IS NOT NULL AND dhvap_kj_mol IS NOT NULL)),
  CONSTRAINT ck_especie_sublimacion_completa CHECK (num_nulls(p_triple_atm, t_triple_k, dhvap_triple) IN (0, 3))
);
COMMENT ON TABLE especie IS 'Especies químicas del catálogo con datos termodinámicos estándar (NIST/CRC) y CID de PubChem.';
COMMENT ON COLUMN especie.codigo IS 'Código interno usado por el motor (ej. H2, H2O, Cl).';
COMMENT ON COLUMN especie.formula IS 'Fórmula para mostrar, con subíndices Unicode (ej. H₂O).';
COMMENT ON COLUMN especie.dhf_kj_mol IS 'Entalpía estándar de formación ΔHf° en kJ/mol.';
COMMENT ON COLUMN especie.punto_ebull_k IS 'Punto de ebullición normal (1 atm) en K; se corrige por presión con Clausius-Clapeyron.';
COMMENT ON COLUMN especie.dhvap_kj_mol IS 'Entalpía de vaporización (kJ/mol), usada en Clausius-Clapeyron.';
COMMENT ON COLUMN especie.p_triple_atm IS 'Presión del punto triple para especies que subliman (CO₂).';
COMMENT ON COLUMN especie.es_radical IS 'Verdadero para radicales (H·, O·, Cl·): siempre en fase gas.';
COMMENT ON COLUMN especie.inyectable IS 'Si aparece en el inyector del laboratorio.';
--rollback DROP TABLE especie;

--changeset adriana.laos:003-3 comment:Disposición de átomos de cada especie (geometría 2D)
CREATE TABLE especie_atomo (
  especie_codigo varchar(10)  NOT NULL REFERENCES especie (codigo) ON DELETE CASCADE,
  posicion       smallint     NOT NULL CHECK (posicion >= 1),
  simbolo        varchar(3)   NOT NULL REFERENCES elemento (simbolo),
  x              numeric(5,1) NOT NULL,
  y              numeric(5,1) NOT NULL,
  PRIMARY KEY (especie_codigo, posicion)
);
CREATE INDEX ix_especie_atomo_simbolo ON especie_atomo (simbolo);
COMMENT ON TABLE especie_atomo IS 'Átomos que componen cada especie y su posición relativa para dibujarla (relación N:M especie–elemento).';
--rollback DROP TABLE especie_atomo;

--changeset adriana.laos:003-4 comment:Reacciones elementales bimoleculares
CREATE TABLE reaccion (
  codigo           varchar(12)  PRIMARY KEY,
  etiqueta         varchar(40)  NOT NULL,
  ea_kj_mol        numeric(6,2) NOT NULL CHECK (ea_kj_mol >= 0),
  factor_esterico  numeric(4,3) NOT NULL CHECK (factor_esterico > 0 AND factor_esterico <= 1),
  enlace           varchar(8)   NOT NULL
);
COMMENT ON TABLE reaccion IS 'Reacciones elementales que el motor evalúa en cada colisión. ΔH se calcula en la vista v_reaccion_entalpia.';
COMMENT ON COLUMN reaccion.ea_kj_mol IS 'Energía de activación del modelo (valor pedagógico, kJ/mol).';
COMMENT ON COLUMN reaccion.factor_esterico IS 'Probabilidad de orientación favorable (0–1].';
COMMENT ON COLUMN reaccion.enlace IS 'Enlace que se forma (ej. H–O).';
--rollback DROP TABLE reaccion;

--changeset adriana.laos:003-5 comment:Reactivos y productos de cada reacción
CREATE TABLE reaccion_participante (
  reaccion_codigo varchar(12) NOT NULL REFERENCES reaccion (codigo) ON DELETE CASCADE,
  papel           varchar(9)  NOT NULL CHECK (papel IN ('reactivo', 'producto')),
  posicion        smallint    NOT NULL CHECK (posicion BETWEEN 1 AND 2),
  especie_codigo  varchar(10) NOT NULL REFERENCES especie (codigo),
  PRIMARY KEY (reaccion_codigo, papel, posicion)
);
CREATE INDEX ix_participante_especie ON reaccion_participante (especie_codigo);
COMMENT ON TABLE reaccion_participante IS 'Especies que participan en cada reacción como reactivo o producto (máx. 2 por lado).';
--rollback DROP TABLE reaccion_participante;

--changeset adriana.laos:003-6 comment:Fotólisis (ruptura de enlaces por luz UV)
CREATE TABLE fotolisis (
  especie_codigo  varchar(10)  PRIMARY KEY REFERENCES especie (codigo),
  enlace_kj_mol   numeric(6,1) NOT NULL CHECK (enlace_kj_mol > 0),
  seccion_eficaz  numeric(7,5) NOT NULL CHECK (seccion_eficaz > 0),
  etiqueta        varchar(8)   NOT NULL,
  producto_1      varchar(10)  NOT NULL REFERENCES especie (codigo),
  producto_2      varchar(10)  NOT NULL REFERENCES especie (codigo)
);
COMMENT ON TABLE fotolisis IS 'Moléculas que se rompen con fotones de energía ≥ enlace (E = 119 627 / λ kJ/mol).';
COMMENT ON COLUMN fotolisis.seccion_eficaz IS 'Probabilidad relativa de absorción por fotogramas.';
--rollback DROP TABLE fotolisis;

--changeset adriana.laos:003-7 comment:Experimentos predefinidos del laboratorio libre
CREATE TABLE preset (
  codigo       varchar(20)  PRIMARY KEY,
  nombre       varchar(60)  NOT NULL,
  ecuacion     varchar(40)  NOT NULL,
  sobre_flecha varchar(20)  NOT NULL DEFAULT '',
  etiqueta     varchar(30)  NOT NULL,
  pista        text         NOT NULL,
  parametros   jsonb        NOT NULL CHECK (jsonb_exists_all(parametros, ARRAY['T', 'P', 'V', 'UV', 'lambda'])),
  pasos        jsonb        NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(pasos) = 'array'),
  orden        smallint     NOT NULL
);
COMMENT ON TABLE preset IS 'Experimentos listos para cargar en el laboratorio libre.';
COMMENT ON COLUMN preset.parametros IS 'Condiciones iniciales {T (K), P (atm), V (L), UV (W/m²), lambda (nm)}.';
COMMENT ON COLUMN preset.pasos IS 'Mecanismo para el perfil energético: [[codigo_reaccion, coeficiente], ...].';
--rollback DROP TABLE preset;

--changeset adriana.laos:003-8 comment:Carga inicial de especies de cada preset
CREATE TABLE preset_carga (
  preset_codigo  varchar(20) NOT NULL REFERENCES preset (codigo) ON DELETE CASCADE,
  especie_codigo varchar(10) NOT NULL REFERENCES especie (codigo),
  cantidad       smallint    NOT NULL CHECK (cantidad BETWEEN 1 AND 500),
  PRIMARY KEY (preset_codigo, especie_codigo)
);
COMMENT ON TABLE preset_carga IS 'Partículas que se inyectan al cargar un preset.';
--rollback DROP TABLE preset_carga;
