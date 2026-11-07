import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ClienteArc, ErrorApi, type TipoEvento } from './api.js';
import {
  buscarEspecies, buscarReacciones, explicarReaccion, fichaEspecie, formatoQuimi, listarNiveles, resumenDashboard,
} from './herramientas.js';

export const VERSION = '2.0.0';

export interface OpcionesServidor {
  cliente: ClienteArc;
  /** Enviar eventos de uso con origen `mcp` (por defecto true; ARC_TELEMETRIA=0 lo desactiva). */
  telemetria?: boolean;
}

type Resultado = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };
const texto = (t: string): Resultado => ({ content: [{ type: 'text', text: t }] });
const error = (t: string): Resultado => ({ content: [{ type: 'text', text: t }], isError: true });

/**
 * Crea el servidor MCP de AtomReactChamber con sus herramientas y recursos.
 * No conecta ningún transporte: `index.ts` usa stdio y las pruebas usan memoria.
 */
export function crearServidor({ cliente, telemetria = true }: OpcionesServidor): McpServer {
  const server = new McpServer(
    { name: 'atomreactchamber', title: 'AtomReactChamber', version: VERSION },
    {
      instructions:
        'Herramientas del laboratorio virtual de química AtomReactChamber (secundaria, Perú). ' +
        'Usa buscar_especie y explicar_reaccion para datos del catálogo (ΔH, Eₐ, PubChem), listar_niveles para las misiones, ' +
        'preguntar_quimi para el glosario y resumen_dashboard (requiere ARC_TOKEN docente) para métricas. Responde en español.',
    },
  );
  const sesion = randomUUID();

  /** Registra uso (origen mcp) sin bloquear ni fallar la herramienta. */
  const registrar = (tipo: TipoEvento, datos: Record<string, unknown>): void => {
    if (!telemetria) return;
    cliente.eventos(sesion, [{ tipo, datos }]).catch(() => undefined);
  };

  /** Envuelve una herramienta para convertir errores de la API en resultados `isError`. */
  const seguro =
    <A>(nombre: string, fn: (args: A) => Promise<Resultado>) =>
    async (args: A): Promise<Resultado> => {
      try {
        return await fn(args);
      } catch (e) {
        const msg = e instanceof ErrorApi ? e.message : `Error inesperado: ${(e as Error).message}`;
        return error(`[${nombre}] ${msg}`);
      }
    };

  server.registerTool(
    'buscar_especie',
    {
      title: 'Buscar especie química',
      description:
        'Busca una especie del catálogo por fórmula (H2O, H₂O), código o nombre (agua, cloruro de sodio). ' +
        'Devuelve masa molar, ΔH° de formación, puntos de fusión/ebullición, si es radical, enlace a PubChem y reacciones donde participa.',
      inputSchema: { consulta: z.string().min(1).max(80).describe('Fórmula, código o nombre de la especie') },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    seguro('buscar_especie', async ({ consulta }: { consulta: string }) => {
      const cat = await cliente.catalogo();
      const res = buscarEspecies(cat, consulta).slice(0, 5);
      registrar('pagina_vista', { vista: 'mcp:buscar_especie', consulta, resultados: res.length });
      if (!res.length) {
        return texto(`No encontré «${consulta}». Especies disponibles: ${cat.especies.map((e) => `${e.formula} (${e.nombre})`).join(', ')}.`);
      }
      return texto(res.map((e) => fichaEspecie(e, cat)).join('\n\n'));
    }),
  );

  server.registerTool(
    'explicar_reaccion',
    {
      title: 'Explicar reacción',
      description:
        'Explica una reacción del catálogo: ecuación, tipo (exotérmica/endotérmica), energía de activación Eₐ, ΔH y un perfil de energía. ' +
        'Acepta el código (p. ej. "co2"), la ecuación o las especies involucradas ("H2 + O2", "sodio").',
      inputSchema: { consulta: z.string().min(1).max(120).describe('Código, ecuación o especies de la reacción') },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    seguro('explicar_reaccion', async ({ consulta }: { consulta: string }) => {
      const cat = await cliente.catalogo();
      const res = buscarReacciones(cat, consulta).slice(0, 3);
      registrar('reaccion_observada', { vista: 'mcp:explicar_reaccion', consulta, reacciones: res.map((r) => r.codigo) });
      if (!res.length) {
        return texto(`No encontré una reacción para «${consulta}». Reacciones disponibles:\n${cat.reacciones.map((r) => `- \`${r.codigo}\`: ${r.ecuacion}`).join('\n')}`);
      }
      return texto(res.map((r) => explicarReaccion(r, cat)).join('\n\n---\n\n'));
    }),
  );

  server.registerTool(
    'listar_niveles',
    {
      title: 'Listar niveles',
      description: 'Lista misiones y niveles del juego (grado de secundaria, XP, minutos, objetivo y pasos). Filtros opcionales por grado (1–5) y misión.',
      inputSchema: {
        grado: z.number().int().min(1).max(5).optional().describe('Grado de secundaria (1–5)'),
        mision: z.string().max(60).optional().describe('Código o título de la misión'),
        detalle: z.boolean().optional().describe('Incluir instrucción y concepto de cada paso'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    seguro('listar_niveles', async (args: { grado?: number; mision?: string; detalle?: boolean }) => {
      const j = await cliente.juego();
      registrar('pagina_vista', { vista: 'mcp:listar_niveles', ...args });
      return texto(listarNiveles(j, args));
    }),
  );

  server.registerTool(
    'preguntar_quimi',
    {
      title: 'Preguntar a Quimi',
      description:
        'Consulta al asistente Quimi (glosario de química con búsqueda de texto completo en PostgreSQL). ' +
        'Opcionalmente indica el nivel y paso actuales para añadir el concepto del paso.',
      inputSchema: {
        pregunta: z.string().min(2).max(200).describe('Duda del estudiante, p. ej. "¿qué es un mol?"'),
        nivel: z.string().max(30).optional().describe('Código del nivel, p. ej. n04-hidrogeno'),
        paso: z.number().int().min(1).optional().describe('Orden del paso dentro del nivel'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    seguro('preguntar_quimi', async ({ pregunta, nivel, paso }: { pregunta: string; nivel?: string; paso?: number }) => {
      const r = await cliente.quimi(pregunta, nivel, paso);
      registrar('quimi_consulta', { consulta: pregunta, terminos: r.terminos.length, via: 'mcp' });
      return texto(formatoQuimi(r));
    }),
  );

  server.registerTool(
    'resumen_dashboard',
    {
      title: 'Resumen del dashboard docente',
      description:
        'Resume las métricas de utilización (KPIs, uso por integración/origen, pasos lentos, preguntas con más error, niveles). ' +
        'Requiere la variable de entorno ARC_TOKEN con el JWT de una cuenta docente o admin.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    seguro('resumen_dashboard', async () => {
      if (!cliente.tieneToken) {
        return error('resumen_dashboard requiere ARC_TOKEN. Obtén uno con POST /api/auth/login (cuenta docente) y reinicia el servidor MCP con ARC_TOKEN=<jwt>.');
      }
      const d = await cliente.dashboard();
      registrar('pagina_vista', { vista: 'mcp:resumen_dashboard' });
      return texto(resumenDashboard(d));
    }),
  );

  server.registerResource(
    'catalogo',
    'arc://catalogo',
    {
      title: 'Catálogo químico de AtomReactChamber',
      description: 'Elementos, especies (ΔHf, PubChem CID), reacciones (Eₐ, ΔH, ecuación), fotólisis y presets, en JSON.',
      mimeType: 'application/json',
    },
    async (uri) => {
      const cat = await cliente.catalogo();
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(cat, null, 2) }] };
    },
  );

  return server;
}
