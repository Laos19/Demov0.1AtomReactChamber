import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, GraduationCap, Lock, Zap } from 'lucide-react';
import { useApp } from '../estado/AppContext';
import { TablaPeriodica } from '../componentes/TablaPeriodica';
import { Aviso, COLOR_MISION, Cargando, Estrellas, FichaElemento } from '../componentes/ui';

/** Mapa de misiones: tabla periódica (escritorio) o lista por misión (móvil) + ficha del nivel. */
export default function Mapa() {
  const { juego, progreso, usuario, recargarProgreso } = useApp();
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => { void recargarProgreso(); }, [recargarProgreso]);

  const prog = useMemo(() => new Map(progreso.map((p) => [p.nivel, p])), [progreso]);
  useEffect(() => {
    if (!juego || sel) return;
    const sig = juego.niveles.find((n) => prog.get(n.codigo)?.desbloqueado && !prog.get(n.codigo)?.completado) ?? juego.niveles[0];
    setSel(sig.codigo);
  }, [juego, prog, sel]);

  if (!juego) return <div className="mx-auto max-w-7xl px-4"><Cargando /></div>;
  const nivel = juego.niveles.find((n) => n.codigo === sel);
  const mision = juego.misiones.find((m) => m.codigo === nivel?.mision);
  const p = nivel ? prog.get(nivel.codigo) : undefined;
  const bloqueado = nivel ? (usuario ? !p?.desbloqueado : nivel.orden > 1) : true;
  const estrellas = progreso.reduce((t, x) => t + x.estrellas, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Misiones</h1>
          <p className="mt-1 text-tinta-suave">Cada casilla encendida es una práctica. Completa una para desbloquear la siguiente.</p>
        </div>
        {usuario && (
          <p className="lectura rounded-lg border-2 border-linea bg-superficie px-3 py-2 text-sm">
            {progreso.filter((x) => x.completado).length}/{juego.niveles.length} niveles · {estrellas}/{juego.niveles.length * 3} estrellas
          </p>
        )}
      </div>
      {!usuario && <div className="mt-4"><Aviso>Puedes mirar el mapa, pero para jugar y guardar tu progreso <Link to="/ingresar" className="font-bold underline">ingresa o crea una cuenta</Link>.</Aviso></div>}

      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Leyenda de misiones">
        {juego.misiones.map((m) => (
          <li key={m.codigo} className="flex items-center gap-2">
            <span className={`h-3.5 w-3.5 rounded-sm border border-tinta ${COLOR_MISION[m.color].fondo}`} aria-hidden />
            {m.titulo}
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="panel hidden self-start p-3 md:block lg:p-4">
          <TablaPeriodica niveles={juego.niveles} misiones={juego.misiones} progreso={progreso} seleccionado={sel} onSeleccionar={setSel} />
        </div>

        {/* Móvil: lista ordenada por misión */}
        <div className="space-y-6 md:hidden">
          {juego.misiones.map((m) => (
            <section key={m.codigo}>
              <h2 className={`font-sans text-base font-bold ${COLOR_MISION[m.color].texto}`}>{m.titulo}</h2>
              <ul className="mt-2 space-y-2">
                {juego.niveles.filter((n) => n.mision === m.codigo).map((n) => {
                  const pn = prog.get(n.codigo);
                  const lock = usuario ? !pn?.desbloqueado : n.orden > 1;
                  return (
                    <li key={n.codigo}>
                      <button type="button" onClick={() => setSel(n.codigo)} aria-pressed={sel === n.codigo}
                        className={`flex w-full items-center gap-3 rounded-lg border-2 p-2 text-left ${sel === n.codigo ? 'border-tinta bg-superficie' : 'border-linea bg-superficie/70'}`}>
                        <FichaElemento simbolo={n.casilla.simbolo} color={m.color} tam="sm" />
                        <span className="flex-1">
                          <span className="block font-bold">{n.orden}. {n.titulo}</span>
                          {pn?.completado ? <Estrellas n={pn.estrellas} tam={14} /> : <span className="text-sm text-tinta-suave">{lock ? 'Bloqueado' : 'Disponible'}</span>}
                        </span>
                        {lock && <Lock size={16} aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {nivel && mision && (
          <aside className="panel self-start p-5 lg:sticky lg:top-24" aria-live="polite">
            <div className="flex items-start gap-4">
              <FichaElemento simbolo={nivel.casilla.simbolo} color={mision.color} tam="lg" />
              <div>
                <p className={`text-sm font-bold ${COLOR_MISION[mision.color].texto}`}>Nivel {nivel.orden} · {mision.titulo}</p>
                <h2 className="mt-1 text-xl font-bold leading-tight">{nivel.titulo}</h2>
              </div>
            </div>
            <p className="mt-4">{nivel.resumen}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-papel p-2"><dt className="sr-only">Grado</dt><dd className="flex items-center gap-1"><GraduationCap size={15} aria-hidden />{nivel.grado}.º sec.</dd></div>
              <div className="rounded-lg bg-papel p-2"><dt className="sr-only">Duración</dt><dd className="flex items-center gap-1"><Clock size={15} aria-hidden />{nivel.minutos} min</dd></div>
              <div className="rounded-lg bg-papel p-2"><dt className="sr-only">Experiencia</dt><dd className="flex items-center gap-1"><Zap size={15} aria-hidden />{nivel.xp} XP</dd></div>
            </dl>
            <h3 className="mt-5 font-sans text-sm font-bold text-tinta-suave">Aprenderás a</h3>
            <p className="mt-1">{nivel.objetivo}</p>
            <p className="mt-4 border-l-4 border-sodio pl-3 text-sm text-tinta-suave">{nivel.casilla_nota}</p>
            {p?.completado && <p className="mt-4 flex items-center gap-2 text-sm">Tu mejor resultado: <Estrellas n={p.estrellas} /></p>}
            <div className="mt-5">
              {bloqueado ? (
                <p className="flex items-center gap-2 rounded-lg bg-linea/60 p-3 text-sm"><Lock size={16} aria-hidden />{usuario ? 'Completa el nivel anterior para desbloquearlo.' : 'Ingresa para empezar a jugar.'}</p>
              ) : (
                <Link to={usuario ? `/nivel/${nivel.codigo}` : `/ingresar?volver=/nivel/${nivel.codigo}`} className="btn btn-primario w-full text-lg">
                  {p?.completado ? 'Jugar de nuevo' : 'Empezar práctica'}
                </Link>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
