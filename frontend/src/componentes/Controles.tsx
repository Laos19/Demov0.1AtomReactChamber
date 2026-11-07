import { useId, useState } from 'react';
import { Box, Gauge, Plus, Sun, Thermometer, Waves, Zap, type LucideIcon } from 'lucide-react';
import type { Parametros, Quimica } from '../engine/chemistry';

/** Control deslizante etiquetado y accesible. */
function Deslizador({
  icono: Icono, etiqueta, valor, min, max, paso, onChange, mostrar, ayuda,
}: {
  icono: LucideIcon; etiqueta: string; valor: number; min: number; max: number; paso: number;
  onChange: (v: number) => void; mostrar: string; ayuda?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-[15px] font-bold">
          <Icono size={16} aria-hidden className="text-tinta-suave" />
          {etiqueta}
        </label>
        <output htmlFor={id} className="lectura text-[15px]">{mostrar}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        aria-valuetext={mostrar}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {ayuda && <p className="text-[13px] leading-snug text-tinta-suave">{ayuda}</p>}
    </div>
  );
}

const logP = (P: number) => Math.log10(P);
const expP = (x: number) => Math.round(10 ** x * 10) / 10;

/**
 * Panel de controles de la cámara. Solo muestra los controles habilitados por el nivel.
 */
export function Controles({
  quimica, params, onParams, permitidos, especies, onInyectar, onChispa,
}: {
  quimica: Quimica;
  params: Parametros;
  onParams: (p: Parametros) => void;
  permitidos: string[];
  especies: string[];
  onInyectar: (sp: string, n: number) => void;
  onChispa: () => void;
}) {
  const [sp, setSp] = useState(especies[0] ?? '');
  const [cant, setCant] = useState(20);
  const set = (k: keyof Parametros) => (v: number) => onParams({ ...params, [k]: v });
  const tiene = (c: string) => permitidos.includes(c);
  const idSp = useId();
  const idCant = useId();
  const celsius = Math.round(params.T - 273.15);

  return (
    <div className="space-y-4">
      {tiene('T') && (
        <Deslizador icono={Thermometer} etiqueta="Temperatura" valor={params.T} min={0} max={3000} paso={5} onChange={set('T')}
          mostrar={`${params.T} K`} ayuda={`${celsius} °C · K = °C + 273`} />
      )}
      {tiene('P') && (
        <Deslizador icono={Gauge} etiqueta="Presión" valor={logP(params.P)} min={-1} max={2} paso={0.01}
          onChange={(x) => set('P')(expP(x))} mostrar={`${params.P} atm`} ayuda="1 atm = presión del aire a nivel del mar" />
      )}
      {tiene('V') && (
        <Deslizador icono={Box} etiqueta="Volumen" valor={params.V} min={1} max={50} paso={1} onChange={set('V')} mostrar={`${params.V} L`} />
      )}
      {tiene('UV') && (
        <Deslizador icono={Sun} etiqueta="Luz UV" valor={params.UV} min={0} max={1000} paso={10} onChange={set('UV')}
          mostrar={`${params.UV} W/m²`} ayuda={params.UV === 0 ? 'Lámpara apagada' : 'Más intensidad = más fotones'} />
      )}
      {tiene('lambda') && (
        <Deslizador icono={Waves} etiqueta="Longitud de onda" valor={params.lambda} min={100} max={400} paso={5} onChange={set('lambda')}
          mostrar={`${params.lambda} nm`} ayuda={`Cada fotón: ${Math.round(119627 / params.lambda)} kJ/mol`} />
      )}

      {tiene('inyectar') && especies.length > 0 && (
        <fieldset className="space-y-2 rounded-lg border-2 border-linea p-3">
          <legend className="px-1 text-[15px] font-bold">Inyector</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={idSp}>
            <span id={idSp} className="sr-only">Especie a inyectar</span>
            {especies.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={sp === k}
                onClick={() => setSp(k)}
                className={`min-h-[44px] min-w-[52px] rounded-lg border-2 px-3 font-bold ${sp === k ? 'border-tinta bg-tinta text-papel' : 'border-linea bg-superficie'}`}
              >
                {quimica.especies[k].formula}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <label htmlFor={idCant} className="flex-1">
              <span className="etiqueta">Cantidad</span>
              <input id={idCant} type="number" min={1} max={200} value={cant} onChange={(e) => setCant(Math.max(1, Math.min(200, Number(e.target.value) || 1)))} className="campo lectura" />
            </label>
            <button type="button" className="btn btn-secundario" onClick={() => onInyectar(sp, cant)}>
              <Plus size={18} aria-hidden /> Inyectar
            </button>
          </div>
        </fieldset>
      )}

      {tiene('chispa') && (
        <button type="button" className="btn btn-sodio w-full" onClick={onChispa}>
          <Zap size={18} aria-hidden /> Chispa
        </button>
      )}
    </div>
  );
}
