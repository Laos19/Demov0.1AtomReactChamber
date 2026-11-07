# Diagrama de componentes

> Generado automáticamente por `scripts/docs/build-diagrams.mjs`. No editar a mano.

Paquetes del monorepo (workspaces npm) y cómo se comunican. `db/data/*.json` es la fuente única del contenido: genera la semilla SQL y el modo offline.

```mermaid
flowchart LR
  subgraph Clientes
    frontend["@arc/frontend<br/><small>Frontend de AtomReactChamber (React + Vite + Typ</small>"]
    extensions_vscode["atomreactchamber-vscode<br/><small>Misiones, catálogo químico y el asistente Quimi </small>"]
    integrations_mcp["@arc/mcp<br/><small>Servidor MCP (stdio) que expone la API de AtomRe</small>"]
    skill["Skill Claude Code<br/><small>.claude/skills/atomreactchamber</small>"]
  end
  subgraph Servidor
    backend["@arc/backend<br/><small>Fastify · JWT · OpenAPI</small>"]
  end
  subgraph Datos
    db[("PostgreSQL 16<br/><small>funciones · triggers · vistas</small>")]
    lb["Liquibase<br/><small>db/changelog</small>"]
  end
  frontend -- "REST /api" --> backend
  extensions_vscode -- "REST /api" --> backend
  integrations_mcp -- "REST /api" --> backend
  skill -- "REST /api" --> backend
  backend -- "SQL (pg)" --> db
  lb -- "migra" --> db
  frontend -. "modo demo: JSON incluido" .-> datosLocales["contenido.generated.json"]
  gen["db/data/*.json"] -- "seed:generate" --> lb
  gen -- "seed:generate" --> datosLocales
```
