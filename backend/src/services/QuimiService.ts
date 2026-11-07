import type { Database } from '../db/Database.js';

/** Respuesta del asistente Quimi. */
export interface RespuestaQuimi {
  /** Mensaje principal, en lenguaje para escolares. */
  mensaje: string;
  /** Términos del glosario relacionados (búsqueda de texto completo). */
  terminos: Array<{ termino: string; definicion: string; relevancia: number }>;
  /** Concepto del paso actual, si se indicó nivel y paso. */
  concepto?: string;
}

/**
 * Asistente Quimi basado en reglas (unidad 2).
 *
 * 1. Busca la consulta en el glosario con `fn_quimi_buscar` (FTS en español sin tildes).
 * 2. Si se indica el paso actual, añade su concepto como contexto.
 * 3. Si no hay coincidencias, sugiere usar las ayudas escalonadas del paso.
 *
 * En la unidad 3 se podrá sustituir por un modelo de lenguaje manteniendo esta interfaz.
 */
export class QuimiService {
  constructor(private readonly db: Database) {}

  /**
   * Responde una consulta del estudiante.
   * @param consulta Pregunta libre (ej. "¿qué es la energía de activación?").
   * @param nivel Código del nivel actual (opcional).
   * @param paso Orden del paso actual (opcional).
   */
  async preguntar(consulta: string, nivel?: string, paso?: number): Promise<RespuestaQuimi> {
    const terminos = await this.db.query<RespuestaQuimi['terminos'][number]>(
      'SELECT termino, definicion, relevancia FROM fn_quimi_buscar($1, 3)',
      [consulta],
    );
    let concepto: string | undefined;
    if (nivel && paso) {
      const [r] = await this.db.query<{ concepto: string }>(
        'SELECT p.concepto FROM paso p JOIN nivel n ON n.id = p.nivel_id WHERE n.codigo = $1 AND p.orden = $2',
        [nivel, paso],
      );
      concepto = r?.concepto;
    }
    const mensaje = terminos.length
      ? `Esto te puede ayudar: ${terminos[0].termino.toLowerCase()} — ${terminos[0].definicion}`
      : 'No encontré ese término en mi glosario. Prueba con otras palabras o abre una pista del paso: la primera cuesta poca XP.';
    return { mensaje, terminos, concepto };
  }
}
