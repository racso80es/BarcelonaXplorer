# [OPERATIVO] Documento Destilado: PBI - Ampliación del Perímetro de los Oráculos

**Identificador:** PBI-STEEL-016
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-16, T-07
**Módulo:** QA — cuádruple oráculo
**Entorno:** `scripts/audit-anchor.sh`, `src/tsconfig.json` (o un `tsconfig` propio de `playwright-e2e`), `src/features/ai-engine/groq-tests/groq-fast-ai.adapter.test.ts`, configuración de ESLint
**Prioridad:** Media (P2 — el oráculo declara un perímetro que no cubre)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-STEEL-009, que también toca `vitest.config.ts` y el aislamiento de red. PBI-STEEL-018 mueve el árbol `tests/`; este PBI no lo recoloca.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** `audit-anchor.sh` lanza `npm run lint` sin `--max-warnings 0`. `tests/` está fuera de ESLint y del `include` de `src/tsconfig.json`, así que sus `as any` no los ve nadie. `playwright-e2e` está excluido de `tsc --noEmit`.
- **Entorno:** Script del oráculo, TypeScript de los E2E y el test de Groq que silencia el linter.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El script que usa CI es el mismo criterio que la HU llama cuádruple oráculo.
  - *Filtro B:* Un `as any` no se esconde con `eslint-disable`.
  - *Filtro C:* Los specs de Playwright compilan. No hace falta que Vitest los ejecute.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio del Peaje del Oráculo,
**Quiero** que el script de ancla cubra los avisos, los E2E y el doble de Groq,
**Para** que un fallo de tipos o un `any` no pase verde por estar fuera del camino.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Avisos):** `scripts/audit-anchor.sh` ejecuta el lint con `--max-warnings 0`. CI no tiene otro camino: solo llama a ese script.
- [x] **CA-2 (Playwright):** un `tsc --noEmit` con un `tsconfig` que incluya `src/playwright-e2e` forma parte del mismo script. El `tsconfig` de la aplicación puede seguir excluyendo esa carpeta si el script invoca el segundo fichero.
- [x] **CA-3 (Groq):** `groq-fast-ai.adapter.test.ts` deja de usar `as any` y de desactivar la regla en la línea. El doble se tipa con el fragmento del cliente que el test usa, o con `vi.mocked` sobre el método real.
- [x] **CA-4 (Árbol `tests/`):** si PBI-STEEL-018 todavía no ha vaciado `tests/`, ESLint y `tsc` incluyen esa carpeta mientras exista, para que dejen de ser invisibles los `as any` de `tests/integration/telemetry-audit.test.ts`. Si el árbol ya se ha colocalizado, este criterio se cumple porque esos ficheros pasan a vivir bajo `src/` y entran en el oráculo normal. No se duplica el trabajo de moverlos.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El Log contaba tres `as any` en el test de integración (líneas 86, 87 y 117) y un `as unknown as PrismaClient` en la 243.** Están fuera de ESLint porque la carpeta está fuera de la base, no porque la regla los permita. CA-4 los hace visibles; tiparlos es parte de ese criterio si el fichero sigue ahí, o de PBI-STEEL-018 si ya se ha movido.
- **No se relaja ninguna regla para conseguir el verde.** Si `--max-warnings 0` destapa avisos, se corrigen. Si son muchos y ajenos a este PBI, se listan en la certificación y se abre otro PBI. No se sube el umbral.

---

## 4. Evidencia de Certificación

Vitest 479 tests; `npm run lint` con `--max-warnings 0` sobre `src` y `tests/`; `tsc` aplicación + `tsconfig.playwright-e2e.json` + `tests/tsconfig.json` (enlace simbólico `tests/node_modules` → `src/node_modules` creado por `audit-anchor.sh` antes del compile); payload de integración parseado con Zod; mock Groq tipado como `Groq`.
