output "api_url" {
  description = "URL que tendría la API en App Service (referencial)."
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "database_host" {
  description = "Host que tendría PostgreSQL Flexible Server (referencial)."
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "web_url" {
  description = "URL que tendría el frontend en Static Web Apps (referencial)."
  value       = "https://${azurerm_static_web_app.web.default_host_name}"
}
