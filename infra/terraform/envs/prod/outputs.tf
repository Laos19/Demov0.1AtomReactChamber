output "api_service_id" {
  description = "ID del servicio de la API en Render (para la API de deploys)."
  value       = module.app.api_service_id
}

output "api_url" {
  description = "URL pública de la API (health: <api_url>/api/health)."
  value       = module.app.api_url
}

output "database_connection_string" {
  description = "Cadena de conexión directa a PostgreSQL (incluye credenciales)."
  value       = module.database.connection_uri
  sensitive   = true
}

output "database_host" {
  description = "Host de PostgreSQL en Neon."
  value       = module.database.database_host
}

output "database_jdbc_url" {
  description = "URL JDBC para Liquibase (sin credenciales)."
  value       = module.database.jdbc_url
}

output "database_name" {
  description = "Nombre de la base de datos."
  value       = module.database.database_name
}

output "database_user" {
  description = "Usuario propietario de la base de datos."
  value       = module.database.database_user
}

output "neon_project_id" {
  description = "ID del proyecto en Neon."
  value       = module.database.project_id
}

output "web_service_id" {
  description = "ID del sitio estático en Render."
  value       = module.app.web_service_id
}

output "web_url" {
  description = "URL pública del frontend."
  value       = module.app.web_url
}
