import { normalizarApiUrl } from './formato';
import { cuerpoEventos, type EventoUso, type Origen } from './telemetria';
import type { Catalogo, Juego, Perfil, ProgresoNivel, RespuestaQuimi, Salud, Usuario } from './tipos';

/** Error de la API con el código HTTP y el mensaje devuelto por el backend. */
export class ErrorApi extends Error {
  constructor(message: string, readonly estado: number) {
    super(message);
    this.name = 'ErrorApi';
  }
}

export interface OpcionesCliente {
  /** URL base (sin /api). Se lee en cada petición para reflejar cambios de configuración. */
  baseUrl: () => string;
  /** Token JWT actual, si hay sesión. */
  token?: () => PromiseLike<string | undefined> | string | undefined;
  /** Tiempo máximo por petición, ms. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** Cliente mínimo de la API REST de AtomReactChamber (solo usa `fetch` de Node). */
export class ClienteArc {
  constructor(private readonly opciones: OpcionesCliente) {}

  private async pedir<T>(ruta: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
    const url = `${normalizarApiUrl(this.opciones.baseUrl())}/api${ruta}`;
    const headers: Record<string, string> = { accept: 'application/json' };
    if (init.body !== undefined) headers['content-type'] = 'application/json';
    const token = await this.opciones.token?.();
    if (token) headers.authorization = `Bearer ${token}`;
    else if (init.auth) throw new ErrorApi('Necesitas iniciar sesión en AtomReactChamber.', 401);

    const f = this.opciones.fetchImpl ?? fetch;
    let res: Response;
    try {
      res = await f(url, {
        method: init.method ?? 'GET',
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(this.opciones.timeoutMs ?? 10_000),
      });
    } catch (e) {
      throw new ErrorApi(`No se pudo conectar con la API (${url}): ${(e as Error).message}`, 0);
    }
    const texto = await res.text();
    let datos: unknown = undefined;
    try {
      datos = texto ? JSON.parse(texto) : undefined;
    } catch {
      /* respuesta no JSON */
    }
    if (!res.ok) {
      const d = (datos ?? {}) as { mensaje?: string; message?: string; error?: string };
      const msg = d.mensaje ?? d.message ?? d.error ?? res.statusText;
      throw new ErrorApi(msg || `Error HTTP ${res.status}`, res.status);
    }
    return datos as T;
  }

  salud(): Promise<Salud> {
    return this.pedir('/health');
  }
  catalogo(): Promise<Catalogo> {
    return this.pedir('/catalogo');
  }
  juego(): Promise<Juego> {
    return this.pedir('/juego');
  }
  quimi(q: string): Promise<RespuestaQuimi> {
    return this.pedir(`/quimi?q=${encodeURIComponent(q)}`);
  }
  login(email: string, password: string): Promise<{ usuario: Usuario; token: string }> {
    return this.pedir('/auth/login', { method: 'POST', body: { email, password } });
  }
  perfil(): Promise<Perfil> {
    return this.pedir('/perfil', { auth: true });
  }
  async progreso(): Promise<ProgresoNivel[]> {
    return (await this.pedir<{ niveles: ProgresoNivel[] }>('/progreso', { auth: true })).niveles;
  }
  async eventos(sesion: string, origen: Origen, eventos: EventoUso[]): Promise<number> {
    const r = await this.pedir<{ registrados: number }>('/eventos', { method: 'POST', body: cuerpoEventos(sesion, origen, eventos) });
    return r.registrados;
  }
}
