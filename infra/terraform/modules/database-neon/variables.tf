variable "database_name" {
  description = "Nombre de la base de datos por defecto que se crea en la rama principal."
  type        = string
  default     = "atomreactchamber"

  validation {
    condition     = can(regex("^[a-z][a-z0-9_]{0,62}$", var.database_name))
    error_message = "database_name debe empezar con letra minúscula y contener solo [a-z0-9_]."
  }
}

variable "default_branch_name" {
  description = "Nombre de la rama por defecto del proyecto Neon."
  type        = string
  default     = "main"
}

variable "history_retention_seconds" {
  description = "Ventana de restauración point-in-time (PITR) en segundos. El plan Free de Neon permite hasta 6 horas (21600)."
  type        = number
  default     = 21600

  validation {
    condition     = var.history_retention_seconds >= 0 && var.history_retention_seconds <= 2592000
    error_message = "history_retention_seconds debe estar entre 0 y 2592000 (30 días)."
  }
}

variable "org_id" {
  description = "ID de la organización Neon (org-...). Opcional: déjelo en null si la API key pertenece a una sola organización."
  type        = string
  default     = null
}

variable "pg_version" {
  description = "Versión mayor de PostgreSQL. Debe coincidir con la usada en CI (postgres:16)."
  type        = number
  default     = 16

  validation {
    condition     = contains([14, 15, 16, 17], var.pg_version)
    error_message = "pg_version debe ser 14, 15, 16 o 17."
  }
}

variable "project_name" {
  description = "Nombre del proyecto Neon."
  type        = string
}

variable "region_id" {
  description = "Región de Neon (https://neon.tech/docs/introduction/regions). aws-us-east-1 queda junto a Render (virginia)."
  type        = string
  default     = "aws-us-east-1"
}

variable "role_name" {
  description = "Rol (usuario) propietario de la base de datos por defecto."
  type        = string
  default     = "app_owner"
}
