output "api_service_id" {
  description = "ID del Web Service de la API en Render (srv-...)."
  value       = render_web_service.api.id
}

output "api_url" {
  description = "URL pública de la API."
  value       = render_web_service.api.url
}

output "cors_origins" {
  description = "Orígenes configurados en CORS_ORIGIN (separados por comas)."
  value       = local.cors_origins
}

output "web_service_id" {
  description = "ID del Static Site en Render."
  value       = render_static_site.web.id
}

output "web_url" {
  description = "URL pública del frontend."
  value       = render_static_site.web.url
}
