# Presentación: AtomReactChamber v2

Sustentación del proyecto en Base de Datos II (UPT · FAING · EPIS), docente Ing. Patrick Cuadros Quiroga.
Expone: Adriana Rafaela Laos González (2023077474). Duración: 15 minutos, 17 diapositivas con notas del
orador en cada una.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Presentación en reveal.js 5.1.0 (versión principal). |
| `styles.css` | Identidad visual «Tablero periódico»: papel cuadriculado, tinta, colores del ensayo a la llama, Unbounded + Atkinson Hyperlegible. |
| `AtomReactChamber-presentacion.pdf` | Exportación a PDF (17 páginas, 16:9). Respaldo si falla el navegador. |
| `AtomReactChamber-presentacion.pptx` | Versión PowerPoint simplificada y fiel, con las mismas notas del orador. Usa Arial/Calibri para no depender de fuentes instaladas. |
| `guion-demo.md` | Guion minuto a minuto de la demo en vivo, Plan B por cada falla y checklist previa. |
| `banco-de-preguntas.md` | 84 preguntas probables con respuestas basadas en el código y 8 preguntas para lanzar al público. |
| `img/` | Capturas de la app (mapa, nivel, aula, dashboard) y sus recortes usados en las diapositivas. |
| `vendor/` | Copia local de reveal.js 5.1.0 (MIT) y de las fuentes (SIL OFL), para presentar **sin internet**. |
| `scripts/` | `export-pdf.cjs` (PDF con Playwright) y `build-pptx.cjs` (PPTX con pptxgenjs). |

## Cómo abrirla

- **Lo más simple:** doble clic en `index.html` (se abre en el navegador). Funciona sin internet: si el CDN
  de reveal.js no responde, carga la copia de `vendor/`; las fuentes siempre son locales.
- **Recomendado (para la vista del orador):** servir la carpeta por HTTP para que la ventana de notas se
  sincronice sin restricciones del navegador:

  ```bash
  npx --yes serve docs/presentacion      # luego abre http://localhost:3000
  # o: python3 -m http.server 8000 -d docs/presentacion
  ```

- Usa Chrome, Edge o Firefox actualizados, en pantalla completa.

## Atajos de teclado (reveal.js)

| Tecla | Acción |
|---|---|
| `→` / `Espacio` / `N` | Siguiente diapositiva |
| `←` / `P` | Diapositiva anterior |
| `Inicio` / `Fin` | Primera / última diapositiva |
| **`S`** | **Vista del orador**: abre una ventana con la diapositiva actual, la siguiente, las notas y un cronómetro. Llévala a tu laptop y proyecta la principal. |
| `F` | Pantalla completa (`Esc` para salir) |
| `O` o `Esc` | Vista general de todas las diapositivas |
| `B` o `.` | Pantalla en negro (pausa para preguntas) |
| `Alt` + clic | Zoom sobre un punto de la diapositiva |
| número + `Enter` | Ir a esa diapositiva (por ejemplo, `8` `Enter` para «Reglas en la BD») |

La URL cambia con cada diapositiva (`index.html#/7`), así que puedes abrir directamente una.

## Estructura de la exposición

| # | Diapositiva | Fila de la rúbrica |
|---|---|---|
| 1 | Portada | Presentación |
| 2 | El problema (cifras con fuente) | Problemática |
| 3 | Objetivos SMART | Objetivos medibles |
| 4 | La solución → **demo en vivo** (ver `guion-demo.md`) | Presentación |
| 5 | Cómo se juega (DSL de pasos, estrellas) | — |
| 6 | Arquitectura (diagrama SVG) | FD04 |
| 7 | Modelo de datos (29 tablas, 3FN) | Código y BD en GitHub |
| 8 | Reglas de negocio en PostgreSQL | Base de datos |
| 9 | Seguridad y datos de menores | — |
| 10 | Automatizaciones: rúbrica → workflow → reporte | Terraform, Liquibase, backups, release, docs, Pages |
| 11 | Infraestructura y costos | Reporte de costos, FD01 |
| 12 | Integraciones (VS Code, MCP, Claude Code, GitHub) | Reto de integraciones |
| 13 | Dashboard de uso | Dashboard |
| 14 | Calidad (63 pruebas) | Reporte de pruebas |
| 15 | Mapa de evidencias | Todas |
| 16 | Limitaciones y trabajo futuro (9 niveles; ≥ 12 es meta futura; consentimiento parental para menores de 14 años como trabajo futuro) | — |
| 17 | Preguntas | Preguntas |

Cada diapositiva tiene una franja amarilla **«Pregúntame…»** con una pregunta técnica provocadora: el
objetivo es que los compañeros participen. Las respuestas están en `banco-de-preguntas.md`.

## Regenerar el PDF y el PPTX

```bash
# PDF (Playwright + Chromium). Si la instalación de Playwright del repo no tiene navegadores,
# apunta a otra con PLAYWRIGHT_MODULE (por ejemplo, la global).
node docs/presentacion/scripts/export-pdf.cjs
PLAYWRIGHT_MODULE="$(npm root -g)/playwright" node docs/presentacion/scripts/export-pdf.cjs

# PPTX (pptxgenjs no es dependencia del repo: instálalo aparte)
npm install --no-save pptxgenjs@3.12.0
node docs/presentacion/scripts/build-pptx.cjs
```

Alternativa para el PDF: abrir `index.html?print-pdf` en Chrome → Imprimir → Guardar como PDF, horizontal,
márgenes «Ninguno», con «Gráficos de fondo» activado.

Si cambias el contenido de `index.html`, actualiza también `scripts/build-pptx.cjs` (el PPTX copia las
notas del orador desde el HTML automáticamente, pero el texto de las diapositivas está en el script).
