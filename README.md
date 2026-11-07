# AtomReactChamber

**Laboratorio virtual de química gamificado para estudiantes de secundaria del Perú.**
Cada casilla de la tabla periódica es una práctica guiada: el estudiante calienta, comprime, ilumina y mezcla
en un simulador molecular; el motor verifica cada paso, el asistente **Quimi** ayuda (cobrando XP) y un
cuestionario final otorga estrellas, experiencia e insignias. El docente crea aulas, asigna niveles y sigue el
progreso en un dashboard calculado en PostgreSQL.

> Proyecto del curso **Base de Datos II** — Universidad Privada de Tacna, Facultad de Ingeniería, EPIS.
> Docente: Ing. Patrick Cuadros Quiroga · Autora: **Adriana Rafaela Laos González** (2023077474) · 2026.

| | Enlace |
|---|---|
| Aplicación (Render) | _se publica al ejecutar `infra.yml` + `release.yml` con los secrets configurados_ |
| Demo sin servidor + documentación técnica (GitHub Pages) | `https://laos19.github.io/demov0.1atomreactchamber/` |
| API (Swagger) | `<url-api>/api/docs` |
| Cuentas de demostración | `estudiante@demo.arc.pe` · `docente@demo.arc.pe` — contraseña `quimica2026` |

## Qué hace

- **Mapa de misiones** con la silueta de la tabla periódica: 9 niveles en 4 misiones (estados de la materia,
  combustión, familias de la tabla, luz y reacciones), alineados a las competencias del CNEB de Ciencia y Tecnología.
- **Niveles guiados**: cada paso tiene una condición verificable (DSL en JSON guardado en la BD, p. ej.
  `temperatura ≥ 600 K durante 2 s`) que el motor evalúa en vivo.
- **Quimi**: ayudas escalonadas (pista → explicación → solución, con costo en XP) y glosario con búsqueda
  de texto completo en español sin tildes.
- **Gamificación**: XP, 1–3 estrellas, racha diaria, 8 insignias, ranking por aula. Repetir un nivel da 25 % de XP.
- **Docentes**: aulas con código de 6 caracteres, asignación de niveles, matriz de progreso estudiante × nivel.
- **Dashboard de uso**: sesiones diarias, embudo por nivel, pasos lentos, preguntas con más errores, uso por integración.
- **Laboratorio libre**: el simulador completo (presets, inyector, consola de eventos, fichas de PubChem).
- **Modo demostración** sin servidor (contenido incluido + localStorage) para GitHub Pages o si el servidor gratuito duerme.

## Arquitectura

```
frontend/          React 18 + Vite + TypeScript · motor de simulación (engine/) · canvas 2D
backend/           Node 22 + Fastify + TypeScript · JWT + roles · OpenAPI · pg
db/                Liquibase (changelogs SQL con rollback) · db/data/*.json = fuente única del contenido
infra/terraform/   Neon (PostgreSQL) + Render (API + sitio) · referencia de costos AWS/Azure
extensions/vscode/ Extensión de VS Code          integrations/mcp/  Servidor MCP
.claude/           Skill y agente de Claude Code  .github/workflows/  7 automatizaciones + CodeQL
docs/              FD01–FD05, diccionario, estándar, diagramas, presentación
```

Las reglas de negocio viven en la base de datos: `fn_finalizar_intento` calcula estrellas y XP en una
transacción, un trigger corrige las respuestas (el cliente no decide si acertó), otro descuenta la XP de las
ayudas y `fn_otorgar_insignias` evalúa los logros. Ver [FD04 — Arquitectura](docs/fd/FD04-Informe-SAD.md).

### Métricas

<!-- AUTO:metricas:inicio -->
| Métrica | Valor |
|---|---|
| Tablas | 29 |
| Vistas / vistas materializadas | 6 / 1 |
| Funciones PL/pgSQL y SQL | 16 |
| Triggers | 10 |
| Índices declarados | 30 |
| Changesets de Liquibase | 48 |
| Endpoints REST | 21 |
| Niveles / pasos / preguntas | 9 / 29 / 27 |
| Pruebas automáticas (API + motor) | 17 + 15 |
<!-- AUTO:metricas:fin -->

