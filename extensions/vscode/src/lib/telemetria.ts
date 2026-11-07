import type { TipoEvento } from './tipos';

export interface EventoUso {
  tipo: TipoEvento;
  nivel?: string;
  datos?: Record<string, unknown>;
}

export type Origen = 'web' | 'vscode' | 'claude' | 'mcp';

/** Cuerpo de POST /api/eventos (esquema EventosBody del backend). Máximo 50 eventos. */
export function cuerpoEventos(sesion: string, origen: Origen, eventos: EventoUso[]) {
  return {
    sesion,
    origen,
    dispositivo: 'escritorio' as const,
    eventos: eventos.slice(0, 50).map((e) => ({ tipo: e.tipo, ...(e.nivel ? { nivel: e.nivel } : {}), datos: e.datos ?? {} })),
  };
}
