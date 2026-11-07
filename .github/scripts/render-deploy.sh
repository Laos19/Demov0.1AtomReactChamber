#!/usr/bin/env bash
# Dispara un deploy de Render mediante su Deploy Hook y, si hay RENDER_API_KEY,
# espera a que el deploy quede "live".
# Uso: render-deploy.sh <nombre> <deploy-hook-url> [timeout_segundos]
# Escribe "<nombre>_status=<estado>" en $GITHUB_OUTPUT.
set -euo pipefail

name="$1"
hook="$2"
timeout="${3:-900}"
out="${GITHUB_OUTPUT:-/dev/null}"

response=$(curl -fsS -X POST "$hook")
deploy_id=$(jq -r '.deploy.id // .id // empty' <<<"$response" 2>/dev/null || true)
service_id=$(sed -E 's#.*/deploy/(srv-[^?]+).*#\1#' <<<"$hook")
echo "Deploy de $name disparado (servicio ${service_id}, deploy ${deploy_id:-desconocido})."

if [ -z "${RENDER_API_KEY:-}" ] || [ -z "$deploy_id" ]; then
  echo "${name}_status=triggered" >> "$out"
  exit 0
fi

deadline=$(( $(date +%s) + timeout ))
status="unknown"
while [ "$(date +%s)" -lt "$deadline" ]; do
  status=$(curl -fsS -H "Authorization: Bearer ${RENDER_API_KEY}" -H "Accept: application/json" \
    "https://api.render.com/v1/services/${service_id}/deploys/${deploy_id}" | jq -r '.status // .deploy.status // "unknown"')
  echo "$(date -u +%T) $name: $status"
  case "$status" in
    live) break ;;
    build_failed|update_failed|canceled|deactivated|pre_deploy_failed)
      echo "${name}_status=$status" >> "$out"
      exit 1 ;;
  esac
  sleep 15
done
echo "${name}_status=$status" >> "$out"
[ "$status" = "live" ]
