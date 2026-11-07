import type { FastifyInstance } from 'fastify';
import { API_VERSION } from '../config.js';
import { AuthService } from '../auth/AuthService.js';
import {
  AsignarBody, EventosBody, IdParam, LoginBody, NuevaAulaBody, NuevoIntentoBody, PasoBody, PistaBody,
  QuimiQuery, RegistroBody, RespuestaBody, UnirseBody, js,
} from '../schemas.js';
import type { z } from 'zod';

const auth = [{ bearerAuth: [] }];

/**
 * Registra todas las rutas bajo /api.
 * Cada ruta declara su esquema (validación + OpenAPI) a partir de los esquemas zod.
 */
export async function registrarRutas(app: FastifyInstance): Promise<void> {
  const s = app.servicios;

  /* ------------------------------ sistema ------------------------------ */
  app.get('/health', { schema: { tags: ['sistema'], summary: 'Estado de la API y de la base de datos' } }, async () => {
    let db = 'ok';
    try {
      await s.db.ping();
    } catch {
      db = 'error';
    }
    return { estado: db === 'ok' ? 'ok' : 'degradado', db, version: API_VERSION, hora: new Date().toISOString() };
  });

  /* -------------------------------- auth -------------------------------- */
  app.post('/auth/registro', {
    schema: { tags: ['auth'], summary: 'Crear cuenta (estudiante o docente con código)', body: js(RegistroBody) },
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const u = await s.auth.registrar(req.body as z.infer<typeof RegistroBody>);
    return reply.status(201).send({ usuario: u, token: app.jwt.sign(AuthService.payload(u)) });
  });

  app.post('/auth/login', {
    schema: { tags: ['auth'], summary: 'Iniciar sesión y obtener JWT', body: js(LoginBody) },
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (req) => {
    const u = await s.auth.login(req.body as z.infer<typeof LoginBody>);
    return { usuario: u, token: app.jwt.sign(AuthService.payload(u)) };
  });

  app.get('/auth/yo', { schema: { tags: ['auth'], summary: 'Usuario autenticado', security: auth }, onRequest: [app.autenticar] },
    async (req) => ({ usuario: await s.auth.obtener(req.user.sub) }));

  /* ------------------------------ catálogo ------------------------------ */
  app.get('/catalogo', { schema: { tags: ['catálogo'], summary: 'Elementos, especies, reacciones (con ΔH), fotólisis y presets' } },
    async (_req, reply) => {
      reply.header('Cache-Control', 'public, max-age=300');
      return s.catalogo.obtener();
    });

  /* -------------------------------- juego ------------------------------- */
  app.get('/juego', { schema: { tags: ['juego'], summary: 'Misiones, niveles, pasos y cuestionarios (sin respuestas)' } },
    async () => s.juego.contenido());

  app.get('/progreso', { schema: { tags: ['juego'], summary: 'Progreso por nivel del usuario', security: auth }, onRequest: [app.autenticar] },
    async (req) => ({ niveles: await s.juego.progreso(req.user.sub) }));

  app.get('/perfil', { schema: { tags: ['juego'], summary: 'XP, racha, insignias e historial', security: auth }, onRequest: [app.autenticar] },
    async (req) => ({ usuario: await s.auth.obtener(req.user.sub), ...(await s.juego.perfil(req.user.sub)) }));

  /* ------------------------------ intentos ------------------------------ */
  const soloEstudiante = { onRequest: [app.requiereRol('estudiante', 'docente', 'admin')] };
  app.post('/intentos', { ...soloEstudiante, schema: { tags: ['intentos'], summary: 'Iniciar un nivel', security: auth, body: js(NuevoIntentoBody) } },
    async (req, reply) => reply.status(201).send(await s.intentos.iniciar(req.user.sub, (req.body as { nivel: string }).nivel)));

  app.post('/intentos/:id/pasos', {
    ...soloEstudiante,
    schema: { tags: ['intentos'], summary: 'Marcar paso completado', security: auth, params: js(IdParam), body: js(PasoBody) },
  }, async (req) => {
    const { id } = req.params as { id: number };
    const b = req.body as z.infer<typeof PasoBody>;
    return s.intentos.completarPaso(id, req.user.sub, b.orden, b.segundos);
  });

  app.post('/intentos/:id/ayudas', {
    ...soloEstudiante,
    schema: { tags: ['intentos'], summary: 'Pedir ayuda escalonada de Quimi (cuesta XP)', security: auth, params: js(IdParam), body: js(PistaBody) },
  }, async (req) => {
    const { id } = req.params as { id: number };
    const b = req.body as z.infer<typeof PistaBody>;
    return s.intentos.pedirAyuda(id, req.user.sub, b.orden, b.nivelAyuda);
  });

  app.post('/intentos/:id/respuestas', {
    ...soloEstudiante,
    schema: { tags: ['intentos'], summary: 'Responder pregunta del cuestionario', security: auth, params: js(IdParam), body: js(RespuestaBody) },
  }, async (req) => {
    const { id } = req.params as { id: number };
    const b = req.body as z.infer<typeof RespuestaBody>;
    return s.intentos.responder(id, req.user.sub, b.pregunta, b.opcion);
  });

  app.post('/intentos/:id/finalizar', {
    ...soloEstudiante,
    schema: { tags: ['intentos'], summary: 'Cerrar intento: estrellas, XP, racha e insignias', security: auth, params: js(IdParam) },
  }, async (req) => s.intentos.finalizar((req.params as { id: number }).id, req.user.sub));

  /* -------------------------------- quimi ------------------------------- */
  app.get('/quimi', { schema: { tags: ['quimi'], summary: 'Preguntar a Quimi (glosario con búsqueda de texto completo)', querystring: js(QuimiQuery) } },
    async (req) => {
      const q = req.query as z.infer<typeof QuimiQuery>;
      return s.quimi.preguntar(q.q, q.nivel, q.paso);
    });

  /* -------------------------------- aulas ------------------------------- */
  const docente = { onRequest: [app.requiereRol('docente', 'admin')] };
  app.post('/aulas', { ...docente, schema: { tags: ['aulas'], summary: 'Crear aula', security: auth, body: js(NuevaAulaBody) } },
    async (req, reply) => {
      const b = req.body as z.infer<typeof NuevaAulaBody>;
      return reply.status(201).send(await s.aulas.crear(req.user.sub, b.nombre, b.grado, b.seccion));
    });

  app.get('/aulas', { onRequest: [app.autenticar], schema: { tags: ['aulas'], summary: 'Mis aulas', security: auth } },
    async (req) => ({ aulas: await s.aulas.listar(req.user.sub, req.user.rol) }));

  app.post('/aulas/unirse', { onRequest: [app.autenticar], schema: { tags: ['aulas'], summary: 'Unirse a un aula con código', security: auth, body: js(UnirseBody) } },
    async (req) => s.aulas.unirse(req.user.sub, (req.body as { codigo: string }).codigo));

  app.get('/aulas/:id', { ...docente, schema: { tags: ['aulas'], summary: 'Ranking y progreso del aula', security: auth, params: js(IdParam) } },
    async (req) => s.aulas.detalle((req.params as { id: number }).id, req.user.sub, req.user.rol));

  app.post('/aulas/:id/niveles', {
    ...docente,
    schema: { tags: ['aulas'], summary: 'Asignar nivel al aula', security: auth, params: js(IdParam), body: js(AsignarBody) },
  }, async (req) => {
    const b = req.body as z.infer<typeof AsignarBody>;
    return s.aulas.asignar((req.params as { id: number }).id, req.user.sub, req.user.rol, b.nivel, b.fechaLimite);
  });

  /* ------------------------------ dashboard ----------------------------- */
  app.get('/dashboard', { ...docente, schema: { tags: ['dashboard'], summary: 'Métricas de utilización del producto', security: auth } },
    async () => s.dashboard.resumen());

  app.post('/eventos', {
    schema: { tags: ['dashboard'], summary: 'Registrar eventos de uso (anónimo o autenticado)', body: js(EventosBody) },
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const u = await app.usuarioOpcional(req);
    const n = await s.dashboard.registrarEventos(req.body as z.infer<typeof EventosBody>, u?.sub ?? null);
    return reply.status(202).send({ registrados: n });
  });
}
