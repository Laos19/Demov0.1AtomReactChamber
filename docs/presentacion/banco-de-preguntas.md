# Banco de preguntas: sustentación de AtomReactChamber v2

> Base de Datos II · UPT · Ing. Patrick Cuadros Quiroga · Expone: Adriana Rafaela Laos González (2023077474)
>
> Respuestas modelo **basadas en el código real**. Cada una cita el archivo o la función para que puedas
> abrirlo en vivo si te repreguntan. Formato para responder en la exposición:
> **(1)** repite la pregunta, **(2)** responde en 30–45 s, **(3)** nombra el archivo o la función,
> **(4)** si la respuesta tiene un límite, dilo tú antes de que te lo pregunten.
>
> Regla de oro: si no lo sabes o no lo mediste, di «no lo medí todavía; lo anoto como trabajo futuro».
> Nunca inventes una cifra.

**Datos rápidos para memorizar**

| Dato | Valor | Dónde |
|---|---|---|
| Tablas | 29 en 5 dominios (seguridad, catálogo, juego, progreso, telemetría) | `db/changelog/sql/002…006` |
| Changesets Liquibase | 48, todos con `--rollback` | `db/changelog/db.changelog-master.yaml` |
| Funciones PL/pgSQL | 16 (9 de negocio + 7 de trigger) · 10 triggers | `007-funciones.sql`, `008-triggers.sql`, `009-vistas.sql` |
| Vistas | 6 vistas + 1 vista materializada (`mv_uso_diario`) | `009-vistas.sql` |
| Rutas de la API | 21 bajo `/api/*` · Swagger en `/api/docs` | `backend/src/routes/index.ts` |
| Pruebas | 17 API (BD real) · 15 motor · 19 extensión · 12 MCP = 63 | `backend/test`, `frontend/src/engine/engine.test.ts`, `extensions/vscode/test`, `integrations/mcp/test` |
| Niveles | 9 en 4 misiones (meta futura: ≥ 12) | `db/data/juego.json` |
| Glosario de Quimi | 39 términos | `db/data/juego.json › glosario` |
| Costo | USD 0/mes hoy; ≈ USD 38/mes en AWS o Azure | `infra/README.md §6` |
| Cuentas demo | `estudiante@demo.arc.pe` / `docente@demo.arc.pe` · `quimica2026` · aula `QUIM3A` | `902-datos-demo.sql`, `frontend/src/data/fuente.ts` |

---

## 1. Arquitectura

**1. ¿Cuál es la arquitectura del sistema?**
Monolito modular en tres capas. Clientes (web React, extensión VS Code, servidor MCP, skill de Claude Code)
→ API REST en Fastify 5 + TypeScript (`backend/src/app.ts`) → PostgreSQL 16 en Neon. La API se organiza en
rutas (`routes/index.ts`), servicios (`IntentoService`, `QuimiService`, `AulaService`) y repositorios
(`CatalogoRepository`, `JuegoRepository`, `DashboardRepository`), con inyección de dependencias manual en
`buildApp()`. Las reglas de negocio críticas están en la BD.

**2. ¿Por qué no microservicios?**
Una sola desarrolladora, un dominio pequeño y un plan gratuito con 512 MB de RAM. Microservicios añadirían
red, despliegues y consistencia distribuida sin beneficio. El monolito es *modular*: si un día Quimi pasa a
LLM y necesita escalar aparte, `QuimiService` ya tiene una interfaz propia que se puede extraer.

**3. La v0.1 decía Java/Spring Boot. ¿Por qué cambiaste a Node + Fastify?**
El frontend ya era TypeScript; un solo lenguaje permite compartir tipos y herramientas. Fastify valida cada
petición con JSON Schema (Ajv) y genera OpenAPI con el mismo esquema zod (`schemas.ts › js()`), así la
validación y la documentación no se desincronizan. Arranca rápido, lo que importa en un plan gratuito que se
duerme. La inconsistencia de la v0.1 está corregida en FD01/FD02 (observación 3 de `findings.md`).

**4. ¿Por qué no usaste un ORM (Prisma, TypeORM)?**
Porque la lógica está en funciones PL/pgSQL y vistas: un ORM escondería justo lo que este curso evalúa. Uso
`pg` con SQL parametrizado (`db/Database.ts › query()` y `tx()`), que es explícito y fácil de leer en clase.

**5. ¿Qué hace `Database.tx()`?**
Toma una conexión del pool, ejecuta `BEGIN`, corre la función, hace `COMMIT` y, ante cualquier excepción,
`ROLLBACK`; siempre libera la conexión en `finally`. Lo usan `IntentoService.iniciar()` y
`DashboardRepository.registrarEventos()`.

**6. ¿Por qué el pool tiene solo 5 conexiones?**
El plan gratuito de Neon admite pocas conexiones simultáneas y Render Free tiene una sola instancia. Cinco
conexiones bastan para la carga de un aula; con más usuarios se usaría el *pooler* de Neon (PgBouncer).

**7. ¿Cómo funciona el modo sin servidor?**
`frontend/src/data/fuente.ts` define la interfaz `Fuente` con dos implementaciones: `FuenteApi` (fetch a la
API) y `FuenteDemo` (contenido empaquetado en `contenido.generated.json` + progreso en `localStorage`,
clave `arc:demo:v1`). `crearFuente()` usa la demo si `VITE_API_URL` está vacío o si el usuario la eligió
(`arc:modo = demo`). Si la API no responde en 12 s, `AppContext.tsx` muestra el botón «Usar modo
demostración». Es el patrón *Strategy*.

