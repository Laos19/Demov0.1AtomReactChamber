import type { Fuente } from '../data/tipos';

type Evento = { tipo: string; nivel?: string; datos?: Record<string, unknown> };

/**
 * Telemetría de uso por lotes (alimenta el dashboard).
 * Agrupa eventos y los envía cada 10 s o al ocultar la pestaña. No guarda datos personales:
 * la sesión es un UUID aleatorio por pestaña.
 */
export class Telemetria {
  private cola: Evento[] = [];
  private readonly sesion = crypto.randomUUID();
  private readonly dispositivo = window.matchMedia('(max-width: 640px)').matches
    ? 'movil'
    : window.matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'escritorio';

  constructor(private readonly fuente: Fuente) {
    setInterval(() => void this.enviar(), 10_000);
    document.addEventListener('visibilitychange', () => document.hidden && void this.enviar());
  }

  /** Encola un evento. */
  registrar(tipo: string, nivel?: string, datos?: Record<string, unknown>): void {
    this.cola.push({ tipo, nivel, datos: datos ?? {} });
    if (this.cola.length >= 20) void this.enviar();
  }

  private async enviar(): Promise<void> {
    if (!this.cola.length) return;
    const eventos = this.cola.splice(0, 50);
    try {
      await this.fuente.eventos({ sesion: this.sesion, dispositivo: this.dispositivo, eventos });
    } catch {
      /* la telemetría nunca debe romper la experiencia */
    }
  }
}
