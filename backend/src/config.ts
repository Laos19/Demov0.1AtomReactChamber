import { z } from 'zod';

/**
 * Esquema de configuración leída de variables de entorno.
 * Falla rápido al iniciar si falta algo obligatorio (principio *fail fast*).
 */
const ConfigSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  CORS_ORIGIN: z.string().default('*'),
  DOCENTE_CODIGO: z.string().min(4).default('UPT2026'),
  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DB_SSL: z.enum(['auto', 'require', 'disable']).default('auto'),
});

/** Configuración tipada de la API. */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Carga y valida la configuración desde `process.env` (o un objeto dado, útil en pruebas).
 * @param env Variables de entorno a validar.
 * @returns Configuración validada.
 * @throws Error con la lista de variables inválidas.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const detalle = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuración inválida → ${detalle}`);
  }
  return parsed.data;
}

/** Versión de la API publicada en /api/health y en OpenAPI. */
export const API_VERSION = '2.0.0';