**8. ¿El modo demo duplica las reglas de negocio? ¿No es un riesgo?**
Sí, replica estrellas, XP e insignias en TypeScript. Es un riesgo de divergencia aceptado: el modo demo no
guarda nada en el servidor, solo sirve para GitHub Pages y para cuando Render está dormido. La fuente de
verdad sigue siendo PostgreSQL.

**9. ¿Cómo se comunica el frontend con la API? ¿Hay WebSockets?**
REST + JSON sobre HTTPS, con JWT en el encabezado `Authorization: Bearer`. No hay WebSockets: la simulación
corre en el navegador y solo se envían eventos discretos (paso completado, ayuda, respuesta, finalizar).

**10. ¿Qué rompería primero con 10 000 estudiantes?**
En orden: (1) el plan gratuito de Render (una instancia, se duerme), (2) las 5 conexiones del pool,
(3) el refresco de `mv_uso_diario` en cada consulta del dashboard (`DashboardRepository.resumen(refrescar = true)`)
y (4) el rate limit en memoria, que no se comparte entre instancias. Solución: plan pago con varias
instancias, pooler de Neon, refresco programado de la vista materializada y Redis para el rate limit.

---

## 2. Base de datos

### Modelo y normalización

**11. ¿Está en tercera forma normal? Dame un ejemplo.**
Sí. Ejemplo: la entalpía de reacción ΔH dependería de las entalpías de formación de sus especies
(dependencia transitiva), así que **no se guarda**: se calcula en `v_reaccion_entalpia` como
ΣΔHf(productos) − ΣΔHf(reactivos). Las relaciones N:M tienen tabla propia: `especie_atomo`,
`reaccion_participante`, `matricula`, `aula_nivel`.

**12. `usuario.xp` es un dato derivado del historial. ¿No rompe la 3FN?**
Es desnormalización consciente. El ranking (`v_ranking_aula`) se consulta mucho y sumar todos los intentos
cada vez sería caro. Para evitar inconsistencias, **solo una función la escribe**: `fn_finalizar_intento`,
dentro de una transacción con bloqueo de fila. Lo mismo con `intento.aciertos` (trigger
`tg_respuesta_contar`) e `intento.pistas_usadas/xp_pistas` (trigger `tg_pista_usada_contar`).

**13. ¿Por qué usas `jsonb` en una BD relacional?**
Para `paso.condicion` (el DSL de verificación), `nivel.inicio` y `preset.parametros`. Son estructuras que
evolucionan con el juego y que la BD no necesita consultar por dentro. La BD sí valida su forma con
`CHECK` (por ejemplo, `jsonb_exists(condicion, 'todas') OR jsonb_exists(condicion, 'alguna')`). Si
algún día se filtrara por esas claves, se agregaría un índice GIN.

**14. ¿Qué claves primarias usaste y por qué?**
Identidades (`GENERATED ALWAYS AS IDENTITY`) para entidades con volumen (`usuario`, `intento`, `evento`);
claves naturales en catálogos estables (`elemento.simbolo`, `especie.codigo`, `reaccion.codigo`); claves
compuestas en tablas puente (`intento_paso (intento_id, paso_id)`). `sesion.id` es un UUID generado por el
cliente para permitir telemetría anónima sin ida y vuelta al servidor.

**15. ¿Qué restricciones de integridad hay, además de las FK?**
`CHECK` de dominio (grado 1–5, `xp >= 0`, formato de correo y de color), `CHECK` entre columnas
(`ck_intento_fin`: si el estado es `en_curso`, `finalizado_en` es nulo; `ck_intento_estrellas`: solo un
intento completado tiene estrellas; `racha_maxima >= racha_actual`), `UNIQUE` (`ux_nivel_casilla`, una
casilla por nivel) y el índice parcial `ux_opcion_una_correcta`.

### Reglas de negocio en PL/pgSQL

**16. ¿Por qué poner reglas de negocio en PL/pgSQL y no en la API?**
(1) Hay **cuatro clientes** y una sola fuente de verdad: ningún cliente puede saltarse la regla.
(2) **Atomicidad**: cerrar un intento toca `intento`, `usuario` y `logro_usuario`; en una función es una
sola transacción y un solo viaje de red. (3) La BD es la que conoce los datos: corregir respuestas con un
trigger evita confiar en el cliente. **Costo**: se acopla a PostgreSQL y es más difícil de depurar; lo
mitigo con Liquibase (`runOnChange:true` en funciones) y con pruebas de integración contra una BD real.

**17. Explica `fn_finalizar_intento` paso a paso.**
`007-funciones.sql`: (1) `SELECT … FOR UPDATE` sobre el intento; (2) si no está `en_curso` → excepción
`P0001`; (3) si faltan pasos → `'faltan pasos'`; (4) toma la ayuda máxima usada y llama a
`fn_calcular_estrellas`; (5) XP = `round(xp_base × estrellas / 3) + 10 × aciertos − xp_pistas`;
(6) si el nivel ya estaba completado, XP × 0,25; (7) marca el intento como completado; (8) suma XP al
usuario; (9) `fn_actualizar_racha`; (10) `fn_otorgar_insignias`. Devuelve estrellas, XP, XP total, racha,
si fue repetición e insignias nuevas.

