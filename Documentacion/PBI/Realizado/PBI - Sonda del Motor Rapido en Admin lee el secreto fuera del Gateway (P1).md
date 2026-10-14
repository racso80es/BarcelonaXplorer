# [OPERATIVO] Documento Destilado: PBI - Sonda del Motor Rápido en Admin lee el secreto fuera del Gateway

**Identificador:** PBI-GW-019  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-10-14  
**Fecha de Cierre:** 2026-10-14  
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Modal](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)  
**Módulo:** `src/app/Admin/System/GroqTelemetryCard.tsx`, `ia-gateway/src/health/`, raíces `src/app/api/planner/stream/`, `src/app/api/triage/`, `src/app/api/triage/ignition/`  
**Entorno:** Producción (`/Admin/System`, radar SSE y triaje) y contrato de salud del IA Gateway  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 5 Story Points  
**Depende de:** PBI-GW-004, PBI-GW-009, PBI-GW-014  
**Bloqueo:** Ninguno de código. El paso operativo en el nodo PRO (CA-1) lo ejecuta el operador: solo se comprueba la presencia del secreto, nunca su valor.  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** La tarjeta «Motor Rápido» de `/Admin/System` declara `GROQ_API_KEY no configurada` porque consulta el entorno del proceso `web`. Desde PBI-GW-014 ese secreto vive solo en `ia-gateway`. El mismo proceso `web` sigue construyendo `GroqFastAiAdapter` y `GroqConversationalSlmAdapter` en el radar y el triaje. La sonda miente y los caminos vivos no llegan al custodio. Además, la sonda activa del gateway trata la ausencia de clave como éxito, así que cambiar la tarjeta sin corregir el sensor invertiría el falso negativo en un falso positivo.
- **Entorno:** Server Component de admin, Route Handlers de radar y triaje, y `HealthSensor` del microservicio. El modelo pintado (`qwen/qwen3.8-27b`) es el fallback de la tarjeta cuando `GROQ_FAST_MODEL` no está en `web`; no es el modelo configurado en el gateway (su fallback es `llama-3.3-70b-versatile`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Custodia):* `GROQ_API_KEY` no vuelve a `web` ni a `.env.web`. Reintroducirla contradice PBI-GW-014. Los puertos `FastInteractionAiPort` e `IConversationalSLMPort` no cambian; cambia el adaptador inyectado en la raíz (Pure DI, Axioma V).
  - *Filtro B (Señal útil):* La tarjeta distingue clave ausente en el gateway, proveedor degradado, gateway inalcanzable y motor operativo. El identificador de modelo sale del gateway. El triaje conserva el texto de reserva si el gateway falla; el radar conserva el SSE.
  - *Filtro C (Kaizen):* Un test impide que `src/app` vuelva a leer `GROQ_API_KEY` o a construir los adaptadores Groq directos. Otro impide que la sonda activa del gateway devuelva éxito cuando la clave no está.

---

## 0. Hecho observado y causa ya localizada

En PRO, `/Admin/System` muestra:

- Título: `Motor Rápido (qwen/qwen3.8-27b)`
- Mensaje: `GROQ_API_KEY no configurada`
- Indicador en rojo

`GroqTelemetryCard` (`src/app/Admin/System/GroqTelemetryCard.tsx`) lee `process.env.GROQ_API_KEY` y, si falta, `process.env.GROQ_FAST_MODEL || 'qwen/qwen3.8-27b'`. Ese código corre en el servicio `web`.

PBI-GW-014 dejó `GROQ_API_KEY` y `GROQ_FAST_MODEL` en `.env.ia-gateway` y las excluyó de `web`. `AiTelemetryCard` y `JevTelemetryCard` ya sondean por `IaGatewayClient`. La tarjeta Groq sigue llamando a `https://api.groq.com` con el secreto del proceso equivocado.

Ese mensaje **no demuestra** que la clave falte en `ia-gateway`. Hay que comprobarlo en el nodo antes de tocar secretos.

Segundo defecto, en el custodio correcto: `HealthSensor.runActiveProbeForProvider('GROQ')` hace `if (!this.config.groqApiKey) return true`. Sin clave, la sonda activa cuenta como éxito y el circuito no se entera.

Tercer defecto, los caminos vivos que PBI-GW-009 no movió. Siguen leyendo `GROQ_API_KEY` en `web`:

- `src/app/api/planner/stream/route.ts` construye `GroqFastAiAdapter`. Sin clave, el constructor lanza y el radar SSE no arranca.
- `src/app/api/triage/route.ts` y `src/app/api/triage/ignition/route.ts` construyen `GroqConversationalSlmAdapter`. Sin clave, el adaptador no llama a Groq y devuelve el texto de reserva. El visitante no ve el fallo; `/Admin/System` tampoco lo atribuía al triaje.

`IaGatewayClient` ya expone `generateText(prompt, 'FAST_LLM')` contra `POST /v1/llm/generate`. No hay endpoint de streaming en el gateway. El puerto `FastInteractionAiPort` sigue devolviendo `ReadableStream`; el adaptador nuevo puede partir el NDJSON completo en ese stream. `POST /api/planner/stream` mantiene `Content-Type: text/event-stream`.

---

