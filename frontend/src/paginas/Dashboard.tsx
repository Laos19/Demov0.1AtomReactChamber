import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../estado/AppContext';
import { Aviso, Cargando } from '../componentes/ui';
import type { Dashboard as TDashboard } from '../data/tipos';

/** Gráfico de barras diario en SVG (sin librerías: liviano y con tabla accesible equivalente). */
function BarrasDiarias({ datos }: { datos: TDashboard['usoDiario'] }) {
  const W = 720;
  const H = 180;
  const max = Math.max(1, ...datos.map((d) => d.sesiones));
  const bw = W / datos.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-labelledby="t-uso">
        <title id="t-uso">Sesiones por día en los últimos 30 días</title>
        {[0.5, 1].map((k) => <line key={k} x1={0} x2={W} y1={H - H * k} y2={H - H * k} stroke="rgb(var(--linea))" strokeDasharray="4 4" />)}
        {datos.map((d, i) => {
          const h = (d.sesiones / max) * (H - 8);
          return (
            <g key={d.dia}>
              <rect x={i * bw + 2} y={H - h} width={bw - 4} height={h} rx={3} fill="rgb(var(--cobre))"><title>{`${new Date(d.dia).toLocaleDateString('es-PE')}: ${d.sesiones} sesiones, ${d.niveles_completados} niveles`}</title></rect>
              {d.niveles_completados > 0 && <circle cx={i * bw + bw / 2} cy={H - h - 6} r={3} fill="rgb(var(--sodio))" />}
            </g>
          );
        })}
        <text x={0} y={H + 18} fontSize="11" fill="rgb(var(--tinta-suave))">{new Date(datos[0].dia).toLocaleDateString('es-PE')}</text>
        <text x={W} y={H + 18} fontSize="11" textAnchor="end" fill="rgb(var(--tinta-suave))">hoy</text>
      </svg>
      <figcaption className="mt-2 flex gap-4 text-xs text-tinta-suave">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-cobre" aria-hidden />sesiones</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-sodio" aria-hidden />hubo niveles completados</span>
      </figcaption>
    </figure>
  );
}

/** Dashboard de utilización del producto (docentes y administradores). */
export default function Dashboard() {
  const { usuario, fuente } = useApp();
  const [d, setD] = useState<TDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fuente.dashboard().then(setD).catch((e) => setError((e as Error).message)); }, [fuente]);

  if (!usuario) return <Navigate to="/ingresar?volver=/dashboard" replace />;
  if (usuario.rol === 'estudiante') return <div className="mx-auto max-w-7xl px-4 py-8"><Aviso tipo="error">El dashboard es para docentes y administradores.</Aviso></div>;
  if (error) return <div className="mx-auto max-w-7xl px-4 py-8"><Aviso tipo="error">{error}</Aviso></div>;
  if (!d) return <div className="mx-auto max-w-7xl px-4"><Cargando /></div>;

  const k = d.kpis;
  const kpis: Array<[string, string, string]> = [
    ['Estudiantes', `${k.estudiantes}`, `${k.aulas} aulas`],
    ['Activos 7 días', `${k.activos_7d}`, `${k.sesiones_7d} sesiones`],
    ['Niveles completados', `${k.niveles_completados}`, `tasa ${k.tasa_completado ?? 0} %`],
    ['Aciertos en cuestionarios', `${k.aciertos_cuestionario ?? 0} %`, `${k.pistas_por_nivel ?? 0} pistas por nivel`],
  ];
  const maxIntentos = Math.max(1, ...d.niveles.map((n) => n.intentos));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Dashboard de uso</h1>
      <p className="mt-1 text-tinta-suave">Calculado en PostgreSQL con vistas y una vista materializada que se refresca en cada consulta{fuente.modo === 'demo' ? ' · instantánea de demostración' : ''}.</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([t, v, s]) => (
          <div key={t} className="panel p-4"><dt className="text-sm text-tinta-suave">{t}</dt><dd className="font-display text-3xl font-bold">{v}</dd><dd className="text-sm text-tinta-suave">{s}</dd></div>
        ))}
      </dl>

      <section className="panel mt-5 p-5"><h2 className="mb-4 font-sans text-lg font-bold">Uso diario</h2><BarrasDiarias datos={d.usoDiario} /></section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-sans text-lg font-bold">Embudo por nivel</h2>
          <p className="text-sm text-tinta-suave">Intentos y tasa de completado: dónde abandonan los estudiantes.</p>
          <ul className="mt-4 space-y-2">
            {d.niveles.map((n) => (
              <li key={n.codigo} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-sm">
                <span className="truncate">{n.orden}. {n.titulo}</span>
                <span className="lectura text-tinta-suave">{n.completados}/{n.intentos} · {n.tasa_completado ?? 0} %</span>
                <span className="col-span-2 mt-1 flex h-2.5 overflow-hidden rounded bg-linea" aria-hidden>
                  <span className="bg-cobre" style={{ width: `${(n.completados / maxIntentos) * 100}%` }} />
                  <span className="bg-calcio/60" style={{ width: `${((n.intentos - n.completados) / maxIntentos) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="font-sans text-lg font-bold">Preguntas con más errores</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-tinta-suave"><tr><th className="py-2">Pregunta</th><th className="py-2 text-right">Error</th></tr></thead>
            <tbody>{d.preguntas.map((p) => <tr key={p.enunciado} className="border-t border-linea"><td className="py-2 pr-2">{p.enunciado}</td><td className="lectura py-2 text-right">{p.porcentaje_error} %</td></tr>)}</tbody>
          </table>
          <h2 className="mt-6 font-sans text-lg font-bold">Pasos más lentos</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-tinta-suave"><tr><th className="py-2">Paso</th><th className="py-2 text-right">Promedio</th></tr></thead>
            <tbody>{d.pasosLentos.map((p) => <tr key={p.nivel_codigo + p.orden} className="border-t border-linea"><td className="py-2 pr-2">{p.titulo} <span className="text-tinta-suave">({p.nivel_codigo})</span></td><td className="lectura py-2 text-right">{Math.round(p.segundos_promedio)} s</td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel p-5">
          <h2 className="font-sans text-lg font-bold">Origen de las sesiones</h2>
          <p className="text-sm text-tinta-suave">Web, extensión de VS Code, Claude Code y servidor MCP (reto de integraciones).</p>
          <ul className="mt-3 space-y-2">{d.origen.map((o) => <li key={o.origen} className="flex justify-between rounded bg-papel px-3 py-2"><span className="font-bold">{o.origen}</span><span className="lectura">{o.sesiones}</span></li>)}</ul>
        </section>

        <section className="panel p-5">
          <h2 className="font-sans text-lg font-bold">Insignias otorgadas</h2>
          <ul className="mt-3 space-y-2">{d.insignias.map((b) => <li key={b.nombre} className="flex justify-between rounded bg-papel px-3 py-2"><span>{b.nombre}</span><span className="lectura">{b.otorgadas}</span></li>)}</ul>
        </section>
      </div>
    </div>
  );
}
