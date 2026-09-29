# [OPERATIVO] Documento Destilado: PBI - Telemetría Unificada bajo LLM_ENGINE para IA Gateway

**Identificador:** PBI-GW-007
**Estatus:** Pendiente (bloqueado por D-2)
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `src/features/ai-engine/ia-gateway/`, `src/features/telemetry/`
**Entorno:** Monolito Next.js, `TelemetryRepositoryPort`, MySQL
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-GW-006
**Bloqueo:** Decisión D-2 (contexto de telemetría: reutilizar `LLM_ENGINE` o crear contexto dedicado)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Registro de las métricas devueltas por el gateway (`result.metrics`) en la bitácora de telemetría existente, en modo *fire-and-forget*, bajo el contexto `LLM_ENGINE` con el payload definido en HU-16 §3.
- **Entorno:** Monolito Next.js, `TelemetryRepositoryPort`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Separación de Responsabilidades):* El gateway no escribe en MySQL ni conoce el esquema de telemetría; solo devuelve métricas en el sobre.
  - *Filtro B (Interruptor Existente):* Se respeta el interruptor `TELEMETRY_LLM_ENABLED`; la modalidad se distingue por `engineType` en el payload JSON, sin migración de base de datos.
  - *Filtro C (Veracidad de Tokens):* Tokens desconocidos van a `null`, nunca a `0`. Un `0` falsearía el coste real.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el cliente del gateway registre las métricas de cada interacción en la bitácora de telemetría,
**Para** auditar el consumo de tokens, la latencia y los fallbacks de forma unificada en `/Admin/Logs`.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Fire-and-Forget):** El cliente del gateway registra las métricas tras recibir la respuesta, sin bloquear el retorno al caso de uso. Usa `TelemetryRepositoryPort` existente.
- [ ] **CA-2 (Payload):** El JSON del registro contiene todos los campos de HU-16 §3: `engineType`, `provider`, `modelId`, `promptTokens`, `completionTokens`, `totalTokens`, `fallbackTriggered`, `attemptedProviders`.
- [ ] **CA-3 (Contexto):** Registrado bajo `LLM_ENGINE` (o el contexto que decida D-2). Sin migración de schema Prisma ni de enum SQL en este PBI si se reutiliza `LLM_ENGINE`.
- [ ] **CA-4 (Interruptor):** Si `TELEMETRY_LLM_ENABLED` es `false`, no se registra. El comportamiento existente no se altera.
- [ ] **CA-5 (Visibilidad en Admin):** El visor forense de `/Admin/Logs` (`TelemetryRecentLogsCard`) puede mostrar los nuevos campos del payload cuando se expande un registro `LLM_ENGINE`.
- [ ] **CA-6 (Tests):** Test que verifica que el registro se emite con el payload correcto y que no se emite cuando el interruptor está apagado.
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` en verde.
