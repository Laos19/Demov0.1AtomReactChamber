variable "branch" {
  description = "Rama de Git desplegada en producción."
  type        = string
  default     = "main"
}

variable "extra_cors_origins" {
  description = "Orígenes extra permitidos por la API (demo en GitHub Pages)."
  type        = list(string)
  default     = ["https://laos19.github.io"]
}

variable "neon_org_id" {
  description = "ID de organización Neon (org-...). null si la API key solo tiene una organización."
  type        = string
  default     = null
}

variable "neon_region" {
  description = "Región de Neon para la base de datos."
  type        = string
  default     = "aws-us-east-1"
}

variable "project_name" {
  description = "Nombre corto del proyecto; se usa como prefijo de recursos."
  type        = string
  default     = "atomreactchamber"
}

variable "render_region" {
  description = "Región de Render para la API y el sitio estático."
  type        = string
  default     = "virginia"
}

variable "repo_url" {
  description = "URL HTTPS del repositorio de GitHub que Render construye."
  type        = string
  default     = "https://github.com/laos19/demov0.1atomreactchamber"
}
