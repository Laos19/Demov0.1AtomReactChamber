# Guion de la demo en vivo: AtomReactChamber v2

> Expone: Adriana Rafaela Laos González (2023077474) · Base de Datos II · UPT · 15 minutos en total.
> La demo ocupa unos 6 minutos y entra después de la diapositiva 4 («La solución»).
> Abre este guion en el celular o en un segundo monitor; la vista del orador de reveal.js (tecla **S**)
> también muestra las notas de cada diapositiva.

## URLs y cuentas (confirmar la víspera)

| Qué | URL / dato | Nota |
|---|---|---|
| App en producción (Render) | `https://atomreactchamber-web.onrender.com` | URL que predice Terraform (`<prefijo>-web.onrender.com`). **Confirmar** con `terraform output web_url` o la variable `WEB_URL` del repo. |
| API (Render) | `https://atomreactchamber-api.onrender.com/api/health` | Confirmar con `terraform output api_url` (variable `API_URL`). |
| Swagger | `<API>/api/docs` | Documentación OpenAPI generada desde los esquemas zod. |
| Demo sin servidor (GitHub Pages) | `https://laos19.github.io/Demov0.1AtomReactChamber/app/` | Funciona aunque la API esté caída. Confirmar que `pages.yml` corrió en verde. |
| Docs técnicas (Pages) | `https://laos19.github.io/Demov0.1AtomReactChamber/` | TypeDoc, BD, diagramas, reportes. |
| Repositorio | `https://github.com/Laos19/Demov0.1AtomReactChamber` | Pestañas **Actions** y **Releases**. |
| Estudiante | `estudiante@demo.arc.pe` / `quimica2026` | Grado 3, 0 XP al inicio. |
| Docente | `docente@demo.arc.pe` / `quimica2026` | «Prof. Rosa Mendoza», aula `QUIM3A` con 13 estudiantes ficticios. |

> Si el repositorio final se mueve a Classroom50, actualiza estas URLs antes de exponer.

---

## Checklist previa

**La noche anterior**
- [ ] Abrir cada URL de la tabla y confirmar que carga. Anotar las que fallen y usar su Plan B.
- [ ] Ejecutar manualmente `backup.yml` y `db.yml` desde *Actions → Run workflow* para tener una
      ejecución reciente con su *Summary* (reporte) que mostrar.
- [ ] Confirmar que la última ejecución de `infra.yml`, `pages.yml` y `release.yml` está en verde.
- [ ] Revisar que exista al menos un Release con el `.vsix` adjunto.
- [ ] Instalar la extensión: `code --install-extension atomreactchamber-vscode-2.0.0.vsix` y poner
      `atomreactchamber.apiUrl` con la URL de la API.
- [ ] Exportar la presentación a PDF como respaldo (ya está en `docs/presentacion/AtomReactChamber-presentacion.pdf`)
      y copiarla a una USB junto con el `.pptx`.
- [ ] Clonar el repo en la laptop y probar el Plan C: `npm install && npm run dev -w frontend`.
- [ ] Repasar `banco-de-preguntas.md`, en especial las preguntas 16, 22, 24, 27, 35, 50 y 51.

**El día de la exposición (30 minutos antes)**
- [ ] Laptop cargada, cargador, adaptador HDMI/USB-C, mouse.
- [ ] Desactivar notificaciones (modo «No molestar») y cerrar Slack/WhatsApp Web.
- [ ] Zoom del navegador al 125 % para que se lea desde el fondo del aula.
- [ ] Abrir pestañas en este orden: (1) presentación `docs/presentacion/index.html`, (2) app en Render,
      (3) GitHub Actions, (4) Pages, (5) Swagger. VS Code abierto aparte.

**5 minutos antes (calentar Render)**
- [ ] Abrir `<API>/api/health`. Si tarda, es el arranque en frío (~1 min). Esperar hasta ver
      `{"estado":"ok","db":"ok",…}`.
- [ ] Abrir la app de Render y **cerrar sesión** si quedó una abierta.
- [ ] En el navegador de la demo, borrar el estado local si hiciste ensayos:
      DevTools → *Application* → *Local Storage* → borrar `arc:demo:v1`, `arc:modo` y `arc:token`.
