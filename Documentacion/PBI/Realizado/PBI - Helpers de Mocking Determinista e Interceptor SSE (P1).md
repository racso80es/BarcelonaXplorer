# [OPERATIVO] Documento Destilado: PBI - Helpers de Mocking Determinista e Interceptor SSE

**Identificador:** PBI-QA-E2E-003  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-28  
**Fecha de Culminación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 13: Blindaje Empírico E2E y Tubería de Certificación Continua (Playwright)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2013:%20Blindaje%20Emp%C3%ADrico%20E2E%20y%20Tuber%C3%ADa%20de%20Certificaci%C3%B3n%20Continua%20(Playwright).md)  
**Módulo:** Infraestructura de Calidad (QA) — Fixtures de red deterministas  
**Entorno:** `src/playwright-e2e/helpers/`, `src/playwright-e2e/fixtures/`, `src/features/planner/stream-consumer.ts`  
**Prioridad:** Alta (P1 - Cortafuegos del Oráculo)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** PBI-QA-E2E-002  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Interceptar las llamadas de red del orquestador para que el E2E jamás despierte a los proveedores LLM (JEV, Groq, Gemini), con fixtures deterministas.
- **Entorno:** Cliente real en [`src/app/orchestrator/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/page.tsx) y [`src/features/planner/stream-consumer.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/stream-consumer.ts).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Los mocks respetan los contratos reales (DTO de triaje y `OrchestratorStreamEventSchema`).
  - *Filtro B:* Latencia constante y respuestas pre‑calculadas (Ruta Base vs. Ruta S+ Grade); cero tokens consumidos.
  - *Filtro C:* Atajo de `itinerary` inline evita mockear el SSE cuando no es el objeto de la prueba.

---

## 1. Declaración de Intención (INVEST)

**Como** Ingeniero de Calidad,  
**Quiero** helpers de `page.route()` que mockeen las tres rutas del orquestador —incluido el flujo SSE con su formato real—,  
**Para** renderizar el `HybridCanvas` de forma 100 % determinista y sin consumo de tokens.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Rutas JSON):** `route.fulfill` devuelve JSON estándar para `GET /api/triage/ignition` y `POST /api/triage`, con el DTO real del triaje (`status`, y `itinerary` opcional).
- [x] **CA-2 (SSE tipado, método POST):** El mock de `/api/orchestrator/stream` contempla el método **POST** (el cliente envía `body { prompt }` y `Accept: text/event-stream`) y responde con `contentType: 'text/event-stream'` y cuerpo de **eventos SSE tipados**: cada bloque `data: <json>\n\n`, donde `<json>` valida contra `OrchestratorStreamEventSchema` (`type` ∈ `meta_init` | `stop_emitted` | `affiliate_injected` | `stream_complete` | `stream_error`).
- [x] **CA-3 (Fixtures Base y S+ Grade):** Existen dos matrices pre‑calculadas (Ruta Base `thermalState: 'operational'` y Ruta S+ `thermalState: 'saturated'` con `antiTrapShield.warnings` y `recommendedAlternatives`).
- [x] **CA-4 (SLA de mock):** Cada `fulfill` responde con latencia constante (objetivo ≤ 50 ms); ninguna petición escapa a red externa.
- [x] **CA-5 (Atajo documentado):** Se provee la variante donde el mock de `/api/triage` incluye `itinerary` completo, de modo que el cliente **no** consume el stream (el `HybridCanvas` se renderiza directo). Recomendada para pruebas que no evalúan específicamente el streaming.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Método real = POST, no GET.** `consumeOrchestratorStream` usa `fetch(url, { method: 'POST', ... })` y lee con `response.body.getReader()`. `page.route()` matchea por URL, pero el mock debe cubrir el POST.
- **No es "binario" ni "encriptado".** El SSE es texto UTF‑8 (`TextDecoder`). El parser divide por `\n\n`, exige prefijo `data:` y hace `JSON.parse`. Omitir el separador o el prefijo hace que ignore los fragmentos y la prueba caduque por *timeout*.
- **No son "waypoints en crudo".** Deben emitirse eventos con `type` + `data` que pasen `OrchestratorStreamEventSchema.parse`; un JSON de waypoint suelto se descarta con `console.warn`.
- **`route.fulfill` es de disparo único** (entrega el body completo de una vez): válido para aserciones de estado final, no reproduce el goteo incremental real.
- **El lienzo deriva la saturación del `score`, no de `itinerary.thermalState`.** La página pasa `thermalState={score >= 100 ? 'saturated' : 'operational'}`. La fixture S+ usa `score: 100`.
- **Los matchers son regex anclados** (`/\/api\/triage(?:\?.*)?$/`) para que el mock de triaje no capture `/api/triage/ignition`.

---

## 4. Evidencia de Certificación

1. **Ubicación:** `src/playwright-e2e/fixtures/routes.fixture.ts`, `helpers/sse-format.ts`, `helpers/network-mocks.ts`. Latencia de mock `MOCK_LATENCY_MS = 10`.
2. **Perfiles:** `base-inline` (itinerario operacional, score 75), `saturated-inline` (score 100, escudo y alternativas) y `stream-base` (triage sin `itinerary` + POST SSE `meta_init` / `stop_emitted` / `stream_complete`).
3. **Suite:** `CI=1 npm run test:e2e` — 5 passed. El escenario inline afirma que ningún host distinto de `localhost:3000` recibió tráfico.