**18. ¿Cómo llegan los errores de PL/pgSQL al usuario?**
Las funciones lanzan `RAISE EXCEPTION … USING ERRCODE = 'P0001'` (regla incumplida) o `'P0002'` (no
encontrado). `errors.ts › mapPgError()` los traduce a HTTP 409 y 404 con el mensaje en español. También
traduce `23505` (duplicado → 409) y `23503/23514/22P02` (FK, CHECK, formato → 400).

**19. ¿Qué hace el trigger `tg_respuesta_validar`?**
Es `BEFORE INSERT` en `respuesta`. Busca la opción elegida, verifica que pertenezca a la pregunta y al
nivel del intento y **sobrescribe** `NEW.es_correcta` con el valor de `opcion.es_correcta`. Aunque el
cliente mande `es_correcta = true`, la BD decide. Después, `tg_respuesta_contar` (`AFTER INSERT`) suma el
acierto al intento.

**20. ¿Cómo se garantiza que las ayudas de Quimi vayan en orden?**
`fn_usar_pista` exige que, para pedir la ayuda N, exista en `pista_usada` la ayuda N−1 del mismo paso. La
XP se cobra una sola vez porque la PK de `pista_usada` es `(intento_id, pista_id)`; si ya existía,
devuelve `ya_usada = true` y la API informa costo 0.

**21. ¿Cómo se valida que no se salten pasos?**
`fn_registrar_paso` bloquea el intento (`FOR UPDATE`), verifica que el paso pertenezca al nivel y que su
orden sea exactamente `pasos_completados + 1`; si no, `'paso fuera de orden'`. La prueba
«inicia el nivel 1 y valida el orden de los pasos» de `api.test.ts` lo cubre.

### Transacciones y concurrencia

**22. ¿Qué pasa si el estudiante pulsa «Finalizar» dos veces a la vez?**
Ambas peticiones llaman a `fn_finalizar_intento`. La primera toma el bloqueo de fila con `FOR UPDATE`; la
segunda espera. Cuando la primera hace COMMIT, la segunda relee la fila (en READ COMMITTED,
`SELECT … FOR UPDATE` ve la versión confirmada), encuentra `estado = 'completado'` y lanza
`'el intento ya terminó'` → HTTP 409. No hay doble XP.

**23. ¿Qué nivel de aislamiento usas?**
El predeterminado de PostgreSQL, READ COMMITTED, más bloqueos explícitos de fila donde importa
(`FOR UPDATE` en `fn_finalizar_intento`, `fn_registrar_paso` y sobre `usuario` en `fn_actualizar_racha`).
SERIALIZABLE obligaría a reintentar transacciones en la API sin un beneficio claro aquí.

**24. ¿Hay algún caso de concurrencia que no esté cubierto?** *(dilo tú si nadie lo pregunta)*
Sí. `IntentoService.iniciar()` abandona los intentos en curso y crea uno nuevo, pero no hay un índice único
parcial que impida **dos intentos `en_curso` del mismo nivel** si llegan dos `POST /intentos` exactamente a
la vez. En ese caso extremo, dos finalizaciones simultáneas podrían ambas no verse como repetición. La
corrección es una línea:
`CREATE UNIQUE INDEX ux_intento_en_curso ON intento (usuario_id, nivel_id) WHERE estado = 'en_curso';`
Está en trabajo futuro.

**25. ¿Puede haber un *deadlock*?**
Es poco probable: cada función bloquea primero `intento` y luego `usuario`, siempre en el mismo orden.
Si ocurriera, PostgreSQL detecta el ciclo, aborta una transacción (`40P01`) y la API respondería 500; el
cliente puede reintentar.

### Índices

**26. ¿Qué índices especiales usaste y por qué?**
- **Parcial único** `ux_opcion_una_correcta ON opcion (pregunta_id) WHERE es_correcta`: a lo más una
  alternativa correcta por pregunta (una regla de negocio expresada como índice).
- **Parciales** `ix_intento_completado … WHERE estado = 'completado'` y
  `ix_respuesta_pregunta … WHERE NOT es_correcta`: solo indexan las filas que consultan las vistas.
- **GIN** `ix_glosario_busqueda` sobre la columna `tsvector` generada: búsqueda de texto completo.
- **BRIN** `ix_evento_creado` y `ix_sesion_inicio`: tablas que solo crecen en orden de tiempo.
- **Funcional** `ux_usuario_email ON usuario (lower(email))`: correo único sin distinguir mayúsculas.
- `010-indices-fk.sql`: índices en claves foráneas que `tbls lint` detectó sin cubrir.

**27. ¿Por qué BRIN y no B-tree en `evento.creado_en`?**
`evento` es *append-only* y se inserta en orden cronológico, así que las páginas físicas ya están ordenadas
por fecha. BRIN guarda solo el mínimo y el máximo por bloque de páginas: ocupa una fracción de un B-tree y
casi no encarece las inserciones. Para rangos de fechas (los últimos 30 días del dashboard) es suficiente.
Si la tabla se desordenara (por ejemplo, con inserciones atrasadas), BRIN perdería eficacia.

**28. ¿Para qué sirve el índice funcional sobre `lower(email)`?**
Hace cumplir la unicidad sin importar mayúsculas (`Ana@x.pe` = `ana@x.pe`) y acelera el login, que busca
con `WHERE lower(email) = lower($1)` (`AuthService.login()`). La prueba «rechaza correo duplicado» lo
verifica.

