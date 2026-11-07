import pg from 'pg';

/** Cliente transaccional expuesto a los repositorios. */
export type Queryable = Pick<pg.PoolClient, 'query'>;

/**
 * Envoltura del pool de conexiones de PostgreSQL.
 *
 * - Un único pool por proceso (Neon free tier admite pocas conexiones simultáneas).
 * - `tx()` ejecuta una función dentro de BEGIN/COMMIT con ROLLBACK automático ante errores.
 * - SSL automático cuando la URL apunta a un host remoto (Neon exige TLS).
 */
export class Database {
  /** Pool subyacente de `pg`. */
  readonly pool: pg.Pool;

  /**
   * @param connectionString URL de conexión `postgres://usuario:clave@host/db`.
   * @param ssl Modo SSL: `auto` activa TLS si el host no es local.
   */
  constructor(connectionString: string, ssl: 'auto' | 'require' | 'disable' = 'auto') {
    const local = /@(localhost|127\.0\.0\.1|postgres)(:|\/)/.test(connectionString);
    const useSsl = ssl === 'require' || (ssl === 'auto' && !local && !connectionString.includes('sslmode=disable'));
    this.pool = new pg.Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
    // numeric → number (los valores del catálogo caben en double sin pérdida relevante).
    pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));
    pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));
  }

  /**
   * Ejecuta una consulta parametrizada (protege contra inyección SQL).
   * @param text SQL con marcadores `$1, $2…`.
   * @param params Valores de los marcadores.
   * @returns Filas resultantes tipadas.
   */
  async query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.pool.query<T>(text, params);
    return res.rows;
  }

  /**
   * Ejecuta `fn` en una transacción.
   * @param fn Función que recibe el cliente transaccional.
   * @returns El valor devuelto por `fn`.
   */
  async tx<T>(fn: (client: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const out = await fn(client);
      await client.query('COMMIT');
      return out;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Comprueba conectividad (usado por /api/health). */
  async ping(): Promise<boolean> {
    const [row] = await this.query<{ ok: number }>('SELECT 1 AS ok');
    return row?.ok === 1;
  }

  /** Cierra el pool (al apagar el servidor o al terminar las pruebas). */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
