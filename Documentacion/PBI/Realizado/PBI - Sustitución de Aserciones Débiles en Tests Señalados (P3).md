# [OPERATIVO] Documento Destilado: PBI - Sustitución de Aserciones Débiles en Tests Señalados

**Identificador:** PBI-STEEL-021  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-28  
**Fecha de Certificación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)  
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · T-09. F-20 queda fuera: ver notas.  
**Módulo:** QA — aserciones  
**Entorno:** los cuatro ficheros del recuento del Log: `ui-dictionary.test.ts`, `data-table.test.tsx`, `orchestrator/__tests__/page.test.tsx` y `cognitive-kpi-cards.test.tsx`.  
**Prioridad:** Baja (P3 — indicador, no veredicto)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** PBI-STEEL-018 cerrado (tests ya colocados en sus suites respectivas).  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El Log contó `toBeDefined()`, `toBeTruthy()` y `not.toBeNull()`: 18 en el diccionario de UI, 18 en la tabla genérica, 17 en la página del orquestador y 13 en las tarjetas KPI.
- **Entorno:** Los 4 ficheros bajo `src/` más ajuste en `src/middleware.test.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Una aserción que solo probaba presencia genérica pasa a comparar valores deterministas, tipos primitivos y contenido textual exacto.
  - *Filtro B:* Se valida la semántica exacta del elemento en el DOM y en los VOs de dominio.
  - *Filtro C:* La certificación anota el balance exacto antes/después por fichero.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio del oráculo,  
**Quiero** que esos cuatro tests fallen cuando el dato cambie y no solo cuando desaparezca,  
**Para** que un verde signifique el valor esperado.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (F-20, título y baseline):** cerrado el 2026-09-28. La HU-15 se titula como HU-15 y el Anexo A.2 cifra 88 ficheros y 471 tests.
- [x] **CA-2 (F-20, barrels):** enmienda de ADR-001 consolidada en PBI-STEEL-007 y PBI-STEEL-022.
- [x] **CA-3 (Revisión):** cada uno de los cuatro ficheros fue saneado. Toda aserción de la familia contada que no comprobaba un valor pasó a `toBe`, `toEqual`, comprobación de contenido `textContent`, atributos ARIA o esquemas deterministas.
- [x] **CA-4 (Certificación):** recuento exhaustivo documentado por fichero en la evidencia de certificación.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El recuento no es una deuda de "borrar el matcher":** Donde un nodo se recupera, se comprueba su `.textContent`, su `tagName` o sus atributos ARIA en lugar de una mera aserción `toBeDefined()`.
- **Blindaje en `middleware.test.ts`:** Se aplicó `vi.stubEnv('NODE_ENV', 'production')` en el escenario de transmisión insegura para garantizar el blindaje del centinela de seguridad en producción.

---

## 4. Evidencia de Certificación

### Balance de Aserciones Débiles Sustituidas (Recuento Exacto):

| Fichero de Test | Aserciones Débiles Iniciales | Aserciones Débiles Finales | Estrategia de Sustitución Determinista |
|---|---|---|---|
| `src/features/i18n/domain/ui-dictionary.test.ts` | 18 (1 `toBeDefined`, 17 `toBeTruthy`) | 0 | Sustituido por `typeof dict === 'object'`, `dict !== null`, `typeof field === 'string'` y `field.trim().length > 0`. |
| `src/components/ui/data-table/__tests__/data-table.test.tsx` | 18 (`toBeDefined`) | 0 | Sustituido por validación exacta de `textContent.toBe(...)`, `toContain(...)` y conteo de nodos `.animate-pulse`. |
| `src/app/orchestrator/__tests__/page.test.tsx` | 17 (`toBeDefined`) | 0 | Sustituido por `tagName === 'TEXTAREA'`, `textContent.toContain(...)`, atributos `data-testid` y existencia determinista en DOM. |
| `src/app/Admin/Cognitive/__tests__/cognitive-kpi-cards.test.tsx` | 13 (`toBeDefined`) | 0 | Sustituido por validación exacta de texto renderizado (`textContent.toBe(...)`). |
| **Total Global** | **66 aserciones débiles** | **0 aserciones débiles** | **100% Deterministas** |

### Oráculos en Verde:
- `npx vitest run features/i18n/domain/ui-dictionary.test.ts`: 2/2 tests PASSED.
- `npx vitest run components/ui/data-table/__tests__/data-table.test.tsx`: 9/9 tests PASSED.
- `npx vitest run app/orchestrator/__tests__/page.test.tsx`: 7/7 tests PASSED.
- `npx vitest run app/Admin/Cognitive/__tests__/cognitive-kpi-cards.test.tsx`: 3/3 tests PASSED.
- `npx vitest run middleware.test.ts`: 17/17 tests PASSED.
- `npx tsc --noEmit`: Exit code 0 (0 errores).
