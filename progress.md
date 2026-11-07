# progress.md — Bitácora

## 2026-11-07
- Revisión de rúbrica BDII, FD01 (PDF) y FD02 (DOCX); hallazgos en `findings.md`.
- Decisiones confirmadas por Adriana (ver `task_plan.md`).
- 31 skills instaladas tras revisión (ui-ux-pro-max, frontend-design, web-design-guidelines, AccessLint,
  web-quality, planning-with-files, terraform, revealjs, github-pr-review, snyk-fix, superpowers, sgomez-dev…).
- Monorepo: app v0.1 movida a `frontend/`.
- BD: 29 tablas, 6 vistas + 1 materializada, 16 funciones, 10 triggers, 47 changesets; migración probada en PostgreSQL 16.
- API Fastify: 21 endpoints, 17 pruebas de integración contra PostgreSQL real.
- Frontend v2 ("Tablero periódico"): motor en TS + solucionador que verifica los 9 niveles (encontró y corrigió el nivel 5).
- e2e Playwright: nivel 1 completo + axe WCAG 2.2 AA (corrigió contraste del color cobre → #0A7266).
- Integraciones: extensión VS Code (19 pruebas), servidor MCP (12 pruebas), skill + agente Claude Code.
- Automatizaciones: 7 workflows + CodeQL; Terraform Neon/Render; docs generadas (README, diagramas Mermaid, TypeDoc).
- Pendiente de Adriana: crear cuentas Neon/Render/HCP/Infracost y cargar secrets; aprobar repo nuevo en Classroom50.
