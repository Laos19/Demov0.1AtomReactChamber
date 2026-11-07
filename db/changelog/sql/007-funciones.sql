--liquibase formatted sql

--changeset adriana.laos:007-1 runOnChange:true splitStatements:false comment:Cálculo de estrellas de un intento
CREATE OR REPLACE FUNCTION fn_calcular_estrellas(p_max_ayuda smallint, p_aciertos smallint, p_total_preguntas smallint)
RETURNS smallint
LANGUAGE plpgsql IMMUTABLE AS $$
/* 3 estrellas de base. −1 si se usó una explicación (ayuda 2), −1 adicional si se pidió la solución (ayuda 3),
   −1 si el cuestionario tiene menos de 2/3 de aciertos. Mínimo 1 estrella por completar el nivel. */
DECLARE
  e smallint := 3;
BEGIN
  IF coalesce(p_max_ayuda, 0) >= 2 THEN e := e - 1; END IF;
  IF coalesce(p_max_ayuda, 0) >= 3 THEN e := e - 1; END IF;
  IF p_total_preguntas > 0 AND p_aciertos * 3 < p_total_preguntas * 2 THEN e := e - 1; END IF;
  RETURN greatest(1, e);
END;
$$;
COMMENT ON FUNCTION fn_calcular_estrellas(smallint, smallint, smallint) IS 'Regla de estrellas (1–3) según ayudas usadas y aciertos del cuestionario.';
--rollback DROP FUNCTION IF EXISTS fn_calcular_estrellas(smallint, smallint, smallint);

--changeset adriana.laos:007-2 runOnChange:true splitStatements:false comment:Registro de un paso completado
CREATE OR REPLACE FUNCTION fn_registrar_paso(p_intento bigint, p_paso integer, p_segundos integer)
RETURNS smallint
LANGUAGE plpgsql AS $$
/* Valida que el paso pertenezca al nivel del intento y que sea el siguiente en orden; registra el tiempo. */
DECLARE
  v_intento intento%ROWTYPE;
  v_orden   smallint;
BEGIN
  SELECT * INTO v_intento FROM intento WHERE id = p_intento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'intento % no existe', p_intento USING ERRCODE = 'P0002'; END IF;
  IF v_intento.estado <> 'en_curso' THEN RAISE EXCEPTION 'el intento % ya terminó', p_intento USING ERRCODE = 'P0001'; END IF;

  SELECT orden INTO v_orden FROM paso WHERE id = p_paso AND nivel_id = v_intento.nivel_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'el paso % no pertenece al nivel del intento', p_paso USING ERRCODE = 'P0001'; END IF;
  IF v_orden <> v_intento.pasos_completados + 1 THEN
    RAISE EXCEPTION 'paso fuera de orden: se esperaba el paso %', v_intento.pasos_completados + 1 USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO intento_paso (intento_id, paso_id, segundos) VALUES (p_intento, p_paso, greatest(0, p_segundos));
  UPDATE intento SET pasos_completados = pasos_completados + 1 WHERE id = p_intento;
  RETURN v_orden;
END;
$$;
COMMENT ON FUNCTION fn_registrar_paso(bigint, integer, integer) IS 'Marca un paso como completado validando pertenencia y orden secuencial.';
--rollback DROP FUNCTION IF EXISTS fn_registrar_paso(bigint, integer, integer);

--changeset adriana.laos:007-3 runOnChange:true splitStatements:false comment:Uso de pistas escalonadas de Quimi
CREATE OR REPLACE FUNCTION fn_usar_pista(p_intento bigint, p_paso integer, p_nivel_ayuda smallint)
RETURNS TABLE (pista_id integer, texto text, costo_xp smallint, ya_usada boolean)
LANGUAGE plpgsql AS $$
/* Devuelve la ayuda pedida. Exige haber abierto la ayuda anterior (1 → 2 → 3). Cobra XP solo la primera vez. */
DECLARE
  v_intento intento%ROWTYPE;
  v_pista   pista%ROWTYPE;
  v_ya      boolean;
