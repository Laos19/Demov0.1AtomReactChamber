# Infraestructura como código: AtomReactChamber

Esta carpeta describe con **Terraform** toda la infraestructura de producción de AtomReactChamber,
que corre sobre servicios con **capa gratuita (USD 0/mes)**. También incluye una arquitectura de
referencia de pago (AWS y Azure) que se usa **solo** para estimar costos con Infracost.

```
infra/terraform/
├── modules/
│   ├── database-neon/     # PostgreSQL 16 serverless (Neon)
│   └── app-render/        # API Fastify (Web Service) + frontend (Static Site) en Render
├── envs/
│   └── prod/              # Módulo raíz: compone los módulos, backend de estado y salidas
├── cost-reference/
│   ├── aws/               # RDS + ECS Fargate + ALB + S3/CloudFront (solo Infracost, nunca se aplica)
│   ├── azure/             # Flexible Server + App Service + Static Web Apps (solo Infracost)
│   └── README.md          # Tabla de costos y precios de referencia con fuentes
├── .tflint.hcl
└── .gitignore
```

## 1. Arquitectura

```mermaid
flowchart LR
  subgraph GitHub
    repo[(Repositorio)]
    gha[GitHub Actions]
    pages[GitHub Pages<br/>docs + demo offline]
  end
  subgraph Render["Render (Free)"]
    web[Static Site<br/>frontend React]
    api[Web Service<br/>API Fastify · Node 22]
  end
  subgraph Neon["Neon (Free)"]
    db[(PostgreSQL 16)]
  end
  hcp[HCP Terraform<br/>estado remoto]

  user((Estudiante / docente)) --> web
  user --> pages
  web -- HTTPS / JSON --> api
  api -- TLS · pooler --> db
  gha -- terraform apply --> Render
  gha -- terraform apply --> Neon
  gha -- liquibase update --> db
  gha -- deploy hook --> api
  gha -- deploy hook --> web
  gha -- pg_dump diario --> db
  gha <-- estado --> hcp
  repo --> gha
  gha --> pages
```

| Capa | Servicio | Recurso Terraform | Por qué |
|---|---|---|---|
| Base de datos | Neon PostgreSQL 16 | `neon_project` (rama `main`, BD `atomreactchamber`, rol `app_owner`) | PostgreSQL gestionado, gratis, con *branching* y restauración point-in-time (6 h en el plan Free) |
| API | Render Web Service (plan `free`) | `render_web_service.api` | Despliega Node 22 desde el repositorio sin Docker; tiene health check en `/api/health` |
| Frontend | Render Static Site | `render_static_site.web` | CDN global gratuito, reescritura SPA y cabeceras de seguridad |
| Docs + demo | GitHub Pages | (workflow `pages.yml`) | Gratis para repositorios públicos |
| Estado | HCP Terraform (plan Free) | bloque `cloud {}` | Estado remoto cifrado, bloqueo y versionado sin servidores propios |

**Decisiones de diseño**

- **Módulos con contrato estable.** `envs/prod` solo consume las salidas `connection_uri*`,
  `database_host`, `jdbc_url`, `api_url` y `web_url`. Cambiar de nube consiste en escribir otro módulo
  con las mismas salidas (ver sección 7).
- **Sin dependencia circular.** La web necesita la URL de la API (variable `VITE_API_URL` en build) y la
  API necesita la URL de la web (`CORS_ORIGIN`). El módulo `app-render` **predice** la URL del sitio
  estático (`https://<prefijo>-web.onrender.com`) y usa la URL real de la API.
- **Despliegues controlados por GitHub Actions.** Los servicios de Render se crean con
  `auto_deploy_trigger = "off"`: `release.yml` aplica primero las migraciones de Liquibase y después
  dispara los *deploy hooks*. Así la API nunca arranca con un esquema viejo.
- **Secretos fuera del repositorio.** `JWT_SECRET` lo genera Render (`generate_value = true`); las
  credenciales de los proveedores llegan por variables de entorno desde GitHub Secrets.

## 2. Estado remoto: HCP Terraform (y alternativa)

**Elegido: HCP Terraform, plan Free.** Es gratuito hasta 500 recursos gestionados (aquí hay 3), ofrece
estado cifrado, bloqueo, historial de versiones e interfaz web, y solo requiere un token
(`TF_API_TOKEN`). No hay que crear buckets ni bases de datos para el estado.

Configuración (una sola vez):

1. Cree una cuenta en <https://app.terraform.io/signup/account> y una **organización**.
2. Cree un workspace **CLI-driven** llamado `atomreactchamber-prod`.
3. En el workspace: *Settings → General → Execution Mode → **Local***. Así el plan/apply se ejecuta en
   GitHub Actions (con los secrets del repositorio) y HCP solo guarda el estado.
