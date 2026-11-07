variable "api_build_command" {
  description = "Comando de build de la API (monorepo con npm workspaces). Incluye devDependencies para compilar TypeScript."
  type        = string
  default     = "npm ci --include=dev && npm run build -w backend"
}

variable "api_health_check_path" {
  description = "Ruta de health check que Render usa para despliegues sin caída."
  type        = string
  default     = "/api/health"
}

variable "api_plan" {
  description = "Plan de Render para la API. 'free' = USD 0 (se suspende tras 15 min sin tráfico)."
  type        = string
  default     = "free"
}

variable "api_start_command" {
  description = "Comando de arranque de la API."
  type        = string
  default     = "node backend/dist/server.js"
}

variable "auto_deploy_trigger" {
  description = "Despliegue automático de Render: 'off' (lo dispara GitHub Actions tras Liquibase), 'commit' o 'checksPass'."
  type        = string
  default     = "off"

  validation {
    condition     = contains(["off", "commit", "checksPass"], var.auto_deploy_trigger)
    error_message = "auto_deploy_trigger debe ser off, commit o checksPass."
  }
}

variable "branch" {
  description = "Rama de Git que Render construye."
  type        = string
  default     = "main"
}

variable "database_url" {
  description = "Cadena de conexión PostgreSQL que recibe la API como DATABASE_URL."
  type        = string
  sensitive   = true
}

variable "extra_cors_origins" {
  description = "Orígenes adicionales permitidos por CORS (p. ej. la demo en GitHub Pages)."
  type        = list(string)
  default     = []
}

variable "name_prefix" {
  description = "Prefijo de nombre de los servicios. La URL pública será https://<prefijo>-api.onrender.com si el nombre está libre."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,40}$", var.name_prefix))
    error_message = "name_prefix debe ser minúsculas, dígitos o guiones (3-41 caracteres)."
  }
}

variable "node_version" {
  description = "Versión de Node.js usada por Render (variable NODE_VERSION)."
  type        = string
  default     = "22"
}

variable "region" {
  description = "Región de Render: frankfurt, ohio, oregon, singapore o virginia."
  type        = string
  default     = "virginia"

  validation {
    condition     = contains(["frankfurt", "ohio", "oregon", "singapore", "virginia"], var.region)
    error_message = "region debe ser frankfurt, ohio, oregon, singapore o virginia."
  }
}

variable "repo_url" {
  description = "URL HTTPS del repositorio GitHub (Render debe tener acceso vía su GitHub App)."
  type        = string
}

variable "web_build_command" {
  description = "Comando de build del frontend estático."
  type        = string
  default     = "npm ci --include=dev && npm run build -w frontend"
}

variable "web_publish_path" {
  description = "Carpeta publicada del sitio estático, relativa a la raíz del repo."
  type        = string
  default     = "frontend/dist"
}