BEGIN
  SELECT * INTO v_intento FROM intento WHERE id = p_intento;
  IF NOT FOUND THEN RAISE EXCEPTION 'intento % no existe', p_intento USING ERRCODE = 'P0002'; END IF;

  SELECT pi.* INTO v_pista
  FROM pista pi JOIN paso pa ON pa.id = pi.paso_id
  WHERE pi.paso_id = p_paso AND pi.nivel_ayuda = p_nivel_ayuda AND pa.nivel_id = v_intento.nivel_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ayuda % del paso % no existe en este nivel', p_nivel_ayuda, p_paso USING ERRCODE = 'P0002'; END IF;

  IF p_nivel_ayuda > 1 AND NOT EXISTS (
    SELECT 1 FROM pista_usada pu JOIN pista pi ON pi.id = pu.pista_id
    WHERE pu.intento_id = p_intento AND pi.paso_id = p_paso AND pi.nivel_ayuda = p_nivel_ayuda - 1
  ) THEN
    RAISE EXCEPTION 'primero abre la ayuda %', p_nivel_ayuda - 1 USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (SELECT 1 FROM pista_usada WHERE intento_id = p_intento AND pista_usada.pista_id = v_pista.id) INTO v_ya;
  IF NOT v_ya THEN
    IF v_intento.estado <> 'en_curso' THEN RAISE EXCEPTION 'el intento % ya terminó', p_intento USING ERRCODE = 'P0001'; END IF;
    INSERT INTO pista_usada (intento_id, pista_id) VALUES (p_intento, v_pista.id);
  END IF;
  RETURN QUERY SELECT v_pista.id, v_pista.texto, v_pista.costo_xp, v_ya;
END;
$$;
COMMENT ON FUNCTION fn_usar_pista(bigint, integer, smallint) IS 'Entrega una ayuda de Quimi respetando el orden pista → explicación → solución.';
--rollback DROP FUNCTION IF EXISTS fn_usar_pista(bigint, integer, smallint);

--changeset adriana.laos:007-4 runOnChange:true splitStatements:false comment:Racha de días consecutivos
CREATE OR REPLACE FUNCTION fn_actualizar_racha(p_usuario bigint, p_hoy date DEFAULT (now() AT TIME ZONE 'America/Lima')::date)
RETURNS smallint
LANGUAGE plpgsql AS $$
DECLARE
  v_ultimo date;
  v_racha  smallint;
BEGIN
  SELECT ultimo_dia_activo, racha_actual INTO v_ultimo, v_racha FROM usuario WHERE id = p_usuario FOR UPDATE;
  IF v_ultimo = p_hoy THEN
    RETURN v_racha;
  ELSIF v_ultimo = p_hoy - 1 THEN
    v_racha := v_racha + 1;
  ELSE
    v_racha := 1;
  END IF;
  UPDATE usuario
     SET racha_actual = v_racha, racha_maxima = greatest(racha_maxima, v_racha), ultimo_dia_activo = p_hoy
   WHERE id = p_usuario;
  RETURN v_racha;
END;
$$;
COMMENT ON FUNCTION fn_actualizar_racha(bigint, date) IS 'Actualiza la racha: +1 si jugó ayer, se reinicia a 1 si hubo un día sin jugar.';
--rollback DROP FUNCTION IF EXISTS fn_actualizar_racha(bigint, date);

--changeset adriana.laos:007-5 runOnChange:true splitStatements:false comment:Otorgamiento automático de insignias
CREATE OR REPLACE FUNCTION fn_otorgar_insignias(p_usuario bigint)
RETURNS text[]
LANGUAGE plpgsql AS $$
/* Evalúa todas las insignias contra el progreso actual e inserta las nuevas. Devuelve los códigos otorgados. */
DECLARE
  v_nuevas text[];
