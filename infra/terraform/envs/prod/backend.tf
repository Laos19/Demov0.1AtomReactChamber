# Estado remoto en HCP Terraform (plan Free, hasta 500 recursos gestionados).
# La organización y el workspace se leen de variables de entorno para no
# acoplar el código a una cuenta concreta:
#   TF_CLOUD_ORGANIZATION=<organización>   TF_WORKSPACE=atomreactchamber-prod
#   TF_TOKEN_app_terraform_io=<token>      (en CI se deriva del secret TF_API_TOKEN)
# El workspace debe usar "Execution Mode: Local" para que el plan/apply corra en
# GitHub Actions con los secrets del repositorio y HCP solo guarde el estado.
#
# Alternativa sin HCP (ver infra/README.md): el workflow genera
# backend_override.tf con `backend "pg" {}` usando el secret TF_STATE_PG_CONN_STR.
terraform {
  cloud {}
}
