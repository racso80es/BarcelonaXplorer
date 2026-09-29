# [OPERATIVO] Documento Destilado: PBI - Endpoint de Generación LLM System Two en IA Gateway

**Identificador:** PBI-GW-003  
**Estatus:** Completado  
**Fecha de Creación:** 2026-09-29  
**Fecha de Culminación:** 2026-09-29  
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)  
**Módulo:** `ia-gateway/src/endpoints/llm/`  
**Entorno:** Gateway, adaptadores Gemini (`@google/genai`) y Groq (`groq-sdk`)  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 5 Story Points  
**Depende de:** PBI-GW-001  
**Bloqueo:** Ninguno (Decisión D-3 resuelta)  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Handler de generación con LLM que selecciona proveedor según `engineType` (`FAST_LLM` o `REASONING_LLM`) y `responseFormat` (`text` o `json`). Incluye adaptadores desacoplados para Gemini (`@google/genai`) y Groq (`groq-sdk`).
- **Entorno:** `ia-gateway/src/endpoints/llm/`, triaje con `HealthSensor`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Matriz Declarativa):* Selección de proveedor consultando la matriz de modalidad de D-3 (`FAST_LLM` → Groq principal, Gemini secundario; `REASONING_LLM` → Gemini principal, Groq secundario).
  - *Filtro B (Conformidad Estructural):* Validación Zod con `getZodSchemaById` cuando se pide JSON. Si falla la validación estructural, se marca fallo del proveedor en el sensor de salud y se intenta el siguiente candidato de la matriz.
  - *Filtro C (Contrato Uniforme):* Métricas completas y fidedignas en `result.metrics` con tokens informados o `null`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,  
**Quiero** que el gateway seleccione el proveedor LLM adecuado según la modalidad y formato solicitados,  
**Para** centralizar la orquestación de generación y obtener respuestas con métricas de consumo uniformes.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Handler):** `POST /v1/llm/generate` parsea el cuerpo, discrimina `engineType` y `responseFormat`, e invoca el adaptador del proveedor más sano de la matriz.
- [x] **CA-2 (Adaptador Gemini):** Usa `@google/genai` (TC-AI-001), construye el prompt, parsea la respuesta y extrae tokens (`promptTokens`, `completionTokens`, `totalTokens`).
- [x] **CA-3 (Adaptador Groq):** Usa `groq-sdk`, construye el payload con el modelo de la matriz, parsea y extrae tokens.
- [x] **CA-4 (Validación JSON):** Si `responseFormat: 'json'`, la respuesta se parsea con Zod contra el esquema indicado. Si falla la validación, se marca como error del proveedor y se intenta el siguiente proveedor de la matriz.
- [x] **CA-5 (Métricas):** `result.metrics` incluye `engineType`, `provider`, `modelId`, tokens, `durationMs`, `fallbackTriggered: false` y `attemptedProviders`.
- [x] **CA-6 (Tests):** Tests con mocks para generación `text` con Gemini, `json` con Groq, validación JSON fallida (cascada a siguiente proveedor), y agotamiento con 502 determinista.
- [x] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint` y vitest en verde. Cero `any`.

---

## 3. Evidencia de Certificación de Oráculos

1. **Vitest en IA Gateway:**
   - 7 archivos de test (`llm.test.ts`, `health.test.ts`, `decision.test.ts`, `envelope.test.ts`, `auth.test.ts`, `schemas.test.ts`, `server.test.ts`).
   - 29 tests ejecutados y aprobados (100% verde).
2. **TypeScript (`tsc --noEmit`):**
   - 0 errores con compilador estricto.
3. **Linter AST en Monolito (`eslint`):**
   - 0 advertencias, 0 errores.
