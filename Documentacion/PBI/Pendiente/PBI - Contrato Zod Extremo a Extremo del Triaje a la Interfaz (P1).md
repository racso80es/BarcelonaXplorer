# [OPERATIVO] Documento Destilado: PBI - Contrato Zod Extremo a Extremo del Triaje a la Interfaz

**Identificador:** PBI-STEEL-006
**Estatus:** Pendiente (Backlog Inmediato — Clúster de Nivel 1, orden 6)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-05, T-04 (parcial), T-05
**Módulo:** Fronteras deterministas (Axioma II) — Triaje, orquestador y E2E
**Entorno:** `src/features/triage/triage.schema.ts`, `src/features/triage/triage-input.use-case.ts`, `src/app/api/triage/route.ts`, `src/app/orchestrator/page.tsx`, `src/playwright-e2e/fixtures/routes.fixture.ts`
**Prioridad:** Alta (P1 — `any` implícito y `unknown` sin parsear en la frontera)
**Estimación Táctica:** 3 Story Points
**Depende de:** — (se integra antes de cerrar PBI-STEEL-003 y PBI-STEEL-005)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El contrato del triaje declara su carga principal como `z.unknown()`, las rutas leen `req.json()` como `any` y la página castea la respuesta sin validarla. `tsc` no lo detecta porque `any` es compatible con todo.
- **Entorno:** Esquema del DTO, caso de uso, Route Handlers y consumidor cliente; fixtures E2E.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Parse, don't validate):* todo `req.json()` y `res.json()` pasa por `safeParse`.
  - *Filtro B:* el DTO tipa `route` e `itinerary` con sus esquemas reales.
  - *Filtro C:* los fixtures E2E se validan contra los mismos esquemas.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio de las Fronteras Deterministas,
**Quiero** que el contrato del triaje esté tipado de extremo a extremo y se valide en cada frontera,
**Para** que un cambio en el backend rompa el oráculo en lugar de romper la interfaz en producción.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (DTO tipado):** en `TriageOutcomeSchema`, `route` pasa a `TacticalRouteSchema` (o al estado de claudicación que defina PBI-STEEL-005) e `itinerary` a `EnrichedRouteSchema`. Desaparecen los `z.unknown()` de las líneas 71-72.
- [ ] **CA-2 (Caso de uso sin casts):** `forgedRoute` toma el tipo de retorno real de `GenerateTacticalRouteUseCase.execute` y se eliminan los dos `as TacticalRoute` (líneas 479 y 485) mediante estrechamiento de tipos.
- [ ] **CA-3 (Entrada de la ruta):** `/api/triage` parsea el cuerpo con `safeParse` y responde `400` con `OperationEnvelope` de error si no valida. Un `ZodError` deja de convertirse en `500`. `/api/orchestrator/stream` no se toca: PBI-STEEL-005 la elimina.
- [ ] **CA-4 (Consumidor cliente):** `page.tsx` valida `await res.json()` con `TriageOutcomeSchema.safeParse` antes de usarlo. Se eliminan `triageData.itinerary as EnrichedRoute` y `turn.aiResponse as TacticalRoute`, y el `Turn` modela `aiResponse` como unión discriminada.
- [ ] **CA-5 (Sin render incoherente):** desaparece el fallback `triageData.route || triageData.payload`, que puede pasar un objeto sin `waypoints` al render de la ruta.
- [ ] **CA-6 (Fixtures E2E contractuales):** un test Vitest importa los fixtures de `playwright-e2e/fixtures/` y los valida con `TriageOutcomeSchema` y `EnrichedRouteSchema`. Un cambio de contrato rompe Vitest aunque Playwright siga en verde.
- [ ] **CA-7 (Verificación de `any`):** búsqueda de `res.json()` y `req.json()` sin `safeParse` en `src/app/**` y `src/features/**`; cero resultados en los ficheros del entorno de este PBI.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Por qué `tsc` estaba en verde:** `Response.json()` y `Request.json()` devuelven `Promise<any>`, y `@typescript-eslint/no-explicit-any` solo detecta `any` escrito, no el inferido.
- **Superficie cliente:** el esquema que importe `page.tsx` tiene que vivir en la superficie de dominio puro de `planner`/`triage` que define PBI-STEEL-007; si se importa desde un barrel de servidor, se reintroduce F-07.
- **Los fixtures E2E evitan importar de `src/`** para no acoplar `tsc` (`routes.fixture.ts:3`). CA-6 invierte el sentido: es Vitest quien importa los fixtures, no Playwright quien importa los esquemas.

---

## 4. Evidencia de Certificación

Pendiente de forja.
