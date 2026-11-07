import type { Database } from '../db/Database.js';
import type { Rol } from '../auth/AuthService.js';
import { HttpError, mapPgError, noEncontrado, prohibido } from '../errors.js';

/**
 * Gestión de aulas: el docente crea aulas y asigna niveles; el estudiante se une con un código.
 */
export class AulaService {
  constructor(private readonly db: Database) {}

  /**
   * Crea un aula (el código de 6 caracteres lo genera un trigger).
   * @param docenteId Docente dueño.
   */
  async crear(docenteId: number, nombre: string, grado: number, seccion: string) {
    try {
      const [a] = await this.db.query(
        `INSERT INTO aula (codigo, nombre, grado, seccion, docente_id) VALUES (NULL, $1, $2, $3, $4)
         RETURNING id, codigo, nombre, grado, seccion, creado_en`,
        [nombre, grado, seccion, docenteId],
      );
      return a;
    } catch (e) {
      throw mapPgError(e);
    }
  }

  /**
   * Lista las aulas del usuario: las que dicta (docente/admin) o en las que está matriculado (estudiante).
   */
  async listar(usuarioId: number, rol: Rol) {
    if (rol === 'estudiante') {
      return this.db.query(
        `SELECT a.id, a.codigo, a.nombre, a.grado, a.seccion, u.nombre AS docente
           FROM matricula m JOIN aula a ON a.id = m.aula_id JOIN usuario u ON u.id = a.docente_id
          WHERE m.estudiante_id = $1 ORDER BY a.nombre`,
        [usuarioId],
      );
    }
    return this.db.query(
      `SELECT a.id, a.codigo, a.nombre, a.grado, a.seccion,
              (SELECT count(*) FROM matricula m WHERE m.aula_id = a.id)::int AS estudiantes
         FROM aula a WHERE a.docente_id = $1 OR $2 = 'admin' ORDER BY a.creado_en DESC`,
      [usuarioId, rol],
    );
  }

  /** Une a un estudiante a un aula por su código. */
  async unirse(estudianteId: number, codigo: string) {
    const [a] = await this.db.query<{ id: number; nombre: string }>('SELECT id, nombre FROM aula WHERE codigo = $1', [codigo]);
    if (!a) throw new HttpError(404, 'No existe un aula con ese código', 'AULA_NO_ENCONTRADA');
    await this.db.query(
      'INSERT INTO matricula (aula_id, estudiante_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [a.id, estudianteId],
    );
    return a;
  }

  /** Verifica que el usuario dicte el aula (o sea admin). */
  private async verificarDocente(aulaId: number, usuarioId: number, rol: Rol) {
    const [a] = await this.db.query<{ docente_id: number }>('SELECT docente_id FROM aula WHERE id = $1', [aulaId]);
    if (!a) throw noEncontrado('Aula');
    if (rol !== 'admin' && a.docente_id !== usuarioId) throw prohibido('No eres docente de esta aula');
  }

  /**
   * Detalle del aula para el docente: ranking, niveles asignados y matriz de progreso estudiante × nivel.
   */
  async detalle(aulaId: number, usuarioId: number, rol: Rol) {
    await this.verificarDocente(aulaId, usuarioId, rol);
    const [aula, ranking, asignados, matriz] = await Promise.all([
      this.db.query('SELECT id, codigo, nombre, grado, seccion FROM aula WHERE id = $1', [aulaId]),
      this.db.query(
        'SELECT puesto, usuario_id, nombre, xp, estrellas_totales, niveles_completados FROM v_ranking_aula WHERE aula_id = $1 ORDER BY puesto',
        [aulaId],
      ),
      this.db.query(
        `SELECT n.codigo, n.titulo, an.fecha_limite FROM aula_nivel an JOIN nivel n ON n.id = an.nivel_id
          WHERE an.aula_id = $1 ORDER BY n.orden`,
        [aulaId],
      ),
      this.db.query(
        `SELECT m.estudiante_id AS usuario_id, n.codigo AS nivel, coalesce(max(i.estrellas), 0)::int AS estrellas,
                count(i.id)::int AS intentos, coalesce(sum(i.pistas_usadas), 0)::int AS pistas
           FROM matricula m CROSS JOIN nivel n
           LEFT JOIN intento i ON i.usuario_id = m.estudiante_id AND i.nivel_id = n.id
          WHERE m.aula_id = $1
          GROUP BY m.estudiante_id, n.codigo, n.orden ORDER BY n.orden`,
        [aulaId],
      ),
    ]);
    return { aula: aula[0], ranking, asignados, matriz };
  }

  /** Asigna un nivel al aula con fecha límite opcional. */
  async asignar(aulaId: number, usuarioId: number, rol: Rol, nivel: string, fechaLimite?: string) {
    await this.verificarDocente(aulaId, usuarioId, rol);
    const [r] = await this.db.query(
      `INSERT INTO aula_nivel (aula_id, nivel_id, fecha_limite)
       SELECT $1, id, $3 FROM nivel WHERE codigo = $2
       ON CONFLICT (aula_id, nivel_id) DO UPDATE SET fecha_limite = EXCLUDED.fecha_limite
       RETURNING aula_id, nivel_id, fecha_limite`,
      [aulaId, nivel, fechaLimite ?? null],
    );
    if (!r) throw noEncontrado('Nivel');
    return r;
  }
}
