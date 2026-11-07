import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { API_VERSION, type Config } from './config.js';
import { Database } from './db/Database.js';
import { AuthService, type Rol, type TokenPayload } from './auth/AuthService.js';
import { CatalogoRepository } from './repositories/CatalogoRepository.js';
import { JuegoRepository } from './repositories/JuegoRepository.js';
import { DashboardRepository } from './repositories/DashboardRepository.js';
import { IntentoService } from './services/IntentoService.js';
import { QuimiService } from './services/QuimiService.js';
import { AulaService } from './services/AulaService.js';
import { HttpError, mapPgError } from './errors.js';
import { registrarRutas } from './routes/index.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Exige un JWT válido. */
    autenticar: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Exige un JWT válido con alguno de los roles indicados. */
    requiereRol: (...roles: Rol[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Intenta leer el JWT sin exigirlo (uso anónimo permitido). */
    usuarioOpcional: (req: FastifyRequest) => Promise<TokenPayload | null>;
    servicios: Servicios;
  }
}

/** Contenedor de dependencias (inyección manual, sin framework). */
export interface Servicios {
  db: Database;
  auth: AuthService;
  catalogo: CatalogoRepository;
  juego: JuegoRepository;
  dashboard: DashboardRepository;
  intentos: IntentoService;
  quimi: QuimiService;
  aulas: AulaService;
}

/**
 * Construye la aplicación Fastify con seguridad, documentación OpenAPI y rutas.
 * Separado de `server.ts` para poder probarla sin abrir un puerto (`app.inject`).
 * @param config Configuración validada.
 * @param db Instancia de base de datos (inyectable en pruebas).
 */
export async function buildApp(config: Config, db = new Database(config.DATABASE_URL, config.DB_SSL)): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.NODE_ENV === 'test' ? false : { level: 'info', redact: ['req.headers.authorization', 'body.password'] },
    trustProxy: true,
    ajv: { customOptions: { removeAdditional: 'all', coerceTypes: true, useDefaults: true } },
  });

  const servicios: Servicios = {
    db,
    auth: new AuthService(db, config.DOCENTE_CODIGO),
    catalogo: new CatalogoRepository(db),
    juego: new JuegoRepository(db),
    dashboard: new DashboardRepository(db),
    intentos: new IntentoService(db),
    quimi: new QuimiService(db),
    aulas: new AulaService(db),
  };
  app.decorate('servicios', servicios);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST', 'OPTIONS'],
  });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  await app.register(jwt, { secret: config.JWT_SECRET, sign: { expiresIn: '7d' } });

  app.decorate('autenticar', async (req: FastifyRequest) => {
    try {
      await req.jwtVerify();
    } catch {
      throw new HttpError(401, 'Inicia sesión para continuar', 'NO_AUTENTICADO');
    }
  });
  app.decorate('requiereRol', (...roles: Rol[]) => async (req: FastifyRequest, reply: FastifyReply) => {
    await app.autenticar(req, reply);
    if (!roles.includes(req.user.rol)) throw new HttpError(403, 'Tu rol no permite esta acción', 'PROHIBIDO');
  });
  app.decorate('usuarioOpcional', async (req: FastifyRequest) => {
    if (!req.headers.authorization) return null;
    try {
      return await req.jwtVerify<TokenPayload>();
    } catch {
      return null;
    }
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'AtomReactChamber API',
        description: 'API del laboratorio virtual de química gamificado (UPT · Base de Datos II).',
        version: API_VERSION,
      },
      servers: [{ url: '/' }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
      tags: [
        { name: 'sistema' }, { name: 'auth' }, { name: 'catálogo' }, { name: 'juego' },
        { name: 'intentos' }, { name: 'quimi' }, { name: 'aulas' }, { name: 'dashboard' },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/api/docs' });

  app.setErrorHandler((err, req, reply) => {
    const mapped = mapPgError(err);
    if (mapped instanceof HttpError) {
      return reply.status(mapped.status).send({ error: mapped.code, mensaje: mapped.message });
    }
    const e = err as { validation?: unknown; statusCode?: number; message: string };
    if (e.validation) {
      return reply.status(400).send({ error: 'VALIDACION', mensaje: e.message });
    }
    if (e.statusCode && e.statusCode < 500) {
      return reply.status(e.statusCode).send({ error: 'ERROR', mensaje: e.message });
    }
    req.log.error(err);
    return reply.status(500).send({ error: 'INTERNO', mensaje: 'Ocurrió un error inesperado' });
  });

  await app.register(registrarRutas, { prefix: '/api' });

  app.addHook('onClose', async () => {
    await db.close();
  });
  return app;
}
