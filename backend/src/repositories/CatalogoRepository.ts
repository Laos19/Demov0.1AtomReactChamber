import type { Database } from '../db/Database.js';

/** Catálogo químico con la misma forma que db/data/catalogo.json (lo consume el motor del frontend). */
export interface Catalogo {
  elementos: Array<{ simbolo: string; nombre: string; numero_atomico: number; color: string; brillo: string; radio_px: number }>;
  especies: Array<Record<string, unknown>>;
  reacciones: Array<Record<string, unknown>>;
  fotolisis: Array<Record<string, unknown>>;
  presets: Array<Record<string, unknown>>;
}

/**
 * Lectura del catálogo químico. Arma JSON directamente en PostgreSQL (json_agg)
 * para hacer una sola ida y vuelta por colección.
 */
export class CatalogoRepository {
  /** Caché en memoria: el catálogo cambia solo con una migración (redeploy). */
  private cache: { valor: Catalogo; expira: number } | null = null;

  constructor(private readonly db: Database) {}

  /**
   * Devuelve el catálogo completo.
   * @param ttlMs Tiempo de vida de la caché en milisegundos.
   */
  async obtener(ttlMs = 5 * 60_000): Promise<Catalogo> {
    if (this.cache && this.cache.expira > Date.now()) return this.cache.valor;
    const [elementos, especies, reacciones, fotolisis, presets] = await Promise.all([
      this.db.query(`SELECT simbolo, nombre, numero_atomico, color_hex AS color, brillo_hex AS brillo, radio_px
                       FROM elemento ORDER BY numero_atomico`),
      this.db.query(`SELECT e.codigo, e.formula, e.nombre, e.masa_molar, e.dhf_kj_mol AS dhf, e.punto_fusion_k AS pf,
                            e.punto_ebull_k AS pe, e.dhvap_kj_mol AS dhvap, e.pubchem_cid AS cid, e.es_radical AS radical,
                            e.inyectable,
                            CASE WHEN e.p_triple_atm IS NULL THEN NULL ELSE json_build_object(
                              'p_triple_atm', e.p_triple_atm, 't_triple_k', e.t_triple_k, 'dhvap_triple', e.dhvap_triple) END AS sublimacion,
                            (SELECT json_agg(json_build_array(a.simbolo, a.x, a.y) ORDER BY a.posicion)
                               FROM especie_atomo a WHERE a.especie_codigo = e.codigo) AS atomos
                       FROM especie e ORDER BY e.orden`),
      this.db.query(`SELECT r.codigo, r.etiqueta, r.ea_kj_mol AS ea, r.factor_esterico AS esterico, r.enlace,
                            v.delta_h_kj_mol AS dh, v.ecuacion,
                            (SELECT json_agg(especie_codigo ORDER BY posicion) FROM reaccion_participante
                              WHERE reaccion_codigo = r.codigo AND papel = 'reactivo') AS reactivos,
                            (SELECT json_agg(especie_codigo ORDER BY posicion) FROM reaccion_participante
                              WHERE reaccion_codigo = r.codigo AND papel = 'producto') AS productos
                       FROM reaccion r JOIN v_reaccion_entalpia v ON v.codigo = r.codigo ORDER BY r.codigo`),
      this.db.query(`SELECT especie_codigo AS especie, enlace_kj_mol AS enlace_kj, seccion_eficaz, etiqueta,
                            json_build_array(producto_1, producto_2) AS productos
                       FROM fotolisis ORDER BY especie_codigo`),
      this.db.query(`SELECT p.codigo, p.nombre, p.ecuacion, p.sobre_flecha, p.etiqueta, p.pista, p.parametros, p.pasos,
                            coalesce((SELECT json_object_agg(especie_codigo, cantidad) FROM preset_carga
                                       WHERE preset_codigo = p.codigo), '{}'::json) AS carga
                       FROM preset p ORDER BY p.orden`),
    ]);
    const valor = { elementos, especies, reacciones, fotolisis, presets } as Catalogo;
    this.cache = { valor, expira: Date.now() + ttlMs };
    return valor;
  }
}
