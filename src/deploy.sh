#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Script de Despliegue Automatizado - BarcelonaXplorer (Ansistrano)
# Destino: Nodo de Producción 10.0.10.11
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -d "${SCRIPT_DIR}/../ansible" ]]; then
    PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
else
    PROJECT_ROOT="${SCRIPT_DIR}"
fi
ANSIBLE_DIR="${PROJECT_ROOT}/ansible"
INVENTORY="${ANSIBLE_DIR}/inventory.ini"
PLAYBOOK="${ANSIBLE_DIR}/deploy.yml"
TARGET_HOST="10.0.10.11"
SSH_USER="racso"

# Colores para salida por consola
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}>>> Iniciando protocolo de despliegue para BarcelonaXplorer...${NC}"

# 1. Comprobación de herramientas necesarias
if ! command -v ansible-playbook &> /dev/null; then
    echo -e "${RED}[ERROR] ansible-playbook no está instalado en el entorno local.${NC}"
    exit 1
fi

# 2. Verificación de archivos estructurales de Ansible
if [[ ! -f "${INVENTORY}" ]]; then
    echo -e "${RED}[ERROR] No se encuentra el inventario en ${INVENTORY}${NC}"
    exit 1
fi

if [[ ! -f "${PLAYBOOK}" ]]; then
    echo -e "${RED}[ERROR] No se encuentra el playbook maestro en ${PLAYBOOK}${NC}"
    exit 1
fi

# 3. Comprobación de conectividad SSH con el Nodo 11 (Zero-Trust check)
echo -e "${YELLOW}>>> Comprobando latencia y canal SSH hacia ${SSH_USER}@${TARGET_HOST}...${NC}"
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "${SSH_USER}@${TARGET_HOST}" 'echo ok' &> /dev/null; then
    echo -e "${RED}[ERROR] Conexión SSH fallida hacia ${TARGET_HOST}. Verifica el par de claves Ed25519.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Canal SSH validado.${NC}"

# 3.1. Verificación preventiva de espacio libre en disco raíz del Nodo 11 (Axioma I y II)
echo -e "${YELLOW}>>> Verificando capacidad de almacenamiento en partición raíz de ${TARGET_HOST}...${NC}"
REMOTE_DISK_USE_PCT=$(ssh -o BatchMode=yes -o ConnectTimeout=5 "${SSH_USER}@${TARGET_HOST}" "df / | awk 'NR==2 {print \$5}' | tr -d '%'")
REMOTE_DISK_FREE_PCT=$((100 - REMOTE_DISK_USE_PCT))

if (( REMOTE_DISK_FREE_PCT < 10 )); then
    echo -e "${YELLOW}[WARNING] Espacio crítico detectado (${REMOTE_DISK_FREE_PCT}% libre). Intentando purgar caché de BuildKit...${NC}"
    
    PURGE_OUTPUT=$(ssh -o BatchMode=yes -o ConnectTimeout=5 "${SSH_USER}@${TARGET_HOST}" "docker builder prune -a -f" 2>&1) || {
        echo -e "${RED}[ERROR] Falló la purga de BuildKit en ${TARGET_HOST}. Salida remota:${NC}\n${PURGE_OUTPUT}"
        exit 1
    }
    
    RECLAIMED=$(echo "$PURGE_OUTPUT" | grep -i "Total reclaimed space" || echo "Total reclaimed space: desconocido")
    echo -e "${YELLOW}[INFO] ${RECLAIMED}${NC}"
    
    REMOTE_DISK_USE_PCT_AFTER=$(ssh -o BatchMode=yes -o ConnectTimeout=5 "${SSH_USER}@${TARGET_HOST}" "df / | awk 'NR==2 {print \$5}' | tr -d '%'")
    REMOTE_DISK_FREE_PCT_AFTER=$((100 - REMOTE_DISK_USE_PCT_AFTER))
    
    if (( REMOTE_DISK_FREE_PCT_AFTER < 10 )); then
        echo -e "${RED}[ERROR] Abortando: Espacio insuficiente en ${TARGET_HOST}. Libre antes: ${REMOTE_DISK_FREE_PCT}%, Libre después: ${REMOTE_DISK_FREE_PCT_AFTER}%. ${RECLAIMED}.${NC}"
        exit 1
    fi
    
    REMOTE_DISK_USE_PCT=$REMOTE_DISK_USE_PCT_AFTER
    REMOTE_DISK_FREE_PCT=$REMOTE_DISK_FREE_PCT_AFTER
fi

