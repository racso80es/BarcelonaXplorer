#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Protocolo de Acero — Grado S+ · Inicializador de Git Hooks Locales
# BarcelonaXplorer
# ═══════════════════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🔧 Configurando Git Hooks deterministas en BarcelonaXplorer..."

# Configurar ruta canónica de githooks
git -C "${REPO_ROOT}" config core.hooksPath .githooks

# Asignar permisos de ejecución al hook pre-commit
if [ -f "${REPO_ROOT}/.githooks/pre-commit" ]; then
  chmod +x "${REPO_ROOT}/.githooks/pre-commit"
  echo "🔒 Permisos de ejecución asignados a .githooks/pre-commit"
fi

CURRENT_HOOKS_PATH="$(git -C "${REPO_ROOT}" config core.hooksPath)"
echo "✅ Hooks configurados correctamente: core.hooksPath = ${CURRENT_HOOKS_PATH}"
