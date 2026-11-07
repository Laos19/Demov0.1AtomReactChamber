--liquibase formatted sql

--changeset adriana.laos:009-1 runOnChange:true comment:Entalpía de reacción calculada (ΔH = ΣΔHf productos − ΣΔHf reactivos)
CREATE OR REPLACE VIEW v_reaccion_entalpia AS
SELECT r.codigo,
       r.etiqueta,
       r.ea_kj_mol,
       r.factor_esterico,
       r.enlace,
       string_agg(e.formula, ' + ' ORDER BY rp.posicion) FILTER (WHERE rp.papel = 'reactivo') || ' → ' ||
       string_agg(e.formula, ' + ' ORDER BY rp.posicion) FILTER (WHERE rp.papel = 'producto') AS ecuacion,
       sum(CASE rp.papel WHEN 'producto' THEN e.dhf_kj_mol ELSE -e.dhf_kj_mol END)::numeric(8,2) AS delta_h_kj_mol,
       CASE WHEN sum(CASE rp.papel WHEN 'producto' THEN e.dhf_kj_mol ELSE -e.dhf_kj_mol END) < 0 THEN 'exotérmica' ELSE 'endotérmica' END AS tipo
FROM reaccion r
JOIN reaccion_participante rp ON rp.reaccion_codigo = r.codigo
JOIN especie e ON e.codigo = rp.especie_codigo
GROUP BY r.codigo, r.etiqueta, r.ea_kj_mol, r.factor_esterico, r.enlace;
COMMENT ON VIEW v_reaccion_entalpia IS 'Reacciones con ecuación legible y ΔH derivado de las entalpías de formación (no se almacena: evita redundancia, 3FN).';
--rollback DROP VIEW IF EXISTS v_reaccion_entalpia;

--changeset adriana.laos:009-2 runOnChange:true comment:Progreso por estudiante
CREATE OR REPLACE VIEW v_progreso_estudiante AS
WITH mejores AS (
  SELECT usuario_id, nivel_id, max(estrellas) AS estrellas
  FROM intento WHERE estado = 'completado'
  GROUP BY usuario_id, nivel_id
)
SELECT u.id AS usuario_id,
       u.nombre,
       u.grado,
       u.xp,
       u.racha_actual,
       u.racha_maxima,
       count(m.nivel_id)::int                                        AS niveles_completados,
       coalesce(sum(m.estrellas), 0)::int                            AS estrellas_totales,
       (SELECT count(*) FROM logro_usuario l WHERE l.usuario_id = u.id)::int AS insignias,
       (SELECT max(iniciado_en) FROM intento i WHERE i.usuario_id = u.id) AS ultima_actividad
FROM usuario u
JOIN rol r ON r.id = u.rol_id AND r.codigo = 'estudiante'
LEFT JOIN mejores m ON m.usuario_id = u.id
GROUP BY u.id;
COMMENT ON VIEW v_progreso_estudiante IS 'Resumen de progreso de cada estudiante (mejor puntaje por nivel).';
--rollback DROP VIEW IF EXISTS v_progreso_estudiante;

--changeset adriana.laos:009-3 runOnChange:true comment:Ranking por aula con funciones de ventana
CREATE OR REPLACE VIEW v_ranking_aula AS
SELECT m.aula_id,
       p.usuario_id,
       p.nombre,
       p.xp,
       p.estrellas_totales,
       p.niveles_completados,
       RANK() OVER (PARTITION BY m.aula_id ORDER BY p.xp DESC, p.estrellas_totales DESC) AS puesto
FROM matricula m
JOIN v_progreso_estudiante p ON p.usuario_id = m.estudiante_id;
COMMENT ON VIEW v_ranking_aula IS 'Ranking de estudiantes dentro de cada aula (RANK sobre XP y estrellas).';
--rollback DROP VIEW IF EXISTS v_ranking_aula;

