# AtomReactChamber — documentación técnica

Referencia generada con **TypeDoc** desde los comentarios TSDoc del código: cada clase, método y propiedad.

| Módulo | Contenido |
|---|---|
| `backend/src` | API REST (Fastify): `Database`, `AuthService`, repositorios, servicios, rutas y esquemas |
| `frontend/src/engine` | Motor de simulación: `Simulation`, química (`construirQuimica`, `faseDe`, Clausius-Clapeyron), DSL de condiciones (`SeguidorDePaso`) |
| `frontend/src/data/fuente.ts` | Fuentes de datos: `FuenteApi` (REST) y `FuenteDemo` (modo offline) |
| `integrations/mcp/src` | Servidor MCP que expone la API a agentes |

Las reglas de negocio (estrellas, XP, insignias, racha) están en PostgreSQL: ver el diccionario de datos y `db/changelog/sql/007-funciones.sql`.
