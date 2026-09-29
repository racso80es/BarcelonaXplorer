# [OPERATIVO] Documento Destilado: PBI - Cliente del IA Gateway en Next.js Vertical Slice

**Identificador:** PBI-GW-006  
**Estatus:** Completado  
**Fecha de Creación:** 2026-09-29  
**Fecha de Culminación:** 2026-09-29  
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)  
**Módulo:** `src/features/ai-engine/ia-gateway/`  
**Entorno:** Next.js 16, TypeScript estricto, Zod 4  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** PBI-GW-002, PBI-GW-003, PBI-GW-005  
**Bloqueo:** Ninguno  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Adaptador HTTP en el monolito Next.js que implementa [`ITypedDecisionEngine`](../../../src/features/ai-engine/ITypedDecisionEngine.ts) y [`AiGeneratorPort`](../../../src/features/ai-engine/ai-generator.port.ts), delegando al IA Gateway por red interna de Docker.
- **Entorno:** `src/features/ai-engine/ia-gateway/` (Axioma I — Vertical Slicing, ADR-001).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tipos Propios por Método):* Cada método devuelve su propio tipo de dominio o primitivo derivado de esquemas Zod (`IaGatewayNoulEnvelopeSchema`, `IaGatewayChoiceEnvelopeSchema`, `IaGatewayLlmEnvelopeSchema`); cero tipos comunes forzados.
  - *Filtro B (Frontera Determinista):* La respuesta HTTP ingresa como `unknown` y se parsea en frontera Zod (Axioma II). Cero `any`, cero `as any`, cero `as unknown as T`.
  - *Filtro C (Seguridad):* Inyección automática de `x-ia-gateway-secret` en cada petición hacia el gateway.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,  
**Quiero** un cliente en `src/features/ai-engine/ia-gateway/` que implemente los puertos existentes delegando al gateway,  
**Para** que la sustitución de los adaptadores directos sea transparente a los casos de uso.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Implementación `ITypedDecisionEngine`):** Métodos `evaluateNoul`, `evaluateChoice` y `evaluateHealth` que invocan `/v1/decision/evaluate` y `/healthz`, parseando la respuesta con esquemas Zod dedicados.
- [x] **CA-2 (Implementación `AiGeneratorPort`):** Método `generateTacticalRoute` (con validación de `TacticalRouteZodSchema` y entidades de dominio puro `TacticalRoute`, `TacticalWaypoint`, `GeoCoordinates`, `TimeSpan`) y `generateText` que invocan `/v1/llm/generate`.
- [x] **CA-3 (Frontera Zod):** Esquemas Zod por endpoint (`ia-gateway-decision.schema.ts`, `ia-gateway-llm.schema.ts`, `ia-gateway-common.schema.ts`). Cero `any` o aserciones inseguras.
- [x] **CA-4 (Cabecera de Secreto):** Todas las peticiones inyectan `x-ia-gateway-secret` con `IA_GATEWAY_SECRET`.
- [x] **CA-5 (Tests Colocalizados):** `ia-gateway.client.test.ts` con 7 tests unitarios cubriendo decisión `noul`, decisión `choice`, salud, ruta táctica JSON, texto libre, sobre con `success: false` y gateway inalcanzable.
- [x] **CA-6 (Oráculos del Monolito):** `npx tsc --noEmit`, `npx eslint` y `vitest` en verde. Cero `any`.

---

## 3. Evidencia de Certificación de Oráculos

1. **Vitest en Monolito (`src/`):**
   - Archivo `features/ai-engine/ia-gateway/ia-gateway.client.test.ts` superado con 7/7 tests en verde.
2. **TypeScript (`tsc --noEmit`):**
   - 0 errores en el compilador estricto del monolito.
3. **Linter AST (`eslint`):**
   - 0 advertencias, 0 errores con `--max-warnings 0`.
