# Registro de cambios

Todas las versiones siguen [SemVer](https://semver.org/lang/es/).

## [2.0.0] — 2026-11-07

### Añadido
- Contenedor «AtomReactChamber» en la barra de actividades con ícono de átomo.
- Vista **Misiones**: misiones → niveles (grado, XP, minutos y estrellas si hay sesión) → pasos con su concepto.
- Vista **Catálogo**: especies (fórmula y ΔH° de formación) y reacciones (ecuación, ΔH y tipo exo/endotérmica).
- Comandos: *Preguntar a Quimi*, *Ver ficha de especie* (con enlace a PubChem), *Explicar reacción* (perfil de
  energía en SVG), *Iniciar sesión* / *Cerrar sesión* (token en SecretStorage), *Mi progreso*, *Abrir laboratorio*
  y *Refrescar*.
- Ítem de barra de estado con el estado de la API y la XP del usuario.
- Configuración `atomreactchamber.apiUrl`, `atomreactchamber.webUrl` y `atomreactchamber.telemetria`.
- Telemetría de uso anónima con `origen: "vscode"` hacia `POST /api/eventos` (respeta la telemetría de VS Code).
- Webviews con Content-Security-Policy estricta (sin scripts) y escape de HTML.
