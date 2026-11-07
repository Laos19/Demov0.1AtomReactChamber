--liquibase formatted sql

--changeset adriana.laos:010-1 comment:Índices para claves foráneas sin cubrir (detectados por tbls lint requireForeignKeyIndex)
-- Sin índice, un DELETE en la tabla padre (p. ej. borrar una sesión) obliga a recorrer la tabla hija completa
-- para verificar/propagar la FK, y los JOIN por esas columnas hacen escaneo secuencial.
CREATE INDEX ix_evento_sesion ON evento (sesion_id);
CREATE INDEX ix_evento_usuario ON evento (usuario_id) WHERE usuario_id IS NOT NULL;
CREATE INDEX ix_evento_nivel ON evento (nivel_id) WHERE nivel_id IS NOT NULL;
CREATE INDEX ix_aula_nivel_nivel ON aula_nivel (nivel_id);
CREATE INDEX ix_pista_usada_pista ON pista_usada (pista_id);
CREATE INDEX ix_respuesta_opcion ON respuesta (opcion_id);
CREATE INDEX ix_logro_insignia ON logro_usuario (insignia_codigo);
CREATE INDEX ix_nivel_previo ON nivel (nivel_previo_id);
CREATE INDEX ix_fotolisis_producto_1 ON fotolisis (producto_1);
CREATE INDEX ix_fotolisis_producto_2 ON fotolisis (producto_2);
CREATE INDEX ix_preset_carga_especie ON preset_carga (especie_codigo);
--rollback DROP INDEX IF EXISTS ix_evento_sesion, ix_evento_usuario, ix_evento_nivel, ix_aula_nivel_nivel, ix_pista_usada_pista, ix_respuesta_opcion, ix_logro_insignia, ix_nivel_previo, ix_fotolisis_producto_1, ix_fotolisis_producto_2, ix_preset_carga_especie;
