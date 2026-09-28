#!/usr/bin/env bash
# PBI-STEEL-017 — Rota la contraseña de MYSQL_USER en el contenedor MySQL del Nodo 11.
# Uso (desde src/ con .env.production ya actualizado con MYSQL_PASSWORD y DATABASE_URL nuevos):
#   ../scripts/rotate-mysql-app-password.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../src/.env.production"

if [ ! -f "${ENV_FILE}" ]; then
  echo "No se encontró ${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD no definida}"
: "${MYSQL_USER:?MYSQL_USER no definida}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD no definida}"

docker exec barcelonaxplorer_mysql mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -e \
  "ALTER USER '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}'; FLUSH PRIVILEGES;"

echo "Contraseña de ${MYSQL_USER} actualizada en MySQL (sin imprimir el valor)."
