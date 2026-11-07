#!/usr/bin/env node
/**
 * Servidor MCP de AtomReactChamber (transporte stdio).
 *
 * Variables de entorno:
 * - ARC_API_URL     URL base de la API (def. http://localhost:8080)
 * - ARC_TOKEN       JWT docente para `resumen_dashboard` (opcional)
 * - ARC_TELEMETRIA  "0" para no enviar eventos de uso con origen `mcp`
 *
 * Importante: en stdio, stdout es el canal del protocolo; los registros van a stderr.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ClienteArc } from './api.js';
import { crearServidor, VERSION } from './servidor.js';

const cliente = new ClienteArc({
  baseUrl: process.env.ARC_API_URL || 'http://localhost:8080',
  token: process.env.ARC_TOKEN || undefined,
});
const server = crearServidor({ cliente, telemetria: process.env.ARC_TELEMETRIA !== '0' });

await server.connect(new StdioServerTransport());
console.error(`[atomreactchamber-mcp ${VERSION}] listo · API ${cliente.baseUrl}${cliente.tieneToken ? ' · con ARC_TOKEN' : ''}`);

const cerrar = async (): Promise<void> => {
  await server.close();
  process.exit(0);
};
process.on('SIGINT', () => void cerrar());
process.on('SIGTERM', () => void cerrar());
