
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

# 4. Verificación de compilación previa de TypeScript
echo -e "${YELLOW}>>> Ejecutando comprobación de tipos estáticos (noEmit)...${NC}"
if [[ -d "${PROJECT_ROOT}/src" ]]; then
    (cd "${PROJECT_ROOT}/src" && npx tsc --noEmit)
    echo -e "${GREEN}[OK] Compilación TypeScript validada sin errores.${NC}"
fi

# 5. Verificación de persistencia de credenciales de seguridad (/Admin) en .env.local
echo -e "${YELLOW}>>> Verificando credenciales perimetrales en .env.local...${NC}"
ENV_LOCAL="${PROJECT_ROOT}/src/.env.local"
if [[ ! -f "${ENV_LOCAL}" ]]; then
    echo -e "${RED}[ERROR] No se encuentra el archivo de configuración local en ${ENV_LOCAL}.${NC}"
    exit 1
fi
if ! grep -q "^ADMIN_USER=" "${ENV_LOCAL}" || ! grep -q "^ADMIN_PASSWORD_HASH=" "${ENV_LOCAL}"; then
    echo -e "${RED}[ERROR] ${ENV_LOCAL} debe definir ADMIN_USER y ADMIN_PASSWORD_HASH antes del despliegue al Nodo 11.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Variables críticas (/Admin) validadas y listas para sincronización con el Nodo 11.${NC}"

# 6. Ejecución del pipeline Ansistrano
echo -e "${YELLOW}>>> Disparando Ansistrano hacia el Nodo 11...${NC}"
ansible-playbook -i "${INVENTORY}" "${PLAYBOOK}" "$@"

echo -e "${GREEN}>>> Despliegue finalizado con éxito en release activa symlink.${NC}"