## Base de datos

### Diccionario de datos (resumen)

<!-- AUTO:diccionario:inicio -->
| Tabla | Descripción |
|---|---|
| `rol` | Roles de acceso de la aplicación (estudiante, docente, administrador). |
| `usuario` | Cuentas de estudiantes, docentes y administradores, con su experiencia (XP) y racha. |
| `auditoria` | Registro de cambios (insert/update/delete) en tablas sensibles, llenado por fn_auditar(). |
| `elemento` | Elementos químicos que aparecen como átomos en el simulador (color CPK y radio de dibujo). |
| `especie` | Especies químicas del catálogo con datos termodinámicos estándar (NIST/CRC) y CID de PubChem. |
| `especie_atomo` | Átomos que componen cada especie y su posición relativa para dibujarla (relación N:M especie–elemento). |
| `reaccion` | Reacciones elementales que el motor evalúa en cada colisión. ΔH se calcula en la vista v_reaccion_entalpia. |
| `reaccion_participante` | Especies que participan en cada reacción como reactivo o producto (máx. 2 por lado). |
| `fotolisis` | Moléculas que se rompen con fotones de energía ≥ enlace (E = 119 627 / λ kJ/mol). |
| `preset` | Experimentos listos para cargar en el laboratorio libre. |
| `preset_carga` | Partículas que se inyectan al cargar un preset. |
| `mision` | Capítulos temáticos que agrupan niveles (ej. La materia y sus estados). |
| `nivel` | Nivel jugable: una práctica guiada ubicada en una casilla de la tabla periódica. |
| `paso` | Paso de un nivel. La condición se evalúa en el motor del simulador (DSL {todas|alguna:[{metrica, op, valor}]}). |
| `pista` | Ayudas de Quimi por paso: 1 = pista, 2 = explicación, 3 = solución. Cada una cuesta XP. |
| `pregunta` | Preguntas del cuestionario de cierre de cada nivel. |
| `opcion` | Alternativas de cada pregunta. El índice parcial ux_opcion_una_correcta garantiza a lo más una correcta. |
| `insignia` | Logros desbloqueables. fn_otorgar_insignias evalúa tipo/umbral contra el progreso del usuario. |
| `glosario` | Términos que Quimi explica. Búsqueda de texto completo en español sin tildes (índice GIN). |
| `aula` | Grupo de estudiantes a cargo de un docente. Los estudiantes se unen con el código de 6 caracteres. |
| `matricula` | Pertenencia de estudiantes a aulas (relación N:M). |
| `aula_nivel` | Niveles que el docente asigna a un aula, con fecha límite opcional. |
| `intento` | Cada vez que un estudiante juega un nivel. Lo cierra fn_finalizar_intento (estrellas y XP). |
| `intento_paso` | Pasos completados dentro de un intento y el tiempo que tomaron (métrica del dashboard). |
| `pista_usada` | Pistas de Quimi que el estudiante abrió en un intento (una vez por pista). |
| `respuesta` | Respuesta elegida en el cuestionario. es_correcta la fija un trigger desde opcion (no confía en el cliente). |
| `logro_usuario` | Insignias obtenidas por cada usuario. |
| `sesion` | Sesión de uso (anónima o autenticada) desde la web, VS Code, Claude Code o MCP. |
| `evento` | Eventos de telemetría de producto (append-only). Índice BRIN por fecha: tabla grande y ordenada en el tiempo. |

Diccionario completo (columnas, tipos, restricciones, índices): [docs/database](docs/database/).
<!-- AUTO:diccionario:fin -->

### Diagrama entidad-relación

