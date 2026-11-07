import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Copy, Users } from 'lucide-react';
import { useApp } from '../estado/AppContext';
import { Aviso, Cargando, Estrellas } from '../componentes/ui';
import type { Aula as TAula, DetalleAula } from '../data/tipos';

/** Aulas: el docente crea y sigue el progreso; el estudiante se une con un código. */
export default function Aula() {
  const { usuario } = useApp();
  if (!usuario) return <Navigate to="/ingresar?volver=/aula" replace />;
  return usuario.rol === 'estudiante' ? <AulaEstudiante /> : <AulaDocente />;
}

function AulaEstudiante() {
  const { fuente } = useApp();
  const [aulas, setAulas] = useState<TAula[] | null>(null);
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState<{ t: 'exito' | 'error'; m: string } | null>(null);
  const cargar = useCallback(() => fuente.aulas().then(setAulas).catch(() => setAulas([])), [fuente]);
  useEffect(() => { void cargar(); }, [cargar]);

  const unirse = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = await fuente.unirse(codigo);
      setMsg({ t: 'exito', m: `Te uniste a «${r.nombre}».` });
      setCodigo('');
      void cargar();
    } catch (err) {
      setMsg({ t: 'error', m: (err as Error).message });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Mi aula</h1>
      <form onSubmit={unirse} className="panel mt-6 p-5">
        <label htmlFor="cod" className="font-bold">Código que te dio tu docente</label>
        <div className="mt-2 flex gap-2">
          <input id="cod" className="campo lectura uppercase tracking-[0.2em]" maxLength={6} placeholder="QUIM3A" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
          <button type="submit" className="btn btn-primario" disabled={codigo.length !== 6}>Unirme</button>
        </div>
        {msg && <div className="mt-3"><Aviso tipo={msg.t}>{msg.m}</Aviso></div>}
      </form>
      <h2 className="mt-8 text-xl font-bold">Mis aulas</h2>
      {aulas === null ? <Cargando /> : aulas.length === 0 ? <p className="mt-2 text-tinta-suave">Aún no estás en ningún aula.</p> : (
        <ul className="mt-3 space-y-2">{aulas.map((a) => <li key={a.id} className="panel p-4"><p className="font-bold">{a.nombre}</p><p className="text-sm text-tinta-suave">{a.docente} · {a.grado}.º {a.seccion}</p></li>)}</ul>
      )}
    </div>
  );
}

function AulaDocente() {
  const { fuente, juego } = useApp();
  const [aulas, setAulas] = useState<TAula[] | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [det, setDet] = useState<DetalleAula | null>(null);
  const [nueva, setNueva] = useState({ nombre: '', grado: 3 });
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => fuente.aulas().then((a) => { setAulas(a); setSel((s) => s ?? a[0]?.id ?? null); }), [fuente]);
  useEffect(() => { void cargar(); }, [cargar]);
  useEffect(() => { if (sel) fuente.detalleAula(sel).then(setDet).catch((e) => setError((e as Error).message)); }, [sel, fuente]);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const a = await fuente.crearAula(nueva.nombre, nueva.grado);
      setNueva({ nombre: '', grado: 3 });
      await cargar();
      setSel(a.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!aulas || !juego) return <div className="mx-auto max-w-7xl px-4"><Cargando /></div>;
  const celda = (uid: number, nivel: string) => det?.matriz.find((m) => m.usuario_id === uid && m.nivel === nivel);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Aulas</h1>
      {error && <div className="mt-3"><Aviso tipo="error">{error}</Aviso></div>}
      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <ul className="space-y-2">
            {aulas.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setSel(a.id)} aria-pressed={sel === a.id} className={`w-full rounded-lg border-2 p-3 text-left ${sel === a.id ? 'border-tinta bg-superficie' : 'border-linea'}`}>
                  <span className="block font-bold">{a.nombre}</span>
                  <span className="flex items-center gap-1 text-sm text-tinta-suave"><Users size={14} aria-hidden />{a.estudiantes ?? 0} estudiantes · código <span className="lectura">{a.codigo}</span></span>
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={crear} className="panel space-y-3 p-4">
            <h2 className="font-sans font-bold">Nueva aula</h2>
            <label className="block"><span className="etiqueta">Nombre</span><input className="campo" required minLength={3} value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} placeholder="Ciencia y Tecnología 2.º B" /></label>
            <label className="block"><span className="etiqueta">Grado</span>
              <select className="campo" value={nueva.grado} onChange={(e) => setNueva({ ...nueva, grado: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>{g}.º</option>)}</select>
            </label>
            <button type="submit" className="btn btn-primario w-full">Crear aula</button>
          </form>
        </div>

        {det ? (
          <div className="space-y-5">
            <section className="panel flex flex-wrap items-center justify-between gap-3 p-5">
              <div><h2 className="text-xl font-bold">{det.aula.nombre}</h2><p className="text-sm text-tinta-suave">{det.aula.grado}.º {det.aula.seccion}</p></div>
              <button type="button" className="btn btn-secundario" onClick={() => navigator.clipboard?.writeText(det.aula.codigo)} aria-label={`Copiar código ${det.aula.codigo}`}>
                <span className="lectura text-xl tracking-[0.2em]">{det.aula.codigo}</span><Copy size={16} aria-hidden />
              </button>
            </section>
            <section className="panel overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="p-4 text-left font-sans text-base font-bold">Progreso por estudiante y nivel</caption>
                <thead className="border-y-2 border-linea text-tinta-suave">
                  <tr>
                    <th scope="col" className="p-2 pl-4">#</th><th scope="col" className="p-2">Estudiante</th><th scope="col" className="p-2">XP</th>
                    {juego.niveles.map((n) => <th key={n.codigo} scope="col" className="p-2 text-center" title={n.titulo}>{n.casilla.simbolo}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {det.ranking.map((r) => (
                    <tr key={r.usuario_id} className="border-b border-linea last:border-0">
                      <td className="lectura p-2 pl-4 font-bold">{r.puesto}</td>
                      <th scope="row" className="p-2 font-bold">{r.nombre}</th>
                      <td className="lectura p-2">{r.xp}</td>
                      {juego.niveles.map((n) => {
                        const c = celda(r.usuario_id, n.codigo);
                        return (
                          <td key={n.codigo} className="p-2 text-center">
                            {c && c.estrellas > 0 ? <Estrellas n={c.estrellas} tam={10} /> : c && c.intentos > 0 ? <span className="text-xs text-calcio">en curso</span> : <span className="text-tinta-suave" aria-label="sin intentar">·</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            {det.asignados.length > 0 && (
              <section className="panel p-5">
                <h3 className="font-sans font-bold">Niveles asignados</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {det.asignados.map((a) => <li key={a.codigo} className="flex justify-between rounded bg-papel px-3 py-2"><span>{a.titulo}</span><span className="text-sm text-tinta-suave">{a.fecha_limite ? `hasta ${new Date(a.fecha_limite).toLocaleDateString('es-PE')}` : 'sin fecha'}</span></li>)}
                </ul>
              </section>
            )}
          </div>
        ) : <Cargando />}
      </div>
    </div>
  );
}
