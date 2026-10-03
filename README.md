# MusicStream — Gestión de suscripciones a plataforma de música

Plataforma web para suscribirse, gestionar y disfrutar de streaming de música. Los administradores controlan planes, usuarios, catálogo y reportes.

| | |
|---|---|
| **Backend** | ASP.NET Core 8 Web API · EF Core · PostgreSQL (prod) / SQLite (dev) · JWT · xUnit |
| **Frontend** | React 19 + Vite · React Router · Vitest |
| **Contenedor** | `backend/Dockerfile` (multi-stage, runtime `aspnet:8.0-noble-chiseled`, usuario no root) |
| **Nube** | Microsoft Azure (App Service Linux, ACR, PostgreSQL Flexible Server privado, Static Web Apps) |
| **IaC** | Terraform (`infra/terraform`) |
| **CI/CD** | GitHub Actions (`.github/workflows`) |

## Enlaces de entrega

| | URL |
|---|---|
| Aplicación publicada (frontend) | `https://<host>.azurestaticapps.net` — se muestra en el resumen del workflow **deploy** |
| API publicada (Swagger) | `https://app-musicstream-<AZURE_SUFFIX>-api.azurewebsites.net/swagger` |
| Repositorio | https://github.com/UPT-FAING-EPIS/si784-2026-ii-si784-2026-ii-examen-u1-laos19 |
| SonarCloud | `https://sonarcloud.io/project/overview?id=<SONAR_PROJECT_KEY>` |

