# [OPERATIVO] Documento Destilado: PBI - Erradicación del Endpoint de Streaming Fingido y Entrega Única desde el Triaje

**Identificador:** PBI-STEEL-005
**Estatus:** Pendiente (Backlog Inmediato — Clúster de Nivel 1, orden 5)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-06 (relacionado con F-11)
**Módulo:** Orquestación híbrida — Triaje y lienzo
**Entorno:** `src/app/api/orchestrator/stream/route.ts`, `src/features/planner/stream-consumer.ts`, `src/app/orchestrator/page.tsx`, `src/components/tactical/hybrid-canvas.tsx`, `src/playwright-e2e/`, `src/features/triage/triage-input.use-case.ts`, `src/features/triage/triage.schema.ts`
**Prioridad:** Alta (P1 — coste duplicado y ruta sin contexto de sesión)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-STEEL-006 (el estado de claudicación vive en el esquema). Cierra CA-3 de PBI-STEEL-004 y quita `consumeOrchestratorStream` de la superficie que define PBI-STEEL-007.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Decisión tomada el 2026-09-28: se elimina `/api/orchestrator/stream`. Hoy espera a que Gemini termine y luego parte la ruta ya hecha en eventos. Cuando el triaje claudica, el cliente lo interpreta como "usar streaming" y lanza una segunda generación, sin idioma, distritos ni contexto denso.
- **Entorno:** Ruta SSE, consumidor, página del orquestador, lienzo, spec E2E de streaming y caso de uso de triaje.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El camino feliz ya devuelve el itinerario completo desde `/api/triage`. No se inventa otro canal.
  - *Filtro B:* La claudicación es un estado explícito, no una ausencia de campo.
  - *Filtro C:* El cliente nunca reintenta por su cuenta una generación LLM.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto de Sistemas,
**Quiero** que el itinerario viaje una sola vez, completo, en la respuesta de `/api/triage`, y que la claudicación sea un estado explícito,
**Para** no duplicar llamadas a Gemini justo cuando el proveedor está saturado y no mantener un canal que finge ser streaming.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Ruta eliminada):** se borra `src/app/api/orchestrator/stream/route.ts` y `src/features/planner/stream-consumer.ts`. No queda ningún `fetch` a `/api/orchestrator/stream`.
- [ ] **CA-2 (Claudicación explícita):** el DTO del triaje distingue el itinerario forjado de la claudicación de Gemini (hoy un `string` dentro de `route`). No hace falta un `deliveryMode`: solo existe la entrega completa.
- [ ] **CA-3 (Cliente sin reintento):** `page.tsx` espera el cuerpo completo de `/api/triage` y pinta ese itinerario. No hay lector de stream. Ante una claudicación muestra el mensaje degradado y no lanza ninguna llamada adicional. Se retiran `isStreamingItinerary` y las ramas de streaming de `HybridCanvas` (`isStreaming`, badge y placeholders).
- [ ] **CA-4 (Oráculos que hoy cubren el canal falso):** se elimina `playwright-e2e/orchestration-stream.spec.ts` y el perfil `stream-base` de `network-mocks.ts`. Se reescribe `app/orchestrator/__tests__/streaming.test.tsx`: desaparecen los tests de `consumeOrchestratorStream`; se conservan los de `HybridCanvas` que no dependen del streaming, o se mueven a su test propio. La spec E2E de itinerario inline sigue siendo la certificación del lienzo.
- [ ] **CA-5 (Telemetría):** la claudicación registra `WARN` en `LLM_ENGINE` con el código del proveedor (503, 429) para distinguir la saturación del error lógico.
- [ ] **CA-6 (Tests de comportamiento):** el caso de uso, con Gemini devolviendo claudicación, produce el estado degradado y no un `DISPATCH_READY` sin itinerario. El test de la página verifica que, en ese estado, `fetch` se llama una sola vez y solo a `/api/triage`.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El camino feliz ya es JSON completo.** Cuando Gemini responde, `/api/triage` devuelve el itinerario enriquecido y la página lo pinta sin pasar por el stream. El stream solo se usa cuando esa respuesta no trae `itinerary`. Eliminarlo no quita una entrega que hoy funcione; quita el reintento.
- **Qué no se ahorra.** Desaparece la segunda llamada a Gemini (F-06) y el limitador que PBI-STEEL-004 iba a poner en esa ruta (su CA-3). No desaparece el límite eludible de `/api/triage` ni la suplantación de sesión: eso sigue siendo PBI-STEEL-004.
- **Evidencia del impacto:** 6 eventos `ERROR 503` de Gemini (*high demand*) en la ventana auditada; en cada uno de ellos el comportamiento actual habría lanzado una segunda generación desde el cliente, y esa segunda llamada no lleva la directiva de idioma, los distritos, el GPS ni la matriz densa.
- **PBI ya cerrado que esto revoca en la práctica:** `PBI-FEAT-STREAM-001` está en `Realizado` y describe streaming progresivo. La implementación nunca transmitió la generación de Gemini: esperó la ruta completa y la troceó. Este PBI no reescribe aquel documento; retira el código que no cumplía lo que aquel documento afirma. Un streaming de verdad, si vuelve a hacer falta, será un PBI nuevo y no se redacta ahora.
- **HU-13** certificó el canal con `orchestration-stream.spec.ts`, mock incluido. Al borrar el canal se borra esa spec. La spec de itinerario inline permanece y es la que certifica el lienzo.

---

## 4. Evidencia de Certificación

Pendiente de forja.
