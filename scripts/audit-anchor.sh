#!/usr/bin/env bash
# ==============================================================================
# BarcelonaXplorer — Protocolo de Auditoría y Anclaje Documental Evolutivo
# PBI: PBI-OPS-DOC-ANCHOR-001 (S+ Grade)
# Axioma II: Tolerancia Cero a la Inferencia
# Axioma IV: El Peaje del Oráculo
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🔍 Iniciando Protocolo de Auditoría y Anclaje Documental..."
echo "📍 Repositorio: ${REPO_ROOT}"

cd "${REPO_ROOT}"

# 1. Determinación estricta de la frontera de anclaje (Axioma II)
if git describe --tags --abbrev=0 >/dev/null 2>&1; then
  LAST_TAG="$(git describe --tags --abbrev=0)"
  echo "🏷️  Último Tag Canónico detectado: ${LAST_TAG}"
else
  LAST_TAG="$(git rev-list --max-parents=0 HEAD | head -n 1)"
  echo "⚠️  No se encontraron tags. Utilizando commit raíz como base: ${LAST_TAG}"
fi

CURRENT_HEAD="$(git rev-parse --short HEAD)"
echo "📌 HEAD actual: ${CURRENT_HEAD}"
echo ""

# 2. Extracción de Delta Git
echo "═══════════════════════════════════════════════════════════════════"
echo "📜 Commits en el Delta (${LAST_TAG}..HEAD):"
echo "═══════════════════════════════════════════════════════════════════"
git log "${LAST_TAG}..HEAD" --oneline || echo "Sin commits nuevos."
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "📊 Resumen de Alteraciones Físicas (git diff --stat):"
echo "═══════════════════════════════════════════════════════════════════"
git diff --stat "${LAST_TAG}..HEAD" || echo "Sin diferencias físicas."
echo ""

# 3. Consulta al Peaje del Oráculo (Axioma IV)
echo "═══════════════════════════════════════════════════════════════════"
echo "⚖️  Consultando el Cuádruple Oráculo (Fail-Fast por coste termodinámico)..."
echo "═══════════════════════════════════════════════════════════════════"

cd "${REPO_ROOT}/src"

echo "1/6 Linter AST (eslint, --max-warnings 0, src + tests/)..."
if npm run lint; then
  echo "✅ Linter: 0 problemas y 0 avisos."
else
  echo "❌ Linter: Falló la aduana AST (Revisar log)."
  exit 1
fi

echo "2/6 Compilador TypeScript aplicación (tsc --noEmit)..."
npx tsc --noEmit
echo "✅ Compilador aplicación: 0 errores."

echo "3/6 Compilador TypeScript Playwright (tsconfig.playwright-e2e.json)..."
npx tsc --noEmit -p tsconfig.playwright-e2e.json
echo "✅ Compilador Playwright E2E: 0 errores."

echo "4/6 Compilador TypeScript árbol tests/ (tests/tsconfig.json)..."
TESTS_NODE_MODULES="${REPO_ROOT}/tests/node_modules"
if [ ! -e "${TESTS_NODE_MODULES}" ]; then
  ln -sf ../src/node_modules "${TESTS_NODE_MODULES}"
fi
npx tsc --noEmit -p ../tests/tsconfig.json
echo "✅ Compilador tests/: 0 errores."

echo "5/6 Suite de Pruebas (vitest run)..."
npm test
echo "✅ Suite de Pruebas: 100% verde."

echo "6/6 Blindaje empírico E2E (playwright test)..."
CI=1 npm run test:e2e
echo "✅ Playwright E2E: 100% verde."

echo ""
echo "🎉 Protocolo de Extracción de Delta completado con éxito."
