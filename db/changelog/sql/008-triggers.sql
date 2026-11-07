--liquibase formatted sql

--changeset adriana.laos:008-1 runOnChange:true splitStatements:false comment:Funciones de trigger
CREATE OR REPLACE FUNCTION fn_tg_actualizado_en() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_auditar() RETURNS trigger LANGUAGE plpgsql AS $$
/* Auditoría genérica: guarda la fila antes/después en JSON, ocultando el hash de contraseña. */
DECLARE
  v_antes   jsonb := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) - 'password_hash' END;
  v_despues jsonb := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) - 'password_hash' END;
BEGIN
  IF TG_OP = 'UPDATE' AND v_antes = v_despues THEN RETURN NEW; END IF;
  INSERT INTO auditoria (tabla, operacion, registro_id, datos_antes, datos_despues)
  VALUES (TG_TABLE_NAME, left(TG_OP, 1), coalesce(v_despues ->> 'id', v_antes ->> 'id', v_despues ->> 'codigo', v_antes ->> 'codigo'), v_antes, v_despues);
  RETURN coalesce(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION fn_tg_respuesta_validar() RETURNS trigger LANGUAGE plpgsql AS $$
/* La corrección la decide la BD: se ignora cualquier es_correcta enviada por el cliente. */
DECLARE
  v_correcta boolean;
BEGIN
  SELECT o.es_correcta INTO v_correcta
  FROM opcion o
  JOIN pregunta p ON p.id = o.pregunta_id
  JOIN intento i ON i.nivel_id = p.nivel_id
  WHERE o.id = NEW.opcion_id AND o.pregunta_id = NEW.pregunta_id AND i.id = NEW.intento_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'la opción % no corresponde a la pregunta % del nivel del intento', NEW.opcion_id, NEW.pregunta_id USING ERRCODE = 'P0001';
  END IF;
  NEW.es_correcta := v_correcta;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_tg_respuesta_contar() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.es_correcta THEN
    UPDATE intento SET aciertos = aciertos + 1 WHERE id = NEW.intento_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION fn_tg_pista_usada_contar() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE intento i
     SET pistas_usadas = i.pistas_usadas + 1,
         xp_pistas = i.xp_pistas + (SELECT costo_xp FROM pista WHERE id = NEW.pista_id)
   WHERE i.id = NEW.intento_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION fn_tg_aula_codigo() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := fn_generar_codigo_aula();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_tg_aula_docente() RETURNS trigger LANGUAGE plpgsql AS $$
/* Solo un usuario con rol docente o admin puede ser dueño de un aula. */
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = NEW.docente_id AND r.codigo IN ('docente', 'admin')) THEN
    RAISE EXCEPTION 'el usuario % no es docente', NEW.docente_id USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
--rollback DROP FUNCTION IF EXISTS fn_tg_actualizado_en(), fn_auditar(), fn_tg_respuesta_validar(), fn_tg_respuesta_contar(), fn_tg_pista_usada_contar(), fn_tg_aula_codigo(), fn_tg_aula_docente();

--changeset adriana.laos:008-2 comment:Triggers sobre las tablas
CREATE TRIGGER tg_usuario_actualizado BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION fn_tg_actualizado_en();
CREATE TRIGGER tg_usuario_auditoria AFTER INSERT OR UPDATE OR DELETE ON usuario FOR EACH ROW EXECUTE FUNCTION fn_auditar();
CREATE TRIGGER tg_aula_auditoria AFTER INSERT OR UPDATE OR DELETE ON aula FOR EACH ROW EXECUTE FUNCTION fn_auditar();
CREATE TRIGGER tg_nivel_auditoria AFTER UPDATE OR DELETE ON nivel FOR EACH ROW EXECUTE FUNCTION fn_auditar();
CREATE TRIGGER tg_paso_auditoria AFTER UPDATE OR DELETE ON paso FOR EACH ROW EXECUTE FUNCTION fn_auditar();
CREATE TRIGGER tg_aula_codigo BEFORE INSERT ON aula FOR EACH ROW EXECUTE FUNCTION fn_tg_aula_codigo();
CREATE TRIGGER tg_aula_docente BEFORE INSERT OR UPDATE OF docente_id ON aula FOR EACH ROW EXECUTE FUNCTION fn_tg_aula_docente();
CREATE TRIGGER tg_respuesta_validar BEFORE INSERT ON respuesta FOR EACH ROW EXECUTE FUNCTION fn_tg_respuesta_validar();
CREATE TRIGGER tg_respuesta_contar AFTER INSERT ON respuesta FOR EACH ROW EXECUTE FUNCTION fn_tg_respuesta_contar();
CREATE TRIGGER tg_pista_usada_contar AFTER INSERT ON pista_usada FOR EACH ROW EXECUTE FUNCTION fn_tg_pista_usada_contar();
--rollback DROP TRIGGER IF EXISTS tg_usuario_actualizado ON usuario; DROP TRIGGER IF EXISTS tg_usuario_auditoria ON usuario; DROP TRIGGER IF EXISTS tg_aula_auditoria ON aula; DROP TRIGGER IF EXISTS tg_nivel_auditoria ON nivel; DROP TRIGGER IF EXISTS tg_paso_auditoria ON paso; DROP TRIGGER IF EXISTS tg_aula_codigo ON aula; DROP TRIGGER IF EXISTS tg_aula_docente ON aula; DROP TRIGGER IF EXISTS tg_respuesta_validar ON respuesta; DROP TRIGGER IF EXISTS tg_respuesta_contar ON respuesta; DROP TRIGGER IF EXISTS tg_pista_usada_contar ON pista_usada;
