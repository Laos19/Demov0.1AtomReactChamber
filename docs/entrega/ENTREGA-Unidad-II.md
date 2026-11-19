---
title: "AtomReactChamber — Entrega del Proyecto de Unidad II"
subtitle: "SI-783 Base de Datos II · Universidad Privada de Tacna · FAING · EPIS"
author:
  - "Adriana Rafaela Laos González (2023077474)"
  - "Antony Piero Solorzano Zegarra (2023078696)"
date: "Noviembre 2026"
---

# Datos de la entrega

| | |
|---|---|
| Curso | SI-783 Base de Datos II — Docente: Ing. Patrick Cuadros Quiroga |
| Integrantes | Adriana Rafaela Laos González (2023077474) · Antony Piero Solorzano Zegarra (2023078696) |
| Proyecto | **AtomReactChamber**: laboratorio virtual de química gamificado para estudiantes de secundaria del Perú |
| Repositorio de entrega (Classroom) | https://github.com/UPT-FAING-EPIS/si783-2026-ii-si783-2026-ii-proyecto-group-11 |
| Repositorio de desarrollo y despliegue | https://github.com/Laos19/Demov0.1AtomReactChamber |

# Enlaces de la aplicación

| Recurso | Enlace |
|---|---|
| **Aplicación en producción** (Render + Neon PostgreSQL) | https://atomreactchamber-web.onrender.com |
| API REST — estado | https://atomreactchamber-api.onrender.com/api/health |
| API REST — documentación Swagger | https://atomreactchamber-api.onrender.com/api/docs |
| Portal de documentación generado por `pages.yml` (GitHub Pages) | https://laos19.github.io/Demov0.1AtomReactChamber/ |
| Documentación técnica: cada clase, método y propiedad (TypeDoc) | https://laos19.github.io/Demov0.1AtomReactChamber/api/ |
| Presentación y documentos PDF | https://laos19.github.io/Demov0.1AtomReactChamber/presentacion/ · https://laos19.github.io/Demov0.1AtomReactChamber/documentos/ |
| Demo sin servidor | https://laos19.github.io/Demov0.1AtomReactChamber/app/ |
| Release v2.1.0 (artefactos + extensión VS Code) | https://github.com/Laos19/Demov0.1AtomReactChamber/releases |
| Ejecuciones y reportes de las automatizaciones | https://github.com/Laos19/Demov0.1AtomReactChamber/actions |

**Cuentas de demostración** (contraseña `quimica2026`): `estudiante@demo.arc.pe`, `docente@demo.arc.pe`.
El servidor gratuito se suspende tras 15 minutos sin uso: la primera carga puede tardar alrededor de un minuto.

# Cumplimiento de las indicaciones

## Semana 1 — Correcciones

| Indicación | Archivo |
|---|---|
| Título, problema detallado con fuentes, objetivos de investigación y de solución medibles | `docs/investigacion/problema-y-objetivos.md` y FD01 §1 |
| FD01 — Informe de Factibilidad | `docs/fd/FD01-Informe-Factibilidad.pdf` |
| FD02 — Informe de Visión | `docs/fd/FD02-Informe-Vision.pdf` |
| FD03 — Informe SRS | `docs/fd/FD03-Informe-SRS.pdf` |
| FD04 — Informe SAD | `docs/fd/FD04-Informe-SAD.pdf` |

## Semanas 2 a 6

| Indicación | Evidencia |
|---|---|
| FD05 — Informe Final | `docs/fd/FD05-Informe-Final.pdf` |
| Diccionario de Datos | `docs/database/diccionario-de-datos.pdf` (y generado por `docs.yml` con tbls en `docs/database/`) |
| Estándar de Programación | `docs/estandares/estandar-de-programacion.pdf` |
| Aplicación desplegada en la nube mediante automatizaciones que generan la infraestructura, despliegan la BD y la aplicación | Terraform (`infra.yml`) crea Neon + Render; Liquibase (`db.yml`) crea los objetos de la BD; `release.yml` publica la versión y despliega |
| Diagramas y manuales técnicos generados desde el repositorio | `docs.yml` (README con ER, clases, componentes, despliegue), `pages.yml` (TypeDoc), `docs/manuales/` |
| Features no funcionales: sesiones, historiales, caché, logs y telemetría | Sección «Requisitos no funcionales» del README (con archivos de evidencia) |
| Reto: integración con 3 herramientas o VS Code + skill/agente | Extensión de VS Code (`extensions/vscode`), servidor MCP (`integrations/mcp`), skill y agente de Claude Code (`.claude/`), GitHub (Actions, Pages, Releases). Ver `docs/integraciones.md` |

# Rúbrica: dónde está cada criterio

| Criterio | Evidencia |
|---|---|
| Problemática detallada y sustentada · objetivos medibles | `docs/investigacion/problema-y-objetivos.md` (fuentes APA con URL, objetivos SMART con indicador y meta) |
| Formatos FD01, FD02, FD03, FD04 | `docs/fd/` (md, docx y pdf, formato UPT) |
| Código fuente de aplicación y base de datos en GitHub | `frontend/`, `backend/`, `db/changelog/` (48 changesets Liquibase: 29 tablas, 7 vistas, 16 funciones, 10 triggers) |
| Contribuciones al proyecto | Historial de commits del repositorio y sección 9.2 del FD05 (dos integrantes) |
| Automatización Terraform + reporte de pruebas + reporte de costos | `infra.yml`: pruebas (API 17, motor 15, e2e 7) en JUnit, costos free tier vs. AWS/Azure, `terraform apply` en Neon y Render |
| Automatización Liquibase + reporte de ejecuciones | `db.yml`: validate, status, update-sql, update, rollback probado, history |
| Copias de seguridad + reporte | `backup.yml`: `pg_dump` diario cifrado, restauración verificada por conteo de filas, retención 7/4/3 |
| Release y despliegue en la infraestructura | `release.yml`: release v2.1.0 con artefactos, migraciones, deploy hooks de Render y prueba de humo |
| Documentación en README (diccionario, ER, clases, componentes, despliegue) | `docs.yml` regenera el README y `docs/diagramas/` en cada cambio |
| Documentación técnica en GitHub Pages (clases, métodos, propiedades) | `pages.yml` + TypeDoc |
| Presentación del proyecto | `docs/presentacion/` (reveal.js, PDF y PPTX) |
| Dashboard de utilización del producto | Página *Dashboard* (docente/admin) sobre vistas y la vista materializada `mv_uso_diario` |
