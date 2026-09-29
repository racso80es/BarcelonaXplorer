# [OPERATIVO] Documento Destilado: PBI - Cliente del IA Gateway en Next.js Vertical Slice

**Identificador:** PBI-GW-006
**Estatus:** Pendiente
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `src/features/ai-engine/ia-gateway/`
**Entorno:** Next.js 16, TypeScript estricto, Zod 4
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-GW-002, PBI-GW-003, PBI-GW-005
**Bloqueo:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Adaptador HTTP en el monolito Next.js que implementa [`ITypedDecisionEngine`](../../src/features/ai-engine/ITypedDecisionEngine.ts) y [`AiGeneratorPort`](../../src/features/ai-engine/ai-generator.port.ts), delegando al IA Gateway por red interna de Docker.
- **Entorno:** `src/features/ai-engine/ia-gateway/` (Axioma I, ADR-001).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tipos Propios por Método):* Cada método devuelve un tipo propio derivado de su esquema Zod; no hay tipo de respuesta común entre endpoints.
  - *Filtro B (Frontera Determinista):* La respuesta del gateway entra como `unknown` y se parsea en la frontera Zod (Axioma II — Parse, don't validate).
  - *Filtro C (Seguridad):* El cliente inyecta `IA_GATEWAY_SECRET` en cada petición vía cabecera `x-ia-gateway-secret`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** un cliente en `src/features/ai-engine/ia-gateway/` que implemente los puertos existentes delegando al gateway,
**Para** que la sustitución de los adaptadores directos sea transparente a los casos de uso.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Implementación `ITypedDecisionEngine`):** Métodos `evaluateNoul`, `evaluateChoice` y `evaluateHealth` que invocan `POST /v1/decision/evaluate` y parsean la respuesta con Zod por método.
- [ ] **CA-2 (Implementación `AiGeneratorPort`):** Método(s) que invocan `POST /v1/llm/generate` con el `engineType` y `responseFormat` adecuados.
- [ ] **CA-3 (Frontera Zod):** Un esquema Zod por endpoint (`ia-gateway-decision.schema.ts`, `ia-gateway-llm.schema.ts`). La respuesta entra como `unknown`; cero `any`, cero `as unknown as T`.
- [ ] **CA-4 (Cabecera de Secreto):** Todas las peticiones incluyen `x-ia-gateway-secret` con el valor de `IA_GATEWAY_SECRET` del entorno.
- [ ] **CA-5 (Tests Colocalizados):** `ia-gateway.client.test.ts` con mocks HTTP que cubren: decisión `noul`, decisión `choice`, generación `text`, generación `json`, error del gateway (envelope con `success: false`), gateway inalcanzable (timeout/red).
- [ ] **CA-6 (Oráculos del Monolito):** `npx tsc --noEmit`, `npx eslint` y `vitest run` en verde. Sin `any` ni `as any` en el código nuevo.
