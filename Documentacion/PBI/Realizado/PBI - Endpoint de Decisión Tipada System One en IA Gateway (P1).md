# [OPERATIVO] Documento Destilado: PBI - Endpoint de Decisión Tipada System One en IA Gateway

**Identificador:** PBI-GW-002  
**Estatus:** Completado  
**Fecha de Creación:** 2026-09-29  
**Fecha de Culminación:** 2026-09-29  
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)  
**Módulo:** `ia-gateway/src/endpoints/decision/`  
**Entorno:** Gateway, adaptador Jev AI (`POST /api/v1/systemone` o `/v1/systemone`)  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** PBI-GW-001  
**Bloqueo:** Ninguno  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Implementación del handler para decisiones tipadas que delega en Jev AI (`POST /api/v1/systemone`), respeta la segregación de interfaces (ISP) y devuelve primitivas tipadas (`noul` → probabilidad e `isAffirmative`; `choice` → selección con confianza y distribución de probabilidades).
- **Entorno:** `ia-gateway/src/endpoints/decision/`, adaptador Jev AI desacoplado.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Segregación ISP):* El endpoint nunca delega en un LLM generativo; está acoplado únicamente a contratos de decisión probabilística calibrada (System One).
  - *Filtro B (Principio Abierto/Cerrado):* El contrato oculta el proveedor (OCP): sustituir Jev AI no altera el esquema ni la interfaz.
  - *Filtro C (Frontera Zod):* Respuesta parseada con Zod; tokens informados por Jev AI (`usage.input_tokens`, `usage.output_tokens`) incluidos en `result.metrics` de forma verídica (o `null` si no se informan).

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,  
**Quiero** que el gateway exponga un endpoint de decisión tipada que encapsule la comunicación con Jev AI,  
**Para** aislar el contrato de System One del de generación y devolver probabilidades calibradas sin exponer el proveedor.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Handler):** `POST /v1/decision/evaluate` parsea el cuerpo con el esquema Zod `DecisionInputSchema`; discrimina `noul` vs `choice` y construye el payload para Jev AI.
- [x] **CA-2 (Adaptador Jev AI):** Adaptador `JevAdapter` que invoca el endpoint System One, valida la respuesta con Zod y extrae `probability` / `isAffirmative` (noul) o `selectedChoice` / `confidence` / `probabilities` (choice).
- [x] **CA-3 (Métricas):** El campo `result.metrics` del `OperationEnvelope` incluye `engineType: 'TYPED_DECISION'`, `provider: 'JEV'`, `modelId`, `promptTokens`, `completionTokens`, `totalTokens` y `durationMs`.
- [x] **CA-4 (Error Jev):** Si Jev AI responde con error (p. ej. `402` saldo insuficiente), el gateway devuelve `success: false` con error descriptivo y código correspondiente, sin `500` incontrolado.
- [x] **CA-5 (Tests):** Tests colocalizados en `decision.test.ts` que cubren: petición `noul` exitosa, petición `choice` exitosa, error de Jev AI (402), y cuerpo inválido (`400`).
- [x] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint` y vitest en verde. Cero `any`.

---

## 3. Evidencia de Certificación de Oráculos

1. **Vitest en IA Gateway:**
   - 5 archivos de test (`decision.test.ts`, `envelope.test.ts`, `auth.test.ts`, `schemas.test.ts`, `server.test.ts`).
   - 21 tests superados al 100%.
2. **TypeScript (`tsc --noEmit`):**
   - 0 errores con tipado estricto.
3. **Linter AST en Monolito (`eslint`):**
   - 0 advertencias, 0 errores.
