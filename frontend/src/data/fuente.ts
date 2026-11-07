/**
 * Fuentes de datos: API remota (`VITE_API_URL`) o modo demostración local (sin servidor).
 * El modo demo replica las reglas de negocio de PostgreSQL (estrellas, XP, insignias) para
 * que la app sea usable en GitHub Pages o si el servidor gratuito está dormido.
 */
import contenido from './contenido.generated.json';
import dashboardDemo from './dashboard-demo.json';
import aulaDemo from './aula-demo.json';
import type { Catalogo } from '../engine/chemistry';
import type {
  Aula, Dashboard, DetalleAula, Fuente, Insignia, Juego, Nivel, Perfil, ProgresoNivel, ResultadoIntento, Rol, Usuario,
} from './tipos';

/** Error de API con mensaje en español para la interfaz. */
export class ErrorApi extends Error {
  constructor(readonly status: number, message: string, readonly code = 'ERROR') {
    super(message);
  }
}

/* --------------------------------- API ---------------------------------- */

const TOKEN_KEY = 'arc:token';
const leer = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const escribir = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* almacenamiento bloqueado */ }
};

/** Cliente de la API REST de AtomReactChamber. */
export class FuenteApi implements Fuente {
  readonly modo = 'api' as const;
  constructor(private readonly base: string) {}

  private async req<T>(metodo: 'GET' | 'POST', ruta: string, body?: unknown): Promise<T> {
    const token = leer(TOKEN_KEY);
    const r = await fetch(`${this.base}/api${ruta}`, {
      method: metodo,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = r.status === 204 ? null : await r.json().catch(() => null);
    if (!r.ok) throw new ErrorApi(r.status, data?.mensaje ?? 'No se pudo conectar con el servidor', data?.error);
    return data as T;
  }

  catalogo() { return this.req<Catalogo>('GET', '/catalogo'); }
  juego() { return this.req<Juego>('GET', '/juego'); }
  async login(email: string, password: string) {
    const r = await this.req<{ usuario: Usuario; token: string }>('POST', '/auth/login', { email, password });
    escribir(TOKEN_KEY, r.token);
    return r;
  }
  async registro(datos: Parameters<Fuente['registro']>[0]) {
    const r = await this.req<{ usuario: Usuario; token: string }>('POST', '/auth/registro', datos);
    escribir(TOKEN_KEY, r.token);
    return r;
  }
  async yo() { return (await this.req<{ usuario: Usuario }>('GET', '/auth/yo')).usuario; }
  async progreso() { return (await this.req<{ niveles: ProgresoNivel[] }>('GET', '/progreso')).niveles; }
  perfil() { return this.req<Perfil>('GET', '/perfil'); }
  iniciar(nivel: string) { return this.req<{ intento: number }>('POST', '/intentos', { nivel }); }
  async completarPaso(intento: number, orden: number, segundos: number) {
    await this.req('POST', `/intentos/${intento}/pasos`, { orden, segundos: Math.round(segundos) });
  }
  pedirAyuda(intento: number, orden: number, nivelAyuda: number) {
    return this.req<{ texto: string; costoXp: number; yaUsada: boolean }>('POST', `/intentos/${intento}/ayudas`, { orden, nivelAyuda });
  }
  responder(intento: number, pregunta: number, opcion: number) {
    return this.req<{ correcta: boolean; explicacion: string; opcionCorrecta: number }>('POST', `/intentos/${intento}/respuestas`, { pregunta, opcion });
  }
  finalizar(intento: number) { return this.req<ResultadoIntento>('POST', `/intentos/${intento}/finalizar`, {}); }
  quimi(q: string, nivel?: string, paso?: number) {
    const p = new URLSearchParams({ q, ...(nivel ? { nivel } : {}), ...(paso ? { paso: String(paso) } : {}) });
    return this.req<Awaited<ReturnType<Fuente['quimi']>>>('GET', `/quimi?${p}`);
  }
  async aulas() { return (await this.req<{ aulas: Aula[] }>('GET', '/aulas')).aulas; }
  crearAula(nombre: string, grado: number) { return this.req<Aula>('POST', '/aulas', { nombre, grado }); }
  unirse(codigo: string) { return this.req<{ nombre: string }>('POST', '/aulas/unirse', { codigo }); }
  detalleAula(id: number) { return this.req<DetalleAula>('GET', `/aulas/${id}`); }
  dashboard() { return this.req<Dashboard>('GET', '/dashboard'); }
  async eventos(lote: Parameters<Fuente['eventos']>[0]) { await this.req('POST', '/eventos', { origen: 'web', ...lote }); }

  /** Cierra la sesión local (descarta el token). */
  static salir() { escribir(TOKEN_KEY, null); }
}

/* ------------------------------ modo demo ------------------------------- */

interface IntentoLocal {
  id: number;
  nivel: string;
  estado: 'en_curso' | 'completado' | 'abandonado';
  pasos: number;
  ayudas: Array<{ paso: number; nivel: number }>;
  aciertos: number;
  respondidas: number[];
  xpPistas: number;
  estrellas?: number;
  xp?: number;
  iniciado: string;
}
interface EstadoLocal {
  usuario: Usuario | null;
  intentos: IntentoLocal[];
  logros: Array<{ codigo: string; fecha: string }>;
  ultimoDia: string | null;
  rachaMax: number;
  aulas: string[];
}

const ESTADO_KEY = 'arc:demo:v1';
const juegoLocal = contenido.juego as unknown as {
  niveles: Array<Omit<Nivel, 'pasos' | 'cuestionario'> & { pasos: Array<Omit<Nivel['pasos'][number], 'orden' | 'ayudas'> & { pistas: string[] }>; cuestionario: Array<{ enunciado: string; explicacion: string; opciones: Array<[string, boolean]> }> }>;
  misiones: Juego['misiones'];
  insignias: Insignia[];
  costos_pista: Record<string, number>;
  glosario: Array<[string, string]>;
};
const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const hoyLima = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);

/**
 * Fuente local: contenido incluido en el bundle + progreso en localStorage.
 * Replica `fn_calcular_estrellas`, `fn_finalizar_intento` y `fn_otorgar_insignias`.
 */
export class FuenteDemo implements Fuente {
  readonly modo = 'demo' as const;

