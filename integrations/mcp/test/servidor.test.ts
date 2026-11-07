import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { ClienteArc } from '../src/api.js';
import { crearServidor } from '../src/servidor.js';
import { catalogo, dashboard, juego } from './fixtures.js';

/** fetch falso que responde como la API y guarda las peticiones. */
function fetchFalso() {
  const llamadas: Array<{ url: string; init?: RequestInit }> = [];
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    llamadas.push({ url, init });
    const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json' } });
    if (url.endsWith('/api/catalogo')) return json(catalogo);
    if (url.endsWith('/api/juego')) return json(juego);
    if (url.includes('/api/quimi?')) return json({ mensaje: 'Un mol es…', terminos: [{ termino: 'Mol', definicion: 'Cantidad de sustancia', relevancia: 0.9 }] });
    if (url.endsWith('/api/dashboard')) {
      const auth = new Headers(init?.headers).get('authorization');
      return auth === 'Bearer jwt-docente' ? json(dashboard) : json({ error: 'NO_AUTORIZADO', mensaje: 'Token inválido' }, 401);
    }
    if (url.endsWith('/api/eventos')) return json({ registrados: 1 }, 202);
    return json({ error: 'NO_ENCONTRADO' }, 404);
  }) as typeof fetch;
  return { impl, llamadas };
}

async function conectar(token?: string) {
  const f = fetchFalso();
  const server = crearServidor({ cliente: new ClienteArc({ baseUrl: 'http://api.test/', token, fetchImpl: f.impl }) });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'prueba', version: '1.0.0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  const texto = async (name: string, args: Record<string, unknown> = {}) => {
    const r = await client.callTool({ name, arguments: args });
    return { texto: (r.content as Array<{ text: string }>)[0].text, isError: Boolean(r.isError) };
  };
  return { client, texto, llamadas: f.llamadas };
}

describe('servidor MCP', () => {
  it('expone las 5 herramientas y el recurso arc://catalogo', async () => {
    const { client } = await conectar();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(['buscar_especie', 'explicar_reaccion', 'listar_niveles', 'preguntar_quimi', 'resumen_dashboard']);
    const { resources } = await client.listResources();
    expect(resources[0].uri).toBe('arc://catalogo');
    const r = await client.readResource({ uri: 'arc://catalogo' });
    expect(JSON.parse((r.contents[0] as { text: string }).text).especies).toHaveLength(5);
  });

  it('buscar_especie y explicar_reaccion responden con datos del catálogo', async () => {
    const { texto } = await conectar();
    expect((await texto('buscar_especie', { consulta: 'agua' })).texto).toContain('H₂O — Agua');
    const r = await texto('explicar_reaccion', { consulta: 'oh2' });
    expect(r.texto).toContain('exotérmica');
    expect(r.texto).toContain('Eₐ');
  });

  it('listar_niveles y preguntar_quimi', async () => {
    const { texto, llamadas } = await conectar();
    expect((await texto('listar_niveles', { grado: 1 })).texto).toContain('Moléculas en movimiento');
    expect((await texto('preguntar_quimi', { pregunta: '¿qué es un mol?', nivel: 'n01-movimiento', paso: 1 })).texto).toContain('**Mol**');
    expect(llamadas.some((l) => l.url.includes('nivel=n01-movimiento') && l.url.includes('paso=1'))).toBe(true);
  });

  it('envía telemetría con origen mcp', async () => {
    const { texto, llamadas } = await conectar();
    await texto('preguntar_quimi', { pregunta: 'mol' });
    await new Promise((r) => setTimeout(r, 10));
    const ev = llamadas.find((l) => l.url.endsWith('/api/eventos'));
    expect(ev).toBeDefined();
    const body = JSON.parse(String(ev!.init!.body));
    expect(body.origen).toBe('mcp');
    expect(body.eventos[0].tipo).toBe('quimi_consulta');
  });

  it('resumen_dashboard exige ARC_TOKEN y lo usa', async () => {
    expect((await (await conectar()).texto('resumen_dashboard')).isError).toBe(true);
    const ok = await (await conectar('jwt-docente')).texto('resumen_dashboard');
    expect(ok.isError).toBe(false);
    expect(ok.texto).toContain('Uso por integración');
    const malo = await (await conectar('otro')).texto('resumen_dashboard');
    expect(malo).toEqual({ isError: true, texto: '[resumen_dashboard] Token inválido' });
  });
});