--changeset adriana.laos:009-4 runOnChange:true comment:Estadísticas por nivel y por paso
CREATE OR REPLACE VIEW v_estadisticas_nivel AS
SELECT n.id AS nivel_id,
       n.codigo,
       n.titulo,
       n.orden,
       count(i.id)::int                                                    AS intentos,
       count(i.id) FILTER (WHERE i.estado = 'completado')::int             AS completados,
       round(100.0 * count(i.id) FILTER (WHERE i.estado = 'completado') / nullif(count(i.id), 0), 1) AS tasa_completado,
       round(avg(i.estrellas), 2)                                          AS estrellas_promedio,
       round(avg(i.pistas_usadas), 2)                                      AS pistas_promedio,
       round(avg(extract(epoch FROM i.finalizado_en - i.iniciado_en) / 60) FILTER (WHERE i.estado = 'completado'), 1) AS minutos_promedio
FROM nivel n
LEFT JOIN intento i ON i.nivel_id = n.id
GROUP BY n.id;
COMMENT ON VIEW v_estadisticas_nivel IS 'Tasa de completado, estrellas, pistas y minutos promedio por nivel.';

CREATE OR REPLACE VIEW v_tiempo_por_paso AS
SELECT p.id AS paso_id,
       n.codigo AS nivel_codigo,
       p.orden,
       p.titulo,
       count(ip.intento_id)::int AS veces,
       round(avg(ip.segundos), 1) AS segundos_promedio,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY ip.segundos) AS segundos_mediana
FROM paso p
JOIN nivel n ON n.id = p.nivel_id
LEFT JOIN intento_paso ip ON ip.paso_id = p.id
GROUP BY p.id, n.codigo;
COMMENT ON VIEW v_tiempo_por_paso IS 'Tiempo promedio y mediana por paso: detecta pasos difíciles.';

CREATE OR REPLACE VIEW v_preguntas_dificiles AS
SELECT q.id AS pregunta_id,
       n.codigo AS nivel_codigo,
       q.enunciado,
       count(r.*)::int AS respuestas,
       round(100.0 * count(r.*) FILTER (WHERE NOT r.es_correcta) / nullif(count(r.*), 0), 1) AS porcentaje_error
FROM pregunta q
JOIN nivel n ON n.id = q.nivel_id
LEFT JOIN respuesta r ON r.pregunta_id = q.id
GROUP BY q.id, n.codigo;
COMMENT ON VIEW v_preguntas_dificiles IS 'Porcentaje de error por pregunta del cuestionario (errores más comunes).';
--rollback DROP VIEW IF EXISTS v_preguntas_dificiles; DROP VIEW IF EXISTS v_tiempo_por_paso; DROP VIEW IF EXISTS v_estadisticas_nivel;

--changeset adriana.laos:009-5 comment:Vista materializada de uso diario
CREATE MATERIALIZED VIEW mv_uso_diario AS
SELECT d::date AS dia,
       (SELECT count(*) FROM sesion s WHERE s.iniciada_en >= d AND s.iniciada_en < d + interval '1 day')::int AS sesiones,
       (SELECT count(DISTINCT s.usuario_id) FROM sesion s WHERE s.iniciada_en >= d AND s.iniciada_en < d + interval '1 day')::int AS usuarios_activos,
       (SELECT count(*) FROM evento e WHERE e.creado_en >= d AND e.creado_en < d + interval '1 day')::int AS eventos,
       (SELECT count(*) FROM intento i WHERE i.estado = 'completado' AND i.finalizado_en >= d AND i.finalizado_en < d + interval '1 day')::int AS niveles_completados,
       (SELECT count(*) FROM pista_usada p WHERE p.usada_en >= d AND p.usada_en < d + interval '1 day')::int AS pistas_usadas
FROM generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') AS d;
CREATE UNIQUE INDEX ux_mv_uso_diario_dia ON mv_uso_diario (dia);
COMMENT ON MATERIALIZED VIEW mv_uso_diario IS 'Uso de los últimos 30 días para el dashboard. Se refresca con fn_refrescar_dashboard() (REFRESH CONCURRENTLY).';
--rollback DROP MATERIALIZED VIEW IF EXISTS mv_uso_diario;

--changeset adriana.laos:009-6 runOnChange:true splitStatements:false comment:Refresco del dashboard
CREATE OR REPLACE FUNCTION fn_refrescar_dashboard() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_uso_diario;
END;
$$;
COMMENT ON FUNCTION fn_refrescar_dashboard() IS 'Refresca mv_uso_diario sin bloquear lecturas.';
--rollback DROP FUNCTION IF EXISTS fn_refrescar_dashboard();
