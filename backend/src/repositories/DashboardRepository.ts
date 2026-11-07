import type { Database } from '../db/Database.js';
import type { EventosBody } from '../schemas.js';

/**
 * Métricas de utilización del producto (dashboard) y registro de telemetría.
 * Las consultas leen vistas (v_*) y la vista materializada mv_uso_diario.
 */
export class DashboardRepository {
  constructor(private readonly db: Database) {}

  /**
   * Resumen para el dashboard de docentes y administradores.
   * @param refrescar Si es verdadero, refresca mv_uso_diario antes de leer.
   */
  async resumen(refrescar = true) {
    if (refrescar) await this.db.query('SELECT fn_refrescar_dashboard()');
    const [kpis, usoDiario, niveles, pasosLentos, preguntas, origen, dispositivo, insignias] = await Promise.all([
      this.db.query(`
        SELECT (SELECT count(*) FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE r.codigo = 'estudiante')::int AS estudiantes,
               (SELECT count(*) FROM aula)::int AS aulas,
               (SELECT count(*) FROM sesion WHERE iniciada_en > now() - interval '7 days')::int AS sesiones_7d,
               (SELECT count(DISTINCT usuario_id) FROM sesion WHERE iniciada_en > now() - interval '7 days')::int AS activos_7d,
               (SELECT count(*) FROM intento WHERE estado = 'completado')::int AS niveles_completados,
               (SELECT round(100.0 * count(*) FILTER (WHERE estado = 'completado') / nullif(count(*), 0), 1) FROM intento) AS tasa_completado,
               (SELECT round(100.0 * count(*) FILTER (WHERE es_correcta) / nullif(count(*), 0), 1) FROM respuesta) AS aciertos_cuestionario,
               (SELECT round(avg(pistas_usadas), 2) FROM intento WHERE estado = 'completado') AS pistas_por_nivel`),
      this.db.query('SELECT dia, sesiones, usuarios_activos, eventos, niveles_completados, pistas_usadas FROM mv_uso_diario ORDER BY dia'),
      this.db.query('SELECT codigo, titulo, orden, intentos, completados, tasa_completado, estrellas_promedio, pistas_promedio, minutos_promedio FROM v_estadisticas_nivel ORDER BY orden'),
      this.db.query('SELECT nivel_codigo, orden, titulo, veces, segundos_promedio FROM v_tiempo_por_paso WHERE veces > 0 ORDER BY segundos_promedio DESC LIMIT 5'),
      this.db.query('SELECT nivel_codigo, enunciado, respuestas, porcentaje_error FROM v_preguntas_dificiles WHERE respuestas > 0 ORDER BY porcentaje_error DESC, respuestas DESC LIMIT 5'),
      this.db.query('SELECT origen, count(*)::int AS sesiones FROM sesion GROUP BY origen ORDER BY 2 DESC'),
      this.db.query('SELECT dispositivo, count(*)::int AS sesiones FROM sesion GROUP BY dispositivo ORDER BY 2 DESC'),
      this.db.query(`SELECT i.nombre, count(l.*)::int AS otorgadas FROM insignia i LEFT JOIN logro_usuario l ON l.insignia_codigo = i.codigo
                      GROUP BY i.codigo ORDER BY 2 DESC`),
    ]);
    return { kpis: kpis[0], usoDiario, niveles, pasosLentos, preguntas, origen, dispositivo, insignias };
  }

  /**
   * Registra un lote de eventos de uso. Crea o actualiza la sesión (upsert) y valida niveles.
   * @param body Lote validado.
   * @param usuarioId Usuario autenticado o `null` (uso anónimo).
   * @returns Cantidad de eventos insertados.
   */
  async registrarEventos(body: EventosBody, usuarioId: number | null): Promise<number> {
    return this.db.tx(async (c) => {
      await c.query(
        `INSERT INTO sesion (id, usuario_id, origen, dispositivo) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET ultima_actividad = now(), usuario_id = coalesce(sesion.usuario_id, EXCLUDED.usuario_id)`,
        [body.sesion, usuarioId, body.origen, body.dispositivo],
      );
      const { rowCount } = await c.query(
        `INSERT INTO evento (sesion_id, usuario_id, tipo, nivel_id, datos)
         SELECT $1, $2, e.tipo, n.id, e.datos
           FROM jsonb_to_recordset($3::jsonb) AS e(tipo text, nivel text, datos jsonb)
           LEFT JOIN nivel n ON n.codigo = e.nivel`,
        [body.sesion, usuarioId, JSON.stringify(body.eventos)],
      );
      return rowCount ?? 0;
    });
  }
}
