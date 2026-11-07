import type { Catalogo, Dashboard, Juego } from '../src/api.js';

export const catalogo: Catalogo = {
  elementos: [{ simbolo: 'H', nombre: 'Hidrógeno', numero_atomico: 1 }],
  especies: [
    { codigo: 'H2', formula: 'H₂', nombre: 'Hidrógeno', masa_molar: 2.016, dhf: 0, pf: 14, pe: 20.3, cid: 783, radical: false },
    { codigo: 'O2', formula: 'O₂', nombre: 'Oxígeno', masa_molar: 31.998, dhf: 0, pf: 54.4, pe: 90.2, cid: 977, radical: false },
    { codigo: 'H2O', formula: 'H₂O', nombre: 'Agua', masa_molar: 18.015, dhf: -241.8, pf: 273.15, pe: 373.15, cid: 962, radical: false },
    { codigo: 'O', formula: 'O·', nombre: 'Oxígeno atómico (radical)', masa_molar: 15.999, dhf: 249.2, pf: null, pe: null, cid: 159832, radical: true },
    { codigo: 'NaCl', formula: 'NaCl', nombre: 'Cloruro de sodio', masa_molar: 58.44, dhf: -411.2, pf: 1074, pe: 1686, cid: 5234, radical: false },
  ],
  reacciones: [
    { codigo: 'h2o2', etiqueta: 'Iniciación térmica', ea: 34, dh: 7.4, ecuacion: 'H₂ + O₂ → H₂O + O·', reactivos: ['H2', 'O2'], productos: ['H2O', 'O'] },
    { codigo: 'oh2', etiqueta: 'Propagación', ea: 10, dh: -491, ecuacion: 'O· + H₂ → H₂O', reactivos: ['O', 'H2'], productos: ['H2O'] },
    { codigo: 'oo', etiqueta: 'Recombinación radicalaria', ea: 0, dh: -498.4, ecuacion: 'O· + O· → O₂', reactivos: ['O', 'O'], productos: ['O2'] },
  ],
  fotolisis: [],
  presets: [],
};

export const juego: Juego = {
  misiones: [
    { codigo: 'estados', titulo: 'La materia y sus estados', descripcion: 'Partículas en movimiento.', orden: 1 },
    { codigo: 'reacciones', titulo: 'Reacciones químicas', descripcion: 'Energía y cambio.', orden: 2 },
  ],
  niveles: [
    { codigo: 'n01-movimiento', mision: 'estados', orden: 1, titulo: 'Moléculas en movimiento', resumen: 'r', objetivo: 'Relacionar T con energía cinética', grado: 1, xp: 100, minutos: 8,
      pasos: [{ orden: 1, titulo: 'Agrega moléculas', instruccion: 'Inyecta H₂', concepto: 'Una molécula…' }] },
    { codigo: 'n04-hidrogeno', mision: 'reacciones', orden: 4, titulo: 'Hidrógeno explosivo', resumen: 'r', objetivo: 'Reconocer reacción exotérmica', grado: 3, xp: 150, minutos: 12,
      pasos: [{ orden: 1, titulo: 'Mezcla', instruccion: 'Carga H₂ y O₂', concepto: 'Reactivos' }, { orden: 2, titulo: 'Chispa', instruccion: 'Pulsa chispa', concepto: 'Eₐ' }] },
  ],
};

export const dashboard: Dashboard = {
  kpis: { estudiantes: 13, aulas: 1, sesiones_7d: 4, activos_7d: 2, niveles_completados: 65, tasa_completado: 89, aciertos_cuestionario: 81.5, pistas_por_nivel: 0.71 },
  usoDiario: [{ dia: '2026-11-01', eventos: 10 }, { dia: '2026-11-02', eventos: 5 }],
  niveles: [{ codigo: 'n01-movimiento', titulo: 'Moléculas en movimiento', intentos: 12, completados: 12, tasa_completado: 100, estrellas_promedio: 2.75, pistas_promedio: 0.75, minutos_promedio: 8.7 }],
  pasosLentos: [{ nivel_codigo: 'n04-hidrogeno', orden: 4, titulo: 'Produce agua', veces: 10, segundos_promedio: 218.8 }],
  preguntas: [{ nivel_codigo: 'n05-carbono', enunciado: 'El CO₂ es un gas que…', respuestas: 9, porcentaje_error: 66.7 }],
  origen: [{ origen: 'web', sesiones: 54 }, { origen: 'vscode', sesiones: 7 }, { origen: 'mcp', sesiones: 3 }],
  dispositivo: [],
  insignias: [],
};
