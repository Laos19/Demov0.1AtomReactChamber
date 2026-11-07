/**
 * Pruebas de integración de la API contra PostgreSQL real (migrado con Liquibase).
 * Requiere DATABASE_URL. En CI se usa un contenedor postgres:16.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/arc';
let app: FastifyInstance;
const sufijo = Date.now();
let token = '';
let tokenDocente = '';

beforeAll(async () => {
  app = await buildApp(loadConfig({ DATABASE_URL, JWT_SECRET: 'p'.repeat(40), NODE_ENV: 'test', DOCENTE_CODIGO: 'PRUEBA' }));
  await app.ready();
});
afterAll(async () => {
  await app.servicios.db.query("DELETE FROM aula WHERE docente_id IN (SELECT id FROM usuario WHERE email LIKE 'test-%@prueba.pe')");
  await app.servicios.db.query("DELETE FROM usuario WHERE email LIKE 'test-%@prueba.pe'");
  await app.close();
});

const post = (url: string, payload: unknown, t = token) =>
  app.inject({ method: 'POST', url, payload: payload as object, headers: t ? { authorization: `Bearer ${t}` } : {} });
const get = (url: string, t = token) => app.inject({ method: 'GET', url, headers: t ? { authorization: `Bearer ${t}` } : {} });

describe('sistema y catálogo', () => {
  it('GET /api/health responde ok con la BD conectada', async () => {
    const r = await get('/api/health', '');
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ estado: 'ok', db: 'ok' });
  });

  it('GET /api/catalogo devuelve especies y ΔH calculado por la vista', async () => {
    const c = (await get('/api/catalogo', '')).json();
    expect(c.especies).toHaveLength(13);
    const co2 = c.reacciones.find((r: { codigo: string }) => r.codigo === 'co2');
    expect(co2.dh).toBeCloseTo(-393.5);
    expect(co2.reactivos).toEqual(['C', 'O2']);
  });

  it('GET /api/juego no expone respuestas correctas ni texto de pistas', async () => {
    const j = (await get('/api/juego', '')).json();
    expect(j.niveles).toHaveLength(9);
    const txt = JSON.stringify(j);
    expect(txt).not.toContain('es_correcta');
    expect(j.niveles[0].pasos[0].ayudas).toBe(3);
  });

  it('GET /api/openapi documenta las rutas', async () => {
    const r = await get('/api/docs/json', '');
    expect(r.statusCode).toBe(200);
    expect(Object.keys(r.json().paths)).toContain('/api/intentos/{id}/finalizar');
  });
});

describe('autenticación', () => {
  it('registra un estudiante y devuelve JWT', async () => {
    const r = await post('/api/auth/registro', { nombre: 'Test Alumna', email: `test-${sufijo}@prueba.pe`, password: 'secreta123', grado: 3 }, '');
    expect(r.statusCode).toBe(201);
    token = r.json().token;
    expect(r.json().usuario).toMatchObject({ rol: 'estudiante', xp: 0, grado: 3 });
  });

  it('rechaza correo duplicado (índice único sin distinguir mayúsculas)', async () => {
    const r = await post('/api/auth/registro', { nombre: 'Otra', email: `TEST-${sufijo}@prueba.pe`, password: 'secreta123' }, '');
    expect(r.statusCode).toBe(409);
  });

  it('rechaza docente sin código y login con clave incorrecta', async () => {
    expect((await post('/api/auth/registro', { nombre: 'Doc', email: `test-d${sufijo}@prueba.pe`, password: 'secreta123', rol: 'docente' }, '')).statusCode).toBe(403);
    expect((await post('/api/auth/login', { email: `test-${sufijo}@prueba.pe`, password: 'mala' }, '')).statusCode).toBe(401);
  });

  it('protege rutas privadas', async () => {
    expect((await get('/api/perfil', '')).statusCode).toBe(401);
    expect((await get('/api/dashboard')).statusCode).toBe(403);
  });
});

describe('ciclo completo de un nivel', () => {
  let intento = 0;

  it('no permite iniciar un nivel bloqueado', async () => {
    expect((await post('/api/intentos', { nivel: 'n02-agua' })).statusCode).toBe(409);
  });

  it('inicia el nivel 1 y valida el orden de los pasos', async () => {
    const r = await post('/api/intentos', { nivel: 'n01-movimiento' });
    expect(r.statusCode).toBe(201);
    intento = r.json().intento;
    const fuera = await post(`/api/intentos/${intento}/pasos`, { orden: 2, segundos: 10 });
    expect(fuera.statusCode).toBe(409);
    expect(fuera.json().mensaje).toMatch(/fuera de orden/);
  });

  it('las ayudas son escalonadas y cuestan XP una sola vez', async () => {
    expect((await post(`/api/intentos/${intento}/ayudas`, { orden: 1, nivelAyuda: 2 })).statusCode).toBe(409);
    const a1 = (await post(`/api/intentos/${intento}/ayudas`, { orden: 1, nivelAyuda: 1 })).json();
    expect(a1).toMatchObject({ costoXp: 5, yaUsada: false });
    const otra = (await post(`/api/intentos/${intento}/ayudas`, { orden: 1, nivelAyuda: 1 })).json();
    expect(otra).toMatchObject({ costoXp: 0, yaUsada: true });
  });

  it('completa pasos, responde (corrige la BD) y finaliza con estrellas e insignias', async () => {
    for (const orden of [1, 2, 3]) {
      expect((await post(`/api/intentos/${intento}/pasos`, { orden, segundos: 20 * orden })).statusCode).toBe(200);
    }
    const r1 = (await post(`/api/intentos/${intento}/respuestas`, { pregunta: 1, opcion: 1 })).json();
    expect(r1.correcta).toBe(true);
    const r2 = (await post(`/api/intentos/${intento}/respuestas`, { pregunta: 2, opcion: 1 })).json();
    expect(r2).toMatchObject({ correcta: false, opcionCorrecta: 3 });
    await post(`/api/intentos/${intento}/respuestas`, { pregunta: 3, opcion: 2 });
    const fin = await post(`/api/intentos/${intento}/finalizar`, {});
    expect(fin.statusCode).toBe(200);
    const res = fin.json();
    expect(res.estrellas).toBe(3);
    // 100 XP base × 3/3 + 2 aciertos × 10 − 5 de la pista
    expect(res.xp_obtenido).toBe(115);
    expect(res.racha).toBe(1);
    expect(res.insignias_nuevas.map((i: { codigo: string }) => i.codigo)).toContain('primer-experimento');
  });

  it('desbloquea el nivel 2 y refleja el progreso en el perfil', async () => {
    const p = (await get('/api/progreso')).json().niveles;
    expect(p[0]).toMatchObject({ completado: true, estrellas: 3 });
    expect(p[1].desbloqueado).toBe(true);
    const perfil = (await get('/api/perfil')).json();
    expect(perfil.usuario.xp).toBe(115);
    expect(perfil.insignias.length).toBeGreaterThan(0);
  });

  it('una repetición da solo 25 % de XP', async () => {
    const i2 = (await post('/api/intentos', { nivel: 'n01-movimiento' })).json().intento;
    for (const orden of [1, 2, 3]) await post(`/api/intentos/${i2}/pasos`, { orden, segundos: 5 });
    for (const pregunta of [1, 2, 3]) await post(`/api/intentos/${i2}/respuestas`, { pregunta, opcion: [1, 3, 2][pregunta - 1] });
    const res = (await post(`/api/intentos/${i2}/finalizar`, {})).json();
    expect(res.es_repeticion).toBe(true);
    expect(res.xp_obtenido).toBe(Math.round((100 + 30) * 0.25));
  });
});

describe('Quimi, aulas, dashboard y telemetría', () => {
  it('Quimi encuentra términos sin tildes', async () => {
    const r = (await get('/api/quimi?q=energia%20de%20activacion', '')).json();
    expect(r.terminos[0].termino).toBe('Energía de activación');
  });

  it('el docente crea un aula y el estudiante se une con el código', async () => {
    const d = await post('/api/auth/registro', { nombre: 'Test Docente', email: `test-doc${sufijo}@prueba.pe`, password: 'secreta123', rol: 'docente', codigoDocente: 'PRUEBA' }, '');
    tokenDocente = d.json().token;
    const aula = (await post('/api/aulas', { nombre: 'Prueba 3A', grado: 3 }, tokenDocente)).json();
    expect(aula.codigo).toMatch(/^[A-Z0-9]{6}$/);
    expect((await post('/api/aulas/unirse', { codigo: aula.codigo })).statusCode).toBe(200);
    const det = (await get(`/api/aulas/${aula.id}`, tokenDocente)).json();
    expect(det.ranking[0]).toMatchObject({ puesto: 1, nombre: 'Test Alumna' });
    expect((await get(`/api/aulas/${aula.id}`)).statusCode).toBe(403);
  });

  it('registra eventos anónimos y el dashboard los resume', async () => {
    const r = await post('/api/eventos', { sesion: crypto.randomUUID(), eventos: [{ tipo: 'pagina_vista', datos: { ruta: '/' } }] }, '');
    expect(r.statusCode).toBe(202);
    const dash = (await get('/api/dashboard', tokenDocente)).json();
    expect(dash.kpis.estudiantes).toBeGreaterThan(0);
    expect(dash.usoDiario).toHaveLength(30);
    expect(dash.niveles).toHaveLength(9);
  });
});
