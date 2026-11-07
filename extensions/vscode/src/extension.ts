import { randomUUID } from 'node:crypto';
import * as vscode from 'vscode';
import { ArbolCatalogo, ArbolMisiones } from './arboles';
import { ClienteArc, ErrorApi } from './lib/api';
import { tipoTermico } from './lib/formato';
import { crearNonce, pagina } from './lib/html';
import type { EventoUso } from './lib/telemetria';
import type { Catalogo, Juego } from './lib/tipos';
import { cuerpoEspecie, cuerpoProgreso, cuerpoQuimi, cuerpoReaccion } from './lib/vistas';

const CLAVE_TOKEN = 'atomreactchamber.token';
const SECCION = 'atomreactchamber';

/** Estado compartido de la extensión. */
class Estado {
  catalogo?: Catalogo;
  juego?: Juego;
  readonly sesion = randomUUID();
  private cola: EventoUso[] = [];
  private temporizador?: NodeJS.Timeout;

  constructor(
    readonly ctx: vscode.ExtensionContext,
    readonly api: ClienteArc,
    readonly salida: vscode.LogOutputChannel,
  ) {}

  /** Encola un evento de uso (origen `vscode`) y lo envía en lote a los 3 s. */
  registrar(evento: EventoUso): void {
    const cfg = vscode.workspace.getConfiguration(SECCION);
    if (!cfg.get<boolean>('telemetria', true) || !vscode.env.isTelemetryEnabled) return;
    this.cola.push(evento);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => void this.vaciar(), 3000);
  }

  async vaciar(): Promise<void> {
    if (!this.cola.length) return;
    const lote = this.cola.splice(0, 50);
    try {
      const n = await this.api.eventos(this.sesion, 'vscode', lote);
      this.salida.debug(`Telemetría: ${n} eventos registrados`);
    } catch (e) {
      this.salida.warn(`Telemetría no enviada: ${(e as Error).message}`);
    }
  }
}

