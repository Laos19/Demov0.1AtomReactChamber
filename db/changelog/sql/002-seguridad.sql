--liquibase formatted sql

--changeset adriana.laos:002-1 comment:Roles de la aplicación
CREATE TABLE rol (
  id      smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo  varchar(20) NOT NULL UNIQUE CHECK (codigo IN ('estudiante', 'docente', 'admin')),
  nombre  varchar(40) NOT NULL
);
COMMENT ON TABLE rol IS 'Roles de acceso de la aplicación (estudiante, docente, administrador).';
COMMENT ON COLUMN rol.codigo IS 'Código estable usado por la API para autorizar (estudiante|docente|admin).';
COMMENT ON COLUMN rol.nombre IS 'Nombre legible del rol.';
--rollback DROP TABLE rol;

--changeset adriana.laos:002-2 comment:Usuarios con progreso de gamificación
CREATE TABLE usuario (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email              varchar(120) NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nombre             varchar(80)  NOT NULL CHECK (length(trim(nombre)) >= 2),
  password_hash      varchar(100) NOT NULL,
  rol_id             smallint     NOT NULL REFERENCES rol (id),
  grado              smallint     CHECK (grado BETWEEN 1 AND 5),
  xp                 integer      NOT NULL DEFAULT 0 CHECK (xp >= 0),
  racha_actual       smallint     NOT NULL DEFAULT 0 CHECK (racha_actual >= 0),
  racha_maxima       smallint     NOT NULL DEFAULT 0 CHECK (racha_maxima >= racha_actual),
  ultimo_dia_activo  date,
  activo             boolean      NOT NULL DEFAULT true,
  creado_en          timestamptz  NOT NULL DEFAULT now(),
  actualizado_en     timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_usuario_email ON usuario (lower(email));
CREATE INDEX ix_usuario_rol ON usuario (rol_id);
COMMENT ON TABLE usuario IS 'Cuentas de estudiantes, docentes y administradores, con su experiencia (XP) y racha.';
COMMENT ON COLUMN usuario.email IS 'Correo de acceso; único sin distinguir mayúsculas (índice ux_usuario_email).';
COMMENT ON COLUMN usuario.password_hash IS 'Hash bcrypt de la contraseña (nunca se guarda en texto plano).';
COMMENT ON COLUMN usuario.grado IS 'Grado de secundaria (1–5). Nulo para docentes y administradores.';
COMMENT ON COLUMN usuario.xp IS 'Experiencia acumulada; la actualiza fn_finalizar_intento.';
COMMENT ON COLUMN usuario.racha_actual IS 'Días consecutivos con al menos un nivel terminado.';
COMMENT ON COLUMN usuario.racha_maxima IS 'Mejor racha histórica.';
COMMENT ON COLUMN usuario.ultimo_dia_activo IS 'Último día (America/Lima) en que terminó un nivel; base del cálculo de racha.';
--rollback DROP TABLE usuario;

--changeset adriana.laos:002-3 comment:Bitácora de auditoría genérica
CREATE TABLE auditoria (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabla          varchar(63) NOT NULL,
  operacion      char(1)     NOT NULL CHECK (operacion IN ('I', 'U', 'D')),
  registro_id    text,
  usuario_bd     varchar(63) NOT NULL DEFAULT current_user,
  datos_antes    jsonb,
  datos_despues  jsonb,
  ocurrido_en    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_auditoria_tabla_fecha ON auditoria (tabla, ocurrido_en DESC);
COMMENT ON TABLE auditoria IS 'Registro de cambios (insert/update/delete) en tablas sensibles, llenado por fn_auditar().';
COMMENT ON COLUMN auditoria.operacion IS 'I = inserción, U = actualización, D = eliminación.';
COMMENT ON COLUMN auditoria.datos_antes IS 'Fila anterior en JSON (sin password_hash).';
COMMENT ON COLUMN auditoria.datos_despues IS 'Fila nueva en JSON (sin password_hash).';
--rollback DROP TABLE auditoria;