### Vistas, vista materializada y búsqueda de texto completo

**29. ¿Cuál es la diferencia entre tus vistas y la vista materializada?**
Una vista normal es una consulta guardada: siempre muestra datos actuales y no ocupa espacio. Una vista
materializada guarda el resultado y hay que refrescarla. Uso materializada solo en `mv_uso_diario` porque
genera 30 días con subconsultas sobre `sesion`, `evento`, `intento` y `pista_usada`, las tablas que más
crecen. El resto (`v_estadisticas_nivel`, `v_ranking_aula`…) son baratas y deben estar al día.

**30. ¿Qué significa `REFRESH MATERIALIZED VIEW CONCURRENTLY`?**
Recalcula la vista sin bloquear las lecturas: construye el resultado nuevo y aplica las diferencias. Exige
un índice único sobre la vista, por eso existe `ux_mv_uso_diario_dia`. Se ejecuta en
`fn_refrescar_dashboard()`. Limitación: hoy se refresca en **cada** consulta al dashboard; con más uso
convendría refrescarla cada cierto tiempo (por ejemplo, con `pg_cron` o un workflow).

**31. ¿Cómo funciona la búsqueda de Quimi?**
`001-extensiones.sql` crea la configuración `es_sin_tildes` (copia de `spanish` + `unaccent` +
`spanish_stem`). `glosario.busqueda` es una columna `tsvector` **generada** (término con peso A,
definición con peso B) con índice GIN. `fn_quimi_buscar` usa `websearch_to_tsquery` y ordena por
`ts_rank`. Por eso «energia de activacion» sin tildes encuentra «Energía de activación».

**32. ¿Quimi es inteligencia artificial?**
No, y lo digo a propósito. Es un asistente **basado en reglas y en la BD**: pistas escalonadas escritas a
mano por paso y búsqueda de texto completo en un glosario de 39 términos (`QuimiService`). Si no encuentra
nada, sugiere abrir una pista. En la 3.ª unidad se puede reemplazar por un LLM sin cambiar la interfaz
`preguntar(consulta, nivel, paso)`.

**33. ¿Qué hace `v_ranking_aula`?**
Une `matricula` con `v_progreso_estudiante` y calcula `RANK() OVER (PARTITION BY aula_id ORDER BY xp DESC,
estrellas_totales DESC)`. `RANK` deja huecos en empates (1, 1, 3); si se quisiera sin huecos sería
`DENSE_RANK`.

### Auditoría, backups y Liquibase

**34. ¿Cómo funciona la auditoría?**
`fn_auditar()` es un trigger genérico `AFTER INSERT/UPDATE/DELETE` en `usuario` y `aula` (y en
`UPDATE/DELETE` de `nivel` y `paso`). Guarda la fila antes y después en `jsonb`, **quitando
`password_hash`**, e ignora los UPDATE que no cambian nada. Limitación: `usuario_bd` registra el usuario de
la BD (siempre el de la app), no el usuario de la aplicación; para eso habría que pasar el id con
`SET LOCAL app.usuario_id`.

**35. ¿Cuál es tu estrategia de copias de seguridad?**
`backup.yml`, diario a las 03:17 de Lima: `pg_dump -Fc --compress=9`, **restauración de verificación** en
un PostgreSQL 16 limpio comparando el conteo de filas de cada tabla (si una difiere, el workflow falla),
SHA-256 y cifrado AES-256 con `BACKUP_PASSPHRASE` antes de subirlo. Retención abuelo-padre-hijo: 7 diarias,
4 semanales, 3 mensuales. Además, Neon guarda historial point-in-time de 6 horas.

**36. ¿Cuál es tu RPO y RTO?**
**RPO**: hasta 6 horas atrás, minutos (PITR de Neon); más allá, hasta 24 horas (respaldo diario).
**RTO**: la BD pesa pocos MB; `pg_restore` tarda minutos, y el reporte de `backup.yml` mide la duración
real de la restauración en cada ejecución. No los formalicé como SLA con un cliente: son objetivos técnicos.

**37. ¿Cómo sabes que un respaldo realmente sirve?**
Porque cada respaldo se restaura automáticamente y se comparan los conteos de filas tabla por tabla con el
origen. «Un respaldo que nunca se restauró no es un respaldo».

**38. ¿Cómo haces rollback con Liquibase?**
Cada changeset tiene su bloque `--rollback` (por ejemplo, `--rollback DROP TABLE usuario;`). Se revierte con
`liquibase rollback-count N` o hasta un tag. `db.yml` ejecuta `update-testing-rollback`: aplica, revierte y
vuelve a aplicar todos los changesets en una base limpia, lo que demuestra que cada rollback funciona.

**39. ¿Qué pasa si modifico una función ya desplegada?**
Las funciones y vistas usan `runOnChange:true`: Liquibase detecta que cambió el checksum y vuelve a ejecutar
el `CREATE OR REPLACE`. Las tablas no: un cambio de tabla es un changeset **nuevo** (como
`010-indices-fk.sql`), nunca se edita uno ya aplicado.

**40. ¿Por qué Liquibase con SQL y no con XML o YAML?**
El SQL formateado es el que se evalúa en Base de Datos II, se lee sin traducir y permite PL/pgSQL tal cual
(`splitStatements:false`). El maestro en YAML solo define el orden.