export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
  const salida = vscode.window.createOutputChannel('AtomReactChamber', { log: true });
  const api = new ClienteArc({
    baseUrl: () => vscode.workspace.getConfiguration(SECCION).get<string>('apiUrl', 'http://localhost:8080'),
    token: () => ctx.secrets.get(CLAVE_TOKEN),
  });
  const estado = new Estado(ctx, api, salida);
  const misiones = new ArbolMisiones();
  const catalogo = new ArbolCatalogo();

  const barra = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  barra.command = 'atomreactchamber.miProgreso';
  barra.text = '$(loading~spin) ARC';
  barra.show();

  ctx.subscriptions.push(
    salida,
    barra,
    vscode.window.registerTreeDataProvider('atomreactchamber.misiones', misiones),
    vscode.window.registerTreeDataProvider('atomreactchamber.catalogo', catalogo),
  );

  /** Actualiza el ítem de la barra de estado: estado de la API y XP si hay sesión. */
  async function actualizarBarra(): Promise<void> {
    try {
      const s = await api.salud();
      let texto = `$(beaker) ARC ${s.estado === 'ok' ? '●' : '◐'}`;
      let tip = `API ${s.estado} · BD ${s.db} · v${s.version}`;
      if (await ctx.secrets.get(CLAVE_TOKEN)) {
        try {
          const p = await api.perfil();
          texto += ` ${p.resumen.xp} XP`;
          tip += `\n${p.usuario.nombre}: ${p.resumen.xp} XP · racha ${p.resumen.racha} · ${p.resumen.estrellas_totales} ★`;
        } catch (e) {
          if (e instanceof ErrorApi && e.estado === 401) await ctx.secrets.delete(CLAVE_TOKEN);
          tip += '\nSesión expirada: vuelve a iniciar sesión.';
        }
      } else {
        tip += '\nSin sesión (clic para ver tu progreso)';
      }
      barra.text = texto;
      barra.tooltip = tip;
      barra.backgroundColor = s.estado === 'ok' ? undefined : new vscode.ThemeColor('statusBarItem.warningBackground');
    } catch (e) {
      barra.text = '$(debug-disconnect) ARC sin conexión';
      barra.tooltip = (e as Error).message;
      barra.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
  }

  /** Recarga catálogo, juego y progreso desde la API. */
  async function refrescar(): Promise<void> {
    try {
      const [cat, jue] = await Promise.all([api.catalogo(), api.juego()]);
      estado.catalogo = cat;
      estado.juego = jue;
      let progreso: Awaited<ReturnType<ClienteArc['progreso']>> = [];
      if (await ctx.secrets.get(CLAVE_TOKEN)) progreso = await api.progreso().catch(() => []);
      misiones.actualizar(jue, progreso);
      catalogo.actualizar(cat);
    } catch (e) {
      const msg = `Sin conexión con la API: ${(e as Error).message}`;
      salida.error(msg);
      misiones.actualizar(undefined, [], 'No se pudo cargar (clic para reintentar)');
      catalogo.actualizar(undefined, 'No se pudo cargar (clic para reintentar)');
    }
    await actualizarBarra();
  }

  async function asegurarCatalogo(): Promise<Catalogo | undefined> {
    if (!estado.catalogo) await refrescar();
    if (!estado.catalogo) void vscode.window.showErrorMessage('AtomReactChamber: no se pudo cargar el catálogo. Revisa «atomreactchamber.apiUrl».');
    return estado.catalogo;
  }

  /** Abre (o reutiliza) un panel webview con el HTML indicado. */
  const paneles = new Map<string, vscode.WebviewPanel>();
  function mostrar(clave: string, titulo: string, cuerpo: (cspSource: string) => string): void {
    let panel = paneles.get(clave);
    if (!panel) {
      panel = vscode.window.createWebviewPanel(`atomreactchamber.${clave}`, titulo, vscode.ViewColumn.Active, {
        enableScripts: false,
        localResourceRoots: [],
      });
      paneles.set(clave, panel);
      panel.onDidDispose(() => paneles.delete(clave));
    } else {
      panel.reveal();
    }
    panel.title = titulo;
    panel.webview.html = pagina({ titulo, cuerpo: cuerpo(panel.webview.cspSource), nonce: crearNonce(), cspSource: panel.webview.cspSource });
  }

  /** Extrae el código desde un argumento string o desde un nodo del árbol. */
  function codigoDe(arg: unknown, campo: 'especie' | 'reaccion'): string | undefined {
    if (typeof arg === 'string') return arg;
    const nodo = arg as Record<string, { codigo?: string }> | undefined;
    return nodo?.[campo]?.codigo;
  }

  const comando = (id: string, fn: (...args: unknown[]) => unknown) =>
    ctx.subscriptions.push(
      vscode.commands.registerCommand(`atomreactchamber.${id}`, async (...args: unknown[]) => {
        try {
          await fn(...args);
        } catch (e) {
          salida.error(`${id}: ${(e as Error).message}`);
          void vscode.window.showErrorMessage(`AtomReactChamber: ${(e as Error).message}`);
        }
      }),
    );

  comando('refrescar', refrescar);

  comando('preguntarQuimi', async () => {
    const q = await vscode.window.showInputBox({
      title: 'Preguntar a Quimi',
      prompt: 'Escribe tu duda de química (ej. «¿qué es la energía de activación?»)',
      validateInput: (v) => (v.trim().length < 2 ? 'Escribe al menos 2 caracteres' : v.length > 200 ? 'Máximo 200 caracteres' : undefined),
    });
    if (!q) return;
    const r = await api.quimi(q.trim());
    estado.registrar({ tipo: 'quimi_consulta', datos: { consulta: q.trim().slice(0, 200), terminos: r.terminos.length } });
    mostrar('quimi', 'Quimi', () => cuerpoQuimi(q.trim(), r));
  });

  comando('verEspecie', async (arg) => {
    const cat = await asegurarCatalogo();
    if (!cat) return;
    let codigo = codigoDe(arg, 'especie');
    if (!codigo) {
      const sel = await vscode.window.showQuickPick(
        cat.especies.map((e) => ({ label: e.formula, description: e.nombre, detail: `ΔHf ${e.dhf} kJ/mol`, codigo: e.codigo })),
        { title: 'Ver ficha de especie', placeHolder: 'Busca por fórmula o nombre', matchOnDescription: true },
      );
      codigo = sel?.codigo;
    }
    const e = cat.especies.find((x) => x.codigo === codigo);
    if (!e) return;
    estado.registrar({ tipo: 'pagina_vista', datos: { vista: 'ficha_especie', especie: e.codigo } });
    mostrar('especie', `${e.formula} · ${e.nombre}`, () => cuerpoEspecie(e, cat));
  });

  comando('explicarReaccion', async (arg) => {
    const cat = await asegurarCatalogo();
    if (!cat) return;
    let codigo = codigoDe(arg, 'reaccion');
    if (!codigo) {
      const sel = await vscode.window.showQuickPick(
        cat.reacciones.map((r) => ({ label: r.ecuacion, description: r.etiqueta, detail: `ΔH ${r.dh} kJ/mol · ${tipoTermico(r.dh)}`, codigo: r.codigo })),
        { title: 'Explicar reacción', placeHolder: 'Elige una reacción del catálogo', matchOnDescription: true },
      );
      codigo = sel?.codigo;
    }
    const r = cat.reacciones.find((x) => x.codigo === codigo);
    if (!r) return;
    estado.registrar({ tipo: 'reaccion_observada', datos: { reaccion: r.codigo, vista: 'explicar_reaccion' } });
    mostrar('reaccion', `Reacción · ${r.ecuacion}`, () => cuerpoReaccion(r, cat));
  });

  comando('iniciarSesion', async () => {
    const email = await vscode.window.showInputBox({
      title: 'Iniciar sesión en AtomReactChamber (1/2)',
      prompt: 'Correo electrónico',
      value: ctx.globalState.get<string>('atomreactchamber.email') ?? '',
      placeHolder: 'estudiante@demo.arc.pe',
      validateInput: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? undefined : 'Correo no válido'),
    });
    if (!email) return;
    const password = await vscode.window.showInputBox({ title: 'Iniciar sesión en AtomReactChamber (2/2)', prompt: 'Contraseña', password: true });
    if (!password) return;
    const r = await api.login(email.trim(), password);
    await ctx.secrets.store(CLAVE_TOKEN, r.token);
    await ctx.globalState.update('atomreactchamber.email', email.trim());
    void vscode.window.showInformationMessage(`¡Hola, ${r.usuario.nombre}! Sesión iniciada (${r.usuario.rol}).`);
    await refrescar();
  });

  comando('cerrarSesion', async () => {
    await ctx.secrets.delete(CLAVE_TOKEN);
    void vscode.window.showInformationMessage('Sesión de AtomReactChamber cerrada.');
    await refrescar();
  });

  comando('miProgreso', async () => {
    if (!(await ctx.secrets.get(CLAVE_TOKEN))) {
      const op = await vscode.window.showInformationMessage('Inicia sesión para ver tu XP, racha y estrellas.', 'Iniciar sesión');
      if (op) await vscode.commands.executeCommand('atomreactchamber.iniciarSesion');
      if (!(await ctx.secrets.get(CLAVE_TOKEN))) return;
    }
    const p = await api.perfil();
    estado.registrar({ tipo: 'pagina_vista', datos: { vista: 'mi_progreso' } });
    mostrar('progreso', 'Mi progreso', () => cuerpoProgreso(p));
  });

  comando('abrirLaboratorio', async () => {
    const url = vscode.workspace.getConfiguration(SECCION).get<string>('webUrl', 'https://laos19.github.io/demov0.1atomreactchamber/');
    estado.registrar({ tipo: 'pagina_vista', datos: { vista: 'abrir_laboratorio' } });
    await vscode.env.openExternal(vscode.Uri.parse(url));
  });

  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${SECCION}.apiUrl`)) void refrescar();
    }),
    ctx.secrets.onDidChange((e) => {
      if (e.key === CLAVE_TOKEN) void actualizarBarra();
    }),
    { dispose: () => void estado.vaciar() },
  );

  const intervalo = setInterval(() => void actualizarBarra(), 60_000);
  ctx.subscriptions.push({ dispose: () => clearInterval(intervalo) });

  estado.registrar({ tipo: 'pagina_vista', datos: { vista: 'extension_activada', version: String(ctx.extension.packageJSON.version ?? '') } });
  void refrescar();
}

export function deactivate(): void {
  /* Los recursos se liberan vía ctx.subscriptions. */
}
