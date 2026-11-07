--liquibase formatted sql

--changeset adriana.laos:006-1 comment:Sesiones y eventos de uso (dashboard de utilización)
CREATE TABLE sesion (
  id                uuid        PRIMARY KEY,
  usuario_id        bigint      REFERENCES usuario (id) ON DELETE SET NULL,
  origen            varchar(10) NOT NULL DEFAULT 'web' CHECK (origen IN ('web', 'vscode', 'claude', 'mcp')),
  dispositivo       varchar(10) NOT NULL DEFAULT 'escritorio' CHECK (dispositivo IN ('escritorio', 'tablet', 'movil')),
  iniciada_en       timestamptz NOT NULL DEFAULT now(),
  ultima_actividad  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_sesion_fechas CHECK (ultima_actividad >= iniciada_en)
);
CREATE INDEX ix_sesion_inicio ON sesion USING brin (iniciada_en);
CREATE INDEX ix_sesion_usuario ON sesion (usuario_id);
COMMENT ON TABLE sesion IS 'Sesión de uso (anónima o autenticada) desde la web, VS Code, Claude Code o MCP.';
COMMENT ON COLUMN sesion.id IS 'UUID generado por el cliente; permite registrar uso anónimo sin datos personales.';

CREATE TABLE evento (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_id   uuid        NOT NULL REFERENCES sesion (id) ON DELETE CASCADE,
  usuario_id  bigint      REFERENCES usuario (id) ON DELETE SET NULL,
  tipo        varchar(30) NOT NULL CHECK (tipo IN (
                'pagina_vista', 'nivel_iniciado', 'paso_completado', 'pista_usada', 'nivel_completado',
                'cuestionario_respondido', 'preset_cargado', 'chispa', 'reaccion_observada', 'quimi_consulta',
                'insignia_obtenida', 'error_cliente')),
  nivel_id    smallint    REFERENCES nivel (id),
  datos       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_evento_creado ON evento USING brin (creado_en);
CREATE INDEX ix_evento_tipo_fecha ON evento (tipo, creado_en);
COMMENT ON TABLE evento IS 'Eventos de telemetría de producto (append-only). Índice BRIN por fecha: tabla grande y ordenada en el tiempo.';
COMMENT ON COLUMN evento.datos IS 'Carga útil libre en JSON (ej. {"paso":2,"segundos":31}).';
--rollback DROP TABLE evento; DROP TABLE sesion;
