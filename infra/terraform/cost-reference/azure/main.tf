# Arquitectura Azure equivalente (de pago) a Neon + Render, usada SOLO para comparar costos.
#   PostgreSQL -> Azure Database for PostgreSQL Flexible Server (B1ms, 32 GB)
#   API        -> Azure App Service Linux (plan B1, Node 22)
#   Frontend   -> Azure Static Web Apps (Standard)

resource "terraform_data" "guard" {
  lifecycle {
    precondition {
      condition     = var.allow_apply
      error_message = "cost-reference/azure es solo para Infracost. No aplicar."
    }
  }
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}"
  location = var.location
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "psql-${var.project_name}"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = "16"
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = 32768
  backup_retention_days         = 7
  public_network_access_enabled = true

  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = false
  }
}

resource "azurerm_service_plan" "api" {
  name                = "asp-${var.project_name}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1"
}

resource "azurerm_linux_web_app" "api" {
  name                = "app-${var.project_name}-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.api.id
  https_only          = true

  site_config {
    health_check_path                 = "/api/health"
    health_check_eviction_time_in_min = 5
    app_command_line                  = "node backend/dist/server.js"

    application_stack {
      node_version = "22-lts"
    }
  }
}

resource "azurerm_static_web_app" "web" {
  name                = "stapp-${var.project_name}"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus2"
  sku_tier            = "Standard"
  sku_size            = "Standard"
}