  private estado(): EstadoLocal {
    try {
      const raw = leer(ESTADO_KEY);
      if (raw) return JSON.parse(raw) as EstadoLocal;
    } catch { /* estado corrupto: se reinicia */ }
    return { usuario: null, intentos: [], logros: [], ultimoDia: null, rachaMax: 0, aulas: [] };
  }
  private guardar(e: EstadoLocal) { escribir(ESTADO_KEY, JSON.stringify(e)); }
  private nivel(codigo: string) {
    const n = juegoLocal.niveles.find((x) => x.codigo === codigo);
    if (!n) throw new ErrorApi(404, 'Nivel no encontrado');
    return n;
  }
  private yoSync(): Usuario {
    const u = this.estado().usuario;
    if (!u) throw new ErrorApi(401, 'Inicia sesión para continuar', 'NO_AUTENTICADO');
    return u;
  }

  async catalogo() { return contenido.catalogo as unknown as Catalogo; }

  async juego(): Promise<Juego> {
    return {
      misiones: juegoLocal.misiones,
      insignias: juegoLocal.insignias,
      costos_pista: juegoLocal.costos_pista,
      niveles: juegoLocal.niveles.map((n) => ({
        ...n,
        pasos: n.pasos.map((p, i) => ({ orden: i + 1, titulo: p.titulo, instruccion: p.instruccion, concepto: p.concepto, condicion: p.condicion, ayudas: p.pistas.length })),
        cuestionario: n.cuestionario.map((q, i) => ({ orden: i + 1, enunciado: q.enunciado, opciones: q.opciones.map(([texto], k) => ({ orden: k + 1, texto })) })),
      })),
    };
  }

  async login(email: string, password: string) {
    const e = this.estado();
    const correo = email.trim().toLowerCase();
    const demo: Record<string, { nombre: string; rol: Rol; grado: number | null }> = {
      'estudiante@demo.arc.pe': { nombre: 'Estudiante Demo', rol: 'estudiante', grado: 3 },
      'docente@demo.arc.pe': { nombre: 'Prof. Rosa Mendoza', rol: 'docente', grado: null },
      'admin@demo.arc.pe': { nombre: 'Administración ARC', rol: 'admin', grado: null },
    };
    if (demo[correo] && password !== 'quimica2026') throw new ErrorApi(401, 'Correo o contraseña incorrectos');
    const d = demo[correo] ?? { nombre: correo.split('@')[0], rol: 'estudiante' as Rol, grado: 3 };
    const xpPrevio = e.usuario?.email === correo ? e.usuario.xp : 0;
    e.usuario = { id: 1, nombre: d.nombre, email: correo, rol: d.rol, grado: d.grado, xp: xpPrevio, racha: e.usuario?.racha ?? 0 };
    this.guardar(e);
    return { usuario: e.usuario, token: 'demo' };
  }

  async registro(datos: Parameters<Fuente['registro']>[0]) {
    const e = this.estado();
    e.usuario = { id: 1, nombre: datos.nombre, email: datos.email, rol: datos.rol, grado: datos.grado ?? null, xp: 0, racha: 0 };
    e.intentos = [];
    e.logros = [];
    this.guardar(e);
    return { usuario: e.usuario, token: 'demo' };
  }

  async yo() { return this.yoSync(); }

