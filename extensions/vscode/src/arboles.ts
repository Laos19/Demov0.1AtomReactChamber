import * as vscode from 'vscode';
import { energia, estrellas, grado, tipoTermico } from './lib/formato';
import type { Catalogo, Especie, Juego, Mision, Nivel, Paso, ProgresoNivel, Reaccion } from './lib/tipos';

type NodoMision =
  | { tipo: 'mision'; mision: Mision; niveles: Nivel[] }
  | { tipo: 'nivel'; nivel: Nivel }
  | { tipo: 'paso'; nivel: Nivel; paso: Paso }
  | { tipo: 'error'; mensaje: string };

/** Árbol "Misiones": misiones → niveles (grado, XP, estrellas) → pasos. */
export class ArbolMisiones implements vscode.TreeDataProvider<NodoMision> {
  private readonly cambio = new vscode.EventEmitter<NodoMision | undefined>();
  readonly onDidChangeTreeData = this.cambio.event;
  private juego?: Juego;
  private progreso = new Map<string, ProgresoNivel>();
  private error?: string;

  actualizar(juego: Juego | undefined, progreso: ProgresoNivel[] = [], error?: string): void {
    this.juego = juego;
    this.progreso = new Map(progreso.map((p) => [p.nivel, p]));
    this.error = error;
    this.cambio.fire(undefined);
  }

  getTreeItem(n: NodoMision): vscode.TreeItem {
    switch (n.tipo) {
      case 'error': {
        const it = new vscode.TreeItem(n.mensaje, vscode.TreeItemCollapsibleState.None);
        it.iconPath = new vscode.ThemeIcon('warning');
        it.command = { command: 'atomreactchamber.refrescar', title: 'Reintentar' };
        return it;
      }
      case 'mision': {
        const it = new vscode.TreeItem(n.mision.titulo, vscode.TreeItemCollapsibleState.Expanded);
        const xp = n.niveles.reduce((a, x) => a + x.xp, 0);
        it.description = `${n.niveles.length} niveles · ${xp} XP`;
        it.tooltip = new vscode.MarkdownString(`**${n.mision.titulo}**\n\n${n.mision.descripcion}`);
        it.iconPath = new vscode.ThemeIcon('rocket');
        it.contextValue = 'mision';
        return it;
      }
      case 'nivel': {
        const p = this.progreso.get(n.nivel.codigo);
        const it = new vscode.TreeItem(`${n.nivel.orden}. ${n.nivel.titulo}`, vscode.TreeItemCollapsibleState.Collapsed);
        const partes = [`${n.nivel.grado}.º`, `${n.nivel.xp} XP`, `${n.nivel.minutos} min`];
        if (p) partes.push(p.completado ? estrellas(p.estrellas) : p.desbloqueado ? 'disponible' : 'bloqueado');
        it.description = partes.join(' · ');
        it.tooltip = new vscode.MarkdownString(
          `**${n.nivel.titulo}** — ${grado(n.nivel.grado)}\n\n${n.nivel.resumen}\n\n*Objetivo:* ${n.nivel.objetivo}`,
        );
        it.iconPath = new vscode.ThemeIcon(p?.completado ? 'pass-filled' : p && !p.desbloqueado ? 'lock' : 'beaker');
        it.contextValue = 'nivel';
        return it;
      }
      case 'paso': {
        const it = new vscode.TreeItem(`Paso ${n.paso.orden}: ${n.paso.titulo}`, vscode.TreeItemCollapsibleState.None);
        it.description = n.paso.instruccion;
        it.tooltip = new vscode.MarkdownString(`${n.paso.instruccion}\n\n💡 ${n.paso.concepto}`);
        it.iconPath = new vscode.ThemeIcon('circle-outline');
        it.contextValue = 'paso';
        return it;
      }
    }
  }

  getChildren(n?: NodoMision): NodoMision[] {
    if (!n) {
      if (this.error) return [{ tipo: 'error', mensaje: this.error }];
      if (!this.juego) return [];
      return [...this.juego.misiones]
        .sort((a, b) => a.orden - b.orden)
        .map((m) => ({
          tipo: 'mision' as const,
          mision: m,
          niveles: this.juego!.niveles.filter((x) => x.mision === m.codigo).sort((a, b) => a.orden - b.orden),
        }));
    }
    if (n.tipo === 'mision') return n.niveles.map((nivel) => ({ tipo: 'nivel' as const, nivel }));
    if (n.tipo === 'nivel') return [...n.nivel.pasos].sort((a, b) => a.orden - b.orden).map((paso) => ({ tipo: 'paso' as const, nivel: n.nivel, paso }));
    return [];
  }
}

