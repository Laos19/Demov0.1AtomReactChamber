variable "allow_apply" {
  description = "Salvaguarda: debe seguir en false. Este directorio solo existe para que Infracost estime costos."
  type        = bool
  default     = false
}

variable "api_container_image" {
  description = "Imagen de contenedor de la API (referencial)."
  type        = string
  default     = "public.ecr.aws/docker/library/node:22-alpine"
}

variable "db_instance_class" {
  description = "Clase de instancia RDS equivalente a Neon Free (0.25-2 CU)."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_storage_gb" {
  description = "Almacenamiento gp3 de RDS en GB (mínimo 20)."
  type        = number
  default     = 20
}

variable "project_name" {
  description = "Prefijo de nombres de recursos."
  type        = string
  default     = "atomreactchamber"
}

variable "region" {
  description = "Región AWS de referencia (us-east-1 = precios más bajos; sa-east-1 = São Paulo, más cerca de Perú)."
  type        = string
  default     = "us-east-1"
}

variable "subnet_ids" {
  description = "Subredes públicas (referenciales; no se crean porque nunca se aplica)."
  type        = list(string)
  default     = ["subnet-00000000000000001", "subnet-00000000000000002"]
}

variable "vpc_id" {
  description = "VPC de referencia (no se crea porque nunca se aplica)."
  type        = string
  default     = "vpc-00000000000000000"
}