<!-- AUTO:er:inicio -->
```mermaid
erDiagram
  auditoria {
    bigint id PK
    character tabla
    character operacion
    text registro_id
    character usuario_bd
    jsonb datos_antes
    jsonb datos_despues
    timestamp ocurrido_en
  }
  aula {
    integer id PK
    character codigo
    character nombre
    smallint grado
    character seccion
    bigint docente_id FK
    timestamp creado_en
  }
  aula_nivel {
    integer aula_id PK
    smallint nivel_id PK
    date fecha_limite
    timestamp asignado_en
  }
  elemento {
    character simbolo PK
    character nombre
    smallint numero_atomico
    character color_hex
    character brillo_hex
    numeric radio_px
  }
  especie {
    character codigo PK
    character formula
    character nombre
    numeric masa_molar
    numeric dhf_kj_mol
    numeric punto_fusion_k
    numeric punto_ebull_k
    numeric dhvap_kj_mol
    numeric p_triple_atm
    numeric t_triple_k
    numeric dhvap_triple
    integer pubchem_cid
    boolean es_radical
    boolean inyectable
    smallint orden
  }
  especie_atomo {
    character especie_codigo PK
    smallint posicion PK
    character simbolo FK
    numeric x
    numeric y
  }
  evento {
    bigint id PK
    uuid sesion_id FK
    bigint usuario_id FK
    character tipo
    smallint nivel_id FK
    jsonb datos
    timestamp creado_en
  }
  fotolisis {
    character especie_codigo PK
    numeric enlace_kj_mol
    numeric seccion_eficaz
    character etiqueta
    character producto_1 FK
    character producto_2 FK
  }
  glosario {
    smallint id PK
    character termino
    text definicion
    tsvector busqueda
  }
  insignia {
    character codigo PK
    character nombre
    text descripcion
    character icono
    character tipo
    integer umbral
  }
  intento {
    bigint id PK
    bigint usuario_id FK
    smallint nivel_id FK
    character estado
    timestamp iniciado_en
    timestamp finalizado_en
    smallint pasos_completados
    smallint pistas_usadas
    smallint xp_pistas
    smallint aciertos
    smallint estrellas
    integer xp_obtenido
  }
  intento_paso {
    bigint intento_id PK
    integer paso_id PK
    integer segundos
    timestamp completado_en
  }
  logro_usuario {
    bigint usuario_id PK
    character insignia_codigo PK
    timestamp obtenido_en
  }
  matricula {
    integer aula_id PK
    bigint estudiante_id PK
    timestamp unido_en
  }
  mision {
    smallint id PK
    character codigo
    character titulo
    text descripcion
    text competencia
    character color
    smallint orden
  }
  nivel {
    smallint id PK
    character codigo
    smallint mision_id FK
    smallint orden
    character titulo
    text resumen
    text objetivo
    smallint grado
    smallint xp_base
    smallint minutos_estim
    character casilla_simbolo
    smallint casilla_fila
    smallint casilla_columna
    text casilla_nota
    jsonb inicio
    ARRAY controles
    ARRAY especies
    smallint nivel_previo_id FK
  }
  opcion {
    integer id PK
    integer pregunta_id FK
    smallint orden
    text texto
    boolean es_correcta
  }
  paso {
    integer id PK
    smallint nivel_id FK
    smallint orden
    character titulo
    text instruccion
    text concepto
    jsonb condicion
  }
  pista {
    integer id PK
    integer paso_id FK
    smallint nivel_ayuda
    text texto
    smallint costo_xp
  }
  pista_usada {
    bigint intento_id PK
    integer pista_id PK
    timestamp usada_en
  }
  pregunta {
    integer id PK
    smallint nivel_id FK
    smallint orden
    text enunciado
    text explicacion
  }
  preset {
    character codigo PK
    character nombre
    character ecuacion
    character sobre_flecha
    character etiqueta
    text pista
    jsonb parametros
    jsonb pasos
    smallint orden
  }
  preset_carga {
    character preset_codigo PK
    character especie_codigo PK
    smallint cantidad
  }
  reaccion {
    character codigo PK
    character etiqueta
    numeric ea_kj_mol
    numeric factor_esterico
    character enlace
  }
  reaccion_participante {
    character reaccion_codigo PK
    character papel PK
    smallint posicion PK
    character especie_codigo FK
  }
  respuesta {
    bigint intento_id PK
    integer pregunta_id PK
    integer opcion_id FK
    boolean es_correcta
    timestamp respondida_en
  }
  rol {
    smallint id PK
    character codigo
    character nombre
  }
  sesion {
    uuid id PK
    bigint usuario_id FK
    character origen
    character dispositivo
    timestamp iniciada_en
    timestamp ultima_actividad
  }
  usuario {
    bigint id PK
    character email
    character nombre
    character password_hash
    smallint rol_id FK
    smallint grado
    integer xp
    smallint racha_actual
    smallint racha_maxima
    date ultimo_dia_activo
    boolean activo
    timestamp creado_en
    timestamp actualizado_en
  }
  usuario ||--o{ aula : "docente_id"
  aula ||--o{ aula_nivel : "aula_id"
  nivel ||--o{ aula_nivel : "nivel_id"
  especie ||--o{ especie_atomo : "especie_codigo"
  elemento ||--o{ especie_atomo : "simbolo"
  sesion ||--o{ evento : "sesion_id"
  usuario ||--o{ evento : "usuario_id"
  nivel ||--o{ evento : "nivel_id"
  especie ||--o{ fotolisis : "especie_codigo"
  especie ||--o{ fotolisis : "producto_1"
  especie ||--o{ fotolisis : "producto_2"
  usuario ||--o{ intento : "usuario_id"
  nivel ||--o{ intento : "nivel_id"
  intento ||--o{ intento_paso : "intento_id"
  paso ||--o{ intento_paso : "paso_id"
  usuario ||--o{ logro_usuario : "usuario_id"
  insignia ||--o{ logro_usuario : "insignia_codigo"
  aula ||--o{ matricula : "aula_id"
  usuario ||--o{ matricula : "estudiante_id"
  mision ||--o{ nivel : "mision_id"
  nivel ||--o{ nivel : "nivel_previo_id"
  pregunta ||--o{ opcion : "pregunta_id"
  nivel ||--o{ paso : "nivel_id"
  paso ||--o{ pista : "paso_id"
  intento ||--o{ pista_usada : "intento_id"
  pista ||--o{ pista_usada : "pista_id"
  nivel ||--o{ pregunta : "nivel_id"
  preset ||--o{ preset_carga : "preset_codigo"
  especie ||--o{ preset_carga : "especie_codigo"
  reaccion ||--o{ reaccion_participante : "reaccion_codigo"
  especie ||--o{ reaccion_participante : "especie_codigo"
  intento ||--o{ respuesta : "intento_id"
  pregunta ||--o{ respuesta : "pregunta_id"
  opcion ||--o{ respuesta : "opcion_id"
  usuario ||--o{ sesion : "usuario_id"
  rol ||--o{ usuario : "rol_id"
```

