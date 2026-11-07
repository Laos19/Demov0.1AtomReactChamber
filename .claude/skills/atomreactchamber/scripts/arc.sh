#!/usr/bin/env bash
# arc.sh — consulta la API de AtomReactChamber desde la terminal (skill de Claude Code).
#
# Uso:
#   arc.sh salud
#   arc.sh especie <fórmula|nombre>        p. ej. arc.sh especie H2O · arc.sh especie "cloruro de sodio"
#   arc.sh reaccion <código|especies>       p. ej. arc.sh reaccion co2 · arc.sh reaccion "H2 + O2"
#   arc.sh reacciones                       lista todas las reacciones
#   arc.sh niveles [grado] [--detalle]      p. ej. arc.sh niveles 3 --detalle
#   arc.sh quimi <pregunta>                 p. ej. arc.sh quimi "¿qué es un mol?"
#   arc.sh dashboard                        requiere ARC_TOKEN o ARC_EMAIL + ARC_PASSWORD (docente)
#   arc.sh token                            imprime un JWT usando ARC_EMAIL + ARC_PASSWORD
#   arc.sh json <ruta>                      JSON crudo de GET /api/<ruta> (p. ej. "catalogo")
#
# Variables: ARC_API_URL (def. http://localhost:8080), ARC_TOKEN, ARC_EMAIL, ARC_PASSWORD,
#            ARC_TELEMETRIA=0 para no registrar uso (origen "claude").
# Requisitos: curl. Node ≥ 18 opcional para salida legible (sin node se imprime JSON crudo).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API="${ARC_API_URL:-http://localhost:8080}"
API="${API%/}"; API="${API%/api}"
CURL=(curl -sS -m 15 -H 'accept: application/json')

ayuda() { sed -n '2,19p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

formatear() { # formatear <comando> [args...]  (lee JSON por stdin)
  if command -v node > /dev/null 2>&1; then node "$DIR/formato.mjs" "$@"; else cat; echo; fi
}

get() { "${CURL[@]}" "$API/api/$1" "${@:2}"; }

uuid() {
  cat /proc/sys/kernel/random/uuid 2> /dev/null \
    || node -e 'console.log(require("crypto").randomUUID())' 2> /dev/null \
    || uuidgen
}

# Sesión de uso: ARC_SESION o una por usuario y día (para no contar cada comando como sesión nueva).
sesion() {
  if [ -n "${ARC_SESION:-}" ]; then printf '%s' "$ARC_SESION"; return; fi
  local f="${TMPDIR:-/tmp}/arc-claude-sesion-${USER:-u}-$(date +%F)"
  [ -s "$f" ] || uuid > "$f" 2> /dev/null || true
  if [ -s "$f" ]; then tr -d '\n' < "$f"; else uuid; fi
}

telemetria() { # telemetria <tipo> <datos-json>  — en segundo plano, nunca falla
  [ "${ARC_TELEMETRIA:-1}" = "0" ] && return 0
  local cuerpo
  cuerpo=$(printf '{"sesion":"%s","origen":"claude","dispositivo":"escritorio","eventos":[{"tipo":"%s","datos":%s}]}' "$(sesion)" "$1" "$2")
  (curl -sS -m 3 -o /dev/null -X POST "$API/api/eventos" -H 'content-type: application/json' -d "$cuerpo" > /dev/null 2>&1 || true) &
}

token() {
  if [ -n "${ARC_TOKEN:-}" ]; then printf '%s' "$ARC_TOKEN"; return; fi
  if [ -z "${ARC_EMAIL:-}" ] || [ -z "${ARC_PASSWORD:-}" ]; then
    echo "Falta ARC_TOKEN (o ARC_EMAIL y ARC_PASSWORD de una cuenta docente)." >&2; exit 2
  fi
  local cuerpo
  cuerpo=$(ARC_EMAIL="$ARC_EMAIL" ARC_PASSWORD="$ARC_PASSWORD" node -e \
    'process.stdout.write(JSON.stringify({email:process.env.ARC_EMAIL,password:process.env.ARC_PASSWORD}))')
  "${CURL[@]}" -X POST "$API/api/auth/login" -H 'content-type: application/json' -d "$cuerpo" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let j={};try{j=JSON.parse(s)}catch{}
        if(!j.token){console.error("No se pudo iniciar sesión: "+(j.mensaje||s));process.exit(1)}process.stdout.write(j.token)})'
}

cmd="${1:-ayuda}"; shift || true
case "$cmd" in
  salud | health) get health | formatear salud ;;
  especie)
    [ $# -ge 1 ] || { echo "Uso: arc.sh especie <fórmula|nombre>" >&2; exit 2; }
    get catalogo | formatear especie "$*"
    telemetria pagina_vista '{"vista":"claude:especie"}' ;;
  reaccion)
    [ $# -ge 1 ] || { echo "Uso: arc.sh reaccion <código|especies>" >&2; exit 2; }
    get catalogo | formatear reaccion "$*"
    telemetria reaccion_observada '{"vista":"claude:reaccion"}' ;;
  reacciones) get catalogo | formatear reacciones ;;
  niveles)
    get juego | formatear niveles "$@"
    telemetria pagina_vista '{"vista":"claude:niveles"}' ;;
  quimi)
    [ $# -ge 1 ] || { echo "Uso: arc.sh quimi <pregunta>" >&2; exit 2; }
    get quimi -G --data-urlencode "q=$*" | formatear quimi "$*"
    telemetria quimi_consulta '{"via":"claude"}' ;;
  dashboard)
    tk="$(token)"
    get dashboard -H "authorization: Bearer $tk" | formatear dashboard
    telemetria pagina_vista '{"vista":"claude:dashboard"}' ;;
  token) token; echo ;;
  json) get "${1:?ruta}" ; echo ;;
  ayuda | help | -h | --help) ayuda ;;
  *) echo "Comando desconocido: $cmd" >&2; ayuda >&2; exit 2 ;;
esac
wait 2> /dev/null || true
