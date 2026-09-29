# [OPERATIVO] Documento Destilado: PBI - Endpoint de Generación LLM System Two en IA Gateway

**Identificador:** PBI-GW-003
**Estatus:** Pendiente (bloqueado por D-3)
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `ia-gateway/src/endpoints/llm/`
**Entorno:** Gateway, adaptadores Gemini (`@google/genai`) y Groq (`groq-sdk`)
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-GW-001
**Bloqueo:** Decisión D-3 (matrices de proveedores por modalidad)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Handler de generación con LLM que selecciona proveedor según `engineType` (`FAST_LLM` o `REASONING_LLM`) y `responseFormat` (`text` o `json`). Incluye adaptadores para Gemini (`@google/genai`) y Groq (`groq-sdk`).
- **Entorno:** Gateway, adaptadores Gemini y Groq.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Matriz Declarativa):* La selección de proveedor consulta la matriz de la modalidad solicitada; el orden se define por configuración (D-3).
  - *Filtro B (Conformidad Estructural):* Si se pide `json`, la respuesta se valida con Zod contra el esquema solicitado; si no valida, se trata como fallo y se pasa al siguiente proveedor. Se promete conformidad estructural, no veracidad del contenido.
  - *Filtro C (Contrato Uniforme):* Cada proveedor tiene un adaptador con contrato uniforme que devuelve texto + métricas.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el gateway seleccione el proveedor LLM adecuado según la modalidad y formato solicitados,
**Para** centralizar la orquestación de generación y obtener respuestas con métricas de consumo uniformes.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Handler):** `POST /v1/llm/generate` parsea el cuerpo, discrimina `engineType` y `responseFormat`, e invoca el adaptador del proveedor más sano de la matriz.
- [ ] **CA-2 (Adaptador Gemini):** Usa `@google/genai` (TC-AI-001), construye el prompt, parsea la respuesta y extrae tokens (`promptTokens`, `completionTokens`, `totalTokens`).
- [ ] **CA-3 (Adaptador Groq):** Usa `groq-sdk`, construye el payload con el modelo de la matriz, parsea y extrae tokens.
- [ ] **CA-4 (Validación JSON):** Si `responseFormat: 'json'`, la respuesta se parsea con Zod contra el esquema indicado. Si falla la validación, se marca como error del proveedor y se intenta el siguiente.
- [ ] **CA-5 (Métricas):** `result.metrics` incluye `engineType`, `provider`, `modelId`, tokens, `durationMs`, `fallbackTriggered: false` y `attemptedProviders`.
- [ ] **CA-6 (Tests):** Tests con mocks para generación `text` con Gemini, `json` con Groq, validación JSON fallida (cascada a siguiente proveedor), y proveedor inalcanzable.
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint` y tests en verde. Cero `any`.