- [ ] Recargar `/api/health` justo antes de empezar: Render se duerme tras 15 min sin tráfico.

---

## Guion minuto a minuto

| Minuto | Diapositiva / acción | Qué decir (resumen) |
|---|---|---|
| 0:00–0:45 | Diap. 1 Portada | Presentarse; invitar a interrumpir con la franja «Pregúntame». |
| 0:45–1:45 | Diap. 2 Problema | Cifras PISA, rural, Tacna; OI-1 como dato que falta. |
| 1:45–2:45 | Diap. 3 Objetivos | Indicadores medidos con vistas SQL; el piloto aún no se hizo. |
| 2:45–3:15 | Diap. 4 Solución | «La tabla periódica es el tablero». Cambiar a la app. |
| **3:15–9:15** | **DEMO** (detalle abajo) | |
| 9:15–10:00 | Diap. 5–6 Juego y arquitectura | Resumir lo visto: DSL de pasos, cuatro clientes, PostgreSQL al centro. |
| 10:00–11:30 | Diap. 7–8 Modelo y reglas en la BD | 3FN, `usuario.xp`, `fn_finalizar_intento`, índices. |
| 11:30–12:15 | Diap. 9 Seguridad | Incluye límites: localStorage, consentimiento parental (futuro). |
| 12:15–13:15 | Diap. 10–11 Automatizaciones y costos | Rúbrica → workflow → reporte; USD 0. |
| 13:15–14:00 | Diap. 12–14 Integraciones, dashboard, calidad | Ya mostrados en la demo: solo el dato clave de cada uno. |
| 14:00–15:00 | Diap. 16–17 Limitaciones y preguntas | 9 niveles (≥ 12 es meta futura); lanzar una pregunta al público. |

> Si vas atrasada: salta la diapositiva 15 (evidencias; es de consulta) y resume 12–14 en una frase cada una.

### DEMO (6 minutos)

**3:15 — Abrir la app (20 s)**
1. Cambiar a la pestaña de la app en Render (`Alt+Tab` o `Ctrl+2`).
2. Decir: «Esta es la versión desplegada con Terraform en Render; la base de datos está en Neon».
3. Si aparece la franja amarilla «Modo demostración sin servidor», ver Plan B1.

**3:35 — Ingresar como estudiante (20 s)**
1. Pulsar **Ingresar**.
2. Correo `estudiante@demo.arc.pe`, contraseña `quimica2026`, **Ingresar**.
3. Decir: «La contraseña se valida con bcrypt y la API me devuelve un JWT».

**3:55 — Mapa de misiones (20 s)**
1. Señalar la casilla **H** encendida (nivel 1) y las casillas con candado.
2. Decir: «Cada casilla es un nivel; se desbloquea al completar el anterior, regla `nivel_previo_id`».
3. Clic en **H** → panel lateral «Moléculas en movimiento» → **Empezar práctica**.

**4:15 — Nivel 1, paso 1: «Agrega más moléculas» (30 s)**
1. Mostrar la checklist del paso: «H₂ en la cámara ≥ 50» con valor actual **30**.
2. En **Inyector**: el botón **H₂** ya está elegido; en **Cantidad** dejar **20** → **Inyectar**.
3. El contador pasa a 50 y el paso se marca solo.
4. Decir: «Yo no marqué nada: una regla JSON guardada en `paso.condicion` se evalúa 60 veces por segundo».

**4:45 — Pedir ayuda a Quimi (40 s)**
1. En el panel de Quimi pulsar **Pista −5 XP**: aparece «Elige H₂ en el inyector y pulsa «Inyectar»».
   El botón cambia a **Explicación −10 XP**; **no lo pulses**, solo señálalo.
2. Decir: «Las ayudas van en orden pista → explicación → solución y cuestan 5, 10 y 20 XP. La función
   `fn_usar_pista` exige abrir la anterior. La pista no quita estrellas; la explicación quita una y la
   solución otra». *(Hazlo antes del paso 1 o justo después; la pista es por paso.)*