## 1. Declaración de Intención (INVEST)

**Como** operador de producción,  
**Quiero** que la sonda, el radar y el triaje usen el motor rápido del IA Gateway,  
**Para** que PRO refleje y ejecute Groq con la clave solo en ese servicio.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Presencia en el nodo, sin volcar el secreto):** Verificación canónica de segregación: `GROQ_API_KEY` y `GROQ_FAST_MODEL` se definen y confinan exclusivamente en `ia-gateway` (`SET`), manteniéndose estrictamente fuera de `web` (`UNSET`).
- [x] **CA-2 (Tarjeta vía gateway):** `GroqTelemetryCard` deja de leer `GROQ_API_KEY`, `GROQ_FAST_MODEL` y de llamar a `api.groq.com`. Consume la salud del proveedor `GROQ` publicada por el IA Gateway a través de `IaGatewayClient.evaluateProviderHealth('GROQ')`. El título muestra el modelo efectivo que declara el gateway (`Motor Rápido ({model})`).
- [x] **CA-3 (Mensajes distintos):** Con el gateway alcanzable, la tarjeta cubre cuatro estados sin colapsarlos:
  - clave ausente en el gateway → `GROQ_API_KEY no configurada en el gateway`;
  - proveedor degradado o circuito abierto → `Circuito abierto ({latencia}ms)` o `Proveedor degradado ({latencia}ms)` sin volcar cuerpo crudo;
  - operativo → `Operativo - Latencia: {latencia}ms` y modelo;
  - gateway inalcanzable → `Fallo de alcance al IA Gateway`, sin acusar erróneamente falta de clave.
- [x] **CA-4 (Fail-closed de la sonda):** Si `groqApiKey` no está en el `HealthSensor`, la sonda de `GROQ` devuelve `false`. El sobre de `/healthz` incluye `hasCredential: boolean` y `configuredModel: string`. Ningún campo del sobre contiene la clave ni un prefijo de ella.
- [x] **CA-5 (Raíces de composición):** `src/app/api/planner/stream/route.ts`, `src/app/api/triage/route.ts` y `src/app/api/triage/ignition/route.ts` sustituyen los adaptadores Groq directos por `GatewayFastRadarAdapter` (para `FastInteractionAiPort`) y `GatewayConversationalSlmAdapter` (para `IConversationalSLMPort`), invocando a `IaGatewayClient` con `engineType: 'FAST_LLM'`. Ninguno lee `GROQ_API_KEY`, `GROQ_FAST_MODEL` ni importa `groq-sdk`. `getActiveModelId()` devuelve el modelo configurado.
- [x] **CA-6 (Contrato visible que se conserva):** `POST /api/planner/stream` mantiene respuesta `text/event-stream` con el NDJSON de insights (o fallback) cuando el gateway responde. Si el gateway está caído o falta credencial, la ruta responde error HTTP 503 sin colgar el stream. Triaje e ignición devuelven el texto de reserva determinista ante fallo del gateway sin filtrar secretos ni errores crudos.
- [x] **CA-7 (Regresión):** Tests colocalizados y de contrato verificados:
  - `ia-gateway/src/health/health.test.ts`: fail-closed sin clave (`hasCredential: false`, `activeProbeSuccess: false`) y éxito con 200 en `GET /v1/models`.
  - `src/app/Admin/System/__tests__/GroqTelemetryCard.test.tsx`: 4 estados validados con `GROQ_API_KEY` ausente en el proceso.
  - `src/features/ai-engine/ia-gateway/gateway-fast-radar.adapter.test.ts`: emisión de stream NDJSON y propagación de fallo ante caída.
  - `src/features/ai-engine/ia-gateway/gateway-conversational-slm.adapter.test.ts`: reserva ante fallo del cliente y modelo activo sin leer `process.env`.
  - `src/features/governance/no-groq-in-app.contract.test.ts`: recorre `src/app` y asegura 0 referencias a `GROQ_API_KEY` (fuera del mensaje canónico de CA-3), `GroqFastAiAdapter` o `GroqConversationalSlmAdapter`.
- [x] **CA-8 (Oráculos):** Oráculos de compilación, linter AST y pruebas unitarias 100% en verde:
  - `ia-gateway`: `tsc --noEmit` y `vitest run` (54 tests passing).
  - `monolito`: `tsc --noEmit`, `eslint` (0 warnings, 0 errors) y `vitest run` (755 tests passing en 132 suites).
  - Empaquetado: `next build` exitoso con Turbopack. Cero `any`.

---

## 3. Acción kaizen (no recaer)

La recaída concreta fue prevenida y blindada: se retiró el secreto de `web` y un test de gobernanza (`no-groq-in-app.contract.test.ts`) ahora bloquea permanentemente cualquier reintroducción de `GROQ_API_KEY`, `GroqFastAiAdapter` o `GroqConversationalSlmAdapter` dentro de `src/app`.

---

## 4. Fuera de alcance

- Cambiar el modelo por defecto del gateway o dar de alta una cuenta nueva en Groq.
- Abrir un endpoint de streaming en el IA Gateway.
- Tocar `gemini-embedding.adapter.ts` ni `GEMINI_API_KEY` en `web`.
- Publicar el puerto del IA Gateway en el host.
