# Entorno de producción: composición de módulos.
# Para migrar a otra nube se reemplaza el módulo (p. ej. database-neon -> database-azure-flexible)
# manteniendo las mismas salidas (connection_uri, database_host, api_url, web_url).

module "database" {
  source = "../../modules/database-neon"

  project_name = var.project_name
  org_id       = var.neon_org_id
  region_id    = var.neon_region
  pg_version   = 16
}

module "app" {
  source = "../../modules/app-render"

  name_prefix        = var.project_name
  repo_url           = var.repo_url
  branch             = var.branch
  region             = var.render_region
  database_url       = module.database.connection_uri_pooler
  extra_cors_origins = var.extra_cors_origins
}