  async progreso(): Promise<ProgresoNivel[]> {
    const e = this.estado();
    let previoCompleto = true;
    return juegoLocal.niveles.map((n) => {
      const ints = e.intentos.filter((i) => i.nivel === n.codigo);
      const comp = ints.filter((i) => i.estado === 'completado');
      const p = { nivel: n.codigo, completado: comp.length > 0, estrellas: Math.max(0, ...comp.map((i) => i.estrellas ?? 0)), intentos: ints.length, desbloqueado: previoCompleto };
      previoCompleto = p.completado;
      return p;
    });
  }

  async perfil(): Promise<Perfil> {
    const u = this.yoSync();
    const e = this.estado();
    const prog = await this.progreso();
    return {
      usuario: u,
      resumen: { xp: u.xp, racha: u.racha, racha_maxima: e.rachaMax, niveles_completados: prog.filter((p) => p.completado).length, estrellas_totales: prog.reduce((t, p) => t + p.estrellas, 0) },
      insignias: e.logros.map((l) => ({ ...juegoLocal.insignias.find((i) => i.codigo === l.codigo)!, obtenido_en: l.fecha })),
      historial: [...e.intentos].reverse().slice(0, 20).map((i) => ({
        nivel: i.nivel, titulo: this.nivel(i.nivel).titulo, estado: i.estado, estrellas: i.estrellas ?? null, xp_obtenido: i.xp ?? null, pistas_usadas: i.ayudas.length, iniciado_en: i.iniciado,
      })),
    };
  }

  async iniciar(nivel: string) {
    this.yoSync();
    const prog = await this.progreso();
    if (!prog.find((p) => p.nivel === nivel)?.desbloqueado) throw new ErrorApi(409, 'Este nivel está bloqueado: completa el anterior');
    const e = this.estado();
    for (const i of e.intentos) if (i.nivel === nivel && i.estado === 'en_curso') i.estado = 'abandonado';
    const id = (e.intentos.at(-1)?.id ?? 0) + 1;
    e.intentos.push({ id, nivel, estado: 'en_curso', pasos: 0, ayudas: [], aciertos: 0, respondidas: [], xpPistas: 0, iniciado: new Date().toISOString() });
    this.guardar(e);
    return { intento: id };
  }

  private conIntento<T>(id: number, fn: (i: IntentoLocal, e: EstadoLocal) => T): T {
    const e = this.estado();
    const i = e.intentos.find((x) => x.id === id);
    if (!i) throw new ErrorApi(404, 'Intento no encontrado');
    const out = fn(i, e);
    this.guardar(e);
    return out;
  }

  async completarPaso(intento: number, orden: number) {
    this.conIntento(intento, (i) => {
      if (orden !== i.pasos + 1) throw new ErrorApi(409, `paso fuera de orden: se esperaba el paso ${i.pasos + 1}`);
      i.pasos = orden;
    });
  }

  async pedirAyuda(intento: number, orden: number, nivelAyuda: number) {
    return this.conIntento(intento, (i) => {
      const paso = this.nivel(i.nivel).pasos[orden - 1];
      if (nivelAyuda > 1 && !i.ayudas.some((a) => a.paso === orden && a.nivel === nivelAyuda - 1)) throw new ErrorApi(409, `primero abre la ayuda ${nivelAyuda - 1}`);
      const ya = i.ayudas.some((a) => a.paso === orden && a.nivel === nivelAyuda);
      const costo = juegoLocal.costos_pista[String(nivelAyuda)];
      if (!ya) {
        i.ayudas.push({ paso: orden, nivel: nivelAyuda });
        i.xpPistas += costo;
      }
      return { texto: paso.pistas[nivelAyuda - 1], costoXp: ya ? 0 : costo, yaUsada: ya };
    });
  }

  async responder(intento: number, pregunta: number, opcion: number) {
    return this.conIntento(intento, (i) => {
      const q = this.nivel(i.nivel).cuestionario[pregunta - 1];
      if (i.respondidas.includes(pregunta)) throw new ErrorApi(409, 'Ya respondiste esta pregunta');
      const correcta = q.opciones[opcion - 1]?.[1] === true;
      i.respondidas.push(pregunta);
      if (correcta) i.aciertos++;
      return { correcta, explicacion: q.explicacion, opcionCorrecta: q.opciones.findIndex(([, ok]) => ok) + 1 };
    });
  }

