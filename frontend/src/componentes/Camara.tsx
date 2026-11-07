import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { Parametros, Quimica } from '../engine/chemistry';
import { Simulation, type Instantanea } from '../engine/Simulation';
import { crearSprites, dibujar, type Sprite } from '../render/dibujar';

/** Acciones imperativas sobre la cámara. */
export interface CamaraApi {
  inyectar(sp: string, n: number): number;
  chispa(): void;
  vaciar(): void;
  /** Reinicia con una temperatura y una carga inicial. */
  reiniciar(T0: number, carga: Record<string, number>): void;
  instantanea(): Instantanea | null;
}

interface Props {
  quimica: Quimica;
  params: Parametros;
  carga: Record<string, number>;
  enMarcha?: boolean;
  velocidad?: number;
  /** Especie que se inyecta al hacer clic en una zona vacía (null = no inyecta). */
  inyectarAlClic?: string | null;
  resaltar?: string | null;
  onInstantanea?: (s: Instantanea, p: Parametros) => void;
  onParticula?: (sp: string) => void;
  /** Descripción accesible del contenido (se actualiza con el estado). */
  descripcion?: string;
  className?: string;
}

/**
 * Lienzo de la cámara de simulación. Ejecuta el motor a 60 FPS con requestAnimationFrame
 * y entrega instantáneas ~10 veces por segundo para la interfaz y la evaluación de pasos.
 */
export const Camara = forwardRef<CamaraApi, Props>(function Camara(
  { quimica, params, carga, enMarcha = true, velocidad = 1, inyectarAlClic = null, resaltar = null, onInstantanea, onParticula, descripcion, className = '' },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation>(null as unknown as Simulation);
  if (!simRef.current) {
    simRef.current = new Simulation(quimica, params.T);
    for (const [sp, n] of Object.entries(carga)) simRef.current.inyectar(sp, n);
  }
  const vivo = useRef({ params, enMarcha, velocidad, resaltar, onInstantanea });
  vivo.current = { params, enMarcha, velocidad, resaltar, onInstantanea };

  useImperativeHandle(ref, () => ({
    inyectar: (sp, n) => simRef.current.inyectar(sp, n),
    chispa: () => simRef.current.chispa(),
    vaciar: () => simRef.current.vaciar(),
    reiniciar: (T0, c) => {
      simRef.current.reiniciar(T0);
      for (const [sp, n] of Object.entries(c)) simRef.current.inyectar(sp, n);
    },
    instantanea: () => simRef.current.instantanea(vivo.current.params),
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let sprites: Record<string, Sprite> = {};
    const ajustar = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sprites = crearSprites(quimica, dpr);
      simRef.current.ajustarCaja(W, H, vivo.current.params.V, true);
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(canvas);
    ajustar();
    let raf = 0;
    let frame = 0;
    const bucle = () => {
      const { params: p, enMarcha: on, velocidad: v, resaltar: hl, onInstantanea: cb } = vivo.current;
      const sim = simRef.current;
      sim.ajustarCaja(W, H, p.V);
      if (on && !document.hidden) sim.paso(p, v);
      dibujar(ctx, sim, p, W, H, sprites, hl ?? null, reducido);
      if (cb && frame++ % 6 === 0) cb(sim.instantanea(p), p);
      raf = requestAnimationFrame(bucle);
    };
    raf = requestAnimationFrame(bucle);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [quimica]);

  const clic = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const p = simRef.current.particulaEn(x, y);
    if (p) onParticula?.(p.sp);
    else if (inyectarAlClic) simRef.current.inyectar(inyectarAlClic, 5, { x, y });
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={clic}
      role="img"
      aria-label={descripcion ?? 'Cámara de simulación molecular'}
      className={`block h-full w-full cursor-crosshair rounded-ficha bg-visor ${className}`}
    />
  );
});