<!-- AUTO:er:fin -->

## Diagrama de clases

<!-- AUTO:clases:inicio -->
```mermaid
classDiagram
  direction LR
  class AuthService {
    +BCRYPT_COSTO
    -db : Database
    -codigoDocente : string
    +registrar(body)
    +login(body)
    +obtener(id)
    +payload(u)$
  }
  class Database {
    +pool : pg.Pool
    +query(text, params)
    +tx(fn)
    +ping()
    +close()
  }
  class HttpError {
    +status : number
    +code : 
  }
  class CatalogoRepository {
    -db : Database
    +obtener(ttlMs)
  }
  class DashboardRepository {
    -db : Database
    +resumen(refrescar)
    +registrarEventos(body, usuarioId)
  }
  class JuegoRepository {
    -db : Database
    +contenido()
    +progreso(usuarioId)
    +perfil(usuarioId)
  }
  class AulaService {
    -db : Database
    +crear(docenteId, nombre, grado, seccion)
    +listar(usuarioId, rol)
    +unirse(estudianteId, codigo)
    -verificarDocente(aulaId, usuarioId, rol)
    +detalle(aulaId, usuarioId, rol)
    +asignar(aulaId, usuarioId, rol, nivel, fechaLimite)
  }
  class IntentoService {
    -db : Database
    +iniciar(usuarioId, nivelCodigo)
    -verificarDueno(intentoId, usuarioId)
    +completarPaso(intentoId, usuarioId, orden, segundos)
    +pedirAyuda(intentoId, usuarioId, orden, nivelAyuda)
    +responder(intentoId, usuarioId, preguntaOrden, opcionOrden)
    +finalizar(intentoId, usuarioId)
  }
  class QuimiService {
    -db : Database
    +preguntar(consulta, nivel, paso)
  }
  class Simulation {
    +particulas : Particula
    +efectos : Efecto
    +log : EntradaLog
    +caja : Caja null
    +t
    +Tch : number
    +Tk : number
    +tMax : number
    +rxCount
    +rxById : Record string, number
    +fotolisis : Record string, number
    +chispas
    +q : Quimica
    -rng : Rng
    -gauss()
    +registrar(type, text)
    -crear(sp, x, y, T)
    +inyectar(sp, n, at)
    +vaciar()
    +reiniciar(T0)
    -efecto(e)
    -reaccionar(p, q, rx, E)
    -disociar(p, extraKJ, causa)
    +ajustarCaja(W, H, V, snap)
    +tablaDeFases(prm)
    +paso(prm, dtFrame)
    -vigilarUmbrales(prm, phase, plasma)
    +chispa()
    +particulaEn(x, y)
    +instantanea(prm)
  }
  class SeguidorDePaso {
    -c : Condicion
    +progreso
    +actualizar(s, p)
  }
  AuthService --> Database : usa
  class HttpError:::error
  CatalogoRepository --> Database : usa
  DashboardRepository --> Database : usa
  JuegoRepository --> Database : usa
  AulaService --> Database : usa
  IntentoService --> Database : usa
  QuimiService --> Database : usa
```

