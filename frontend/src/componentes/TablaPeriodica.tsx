import { Lock } from 'lucide-react';
import type { Mision, Nivel, ProgresoNivel } from '../data/tipos';
import { COLOR_MISION, Estrellas } from './ui';

/** Símbolos por número atómico (1–118). */
const SIMBOLOS = (
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr ' +
  'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu ' +
  'Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr ' +
  'Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'
).split(' ');

/** Posición (fila, columna) de cada elemento en la tabla principal (sin el bloque f). */
function posiciones(): Array<{ z: number; simbolo: string; fila: number; col: number }> {
  const out: Array<{ z: number; simbolo: string; fila: number; col: number }> = [];
  const add = (z: number, fila: number, col: number) => out.push({ z, simbolo: SIMBOLOS[z - 1], fila, col });
  add(1, 1, 1); add(2, 1, 18);
  for (const [base, fila] of [[3, 2], [11, 3]] as const) {
    add(base, fila, 1); add(base + 1, fila, 2);
    for (let k = 0; k < 6; k++) add(base + 2 + k, fila, 13 + k);
  }
  for (const [base, fila] of [[19, 4], [37, 5]] as const) for (let k = 0; k < 18; k++) add(base + k, fila, k + 1);
  for (const [base, fila, f] of [[55, 6, 72], [87, 7, 104]] as const) {
    add(base, fila, 1); add(base + 1, fila, 2); add(base + 2, fila, 3);
    for (let k = 0; k < 15; k++) add(f + k, fila, 4 + k);
  }
  return out;
}
const CASILLAS = posiciones();

interface Props {
  niveles: Nivel[];
  misiones: Mision[];
  progreso: ProgresoNivel[];
  seleccionado: string | null;
  onSeleccionar: (codigo: string) => void;
}

/**
 * Mapa de misiones: la tabla periódica completa como tablero.
 * Las casillas que son niveles son botones; el resto es decoración (aria-hidden).
 */
export function TablaPeriodica({ niveles, misiones, progreso, seleccionado, onSeleccionar }: Props) {
  const porCasilla = new Map(niveles.map((n) => [`${n.casilla.fila}-${n.casilla.columna}`, n]));
  const prog = new Map(progreso.map((p) => [p.nivel, p]));
  const misionDe = new Map(misiones.map((m) => [m.codigo, m]));
  const siguiente = niveles.find((n) => prog.get(n.codigo)?.desbloqueado && !prog.get(n.codigo)?.completado)?.codigo;

  return (
    <div className="grid gap-[3px] lg:gap-1" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
      {CASILLAS.map(({ z, simbolo, fila, col }) => {
        const n = porCasilla.get(`${fila}-${col}`);
        const pos = { gridRow: fila, gridColumn: col };
        if (!n) {
          return (
            <div key={z} style={pos} aria-hidden data-decorativo className="relative aspect-square rounded-[5px] border border-linea bg-superficie/60">
              <span className="absolute inset-0 flex items-center justify-center font-display text-[clamp(7px,1vw,13px)] text-tinta-suave/45">{simbolo}</span>
            </div>
          );
        }
        const p = prog.get(n.codigo);
        const color = COLOR_MISION[misionDe.get(n.mision)?.color ?? 'estados'];
        const bloqueado = p ? !p.desbloqueado : n.orden > 1;
        const completo = p?.completado;
        const sel = seleccionado === n.codigo;
        const etiqueta = `Nivel ${n.orden}, ${n.titulo}, casilla ${simbolo}. ${bloqueado ? 'Bloqueado' : completo ? `Completado con ${p?.estrellas} estrellas` : 'Disponible'}`;
        return (
          <button
            key={z}
            type="button"
            style={pos}
            onClick={() => onSeleccionar(n.codigo)}
            aria-label={etiqueta}
            aria-pressed={sel}
            className={[
              'group relative aspect-square rounded-md border-2 border-tinta text-left transition-transform duration-100 active:translate-y-[2px]',
              completo ? `${color.fondo} text-white` : bloqueado ? 'bg-superficie text-tinta-suave' : 'bg-superficie text-tinta',
              sel ? 'z-10 scale-[1.18] shadow-ficha ring-4 ring-sodio' : 'shadow-[0_2px_0_0_rgb(var(--tinta)/0.85)]',
            ].join(' ')}
          >
            {!completo && <span className={`absolute inset-x-0 bottom-0 h-1/4 rounded-b-[4px] ${color.fondo} ${bloqueado ? 'opacity-45' : ''}`} aria-hidden />}
            {bloqueado && (
              <span aria-hidden className="absolute inset-0 rounded-[4px] opacity-40"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgb(var(--linea)) 0 3px, transparent 3px 7px)' }} />
            )}
            <span className="absolute left-[8%] top-[4%] font-mono text-[clamp(6px,0.8vw,11px)] leading-none" aria-hidden>{z}</span>
            <span className="absolute inset-0 flex items-center justify-center font-display text-[clamp(10px,1.6vw,22px)] font-bold leading-none" aria-hidden>
              {simbolo}
            </span>
            {bloqueado && <Lock className="absolute right-[6%] top-[6%] h-[22%] w-[22%]" aria-hidden />}
            {completo && p && (
              <span className="absolute inset-x-0 bottom-[4%] hidden justify-center lg:flex" aria-hidden>
                <Estrellas n={p.estrellas} tam={9} />
              </span>
            )}
            {siguiente === n.codigo && (
              <span className="absolute -right-1 -top-2 rounded bg-sodio px-1 font-display text-[9px] font-bold text-[#13233A]" aria-hidden>
                {n.orden}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
