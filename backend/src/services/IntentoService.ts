import type { Database } from '../db/Database.js';
import { HttpError, mapPgError, noEncontrado, prohibido } from '../errors.js';

/** Resultado de cerrar un intento. */
export interface ResultadoIntento {
  estrellas: number;
  xp_obtenido: number;
  xp_total: number;
  racha: number;
  es_repeticion: boolean;
  insignias_nuevas: Array<{ codigo: string; nombre: string; descripcion: string; icono: string }>;
}

/**
 * Ciclo de vida de un intento de nivel: iniciar → registrar pasos → pedir ayudas →
 * responder cuestionario → finalizar.
 *
 * Las reglas de negocio viven en PostgreSQL (fn_registrar_paso, fn_usar_pista,
 * fn_finalizar_intento y triggers); este servicio valida propiedad y traduce errores.
 */
export class IntentoService {
  constructor(private readonly db: Database) {}

  /**
   * Inicia un intento si el nivel está desbloqueado para el usuario.
   * Abandona automáticamente intentos anteriores del mismo nivel que quedaron en curso.
   * @param usuarioId Estudiante.
   * @param nivelCodigo Código del nivel (ej. `n01-movimiento`).
   * @returns Identificador del intento.
   */
  async iniciar(usuarioId: number, nivelCodigo: string): Promise<{ intento: number; nivel: string }> {
    return this.db.tx(async (c) => {
      const { rows } = await c.query<{ id: number; previo: number | null }>(
        'SELECT id, nivel_previo_id AS previo FROM nivel WHERE codigo = $1',
        [nivelCodigo],
      );
      const nivel = rows[0];
      if (!nivel) throw noEncontrado('Nivel');
      if (nivel.previo) {
        const ok = await c.query(
          `SELECT 1 FROM intento WHERE usuario_id = $1 AND nivel_id = $2 AND estado = 'completado' LIMIT 1`,
          [usuarioId, nivel.previo],
        );
        if (!ok.rowCount) throw new HttpError(409, 'Este nivel está bloqueado: completa el anterior', 'NIVEL_BLOQUEADO');
      }
      await c.query(
        `UPDATE intento SET estado = 'abandonado', finalizado_en = now()
          WHERE usuario_id = $1 AND nivel_id = $2 AND estado = 'en_curso'`,
        [usuarioId, nivel.id],
      );
      const ins = await c.query<{ id: number }>(
        'INSERT INTO intento (usuario_id, nivel_id) VALUES ($1, $2) RETURNING id',
        [usuarioId, nivel.id],
      );
      return { intento: ins.rows[0].id, nivel: nivelCodigo };
    });
  }

  /**
   * Comprueba que el intento pertenezca al usuario.
   * @throws HttpError 404 / 403.
   */
  private async verificarDueno(intentoId: number, usuarioId: number): Promise<number> {
    const [row] = await this.db.query<{ usuario_id: number; nivel_id: number }>(
      'SELECT usuario_id, nivel_id FROM intento WHERE id = $1',
      [intentoId],
    );
    if (!row) throw noEncontrado('Intento');
    if (row.usuario_id !== usuarioId) throw prohibido('Este intento no es tuyo');
    return row.nivel_id;
  }

  /**
   * Registra que el estudiante completó el paso `orden`.
   * @param segundos Tiempo empleado en el paso (para el dashboard).
   */
  async completarPaso(intentoId: number, usuarioId: number, orden: number, segundos: number) {
    const nivelId = await this.verificarDueno(intentoId, usuarioId);
    try {
      const [r] = await this.db.query<{ orden: number }>(
        `SELECT fn_registrar_paso($1, (SELECT id FROM paso WHERE nivel_id = $2 AND orden = $3), $4) AS orden`,
        [intentoId, nivelId, orden, segundos],
      );
      return { paso: r.orden };
    } catch (e) {
      throw mapPgError(e);
    }
  }

  /**
   * Entrega una ayuda de Quimi (1 = pista, 2 = explicación, 3 = solución).
   * @returns Texto de la ayuda y XP descontada.
   */
  async pedirAyuda(intentoId: number, usuarioId: number, orden: number, nivelAyuda: number) {
    const nivelId = await this.verificarDueno(intentoId, usuarioId);
    try {
      const [r] = await this.db.query<{ texto: string; costo_xp: number; ya_usada: boolean }>(
        `SELECT texto, costo_xp, ya_usada FROM fn_usar_pista($1, (SELECT id FROM paso WHERE nivel_id = $2 AND orden = $3), $4::smallint)`,
        [intentoId, nivelId, orden, nivelAyuda],
      );
      return { texto: r.texto, costoXp: r.ya_usada ? 0 : r.costo_xp, yaUsada: r.ya_usada };
    } catch (e) {
      throw mapPgError(e);
    }
  }

  /**
   * Registra una respuesta del cuestionario. La corrección la decide un trigger en la BD.
   * @returns Si fue correcta, la explicación y cuál era la alternativa correcta.
   */
  async responder(intentoId: number, usuarioId: number, preguntaOrden: number, opcionOrden: number) {
    const nivelId = await this.verificarDueno(intentoId, usuarioId);
    try {
      const [r] = await this.db.query<{ es_correcta: boolean; explicacion: string; correcta: number }>(
        `WITH q AS (SELECT id, explicacion FROM pregunta WHERE nivel_id = $2 AND orden = $3),
              ins AS (
                INSERT INTO respuesta (intento_id, pregunta_id, opcion_id)
                SELECT $1, q.id, o.id FROM q JOIN opcion o ON o.pregunta_id = q.id AND o.orden = $4
                RETURNING es_correcta)
         SELECT ins.es_correcta, q.explicacion,
                (SELECT orden FROM opcion WHERE pregunta_id = q.id AND es_correcta) AS correcta
           FROM ins, q`,
        [intentoId, nivelId, preguntaOrden, opcionOrden],
      );
      if (!r) throw new HttpError(400, 'Pregunta u opción inexistente', 'DATOS_INVALIDOS');
      return { correcta: r.es_correcta, explicacion: r.explicacion, opcionCorrecta: r.correcta };
    } catch (e) {
      throw mapPgError(e);
    }
  }

  /**
   * Cierra el intento: estrellas, XP, racha e insignias (fn_finalizar_intento).
   */
  async finalizar(intentoId: number, usuarioId: number): Promise<ResultadoIntento> {
    await this.verificarDueno(intentoId, usuarioId);
    try {
      const [r] = await this.db.query<Omit<ResultadoIntento, 'insignias_nuevas'> & { insignias_nuevas: string[] }>(
        'SELECT * FROM fn_finalizar_intento($1)',
        [intentoId],
      );
      const insignias = r.insignias_nuevas.length
        ? await this.db.query<ResultadoIntento['insignias_nuevas'][number]>(
            'SELECT codigo, nombre, descripcion, icono FROM insignia WHERE codigo = ANY($1)',
            [r.insignias_nuevas],
          )
        : [];
      return { ...r, insignias_nuevas: insignias };
    } catch (e) {
      throw mapPgError(e);
    }
  }
}