<!-- AUTO:clases:fin -->

## Diagrama de componentes

<!-- AUTO:componentes:inicio -->
```mermaid
flowchart LR
  subgraph Clientes
    frontend["@arc/frontend<br/><small>Frontend de AtomReactChamber (React + Vite + Typ</small>"]
    extensions_vscode["atomreactchamber-vscode<br/><small>Misiones, catálogo químico y el asistente Quimi </small>"]
    integrations_mcp["@arc/mcp<br/><small>Servidor MCP (stdio) que expone la API de AtomRe</small>"]
    skill["Skill Claude Code<br/><small>.claude/skills/atomreactchamber</small>"]
  end
  subgraph Servidor
    backend["@arc/backend<br/><small>Fastify · JWT · OpenAPI</small>"]
  end
  subgraph Datos
    db[("PostgreSQL 16<br/><small>funciones · triggers · vistas</small>")]
    lb["Liquibase<br/><small>db/changelog</small>"]
  end
  frontend -- "REST /api" --> backend
  extensions_vscode -- "REST /api" --> backend
  integrations_mcp -- "REST /api" --> backend
  skill -- "REST /api" --> backend
  backend -- "SQL (pg)" --> db
  lb -- "migra" --> db
  frontend -. "modo demo: JSON incluido" .-> datosLocales["contenido.generated.json"]
  gen["db/data/*.json"] -- "seed:generate" --> lb
  gen -- "seed:generate" --> datosLocales
```

<!-- AUTO:componentes:fin -->

## Diagrama de despliegue

<!-- AUTO:despliegue:inicio -->
```mermaid
flowchart TB
  usuario(["Estudiante / Docente<br/>navegador"])
  dev(["Desarrolladora<br/>git push"])
  subgraph GitHub
    repo["Repositorio"]
    gha["GitHub Actions<br/>infra · db · backup · release · docs · pages"]
    pages["GitHub Pages<br/>docs técnicas + demo offline"]
    rel["Releases<br/>dist + .vsix + backups"]
  end
  subgraph Render["Render (free tier)"]
    web["Sitio estático<br/>frontend/dist"]
    api["Web service Node 22<br/>backend/dist/server.js"]
  end
  subgraph Neon["Neon (free tier)"]
    pg[("PostgreSQL 16")]
  end
  hcp["HCP Terraform<br/>estado remoto"]
  dev --> repo --> gha
  gha -- "terraform apply" --> Render
  gha -- "terraform apply" --> Neon
  gha -. "estado" .-> hcp
  gha -- "liquibase update" --> pg
  gha -- "pg_dump diario" --> rel
  gha -- "deploy pages" --> pages
  gha -- "deploy hook" --> api
  usuario -- HTTPS --> web
  usuario -- "HTTPS /api" --> api
  usuario -- HTTPS --> pages
  api -- "TLS 5432" --> pg
```

