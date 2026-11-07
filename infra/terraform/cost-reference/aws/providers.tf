# SOLO PARA ESTIMACIÓN DE COSTOS (Infracost). NUNCA ejecutar `terraform apply`.
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "Terraform"
      Purpose   = "cost-reference-only"
    }
  }
}
