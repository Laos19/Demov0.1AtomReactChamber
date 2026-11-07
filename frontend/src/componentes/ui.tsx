import type { ReactNode } from 'react';
import {
  Brain, Flame, FlaskConical, Grid3x3, Microscope, Sparkles, Star, Zap, type LucideIcon,
} from 'lucide-react';

/** Color de cada misión (paleta del ensayo a la llama). */
export const COLOR_MISION: Record<string, { texto: string; fondo: string; borde: string; nombre: string; var: string }> = {
  estados: { texto: 'text-cobre', fondo: 'bg-cobre', borde: 'border-cobre', nombre: 'cobre', var: '--cobre' },
  combustion: { texto: 'text-calcio', fondo: 'bg-calcio', borde: 'border-calcio', nombre: 'calcio', var: '--calcio' },
  familias: { texto: 'text-litio', fondo: 'bg-litio', borde: 'border-litio', nombre: 'litio', var: '--litio' },
  luz: { texto: 'text-potasio', fondo: 'bg-potasio', borde: 'border-potasio', nombre: 'potasio', var: '--potasio' },
};

/** Íconos de insignias. */
export const ICONO_INSIGNIA: Record<string, LucideIcon> = {
  flask: FlaskConical, microscope: Microscope, grid: Grid3x3, sparkles: Sparkles, flame: Flame, star: Star, zap: Zap, brain: Brain,
};

/** Fila de 3 estrellas con nombre accesible. */
export function Estrellas({ n, tam = 18, className = '' }: { n: number; tam?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label={`${n} de 3 estrellas`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} size={tam} strokeWidth={2} className={i <= n ? 'fill-sodio text-[#9a7300]' : 'text-tinta-suave/50'} aria-hidden />
      ))}
    </span>
  );
}

/** Mensaje de estado (info, error, éxito). */
export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'error' | 'exito'; children: ReactNode }) {
  const c = { info: 'border-cobre/60 bg-cobre/10', error: 'border-peligro/70 bg-peligro/10', exito: 'border-exito/70 bg-exito/10' }[tipo];
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-lg border-2 px-4 py-3 text-[15px] ${c}`}>
      {children}
    </div>
  );
}

/** Indicador de carga accesible. */
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-16 text-tinta-suave">
      <span className="h-3 w-3 animate-ping rounded-full bg-cobre motion-reduce:animate-none" aria-hidden />
      {texto}
    </div>
  );
}

/** Ficha de elemento (casilla de tabla periódica en miniatura). */
export function FichaElemento({ simbolo, numero, color = 'cobre', tam = 'md' }: { simbolo: string; numero?: number; color?: string; tam?: 'sm' | 'md' | 'lg' }) {
  const t = { sm: 'h-10 w-10 text-base', md: 'h-14 w-14 text-xl', lg: 'h-20 w-20 text-3xl' }[tam];
  const c = COLOR_MISION[color] ?? COLOR_MISION.estados;
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-tinta font-display font-bold text-white shadow-ficha ${c.fondo} ${t}`} aria-hidden>
      {numero !== undefined && <span className="absolute left-1 top-0.5 font-mono text-[10px] font-normal opacity-90">{numero}</span>}
      {simbolo}
    </span>
  );
}

/** Rango del estudiante según su XP. */
export function rangoPorXp(xp: number): { nombre: string; siguiente: number | null; base: number } {
  const rangos: Array<[number, string]> = [[0, 'Aprendiz de laboratorio'], [300, 'Ayudante de laboratorio'], [800, 'Experimentador'], [1500, 'Químico junior'], [2500, 'Investigador']];
  let i = 0;
  while (i < rangos.length - 1 && xp >= rangos[i + 1][0]) i++;
  return { nombre: rangos[i][1], base: rangos[i][0], siguiente: rangos[i + 1]?.[0] ?? null };
}
