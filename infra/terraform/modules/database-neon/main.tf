# Proyecto Neon (PostgreSQL serverless, plan Free).
# Un proyecto incluye: rama por defecto, endpoint de cómputo read-write, rol y base de datos.
resource "neon_project" "main" {
  name                      = var.project_name
  org_id                    = var.org_id
  region_id                 = var.region_id
  pg_version                = var.pg_version
  history_retention_seconds = var.history_retention_seconds

  branch {
    name          = var.default_branch_name
    database_name = var.database_name
    role_name     = var.role_name
  }
}
