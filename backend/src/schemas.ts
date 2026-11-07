import { z } from 'zod';

/**
 * Convierte un esquema zod a JSON Schema (draft-07) para que Fastify valide con Ajv
 * y @fastify/swagger documente la API con el mismo contrato.
 * @param schema Esquema zod.
 */
export function js(schema: z.ZodType): Record<string, unknown> {
  const out = z.toJSONSchema(schema, { target: 'draft-7', io: 'input' }) as Record<string, unknown>;
  delete out.$schema;
  return out;
}

export const Email = z.string().trim().toLowerCase().email().max(120);
export const Password = z.string().min(8, 'mínimo 8 caracteres').max(72);

export const RegistroBody = z.object({
  nombre: z.string().trim().min(2).max(80),
  email: Email,
  password: Password,
  rol: z.enum(['estudiante', 'docente']).default('estudiante'),
  grado: z.number().int().min(1).max(5).optional(),
  codigoDocente: z.string().optional(),
});
export type RegistroBody = z.infer<typeof RegistroBody>;

export const LoginBody = z.object({ email: Email, password: z.string().min(1).max(72) });
export type LoginBody = z.infer<typeof LoginBody>;

export const IdParam = z.object({ id: z.coerce.number().int().positive() });

export const NuevoIntentoBody = z.object({ nivel: z.string().min(1).max(30) });
export const PasoBody = z.object({ orden: z.number().int().min(1), segundos: z.number().int().min(0).max(86_400) });
export const PistaBody = z.object({ orden: z.number().int().min(1), nivelAyuda: z.number().int().min(1).max(3) });
export const RespuestaBody = z.object({ pregunta: z.number().int().min(1), opcion: z.number().int().min(1) });

export const QuimiQuery = z.object({
  q: z.string().trim().min(2).max(200),
  nivel: z.string().max(30).optional(),
  paso: z.coerce.number().int().min(1).optional(),
});

export const NuevaAulaBody = z.object({
  nombre: z.string().trim().min(3).max(60),
  grado: z.number().int().min(1).max(5),
  seccion: z.string().trim().min(1).max(3).default('A'),
});
export const UnirseBody = z.object({ codigo: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/) });
export const AsignarBody = z.object({ nivel: z.string().min(1).max(30), fechaLimite: z.iso.date().optional() });

export const TiposEvento = [
  'pagina_vista', 'nivel_iniciado', 'paso_completado', 'pista_usada', 'nivel_completado',
  'cuestionario_respondido', 'preset_cargado', 'chispa', 'reaccion_observada', 'quimi_consulta',
  'insignia_obtenida', 'error_cliente',
] as const;

export const EventosBody = z.object({
  sesion: z.uuid(),
  origen: z.enum(['web', 'vscode', 'claude', 'mcp']).default('web'),
  dispositivo: z.enum(['escritorio', 'tablet', 'movil']).default('escritorio'),
  eventos: z
    .array(
      z.object({
        tipo: z.enum(TiposEvento),
        nivel: z.string().max(30).optional(),
        datos: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .min(1)
    .max(50),
});
export type EventosBody = z.infer<typeof EventosBody>;
