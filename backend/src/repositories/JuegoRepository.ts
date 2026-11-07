import type { Database } from '../db/Database.js';

/** Nivel tal como lo recibe el cliente (sin textos de pistas ni respuestas correctas). */
export interface NivelPublico {
  codigo: string;
  mision: string;
  orden: number;
  titulo: string;
  [k: string]: unknown;
}

/** Progreso del usuario en un nivel. */
export interface ProgresoNivel {
  nivel: string;
  completado: boolean;
  estrellas: number;
  intentos: number;
  desbloqueado: boolean;
}

/**
 * Contenido del juego: misiones, niveles, pasos y cuestionarios.
 * Oculta al cliente lo que permitiría hacer trampa (texto de pistas y alternativa correcta).
 */
export class JuegoRepository {
  constructor(private readonly db: Database) {}

  /** Contenido público del juego (misiones, niveles con pasos y cuestionario, insignias). */
  async contenido(): Promise<{ misiones: unknown[]; niveles: NivelPublico[]; insignias: unknown[]; costos_pista: Record<string, number> }> {
    const [misiones, niveles, insignias, costos] = await Promise.all([
      this.db.query('SELECT codigo, titulo, descripcion, competencia, color, orden FROM mision ORDER BY orden'),
      this.db.query<NivelPublico>(`
        SELECT n.codigo, m.codigo AS mision, n.orden, n.titulo, n.resumen, n.objetivo, n.grado, n.xp_base AS xp,
               n.minutos_estim AS minutos, n.casilla_nota, n.inicio, n.controles, n.especies,
               json_build_object('simbolo', n.casilla_simbolo, 'fila', n.casilla_fila, 'columna', n.casilla_columna) AS casilla,
               (SELECT json_agg(json_build_object('orden', p.orden, 'titulo', p.titulo, 'instruccion', p.instruccion,
                                                  'concepto', p.concepto, 'condicion', p.condicion,
                                                  'ayudas', (SELECT count(*) FROM pista WHERE paso_id = p.id))
                                ORDER BY p.orden) FROM paso p WHERE p.nivel_id = n.id) AS pasos,
               (SELECT json_agg(json_build_object('orden', q.orden, 'enunciado', q.enunciado,
                                                  'opciones', (SELECT json_agg(json_build_object('orden', o.orden, 'texto', o.texto) ORDER BY o.orden)
                                                                 FROM opcion o WHERE o.pregunta_id = q.id))
                                ORDER BY q.orden) FROM pregunta q WHERE q.nivel_id = n.id) AS cuestionario
          FROM nivel n JOIN mision m ON m.id = n.mision_id
         ORDER BY n.orden`),
      this.db.query('SELECT codigo, nombre, descripcion, icono, tipo, umbral FROM insignia ORDER BY umbral, codigo'),
      this.db.query<{ nivel_ayuda: number; costo: number }>('SELECT DISTINCT nivel_ayuda, costo_xp AS costo FROM pista ORDER BY 1'),
    ]);
    const costos_pista = Object.fromEntries(costos.map((c) => [String(c.nivel_ayuda), c.costo]));
    return { misiones, niveles, insignias, costos_pista };
  }

  /**
   * Progreso por nivel de un usuario, incluyendo si está desbloqueado
   * (un nivel se desbloquea al completar el anterior).
   * @param usuarioId Usuario autenticado.
   */
  async progreso(usuarioId: number): Promise<ProgresoNivel[]> {
    return this.db.query<ProgresoNivel>(
      `WITH p AS (
         SELECT nivel_id, bool_or(estado = 'completado') AS completado, coalesce(max(estrellas), 0) AS estrellas, count(*)::int AS intentos
           FROM intento WHERE usuario_id = $1 GROUP BY nivel_id)
       SELECT n.codigo AS nivel, coalesce(p.completado, false) AS completado, coalesce(p.estrellas, 0)::int AS estrellas,
              coalesce(p.intentos, 0) AS intentos,
              (n.nivel_previo_id IS NULL OR coalesce(pp.completado, false)) AS desbloqueado
         FROM nivel n
         LEFT JOIN p ON p.nivel_id = n.id
         LEFT JOIN p pp ON pp.nivel_id = n.nivel_previo_id
        ORDER BY n.orden`,
      [usuarioId],
    );
  }

  /**
   * Perfil del usuario: insignias e historial reciente.
   * @param usuarioId Usuario autenticado.
   */
  async perfil(usuarioId: number) {
    const [insignias, historial, resumen] = await Promise.all([
      this.db.query(
        `SELECT i.codigo, i.nombre, i.descripcion, i.icono, l.obtenido_en
           FROM logro_usuario l JOIN insignia i ON i.codigo = l.insignia_codigo
          WHERE l.usuario_id = $1 ORDER BY l.obtenido_en DESC`,
        [usuarioId],
      ),
      this.db.query(
        `SELECT n.codigo AS nivel, n.titulo, i.estado, i.estrellas, i.xp_obtenido, i.pistas_usadas, i.iniciado_en, i.finalizado_en
           FROM intento i JOIN nivel n ON n.id = i.nivel_id
          WHERE i.usuario_id = $1 ORDER BY i.iniciado_en DESC LIMIT 20`,
        [usuarioId],
      ),
      this.db.query(
        `SELECT u.xp, u.racha_actual AS racha, u.racha_maxima,
                coalesce(p.niveles_completados, 0) AS niveles_completados, coalesce(p.estrellas_totales, 0) AS estrellas_totales
           FROM usuario u LEFT JOIN v_progreso_estudiante p ON p.usuario_id = u.id WHERE u.id = $1`,
        [usuarioId],
      ),
    ]);
    return { resumen: resumen[0], insignias, historial };
  }
}
