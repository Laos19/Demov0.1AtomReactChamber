import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Atom, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useApp, hayApiConfigurada, volverAApi } from '../estado/AppContext';

/** Alterna claro/oscuro guardando la preferencia (por defecto sigue al sistema). */
function useTema(): [string, () => void] {
  const [tema, setTema] = useState(() => {
    try { return localStorage.getItem('arc:tema') ?? ''; } catch { return ''; }
  });
  useEffect(() => {
    if (tema) document.documentElement.dataset.theme = tema;
    else delete document.documentElement.dataset.theme;
  }, [tema]);
  const alternar = () => {
    const oscuroAhora = tema ? tema === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nuevo = oscuroAhora ? 'light' : 'dark';
    setTema(nuevo);
    try { localStorage.setItem('arc:tema', nuevo); } catch { /* sin almacenamiento */ }
  };
  return [tema, alternar];
}

/** Estructura común: cabecera con navegación, aviso de modo y contenido. */
export function Marco({ children }: { children: ReactNode }) {
  const { usuario, salir, fuente, servidorCaido, usarDemo, telemetria } = useApp();
  const [, alternarTema] = useTema();
  const [abierto, setAbierto] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setAbierto(false);
    telemetria.registrar('pagina_vista', undefined, { ruta: loc.pathname });
    document.getElementById('contenido')?.focus({ preventScroll: true });
  }, [loc.pathname, telemetria]);

  const enlaces = [
    { a: '/mapa', t: 'Misiones' },
    { a: '/laboratorio', t: 'Laboratorio libre' },
    ...(usuario ? [{ a: '/perfil', t: 'Mi progreso' }] : []),
    { a: '/aula', t: usuario?.rol === 'estudiante' ? 'Mi aula' : 'Aulas' },
    ...(usuario && usuario.rol !== 'estudiante' ? [{ a: '/dashboard', t: 'Dashboard' }] : []),
  ];

  return (
    <div className="min-h-dvh">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-sodio focus:px-4 focus:py-2 focus:text-[#13233A]">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b-2 border-tinta/80 bg-papel/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-[17px] font-bold" aria-label="AtomReactChamber, inicio">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-tinta bg-cobre text-white shadow-ficha">
              <Atom size={20} aria-hidden />
            </span>
            <span className="hidden sm:inline">AtomReactChamber</span>
          </Link>
          <nav aria-label="Principal" className="ml-4 hidden items-center gap-1 md:flex">
            {enlaces.map((e) => (
              <NavLink key={e.a} to={e.a} className={({ isActive }) => `rounded-md px-3 py-2 text-[15px] font-bold ${isActive ? 'bg-tinta text-papel' : 'hover:bg-linea/70'}`}>
                {e.t}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {usuario && (
              <span className="hidden items-center gap-2 rounded-md border-2 border-linea bg-superficie px-3 py-1.5 text-sm lg:flex">
                <span className="font-bold">{usuario.nombre.split(' ')[0]}</span>
                {usuario.rol === 'estudiante' ? <span className="lectura text-tinta-suave">{usuario.xp} XP</span> : <span className="text-tinta-suave">{usuario.rol}</span>}
              </span>
            )}
            <button type="button" onClick={alternarTema} className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-linea/70" aria-label="Cambiar tema claro u oscuro">
              <Sun size={20} className="hidden dark:block" aria-hidden />
              <Moon size={20} className="dark:hidden" aria-hidden />
            </button>
            {usuario ? (
              <button type="button" onClick={salir} className="hidden h-11 items-center gap-2 rounded-md px-3 text-sm font-bold hover:bg-linea/70 md:flex">
                <LogOut size={18} aria-hidden /> Salir
              </button>
            ) : (
              <Link to="/ingresar" className="btn btn-primario hidden md:inline-flex">Ingresar</Link>
            )}
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-md md:hidden" aria-expanded={abierto} aria-controls="menu-movil" aria-label="Menú" onClick={() => setAbierto((v) => !v)}>
              {abierto ? <X aria-hidden /> : <Menu aria-hidden />}
            </button>
          </div>
        </div>
        {abierto && (
          <nav id="menu-movil" aria-label="Principal móvil" className="border-t-2 border-linea px-4 pb-4 md:hidden">
            {enlaces.map((e) => (
              <NavLink key={e.a} to={e.a} className="block rounded-md px-3 py-3 font-bold hover:bg-linea/70">{e.t}</NavLink>
            ))}
            {usuario ? (
              <button type="button" onClick={salir} className="block w-full rounded-md px-3 py-3 text-left font-bold">Salir</button>
            ) : (
              <NavLink to="/ingresar" className="block rounded-md px-3 py-3 font-bold">Ingresar</NavLink>
            )}
          </nav>
        )}
      </header>

      {fuente.modo === 'demo' && (
        <div className="border-b-2 border-sodio bg-sodio/25 px-4 py-2 text-center text-sm">
          Modo demostración sin servidor: tu progreso se guarda solo en este navegador.
          {hayApiConfigurada && <button type="button" onClick={volverAApi} className="ml-2 font-bold underline">Volver a conectar</button>}
        </div>
      )}
      {servidorCaido && fuente.modo === 'api' && (
        <div role="alert" className="border-b-2 border-calcio bg-calcio/15 px-4 py-2 text-center text-sm">
          El servidor gratuito está despertando (puede tardar ~1 minuto).
          <button type="button" onClick={usarDemo} className="ml-2 font-bold underline">Usar modo demostración</button>
        </div>
      )}

      <main id="contenido" tabIndex={-1} className="outline-none">{children}</main>

      <footer className="mt-16 border-t-2 border-linea">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-tinta-suave">
          <p>AtomReactChamber v2 · Universidad Privada de Tacna · Base de Datos II · 2026</p>
          <p>Datos termodinámicos: NIST / PubChem. Energías de activación a escala pedagógica.</p>
        </div>
      </footer>
    </div>
  );
}
