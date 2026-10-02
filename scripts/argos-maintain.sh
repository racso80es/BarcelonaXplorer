#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Script de Ejecución Manual: Sonda Argos (Mantenimiento y Exploración)
# Protocolo de Acero — Grado S+
# Dispara POST /api/context/maintain protegido con CRON_SECRET
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -d "${SCRIPT_DIR}/../src" ]]; then
    PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
elif [[ -d "${SCRIPT_DIR}/src" ]]; then
    PROJECT_ROOT="${SCRIPT_DIR}"
else
    PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
fi

# Colores para salida por consola
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Sonda Argos: Diagnóstico de Fuentes y Exploración de Contexto   ${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════════${NC}"

# 1. Comprobación de herramientas necesarias
if ! command -v curl &> /dev/null; then
    echo -e "${RED}[ERROR] curl no está instalado en el entorno local.${NC}"
    exit 1
fi

# 2. Localización y extracción de CRON_SECRET
ENV_FILE=""
CANDIDATE_ENVS=(
    "${PROJECT_ROOT}/src/.env.local"
    "${PROJECT_ROOT}/src/.env.cron"
    "${PROJECT_ROOT}/src/.env.web"
    "${PROJECT_ROOT}/.env.local"
)

for f in "${CANDIDATE_ENVS[@]}"; do
    if [[ -f "$f" ]]; then
        if grep -q "^CRON_SECRET=" "$f" 2>/dev/null; then
            ENV_FILE="$f"
            break
        fi
    fi
done

if [[ -z "${ENV_FILE}" ]]; then
    echo -e "${RED}[ERROR] No se encontró ningún archivo de entorno con CRON_SECRET configurada.${NC}"
    exit 1
fi

echo -e "${YELLOW}>>> Cargando credenciales perimetrales desde: ${ENV_FILE}...${NC}"
CRON_SECRET=$(grep "^CRON_SECRET=" "${ENV_FILE}" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [[ -z "${CRON_SECRET}" ]]; then
    echo -e "${RED}[ERROR] CRON_SECRET está vacía en ${ENV_FILE}.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] CRON_SECRET cargada con éxito.${NC}"

# 3. Determinación de URL destino
TARGET_HOST="${ARGOS_HOST:-http://localhost:3000}"
ENDPOINT_PATH="/api/context/maintain"
MODE="maintain"

# Soporte para flag opcional --ingest
if [[ "${1:-}" == "--ingest" ]]; then
    ENDPOINT_PATH="/api/context/ingest"
    MODE="ingest"
fi

FULL_URL="${TARGET_HOST}${ENDPOINT_PATH}"
echo -e "${YELLOW}>>> Verificando disponibilidad de la aplicación en ${TARGET_HOST}...${NC}"

if ! curl -s --connect-timeout 3 -I "${TARGET_HOST}" > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] No se pudo conectar con ${TARGET_HOST}. Asegúrate de que el servidor está levantado.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Aplicación web alcanzable.${NC}"

# 4. Lanzamiento de la sonda
echo -e "${YELLOW}>>> Disparando endpoint ${ENDPOINT_PATH} [Modo: ${MODE}]...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FULL_URL}" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json")

HTTP_STATUS=$(echo "${RESPONSE}" | tail -n1)
BODY=$(echo "${RESPONSE}" | sed '$d')

if [[ "${HTTP_STATUS}" -ne 200 ]]; then
    echo -e "${RED}[ERROR] Falló la petición. Código HTTP: ${HTTP_STATUS}${NC}"
    echo -e "${RED}Respuesta:${NC} ${BODY}"
    exit 1
fi

echo -e "${GREEN}[OK] Petición completada con éxito (HTTP 200).${NC}"
echo -e "${CYAN}--- Detalle de la Operación ---${NC}"

if command -v jq &> /dev/null; then
    echo "${BODY}" | jq .
else
    echo "${BODY}"
fi

echo -e "${CYAN}──────────────────────────────────────────────────────────────────${NC}"
echo -e "${GREEN}Sonda completada. Puedes revisar el panel en: ${TARGET_HOST}/Admin/Context${NC}"
exit 0
