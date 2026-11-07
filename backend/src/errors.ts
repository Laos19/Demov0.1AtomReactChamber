/**
 * Error HTTP con código de estado y mensaje seguro para el cliente.
 */
export class HttpError extends Error {
  /**
   * @param status Código HTTP (400, 401, 403, 404, 409…).
   * @param message Mensaje en español mostrado al usuario.
   * @param code Código estable para el cliente (ej. `PASO_FUERA_DE_ORDEN`).
   */
  constructor(
    readonly status: number,
    message: string,
    readonly code = 'ERROR',
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** 404 */
export const noEncontrado = (que: string) => new HttpError(404, `${que} no encontrado`, 'NO_ENCONTRADO');
/** 403 */
export const prohibido = (msg = 'No tienes permiso para esta acción') => new HttpError(403, msg, 'PROHIBIDO');

/**
 * Traduce errores de PostgreSQL a errores HTTP.
 * - `P0001` (RAISE EXCEPTION de nuestras funciones) → 409 con el mensaje de la regla de negocio.
 * - `P0002` (no encontrado en funciones) → 404.
 * - `23505` (unique_violation) → 409.
 * - `23503` / `23514` / `22P02` (FK, CHECK, formato) → 400.
 * @param err Error lanzado por `pg`.
 * @returns HttpError equivalente o el error original si no se reconoce.
 */
export function mapPgError(err: unknown): unknown {
  const e = err as { code?: string; message?: string; constraint?: string };
  switch (e?.code) {
    case 'P0001':
      return new HttpError(409, e.message ?? 'Regla de negocio incumplida', 'REGLA_NEGOCIO');
    case 'P0002':
      return new HttpError(404, e.message ?? 'No encontrado', 'NO_ENCONTRADO');
    case '23505':
      return new HttpError(409, `Ya existe un registro con esos datos${e.constraint ? ` (${e.constraint})` : ''}`, 'DUPLICADO');
    case '23503':
    case '23514':
    case '22P02':
      return new HttpError(400, 'Datos inválidos', 'DATOS_INVALIDOS');
    default:
      return err;
  }
}
