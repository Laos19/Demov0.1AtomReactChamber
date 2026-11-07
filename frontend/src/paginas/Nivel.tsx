import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronRight, Star, HelpCircle, Lightbulb, MessageCircle, Pause, Play, RotateCcw, Send } from 'lucide-react';
import gsap from 'gsap';
import { useApp } from '../estado/AppContext';
import { Camara, type CamaraApi } from '../componentes/Camara';
import { Controles } from '../componentes/Controles';
import { Aviso, COLOR_MISION, Cargando, Estrellas, ICONO_INSIGNIA } from '../componentes/ui';
import { SeguidorDePaso, describirRegla, detalle } from '../engine/conditions';
import type { Parametros } from '../engine/chemistry';
import type { Instantanea } from '../engine/Simulation';
import type { Nivel as TNivel, RespuestaQuimi, ResultadoIntento } from '../data/tipos';

const NOMBRE_AYUDA = ['', 'Pista', 'Explicación', 'Solución'];

/** Página de juego de un nivel. */
export default function Nivel() {
  const { codigo } = useParams();
  const { juego, quimica, usuario, fuente } = useApp();
  if (!usuario) return <Navigate to={`/ingresar?volver=/nivel/${codigo}`} replace />;
  if (!juego || !quimica) return <div className="mx-auto max-w-7xl px-4"><Cargando /></div>;
  const nivel = juego.niveles.find((n) => n.codigo === codigo);
  if (!nivel) return <div className="mx-auto max-w-7xl px-4 py-12"><Aviso tipo="error">Nivel no encontrado.</Aviso></div>;
  return <Juego key={nivel.codigo} nivel={nivel} costos={juego.costos_pista} siguiente={juego.niveles.find((n) => n.orden === nivel.orden + 1)?.codigo} color={juego.misiones.find((m) => m.codigo === nivel.mision)?.color ?? 'estados'} fuenteModo={fuente.modo} />;
}

