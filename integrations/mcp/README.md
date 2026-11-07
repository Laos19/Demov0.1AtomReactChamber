# Servidor MCP de AtomReactChamber (`@arc/mcp`)

Servidor [Model Context Protocol](https://modelcontextprotocol.io) que expone la API REST de
AtomReactChamber a agentes de IA (Claude Code, Claude Desktop, MCP Inspector…). Usa el SDK oficial
`@modelcontextprotocol/sdk` con transporte **stdio**.

## Herramientas y recursos

| Nombre | Tipo | Qué hace | Endpoint de la API |
|---|---|---|---|
| `buscar_especie` | herramienta | Ficha de una especie por fórmula (`H2O`/`H₂O`), código o nombre: masa molar, ΔHf, pf/pe, radical, PubChem, reacciones donde participa | `GET /api/catalogo` |
| `explicar_reaccion` | herramienta | Ecuación, tipo exo/endotérmica, Eₐ, ΔH y perfil de energía en texto. Acepta código (`co2`), ecuación o especies (`H2 + O2`) | `GET /api/catalogo` |
| `listar_niveles` | herramienta | Misiones y niveles con grado, XP, minutos, objetivo y pasos. Filtros `grado`, `mision`, `detalle` | `GET /api/juego` |
| `preguntar_quimi` | herramienta | Asistente Quimi: glosario con búsqueda de texto completo. Opcional `nivel` y `paso` | `GET /api/quimi` |
| `resumen_dashboard` | herramienta | KPIs, uso por integración (`origen`), pasos lentos, preguntas difíciles. **Requiere `ARC_TOKEN` docente** | `GET /api/dashboard` |
| `arc://catalogo` | recurso | Catálogo químico completo en JSON | `GET /api/catalogo` |

Cada llamada registra un evento de uso con `origen: "mcp"` en `POST /api/eventos` (fallos silenciosos),
para que el dashboard docente muestre cuánto se usa la integración. Se desactiva con `ARC_TELEMETRIA=0`.

## Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `ARC_API_URL` | `http://localhost:8080` | URL base de la API (sin `/api`). En la nube: `https://atomreactchamber-api.onrender.com` |
| `ARC_TOKEN` | — | JWT de una cuenta docente/admin para `resumen_dashboard` |
| `ARC_TELEMETRIA` | `1` | `0` para no enviar eventos de uso |

Obtener un token docente (cuenta demo):

```bash
curl -s -X POST "$ARC_API_URL/api/auth/login" -H 'content-type: application/json' \
  -d '{"email":"docente@demo.arc.pe","password":"quimica2026"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token'
```

## Compilar y probar

```bash
npm install                        # raíz del monorepo
npm run build -w integrations/mcp  # tsc → integrations/mcp/dist
npm test -w integrations/mcp       # vitest: lógica + servidor en memoria con fetch simulado
npm run inspector -w integrations/mcp   # MCP Inspector (interfaz web para probar herramientas)
```

## Configuración en Claude Code

Opción A — comando (ámbito local del usuario):

```bash
claude mcp add atomreactchamber -e ARC_API_URL=http://localhost:8080 -- node integrations/mcp/dist/index.js
# con dashboard:
claude mcp add atomreactchamber -e ARC_API_URL=http://localhost:8080 -e ARC_TOKEN=<jwt> -- node integrations/mcp/dist/index.js
```

Opción B — archivo de proyecto `.mcp.json` (ya incluido en la raíz del repositorio). Claude Code expande
las variables `${VAR:-valor}` del entorno:

```json
{
  "mcpServers": {
    "atomreactchamber": {
      "type": "stdio",
      "command": "node",
      "args": ["integrations/mcp/dist/index.js"],
      "env": {
        "ARC_API_URL": "${ARC_API_URL:-http://localhost:8080}",
        "ARC_TOKEN": "${ARC_TOKEN:-}"
      }
    }
  }
}
```

Luego, en Claude Code: `/mcp` para ver el estado y pedir, por ejemplo, *«Explícame la combustión del
hidrógeno con su perfil de energía»*.

## Claude Desktop

En `claude_desktop_config.json` usa la misma entrada con la ruta **absoluta** a `dist/index.js`.

## Arquitectura

```
src/index.ts        arranque stdio (logs a stderr; stdout es el canal del protocolo)
src/servidor.ts     crearServidor(): registerTool ×5 + registerResource (zod para los esquemas)
src/herramientas.ts lógica pura: búsqueda normalizada (tildes, subíndices), explicaciones, resúmenes
src/api.ts          cliente fetch con caché de 5 min para catálogo/juego y errores en español
```
