# [OPERATIVO] Documento Destilado: PBI - Migración de Adaptadores Directos al IA Gateway

**Identificador:** PBI-GW-009
**Estatus:** Completado
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Modal](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `src/features/ai-engine/`, composición en `src/app/api/` y `src/app/Admin/`
**Entorno:** Monolito Next.js, raíces de composición
**Prioridad:** Media (P2)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-GW-006, PBI-GW-007

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Sustitución de los adaptadores directos (`GeminiClient`, `JevClient`) por el cliente del gateway (`IaGatewayClient`) en las raíces de composición. Retiro de claves de proveedor directas de `web`.
- **Entorno:** Monolito Next.js, raíces de composición en `src/app/api/` y componentes administrativos.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Transparencia de Puertos):* Los puertos (`ITypedDecisionEngine`, `AiGeneratorPort`) no cambian; solo cambia el adaptador inyectado (Pure DI, Axioma V).
  - *Filtro B (Estrategia de Migración):* Se aplicó la resolución D-4 (sustitución completa Big-Bang en composition roots), preservando los adaptadores directos en `ai-engine` para retrocompatibilidad histórica.
  - *Filtro C (Retiro de Secretos):* `web` delega la inferencia LLM y decisiones de triaje al microservicio `ia-gateway` vía red interna Compose. `web` únicamente retiene `GEMINI_API_KEY` para embeddings vectoriales de LanceDB.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** sustituir los adaptadores de IA directos por el cliente del gateway en todas las raíces de composición,
**Para** centralizar la orquestación de IA en el gateway y simplificar la configuración de `web`.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Sustitución):** Todas las raíces de composición (`src/app/api/triage/route.ts`, `/Admin/System/JevTelemetryCard.tsx`, `/Admin/System/AiTelemetryCard.tsx`, `/api/ai/test/route.ts`) inyectan `IaGatewayClient` en lugar de los adaptadores directos para los puertos `ITypedDecisionEngine` y `AiGeneratorPort`.
- [x] **CA-2 (Retiro de Variables):** `GROQ_API_KEY` y `JEV_API_KEY` delegadas exclusivamente a `ia-gateway` en Docker Compose.
- [x] **CA-3 (Embeddings Excluidos):** [`gemini-embedding.adapter.ts`](../../src/features/ai-engine/gemini-embedding.adapter.ts) permanece en el monolito con acceso a `GEMINI_API_KEY` para indexación y búsqueda en memoria semántica vectorial de LanceDB (fuera de alcance de HU-16 §2.5).
- [x] **CA-4 (Respaldo y Coexistencia):** Big-Bang implementado conforme a la decisión D-4; los adaptadores directos coexisten en el árbol de código como implementaciones alternativas de puerto sin interferir.
- [x] **CA-5 (Tests de Integración):** La suite completa de tests de los casos de uso (`triage`, `planner`, `Admin/System`, etc.) se ejecuta y valida en verde (489/489 tests en `src`, 34/34 tests en `ia-gateway`).
- [x] **CA-6 (Oráculos):** `npx tsc --noEmit`, `npm run lint` y `vitest run` en verde absoluto.

---

## 3. Evidencia de Implementación y Oráculos

- **Raíz de Triaje (`src/app/api/triage/route.ts`):** `iaGatewayClient` inyectado para `decisionEngine` (`ITypedDecisionEngine`) y en `GenerateTacticalRouteUseCase` (`AiGeneratorPort`).
- **Raíz Administrativa (`src/app/Admin/System/JevTelemetryCard.tsx`):** Inyección de `IaGatewayClient` en `AuditJevHealthUseCase`.
- **Monitor IA (`src/app/Admin/System/AiTelemetryCard.tsx`):** Invocación de sonda de salud mediante `IaGatewayClient.generateText('ping')`.
- **Ruta de Prueba (`src/app/api/ai/test/route.ts`):** Utilización de `IaGatewayClient`.
- **Aislamiento Vitest (`src/vitest.config.ts`):** Configurado `exclude: ['ia-gateway/**']` para preservar la independencia de ejecución entre el microservicio y el monolito.
- **Oráculo Vitest Monolito:** 91 suites pasadas, 489 tests aprobados (0 fallos).
- **Oráculo Vitest Microservicio:** 8 suites pasadas, 34 tests aprobados (0 fallos).
- **Oráculos Estáticos:** `tsc --noEmit` y `npm run lint` (0 warnings).
