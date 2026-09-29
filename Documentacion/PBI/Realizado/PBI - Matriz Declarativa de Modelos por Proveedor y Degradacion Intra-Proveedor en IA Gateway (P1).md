# [OPERATIVO] Documento Destilado: PBI - Matriz Declarativa de Modelos por Proveedor y Degradación Intra‑Proveedor en IA Gateway

**Identificador:** PBI-GW-010
**Estatus:** Completado
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) · Escenario 1
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-08
**Módulo:** `ia-gateway/src/endpoints/llm/`, `ia-gateway/src/schemas/`, `src/features/ai-engine/ia-gateway/`
**Entorno:** Microservicio IA Gateway y cliente del monolito
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-GW-003, PBI-GW-005 (completados)
**Decisión de diseño (D-3, confirmada 2026-09-29):** [RESUELTO] Las matrices de modelos por proveedor viven en variables de entorno (`GEMINI_MODELS`, `GROQ_MODELS`), no en YAML bajo `ia-gateway/config/`. Ver HU-KAIZEN-003 §7.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Restaurar la degradación intra‑proveedor que el `GeminiClient` retirado en PBI-GW-009 ofrecía y que el gateway perdió: ante un fallo de un modelo se prueba el siguiente modelo del mismo proveedor antes de conmutar de proveedor.
- **Entorno:** `ia-gateway/src/endpoints/llm/llm.handler.ts` (dueño de la cascada), `ia-gateway/src/index.ts` (líneas 29‑36, hoy un único `defaultModel`), esquemas de métricas del gateway y del cliente.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Regresión verificada):* `GEMINI_MODELS` (`gemini-3.5-flash,gemini-3-flash-preview,gemini-3.6-flash` en `.env.production`) ya no la lee nadie; el gateway solo admite `GEMINI_REASONING_MODEL` y `GROQ_FAST_MODEL`. Un 404/503 del modelo salta directamente a otro proveedor.
  - *Filtro B (Contrato intacto):* `attemptedProviders` (HU-16 §3) no cambia de semántica. El detalle por modelo viaja en un campo nuevo `attemptedModels`.
  - *Filtro C (Anclaje fuera de esta cascada):* `DEFAULT_FAST_LLM` y `DEFAULT_REASONING_LLM` siguen siendo un único `<proveedor>:<modelo>` de último recurso (PBI-GW-005). Esta matriz no los sustituye.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el gateway recorra la lista de modelos de un proveedor antes de declararlo agotado,
**Para** recuperar la resiliencia que tenían los adaptadores directos y no conmutar de proveedor por el fallo de un solo modelo.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Matrices declarativas):** `GEMINI_MODELS` y `GROQ_MODELS` se leen como listas separadas por comas, validadas con Zod al arrancar (al menos un elemento, sin vacíos). Compatibilidad: si `GROQ_MODELS` no existe se usa `GROQ_FAST_MODEL`; si `GEMINI_MODELS` no existe se usa `GEMINI_REASONING_MODEL`. `src/.env.example` documenta ambas y su orden (el primero es el principal).
- [x] **CA-2 (Cascada intra‑proveedor):** en `llm.handler.ts`, para cada proveedor sano se invocan sus modelos en orden pasando `modelId` explícito a `adapter.generate`. Solo cuando todos fallan se pasa al siguiente proveedor. El anclaje base (PBI-GW-005) se mantiene como último recurso y sigue marcando `fallbackTriggered: true`.
- [x] **CA-3 (Telemetría):** `modelId` refleja el modelo que respondió. Se añade `attemptedModels: string[]` (formato `<proveedor>:<modelo>`) a `GatewayMetricsSchema` (`ia-gateway/src/schemas/llm.schema.ts`) y a su espejo `ia-gateway-common.schema.ts`, y el cliente lo incluye en el payload de `TelemetryRepositoryPort`. `attemptedProviders` conserva su semántica actual (proveedores, sin duplicar).
- [x] **CA-4 (Tests):** en `ia-gateway/src/endpoints/llm/`: el primer modelo de Gemini responde 503 y el segundo responde 200 sin llegar a Groq; todos los modelos de un proveedor fallan y se conmuta al siguiente; agotamiento total sigue devolviendo el sobre `503` de PBI-GW-005. Test del cliente que verifica el registro de `attemptedModels`.
- [x] **CA-5 (Oráculos):** `tsc --noEmit` y `vitest run` en verde en `ia-gateway/` y en `src/`. Cero `any` y cero `as unknown as`.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El handler es el dueño de la cascada.** Los adaptadores (`gemini.adapter.ts`, `groq.adapter.ts`) ya aceptan `modelId` en `LlmInvocationParams`; no deben conocer la lista. El bucle vive donde ya vive el orden de proveedores.
- **Dos rebanadas, no una.** Rebanada 1: gateway (handler, esquema, test). Rebanada 2: espejo del cliente (`ia-gateway-common.schema.ts`, `ia-gateway.client.ts`, su test). El campo nuevo es aditivo: un cliente antiguo que ignore `attemptedModels` sigue parseando porque Zod descarta claves desconocidas solo si el esquema no las declara; por eso el espejo se actualiza en la misma entrega.
- **No se toca el circuito de salud.** El circuit breaker opera por proveedor (`health-sensor.ts`), no por modelo. Un modelo que falla no abre el circuito del proveedor; solo la secuencia de modelos agotada lo hace, con el mismo criterio que hoy.
- **Evidencia histórica del problema:** AUD-OPS-STEEL-001 registró 6 eventos `503 high demand` de Gemini con el adaptador directo, que entonces reintentaba con el siguiente modelo de `GEMINI_MODELS`.

---

## 4. Evidencia de Implementación y Oráculos

- **Módulo `ia-gateway/src/endpoints/llm/models.config.ts`:**
  - Esquema Zod `ModelListSchema` y funciones deterministas `parseModelList` y `resolveProviderModels`.
  - Fallback transparente hacia `GEMINI_REASONING_MODEL` y `GROQ_FAST_MODEL`.
- **Cascada Intra-Proveedor en `ia-gateway/src/endpoints/llm/llm.handler.ts`:**
  - Recorrido secuencial de `modelsToTry` para cada proveedor sano antes de conmutar de proveedor.
  - Registro de `attemptedModels` en formato `<proveedor>:<modelo>`.
  - Aislamiento del Circuit Breaker: solo se registra falla del proveedor cuando se agotan todos sus modelos.
- **Espejo y Telemetría en Monolito (`src/features/ai-engine/ia-gateway/`):**
  - Actualización de `ia-gateway-common.schema.ts` (`IaGatewayMetricsSchema`) con `attemptedModels`.
  - Emisión de `attemptedModels` en el payload forense de `IaGatewayClient.recordTelemetry`.
- **Oráculos Verificados:**
  - `ia-gateway`: `tsc --noEmit` en verde, 9 suites / 40 tests pasados (`vitest run`).
  - `src`: `tsc --noEmit` en verde, 12 tests pasados en `ia-gateway.client.test.ts`, `eslint --max-warnings 0` en verde.
