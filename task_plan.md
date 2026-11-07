# task_plan.md — AtomReactChamber v2

> Plan persistente (skill *planning-with-files*). Fuente de verdad para el equipo y los agentes.

## Objetivo
Convertir el simulador v0.1 en **AtomReactChamber v2**: laboratorio virtual de química **gamificado**
para estudiantes de 1.º a 5.º de secundaria (Perú, área Ciencia y Tecnología – CNEB), con base de datos
PostgreSQL, API, automatizaciones GitHub Actions y documentación FD01–FD05, listo para exponer.

## Decisiones confirmadas (Adriana, 2026-11-07)
| Tema | Decisión |
|---|---|
| Nombre | **AtomReactChamber**; el asistente se llama **Quimi** |
| Equipo | Solo **Adriana Rafaela Laos González (2023077474)** |
| Backend | **Node 22 + TypeScript + Fastify** |
| Público | Secundaria 1.º–5.º, Ciencia y Tecnología (CNEB – MINEDU) |
| Quimi | **Basado en reglas + BD** (pistas escalonadas + glosario con búsqueda de texto completo). LLM queda para la 3.ª unidad |
| Fuera de alcance (trabajo futuro) | Laboratorio 3D, PDF por correo, números cuánticos, editor de prácticas |
| Identidad | Rediseñar; proponer 2–3 direcciones de arte y elegir una |
| Nube | Gratuita: **Neon** (PostgreSQL) + **Render** (API + sitio estático) + **GitHub Pages** (docs + demo). Terraform modular para migrar a Azure/AWS |

## Contrato de arquitectura (no cambiar sin actualizar aquí)
```
/frontend        React 18 + Vite + TS. Build → frontend/dist. Env: VITE_API_URL (vacío ⇒ modo demo offline)
/backend         Fastify 5 + TS + pg. Build → backend/dist; start: node dist/server.js
                 Env: DATABASE_URL, JWT_SECRET, CORS_ORIGIN, PORT (def. 8080)
/db/changelog    Liquibase: db.changelog-master.yaml → sql/*.sql (formatted SQL, con rollback)
/db/data         Contenido semilla en JSON (única fuente de verdad) → scripts/generate-seed.mjs
/infra/terraform Módulos: neon, render; entorno raíz; referencia de costos AWS/Azure
/extensions/vscode  Extensión VS Code (TreeView misiones/catálogo vía API)
/integrations/mcp   Servidor MCP (opcional) que expone la API a agentes
/.claude/skills/atomreactchamber  Skill del proyecto (consulta la API)
/docs            FD01–FD05, diccionario, estándar, manuales, presentación, banco de preguntas
/scripts         Generadores de documentación (README, diagramas, reportes)
/.github/workflows  infra.yml, db.yml, backup.yml, release.yml, docs.yml, pages.yml, ci.yml
```
Scripts npm (raíz, workspaces `frontend`, `backend`, `extensions/vscode`):
- `npm run build` — compila todo · `npm test` — unitarios + integración (backend requiere `DATABASE_URL`)
- `npm run e2e -w frontend` — Playwright sobre el build en modo demo
- `npm run seed:generate` — regenera SQL semilla + catálogo del frontend desde `db/data`
- `npm run docs:readme` · `npm run docs:diagrams` · `npm run docs:api` (TypeDoc → `site/api`)

## Fases
| # | Fase | Estado |
|---|---|---|
| 0 | Skills instaladas, monorepo, planificación | ✅ |
| 1 | BD (modelo 3FN, Liquibase, funciones, triggers, vistas, semilla) | ✅ |
| 2 | API Fastify (auth JWT/roles, catálogo, misiones, intentos, Quimi, aulas, dashboard, eventos) | ✅ |
| 3 | Frontend v2: identidad, mapa tabla periódica, niveles guiados, Quimi, perfil, aula, dashboard, lab libre | ✅ |
| 4 | Automatizaciones (Terraform+tests+costos, Liquibase, backups, release+deploy, docs README, Pages) | ✅ (falta 1.ª ejecución con secrets) |
| 5 | Integraciones: VS Code, skill Claude Code, MCP, GitHub | ✅ |
| 6 | Documentos: problema con fuentes, objetivos SMART, FD01–FD04 corregidos, FD05, diccionario, estándar | ⏳ |
| 7 | Exposición: reveal.js + PPTX, guion demo, banco de preguntas | ⏳ |
| 8 | (Último, con permiso) Repo nuevo en Classroom50 | ⏸ |

## Reglas
- No inventar cifras: toda estadística con fuente real (APA + URL).
- Secrets solo en GitHub Secrets. Workflows deben quedar en verde aunque falten secrets (saltan `apply`/deploy).
- Preguntar a Adriana antes de: cambiar contenido académico de FD, alcance, repo nuevo, servicios con tarjeta.