3. En **Pregúntale a Quimi** escribir `energia cinetica` (sin tildes, a propósito) → enviar.
4. Decir: «Encuentra "Energía cinética" aunque escribí sin tildes: búsqueda de texto completo en
   PostgreSQL con la configuración `es_sin_tildes` y un índice GIN. Quimi no es IA: es reglas + BD».

**5:25 — Paso 2: «Calienta la cámara» (30 s)**
1. Mover el control **Temperatura** a **650 K**.
2. Esperar ~3 s: la temperatura de la cámara sube poco a poco (termostato de Berendsen) y la condición
   debe sostenerse 2 s (`"durante": 2`).
3. Decir: «Más temperatura, más energía cinética: miren cómo se aceleran las moléculas».

**5:55 — Paso 3: «Congela el hidrógeno» (30 s)**
1. Bajar la temperatura a **5 K** (el H₂ funde a 14 K).
2. Esperar a que la fase pase a **Sólido**. Aparece «¡Práctica completada! Responde el cuestionario».

**6:25 — Cuestionario (40 s)**
1. P1 «Si aumentas la temperatura de un gas, sus partículas…» → **se mueven más rápido**.
2. P2 «¿En qué estado las partículas están más ordenadas…?» → **Sólido**.
3. P3 «0 K equivale aproximadamente a…» → **−273 °C**. *(Opcional: equivocarse a propósito en una para
   mostrar la retroalimentación.)*
4. Decir: «La corrección no la hace el navegador: un trigger, `tg_respuesta_validar`, la decide en la BD».
5. **Ver resultado**.

**7:05 — Estrellas y XP (25 s)**
1. Mostrar la animación de estrellas, la XP obtenida y la insignia «Primer experimento».
2. Decir: «Todo esto lo calculó una sola función transaccional, `fn_finalizar_intento`: estrellas, XP,
   racha e insignias, con bloqueo de fila. Si lo repito, solo gano el 25 % de XP».

**7:30 — Cambiar a docente (15 s)**
1. **Salir** → **Ingresar** con `docente@demo.arc.pe` / `quimica2026`.

**7:45 — Aula QUIM3A (40 s)**
1. Menú **Aulas** → «Ciencia y Tecnología 3.° A», código **QUIM3A**.
2. Mostrar el ranking (vista `v_ranking_aula` con `RANK() OVER`) y la matriz estudiante × nivel con
   estrellas y «en curso».
3. Señalar la fila «Estudiante Demo»: en producción refleja el nivel que acabas de completar.
   *(En modo demostración la matriz del aula es una instantánea fija.)*
4. Decir: «El docente ve quién se traba y dónde, sin pedir informes».

**8:25 — Dashboard (40 s)**
1. Menú **Dashboard**.
2. Señalar: KPIs, uso diario (vista materializada `mv_uso_diario`), embudo por nivel («Formación de la sal»
   cae a 57 %), preguntas con más errores y **Origen de las sesiones** (web, vscode, claude).
3. Decir: «Todo sale de vistas de PostgreSQL. El origen mide el reto de integraciones. Son datos semilla,
   no de un piloto real».

**9:05 — Volver a la presentación** (diapositiva 5). Los recorridos de Swagger, Actions, Pages y VS Code
van en sus diapositivas (abajo).

### Momentos técnicos cortos (dentro de sus diapositivas)

**Swagger — en la diap. 6, Arquitectura (30 s)**
1. Pestaña `<API>/api/docs`.
2. Abrir `POST /api/intentos/{id}/finalizar` y mostrar el candado (requiere JWT) y el esquema.
3. Decir: «El mismo esquema zod valida la petición y genera esta documentación».

**GitHub Actions — en la diap. 10, Automatizaciones (60 s)**
1. Pestaña `github.com/Laos19/Demov0.1AtomReactChamber/actions`.
2. Abrir la última ejecución de **backup.yml** → **Summary**: tamaño, SHA-256 y la tabla
   «filas origen vs. restaurado».
3. Volver y abrir **db.yml** → Summary: `update-testing-rollback` y el inventario de objetos.
4. Si sobra tiempo: **infra.yml** → «Reporte de pruebas superadas» y «Reporte de costos».

