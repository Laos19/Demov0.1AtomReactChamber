# AtomReactChamber para VS Code

Extensión oficial del laboratorio virtual de química gamificado **AtomReactChamber** (UPT · Base de Datos II).
Lleva las misiones, el catálogo químico y el asistente **Quimi** al editor, consumiendo la misma API REST que la web.

> Proyecto académico de Adriana Rafaela Laos González (2023077474) — Universidad Privada de Tacna.

## Funciones

| Función | Dónde | Endpoint de la API |
|---|---|---|
| Árbol **Misiones** (misión → nivel → pasos, grado, XP, estrellas) | Barra de actividades › AtomReactChamber | `GET /api/juego`, `GET /api/progreso` |
| Árbol **Catálogo** (especies con fórmula y ΔHf; reacciones con ecuación y ΔH) | Barra de actividades › AtomReactChamber | `GET /api/catalogo` |
| **Preguntar a Quimi** — glosario con búsqueda de texto completo | Paleta de comandos / botón del árbol | `GET /api/quimi?q=` |
| **Ver ficha de especie** — propiedades + enlace a PubChem | Clic en una especie | `GET /api/catalogo` |
| **Explicar reacción** — ecuación, Eₐ, ΔH, tipo y perfil de energía (SVG) | Clic en una reacción | `GET /api/catalogo` |
| **Iniciar sesión** — el token JWT se guarda en *SecretStorage* | Paleta de comandos | `POST /api/auth/login` |
| **Mi progreso** — XP, racha, estrellas e insignias | Barra de estado / paleta | `GET /api/perfil` |
| **Abrir laboratorio** — abre la web configurada | Botón del árbol | — |
| Barra de estado: estado de la API y XP | Abajo a la izquierda | `GET /api/health` |

![Vista de misiones](https://placehold.co/800x450?text=Captura:+árbol+de+misiones)
![Perfil de energía](https://placehold.co/800x450?text=Captura:+explicar+reacción)

## Instalación

1. Descarga `atomreactchamber-vscode-<versión>.vsix` desde los
   [Releases del repositorio](https://github.com/laos19/demov0.1atomreactchamber/releases).
2. En VS Code: **Extensiones › … › Instalar desde VSIX…** o en terminal:
   ```bash
   code --install-extension atomreactchamber-vscode-2.0.0.vsix
   ```
3. Abre la paleta (`Ctrl+Shift+P`) y escribe **AtomReactChamber**.

## Configuración

| Ajuste | Por defecto | Descripción |
|---|---|---|
| `atomreactchamber.apiUrl` | `http://localhost:8080` | URL base de la API (sin `/api`). En la nube: `https://atomreactchamber-api.onrender.com`. |
| `atomreactchamber.webUrl` | `https://laos19.github.io/demov0.1atomreactchamber/` | Laboratorio web que abre «Abrir laboratorio». |
| `atomreactchamber.telemetria` | `true` | Enviar eventos de uso anónimos (`origen: "vscode"`). |

Cuentas de demostración: `estudiante@demo.arc.pe` y `docente@demo.arc.pe` (contraseña `quimica2026`).

## Privacidad y telemetría

La extensión envía eventos agregados (`pagina_vista`, `quimi_consulta`, `reaccion_observada`) a
`POST /api/eventos` con `origen: "vscode"` y un identificador de sesión aleatorio por ventana. Así el
dashboard docente puede comparar el uso por integración (web, VS Code, MCP, Claude). No se envía código
ni archivos del usuario. Se desactiva con `atomreactchamber.telemetria: false` o con la telemetría global
de VS Code (`telemetry.telemetryLevel: off`).

## Seguridad

- Los webviews usan una **Content-Security-Policy** estricta (`default-src 'none'`, sin scripts, estilos con *nonce*).
- Todo dato de la API se escapa antes de insertarse en HTML.
- El token se guarda en el almacén cifrado del sistema (`SecretStorage`), nunca en `settings.json`.

## Desarrollo

```bash
npm install                          # en la raíz del monorepo
npm run build -w extensions/vscode   # esbuild → dist/extension.js
npm test -w extensions/vscode        # pruebas unitarias (vitest) de formato, SVG y vistas
npm run package -w extensions/vscode # genera el .vsix con @vscode/vsce
```

Para depurar: abre `extensions/vscode` en VS Code y pulsa `F5` (*Run Extension*), con la API corriendo
(`npm run dev:api` en la raíz).

## Licencia

[MIT](LICENSE) © 2026 Adriana Rafaela Laos González