> Las URLs públicas existen después de configurar los secretos y ejecutar `infra.yml` y luego `deploy.yml` (ver [Configuración de CI/CD](#configuración-de-cicd)).

## Funcionalidades

- **Catálogo**: artistas, álbumes y canciones con búsqueda, filtro por tipo y género, y paginación.
- **Streaming**: reproductor integrado. Las canciones *Premium* requieren un plan que las incluya.
- **Suscripciones**: plan Free automático al registrarse, planes de pago, renovación (extiende la vigencia), cambio de plan, cancelación y renovación automática al vencer.
- **Playlists**: crear, agregar/quitar canciones y eliminar. El número máximo depende del plan.
- **Historial y recomendaciones**: recomendaciones por artistas y géneros escuchados, con respaldo por popularidad.
- **Administración**: CRUD de planes, gestión de usuarios (activar o desactivar, cambiar rol), suscripciones, catálogo y reportes de **uso**, **suscripciones** e **ingresos**.
- **Validación** en frontend (`frontend/src/lib/validation.js`) y backend (DataAnnotations + reglas de negocio → `ProblemDetails`).

## API REST

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/auth/register` · `/auth/login` | Registro / inicio de sesión (JWT) | Público |
| `GET` | `/music` | Catálogo (`search`, `type`, `genre`, `page`, `pageSize`) | Público |
| `GET` | `/music/{id}` | Detalle de canción, álbum o artista | Público |
| `POST` | `/music/{id}/play` | URL de streaming + registro en el historial | Usuario |
| `POST` | `/subscriptions` | Crear o renovar suscripción | Usuario |
| `GET` | `/subscriptions/{userId}` | Suscripción activa | Propietario/Admin |
| `DELETE` | `/subscriptions/{id}` | Cancelar suscripción | Propietario/Admin |
| `POST` | `/playlists` | Crear playlist | Usuario |
| `GET` | `/playlists/{userId}` | Playlists del usuario | Propietario/Admin |
| `GET` | `/history/{userId}` · `/recommendations/{userId}` | Historial y recomendaciones | Propietario/Admin |
| `POST` | `/reports` | Generar reporte (`Usage`, `Subscriptions`, `Revenue`) | Admin |
| `GET/POST/PUT/DELETE` | `/plans` | Planes | Lectura pública / escritura Admin |
| `GET/PATCH` | `/users` | Gestión de usuarios | Admin |

La documentación interactiva completa está en `/swagger`.

## Ejecución local

```bash
# Backend (SQLite) -> http://localhost:5080/swagger
cd backend
Seed__AdminEmail=admin@musicstream.pe Seed__AdminPassword='<clave-admin>' \
  dotnet run --project src/MusicStream.Api --launch-profile http

# Frontend -> http://localhost:5173 (proxy /api -> :5080)
cd frontend && npm install && npm run dev

# Alternativa con contenedores (API + PostgreSQL)
POSTGRES_PASSWORD='<clave-db>' ADMIN_PASSWORD='<clave-admin>' docker compose up --build
```

### Pruebas

```bash
dotnet test backend/MusicStream.sln     # 41 pruebas unitarias + de integración (WebApplicationFactory)
cd frontend && npm run test:coverage    # pruebas de validación y cliente HTTP
```

## Configuración de CI/CD

| Workflow | Propósito |
|---|---|
| [`infra.yml`](.github/workflows/infra.yml) | Terraform: crea el backend de estado remoto y aprovisiona RG, VNet, PostgreSQL privado, ACR, App Service, Static Web App y Application Insights |
| [`deploy.yml`](.github/workflows/deploy.yml) | Pruebas, build y push de la imagen a ACR, actualización del App Service, build y despliegue del frontend a Static Web Apps |
| [`sonar.yml`](.github/workflows/sonar.yml) | Análisis SonarCloud (C#, JS, Terraform, Docker) con cobertura y Quality Gate |
| [`snyk-semgrep.yml`](.github/workflows/snyk-semgrep.yml) | Semgrep SAST + Snyk Open Source, Code y Container. Reportes HTML/JSON/SARIF como artefactos y en *Code scanning* |
| [`generate-documentation.yml`](.github/workflows/generate-documentation.yml) | Diccionario de datos, diagramas ER, de clases, de componentes y de despliegue (Mermaid) en [`docs/`](docs/README.md) |

**Secretos** (`Settings → Secrets and variables → Actions`):

| Secreto | Uso |
|---|---|
| `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | Service principal: `az ad sp create-for-rbac --name musicstream-gha --role Owner --scopes /subscriptions/<id>` (Owner es necesario para asignar el rol `AcrPull`) |
| `APP_ADMIN_PASSWORD` | Contraseña del administrador inicial (`admin@musicstream.pe`) |
| `SONAR_TOKEN` | Token de SonarCloud |
| `SNYK_TOKEN` | Token de Snyk |

**Variables**: `AZURE_SUFFIX` (por ejemplo `laos19`), `AZURE_LOCATION` (opcional, `eastus2` por defecto), `SONAR_ORGANIZATION` y `SONAR_PROJECT_KEY`.

Orden: `infra` → `deploy`. `sonar`, `snyk-semgrep` y `generate-documentation` se ejecutan con cada push a `main` o manualmente.

## Estructura

```
backend/
  src/MusicStream.Api/       API (Domain, Data, Dtos, Services, Controllers, Infrastructure)
  tests/MusicStream.Tests/   Pruebas unitarias (Unit/) e integración (Integration/)
  tools/MusicStream.DocGen/  Generador de documentación Mermaid
  Dockerfile
frontend/                    SPA React (pages/, components/, lib/)
infra/terraform/             Infraestructura Azure
docs/                        Documentación generada
.github/workflows/           Automatizaciones
```

---

# Anexo: AtomReactChamber v0.1 (contenido previo del repositorio)

Cámara de simulación termodinámica y molecular: un prototipo web interactivo
(React + Tailwind CSS + Lucide + HTML5 Canvas) para visualizar la teoría
cinético-molecular y reacciones químicas bajo temperatura, presión, volumen y
radiación UV variables.

Todo el simulador vive en un único componente: [`src/AtomReactChamber.jsx`](src/AtomReactChamber.jsx).

## Uso

```bash
npm install
npm run dev           # servidor de desarrollo (http://localhost:5173)
npm run build         # build de producción en dist/
npm run build:single  # dist/index.html autocontenido (un solo archivo)
```

## Módulos

| Zona | Contenido |
|---|---|
| Barra superior | Estado (En ejecución / Pausado / Reacción en curso), Play, Pausa, Paso, Reset, velocidad 0.5x–5x |
| Inyector | H₂, O₂, Na, H₂O, Cl₂, C; cantidad personalizada; limpiar cámara; 4 presets |
| Panel izquierdo | Temperatura (0–3000 K), presión (0.1–100 atm, escala log), volumen (1–50 L), UV (0–1000 W/m², 100–400 nm), chispa de activación |
| Viewport | Canvas a 60 FPS: colisiones, reacciones, destellos exo/endotérmicos, fotólisis, HUD con T, nº de moléculas/átomos y fase predominante |
| Panel derecho | Ficha de especie/reacción (masa molar, ΔHf°, ΔH, Eₐ, CID de PubChem), perfil energético interactivo, composición con tendencias y consola de eventos |

Clic en una zona vacía de la cámara inyecta 5 partículas de la especie seleccionada;
clic sobre una partícula la inspecciona en el panel de telemetría.

## Modelo físico-químico

- **Cinética:** discos rígidos 2D con colisiones elásticas (rejilla espacial).
  Velocidades de Maxwell-Boltzmann con σ = K·√(T/M), por lo que v ∝ √T.
  Un termostato de Berendsen acopla las partículas a la temperatura de la cámara.
- **Reacciones:** en cada colisión, si la energía relativa supera Eₐ, la reacción
  ocurre con un factor estérico (multiplicado por √P como factor de frecuencia).
  ΔH se calcula a partir de entalpías de formación estándar; el calor liberado
  eleva la temperatura de la cámara, lo que permite igniciones en cadena.
- **Mecanismos incluidos:** combustión de H₂ (H₂ + O₂ → H₂O + O·, O· + H₂ → H₂O),
  Na + H₂O, Na + Cl₂, C + O₂, cadena H₂/Cl₂ y recombinaciones radicalarias.
- **Fotólisis:** si la energía del fotón (119 627 / λ[nm] kJ/mol) supera el
  enlace (O=O 498, H–H 436, Cl–Cl 243 kJ/mol).
- **Fases:** sólido/líquido/gas por especie según puntos de fusión y ebullición,
  con ebullición corregida por presión (Clausius-Clapeyron). Plasma a ≥ 2800 K
  o con UV de vacío intenso.

> Las energías de activación son **valores de modelo a escala pedagógica**,
> elegidos para que las reacciones sean observables en segundos; las entalpías
> sí corresponden a datos termodinámicos estándar.
