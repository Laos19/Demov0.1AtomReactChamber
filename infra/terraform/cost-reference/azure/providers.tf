# SOLO PARA ESTIMACIÓN DE COSTOS (Infracost). NUNCA ejecutar `terraform apply`.
provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
}
