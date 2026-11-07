import { useRef, useState } from 'react';
import { ExternalLink, Pause, Play, RotateCcw, StepForward, Trash2 } from 'lucide-react';
import { useApp } from '../estado/AppContext';
import { Camara, type CamaraApi } from '../componentes/Camara';
import { Controles } from '../componentes/Controles';
import { Cargando } from '../componentes/ui';
import { PARAMETROS_INICIALES, conSigno, type Parametros, type Quimica } from '../engine/chemistry';
import type { Instantanea } from '../engine/Simulation';

const ESTILO_LOG: Record<string, string> = {
  rx: 'text-cobre', bond: 'text-calcio', endo: 'text-potasio', photon: 'text-potasio', heat: 'text-calcio', phase: 'text-cobre', warn: 'text-peligro', info: 'text-tinta-suave',
};

/** Laboratorio libre: el simulador completo de la v0.1, sin pasos ni puntaje. */
export default function Laboratorio() {
  const { quimica, telemetria } = useApp();
  const cam = useRef<CamaraApi>(null);
  const [params, setParams] = useState<Parametros>({ ...PARAMETROS_INICIALES, T: 700, V: 12 });
  const [enMarcha, setEnMarcha] = useState(true);
  const [velocidad, setVelocidad] = useState(1);
  const [snap, setSnap] = useState<Instantanea | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [preset, setPreset] = useState('combustion');

  if (!quimica) return <div className="mx-auto max-w-7xl px-4"><Cargando /></div>;
  const pr = quimica.presets.find((p) => p.codigo === preset)!;

  const cargar = (codigo: string) => {
    const p = quimica.presets.find((x) => x.codigo === codigo)!;
    setPreset(codigo);
    setParams({ ...p.parametros });
    cam.current?.reiniciar(p.parametros.T, p.carga);
    setEnMarcha(true);
    telemetria.registrar('preset_cargado', undefined, { preset: codigo });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-3xl font-bold">Laboratorio libre</h1>
      <p className="mt-1 text-tinta-suave">Experimenta sin metas. Haz clic en una partícula para ver su ficha o en un espacio vacío para inyectar.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr_320px]">
        <section className="panel space-y-4 p-4" aria-labelledby="t-exp">
          <h2 id="t-exp" className="font-sans text-base font-bold">Experimentos</h2>
          <ul className="space-y-2">
            {quimica.presets.map((p) => (
              <li key={p.codigo}>
                <button type="button" onClick={() => cargar(p.codigo)} aria-pressed={preset === p.codigo}
                  className={`w-full rounded-lg border-2 p-3 text-left ${preset === p.codigo ? 'border-tinta bg-papel' : 'border-linea hover:border-tinta/50'}`}>
                  <span className="block font-bold">{p.nombre}</span>
                  <span className="lectura block text-sm">{p.ecuacion}</span>
                  <span className="text-xs text-tinta-suave">{p.etiqueta}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-l-4 border-sodio pl-3 text-sm text-tinta-suave">{pr.pista}</p>
          <div className="border-t-2 border-linea pt-4">
            <Controles quimica={quimica} params={params} onParams={setParams} permitidos={['T', 'P', 'V', 'UV', 'lambda', 'inyectar', 'chispa']}
              especies={quimica.inyectables} onInyectar={(sp, n) => cam.current?.inyectar(sp, n)} onChispa={() => cam.current?.chispa()} />
          </div>
        </section>

        <section aria-label="Cámara">
          <div className="panel overflow-hidden p-2">
            <div className="aspect-[4/3] w-full">
              <Camara ref={cam} quimica={quimica} params={params} carga={pr.carga} enMarcha={enMarcha} velocidad={velocidad}
                inyectarAlClic={quimica.inyectables[0]} resaltar={sel} onInstantanea={setSnap} onParticula={setSel}
                descripcion={snap ? `Cámara a ${Math.round(snap.Tch)} K con ${snap.N} partículas` : undefined} />
            </div>
            <div className="flex flex-wrap items-center gap-2 px-1 pt-2">
              <button type="button" className="btn btn-secundario" onClick={() => setEnMarcha((v) => !v)}>
                {enMarcha ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}{enMarcha ? 'Pausar' : 'Seguir'}
              </button>
              <button type="button" className="btn btn-secundario" aria-label="Avanzar un paso" onClick={() => { setEnMarcha(false); }}><StepForward size={18} aria-hidden /></button>
              <button type="button" className="btn btn-secundario" onClick={() => cargar(preset)}><RotateCcw size={18} aria-hidden />Reiniciar</button>
              <button type="button" className="btn btn-secundario" onClick={() => cam.current?.vaciar()}><Trash2 size={18} aria-hidden />Vaciar</button>
              <label className="ml-auto flex items-center gap-2 text-sm font-bold">
                Velocidad
                <select className="campo w-auto" value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))}>
                  {[0.5, 1, 2, 5].map((v) => <option key={v} value={v}>{v}x</option>)}
                </select>
              </label>
            </div>
          </div>
          {snap && (
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Temperatura', `${Math.round(snap.Tch)} K`],
                ['Partículas', `${snap.N}`],
                ['Estado', snap.phase],
                ['Reacciones/s', snap.rxRate.toFixed(1)],
              ].map(([t, v]) => (
                <div key={t} className="panel p-3"><dt className="text-xs font-bold text-tinta-suave">{t}</dt><dd className="lectura text-xl">{v}</dd></div>
              ))}
            </dl>
          )}
        </section>

        <section className="space-y-4" aria-label="Telemetría">
          {sel && <Ficha quimica={quimica} sp={sel} snap={snap} />}
          <div className="panel p-4">
            <h2 className="font-sans text-base font-bold">Composición</h2>
            <ul className="mt-2 space-y-1">
              {snap && quimica.orden.filter((k) => snap.counts[k]).map((k) => (
                <li key={k}>
                  <button type="button" onClick={() => setSel(k)} className="flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-papel">
                    <span className="h-3 w-3 rounded-full border border-tinta/40" style={{ background: quimica.especies[k].color }} aria-hidden />
                    <span className="font-bold">{quimica.especies[k].formula}</span>
                    <span className="text-xs text-tinta-suave">{snap.phases[k]}</span>
                    <span className="lectura ml-auto">{snap.counts[k]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-4">
            <h2 className="font-sans text-base font-bold">Consola de eventos</h2>
            <ol className="mt-2 max-h-72 space-y-1 overflow-y-auto text-[13px]" aria-live="off">
              {snap?.log.slice(0, 40).map((l) => (
                <li key={l.id} className={ESTILO_LOG[l.type]}><span className="lectura text-tinta-suave">{l.t.toFixed(1)}s</span> {l.text}</li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Ficha de una especie con datos del catálogo y enlace a PubChem. */
function Ficha({ quimica, sp, snap }: { quimica: Quimica; sp: string; snap: Instantanea | null }) {
  const s = quimica.especies[sp];
  const rx = quimica.reacciones.filter((r) => r.reactivos.includes(sp) || r.productos.includes(sp)).slice(0, 4);
  return (
    <div className="panel p-4">
      <h2 className="font-display text-2xl font-bold">{s.formula}</h2>
      <p className="text-tinta-suave">{s.nombre}{s.radical ? ' · radical' : ''}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-tinta-suave">Masa molar</dt><dd className="lectura">{s.masa_molar} g/mol</dd>
        <dt className="text-tinta-suave">ΔHf°</dt><dd className="lectura">{conSigno(s.dhf)} kJ/mol</dd>
        {s.pf != null && <><dt className="text-tinta-suave">Fusión</dt><dd className="lectura">{s.pf} K</dd></>}
        {s.pe != null && <><dt className="text-tinta-suave">Ebullición</dt><dd className="lectura">{s.pe} K</dd></>}
        {snap && <><dt className="text-tinta-suave">Estado ahora</dt><dd>{snap.phases[sp]}</dd></>}
      </dl>
      {rx.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {rx.map((r) => <li key={r.codigo} className="lectura">{r.eq} <span className={r.dH < 0 ? 'text-calcio' : 'text-potasio'}>ΔH {conSigno(r.dH)}</span></li>)}
        </ul>
      )}
      {s.cid && (
        <a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${s.cid}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline">
          Ver en PubChem <ExternalLink size={14} aria-hidden /><span className="sr-only">(abre en una pestaña nueva)</span>
        </a>
      )}
    </div>
  );
}
