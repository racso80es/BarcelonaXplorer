#!/usr/bin/env bash
# ==============================================================================
# BarcelonaXplorer — Protocolo de Auditoría y Anclaje Documental Evolutivo
# PBIs: PBI-OPS-DOC-ANCHOR-001, PBI-GW-011 (S+ Grade)
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

# 3. Consulta al Peaje del Oráculo (Axioma IV, PBI-GW-011)
echo "═══════════════════════════════════════════════════════════════════"
echo "⚖️  Consultando los Oráculos de Certificación (Fail-Fast por coste termodinámico)..."
echo "═══════════════════════════════════════════════════════════════════"

export BX_AUDIT=1

cd "${REPO_ROOT}/src"

echo "1/8 Linter AST (eslint, --max-warnings 0, src/)..."
if npm run lint; then
  echo "✅ Linter: 0 problemas y 0 avisos."
else
  echo "❌ Linter: Falló la aduana AST (Revisar log)."
  exit 1
fi

echo "2/8 Compilador TypeScript monolito (tsc --noEmit)..."
npx tsc --noEmit
echo "✅ Compilador monolito: 0 errores."

echo "3/8 Compilador TypeScript Playwright (tsconfig.playwright-e2e.json)..."
npx tsc --noEmit -p tsconfig.playwright-e2e.json
echo "✅ Compilador Playwright E2E: 0 errores."

echo "4/8 Compilador TypeScript IA Gateway (ia-gateway/)..."
cd "${REPO_ROOT}/ia-gateway"
npx tsc --noEmit
echo "✅ Compilador IA Gateway: 0 errores."

echo "5/8 Suite de Pruebas IA Gateway (ia-gateway/ vitest run)..."
npx vitest run
echo "✅ Suite IA Gateway: 100% verde."

echo "6/8 Suite de Pruebas Monolito (src/ vitest run)..."
cd "${REPO_ROOT}/src"
npm test
echo "✅ Suite Monolito: 100% verde."

echo "7/8 Oráculo de Empaquetado de Producción (src/ npx next build)..."
# CA-1: Verificación de bundling real: detecta fallos de symlinks (AUD-INFRA-GW-001) y CSS de Tailwind
npx next build
echo "✅ Empaquetador de Producción: 0 errores, rutas generadas correctamente."

echo "8/8 Blindaje empírico E2E (playwright test con BX_AUDIT=1)..."
# CA-2 y CA-5: BX_AUDIT=1 fuerza reuseExistingServer: false en playwright.config.ts.
# Playwright reconstruye con NEXT_PUBLIC_E2E_DISPATCH_HOOK=1 en webServer
# para garantizar aislamiento de entorno y frescura de artefactos del bundle standalone.
CI=1 npm run test:e2e
echo "✅ Playwright E2E: 100% verde."

echo ""
echo "🎉 Protocolo de Auditoría y Anclaje completado con éxito con todos los oráculos en VERDE."
