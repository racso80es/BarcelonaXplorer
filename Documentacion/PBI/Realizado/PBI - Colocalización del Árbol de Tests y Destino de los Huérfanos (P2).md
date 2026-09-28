# [OPERATIVO] Documento Destilado: PBI - Colocalización del Árbol de Tests y Destino de los Huérfanos

**Identificador:** PBI-STEEL-018
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · T-08
**Módulo:** QA — colocación de tests
**Entorno:** `tests/`, `src/vitest.config.ts`, `src/package.json` (scripts `test:live` y `test:integration`)
**Prioridad:** Media (P2 — el Axioma I exige el test junto al código; tres ficheros no los ejecuta nadie)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-STEEL-009 (deja de cargar `.env.local` en el oráculo unitario). PBI-STEEL-016 cubre el lint de lo que todavía siga en `tests/`.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Vitest incluye `../tests/**/*.test.{ts,tsx}` y excluye `../tests/e2e/**/*.e2e.test.ts` y `../tests/integration/**`. CI solo llama a `audit-anchor.sh`, así que esos excluidos no corren. El Log contaba 14 ficheros. Al redactar este PBI el árbol tiene 17: los dos `.e2e.test.ts`, el de integración, y además helpers y fixtures bajo `tests/e2e/playwright/` que no son tests.
- **Entorno:** Árbol `tests/` en la raíz y la configuración de Vitest.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Cada traslado es un test y el módulo al que pertenece. No se mueve el árbol entero en un solo diff.
  - *Filtro B:* Al terminar, `tests/` no existe y el `include` de Vitest ya no apunta fuera de `src/`.
  - *Filtro C:* Lo que llama a la red o a MySQL conserva un script propio. No entra en `npm test`.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio del Axioma I,
**Quiero** que cada test viva junto al código que ejerce y que los tres excluidos tengan un destino explícito,
**Para** que el oráculo no dependa de un árbol espejo ni de ficheros que CI ignora en silencio.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Inventario):** inventario al forjar (14 tests + `tests/tsconfig.json`; sin `tests/e2e/playwright/`): 11 unitarios/API/Admin/security, 2 live, 1 integración; `admin-sidebar-right.test.tsx` duplicado de `src/app/Admin/_components/__tests__/AdminSidebarRight.test.tsx` → retirado.
- [x] **CA-2 (Colocalización):** los `*.test.ts` y `*.test.tsx` que hoy entran por `../tests/**` se mueven junto al módulo que cubren, bajo `src/`. Cada traslado es un cambio aparte. Los imports se ajustan a `@/`.
- [x] **CA-3 (En vivo, junto al módulo):** `jev-ai.live.test.ts` y `triage-input.live.test.ts` colocalizados; `npm run test:live` apunta a esos ficheros; excluidos del oráculo por sufijo.
- [x] **CA-4 (Integración):** `telemetry-audit.integration.test.ts` bajo `features/telemetry`; `npm run test:integration` apunta ahí; fuera de CI.
- [x] **CA-5 (Helpers):** no existía `tests/e2e/playwright/`; Playwright sigue en `src/playwright-e2e`.
- [x] **CA-6 (Configuración):** `vitest.config.ts` solo incluye `./**/*.test.{ts,tsx}`; directorio `tests/` eliminado; `audit-anchor` sin `tests/tsconfig.json`.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **17 no es una corrección del Log.** El Log contó en su fecha. Este PBI trabaja con el árbol que haya al empezar la forja y lo deja escrito en CA-1.
- **Colocalizar no mete los E2E en vivo dentro de `npm test`.** Eso rompería el determinismo que persigue PBI-STEEL-009. Aislarlos en `src/tests-live/` tampoco: el nombre "colocalizar" no autoriza una carpeta común. El aislamiento es el sufijo y la exclusión de Vitest.

---

## 4. Evidencia de Certificación

Vitest 476 tests (90 ficheros); `tests/` ausente; `test:live` y `test:integration` redirigidos; lint solo `src/`.
