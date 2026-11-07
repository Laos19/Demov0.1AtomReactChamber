variable "allow_apply" {
  description = "Salvaguarda: debe seguir en false. Este directorio solo existe para que Infracost estime costos."
  type        = bool
  default     = false
}

variable "location" {
  description = "Región Azure de referencia (brazilsouth es la más cercana a Perú)."
  type        = string
  default     = "eastus"
}

variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
  default     = "atomreactchamber"
}

variable "subscription_id" {
  description = "Suscripción Azure ficticia: nunca se aplica."
  type        = string
  default     = "00000000-0000-0000-0000-000000000000"
}
