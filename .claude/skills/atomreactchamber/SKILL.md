---
name: atomreactchamber
description: Consulta la API del laboratorio virtual de química AtomReactChamber para explicar reacciones (Eₐ, ΔH, exo/endotérmica, perfil de energía), buscar especies químicas (fórmula, ΔHf, puntos de fusión/ebullición, PubChem), listar misiones y niveles por grado de secundaria, preguntar al asistente Quimi (glosario) y resumir el dashboard docente. Úsala cuando el usuario pregunte por química escolar, por el contenido del juego AtomReactChamber, por sus niveles o por métricas de uso del producto.
---

# AtomReactChamber — consultar la API

AtomReactChamber es un laboratorio virtual de química gamificado para 1.º–5.º de secundaria (Perú,
Ciencia y Tecnología – CNEB). Esta skill consulta su API REST (contrato en `backend/src/routes/index.ts`)
mediante `scripts/arc.sh` (curl + node para formatear). Responde siempre **en español** y con
lenguaje adecuado para escolares cuando la pregunta venga de un estudiante.

## Antes de empezar

- URL de la API: variable `ARC_API_URL` (por defecto `http://localhost:8080`; en la nube
  `https://atomreactchamber-api.onrender.com`). Comprueba con:
  ```bash
  .claude/skills/atomreactchamber/scripts/arc.sh salud
  ```
- Si falla la conexión en local, la API se levanta con `npm run dev:api` (requiere `DATABASE_URL` y
  `JWT_SECRET`, ver `backend/README` o `task_plan.md`). No inventes datos si la API no responde: dilo.
- Si el servidor MCP `atomreactchamber` está conectado (ver `/mcp`), puedes usar sus herramientas
  equivalentes (`buscar_especie`, `explicar_reaccion`, `listar_niveles`, `preguntar_quimi`,
  `resumen_dashboard`) en lugar del script.

## Comandos

| Necesidad | Comando |
|---|---|
| Explicar una reacción (por código, ecuación o especies) | `arc.sh reaccion co2` · `arc.sh reaccion "H2 + O2"` · `arc.sh reaccion sodio` |
| Ver todas las reacciones | `arc.sh reacciones` |
| Ficha de una especie | `arc.sh especie H2O` · `arc.sh especie "cloruro de sodio"` |
| Niveles del juego (opcional grado 1–5) | `arc.sh niveles` · `arc.sh niveles 3 --detalle` |
| Preguntar a Quimi (glosario) | `arc.sh quimi "¿qué es la energía de activación?"` |
| Resumen del dashboard docente | `ARC_TOKEN=<jwt> arc.sh dashboard` o `ARC_EMAIL=… ARC_PASSWORD=… arc.sh dashboard` |
| JSON crudo de un endpoint público | `arc.sh json catalogo` · `arc.sh json juego` |

Ruta completa del script: `.claude/skills/atomreactchamber/scripts/arc.sh`.

## Cómo responder

1. **Reacciones**: muestra la ecuación, di si es exotérmica (ΔH < 0, libera calor) o endotérmica
   (ΔH > 0, absorbe calor), explica la energía de activación como la "colina" que deben superar los
   choques y describe el perfil: reactivos → cima (Eₐ) → productos (ΔH). Si Eₐ = 0, explica que es
   una unión de radicales sin barrera.
2. **Especies**: fórmula, nombre, masa molar, ΔH° de formación, puntos de fusión/ebullición en K y °C,
   si es radical y el enlace de PubChem que devuelve el script.
3. **Niveles**: agrupa por misión; indica grado, XP y minutos; con `--detalle` resume los pasos sin
   dar las respuestas del cuestionario (la API no las expone y no debes inventarlas).
4. **Quimi**: cita las definiciones del glosario tal cual y amplía con un ejemplo cotidiano.
5. **Dashboard** (solo docentes): destaca KPIs, pasos más lentos y preguntas con más error, y el uso
   por integración (`origen`: web, vscode, mcp, claude) con una recomendación pedagógica.

## Datos y privacidad

- Unidades: energía en kJ/mol, temperatura en K (el script añade °C).
- El script registra un evento de uso anónimo con `origen: "claude"` en `POST /api/eventos`
  (una sesión por día). Desactívalo con `ARC_TELEMETRIA=0`.
- Las cuentas demo son `estudiante@demo.arc.pe` y `docente@demo.arc.pe` (contraseña `quimica2026`);
  no pidas ni guardes credenciales reales en archivos.

## Ejemplo

Usuario: «¿Por qué el hidrógeno necesita una chispa para arder?»

```bash
.claude/skills/atomreactchamber/scripts/arc.sh reaccion "H2 + O2"
.claude/skills/atomreactchamber/scripts/arc.sh quimi "energía de activación"
```

Respuesta: explica que `H₂ + O₂ → H₂O + O·` tiene Eₐ = 34 kJ/mol (la chispa aporta esa energía a
algunas moléculas) y que luego la propagación `O· + H₂ → H₂O` es muy exotérmica (ΔH = −491 kJ/mol),
lo que mantiene la reacción en cadena; sugiere el nivel `n04-hidrogeno` (3.º de secundaria).