echo -e "${GREEN}[OK] Espacio en disco validado en el nodo destino: ${REMOTE_DISK_FREE_PCT}% disponible (${REMOTE_DISK_USE_PCT}% usado).${NC}"

# 4. Verificación de persistencia de credenciales en ficheros segregados (PBI-GW-014)
echo -e "${YELLOW}>>> Verificando configuración perimetral segregada (.env.web y .env.ia-gateway)...${NC}"
ENV_WEB="${PROJECT_ROOT}/src/.env.web"
ENV_GW="${PROJECT_ROOT}/src/.env.ia-gateway"

if [[ ! -f "${ENV_WEB}" ]]; then
    echo -e "${RED}[ERROR] No se encuentra el archivo de entorno del monolito en ${ENV_WEB}.${NC}"
    exit 1
fi
if [[ ! -f "${ENV_GW}" ]]; then
    echo -e "${RED}[ERROR] No se encuentra el archivo de entorno del gateway en ${ENV_GW}.${NC}"
    exit 1
fi

# Validaciones de servicio Web
if ! grep -q "^ADMIN_USER=" "${ENV_WEB}" || ! grep -q "^ADMIN_PASSWORD_HASH=" "${ENV_WEB}"; then
    echo -e "${RED}[ERROR] ${ENV_WEB} debe definir ADMIN_USER y ADMIN_PASSWORD_HASH antes del despliegue al Nodo 11.${NC}"
    exit 1
fi
if ! grep -q "^TELEMETRY_LLM_ENABLED=" "${ENV_WEB}" || ! grep -q "^CRON_SECRET=" "${ENV_WEB}"; then
    echo -e "${RED}[ERROR] ${ENV_WEB} debe definir TELEMETRY_LLM_ENABLED y CRON_SECRET antes del despliegue al Nodo 11.${NC}"
    exit 1
fi
if ! grep -q "^TELEGRAM_BOT_TOKEN=" "${ENV_WEB}"; then
    echo -e "${RED}[ERROR] ${ENV_WEB} debe definir TELEGRAM_BOT_TOKEN para la activación del canal Telegram.${NC}"
    exit 1
fi
if ! grep -q "^GEMINI_API_KEY=" "${ENV_WEB}"; then
    echo -e "${RED}[ERROR] ${ENV_WEB} debe definir GEMINI_API_KEY para embeddings de LanceDB en el monolito.${NC}"
    exit 1
fi

PATROL_LINE=$(grep -E '^PATROL_SECRET_TOKEN=' "${ENV_WEB}" | tail -n 1 || true)
if [[ -z "${PATROL_LINE}" ]]; then
    echo -e "${RED}[ERROR] ${ENV_WEB} debe definir PATROL_SECRET_TOKEN (mínimo 32 caracteres) para la patrulla Telegram.${NC}"
    exit 1