type NodoCatalogo =
  | { tipo: 'grupo'; grupo: 'especies' | 'reacciones' }
  | { tipo: 'especie'; especie: Especie }
  | { tipo: 'reaccion'; reaccion: Reaccion }
  | { tipo: 'error'; mensaje: string };

/** Árbol "Catálogo": especies (fórmula, ΔHf) y reacciones (ecuación, ΔH exo/endo). */
export class ArbolCatalogo implements vscode.TreeDataProvider<NodoCatalogo> {
  private readonly cambio = new vscode.EventEmitter<NodoCatalogo | undefined>();
  readonly onDidChangeTreeData = this.cambio.event;
  private catalogo?: Catalogo;
  private error?: string;

  actualizar(catalogo: Catalogo | undefined, error?: string): void {
    this.catalogo = catalogo;
    this.error = error;
    this.cambio.fire(undefined);
  }

  getTreeItem(n: NodoCatalogo): vscode.TreeItem {
    switch (n.tipo) {
      case 'error': {
        const it = new vscode.TreeItem(n.mensaje);
        it.iconPath = new vscode.ThemeIcon('warning');
        it.command = { command: 'atomreactchamber.refrescar', title: 'Reintentar' };
        return it;
      }
      case 'grupo': {
        const esp = n.grupo === 'especies';
        const it = new vscode.TreeItem(esp ? 'Especies' : 'Reacciones', vscode.TreeItemCollapsibleState.Expanded);
        it.description = String(esp ? this.catalogo?.especies.length ?? 0 : this.catalogo?.reacciones.length ?? 0);
        it.iconPath = new vscode.ThemeIcon(esp ? 'symbol-constant' : 'flame');
        return it;
      }
      case 'especie': {
        const e = n.especie;
        const it = new vscode.TreeItem(`${e.formula} — ${e.nombre}`);
        it.description = `ΔHf ${energia(e.dhf)}`;
        it.tooltip = `${e.nombre} (${e.formula})\nΔH° de formación: ${energia(e.dhf)}${e.radical ? '\nRadical libre' : ''}`;
        it.iconPath = new vscode.ThemeIcon(e.radical ? 'zap' : 'circle-filled');
        it.contextValue = 'especie';
        it.command = { command: 'atomreactchamber.verEspecie', title: 'Ver ficha', arguments: [e.codigo] };
        return it;
      }
      case 'reaccion': {
        const r = n.reaccion;
        const tipo = tipoTermico(r.dh);
        const it = new vscode.TreeItem(r.ecuacion);
        it.description = `ΔH ${energia(r.dh)} · ${tipo}`;
        it.tooltip = `${r.etiqueta}\nEₐ = ${r.ea} kJ/mol · ΔH = ${energia(r.dh)} (${tipo})`;
        it.iconPath = new vscode.ThemeIcon(
          tipo === 'exotérmica' ? 'arrow-down' : 'arrow-up',
          new vscode.ThemeColor(tipo === 'exotérmica' ? 'charts.red' : 'charts.blue'),
        );
        it.contextValue = 'reaccion';
        it.command = { command: 'atomreactchamber.explicarReaccion', title: 'Explicar', arguments: [r.codigo] };
        return it;
      }
    }
  }

  getChildren(n?: NodoCatalogo): NodoCatalogo[] {
    if (!n) {
      if (this.error) return [{ tipo: 'error', mensaje: this.error }];
      if (!this.catalogo) return [];
      return [{ tipo: 'grupo', grupo: 'especies' }, { tipo: 'grupo', grupo: 'reacciones' }];
    }
    if (n.tipo === 'grupo' && this.catalogo) {
      return n.grupo === 'especies'
        ? this.catalogo.especies.map((especie) => ({ tipo: 'especie' as const, especie }))
        : this.catalogo.reacciones.map((reaccion) => ({ tipo: 'reaccion' as const, reaccion }));
    }
    return [];
  }
}