function Juego({ nivel, costos, siguiente, color }: { nivel: TNivel; costos: Record<string, number>; siguiente?: string; color: string; fuenteModo: string }) {
  const { quimica, fuente, telemetria, setUsuario, usuario, recargarProgreso } = useApp();
  const nav = useNavigate();
  const cam = useRef<CamaraApi>(null);
  const [intento, setIntento] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fase, setFase] = useState<'jugando' | 'cuestionario' | 'resultado'>('jugando');
  const [paso, setPaso] = useState(0);
  const [params, setParams] = useState<Parametros>({ ...nivel.inicio.parametros });
  const [enMarcha, setEnMarcha] = useState(true);
  const [snap, setSnap] = useState<Instantanea | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const [ayudas, setAyudas] = useState<Record<number, string[]>>({});
  const [xpGastada, setXpGastada] = useState(0);
  const [resultado, setResultado] = useState<ResultadoIntento | null>(null);

  const seguidor = useRef(new SeguidorDePaso(nivel.pasos[0].condicion));
  const ocupado = useRef(false);
  const inicioPaso = useRef(performance.now());
  const pasoRef = useRef(0);
  const iniciado = useRef(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    fuente.iniciar(nivel.codigo)
      .then((r) => {
        setIntento(r.intento);
        telemetria.registrar('nivel_iniciado', nivel.codigo);
      })
      .catch((e) => setError((e as Error).message));
  }, [fuente, nivel.codigo, telemetria]);

  const alInstantanea = useCallback((s: Instantanea, p: Parametros) => {
    setSnap(s);
    if (fase !== 'jugando' || intento === null || ocupado.current) return;
    if (!seguidor.current.actualizar(s, p)) return;
    ocupado.current = true;
    const i = pasoRef.current;
    const seg = (performance.now() - inicioPaso.current) / 1000;
    fuente.completarPaso(intento, i + 1, seg)
      .then(() => {
        telemetria.registrar('paso_completado', nivel.codigo, { paso: i + 1, segundos: Math.round(seg) });
        if (i + 1 >= nivel.pasos.length) {
          setAnuncio('¡Práctica completada! Responde el cuestionario.');
          setFase('cuestionario');
          setEnMarcha(false);
        } else {
          pasoRef.current = i + 1;
          seguidor.current = new SeguidorDePaso(nivel.pasos[i + 1].condicion);
          inicioPaso.current = performance.now();
          setPaso(i + 1);
          setAnuncio(`Paso ${i + 1} completado. Siguiente: ${nivel.pasos[i + 1].titulo}`);
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => { ocupado.current = false; });
  }, [fase, intento, fuente, nivel, telemetria]);

  const pedirAyuda = async (n: number) => {
    if (intento === null) return;
    try {
      const r = await fuente.pedirAyuda(intento, paso + 1, n);
      setAyudas((a) => ({ ...a, [paso]: [...(a[paso] ?? []).slice(0, n - 1), r.texto] }));
      setXpGastada((x) => x + r.costoXp);
      telemetria.registrar('pista_usada', nivel.codigo, { paso: paso + 1, nivelAyuda: n });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const reiniciar = () => {
    setParams({ ...nivel.inicio.parametros });
    cam.current?.reiniciar(nivel.inicio.parametros.T, nivel.inicio.carga);
    seguidor.current = new SeguidorDePaso(nivel.pasos[paso].condicion);
  };

  if (!quimica) return null;
  const pasoAct = nivel.pasos[paso];
  const c = COLOR_MISION[color];
  const formula = (sp: string) => quimica.especies[sp]?.formula ?? sp;
  const checklist = snap && fase === 'jugando' ? detalle(pasoAct.condicion, snap, params) : [];
  const abiertas = ayudas[paso] ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <p className="sr-only" aria-live="assertive">{anuncio}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/mapa" className="text-sm font-bold underline">Misiones</Link>
        <ChevronRight size={16} aria-hidden className="text-tinta-suave" />
        <span className={`text-sm font-bold ${c.texto}`}>Nivel {nivel.orden}</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold md:text-3xl">{nivel.titulo}</h1>
      {error && <div className="mt-3"><Aviso tipo="error">{error} <Link to="/mapa" className="font-bold underline">Volver al mapa</Link></Aviso></div>}

      {fase === 'jugando' && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr_300px]">
          {/* Pasos */}
          <section aria-labelledby="t-pasos" className="panel order-2 p-4 lg:order-1">
            <h2 id="t-pasos" className="font-sans text-base font-bold">Pasos ({paso}/{nivel.pasos.length})</h2>
            <ol className="mt-3 space-y-2">
              {nivel.pasos.map((p, i) => (
                <li key={p.orden} className={`flex items-start gap-2 rounded-lg p-2 ${i === paso ? 'bg-papel' : ''}`} aria-current={i === paso ? 'step' : undefined}>
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${i < paso ? `${c.fondo} border-transparent text-white` : i === paso ? 'border-tinta' : 'border-linea text-tinta-suave'}`}>
                    {i < paso ? <Check size={14} aria-label="completado" /> : i + 1}
                  </span>
                  <span className={i > paso ? 'text-tinta-suave' : 'font-bold'}>{p.titulo}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 border-t-2 border-linea pt-4">
              <h3 className="font-sans text-sm font-bold text-tinta-suave">Ahora</h3>
              <p className="mt-1 text-[17px] font-bold">{pasoAct.instruccion}</p>
              <ul className="mt-3 space-y-1.5 text-sm" aria-label="Lo que verifica el simulador">
                {checklist.map(({ regla, ok, actual }) => (
                  <li key={regla.metrica + regla.valor} className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded border-2 ${ok ? 'border-exito bg-exito text-white' : 'border-linea'}`}>{ok && <Check size={12} aria-hidden />}</span>
                    <span>{describirRegla(regla, formula)}</span>
                    {typeof actual === 'number' && !ok && <span className="lectura ml-auto text-tinta-suave">{actual < 10 ? actual.toFixed(2) : Math.round(actual)}</span>}
                    <span className="sr-only">{ok ? 'cumplido' : 'pendiente'}</span>
                  </li>
                ))}
              </ul>
              {pasoAct.condicion.durante && (
                <div className="mt-2 h-2 overflow-hidden rounded bg-linea" role="progressbar" aria-label="Tiempo sostenido" aria-valuenow={Math.round(seguidor.current.progreso * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`h-full ${c.fondo}`} style={{ width: `${seguidor.current.progreso * 100}%` }} />
                </div>
              )}
              <details className="mt-4 rounded-lg border-2 border-linea p-3">
                <summary className="cursor-pointer font-bold">¿Por qué pasa esto?</summary>
                <p className="mt-2 text-[15px]">{pasoAct.concepto}</p>
              </details>
            </div>
          </section>

          {/* Cámara */}
          <section aria-label="Cámara de simulación" className="order-1 lg:order-2">
            <div className="panel overflow-hidden p-2">
              <div className="aspect-[4/3] w-full">
                <Camara ref={cam} quimica={quimica} params={params} carga={nivel.inicio.carga} enMarcha={enMarcha}
                  onInstantanea={alInstantanea}
                  descripcion={snap ? `Cámara a ${Math.round(snap.Tch)} K con ${snap.N} partículas. Estado predominante: ${snap.phase}.` : undefined} />
              </div>
              <div className="flex flex-wrap items-center gap-2 px-1 pt-2">
                <button type="button" className="btn btn-secundario" onClick={() => setEnMarcha((v) => !v)} aria-pressed={!enMarcha}>
                  {enMarcha ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}{enMarcha ? 'Pausar' : 'Seguir'}
                </button>
                <button type="button" className="btn btn-secundario" onClick={reiniciar}><RotateCcw size={18} aria-hidden />Reiniciar</button>
                {snap && (
                  <p className="lectura ml-auto text-sm text-tinta-suave">
                    {Math.round(snap.Tch)} K · {params.P} atm · {snap.N} partículas · {snap.phase}
                  </p>
                )}
              </div>
            </div>
            <div className="panel mt-4 p-4">
              <Controles quimica={quimica} params={params} onParams={setParams} permitidos={nivel.controles} especies={nivel.especies}
                onInyectar={(sp, n) => cam.current?.inyectar(sp, n)}
                onChispa={() => { cam.current?.chispa(); telemetria.registrar('chispa', nivel.codigo); }} />
            </div>
          </section>

          {/* Quimi */}
          <Quimi nivel={nivel} paso={paso} abiertas={abiertas} costos={costos} xpGastada={xpGastada} onAyuda={pedirAyuda} />
        </div>
      )}

      {fase === 'cuestionario' && intento !== null && (
        <Cuestionario nivel={nivel} intento={intento} onFin={async () => {
          try {
            const r = await fuente.finalizar(intento);
            telemetria.registrar('nivel_completado', nivel.codigo, { estrellas: r.estrellas });
            if (usuario) setUsuario({ ...usuario, xp: r.xp_total, racha: r.racha });
            await recargarProgreso();
            setResultado(r);
            setFase('resultado');
          } catch (e) {
            setError((e as Error).message);
          }
        }} />
      )}

      {fase === 'resultado' && resultado && (
        <Resultado r={resultado} onMapa={() => nav('/mapa')} onSiguiente={siguiente ? () => nav(`/nivel/${siguiente}`) : undefined} />
      )}
    </div>
  );

}

