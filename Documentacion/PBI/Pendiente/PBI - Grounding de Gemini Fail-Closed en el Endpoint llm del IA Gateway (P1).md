# [ARQUITECTURA] Documento Destilado: PBI - Grounding de Gemini Fail-Closed en el Endpoint /llm del IA Gateway

**Identificador:** PBI-CTX-002
**Estatus:** Pendiente (ejecutable en paralelo a PBI-CTX-001)
**Fecha de Creación:** 2026-09-30
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §6.1 · Escenario 9
**Módulo:** `ia-gateway/src/schemas/llm.schema.ts`, `ia-gateway/src/endpoints/llm/gemini.adapter.ts`, `ia-gateway/src/endpoints/llm/llm.handler.ts`
**Entorno:** Microservicio IA Gateway (Node, `@google/genai`), tests Vitest colocalizados (`llm.test.ts`, `schemas.test.ts`)
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

- [ ] **CA-1 (Contrato):** `LlmGenerateInputSchema` acepta `grounding: z.boolean().default(false)`. Peticiones sin el campo mantienen el comportamiento actual (test de regresión).
- [ ] **CA-2 (Restricción de motor):** `grounding: true` con `engineType: 'FAST_LLM'` ⇒ HTTP 400 en validación.
- [ ] **CA-3 (Adaptador):** `GeminiAdapter.generate` añade `config.tools = [{ googleSearch: {} }]` solo cuando `grounding === true`. No se usa `googleSearchRetrieval` (herramienta *legacy* de Gemini 1.5).
- [ ] **CA-4 (Fail-closed):** Con `grounding: true`, el handler recorre solo los modelos de `GOOGLE` (`GEMINI_MODELS`), omite `GROQ` y omite el anclaje. Si todos fallan o el `CircuitBreaker` de `GOOGLE` está `OPEN`: `success: false`, `exitCode: 501`, `errors[0]` con prefijo `UNSUPPORTED_CAPABILITY:`, y `attemptedProviders` sin `GROQ` ni anclaje.
- [ ] **CA-5 (Fuentes citadas):** Si la respuesta trae `groundingMetadata`, las URLs citadas se devuelven en `result.json.groundingSources` (array de `{ uri, title? }`).
- [ ] **CA-6 (Métrica):** `GatewayMetricsSchema` incluye `grounded: z.boolean().default(false)`.
- [ ] **CA-7 (Spike residual — verificación empírica):** Se prueba `googleSearch` + `responseMimeType: 'application/json'` con **cada modelo** de `GEMINI_MODELS` de `.env.ia-gateway` (hoy `gemini-3.5-flash`, `gemini-3-flash-preview`, `gemini-3.6-flash`). Se considera incompatible si: (a) la API la rechaza (4xx), (b) la respuesta llega sin `groundingMetadata`, o (c) la salida no supera `JSON.parse` + Zod. Resultado registrado en este PBI como tabla modelo → compatible sí/no.
- [ ] **CA-8 (Plan de contingencia):** Si CA-7 da incompatibilidad con algún modelo, toda petición `grounding: true` con `responseFormat: 'json'` se resuelve en dos pasos: (1) búsqueda con `responseFormat: 'text'` guardando `groundingSources`; (2) estructuración sin grounding con `responseFormat: 'json'` + `schemaId`, validada con Zod (el gateway no envía `responseSchema` salvo que este PBI lo añada). Toda URL del JSON final debe estar en `groundingSources`; la entrada que no cumpla se descarta.
- [ ] **CA-9 (Cliente):** `IaGatewayClient` (`src/features/ai-engine/ia-gateway/ia-gateway.client.ts`) expone la opción `grounding` y discrimina el error por prefijo `UNSUPPORTED_CAPABILITY:` + `exitCode 501`.
- [ ] **CA-10 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` en verde en `ia-gateway/` y en `src/`.

---

## 3. Fuera de Alcance

- Lógica de exploración de Argos (PBI-CTX-009).
- APIs de búsqueda de terceros.
