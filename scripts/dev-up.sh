#!/usr/bin/env bash
# ==============================================================================
# scripts/dev-up.sh — Lanzador Local Unificado (Monolito Next.js + IA Gateway + MySQL)
# Protocolo de Acero S+ / PBI-GW-015 / HU-KAIZEN-003
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_DIR="${REPO_DIR}/src"
GATEWAY_DIR="${REPO_DIR}/ia-gateway"
ENV_FILE="${PROJECT_DIR}/.env.local"
GATEWAY_PORT=3001
GATEWAY_PID=""

cleanup() {
  if [[ -n "$GATEWAY_PID" ]] && kill -0 "$GATEWAY_PID" 2>/dev/null; then
    echo "==> Deteniendo IA Gateway (PID $GATEWAY_PID)..."
    kill "$GATEWAY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# --- 0. Aduana: fichero de entorno local -------------------------------------
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] No existe $ENV_FILE (copia src/.env.example como .env.local)." >&2
  exit 1
fi
for VAR in IA_GATEWAY_URL IA_GATEWAY_SECRET; do
  if ! grep -qE "^${VAR}=" "$ENV_FILE"; then
    echo "[ERROR] $ENV_FILE debe definir ${VAR} (HU-16, ver src/.env.example)." >&2
    exit 1
  fi
done

# --- 1. MySQL de desarrollo -------------------------------------------------
echo "==> Verificando estado del contenedor MySQL (bx-mysql-dev)..."
if ! docker ps --format '{{.Names}}' | grep -q "^bx-mysql-dev$"; then
  echo "==> Iniciando contenedor bx-mysql-dev..."
  docker start bx-mysql-dev >/dev/null
fi

# --- 2. Instancias previas de next dev de ESTE proyecto ----------------------
# Next 16 aborta si detecta otro `next dev` en el mismo directorio.
STALE_PIDS="$(pgrep -f "${PROJECT_DIR}/node_modules/.bin/next dev" || true)"
if [[ -n "$STALE_PIDS" ]]; then
  echo "==> Deteniendo instancia previa de next dev (PIDs: $(echo "$STALE_PIDS" | tr '\n' ' '))..."
  # shellcheck disable=SC2086
  kill $STALE_PIDS 2>/dev/null || true
  sleep 2
fi

# --- 3. IA Gateway (compilación TypeScript + arranque en el host) -----------
echo "==> Compilando IA Gateway ($GATEWAY_DIR)..."
(
  cd "$GATEWAY_DIR"
  if [[ ! -d node_modules ]]; then
    echo "==> Instalando dependencias del IA Gateway..."
    npm ci
  fi
  npm run build
)

if ss -ltn 2>/dev/null | grep -q ":${GATEWAY_PORT} "; then
  echo "==> Puerto ${GATEWAY_PORT} ya ocupado: se reutiliza el IA Gateway en ejecución."
else
  echo "==> Iniciando IA Gateway en 127.0.0.1:${GATEWAY_PORT}..."
  (
    cd "$GATEWAY_DIR"
    PORT="$GATEWAY_PORT" exec node --env-file="$ENV_FILE" dist/index.js
  ) &
  GATEWAY_PID=$!
fi

echo "==> Esperando /healthz del IA Gateway..."
for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${GATEWAY_PORT}/healthz" >/dev/null 2>&1; then
    echo "==> IA Gateway saludable."
    break
  fi
  sleep 0.5
done
if ! curl -fsS "http://127.0.0.1:${GATEWAY_PORT}/healthz" >/dev/null 2>&1; then
  echo "[ERROR] El IA Gateway no respondió en /healthz." >&2
  exit 1
fi

# --- 4. Monolito Next.js -----------------------------------------------------
echo "==> Accediendo al directorio del proyecto: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "==> Iniciando servidor Next.js..."
npm run dev
