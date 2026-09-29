# Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor

- **Estatus:** En Curso (Decisiones D-1 a D-4 resueltas; implementación secuencial de PBIs en progreso).
- **Fecha de Revisión:** 2026-09-29
- **Autor:** Operador Técnico / Arquitectura BarcelonaXplorer
- **Módulo:** Infraestructura y Órganos Sensoriales / Motores Cognitivos
- **Marco Normativo & Diseño:** [`Axiomas de Forja S+ Grade`](../../.SddIA/library/norms/) · [`Códice tech-master-nextjs-prisma`](../../.SddIA/library/codexes/tech-master-nextjs-prisma.md) · [`ADR-001 (Vertical Slicing)`](../ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [`CONSTITUTION.md`](../../CONSTITUTION.md)

> **Nota de refinamiento (2026-09-29):** Esta historia se contrastó contra el estado real del repositorio. Se corrigieron: la caracterización de Jev AI como motor "determinista" que "ignora el lenguaje natural" y no consume tokens (es un evaluador probabilístico calibrado sobre texto y factura tokens); el contexto de telemetría `IA_ENGINE`, que no existe (el vigente es `LLM_ENGINE`); la ubicación de la tabla de auditoría (vive en `/Admin/Logs`, no en `/Admin/System`); la ruta `src/infrastructure/ai/`, eliminada por el Vertical Slicing; la supuesta inyección de variables "vía Ansistrano"; el "bus central de Next.js", que no existe; y la promesa de "Tolerancia Cero a alucinaciones", que ningún LLM puede cumplir. Detalle en el **Anexo A: Verificación Empírica (Anti‑Alucinación)**.

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Escisión arquitectónica (patrón Gateway), telemetría de consumo por motor y segregación de contratos por naturaleza de la carga.
- **Entorno:** Docker Compose del Nodo de Producción 11 (`10.0.10.11`). Interconexión por red interna de Docker entre el servicio `web` (Next.js) y un nuevo servicio `ia-gateway`.
- **Entropía Asimilada:** Hoy cada adaptador de IA del monolito (`GeminiClient`, adaptadores Groq, `JevClient`) implementa por su cuenta la selección de modelo, el fallback y la telemetría. La Aduana Universal centraliza esas responsabilidades en un único servicio y separa dos contratos: generación de lenguaje natural (System Two) y decisión tipada (System One), respetando el Principio de Segregación de Interfaces (ISP) y la tolerancia cero a `any` en los contratos del monolito.

---

## 1. Descripción General

**Como** Administrador / Operador Técnico de BarcelonaXplorer,
**Quiero** extraer la comunicación con los proveedores de IA hacia un microservicio independiente (IA Gateway) que exponga dos endpoints estructuralmente separados: `/v1/llm/generate` para generación con LLMs y `/v1/decision/evaluate` para decisiones tipadas de System One,
**Para** orquestar el tráfico según la naturaleza de la carga, aislar el contrato de decisión tipada del de generación libre, disponer de un modelo de anclaje ante la caída de proveedores y registrar el consumo de tokens, la latencia y el motor utilizado en la bitácora de telemetría bajo el contexto `LLM_ENGINE`.

---

## 2. Componentes Arquitectónicos y Topología de Red

### 2.1. El Contenedor Satélite (IA Gateway)

- **Despliegue:** Nuevo servicio `ia-gateway` declarado en [`src/docker-compose.yml`](../../src/docker-compose.yml) junto a `web` y `db`. Sin publicación de puertos en el host: solo es alcanzable desde `web` por la red interna de Compose (p. ej. `http://ia-gateway:<puerto>`).
- **Autenticación interna:** Toda petición de `web` al gateway lleva una cabecera con secreto compartido (p. ej. `IA_GATEWAY_SECRET`). El gateway rechaza con `401` cualquier petición sin ella.
- **Custodia de secretos:** `GEMINI_API_KEY`, `GROQ_API_KEY` y `JEV_API_KEY` pasan a ser variables del servicio `ia-gateway`. Al cerrar la migración, `web` deja de necesitarlas.
- **Sobre de respuesta:** Ambos endpoints responden con `OperationEnvelope<T>` (Axioma V), con la misma forma que [`src/shared/operation-envelope.ts`](../../src/shared/operation-envelope.ts): `success`, `exitCode`, `result`, `feedback`, `errors`.
- **Sensor de salud de proveedores:** El gateway mantiene el estado de salud de cada proveedor con dos fuentes:
  - **Pasiva (principal):** latencia y códigos de error de las peticiones reales, en ventana deslizante, con cortocircuito (*circuit breaker*) al superar un umbral de fallos o de latencia.
  - **Activa (complementaria):** sondas periódicas contra endpoints de descubrimiento que no consumen créditos (`GET /v1/models` en Jev AI y los listados de modelos de Gemini y Groq). Estas sondas miden disponibilidad, no latencia de inferencia.

### 2.2. Topología de Endpoints (Bifurcación Estructural)

| Endpoint | Naturaleza | Entrada | Salida (`result`) |
|---|---|---|---|
| `POST /v1/llm/generate` | Generación con LLM (System Two) | `prompt`, `engineType` (`FAST_LLM` o `REASONING_LLM`), `responseFormat` (`text` o `json`) y, si es `json`, el identificador del esquema esperado | Texto, u objeto JSON validado contra el esquema pedido |
| `POST /v1/decision/evaluate` | Decisión tipada (System One) | `state` (texto de contexto), `instruction` y el tipo de primitiva (`noul` o `choice`, con sus `choices`) | Para `noul`: `probability` e `isAffirmative`. Para `choice`: `selectedChoice`, `confidence` y `probabilities` |

- **`/v1/llm/generate`:** Selecciona el proveedor de la matriz de la modalidad pedida según el estado de salud (sección 2.1). Si se pide `json`, la respuesta se valida con Zod antes de devolverse; si no valida, el gateway lo trata como fallo del proveedor y pasa al siguiente. Esto garantiza **conformidad estructural**, no veracidad del contenido.
- **`/v1/decision/evaluate`:** Nunca delega en un LLM generativo. Hoy su única implementación es Jev AI (`POST /api/v1/systemone`), que evalúa texto en lenguaje natural y devuelve probabilidades calibradas. El contrato expone primitivas tipadas y oculta el proveedor (Principio Abierto/Cerrado): sustituir Jev AI no altera el contrato.

### 2.3. Adaptador en Next.js (Vertical Slicing)

- **Ubicación:** `src/features/ai-engine/ia-gateway/`, con cliente y test colocalizado (`ia-gateway.client.ts` e `ia-gateway.client.test.ts`). No se crea `src/infrastructure/ai/`.
- **Contrato:** El cliente implementa los puertos que ya consumen los casos de uso, de modo que la migración es una sustitución de adaptador:
  - [`ITypedDecisionEngine`](../../src/features/ai-engine/ITypedDecisionEngine.ts) (`evaluateNoul`, `evaluateChoice`, `evaluateHealth`) → `/v1/decision/evaluate`.
  - `AiGeneratorPort` (hoy implementado por `GeminiClient`) → `/v1/llm/generate`.
- **Frontera Zod:** La respuesta del gateway entra como `unknown` y se parsea con un esquema Zod por endpoint. Cada método devuelve su propio tipo; no existe un tipo de respuesta común que obligue a discriminar entre generación y decisión.

### 2.4. Jerarquía de Supervivencia (Anclaje Base)

- **Variables:** `DEFAULT_FAST_LLM` y `DEFAULT_REASONING_LLM`, con formato `<proveedor>:<modelo>` (p. ej. `groq:qwen/qwen3.8-27b`, `google:gemini-1.5-flash`).
- **Origen real de la configuración:** Se declaran en `src/.env.production`, que [`ansible/deploy.yml`](../../ansible/deploy.yml) copia a `shared/` y que Docker Compose carga mediante `env_file`. Ansistrano solo enlaza el fichero compartido en cada release; no inyecta variables.
- **Regla de anclaje:** Si todos los proveedores de la matriz de una modalidad están en cortocircuito o devuelven error, el gateway enruta al modelo de anclaje de esa modalidad y marca `fallbackTriggered: true`.
- **Restricción de diseño:** El modelo de anclaje debe pertenecer a un proveedor distinto del principal de su matriz; de lo contrario, una caída del proveedor principal arrastra también al anclaje.
- **Agotamiento total:** Si el anclaje también falla, el gateway responde con `OperationEnvelope` de error (`success: false`). El monolito aplica entonces su degradación controlada (*Fail‑Soft*) ya existente, como los mensajes de respaldo de los adaptadores Groq. El usuario final no recibe un error 500.

### 2.5. Fuera de Alcance

- **Embeddings** (`gemini-embedding.adapter.ts`, persistencia vectorial en LanceDB): no encajan en ninguno de los dos endpoints; permanecen en el monolito.
- **Streaming** (`/api/planner/stream`): `/v1/llm/generate` devuelve la respuesta completa. El streaming a través del gateway queda para otra historia.

---

## 3. Contrato de Telemetría (Aduana Universal)

- **Canal:** El gateway no escribe en MySQL ni conoce el esquema de telemetría. Devuelve las métricas de cada petición dentro del `OperationEnvelope` (campo `result.metrics`) y es el cliente de Next.js quien las registra, en modo *fire‑and‑forget*, a través de `TelemetryRepositoryPort`, con el interruptor `TELEMETRY_LLM_ENABLED` vigente.
- **Contexto:** `LLM_ENGINE` (contexto existente). La modalidad se distingue por el campo `engineType` del payload, sin migración de base de datos.
- **Columnas existentes de `TelemetryLog`:** `durationMs` (latencia en milisegundos, desde la recepción en el gateway hasta su respuesta) y `statusCode`.
- **Payload JSON** (camelCase, en línea con los adaptadores actuales):

| Campo | Tipo | Descripción |
|---|---|---|
| `engineType` | `FAST_LLM` \| `REASONING_LLM` \| `TYPED_DECISION` | Modalidad ejecutada |
| `provider` | `GOOGLE` \| `GROQ` \| `JEV` | Proveedor que sirvió la petición |
| `modelId` | `string` | Modelo exacto (p. ej. `gemini-1.5-flash`, `jev-latest`) |
| `promptTokens` | `number` \| `null` | Tokens de entrada informados por el proveedor. En Jev AI: `usage.input_tokens` |
| `completionTokens` | `number` \| `null` | Tokens de salida informados por el proveedor. En Jev AI: `usage.output_tokens` |
| `totalTokens` | `number` \| `null` | Suma de los anteriores o valor informado por el proveedor |
| `fallbackTriggered` | `boolean` | `true` si se enrutó al modelo de anclaje base |
| `attemptedProviders` | `string[]` | Proveedores intentados antes del que respondió |

- **Tokens desconocidos:** Si el proveedor no informa el uso, el campo va a `null`, nunca a `0`. Un `0` falsearía el coste real.

---

## 4. Criterios de Aceptación (Verificación Empírica)

### Escenario 1: Segregación de Contratos y Tolerancia Cero a `any`

- **Dado** el cliente del gateway en `src/features/ai-engine/ia-gateway/` con TypeScript estricto.
- **Cuando** un caso de uso invoca `evaluateNoul` o `evaluateChoice`.
- **Entonces** la petición se dirige a `/v1/decision/evaluate` con un cuerpo tipado (`state`, `instruction`, primitiva) y nunca a `/v1/llm/generate`.
- **Y** cada método del cliente devuelve un tipo propio derivado de su esquema Zod, sin tipo de respuesta común entre endpoints.
- **Y** `npx tsc --noEmit`, `npx eslint` y `vitest run` terminan en verde, sin `any`, `as any` ni `as unknown as T` en el código nuevo.

### Escenario 2: Triaje por Salud del Proveedor

- **Dado** una petición a `/v1/llm/generate` con `engineType: REASONING_LLM`.
- **Cuando** el proveedor principal de esa matriz está en cortocircuito por latencia o errores.
- **Entonces** el gateway sirve la petición con el siguiente proveedor sano de la matriz.
- **Y** si se pidió `json`, el resultado supera la validación Zod del esquema solicitado.
- **Y** el payload de telemetría refleja el proveedor que respondió y los intentados en `attemptedProviders`.

### Escenario 3: Anclaje Base (Fallback)

- **Dado** que todos los proveedores de la matriz `FAST_LLM` devuelven `HTTP 429`.
- **Cuando** llega una petición a `/v1/llm/generate` con `engineType: FAST_LLM`.
- **Entonces** el gateway la enruta a `DEFAULT_FAST_LLM` y responde con `success: true`.
- **Y** la telemetría registra `fallbackTriggered: true`.
- **Y** si `DEFAULT_FAST_LLM` también falla, el gateway responde con `success: false` y el monolito aplica su respuesta de degradación controlada, sin propagar un error 500 al usuario.

### Escenario 4: Auditoría de Consumo en la Bitácora

- **Dado** la bitácora de telemetría en `/Admin/Logs` (`TelemetryRecentLogsCard` → `DataTable<TelemetryLogItem>`).
- **Cuando** el operador filtra por contexto `LLM_ENGINE`.
- **Entonces** visualiza de forma unificada las interacciones de las tres modalidades (`FAST_LLM`, `REASONING_LLM`, `TYPED_DECISION`).
- **Y** el visor forense del registro muestra `engineType`, `provider`, `modelId`, los contadores de tokens y `fallbackTriggered`.

---

## 5. Definición de Hecho (DoD)

- [ ] Servicio `ia-gateway` declarado en `src/docker-compose.yml`, sin puertos publicados en el host y con autenticación interna por secreto compartido.
- [ ] Ambos endpoints responden con `OperationEnvelope<T>` y validan su entrada con Zod.
- [ ] Cliente en `src/features/ai-engine/ia-gateway/` que implementa `ITypedDecisionEngine` y `AiGeneratorPort`, con test colocalizado.
- [ ] Variables `DEFAULT_FAST_LLM`, `DEFAULT_REASONING_LLM` e `IA_GATEWAY_SECRET` documentadas en `src/.env.example`.
- [ ] Telemetría registrada bajo `LLM_ENGINE` con el payload de la sección 3.
- [ ] Oráculos en verde: `npx tsc --noEmit`, `npx eslint` y `vitest run`.

---

## 5.1. Trazabilidad de PBIs de Implementación

| PBI | Descripción | Prioridad | Estado | Documento |
|---|---|---|---|---|
| PBI-GW-001 | Scaffolding del Microservicio IA Gateway | P0 | **Completado** | [`Realizado/PBI - Scaffolding del Microservicio IA Gateway (P0).md`](../PBI/Realizado/PBI%20-%20Scaffolding%20del%20Microservicio%20IA%20Gateway%20(P0).md) |
| PBI-GW-002 | Endpoint de Decisión Tipada System One | P1 | **Completado** | [`Realizado/PBI - Endpoint de Decisión Tipada System One en IA Gateway (P1).md`](../PBI/Realizado/PBI%20-%20Endpoint%20de%20Decisi%C3%B3n%20Tipada%20System%20One%20en%20IA%20Gateway%20(P1).md) |
| PBI-GW-003 | Endpoint de Generación LLM System Two | P1 | **Completado** | [`Realizado/PBI - Endpoint de Generación LLM System Two en IA Gateway (P1).md`](../PBI/Realizado/PBI%20-%20Endpoint%20de%20Generaci%C3%B3n%20LLM%20System%20Two%20en%20IA%20Gateway%20(P1).md) |
| PBI-GW-004 | Sensor de Salud y Circuit Breaker | P1 | **Completado** | [`Realizado/PBI - Sensor de Salud de Proveedores y Circuit Breaker en IA Gateway (P1).md`](../PBI/Realizado/PBI%20-%20Sensor%20de%20Salud%20de%20Proveedores%20y%20Circuit%20Breaker%20en%20IA%20Gateway%20(P1).md) |
| PBI-GW-005 | Jerarquía de Anclaje Base y Fallback | P1 | **Completado** | [`Realizado/PBI - Jerarquía de Anclaje Base y Fallback en IA Gateway (P1).md`](../PBI/Realizado/PBI%20-%20Jerarqu%C3%ADa%20de%20Anclaje%20Base%20y%20Fallback%20en%20IA%20Gateway%20(P1).md) |
| PBI-GW-006 | Cliente IA Gateway en Next.js Vertical Slice | P1 | Pendiente | [`Pendiente/PBI - Cliente del IA Gateway en Next.js Vertical Slice (P1).md`](../PBI/Pendiente/PBI%20-%20Cliente%20del%20IA%20Gateway%20en%20Next.js%20Vertical%20Slice%20(P1).md) |
| PBI-GW-007 | Telemetría Unificada bajo LLM_ENGINE | P2 | Pendiente | [`Pendiente/PBI - Telemetría Unificada bajo LLM_ENGINE para IA Gateway (P2).md`](../PBI/Pendiente/PBI%20-%20Telemetr%C3%ADa%20Unificada%20bajo%20LLM_ENGINE%20para%20IA%20Gateway%20(P2).md) |
| PBI-GW-008 | IaaC Docker Compose y Ansistrano | P1 | Pendiente | [`Pendiente/PBI - IaaC Docker Compose y Despliegue Ansistrano del IA Gateway (P1).md`](../PBI/Pendiente/PBI%20-%20IaaC%20Docker%20Compose%20y%20Despliegue%20Ansistrano%20del%20IA%20Gateway%20(P1).md) |
| PBI-GW-009 | Migración Big-Bang de Adaptadores | P2 | Pendiente | [`Pendiente/PBI - Migración de Adaptadores Directos al IA Gateway (P2).md`](../PBI/Pendiente/PBI%20-%20Migraci%C3%B3n%20de%20Adaptadores%20Directos%20al%20IA%20Gateway%20(P2).md) |

---

## 6. Decisiones Resueltas (Vértice Biológico)

- **D-1 — Stack y ubicación del gateway:** [RESUELTO] Ubicado en `ia-gateway/` en la raíz del repositorio con TypeScript estricto, Node.js nativo (servidor HTTP ligero), su propio `package.json`, tests Vitest y Dockerfile para orquestación Compose.
- **D-2 — Contexto de telemetría:** [RESUELTO] Reutilizar el contexto existente `LLM_ENGINE`, discriminando la modalidad en el payload JSON (`FAST_LLM`, `REASONING_LLM`, `TYPED_DECISION`) sin alterar el schema Prisma ni la base de datos.
- **D-3 — Matrices de proveedores por modalidad:** [RESUELTO] `FAST_LLM`: Groq principal con fallback a Gemini 2.5 Flash; `REASONING_LLM`: Gemini 2.5 Flash principal con fallback a Groq; `TYPED_DECISION`: Jev AI principal.
- **D-4 — Plan de migración:** [RESUELTO] Sustitución completa (Big-Bang) de los adaptadores en el monolito hacia el IA Gateway en PBI-GW-009.

---

## Anexo A: Verificación Empírica (Anti‑Alucinación)

| # | Afirmación original | Evidencia en el repositorio | Corrección aplicada |
|---|---|---|---|
| 1 | El endpoint `/v1/deterministic/evaluate` "ignora el lenguaje natural" y devuelve "un resultado absoluto" calculado por Jev | [`ITypedDecisionEngine.ts`](../../src/features/ai-engine/ITypedDecisionEngine.ts): `evaluateNoul(state: string, instruction: string)` devuelve `probability`; `evaluateChoice` devuelve `confidence` y `probabilities`. HU-INFRA-JEV-001 define `noul` como "probabilidad calibrada" | Endpoint renombrado a `/v1/decision/evaluate` y modalidad a `TYPED_DECISION`. El contrato admite texto de contexto y devuelve probabilidades |
| 2 | `prompt_tokens: 0` para operaciones deterministas | [`jev/types.ts`](../../src/features/ai-engine/jev/types.ts): `usage.input_tokens` / `output_tokens`. `jevClient.ts` maneja `402` "Saldo de tokens o créditos insuficiente" | Jev AI informa tokens y se registran. Tokens desconocidos se registran como `null`, no como `0` |
| 3 | Contexto `IA_ENGINE` | El enum `TelemetryContext` (Prisma, Zod, entidad y SQL de Ansible) solo contiene `CLIENT_UI`, `SERVER_API`, `LLM_ENGINE`, `SYSTEM`, `SECURITY_PERIMETER`. Todos los adaptadores de IA registran bajo `LLM_ENGINE` | Se reutiliza `LLM_ENGINE` y la modalidad va en el payload. La alternativa queda como decisión D-2 |
| 4 | Tabla reactiva filtrable en `/Admin/System` | `TelemetryRecentLogsCard` solo se monta en [`src/app/Admin/Logs/page.tsx`](../../src/app/Admin/Logs/page.tsx). `/Admin/System` aloja las sondas de salud | Escenario 4 apunta a `/Admin/Logs` |
| 5 | Cliente en `src/infrastructure/ai/iaGatewayClient.ts` | `src/infrastructure/` no existe; los adaptadores de IA viven en `src/features/ai-engine/` (ADR-001, Axioma I) | Ubicación `src/features/ai-engine/ia-gateway/` con test colocalizado |
| 6 | "Inyección de variables inmutables vía Ansistrano" | `ansible/deploy.yml` copia `src/.env.production` a `shared/`; `docker-compose.yml` lo carga con `env_file` | Se describe el mecanismo real |
| 7 | El microservicio emite eventos "hacia el bus central de Next.js" | No existe bus de eventos. La ingesta vigente es `TelemetryRepositoryPort` en servidor y `POST /api/telemetry/log` para emisores externos | El gateway devuelve las métricas en el sobre y Next.js las registra |
| 8 | `/v1/llm/generate` devuelve JSON con "Tolerancia Cero a alucinaciones" | Ningún mecanismo puede garantizar la veracidad de un LLM. Lo verificable es la forma de la respuesta (validación Zod, como ya hace `GeminiClient` con `TacticalRouteZodSchema`) | Se promete conformidad estructural, no ausencia de alucinaciones |
| 9 | Fallback "inquebrantable" "sin que el frontend reciba errores" | Si el anclaje comparte proveedor con la matriz o también cae, la promesa no se cumple | Anclaje en proveedor distinto y comportamiento definido ante agotamiento total |
| 10 | "Worker" que audita la latencia de los proveedores | Sondear inferencia real consume tokens. Solo los endpoints de descubrimiento son gratuitos (Jev `GET /v1/models`), y no miden latencia de inferencia | Sensor pasivo sobre tráfico real más sondas de disponibilidad gratuitas |
| 11 | Escenario 1: `tsc` demuestra la ausencia de "guardas de tipo ambiguas" | El compilador no detecta guardas innecesarias; detecta tipos incompatibles | El criterio exige tipos de retorno propios por método y los tres oráculos en verde |
| 12 | `provider` de ejemplo `Local` | No hay ningún motor local; Jev AI es remoto (`https://jev-ai.pro/api`) | Proveedores `GOOGLE`, `GROQ`, `JEV` |
| 13 | Payload con `prompt_tokens` (snake_case) junto a `durationMs` (camelCase) | Los adaptadores usan camelCase (`promptTokens`, `completionTokens`, `totalTokens` en `groq-conversational-slm.adapter.ts`) y `durationMs` es columna de `TelemetryLog` | Payload en camelCase; la latencia usa la columna `durationMs` |
| 14 | El contrato no menciona `OperationEnvelope<T>` | Axioma V y [`operation-envelope.ts`](../../src/shared/operation-envelope.ts) | Ambos endpoints responden con el sobre |
| 15 | Título "Enrutamiento Multi-Modal" | "Multimodal" designa en IA la entrada de imagen o audio; aquí se enruta entre motores de texto | Encabezado cambiado a "Multi-Motor". El nombre del fichero se conserva para no romper enlaces |
| 16 | Estatus "Listo para Implementación" | El stack del gateway, las matrices de proveedores y el plan de migración no estaban definidos | Estatus condicionado a las decisiones D-1 a D-4 |
