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

export MYSQL_PWD="${MYSQL_ROOT_PASSWORD}"
printf "ALTER USER '%s'@'%%' IDENTIFIED BY '%s'; FLUSH PRIVILEGES;\n" "${MYSQL_USER}" "${MYSQL_PASSWORD}" \
  | docker exec -i -e MYSQL_PWD barcelonaxplorer_mysql mysql -uroot
unset MYSQL_PWD

echo "Contraseña de ${MYSQL_USER} actualizada en MySQL (sin imprimir el valor)."
