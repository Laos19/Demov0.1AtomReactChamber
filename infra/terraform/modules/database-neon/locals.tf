locals {
  # URL JDBC para Liquibase (credenciales se pasan aparte vía LIQUIBASE_COMMAND_USERNAME/PASSWORD).
  jdbc_url = "jdbc:postgresql://${neon_project.main.database_host}:5432/${neon_project.main.database_name}?sslmode=require"
}