**GitHub Pages — en la diap. 15, Evidencias (20 s)**
1. Pestaña de Pages: mostrar `/db/` (diagrama ER), `/api/` (TypeDoc) y `/reportes/`.

**VS Code y MCP — en la diap. 12, Integraciones (40 s, opcional)**
1. VS Code → ícono del átomo en la barra de actividades → árbol **Misiones** con niveles y estrellas.
2. Paleta de comandos → `AtomReactChamber: Explicar reacción` → elegir `H₂ + O → …` o la combustión del
   carbono → webview con el perfil de energía.
3. MCP (si Claude Code está abierto): `/mcp` muestra `atomreactchamber` conectado; pedir
   «Explícame la combustión del carbono con su perfil de energía».

---

## Plan B por cada falla

| # | Falla | Señal | Plan B (qué hacer y qué decir) |
|---|---|---|---|
| B1 | Render dormido o lento | La app tarda > 12 s o aparece el aviso con el botón **Usar modo demostración** | Pulsar **Usar modo demostración**. Decir: «Esto es justo el arranque en frío del plan gratuito, y por eso diseñé un modo sin servidor que replica las reglas en el navegador». Seguir la demo igual. En la diapositiva 11 retomar: «este es el costo oculto del USD 0». |
| B2 | La API responde pero `db: "error"` en `/api/health` (Neon suspendido o caído) | `/api/health` → `"estado":"degradado"` | Esperar 20 s y recargar (Neon despierta su cómputo). Si sigue, usar modo demostración (B1). |
| B3 | Login falla con 401 en producción | «Correo o contraseña incorrectos» | Revisar que el correo esté bien escrito. Si los datos demo no están en producción, usar modo demostración: ahí las cuentas demo siempre funcionan. |
| B4 | La app de Render no carga (404 o error del sitio) | Página de error de Render | Abrir la demo de GitHub Pages (`…github.io/…/app/`). Es la misma app en modo sin servidor. |
| B5 | No hay internet en el aula | Nada carga | **Presentación**: `index.html` funciona sin internet (reveal.js y fuentes tienen copia local en `vendor/`); si algo falla, abrir el PDF. **App**: en la laptop, `npm run dev -w frontend` y abrir `http://localhost:5173` (modo demostración porque `VITE_API_URL` está vacío). **GitHub**: mostrar capturas de `docs/presentacion/img/` y los reportes descargados como artefactos. |
| B6 | Un paso no se completa en el nivel | La checklist no se marca | Paso 2: esperar unos segundos más (la temperatura sube poco a poco; debe sostenerse 2 s). Paso 3: bajar hasta 5 K. Si se traba, **Reiniciar** el nivel. Plan extremo: pedir la ayuda 3 (solución) y explicar que eso resta estrellas. |
| B7 | El cuestionario o «Ver resultado» da error 409 | Mensaje «faltan pasos» o «ya terminó» | Es una regla de negocio de la BD funcionando. Decirlo así y volver al mapa; mostrar el resultado en **Mi progreso**. |
| B8 | GitHub Actions no tiene ejecuciones recientes o están en rojo | Lista vacía o roja | Abrir una ejecución anterior en verde o el artefacto descargado. Si está en rojo por falta de secrets, explicar que el diseño omite los pasos de nube y deja el reporte («omitido: falta secret X»). |
| B9 | El proyector corta los bordes o se ve pequeño | Texto ilegible | Tecla **F** (pantalla completa) en reveal.js; `Ctrl` + `+` en la app. |
| B10 | La extensión de VS Code no conecta | Barra de estado en rojo | Explicar que la API está dormida (B1) y mostrar el árbol del **Catálogo**, que también falla sin API: pasar a la captura o saltar este punto (es opcional). |
| B11 | Te quedas sin tiempo | El docente avisa | Saltar a la diapositiva 16 (limitaciones) y 17 (preguntas). Las preguntas también puntúan. |

---

## Después de la demo
- Si alguien pregunta por algo del código, abrir el archivo en VS Code (las rutas están en
  `banco-de-preguntas.md`).
- Agradecer cada pregunta y, si un compañero propone una mejora, anotarla en voz alta como trabajo futuro:
  al docente le importa la participación.