**41. ¿De dónde salen los datos semilla?**
De `db/data/catalogo.json` y `db/data/juego.json` (única fuente de verdad). `npm run seed:generate` genera
`900-semilla-catalogo.sql`, `901-semilla-juego.sql` y el `contenido.generated.json` del frontend, así la BD
y el modo demo tienen el mismo contenido. `902-datos-demo.sql` crea el aula `QUIM3A` con 13 estudiantes
ficticios.

---

## 3. Seguridad

**42. ¿Cómo se guardan las contraseñas?**
Con bcrypt, costo 10 (`AuthService.BCRYPT_COSTO`), que incluye sal por contraseña. Nunca en texto plano y
nunca aparecen en la auditoría ni en los logs (Fastify redacta `body.password`).

**43. ¿Cómo funciona la autenticación con JWT?**
`POST /api/auth/login` verifica bcrypt y firma un JWT (HS256, `@fastify/jwt`) con `{ sub, rol, nombre }`,
válido 7 días. Las rutas privadas usan `app.autenticar` o `app.requiereRol('docente', 'admin')`. El
secreto debe tener ≥ 32 caracteres o la API no arranca (`config.ts`, zod). En Render lo genera la propia
plataforma (`generate_value = true` en Terraform).

**44. ¿Por qué el JWT está en `localStorage` y no en una cookie httpOnly?**
Por simplicidad entre dominios distintos (sitio y API en subdominios de Render). El riesgo: un XSS podría
leer el token. Lo mitigo con React (escapa por defecto) y sin HTML inyectado, pero la solución correcta es
cookie `httpOnly; Secure; SameSite` + refresh token. Está en trabajo futuro.

**45. ¿Cómo se revoca un token robado?**
Hoy no se puede antes de que expire (7 días): no hay lista de revocación. Opciones: tokens cortos + refresh
token, o una columna `usuario.token_version` que se compare en cada petición. También: si se cambia el rol de
un usuario, su token viejo conserva el rol anterior hasta expirar.

**46. ¿Es vulnerable a inyección SQL?**
No en lo que escribí: **todas** las consultas usan parámetros `$1, $2…` (`Database.query(text, params)`).
Incluso los lotes de eventos se insertan con `jsonb_to_recordset($3::jsonb)` en lugar de concatenar
valores. Además, Ajv valida tipos y elimina propiedades no declaradas (`removeAdditional: 'all'`).

**47. ¿Qué evita que alguien haga fuerza bruta al login?**
`@fastify/rate-limit`: 10 peticiones por minuto en `/auth/login` y `/auth/registro`, 60 en `/eventos` y 300
globales. El mensaje de error es genérico («Correo o contraseña incorrectos») para no revelar si el correo
existe. Limitación: el contador vive en memoria de la instancia.

**48. ¿Cómo está configurado CORS?**
`CORS_ORIGIN` es una lista de orígenes permitidos separados por coma; Terraform la llena con la URL del
sitio (`modules/app-render`). Solo se permiten `GET`, `POST` y `OPTIONS`. En desarrollo el valor por defecto
es `*`.

**49. ¿Cualquiera puede registrarse como docente?**
No: necesita el código de invitación `DOCENTE_CODIGO` (`AuthService.registrar()`; si no coincide → 403).
**Hallazgo honesto:** el valor por defecto en `config.ts` es `UPT2026` y el módulo Terraform no define esa
variable, así que en producción hay que configurarla en Render; de lo contrario, queda el valor por defecto.

**50. ¿Cómo cumples la Ley 29733 de protección de datos personales?**
Minimización (nombre, correo y grado; sin DNI ni fecha de nacimiento), telemetría que puede ser anónima
(UUID de sesión generado por el cliente), respaldos cifrados, TLS hacia Neon, auditoría sin hashes y
secretos solo en GitHub Secrets. **Lo que falta (decisión de Adriana, trabajo futuro):** el reglamento
(D. S. 016-2024-JUS) exige el **consentimiento de padres o tutores para menores de 14 años**; ese flujo aún
no existe y es requisito antes de un piloto con menores reales. También falta una política de privacidad
publicada y el procedimiento de derechos ARCO.

**51. ¿Qué impide hacer trampa en el juego?**
La BD impide: saltarse pasos (orden secuencial), saltarse el cuestionario (`'faltan pasos'`), elegir la
respuesta correcta desde la consola (el trigger corrige), cobrar menos XP por las pistas (las cuenta un
trigger) y repetir un nivel para «farmear» XP (25 %). Lo que **no** impide: un estudiante con conocimientos
técnicos podría llamar a `POST /intentos/:id/pasos` sin haber hecho el experimento, porque la verificación
física corre en el navegador. Para una tarea escolar acepto el riesgo; para un examen haría falta repetir la
simulación en el servidor con la misma semilla.

**52. ¿Qué otras cabeceras o controles de seguridad hay?**
`@fastify/helmet` (cabeceras como `X-Content-Type-Options`, HSTS), aunque con CSP desactivada en la API
para que funcione Swagger UI. Las vistas web de la extensión VS Code sí tienen CSP estricta
(`script-src 'none'`). CodeQL semanal (`codeql.yml`) y Dependabot.

---

## 4. DevOps, infraestructura y costos

**53. ¿Dónde está el estado de Terraform?**
En HCP Terraform (plan Free): estado remoto cifrado, con bloqueo e historial (bloque `cloud {}` en
`envs/prod`). Alternativa documentada: backend `pg` en otra base Neon, creada a mano y distinta de producción
para evitar el problema del huevo y la gallina. Nunca en el repositorio (`.gitignore`).

