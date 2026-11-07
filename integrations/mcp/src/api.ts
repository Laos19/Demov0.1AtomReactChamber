/** Cliente HTTP mínimo de la API de AtomReactChamber (usa `fetch` nativo de Node ≥ 18). */

export interface Especie {
  codigo: string;
  formula: string;
  nombre: string;
  masa_molar: number;
  dhf: number;
  pf: number | null;
  pe: number | null;
  cid: number | null;
  radical: boolean;
  sublimacion?: number | null;
  atomos?: Array<[string, number, number]>;
}
export interface Reaccion {
  codigo: string;
  etiqueta: string;
  ea: number;
  dh: number;
  ecuacion: string;
  enlace?: string;
  reactivos: string[];
  productos: string[];
}
export interface Catalogo {
  elementos: Array<{ simbolo: string; nombre: string; numero_atomico: number }>;
  especies: Especie[];
  reacciones: Reaccion[];
  fotolisis: unknown[];
  presets: Array<{ codigo: string; nombre: string; ecuacion: string; etiqueta: string }>;
}
export interface Nivel {
  codigo: string;
  mision: string;
  orden: number;
  titulo: string;
  resumen: string;
  objetivo: string;
  grado: number;
  xp: number;
  minutos: number;
  pasos: Array<{ orden: number; titulo: string; instruccion: string; concepto: string }>;
}
export interface Juego {
  misiones: Array<{ codigo: string; titulo: string; descripcion: string; orden: number }>;
  niveles: Nivel[];
}
export interface RespuestaQuimi {
  mensaje: string;
  terminos: Array<{ termino: string; definicion: string; relevancia: number }>;
  concepto?: string;
}
export interface Dashboard {
  kpis: Record<string, number>;
  usoDiario: Array<Record<string, number | string>>;
  niveles: Array<{ codigo: string; titulo: string; intentos: number; completados: number; tasa_completado: number; estrellas_promedio: number; pistas_promedio: number; minutos_promedio: number }>;
  pasosLentos: Array<{ nivel_codigo: string; orden: number; titulo: string; veces: number; segundos_promedio: number }>;
  preguntas: Array<{ nivel_codigo: string; enunciado: string; respuestas: number; porcentaje_error: number }>;
  origen: Array<{ origen: string; sesiones: number }>;
  dispositivo: Array<{ dispositivo: string; sesiones: number }>;
  insignias: Array<{ nombre: string; otorgadas: number }>;
}

export type TipoEvento = 'pagina_vista' | 'quimi_consulta' | 'reaccion_observada';

export class ErrorApi extends Error {
  constructor(message: string, readonly estado: number) {
    super(message);
    this.name = 'ErrorApi';
  }
}

export interface OpcionesCliente {
  baseUrl: string;
  token?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class ClienteArc {
  readonly baseUrl: string;
  private cacheCatalogo?: { datos: Catalogo; hasta: number };
  private cacheJuego?: { datos: Juego; hasta: number };

  constructor(private readonly opciones: OpcionesCliente) {
    this.baseUrl = opciones.baseUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  }

  get tieneToken(): boolean {
    return Boolean(this.opciones.token);
  }

  async pedir<T>(ruta: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (init.body !== undefined) headers['content-type'] = 'application/json';
    if (this.opciones.token) headers.authorization = `Bearer ${this.opciones.token}`;
    else if (init.auth) throw new ErrorApi('Esta herramienta requiere la variable de entorno ARC_TOKEN (JWT de una cuenta docente).', 401);
    const url = `${this.baseUrl}/api${ruta}`;
    let res: Response;
    try {
      res = await (this.opciones.fetchImpl ?? fetch)(url, {
        method: init.method ?? 'GET',
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(this.opciones.timeoutMs ?? 15_000),
      });
    } catch (e) {
      throw new ErrorApi(`No se pudo conectar con la API en ${url}: ${(e as Error).message}. Revisa ARC_API_URL.`, 0);
    }
    const texto = await res.text();
    let datos: unknown;
    try {
      datos = texto ? JSON.parse(texto) : undefined;
    } catch {
      datos = undefined;
    }
    if (!res.ok) {
      const d = (datos ?? {}) as { mensaje?: string; message?: string; error?: string };
      throw new ErrorApi(d.mensaje ?? d.message ?? d.error ?? `HTTP ${res.status}`, res.status);
    }
    return datos as T;
  }

  async catalogo(): Promise<Catalogo> {
    if (this.cacheCatalogo && this.cacheCatalogo.hasta > Date.now()) return this.cacheCatalogo.datos;
    const datos = await this.pedir<Catalogo>('/catalogo');
    this.cacheCatalogo = { datos, hasta: Date.now() + 5 * 60_000 };
    return datos;
  }

  async juego(): Promise<Juego> {
    if (this.cacheJuego && this.cacheJuego.hasta > Date.now()) return this.cacheJuego.datos;
    const datos = await this.pedir<Juego>('/juego');
    this.cacheJuego = { datos, hasta: Date.now() + 5 * 60_000 };
    return datos;
  }

  quimi(q: string, nivel?: string, paso?: number): Promise<RespuestaQuimi> {
    const p = new URLSearchParams({ q });
    if (nivel) p.set('nivel', nivel);
    if (paso) p.set('paso', String(paso));
    return this.pedir(`/quimi?${p}`);
  }

  dashboard(): Promise<Dashboard> {
    return this.pedir('/dashboard', { auth: true });
  }

  async eventos(sesion: string, eventos: Array<{ tipo: TipoEvento; datos?: Record<string, unknown> }>, origen: 'mcp' | 'claude' = 'mcp'): Promise<void> {
    await this.pedir('/eventos', {
      method: 'POST',
      body: { sesion, origen, dispositivo: 'escritorio', eventos: eventos.map((e) => ({ tipo: e.tipo, datos: e.datos ?? {} })) },
    });
  }
}
