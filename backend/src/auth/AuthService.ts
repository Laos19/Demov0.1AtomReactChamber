import bcrypt from 'bcryptjs';
import type { Database } from '../db/Database.js';
import { HttpError } from '../errors.js';
import type { LoginBody, RegistroBody } from '../schemas.js';

/** Roles soportados por la aplicación. */
export type Rol = 'estudiante' | 'docente' | 'admin';

/** Datos públicos de un usuario (nunca incluye el hash). */
export interface UsuarioPublico {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  grado: number | null;
  xp: number;
  racha: number;
}

/** Contenido del JWT. */
export interface TokenPayload {
  sub: number;
  rol: Rol;
  nombre: string;
}

/**
 * Registro, inicio de sesión y consulta del usuario autenticado.
 * Las contraseñas se guardan con bcrypt (costo 10); el JWT lo firma Fastify.
 */
export class AuthService {
  /** Costo de bcrypt (2^10 iteraciones). */
  static readonly BCRYPT_COSTO = 10;

  /**
   * @param db Acceso a datos.
   * @param codigoDocente Código de invitación requerido para registrarse como docente.
   */
  constructor(
    private readonly db: Database,
    private readonly codigoDocente: string,
  ) {}

  /**
   * Crea una cuenta nueva.
   * @param body Datos validados del formulario.
   * @returns Usuario creado.
   * @throws HttpError 403 si pide rol docente sin el código correcto; 409 si el correo ya existe.
   */
  async registrar(body: RegistroBody): Promise<UsuarioPublico> {
    if (body.rol === 'docente' && body.codigoDocente !== this.codigoDocente) {
      throw new HttpError(403, 'Código de docente incorrecto', 'CODIGO_DOCENTE');
    }
    const hash = await bcrypt.hash(body.password, AuthService.BCRYPT_COSTO);
    const [u] = await this.db.query<{ id: number }>(
      `INSERT INTO usuario (email, nombre, password_hash, rol_id, grado)
       VALUES ($1, $2, $3, (SELECT id FROM rol WHERE codigo = $4), $5)
       RETURNING id`,
      [body.email, body.nombre, hash, body.rol, body.rol === 'estudiante' ? (body.grado ?? null) : null],
    );
    return this.obtener(u.id);
  }

  /**
   * Verifica credenciales.
   * @returns Usuario si la contraseña coincide.
   * @throws HttpError 401 con mensaje genérico (no revela si el correo existe).
   */
  async login(body: LoginBody): Promise<UsuarioPublico> {
    const [row] = await this.db.query<{ id: number; password_hash: string; activo: boolean }>(
      'SELECT id, password_hash, activo FROM usuario WHERE lower(email) = lower($1)',
      [body.email],
    );
    const ok = row && row.activo && (await bcrypt.compare(body.password, row.password_hash));
    if (!ok) throw new HttpError(401, 'Correo o contraseña incorrectos', 'CREDENCIALES');
    return this.obtener(row.id);
  }

  /**
   * Obtiene los datos públicos de un usuario.
   * @param id Identificador del usuario.
   */
  async obtener(id: number): Promise<UsuarioPublico> {
    const [u] = await this.db.query<UsuarioPublico>(
      `SELECT u.id, u.nombre, u.email, r.codigo AS rol, u.grado, u.xp, u.racha_actual AS racha
         FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = $1`,
      [id],
    );
    if (!u) throw new HttpError(404, 'Usuario no encontrado', 'NO_ENCONTRADO');
    return u;
  }

  /** Construye el contenido del JWT a partir del usuario. */
  static payload(u: UsuarioPublico): TokenPayload {
    return { sub: u.id, rol: u.rol, nombre: u.nombre };
  }
}