**54. ¿Cómo manejas los secretos?**
Solo en GitHub Secrets (`NEON_API_KEY`, `RENDER_API_KEY`, `LIQUIBASE_*`, `DATABASE_URL`,
`BACKUP_PASSPHRASE`…; lista en `infra/README.md §4`). `JWT_SECRET` lo genera Render. Si falta un secreto,
el paso de nube se omite con `omitido: falta secret X` y el workflow sigue en verde.

**55. ¿Qué pasa si falla un despliegue?**
`release.yml` va en orden: (1) Liquibase `update` en producción; si falla, **no se dispara ningún
despliegue** y la API sigue con la versión anterior. En PostgreSQL el DDL es transaccional, así que cada
changeset se aplica completo o no se aplica. (2) Deploy hook de la API; si Render no llega a `live`, mantiene
la versión anterior en servicio. (3) Sitio estático. (4) Smoke test `GET /api/health` con reintentos; si
falla, el workflow queda en rojo. Para volver atrás: redesplegar la versión anterior en Render y, si hace
falta, `liquibase rollback-count`.

**56. ¿Por qué Liquibase corre antes que la API?**
Los servicios de Render se crean con `auto_deploy_trigger = "off"`: así la API nunca arranca con código
nuevo sobre un esquema viejo. Por eso los cambios de esquema deben ser compatibles hacia atrás (agregar
columnas, no renombrarlas en un solo paso).

**57. ¿Cómo funciona release-please?**
Lee los *Conventional Commits* (`feat:`, `fix:`, `db:`, `docs:`…) y mantiene un PR `chore: release x.y.z`
con el `CHANGELOG.md`. Al fusionarlo crea el tag `vX.Y.Z` y el GitHub Release con
`atomreactchamber-frontend-<v>.zip`, `atomreactchamber-backend-<v>.zip`, el `.vsix` y `SHA256SUMS.txt`.

**58. ¿Cuánto cuesta y cuál es el costo oculto?**
USD 0/mes (Neon Free + Render Free + GitHub Pages + HCP Free). Costo oculto: Render suspende la API tras 15
minutos sin tráfico y tarda alrededor de un minuto en despertar; la BD gratuita tiene 0,5 GB. La referencia
de pago es ≈ USD 38/mes en AWS (RDS t4g.micro + Fargate + ALB + S3/CloudFront) o en Azure (Flexible Server
B1ms + App Service B1 + Static Web Apps); son precios de lista aproximados que Infracost recalcula en
`infra.yml`.

**59. ¿Cómo migrarías a Azure o AWS?**
`envs/prod` solo depende del **contrato de salidas** de los módulos (`connection_uri`, `jdbc_url`,
`api_url`, `web_url`). Se escribe un módulo nuevo con esas salidas, se cambia el `source`, se restaura un
`pg_dump` de `backup.yml` y se reemplazan los deploy hooks por la acción del proveedor. Liquibase, las
pruebas y la documentación no cambian (sigue siendo PostgreSQL 16). Detalle en `infra/README.md §7`.

**60. ¿Qué es el «reporte de pruebas superadas»?**
En `infra.yml`, un contenedor `postgres:16` se migra con Liquibase; luego Vitest (backend con BD real y
frontend) y Playwright generan JUnit, que `.github/scripts/junit-summary.mjs` convierte en una tabla en el
Job summary y en anotaciones.

**61. ¿Qué se publica en GitHub Pages?**
`pages.yml` construye `site/`: portada, `/api/` (TypeDoc), `/db/` (ER + diccionario de tbls), `/diagramas/`,
`/reportes/` (pruebas, costos, Liquibase, backups) y `/app/`, la demo del frontend en modo sin servidor.

---

## 5. Frontend y motor de simulación

**62. ¿Qué física simula el motor?**
`frontend/src/engine/Simulation.ts`: discos rígidos en 2D con choques elásticos, termostato de Berendsen
para llevar la temperatura de la cámara a la elegida, reacciones por colisión cuando la energía del choque
supera la Eₐ (con factor estérico como probabilidad de orientación), fotólisis UV y cambios de fase. Es un
modelo **pedagógico**, no dinámica molecular.

**63. ¿Cómo calculas el punto de ebullición con presión?**
Con Clausius-Clapeyron (`chemistry.ts › ebullicionA`):
`1/T_b = 1/T_ref − R·ln(P/P_ref)/ΔH_vap`. Con ΔH_vap del agua = 40,7 kJ/mol, el agua hierve a ~394 K con
2 atm y ~354 K con 0,5 atm; lo verifica una prueba del motor. Es el nivel 3, «La presión cambia el punto de
ebullición».

**64. ¿Cómo sabe el simulador si un fotón rompe un enlace?**
E = 119 627 / λ kJ/mol (λ en nm; `energiaFoton`). Si E ≥ energía de enlace, hay fotólisis con cierta
probabilidad. Ejemplo probado: 240 nm rompe O=O (498 kJ/mol) y 250 nm no.

