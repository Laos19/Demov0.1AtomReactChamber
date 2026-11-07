output "connection_uri" {
  description = "URI de conexión directa (postgresql://usuario:clave@host/db?sslmode=require). Usar para migraciones y pg_dump."
  value       = neon_project.main.connection_uri
  sensitive   = true
}

output "connection_uri_pooler" {
  description = "URI de conexión vía PgBouncer (pooler). Recomendado para la API."
  value       = neon_project.main.connection_uri_pooler
  sensitive   = true
}

output "database_host" {
  description = "Host del endpoint read-write por defecto."
  value       = neon_project.main.database_host
}

output "database_name" {
  description = "Nombre de la base de datos por defecto."
  value       = neon_project.main.database_name
}

output "database_password" {
  description = "Contraseña del rol por defecto."
  value       = neon_project.main.database_password
  sensitive   = true
}

output "database_user" {
  description = "Rol (usuario) por defecto."
  value       = neon_project.main.database_user
}

output "jdbc_url" {
  description = "URL JDBC para Liquibase (sin credenciales)."
  value       = local.jdbc_url
}

output "project_id" {
  description = "ID del proyecto Neon."
  value       = neon_project.main.id
}
