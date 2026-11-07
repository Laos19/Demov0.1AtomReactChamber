# Credenciales por variables de entorno (nunca en el código):
#   NEON_API_KEY, RENDER_API_KEY, RENDER_OWNER_ID
provider "neon" {}

provider "render" {
  # No se espera al deploy: release.yml lo dispara después de migrar con Liquibase.
  wait_for_deploy_completion = false
}
