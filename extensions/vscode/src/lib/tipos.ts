/** Tipos del contrato público de la API de AtomReactChamber (backend/src/routes/index.ts). */

export interface Especie {
  codigo: string;
  formula: string;
  nombre: string;
  masa_molar: number;
  /** Entalpía de formación estándar, kJ/mol. */
  dhf: number;
  /** Punto de fusión, K. */
  pf: number | null;
  /** Punto de ebullición, K. */
  pe: number | null;
  dhvap?: number | null;
  /** Identificador de PubChem. */
  cid: number | null;
  radical: boolean;
  inyectable?: boolean;
  sublimacion?: number | null;
  atomos?: Array<[string, number, number]>;
}

export interface Reaccion {
  codigo: string;
  etiqueta: string;
  /** Energía de activación, kJ/mol. */
  ea: number;
  esterico?: number;
  enlace?: string;
  /** Entalpía de reacción, kJ/mol. */
  dh: number;
  ecuacion: string;
  reactivos: string[];
  productos: string[];
}

export interface Elemento {
  simbolo: string;
  nombre: string;
  numero_atomico: number;
}

export interface Catalogo {
  elementos: Elemento[];
  especies: Especie[];
  reacciones: Reaccion[];
  fotolisis: unknown[];
  presets: Array<{ codigo: string; nombre: string; ecuacion: string; etiqueta: string }>;
}

export interface Paso {
  orden: number;
  titulo: string;
  instruccion: string;
  concepto: string;
  ayudas?: number;
}

export interface Nivel {
  codigo: string;
  mision: string;
  orden: number;
  titulo: string;
  resumen: string;
  objetivo: string;
  grado: number;
  xp: number;
  minutos: number;
  pasos: Paso[];
  cuestionario?: Array<{ enunciado: string; opciones?: unknown[] }>;
}

export interface Mision {
  codigo: string;
  titulo: string;
  descripcion: string;
  competencia?: string;
  orden: number;
}

export interface Juego {
  misiones: Mision[];
  niveles: Nivel[];
}

export interface ProgresoNivel {
  nivel: string;
  completado: boolean;
  estrellas: number;
  intentos: number;
  desbloqueado: boolean;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'estudiante' | 'docente' | 'admin';
  grado?: number | null;
  xp: number;
  racha: number;
}

export interface Perfil {
  usuario: Usuario;
  resumen: {
    xp: number;
    racha: number;
    racha_maxima: number;
    niveles_completados: number;
    estrellas_totales: number;
  };
  insignias: Array<{ nombre?: string; codigo?: string; descripcion?: string; obtenida?: string }>;
  historial: unknown[];
}

export interface RespuestaQuimi {
  mensaje: string;
  terminos: Array<{ termino: string; definicion: string; relevancia: number }>;
  concepto?: string;
}

export interface Salud {
  estado: 'ok' | 'degradado';
  db: string;
  version: string;
  hora: string;
}

export type TipoEvento =
  | 'pagina_vista' | 'nivel_iniciado' | 'paso_completado' | 'pista_usada' | 'nivel_completado'
  | 'cuestionario_respondido' | 'preset_cargado' | 'chispa' | 'reaccion_observada' | 'quimi_consulta'
  | 'insignia_obtenida' | 'error_cliente';
