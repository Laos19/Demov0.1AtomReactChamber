import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camara, type CamaraApi } from '../componentes/Camara';
import { Cargando, FichaElemento } from '../componentes/ui';
import { useApp } from '../estado/AppContext';
import type { Instantanea } from '../engine/Simulation';

/**
 * Inicio: lo primero que se ve es el laboratorio funcionando (una combustión real del motor),
 * no una imagen decorativa.
 */
export default function Inicio() {
  const { quimica, juego, usuario } = useApp();
  const cam = useRef<CamaraApi>(null);
  const [s, setS] = useState<Instantanea | null>(null);
  const params = { T: 700, P: 1, V: 18, UV: 0, lambda: 254 };

  useEffect(() => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) return;
    // Una chispa cada 7 s y recarga cuando se agota la mezcla: demostración continua.
    const id = setInterval(() => {
      const snap = cam.current?.instantanea();
      if (snap && (snap.counts.H2 ?? 0) < 12) cam.current?.reiniciar(700, { H2: 60, O2: 30 });
      else cam.current?.chispa();
    }, 7000);
    return () => clearInterval(id);
  }, [quimica]);

  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:pt-16">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.05]">
            Un laboratorio de química que cabe en tu navegador
          </h1>
          <p className="mt-5 text-lg text-tinta-suave">
            Calienta, comprime, ilumina y mezcla sin riesgos. Cada casilla de la tabla periódica es una práctica
            guiada: complétala, responde el cuestionario y gana estrellas. Para estudiantes de 1.º a 5.º de secundaria.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={usuario ? '/mapa' : '/ingresar'} className="btn btn-primario text-lg">
              {usuario ? 'Continuar mis misiones' : 'Empezar en el hidrógeno'}
            </Link>
            <Link to="/laboratorio" className="btn btn-secundario text-lg">Explorar el laboratorio libre</Link>
          </div>
        </div>
        <figure className="panel overflow-hidden p-2">
          <div className="aspect-[16/11] w-full">
            {quimica ? (
              <Camara
                ref={cam}
                quimica={quimica}
                params={params}
                carga={{ H2: 60, O2: 30 }}
                onInstantanea={(x) => setS(x)}
                descripcion="Simulación en vivo: hidrógeno y oxígeno a 700 K reaccionando con chispas para formar agua"
              />
            ) : (
              <Cargando texto="Encendiendo la cámara…" />
            )}
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-3 text-sm text-tinta-suave">
            <span>En vivo: 2H₂ + O₂ → 2H₂O</span>
            {s && (
              <span className="lectura">
                {Math.round(s.Tch)} K · H₂O: {s.counts.H2O ?? 0} · reacciones: {Object.values(s.rxById).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </figcaption>
        </figure>
      </section>

      <section className="border-y-2 border-linea bg-superficie/70">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-2xl font-bold">Cómo se juega</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              ['H', 'Elige una casilla', 'El mapa es la tabla periódica. Empiezas en el hidrógeno y cada nivel completado desbloquea el siguiente.'],
              ['O', 'Sigue los pasos', 'Cada práctica tiene pasos con una meta que el simulador verifica: «lleva el agua a 400 K», «da la chispa».'],
              ['Na', 'Gana estrellas', 'Responde el cuestionario final. Menos pistas de Quimi y más aciertos = más estrellas, XP e insignias.'],
            ].map(([sim, t, d], i) => (
              <li key={t} className="flex gap-4">
                <FichaElemento simbolo={sim} numero={i + 1} color={['estados', 'combustion', 'familias'][i]} />
                <div>
                  <h3 className="font-sans text-lg font-bold">{t}</h3>
                  <p className="mt-1 text-tinta-suave">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Quimi te ayuda, pero cobra</h2>
          <p className="mt-3 text-tinta-suave">
            Si te atascas, Quimi te da una pista, luego una explicación y, si aún lo necesitas, la solución.
            Cada ayuda cuesta experiencia: aprender a intentarlo primero también es parte del juego. También puedes
            preguntarle «¿qué es la energía de activación?» y buscará en su glosario.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Para docentes</h2>
          <p className="mt-3 text-tinta-suave">
            Crea un aula, comparte el código de 6 letras y asigna niveles. Verás quién completó cada práctica, cuántas
            pistas usó, qué preguntas fallan más y cuánto tiempo toma cada paso.
          </p>
          {juego && (
            <p className="mt-4 text-sm text-tinta-suave">
              {juego.niveles.length} prácticas en {juego.misiones.length} misiones · competencias del CNEB de Ciencia y Tecnología.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
