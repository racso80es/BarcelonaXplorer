
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
    echo -e "${RED}[ERROR] Espacio crítico en ${TARGET_HOST}: solo ${REMOTE_DISK_FREE_PCT}% libre en / (mínimo requerido: 10%).${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Espacio en disco validado en el nodo destino: ${REMOTE_DISK_FREE_PCT}% disponible (${REMOTE_DISK_USE_PCT}% usado).${NC}"

# 4. Verificación de persistencia de credenciales de seguridad en .env.production (Aduana Física)
echo -e "${YELLOW}>>> Verificando configuración perimetral en .env.production...${NC}"
ENV_PROD="${PROJECT_ROOT}/src/.env.production"
if [[ ! -f "${ENV_PROD}" ]]; then
    echo -e "${RED}[ERROR] No se encuentra el archivo de configuración de producción en ${ENV_PROD}.${NC}"
    echo -e "${YELLOW}[TIP] Puedes generarlo copiando src/.env.example a src/.env.production y configurando los secretos reales.${NC}"
    exit 1
fi
if ! grep -q "^ADMIN_USER=" "${ENV_PROD}" || ! grep -q "^ADMIN_PASSWORD_HASH=" "${ENV_PROD}"; then
    echo -e "${RED}[ERROR] ${ENV_PROD} debe definir ADMIN_USER y ADMIN_PASSWORD_HASH antes del despliegue al Nodo 11.${NC}"
    exit 1
fi
if ! grep -q "^TELEMETRY_LLM_ENABLED=" "${ENV_PROD}" || ! grep -q "^CRON_SECRET=" "${ENV_PROD}"; then
    echo -e "${RED}[ERROR] ${ENV_PROD} debe definir TELEMETRY_LLM_ENABLED y CRON_SECRET antes del despliegue al Nodo 11.${NC}"
    exit 1
fi
if ! grep -q "^TELEGRAM_BOT_TOKEN=" "${ENV_PROD}"; then
    echo -e "${RED}[ERROR] ${ENV_PROD} debe definir TELEGRAM_BOT_TOKEN para la activación del canal Telegram.${NC}"
    exit 1
fi
PATROL_LINE=$(grep -E '^PATROL_SECRET_TOKEN=' "${ENV_PROD}" | tail -n 1 || true)
if [[ -z "${PATROL_LINE}" ]]; then
    echo -e "${RED}[ERROR] ${ENV_PROD} debe definir PATROL_SECRET_TOKEN (mínimo 32 caracteres) para la patrulla Telegram.${NC}"
    exit 1
fi
PATROL_VAL="${PATROL_LINE#PATROL_SECRET_TOKEN=}"
PATROL_VAL="${PATROL_VAL%\"}"
PATROL_VAL="${PATROL_VAL#\"}"
if (( ${#PATROL_VAL} < 32 )); then
    echo -e "${RED}[ERROR] PATROL_SECRET_TOKEN en ${ENV_PROD} debe tener al menos 32 caracteres.${NC}"
    exit 1
fi
if [[ "${PATROL_VAL}" == "bcn_patrol_secret_default" ]]; then
    echo -e "${RED}[ERROR] PATROL_SECRET_TOKEN no puede ser el literal histórico comprometido (bcn_patrol_secret_default).${NC}"
    exit 1
fi
if ! grep -q "^TELEGRAM_ENABLED=true" "${ENV_PROD}"; then
    echo -e "${YELLOW}[WARN] TELEGRAM_ENABLED no está definido como 'true' en ${ENV_PROD}.${NC}"
fi

# Validación de Aduana Universal IA Gateway (PBI-GW-008)
IA_GATEWAY_LINE=$(grep -E '^IA_GATEWAY_SECRET=' "${ENV_PROD}" | tail -n 1 || true)
if [[ -z "${IA_GATEWAY_LINE}" ]]; then
    echo -e "${RED}[ERROR] ${ENV_PROD} debe definir IA_GATEWAY_SECRET (mínimo 32 caracteres) para el microservicio IA Gateway.${NC}"
    exit 1
fi
IA_GATEWAY_VAL="${IA_GATEWAY_LINE#IA_GATEWAY_SECRET=}"
IA_GATEWAY_VAL="${IA_GATEWAY_VAL%\"}"
IA_GATEWAY_VAL="${IA_GATEWAY_VAL#\"}"
if (( ${#IA_GATEWAY_VAL} < 32 )); then
    echo -e "${RED}[ERROR] IA_GATEWAY_SECRET en ${ENV_PROD} debe tener al menos 32 caracteres.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Variables críticas de producción (.env.production) validadas y listas para sincronización con el Nodo 11.${NC}"

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