BEGIN
  WITH metricas AS (
    SELECT
      (SELECT count(DISTINCT nivel_id) FROM intento WHERE usuario_id = p_usuario AND estado = 'completado') AS niveles_completados,
      (SELECT count(*) FROM intento WHERE usuario_id = p_usuario AND estado = 'completado' AND pistas_usadas = 0) AS sin_pistas,
      (SELECT racha_maxima FROM usuario WHERE id = p_usuario) AS racha,
      (SELECT coalesce(sum(mejor), 0) FROM (
         SELECT max(estrellas) AS mejor FROM intento WHERE usuario_id = p_usuario AND estado = 'completado' GROUP BY nivel_id) m) AS estrellas_totales,
      (SELECT xp FROM usuario WHERE id = p_usuario) AS xp_total,
      (SELECT count(*) FROM intento i
        WHERE i.usuario_id = p_usuario AND i.estado = 'completado'
          AND i.aciertos = (SELECT count(*) FROM pregunta p WHERE p.nivel_id = i.nivel_id)) AS cuestionarios_perfectos
  ), candidatas AS (
    SELECT ins.codigo
    FROM insignia ins CROSS JOIN metricas m
    WHERE CASE ins.tipo
            WHEN 'niveles_completados'     THEN m.niveles_completados
            WHEN 'sin_pistas'              THEN m.sin_pistas
            WHEN 'racha'                   THEN m.racha
            WHEN 'estrellas_totales'       THEN m.estrellas_totales
            WHEN 'xp_total'                THEN m.xp_total
            WHEN 'cuestionarios_perfectos' THEN m.cuestionarios_perfectos
          END >= ins.umbral
  ), insertadas AS (
    INSERT INTO logro_usuario (usuario_id, insignia_codigo)
    SELECT p_usuario, codigo FROM candidatas
    ON CONFLICT DO NOTHING
    RETURNING insignia_codigo
  )
  SELECT coalesce(array_agg(insignia_codigo ORDER BY insignia_codigo), ARRAY[]::text[]) INTO v_nuevas FROM insertadas;
  RETURN v_nuevas;
END;
$$;
COMMENT ON FUNCTION fn_otorgar_insignias(bigint) IS 'Otorga las insignias cuyo umbral ya alcanzó el usuario; idempotente.';
--rollback DROP FUNCTION IF EXISTS fn_otorgar_insignias(bigint);

--changeset adriana.laos:007-6 runOnChange:true splitStatements:false comment:Cierre de intento (estrellas, XP, racha, insignias)
CREATE OR REPLACE FUNCTION fn_finalizar_intento(p_intento bigint)
RETURNS TABLE (estrellas smallint, xp_obtenido integer, xp_total integer, racha smallint, es_repeticion boolean, insignias_nuevas text[])
LANGUAGE plpgsql AS $$
/* Transacción de cierre: exige todos los pasos completos, calcula estrellas y XP
   (las repeticiones de un nivel ya completado dan 25 % de XP), suma XP al usuario,
   actualiza la racha y otorga insignias. */
DECLARE
  v_i          intento%ROWTYPE;
  v_total_pasos smallint;
  v_total_preg  smallint;
  v_max_ayuda   smallint;
  v_xp_base     smallint;
  v_estrellas   smallint;
  v_xp          integer;
  v_rep         boolean;
  v_racha       smallint;
  v_xp_total    integer;