/** Panel del asistente Quimi: ayudas escalonadas y preguntas libres al glosario. */
function Quimi({ nivel, paso, abiertas, costos, xpGastada, onAyuda }: {
  nivel: TNivel; paso: number; abiertas: string[]; costos: Record<string, number>; xpGastada: number; onAyuda: (n: number) => void;
}) {
  const { fuente, telemetria } = useApp();
  const [q, setQ] = useState('');
  const [resp, setResp] = useState<RespuestaQuimi | null>(null);
  const [cargando, setCargando] = useState(false);
  const siguienteAyuda = abiertas.length + 1;

  const preguntar = async (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setCargando(true);
    try {
      setResp(await fuente.quimi(q, nivel.codigo, paso + 1));
      telemetria.registrar('quimi_consulta', nivel.codigo, { largo: q.length });
    } finally {
      setCargando(false);
    }
  };

  return (
    <aside aria-labelledby="t-quimi" className="panel order-3 self-start p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-tinta bg-sodio font-display font-bold text-[#13233A]" aria-hidden>Q</span>
        <div>
          <h2 id="t-quimi" className="font-sans text-base font-bold">Quimi</h2>
          <p className="text-sm text-tinta-suave">Tu asistente de laboratorio</p>
        </div>
      </div>
      <div className="mt-4 space-y-2" aria-live="polite">
        {abiertas.map((t, i) => (
          <div key={i} className="rounded-lg border-2 border-linea bg-papel p-3 text-[15px]">
            <p className="text-xs font-bold text-tinta-suave">{NOMBRE_AYUDA[i + 1]}</p>
            <p>{t}</p>
          </div>
        ))}
      </div>
      {siguienteAyuda <= 3 ? (
        <button type="button" className="btn btn-secundario mt-3 w-full" onClick={() => onAyuda(siguienteAyuda)}>
          <Lightbulb size={18} aria-hidden /> {NOMBRE_AYUDA[siguienteAyuda]} <span className="lectura text-sm text-tinta-suave">−{costos[String(siguienteAyuda)]} XP</span>
        </button>
      ) : (
        <p className="mt-3 text-sm text-tinta-suave">Ya abriste todas las ayudas de este paso.</p>
      )}
      {xpGastada > 0 && <p className="mt-2 text-xs text-tinta-suave">XP usada en ayudas: <span className="lectura">{xpGastada}</span></p>}

      <form onSubmit={preguntar} className="mt-5 border-t-2 border-linea pt-4">
        <label htmlFor="quimi-q" className="flex items-center gap-1.5 text-sm font-bold"><MessageCircle size={16} aria-hidden />Pregúntale a Quimi</label>
        <div className="mt-2 flex gap-2">
          <input id="quimi-q" className="campo" placeholder="¿Qué es un radical?" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="btn btn-secundario px-3" aria-label="Preguntar" disabled={cargando}><Send size={18} aria-hidden /></button>
        </div>
      </form>
      {resp && (
        <div className="mt-3 space-y-2 text-[15px]" aria-live="polite">
          {resp.terminos.length ? resp.terminos.map((t) => (
            <div key={t.termino} className="rounded-lg bg-papel p-3"><p className="font-bold">{t.termino}</p><p>{t.definicion}</p></div>
          )) : <p className="flex gap-2"><HelpCircle size={18} aria-hidden className="shrink-0" />{resp.mensaje}</p>}
        </div>
      )}
    </aside>
  );
}

