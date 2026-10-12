#!/usr/bin/env bash
# ==============================================================================
# scripts/db-dev.sh — MySQL de desarrollo sin secretos en la línea de comandos (PBI-DEV-001)
# Axioma I (Vertical Slicing / Infra Local) y Axioma II (Frontera Determinista)
# Uso: ./scripts/db-dev.sh create | shell | exec "<SQL>"
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${REPO_DIR}/src/.env.local"
CONTAINER="bx-mysql-dev"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] No existe el archivo de entorno: $ENV_FILE" >&2
  exit 1
fi

get_env_var() {
  grep -E "^${1}=" "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

MYSQL_ROOT_PWD="$(get_env_var MYSQL_ROOT_PASSWORD)"
if [[ -z "$MYSQL_ROOT_PWD" ]]; then
  echo "[ERROR] MYSQL_ROOT_PASSWORD no está definida en $ENV_FILE" >&2
  exit 1
fi

MYSQL_DB="$(get_env_var MYSQL_DATABASE)"
export MYSQL_PWD="$MYSQL_ROOT_PWD"

case "${1:-}" in
  create)
    echo "==> Aprovisionando contenedor $CONTAINER con --restart unless-stopped..."
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
      echo "[AVISO] El contenedor $CONTAINER ya existe. Usa 'shell' o 'exec' o elimínalo primero con 'docker rm -f $CONTAINER'."
      exit 0
    fi
    # --env-file desde process substitution: los secretos no viajan en argv ni en el historial
    docker run -d --name "$CONTAINER" --restart unless-stopped \
      -p 127.0.0.1:3306:3306 \
      --env-file <(grep -E '^MYSQL_(ROOT_PASSWORD|DATABASE|USER|PASSWORD)=' "$ENV_FILE" | tr -d '"' | tr -d "'") \
      mysql:8.0 >/dev/null
    echo "==> Contenedor $CONTAINER creado y vinculado a 127.0.0.1:3306."
    ;;

  shell)
    # docker exec sin valor en -e toma la variable del entorno exportado del proceso padre
    if [[ -n "$MYSQL_DB" ]]; then
      docker exec -it -e MYSQL_PWD "$CONTAINER" mysql -uroot "$MYSQL_DB"
    else
      docker exec -it -e MYSQL_PWD "$CONTAINER" mysql -uroot
    fi
    ;;

  exec)
    if [[ -z "${2:-}" ]]; then
      echo "Uso: $0 exec \"<instruccion-sql>\"" >&2
      exit 2
    fi
    if [[ -n "$MYSQL_DB" ]]; then
      printf '%s\n' "$2" | docker exec -i -e MYSQL_PWD "$CONTAINER" mysql -uroot "$MYSQL_DB"
    else
      printf '%s\n' "$2" | docker exec -i -e MYSQL_PWD "$CONTAINER" mysql -uroot
    fi
    ;;

  *)
    echo "Uso: $0 create | shell | exec \"<SQL>\"" >&2
    exit 2
    ;;
esac