BEGIN
  SELECT * INTO v_i FROM intento WHERE id = p_intento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'intento % no existe', p_intento USING ERRCODE = 'P0002'; END IF;
  IF v_i.estado <> 'en_curso' THEN RAISE EXCEPTION 'el intento % ya terminó', p_intento USING ERRCODE = 'P0001'; END IF;

  SELECT count(*) INTO v_total_pasos FROM paso WHERE nivel_id = v_i.nivel_id;
  IF v_i.pasos_completados < v_total_pasos THEN
    RAISE EXCEPTION 'faltan pasos: % de %', v_i.pasos_completados, v_total_pasos USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_total_preg FROM pregunta WHERE nivel_id = v_i.nivel_id;
  SELECT max(pi.nivel_ayuda) INTO v_max_ayuda FROM pista_usada pu JOIN pista pi ON pi.id = pu.pista_id WHERE pu.intento_id = p_intento;
  SELECT xp_base INTO v_xp_base FROM nivel WHERE id = v_i.nivel_id;

  v_estrellas := fn_calcular_estrellas(v_max_ayuda, v_i.aciertos, v_total_preg);
  v_xp := round(v_xp_base * v_estrellas / 3.0) + 10 * v_i.aciertos - v_i.xp_pistas;
  v_rep := EXISTS (SELECT 1 FROM intento WHERE usuario_id = v_i.usuario_id AND nivel_id = v_i.nivel_id AND estado = 'completado');
  IF v_rep THEN v_xp := round(v_xp * 0.25); END IF;
  v_xp := greatest(0, v_xp);

  UPDATE intento
     SET estado = 'completado', finalizado_en = now(), estrellas = v_estrellas, xp_obtenido = v_xp
   WHERE id = p_intento;
  UPDATE usuario SET xp = xp + v_xp WHERE id = v_i.usuario_id RETURNING xp INTO v_xp_total;
  v_racha := fn_actualizar_racha(v_i.usuario_id);

  RETURN QUERY SELECT v_estrellas, v_xp, v_xp_total, v_racha, v_rep, fn_otorgar_insignias(v_i.usuario_id);
END;
$$;
COMMENT ON FUNCTION fn_finalizar_intento(bigint) IS 'Cierra un intento en una sola transacción y devuelve estrellas, XP, racha e insignias nuevas.';
--rollback DROP FUNCTION IF EXISTS fn_finalizar_intento(bigint);

--changeset adriana.laos:007-7 runOnChange:true splitStatements:false comment:Búsqueda de Quimi en el glosario
CREATE OR REPLACE FUNCTION fn_quimi_buscar(p_consulta text, p_limite integer DEFAULT 3)
RETURNS TABLE (termino varchar, definicion text, relevancia real)
LANGUAGE sql STABLE AS $$
  /* Búsqueda de texto completo (websearch) sin tildes; si no hay coincidencias, usa similitud por prefijo. */
  WITH q AS (SELECT websearch_to_tsquery('es_sin_tildes', p_consulta) AS tsq)
  SELECT g.termino, g.definicion, ts_rank(g.busqueda, q.tsq) AS relevancia
  FROM glosario g, q
  WHERE g.busqueda @@ q.tsq
  ORDER BY relevancia DESC, g.termino
  LIMIT p_limite;
$$;
COMMENT ON FUNCTION fn_quimi_buscar(text, integer) IS 'Motor de respuestas de Quimi: búsqueda de texto completo en el glosario, ordenada por relevancia.';
--rollback DROP FUNCTION IF EXISTS fn_quimi_buscar(text, integer);

--changeset adriana.laos:007-8 runOnChange:true splitStatements:false comment:Generador de códigos de aula
CREATE OR REPLACE FUNCTION fn_generar_codigo_aula()
RETURNS char(6)
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  v_abc  constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_cod  text;
BEGIN
  LOOP
    SELECT string_agg(substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1), '') INTO v_cod FROM generate_series(1, 6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM aula WHERE codigo = v_cod);
  END LOOP;
  RETURN v_cod;
END;
$$;
COMMENT ON FUNCTION fn_generar_codigo_aula() IS 'Código de aula único de 6 caracteres sin letras ambiguas (sin I, O, 0, 1).';
--rollback DROP FUNCTION IF EXISTS fn_generar_codigo_aula();
