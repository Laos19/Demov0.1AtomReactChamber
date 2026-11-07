import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { construirQuimica, type Quimica } from '../engine/chemistry';
import { API_URL, FuenteApi, crearFuente } from '../data/fuente';
import type { Fuente, Juego, ProgresoNivel, Usuario } from '../data/tipos';
import { Telemetria } from './telemetria';

interface Estado {
  fuente: Fuente;
  quimica: Quimica | null;
  juego: Juego | null;
  usuario: Usuario | null;
  progreso: ProgresoNivel[];
  error: string | null;
  /** El servidor no respondió y se ofrece pasar a modo demo. */
  servidorCaido: boolean;
  telemetria: Telemetria;
  setUsuario: (u: Usuario | null) => void;
  recargarProgreso: () => Promise<void>;
  salir: () => void;
  usarDemo: () => void;
}

const Ctx = createContext<Estado | null>(null);

/** Acceso al estado global de la aplicación. */
export function useApp(): Estado {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp fuera de AppProvider');
  return c;
}

/**
 * Proveedor del estado global: fuente de datos, catálogo, contenido del juego,
 * usuario y progreso. Si la API no responde en 12 s, ofrece el modo demostración.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const fuente = useMemo(() => crearFuente(), []);
  const telemetria = useMemo(() => new Telemetria(fuente), [fuente]);
  const [quimica, setQuimica] = useState<Quimica | null>(null);
  const [juego, setJuego] = useState<Juego | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [progreso, setProgreso] = useState<ProgresoNivel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [servidorCaido, setServidorCaido] = useState(false);

  useEffect(() => {
    let vivo = true;
    const lento = setTimeout(() => vivo && fuente.modo === 'api' && setServidorCaido(true), 12_000);
    Promise.all([fuente.catalogo(), fuente.juego()])
      .then(([cat, j]) => {
        if (!vivo) return;
        clearTimeout(lento);
        setServidorCaido(false);
        setQuimica(construirQuimica(cat));
        setJuego(j);
      })
      .catch(() => vivo && (setServidorCaido(true), setError('No se pudo cargar el contenido del laboratorio.')));
    fuente.yo().then((u) => vivo && setUsuario(u)).catch(() => undefined);
    return () => {
      vivo = false;
      clearTimeout(lento);
    };
  }, [fuente]);

  const recargarProgreso = useCallback(async () => {
    if (!usuario) return setProgreso([]);
    try {
      setProgreso(await fuente.progreso());
    } catch {
      /* sin sesión */
    }
  }, [fuente, usuario]);

  useEffect(() => {
    void recargarProgreso();
  }, [recargarProgreso]);

  const salir = useCallback(() => {
    FuenteApi.salir();
    try { localStorage.removeItem('arc:demo:v1'); } catch { /* sin almacenamiento */ }
    setUsuario(null);
    setProgreso([]);
  }, []);

  const usarDemo = useCallback(() => {
    try { localStorage.setItem('arc:modo', 'demo'); } catch { /* sin almacenamiento */ }
    window.location.reload();
  }, []);

  const valor: Estado = { fuente, quimica, juego, usuario, progreso, error, servidorCaido, telemetria, setUsuario, recargarProgreso, salir, usarDemo };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/** Si la app se construyó con API pero el usuario forzó el modo demo, permite volver. */
export function volverAApi() {
  try { localStorage.removeItem('arc:modo'); } catch { /* sin almacenamiento */ }
  window.location.reload();
}
export const hayApiConfigurada = Boolean(API_URL);
