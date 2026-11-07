#!/usr/bin/env bash
# Ejecuta Liquibase (imagen oficial de Docker) contra la BD indicada por
# LIQUIBASE_COMMAND_URL / LIQUIBASE_COMMAND_USERNAME / LIQUIBASE_COMMAND_PASSWORD.
# Uso: .github/scripts/liquibase.sh <comando> [args...]
#   p. ej. .github/scripts/liquibase.sh status --verbose
# El changelog siempre se referencia con la misma ruta relativa a la raíz del
# repositorio para que DATABASECHANGELOG.FILENAME coincida en todos los entornos.
set -euo pipefail

IMAGE="${LIQUIBASE_IMAGE:-liquibase/liquibase:4.33}"
WORKSPACE="${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel)}"
CHANGELOG="${LIQUIBASE_CHANGELOG:-db/changelog/db.changelog-master.yaml}"

: "${LIQUIBASE_COMMAND_URL:?Defina LIQUIBASE_COMMAND_URL (jdbc:postgresql://host:5432/db)}"

exec docker run --rm --network host \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v "${WORKSPACE}:/workspace" -w /workspace \
  -e LIQUIBASE_COMMAND_URL \
  -e LIQUIBASE_COMMAND_USERNAME \
  -e LIQUIBASE_COMMAND_PASSWORD \
  -e LIQUIBASE_COMMAND_CHANGELOG_FILE="${CHANGELOG}" \
  -e LIQUIBASE_SEARCH_PATH=/workspace \
  -e LIQUIBASE_SHOW_BANNER=false \
  -e LIQUIBASE_ANALYTICS_ENABLED=false \
  -e LIQUIBASE_LOG_LEVEL="${LIQUIBASE_LOG_LEVEL:-WARNING}" \
  "${IMAGE}" "$@"