**65. ¿Qué es el DSL de condiciones?**
Un mini lenguaje en JSON guardado en `paso.condicion`: `{ "todas" | "alguna": [ { metrica, op, valor, tol? } ],
"durante": s }`. Métricas: `temperatura`, `presion`, `volumen`, `uv`, `lambda`, `conteo:<sp>`,
`fase:<sp>`, `reacciones:<rx>`, `fotolisis:<sp>`, `chispas`, `razon:<A>:<B>`… Operadores `>=`, `<=`,
`==`, `>`, `<` y `approx` con tolerancia. `SeguidorDePaso` exige que la condición se sostenga `durante`
segundos (`conditions.ts`). Ventaja: un docente o diseñador puede crear pasos nuevos sin programar.

**66. ¿Cómo pruebas que los 9 niveles se pueden completar?**
`engine.test.ts` tiene un «solucionador»: para cada nivel aplica la solución de cada paso (por ejemplo,
nivel 1: inyectar 20 H₂, subir a 650 K, bajar a 5 K), simula hasta 90 s por paso con un PRNG determinista
(mulberry32) y exige que `SeguidorDePaso` se cumpla. Si alguien cambia un dato del catálogo y un nivel se
vuelve imposible, la CI falla.

**67. ¿Los datos químicos son reales?**
Las ΔHf°, masas molares y puntos de fusión/ebullición vienen de NIST/CRC y llevan el CID de PubChem. Las
**energías de activación son valores pedagógicos** escalados para que las reacciones ocurran en segundos;
el pie de la app y el `COMMENT ON COLUMN reaccion.ea_kj_mol` lo dicen.

**68. ¿Qué hiciste por la accesibilidad (WCAG 2.2 AA)?**
Tipografía Atkinson Hyperlegible (Braille Institute), contraste ≥ 4,5:1, foco visible de 3 px, objetivos
táctiles ≥ 44 px, controles de la cámara con `<input type="range">` etiquetados, anuncios con `aria-live`
cuando se completa un paso (`Nivel.tsx`), el mapa como cuadrícula de botones con nombre accesible y
`prefers-reduced-motion`. **Pendiente:** la meta OS-6 (Lighthouse ≥ 90) todavía no tiene un workflow de
Lighthouse CI que la mida.

**69. ¿Por qué Canvas y no SVG o una librería 3D?**
Cientos de partículas a 60 fps se dibujan mejor en Canvas 2D; SVG crearía cientos de nodos del DOM. 3D
(Three.js) queda como trabajo futuro: no aporta a los conceptos de secundaria que cubren los 9 niveles y
pesaría más en las computadoras de los colegios.

---

## 6. Gamificación y pedagogía

**70. ¿Por qué estrellas y XP? ¿No distrae del aprendizaje?**
La evidencia es favorable pero condicionada: Sailer y Homner (2020) hallan g = 0,49 en aprendizaje
cognitivo, y funciona mejor cuando los puntos refuerzan el objetivo de aprendizaje. Por eso las estrellas
**premian no depender de la solución y acertar el cuestionario** (`fn_calcular_estrellas`), no la rapidez.

**71. ¿Por qué las repeticiones dan solo 25 % de XP?**
Para evitar el *farming*: repetir el nivel 1 muchas veces para subir en el ranking. Repetir sigue sumando
algo, porque repasar es bueno, pero no compensa más que avanzar. Lo prueba «una repetición da solo 25 % de
XP» en `api.test.ts`.

**72. ¿Por qué las pistas cuestan XP?**
Para que el estudiante intente antes de pedir ayuda, sin prohibirla: 5, 10 y 20 XP (`juego.json ›
costos_pista`). Además, abrir la explicación o la solución resta estrellas. El objetivo OS-5 mide que la
solución se pida en ≤ 30 % de los pasos.

**73. ¿Cómo sabes que el estudiante aprende?**
Todavía no lo sé: el piloto no se hizo. Está instrumentado: OI-2 mide la ganancia normalizada de Hake con
cuestionario pre/post (meta ⟨g⟩ ≥ 0,30 con n ≥ 30) y OS-3, la mejora en el cuestionario. Las métricas del
dashboard son de datos semilla ficticios.

**74. ¿Reemplaza al laboratorio real?**
No. La evidencia (Li y Liang, 2024; Rutten et al., 2012) dice que los laboratorios virtuales funcionan como
**complemento y preparación**. Sirve sobre todo para prácticas peligrosas o caras (sodio con agua, cloro,
hidrógeno) y para colegios sin laboratorio.

**75. ¿Cómo se alinea al currículo?**
Cada misión registra la competencia del CNEB (`mision.competencia`), en particular «Indaga mediante métodos
científicos para construir sus conocimientos». Cada nivel tiene grado (1.º–5.º), objetivo y concepto por
paso.

---

## 7. Integraciones

**76. ¿Qué es MCP y en qué se diferencia de llamar a la API con curl?**
*Model Context Protocol* es un estándar para que un agente de IA descubra y use herramientas con un esquema
(nombre, descripción, parámetros validados con zod). Con curl, el humano decide qué endpoint llamar; con MCP,
el agente ve `buscar_especie`, `explicar_reaccion`, `listar_niveles`, `preguntar_quimi` y
`resumen_dashboard` y decide cuál usar. `integrations/mcp` usa `@modelcontextprotocol/sdk` por stdio.

**77. ¿Qué hace la extensión de VS Code?**
Árboles de misiones y catálogo, «Preguntar a Quimi», ficha de especie con enlace a PubChem, «Explicar
reacción» con perfil de energía en SVG, inicio de sesión (JWT en `SecretStorage`) y barra de estado con el
estado de la API y la XP. Sus vistas web tienen CSP `script-src 'none'` y todo se escapa con `escapeHtml`.
Se empaqueta como `.vsix` en cada release.