4. Cree un token de equipo o de usuario: *User Settings → Tokens → Create an API token*.
5. En GitHub añada el secret `TF_API_TOKEN` y la variable `TF_CLOUD_ORGANIZATION` (y, si usa otro
   nombre, la variable `TF_WORKSPACE`).

**Alternativa documentada (sin HCP): backend `pg`.** Si no hay `TF_API_TOKEN`, pero existe el secret
`TF_STATE_PG_CONN_STR`, el workflow genera `backend_override.tf` con `backend "pg"` y guarda el estado
en el esquema `terraform_state` de una base PostgreSQL (por ejemplo, un segundo proyecto Neon gratuito
creado a mano, **distinto** del de producción para evitar el problema del huevo y la gallina). El
backend `pg` también soporta bloqueo mediante *advisory locks*.

Para trabajar en local sin estado remoto (solo pruebas): `terraform init -backend=false` +
`terraform validate`.

## 3. Crear las cuentas gratuitas

| Servicio | Pasos | Dato que se obtiene |
|---|---|---|
| **Neon** | Regístrese en <https://console.neon.tech/signup> (con GitHub). *Account settings → API keys → Create new API key*. Si su cuenta tiene varias organizaciones, copie el ID `org-…` (*Organization settings*). | `NEON_API_KEY` (y opcional `neon_org_id`) |
| **Render** | Regístrese en <https://dashboard.render.com/register> con GitHub y **autorice la GitHub App de Render** sobre este repositorio (sin esto Render no puede clonar). *Account settings → API Keys → Create API Key*. El *Owner ID* (`usr-…` o `tea-…`) aparece en la URL del workspace o con `curl -H "Authorization: Bearer $RENDER_API_KEY" https://api.render.com/v1/owners`. | `RENDER_API_KEY`, `RENDER_OWNER_ID` |
| **Render deploy hooks** | Tras el primer `apply`, en cada servicio: *Settings → Deploy Hook → Copy*. | `RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_WEB` |
| **HCP Terraform** | Ver sección 2. | `TF_API_TOKEN`, `TF_CLOUD_ORGANIZATION` |
| **Infracost** | `infracost auth login` o regístrese en <https://dashboard.infracost.io>; *Org settings → API key*. | `INFRACOST_API_KEY` |

Ninguno de estos servicios pide tarjeta de crédito en su plan gratuito a la fecha de escritura;
verifíquelo antes de registrarse.

## 4. Secrets y variables de GitHub

*Settings → Secrets and variables → Actions*. Todos los workflows terminan en verde aunque falten: los
pasos que dependen de ellos se omiten y el reporte muestra `omitido: falta secret X`.

### Secrets

| Nombre | Usado en | Valor |
|---|---|---|
| `NEON_API_KEY` | `infra.yml` | API key de Neon |
| `RENDER_API_KEY` | `infra.yml`, `release.yml` | API key de Render (en `release.yml` sirve para esperar a que el deploy quede *live*) |
| `RENDER_OWNER_ID` | `infra.yml` | `usr-…` o `tea-…` |
| `TF_API_TOKEN` | `infra.yml` | Token de HCP Terraform |
| `TF_STATE_PG_CONN_STR` | `infra.yml` | *(alternativa a HCP)* `postgres://usuario:clave@host/db?sslmode=require` de la BD de estado |
| `INFRACOST_API_KEY` | `infra.yml` | API key de Infracost |
| `LIQUIBASE_URL` | `db.yml`, `release.yml` | salida `database_jdbc_url`, p. ej. `jdbc:postgresql://ep-xxx.us-east-1.aws.neon.tech:5432/atomreactchamber?sslmode=require` |
| `LIQUIBASE_USER` | `db.yml`, `release.yml` | salida `database_user` (`app_owner`) |
| `LIQUIBASE_PASSWORD` | `db.yml`, `release.yml` | contraseña del rol (dentro de `database_connection_string`) |
| `DATABASE_URL` | `backup.yml` | salida `database_connection_string` (conexión **directa**, sin `-pooler`) |
| `BACKUP_PASSPHRASE` | `backup.yml` | frase larga para cifrar con AES-256 los respaldos de producción; sin ella el volcado real se verifica pero **no se sube** |
| `RENDER_DEPLOY_HOOK_API` | `release.yml` | URL del deploy hook de la API |
| `RENDER_DEPLOY_HOOK_WEB` | `release.yml` | URL del deploy hook del sitio estático |

### Variables