  async finalizar(intento: number): Promise<ResultadoIntento> {
    return this.conIntento(intento, (i, e) => {
      const n = this.nivel(i.nivel);
      if (i.estado !== 'en_curso') throw new ErrorApi(409, 'el intento ya terminó');
      if (i.pasos < n.pasos.length) throw new ErrorApi(409, `faltan pasos: ${i.pasos} de ${n.pasos.length}`);
      const maxAyuda = Math.max(0, ...i.ayudas.map((a) => a.nivel));
      let est = 3;
      if (maxAyuda >= 2) est--;
      if (maxAyuda >= 3) est--;
      if (i.aciertos * 3 < n.cuestionario.length * 2) est--;
      est = Math.max(1, est);
      let xp = Math.round((n.xp * est) / 3) + 10 * i.aciertos - i.xpPistas;
      const rep = e.intentos.some((x) => x.nivel === i.nivel && x.estado === 'completado');
      if (rep) xp = Math.round(xp * 0.25);
      xp = Math.max(0, xp);
      Object.assign(i, { estado: 'completado', estrellas: est, xp });
      const u = e.usuario!;
      u.xp += xp;
      const hoy = hoyLima();
      const ayer = new Date(Date.parse(hoy) - 86_400_000).toISOString().slice(0, 10);
      if (e.ultimoDia !== hoy) u.racha = e.ultimoDia === ayer ? u.racha + 1 : 1;
      e.ultimoDia = hoy;
      e.rachaMax = Math.max(e.rachaMax, u.racha);
      // Insignias (misma lógica que fn_otorgar_insignias).
      const comp = e.intentos.filter((x) => x.estado === 'completado');
      const mejores = new Map<string, number>();
      for (const x of comp) mejores.set(x.nivel, Math.max(mejores.get(x.nivel) ?? 0, x.estrellas ?? 0));
      const m: Record<string, number> = {
        niveles_completados: mejores.size,
        sin_pistas: comp.filter((x) => x.ayudas.length === 0).length,
        racha: e.rachaMax,
        estrellas_totales: [...mejores.values()].reduce((t, v) => t + v, 0),
        xp_total: u.xp,
        cuestionarios_perfectos: comp.filter((x) => x.aciertos === this.nivel(x.nivel).cuestionario.length).length,
      };
      const nuevas = juegoLocal.insignias.filter((b) => (m[b.tipo!] ?? 0) >= b.umbral! && !e.logros.some((l) => l.codigo === b.codigo));
      for (const b of nuevas) e.logros.push({ codigo: b.codigo, fecha: new Date().toISOString() });
      return { estrellas: est, xp_obtenido: xp, xp_total: u.xp, racha: u.racha, es_repeticion: rep, insignias_nuevas: nuevas };
    });
  }

  async quimi(q: string, nivel?: string, paso?: number) {
    const palabras = sinTildes(q).split(/\W+/).filter((w) => w.length > 3);
    const terminos = juegoLocal.glosario
      .map(([termino, definicion]) => {
        const t = sinTildes(termino);
        const d = sinTildes(definicion);
        const relevancia = palabras.reduce((s, w) => s + (t.includes(w.slice(0, -1)) ? 1 : 0) + (d.includes(w.slice(0, -1)) ? 0.2 : 0), 0);
        return { termino, definicion, relevancia };
      })
      .filter((t) => t.relevancia > 0)
      .sort((a, b) => b.relevancia - a.relevancia)
      .slice(0, 3);
    const concepto = nivel && paso ? this.nivel(nivel).pasos[paso - 1]?.concepto : undefined;
    const mensaje = terminos.length
      ? `Esto te puede ayudar: ${terminos[0].termino.toLowerCase()} — ${terminos[0].definicion}`
      : 'No encontré ese término en mi glosario. Prueba con otras palabras o abre una pista del paso: la primera cuesta poca XP.';
    return { mensaje, terminos, concepto };
  }

  async aulas(): Promise<Aula[]> {
    const u = this.yoSync();
    if (u.rol === 'estudiante') return this.estado().aulas.length ? [{ ...aulaDemo.aula, docente: 'Prof. Rosa Mendoza' } as Aula] : [];
    return [{ ...(aulaDemo.aula as Aula), estudiantes: aulaDemo.ranking.length }];
  }
  async crearAula(): Promise<Aula> { throw new ErrorApi(409, 'En el modo demostración no se pueden crear aulas. Conéctate al servidor.'); }
  async unirse(codigo: string) {
    if (codigo.toUpperCase() !== aulaDemo.aula.codigo) throw new ErrorApi(404, 'No existe un aula con ese código');
    const e = this.estado();
    e.aulas = [codigo.toUpperCase()];
    this.guardar(e);
    return { nombre: aulaDemo.aula.nombre };
  }
  async detalleAula() { return aulaDemo as unknown as DetalleAula; }
  async dashboard() { return dashboardDemo as unknown as Dashboard; }
  async eventos() { /* en modo demo no se envía telemetría */ }
}

/** URL de la API definida en el build (vacía ⇒ modo demo). */
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

/** Elige la fuente según la configuración y la preferencia guardada. */
export function crearFuente(): Fuente {
  const forzarDemo = leer('arc:modo') === 'demo';
  return API_URL && !forzarDemo ? new FuenteApi(API_URL) : new FuenteDemo();
}