**78. ¿Qué es la skill y el subagente de Claude Code?**
La skill `atomreactchamber` (`.claude/skills/atomreactchamber/scripts/arc.sh`) consulta la API con curl y da
formato con Node. El subagente `tutor-quimi` (`.claude/agents/tutor-quimi.md`) explica en tres capas
(idea → partículas → dato del laboratorio), da pistas escalonadas y no revela respuestas del cuestionario.

**79. ¿Cómo mides el uso de cada integración?**
Todas envían eventos a `POST /api/eventos` con `origen` (`web`, `vscode`, `mcp`, `claude`), restringido en
la BD con `CHECK (origen IN (…))` en `sesion`. El dashboard agrupa por origen. Cada integración permite
desactivar la telemetría (`ARC_TELEMETRIA=0`, `atomreactchamber.telemetria: false`).

**80. ¿Las integraciones duplican lógica?**
No: son clientes delgados de la misma API, sin datos ni reglas propias. Si cambia una regla en PostgreSQL,
todas la respetan sin tocarse.

---

## 8. Limitaciones: ¿qué NO hace el sistema?

**81. ¿Qué no hace AtomReactChamber?** *(respuesta lista para leer)*
- No es dinámica molecular real: 2D, pocas partículas, Eₐ pedagógicas.
- No tiene laboratorio 3D, números cuánticos, editor de prácticas para el docente ni reportes PDF por
  correo (alcance inflado de la v0.1, movido a trabajo futuro).
- Quimi no es un LLM: no entiende preguntas libres fuera del glosario.
- No verifica la física en el servidor: confía en que el cliente ejecutó el experimento.
- No tiene flujo de **consentimiento parental para menores de 14 años** (trabajo futuro, D. S.
  016-2024-JUS).
- No sincroniza el progreso del modo demo con el servidor.
- No tiene app móvil nativa (la web es responsiva).
- No revoca tokens ni usa refresh tokens.
- Esta versión trae **9 niveles**; llegar a ≥ 12 es meta futura (OS-1).
- No se ha hecho el piloto: los objetivos de aprendizaje y usabilidad no están medidos.

**82. ¿Qué harías distinto si empezaras de nuevo?**
Pondría desde el inicio el índice único parcial de intentos en curso, cookies httpOnly y el flujo de
consentimiento parental, y mediría Lighthouse en la CI desde el primer día.

**83. ¿Qué cambia en la 3.ª unidad?**
Quimi con un modelo de lenguaje detrás de `QuimiService` (mismo contrato), usando el glosario y el concepto
del paso como contexto (RAG) y conservando la regla de no dar la respuesta.

**84. Encontré un comentario en `fn_quimi_buscar` que dice «si no hay coincidencias, usa similitud por
prefijo». ¿Dónde está eso?** *(por si alguien lee el código)*
Buena observación: ese comentario está desactualizado. La función solo hace búsqueda de texto completo; el
«plan B» cuando no hay resultados está en `QuimiService`, que responde sugiriendo una pista. Lo corrijo con
un changeset `runOnChange`.

---

## 9. Preguntas para lanzar al público

> El profesor valora que **los compañeros participen**. Si hay silencio de más de 5 segundos, lanza una de
> estas. Escucha, agradece, conecta su respuesta con el código y luego da tu respuesta.

1. **«¿Cómo harían trampa en este juego?»** — siempre genera participación. Lleva a la pregunta 51:
   el trigger corrige respuestas, el orden de pasos lo valida la BD, pero la física corre en el cliente.
2. **«Si fueran el DBA, ¿pondrían estas reglas en PL/pgSQL o en la API?»** — debate sano; tu postura en la
   pregunta 16 (cuatro clientes, atomicidad) y su costo (acoplamiento a PostgreSQL).
3. **«`usuario.xp` está guardado aunque se puede calcular. ¿Lo quitarían para cumplir la 3FN?»** — conecta
   con la pregunta 12 (desnormalización consciente con un solo escritor).
4. **«¿Qué tabla creen que va a crecer más rápido y qué índice le pondrían?»** — respuesta: `evento`;
   BRIN por fecha (pregunta 27).
5. **«Dos estudiantes pulsan "Finalizar" al mismo tiempo en el mismo intento. ¿Qué pasa?»** — pregunta 22
   (`FOR UPDATE`) y, si alguien es muy bueno, el caso no cubierto de la pregunta 24.
6. **«¿Cuántos de ustedes hicieron en el colegio la práctica de sodio con agua?»** — conecta con el
   problema: prácticas peligrosas que no se hacen; el nivel 6 la simula.
7. **«Si mañana se cae Render, ¿qué harían para seguir dando clase?»** — modo demostración, backups y
   migración por módulos de Terraform (preguntas 7, 35 y 59).
8. **«¿Las estrellas los motivarían o les parecería infantil? ¿A qué edad deja de funcionar?»** — conecta
   con gamificación y evidencia (pregunta 70) y con el público de 12 a 17 años.

---

## 10. Si te preguntan algo que no sabes

- «Esa parte no la medí; con los datos actuales no puedo afirmarlo. Lo agrego como trabajo futuro».
- «Buena pregunta; no lo había considerado. Mi primera idea sería… ¿ustedes qué harían?» (devuelve la
  pregunta al público: suma participación).
- Abre el archivo y búscalo en vivo con calma: el código está organizado para eso.