| Nombre | Usado en | Valor |
|---|---|---|
| `TF_CLOUD_ORGANIZATION` | `infra.yml` | Organización de HCP Terraform |
| `TF_WORKSPACE` | `infra.yml` | *(opcional)* por defecto `atomreactchamber-prod` |
| `API_URL` | `release.yml` | salida `api_url`, p. ej. `https://atomreactchamber-api.onrender.com` (build del frontend y smoke test) |
| `WEB_URL` | `release.yml` | salida `web_url` |
| `BACKUP_RELEASE` | `backup.yml` | `true` para adjuntar los respaldos semanales/mensuales a un Release `backup-AAAAMMDD` |

### Ajustes del repositorio

- *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
- *Settings → Actions → General → Workflow permissions →* marcar **Allow GitHub Actions to create and
  approve pull requests** (lo necesita release-please).
- El entorno `production` se crea solo la primera vez; puede añadirle revisores obligatorios.

### Obtener los valores tras el primer `apply`

```bash
cd infra/terraform/envs/prod
terraform output api_url web_url database_jdbc_url database_user
terraform output -raw database_connection_string   # DATABASE_URL (contiene la contraseña)
```

## 5. Ejecutar en local

Requisitos: Terraform ≥ 1.9 (probado con 1.17), opcionalmente TFLint e Infracost.

```bash
cd infra/terraform

# Formato y validación (no necesita credenciales)
terraform fmt -check -recursive
for d in modules/* envs/prod cost-reference/*; do
  terraform -chdir="$d" init -backend=false && terraform -chdir="$d" validate
done
tflint --init --config "$PWD/.tflint.hcl" && tflint --recursive --config "$PWD/.tflint.hcl"

# Plan / apply reales
export NEON_API_KEY=... RENDER_API_KEY=... RENDER_OWNER_ID=...
export TF_CLOUD_ORGANIZATION=mi-org TF_WORKSPACE=atomreactchamber-prod
terraform login                       # o export TF_TOKEN_app_terraform_io=...
cd envs/prod
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Después de cambiar versiones de proveedores, regenere el archivo de bloqueo para todas las
plataformas: `terraform providers lock -platform=linux_amd64 -platform=darwin_arm64 -platform=windows_amd64`.

### En GitHub Actions (`infra.yml`)

| Evento | Qué hace |
|---|---|
| Pull request a `main` | fmt, validate, tflint, checkov, pruebas, costos (sin tocar producción) |
| Push a `main` | lo anterior + `terraform plan` y `apply` automático si hay cambios y existen los secrets |
| *Run workflow* manual | `action = plan`, `apply` o `destroy` |

## 6. Costos

| Escenario | USD/mes | Detalle |
|---|---:|---|
| **Producción actual** (Neon Free + Render Free + GitHub Pages + HCP Free) | **0.00** | Límites: 0.5 GB de BD, API se suspende tras 15 min sin tráfico |
| Referencia AWS (RDS t4g.micro + Fargate + ALB + S3/CloudFront) | ≈ 38 | ver `terraform/cost-reference/README.md` |
| Referencia Azure (Flexible Server B1ms + App Service B1 + Static Web Apps) | ≈ 38 | ver `terraform/cost-reference/README.md` |

Las cifras de referencia son aproximadas (precios de lista *on-demand*) y se recalculan en vivo con
Infracost en cada ejecución de `infra.yml` cuando existe `INFRACOST_API_KEY`. El reporte queda en el
*Job summary* y en el artefacto `reporte-costos`.

## 7. Migración a Azure o AWS

La raíz `envs/prod` solo depende del **contrato de salidas** de los módulos. Para migrar:

| Paso | Azure | AWS |
|---|---|---|
| 1. Módulo de BD | `modules/database-azure-postgres` con `azurerm_postgresql_flexible_server` (+ `azurerm_postgresql_flexible_server_database`) | `modules/database-aws-rds` con `aws_db_instance` (engine `postgres`, versión 16) |
| 2. Módulo de app | `modules/app-azure` con `azurerm_linux_web_app` (API) y `azurerm_static_web_app` (web) | `modules/app-aws` con ECS Fargate o App Runner (API) y S3 + CloudFront (web) |
| 3. Salidas | mantener `connection_uri`, `connection_uri_pooler`, `database_host`, `jdbc_url`, `api_url`, `web_url` | ídem |
| 4. Raíz | cambiar `source` de los dos `module` en `envs/prod/main.tf` y los `required_providers` | ídem |
| 5. Datos | `pg_dump -Fc` desde Neon (artefacto de `backup.yml`) → `pg_restore` en el destino | ídem |
| 6. CI/CD | sustituir deploy hooks de Render por `azure/webapps-deploy` | por `aws-actions/amazon-ecs-deploy-task-definition` |

`cost-reference/aws` y `cost-reference/azure` ya contienen los recursos equivalentes y son el punto de
partida de esos módulos (hay que quitar la salvaguarda `terraform_data.guard` y parametrizar la red).
Liquibase, las pruebas y la documentación no cambian, porque el motor sigue siendo PostgreSQL 16.
