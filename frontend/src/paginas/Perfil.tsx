import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Flame, Lock } from 'lucide-react';
import { useApp } from '../estado/AppContext';
import { Aviso, Cargando, Estrellas, ICONO_INSIGNIA, rangoPorXp } from '../componentes/ui';
import type { Perfil as TPerfil } from '../data/tipos';

/** Progreso del estudiante: rango, XP, racha, insignias e historial. */
export default function Perfil() {
  const { usuario, fuente, juego } = useApp();
  const [p, setP] = useState<TPerfil | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fuente.perfil().then(setP).catch((e) => setError((e as Error).message)); }, [fuente]);

  if (!usuario) return <Navigate to="/ingresar?volver=/perfil" replace />;
  if (error) return <div className="mx-auto max-w-7xl px-4 py-8"><Aviso tipo="error">{error}</Aviso></div>;
  if (!p || !juego) return <div className="mx-auto max-w-7xl px-4"><Cargando /></div>;
  const r = rangoPorXp(p.resumen.xp);
  const avance = r.siguiente ? (p.resumen.xp - r.base) / (r.siguiente - r.base) : 1;
  const obtenidas = new Set(p.insignias.map((i) => i.codigo));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">{p.usuario.nombre}</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <section className="panel p-5 md:col-span-2">
          <p className="text-sm font-bold text-tinta-suave">Rango</p>
          <p className="font-display text-2xl font-bold">{r.nombre}</p>
          <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-tinta bg-papel" role="progressbar" aria-label="Avance al siguiente rango" aria-valuenow={Math.round(avance * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-sodio" style={{ width: `${avance * 100}%` }} />
          </div>
          <p className="lectura mt-2 text-sm text-tinta-suave">{p.resumen.xp} XP{r.siguiente ? ` · faltan ${r.siguiente - p.resumen.xp} para el siguiente rango` : ' · rango máximo'}</p>
        </section>
        <section className="panel flex items-center gap-4 p-5">
          <Flame size={40} className="text-calcio" aria-hidden />
          <div>
            <p className="font-display text-3xl font-bold">{p.resumen.racha}</p>
            <p className="text-sm text-tinta-suave">días seguidos · mejor racha: {p.resumen.racha_maxima}</p>
          </div>
        </section>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Niveles completados', `${p.resumen.niveles_completados}/${juego.niveles.length}`],
          ['Estrellas', `${p.resumen.estrellas_totales}/${juego.niveles.length * 3}`],
          ['Insignias', `${p.insignias.length}/${juego.insignias.length}`],
          ['Intentos', `${p.historial.length}`],
        ].map(([t, v]) => <div key={t} className="panel p-4"><dt className="text-sm text-tinta-suave">{t}</dt><dd className="lectura text-2xl font-bold">{v}</dd></div>)}
      </dl>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Insignias</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {juego.insignias.map((b) => {
            const I = ICONO_INSIGNIA[b.icono] ?? Lock;
            const ok = obtenidas.has(b.codigo);
            return (
              <li key={b.codigo} className={`flex items-center gap-3 rounded-ficha border-2 p-3 ${ok ? 'border-tinta bg-sodio/25' : 'border-dashed border-linea text-tinta-suave'}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${ok ? 'border-tinta bg-sodio text-[#13233A]' : 'border-linea'}`}>
                  {ok ? <I size={22} aria-hidden /> : <Lock size={18} aria-hidden />}
                </span>
                <span><span className="block font-bold">{b.nombre}</span><span className="text-sm">{b.descripcion}</span>{!ok && <span className="sr-only"> (pendiente)</span>}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Historial</h2>
        {p.historial.length === 0 ? <p className="mt-3 text-tinta-suave">Aún no juegas ningún nivel.</p> : (
          <div className="panel mt-4 overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b-2 border-linea text-sm text-tinta-suave"><tr><th className="p-3">Nivel</th><th className="p-3">Resultado</th><th className="p-3">XP</th><th className="p-3">Ayudas</th><th className="p-3">Fecha</th></tr></thead>
              <tbody>
                {p.historial.map((h, i) => (
                  <tr key={i} className="border-b border-linea last:border-0">
                    <td className="p-3 font-bold">{h.titulo}</td>
                    <td className="p-3">{h.estado === 'completado' ? <Estrellas n={h.estrellas ?? 0} tam={15} /> : <span className="text-tinta-suave">{h.estado.replace('_', ' ')}</span>}</td>
                    <td className="lectura p-3">{h.xp_obtenido ?? '—'}</td>
                    <td className="lectura p-3">{h.pistas_usadas}</td>
                    <td className="p-3 text-sm text-tinta-suave">{new Date(h.iniciado_en).toLocaleDateString('es-PE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
