# [OPERATIVO] Documento Destilado: PBI - Migración de Adaptadores Directos al IA Gateway

**Identificador:** PBI-GW-009
**Estatus:** Pendiente (bloqueado por D-4)
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `src/features/ai-engine/`, composición en `src/app/api/`
**Entorno:** Monolito Next.js, raíces de composición
**Prioridad:** Media (P2)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-GW-006, PBI-GW-007
**Bloqueo:** Decisión D-4 (plan de migración: big-bang o por fases)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Sustitución de los adaptadores directos (`GeminiClient`, adaptadores Groq, `JevClient`) por el cliente del gateway (`ia-gateway.client.ts`) en las raíces de composición. Retiro de claves de proveedor de `web`.
- **Entorno:** Monolito Next.js, raíces de composición en `src/app/api/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Transparencia de Puertos):* Los puertos (`ITypedDecisionEngine`, `AiGeneratorPort`, `IConversationalSLMPort`) no cambian; solo cambia el adaptador inyectado (Pure DI, Axioma V).
  - *Filtro B (Estrategia de Migración):* Si D-4 dicta migración por fases, este PBI puede subdividirse (primero Jev, después Groq/Gemini), manteniendo los adaptadores directos como respaldo temporal.
  - *Filtro C (Retiro de Secretos):* Tras la migración completa, `web` deja de necesitar `GEMINI_API_KEY`, `GROQ_API_KEY` y `JEV_API_KEY`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** sustituir los adaptadores de IA directos por el cliente del gateway en todas las raíces de composición,
**Para** centralizar la orquestación de IA en el gateway y simplificar la configuración de `web`.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Sustitución):** Todas las raíces de composición (`src/app/api/triage/route.ts`, `/api/planner/`, etc.) inyectan `IaGatewayClient` en lugar de los adaptadores directos para los puertos `ITypedDecisionEngine` y `AiGeneratorPort`.
- [ ] **CA-2 (Retiro de Variables):** `GEMINI_API_KEY`, `GROQ_API_KEY` y `JEV_API_KEY` eliminadas del servicio `web` en Docker Compose. Las variables persisten solo en `ia-gateway`.
- [ ] **CA-3 (Embeddings Excluidos):** [`gemini-embedding.adapter.ts`](../../src/features/ai-engine/gemini-embedding.adapter.ts) permanece en el monolito con acceso directo a `GEMINI_API_KEY` (fuera de alcance de HU-16 §2.5). Si `web` aún necesita `GEMINI_API_KEY` solo por embeddings, se documenta explícitamente.
- [ ] **CA-4 (Respaldo Temporal):** Si D-4 dicta fases, los adaptadores directos coexisten como fallback con un interruptor `USE_IA_GATEWAY=true|false` en `src/.env`. Al cierre de la migración, se retiran.
- [ ] **CA-5 (Tests de Integración):** Los tests existentes de los casos de uso siguen pasando con el nuevo adaptador inyectado (o con mocks del cliente del gateway).
- [ ] **CA-6 (Oráculos):** `npx tsc --noEmit`, `npx eslint` y `vitest run` en verde. Sin regresiones en la suite completa.

---

## 3. Notas de Forja (Anti-Alucinación)

- **Embeddings no migran.** `gemini-embedding.adapter.ts` y la persistencia vectorial en LanceDB permanecen en el monolito (HU-16 §2.5). Si embeddings es el único consumidor de `GEMINI_API_KEY` en `web`, la variable permanece en `web` y se documenta.
- **`IConversationalSLMPort` puede necesitar extensión.** El gateway expone `/v1/llm/generate` con `engineType: FAST_LLM`, que cubre la funcionalidad del SLM conversacional. Sin embargo, el método `generateContextualGreeting` del puerto podría requerir un mapeo específico en el cliente del gateway.
- **Streaming excluido.** `/api/planner/stream` sigue llamando directamente al proveedor hasta que el streaming por gateway sea implementado en otra historia (HU-16 §2.5).