fi
PATROL_VAL="${PATROL_LINE#PATROL_SECRET_TOKEN=}"
PATROL_VAL="${PATROL_VAL%\"}"
PATROL_VAL="${PATROL_VAL#\"}"
if (( ${#PATROL_VAL} < 32 )); then
    echo -e "${RED}[ERROR] PATROL_SECRET_TOKEN en ${ENV_WEB} debe tener al menos 32 caracteres.${NC}"
    exit 1
fi
if [[ "${PATROL_VAL}" == "bcn_patrol_secret_default" ]]; then
    echo -e "${RED}[ERROR] PATROL_SECRET_TOKEN no puede ser el literal histórico comprometido (bcn_patrol_secret_default).${NC}"
    exit 1
fi

# Validaciones de servicio IA Gateway
if ! grep -q "^GEMINI_API_KEY=" "${ENV_GW}" || ! grep -q "^GROQ_API_KEY=" "${ENV_GW}" || ! grep -q "^JEV_API_KEY=" "${ENV_GW}"; then
    echo -e "${RED}[ERROR] ${ENV_GW} debe definir las claves de proveedor (GEMINI_API_KEY, GROQ_API_KEY, JEV_API_KEY).${NC}"
    exit 1
fi

# Aduana de igualdad de IA_GATEWAY_SECRET (CA-2)
GW_SEC_WEB_LINE=$(grep -E '^IA_GATEWAY_SECRET=' "${ENV_WEB}" | tail -n 1 || true)
GW_SEC_GW_LINE=$(grep -E '^IA_GATEWAY_SECRET=' "${ENV_GW}" | tail -n 1 || true)

if [[ -z "${GW_SEC_WEB_LINE}" ]] || [[ -z "${GW_SEC_GW_LINE}" ]]; then
    echo -e "${RED}[ERROR] IA_GATEWAY_SECRET debe estar definido en ambos ficheros (.env.web y .env.ia-gateway).${NC}"
    exit 1
fi

GW_SEC_WEB="${GW_SEC_WEB_LINE#IA_GATEWAY_SECRET=}"
GW_SEC_WEB="${GW_SEC_WEB%\"}"
GW_SEC_WEB="${GW_SEC_WEB#\"}"

GW_SEC_GW="${GW_SEC_GW_LINE#IA_GATEWAY_SECRET=}"
GW_SEC_GW="${GW_SEC_GW%\"}"
GW_SEC_GW="${GW_SEC_GW#\"}"

if (( ${#GW_SEC_WEB} < 32 )) || (( ${#GW_SEC_GW} < 32 )); then
    echo -e "${RED}[ERROR] IA_GATEWAY_SECRET debe tener al menos 32 caracteres en ambos ficheros.${NC}"
    exit 1
fi

if [[ "${GW_SEC_WEB}" != "${GW_SEC_GW}" ]]; then
    echo -e "${RED}[ERROR] Discrepancia crítica: IA_GATEWAY_SECRET difiere entre .env.web y .env.ia-gateway. Deben ser estrictamente idénticos para permitir comunicación autorizada.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Ficheros segregados (.env.web y .env.ia-gateway) validados con IA_GATEWAY_SECRET idéntico y seguro.${NC}"

# Aduana de igualdad de CRON_SECRET (PBI-CTX-003 CA-5)
ENV_CRON="${PROJECT_ROOT}/src/.env.cron"
if [[ ! -f "${ENV_CRON}" ]]; then
    echo -e "${RED}[ERROR] No se encuentra el archivo de entorno del sidecar cron en ${ENV_CRON}.${NC}"
    exit 1
fi

CRON_SEC_WEB_LINE=$(grep -E '^CRON_SECRET=' "${ENV_WEB}" | tail -n 1 || true)
CRON_SEC_CRON_LINE=$(grep -E '^CRON_SECRET=' "${ENV_CRON}" | tail -n 1 || true)

if [[ -z "${CRON_SEC_WEB_LINE}" ]] || [[ -z "${CRON_SEC_CRON_LINE}" ]]; then
    echo -e "${RED}[ERROR] CRON_SECRET debe estar definido en ambos ficheros (.env.web y .env.cron).${NC}"
    exit 1
fi

CRON_SEC_WEB="${CRON_SEC_WEB_LINE#CRON_SECRET=}"
CRON_SEC_WEB="${CRON_SEC_WEB%\"}"
CRON_SEC_WEB="${CRON_SEC_WEB#\"}"

CRON_SEC_CRON="${CRON_SEC_CRON_LINE#CRON_SECRET=}"
CRON_SEC_CRON="${CRON_SEC_CRON%\"}"
CRON_SEC_CRON="${CRON_SEC_CRON#\"}"

if [[ "${CRON_SEC_WEB}" != "${CRON_SEC_CRON}" ]]; then
    echo -e "${RED}[ERROR] Discrepancia crítica: CRON_SECRET difiere entre .env.web y .env.cron. Deben ser estrictamente idénticos.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Fichero segregado .env.cron validado con CRON_SECRET idéntico a .env.web.${NC}"

# 5. Aduana Empírica — Playwright E2E (bloqueo atómico; ver HU-13 Anexo B)
# Prohibido: npm run test:e2e || true, ramas if sin exit 1, o desacoplar el exit code del hilo principal.
echo -e "${YELLOW}>>> Ejecutando puerta empírica E2E (CI=1 npm run test:e2e)...${NC}"
if [[ ! -d "${PROJECT_ROOT}/src" ]]; then
    echo -e "${RED}[ERROR] No se encuentra el directorio de aplicación en ${PROJECT_ROOT}/src${NC}"
    exit 1
fi
if ! (
    cd "${PROJECT_ROOT}/src"
    CI=1 npm run test:e2e
); then
    echo -e "${RED}[ERROR] Aduana Empírica E2E fallida. Ignición (ansible-playbook) abortada.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Aduana Empírica E2E superada.${NC}"

# 6. Ignición — Ejecución del pipeline Ansistrano
echo -e "${YELLOW}>>> Disparando Ansistrano hacia el Nodo 11...${NC}"
export ANSIBLE_CONFIG="${ANSIBLE_CONFIG:-${ANSIBLE_DIR}/ansible.cfg}"
ansible-playbook -i "${INVENTORY}" "${PLAYBOOK}" "$@"

echo -e "${GREEN}>>> Despliegue finalizado con éxito en release activa symlink.${NC}"