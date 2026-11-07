/** Tipos del contenido del juego y de las respuestas de la API. */
import type { Catalogo, Parametros } from '../engine/chemistry';
import type { Condicion } from '../engine/conditions';

export type Rol = 'estudiante' | 'docente' | 'admin';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  grado: number | null;
  xp: number;
  racha: number;
}

export interface Mision {
  codigo: string;
  titulo: string;
  descripcion: string;
  competencia: string;
  color: 'estados' | 'combustion' | 'familias' | 'luz';
  orden: number;
}

export interface Paso {
  orden: number;
  titulo: string;
  instruccion: string;
  concepto: string;
  condicion: Condicion;
  ayudas: number;
}

export interface Pregunta {
  orden: number;
  enunciado: string;
  opciones: Array<{ orden: number; texto: string }>;
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
  casilla: { simbolo: string; fila: number; columna: number };
  casilla_nota: string;
  inicio: { parametros: Parametros; carga: Record<string, number> };
  controles: string[];
  especies: string[];
  pasos: Paso[];
  cuestionario: Pregunta[];
}

export interface Insignia {
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  tipo?: string;
  umbral?: number;
  obtenido_en?: string;
}

export interface Juego {
  misiones: Mision[];
  niveles: Nivel[];
  insignias: Insignia[];
  costos_pista: Record<string, number>;
}

export interface ProgresoNivel {
  nivel: string;
  completado: boolean;
  estrellas: number;
  intentos: number;
  desbloqueado: boolean;
}

export interface ResultadoIntento {
  estrellas: number;
  xp_obtenido: number;
  xp_total: number;
  racha: number;
  es_repeticion: boolean;
  insignias_nuevas: Insignia[];
}

export interface Perfil {
  usuario: Usuario;
  resumen: { xp: number; racha: number; racha_maxima: number; niveles_completados: number; estrellas_totales: number };
  insignias: Insignia[];
  historial: Array<{ nivel: string; titulo: string; estado: string; estrellas: number | null; xp_obtenido: number | null; pistas_usadas: number; iniciado_en: string }>;
}

export interface RespuestaQuimi {
  mensaje: string;
  terminos: Array<{ termino: string; definicion: string; relevancia: number }>;
  concepto?: string;
}

export interface Aula {
  id: number;
  codigo: string;
  nombre: string;
  grado: number;
  seccion: string;
  estudiantes?: number;
  docente?: string;
}

export interface DetalleAula {
  aula: Aula;
  ranking: Array<{ puesto: number; usuario_id: number; nombre: string; xp: number; estrellas_totales: number; niveles_completados: number }>;
  asignados: Array<{ codigo: string; titulo: string; fecha_limite: string | null }>;
  matriz: Array<{ usuario_id: number; nivel: string; estrellas: number; intentos: number; pistas: number }>;
}

export interface Dashboard {
  kpis: Record<string, number | null>;
  usoDiario: Array<{ dia: string; sesiones: number; usuarios_activos: number; eventos: number; niveles_completados: number; pistas_usadas: number }>;
  niveles: Array<{ codigo: string; titulo: string; orden: number; intentos: number; completados: number; tasa_completado: number | null; estrellas_promedio: number | null; pistas_promedio: number | null; minutos_promedio: number | null }>;
  pasosLentos: Array<{ nivel_codigo: string; orden: number; titulo: string; veces: number; segundos_promedio: number }>;
  preguntas: Array<{ nivel_codigo: string; enunciado: string; respuestas: number; porcentaje_error: number }>;
  origen: Array<{ origen: string; sesiones: number }>;
  dispositivo: Array<{ dispositivo: string; sesiones: number }>;
  insignias: Array<{ nombre: string; otorgadas: number }>;
}

/** Contrato común de las fuentes de datos (API remota o modo demo local). */
export interface Fuente {
  readonly modo: 'api' | 'demo';
  catalogo(): Promise<Catalogo>;
  juego(): Promise<Juego>;
  login(email: string, password: string): Promise<{ usuario: Usuario; token: string }>;
  registro(datos: { nombre: string; email: string; password: string; rol: Rol; grado?: number; codigoDocente?: string }): Promise<{ usuario: Usuario; token: string }>;
  yo(): Promise<Usuario>;
  progreso(): Promise<ProgresoNivel[]>;
  perfil(): Promise<Perfil>;
  iniciar(nivel: string): Promise<{ intento: number }>;
  completarPaso(intento: number, orden: number, segundos: number): Promise<void>;
  pedirAyuda(intento: number, orden: number, nivelAyuda: number): Promise<{ texto: string; costoXp: number; yaUsada: boolean }>;
  responder(intento: number, pregunta: number, opcion: number): Promise<{ correcta: boolean; explicacion: string; opcionCorrecta: number }>;
  finalizar(intento: number): Promise<ResultadoIntento>;
  quimi(q: string, nivel?: string, paso?: number): Promise<RespuestaQuimi>;
  aulas(): Promise<Aula[]>;
  crearAula(nombre: string, grado: number): Promise<Aula>;
  unirse(codigo: string): Promise<{ nombre: string }>;
  detalleAula(id: number): Promise<DetalleAula>;
  dashboard(): Promise<Dashboard>;
  eventos(lote: { sesion: string; dispositivo: string; eventos: Array<{ tipo: string; nivel?: string; datos?: Record<string, unknown> }> }): Promise<void>;
}