<!-- AUTO:despliegue:fin -->

## Automatizaciones (GitHub Actions)

| Rúbrica | Workflow | Reporte |
|---|---|---|
| Infraestructura con Terraform + pruebas + costos | [`infra.yml`](.github/workflows/infra.yml) | pruebas superadas (JUnit), costos (free tier vs. AWS/Azure) |
| Objetos de BD con Liquibase | [`db.yml`](.github/workflows/db.yml) | ejecuciones, `updateSQL`, historial |
| Copias de seguridad | [`backup.yml`](.github/workflows/backup.yml) | tamaño, sha256, restauración verificada por conteo de filas |
| Release y despliegue | [`release.yml`](.github/workflows/release.yml) | release semántico, artefactos, smoke test `/api/health` |
| Documentación en README | [`docs.yml`](.github/workflows/docs.yml) | este README, diccionario y diagramas |
| Documentación técnica en Pages | [`pages.yml`](.github/workflows/pages.yml) | TypeDoc (clases, métodos, propiedades) + BD + demo |

Detalle y secrets necesarios: [docs/automatizaciones.md](docs/automatizaciones.md) · [infra/README.md](infra/README.md).

## Integraciones (reto)

Extensión de **VS Code**, servidor **MCP**, **skill + agente de Claude Code** y **GitHub** (Actions, Pages, Releases).
Cada integración registra su origen en la telemetría y aparece en el dashboard. Ver [docs/integraciones.md](docs/integraciones.md).

## Desarrollo local

Requisitos: Node 22, PostgreSQL 16, Java 17+ (Liquibase).

```bash
npm install
npm run seed:generate                       # regenera semillas desde db/data/*.json
liquibase --changelog-file=db/changelog/db.changelog-master.yaml \
  --url=jdbc:postgresql://localhost:5432/arc --username=postgres update
cp backend/.env.example backend/.env        # DATABASE_URL, JWT_SECRET…
npm run dev:api                             # API en http://localhost:8080 (Swagger en /api/docs)
VITE_API_URL=http://localhost:8080 npm run dev   # frontend en http://localhost:5173
```

Sin servidor: `npm run dev` (sin `VITE_API_URL`) abre el modo demostración.

### Pruebas

```bash
DATABASE_URL=postgres://postgres@localhost:5432/arc npm test -w backend   # integración contra PostgreSQL real
npm test -w frontend      # motor + solucionador que juega los 9 niveles
npm run e2e -w frontend   # Playwright: nivel completo + axe (WCAG 2.2 AA)
```

## Documentos

[Problema y objetivos](docs/investigacion/problema-y-objetivos.md) ·
[FD01 Factibilidad](docs/fd/FD01-Informe-Factibilidad.md) · [FD02 Visión](docs/fd/FD02-Informe-Vision.md) ·
[FD03 SRS](docs/fd/FD03-Informe-SRS.md) · [FD04 SAD](docs/fd/FD04-Informe-SAD.md) ·
[Diccionario de datos](docs/database/) · [Estándar de programación](docs/estandares/estandar-de-programacion.md) ·
[Dirección de arte](docs/diseno/direcciones-de-arte.md) · [Presentación](docs/presentacion/)

## Modelo físico-químico

Discos rígidos 2D con colisiones elásticas (rejilla espacial), velocidades de Maxwell-Boltzmann (σ ∝ √(T/M)),
termostato de Berendsen, reacción si la energía de colisión supera Eₐ (con factor estérico y de presión),
ΔH desde entalpías de formación estándar, fotólisis si E = 119 627/λ supera el enlace, y fases con
Clausius-Clapeyron. **Las energías de activación son valores pedagógicos** elegidos para que las reacciones se
observen en segundos; las entalpías y puntos de cambio de fase son datos estándar (NIST/PubChem).

<!-- AUTO:fecha:inicio -->
_Secciones generadas automáticamente el 2026-11-07 por `scripts/docs/build-readme.mjs`._
<!-- AUTO:fecha:fin -->

## Licencia

MIT © 2026 Adriana Rafaela Laos González.
