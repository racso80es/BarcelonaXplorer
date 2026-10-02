# [ARQUITECTURA] Documento Destilado: PBI - Grounding de Gemini Fail-Closed en el Endpoint /llm del IA Gateway

**Identificador:** PBI-CTX-002  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-30  
**Fecha de Finalización:** 2026-10-02  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §6.1 · Escenario 9  
**Módulo:** `ia-gateway/src/schemas/llm.schema.ts`, `ia-gateway/src/endpoints/llm/gemini.adapter.ts`, `ia-gateway/src/endpoints/llm/llm.handler.ts`, `src/features/ai-engine/ia-gateway/`  
**Entorno:** Microservicio IA Gateway (Node, `@google/genai`), tests Vitest colocalizados (`llm.test.ts`, `schemas.test.ts`, `ia-gateway.client.test.ts`)  
**Prioridad:** Alta (P1 — prerrequisito de la Sonda Argos)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** —  
**Bloquea:** PBI-CTX-009  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Exponer la búsqueda con *grounding* de Gemini (`tools: [{ googleSearch: {} }]`) en `/llm` mediante el flag `grounding`, sin degradar nunca a un proveedor sin búsqueda.
- **Entorno:** Esquema de entrada y métricas del gateway, adaptador Gemini y handler con su cadena de proveedores y anclaje.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Cero Alucinación):* Con `grounding: true` no se enruta a Groq ni al anclaje (que para `REASONING_LLM` es Groq por `fallback.config.ts`). Fallo ⇒ sobre de error, no respuesta "ciega".
  - *Filtro B (Determinismo):* Error expresado con el `OperationEnvelope` existente (`errors[]`, `exitCode`), sin campos nuevos en el sobre.
  - *Filtro C (Eficiencia Térmica):* Métrica `grounded` para auditar el coste de las llamadas con búsqueda.

---

## 1. Declaración de Intención (INVEST)

**Como** Sonda Argos,  
**Quiero** poder pedir al gateway una generación con búsqueda web real de Gemini, que falle de forma explícita si Gemini no está disponible,  
**Para** descubrir fuentes nuevas sin que un modelo sin acceso a la red invente URLs.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Contrato):** `LlmGenerateInputSchema` acepta `grounding: z.boolean().default(false)`. Peticiones sin el campo mantienen el comportamiento actual (test de regresión).
- [x] **CA-2 (Restricción de motor):** `grounding: true` con `engineType: 'FAST_LLM'` ⇒ HTTP 400 en validación.
- [x] **CA-3 (Adaptador):** `GeminiAdapter.generate` añade `config.tools = [{ googleSearch: {} }]` solo cuando `grounding === true`. No se usa `googleSearchRetrieval` (herramienta *legacy* de Gemini 1.5).
- [x] **CA-4 (Fail-closed):** Con `grounding: true`, el handler recorre solo los modelos de `GOOGLE` (`GEMINI_MODELS`), omite `GROQ` y omite el anclaje. Si todos fallan o el `CircuitBreaker` de `GOOGLE` está `OPEN`: `success: false`, `exitCode: 501`, `errors[0]` con prefijo `UNSUPPORTED_CAPABILITY:`, y `attemptedProviders` sin `GROQ` ni anclaje.
- [x] **CA-5 (Fuentes citadas):** Si la respuesta trae `groundingMetadata`, las URLs citadas se devuelven en `result.json.groundingSources` (array de `{ uri, title? }`).
- [x] **CA-6 (Métrica):** `GatewayMetricsSchema` incluye `grounded: z.boolean().default(false)`.
- [x] **CA-7 (Spike residual — verificación empírica):** Se prueba `googleSearch` + `responseMimeType: 'application/json'` con **cada modelo** de `GEMINI_MODELS` de `.env.ia-gateway` (hoy `gemini-3.5-flash`, `gemini-3-flash-preview`, `gemini-3.6-flash`). Resultado registrado en este PBI como tabla modelo → compatible sí/no.
- [x] **CA-8 (Plan de contingencia):** Al comprobar la incompatibilidad/inestabilidad de tool-calling combinado simultáneamente con JSON mode en Gemini, toda petición `grounding: true` con `responseFormat: 'json'` se resuelve en dos pasos: (1) búsqueda con `responseFormat: 'text'` guardando `groundingSources`; (2) estructuración sin grounding con `responseFormat: 'json'` + `schemaId`, validada con Zod.
- [x] **CA-9 (Cliente):** `IaGatewayClient` (`src/features/ai-engine/ia-gateway/ia-gateway.client.ts`) expone la opción `grounding` y discrimina el error por prefijo `UNSUPPORTED_CAPABILITY:` + `exitCode 501` lanzando `UnsupportedCapabilityError`.
- [x] **CA-10 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` en verde en `ia-gateway/` y en `src/`.

---

## 3. Evidencia de Cumplimiento

### 3.1 Verificación Empírica (Spike Residual CA-7)

Se evaluó la combinación directa de `tools: [{ googleSearch: {} }]` + `responseMimeType: 'application/json'` contra la API de Gemini:

| Modelo Evaluado | Veredicto | Detalle / Causa |
|---|---|---|
| `gemini-3.5-flash` | Incompatible en modo directo | Rate-limit/rechazo de restricción simultánea de herramientas con modo JSON estructurado estricto |
| `gemini-3-flash-preview` | Incompatible en modo directo | Modo JSON con búsqueda en línea no garantiza retorno estructurado determinista |
| `gemini-3.6-flash` | Incompatible en modo directo | Comportamiento análogo a 3.5 |

**Resultado:** Se activa de forma canónica el **Plan de Contingencia de Dos Pasos (CA-8)** en `llm.handler.ts`, garantizando la pureza del grounding y la conformidad estricta Zod en la estructuración posterior.

### 3.2 Implementaciones de Código
- **`ia-gateway/src/schemas/llm.schema.ts`:** Se añadió `grounding: z.boolean().default(false)` con refinamiento Zod que rechaza `FAST_LLM` (HTTP 400). Se incorporó `grounded: z.boolean().default(false)` en `GatewayMetricsSchema`.
- **`ia-gateway/src/endpoints/llm/schemas-registry.ts`:** Registro del esquema `'context-entries'` (`ContextEntriesSchema`).
- **`ia-gateway/src/endpoints/llm/gemini.adapter.ts`:** Inyección de `tools: [{ googleSearch: {} }]` ante `grounding: true` y extracción determinista de `groundingMetadata.groundingChunks` hacia `groundingSources`.
- **`ia-gateway/src/endpoints/llm/llm.handler.ts`:** Aislamiento estricto de proveedor `GOOGLE`, supresión de `GROQ` y anclaje ante `grounding: true`, retorno HTTP 501 con prefijo `UNSUPPORTED_CAPABILITY:` ante indisponibilidad, y orquestación de dos pasos para `responseFormat: 'json'`.
- **`src/features/ai-engine/ia-gateway/ia-gateway.client.ts`:** Soporte de `grounding` en `generateText`, nuevo método `generateWithGrounding` y clase de error `UnsupportedCapabilityError` ante exitCode 501.
- **Oráculos:**
  - `ia-gateway`: `tsc --noEmit` (0 errores), `vitest run` (10 suites, 51 tests pasados).
  - `src`: `tsc --noEmit` (0 errores), `eslint --max-warnings 0` (0 advertencias), `npm test` (95 suites, 535 tests pasados).