/** Cuestionario de cierre con retroalimentación inmediata. */
function Cuestionario({ nivel, intento, onFin }: { nivel: TNivel; intento: number; onFin: () => Promise<void> }) {
  const { fuente, telemetria } = useApp();
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [fb, setFb] = useState<{ correcta: boolean; explicacion: string; opcionCorrecta: number } | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [cerrando, setCerrando] = useState(false);
  const q = nivel.cuestionario[i];

  const responder = async () => {
    if (elegida === null) return;
    const r = await fuente.responder(intento, q.orden, elegida);
    setFb(r);
    if (r.correcta) setAciertos((a) => a + 1);
    telemetria.registrar('cuestionario_respondido', nivel.codigo, { pregunta: q.orden, correcta: r.correcta });
  };
  const siguiente = async () => {
    if (i + 1 < nivel.cuestionario.length) {
      setI(i + 1);
      setElegida(null);
      setFb(null);
    } else {
      setCerrando(true);
      await onFin();
    }
  };

  return (
    <section className="panel mx-auto mt-8 max-w-2xl p-6" aria-labelledby="t-cuest">
      <p className="text-sm font-bold text-tinta-suave">Cuestionario · pregunta {i + 1} de {nivel.cuestionario.length} · aciertos {aciertos}</p>
      <h2 id="t-cuest" className="mt-2 font-sans text-xl font-bold">{q.enunciado}</h2>
      <fieldset className="mt-5 space-y-2" disabled={!!fb}>
        <legend className="sr-only">Alternativas</legend>
        {q.opciones.map((o) => {
          const esCorrecta = fb && o.orden === fb.opcionCorrecta;
          const esMala = fb && elegida === o.orden && !fb.correcta;
          return (
            <label key={o.orden} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-2 ${esCorrecta ? 'border-exito bg-exito/10' : esMala ? 'border-peligro bg-peligro/10' : elegida === o.orden ? 'border-tinta' : 'border-linea'}`}>
              <input type="radio" name={`p${q.orden}`} checked={elegida === o.orden} onChange={() => setElegida(o.orden)} className="h-5 w-5 accent-[rgb(var(--cobre))]" />
              {o.texto}
            </label>
          );
        })}
      </fieldset>
      {fb && (
        <div className="mt-4" aria-live="polite">
          <Aviso tipo={fb.correcta ? 'exito' : 'error'}><strong>{fb.correcta ? '¡Correcto!' : 'No es correcto.'}</strong> {fb.explicacion}</Aviso>
        </div>
      )}
      <div className="mt-5 flex justify-end">
        {!fb ? (
          <button type="button" className="btn btn-primario" disabled={elegida === null} onClick={responder}>Responder</button>
        ) : (
          <button type="button" className="btn btn-primario" disabled={cerrando} onClick={siguiente}>
            {i + 1 < nivel.cuestionario.length ? 'Siguiente pregunta' : cerrando ? 'Calculando…' : 'Ver resultado'}
          </button>
        )}
      </div>
    </section>
  );
}

/** Pantalla de resultado: el único momento con animación orquestada (estrellas + XP). */
function Resultado({ r, onMapa, onSiguiente }: { r: ResultadoIntento; onMapa: () => void; onSiguiente?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [xp, setXp] = useState(0);
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(ref.current!.querySelectorAll('[data-estrella]'), { scale: 0, rotate: -40, duration: 0.5, stagger: 0.25, ease: 'back.out(2)' });
      const o = { v: 0 };
      gsap.to(o, { v: r.xp_obtenido, duration: 1.2, delay: 0.6, ease: 'power2.out', onUpdate: () => setXp(Math.round(o.v)) });
    });
    mm.add('(prefers-reduced-motion: reduce)', () => setXp(r.xp_obtenido));
    return () => mm.revert();
  }, [r]);

  return (
    <section ref={ref} className="panel mx-auto mt-8 max-w-2xl p-8 text-center" aria-labelledby="t-res">
      <h2 id="t-res" className="text-3xl font-bold">¡Nivel completado!</h2>
      <div className="mt-6 flex justify-center gap-3" role="img" aria-label={`${r.estrellas} de 3 estrellas`}>
        {[1, 2, 3].map((i) => (
          <span key={i} data-estrella className="inline-block" aria-hidden>
            <Star size={56} strokeWidth={2} className={i <= r.estrellas ? 'fill-sodio text-[#9a7300]' : 'text-tinta-suave/40'} />
          </span>
        ))}
      </div>
      <p className="mt-6 font-display text-4xl font-bold"><span className="lectura">+{xp}</span> XP</p>
      <p className="mt-2 text-tinta-suave">Total: {r.xp_total} XP · Racha: {r.racha} {r.racha === 1 ? 'día' : 'días'}{r.es_repeticion ? ' · Repetición: 25 % de XP' : ''}</p>
      {r.insignias_nuevas.length > 0 && (
        <div className="mt-6">
          <h3 className="font-sans font-bold">Insignias nuevas</h3>
          <ul className="mt-3 flex flex-wrap justify-center gap-3">
            {r.insignias_nuevas.map((b) => {
              const I = ICONO_INSIGNIA[b.icono] ?? Check;
              return (
                <li key={b.codigo} className="flex items-center gap-2 rounded-lg border-2 border-tinta bg-sodio/30 px-3 py-2 text-left">
                  <I size={22} aria-hidden />
                  <span><span className="block font-bold">{b.nombre}</span><span className="text-sm">{b.descripcion}</span></span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-secundario" onClick={onMapa}>Volver al mapa</button>
        {onSiguiente && <button type="button" className="btn btn-primario" onClick={onSiguiente}>Siguiente nivel</button>}
      </div>
    </section>
  );
}
