# [OPERATIVO] Documento Destilado: PBI - Endpoint de Decisión Tipada System One en IA Gateway

**Identificador:** PBI-GW-002
**Estatus:** Pendiente
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `ia-gateway/src/endpoints/decision/`
**Entorno:** Gateway, adaptador Jev AI (`POST /api/v1/systemone`)
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-GW-001
**Bloqueo:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Implementación del handler para decisiones tipadas que delega en Jev AI (`POST /api/v1/systemone`), respeta la segregación de interfaces (ISP) y devuelve primitivas tipadas (`noul` → probabilidad; `choice` → selección con confianza).
- **Entorno:** Gateway, adaptador Jev AI.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Segregación ISP):* El endpoint nunca delega en un LLM generativo; su única implementación es Jev AI.
  - *Filtro B (Principio Abierto/Cerrado):* El contrato oculta el proveedor (OCP): sustituir Jev AI no altera la interfaz.
  - *Filtro C (Frontera Zod):* Respuesta parseada con Zod; tokens informados por Jev AI (`usage.input_tokens`, `usage.output_tokens`) incluidos en `result.metrics`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el gateway exponga un endpoint de decisión tipada que encapsule la comunicación con Jev AI,
**Para** aislar el contrato de System One del de generación y devolver probabilidades calibradas sin exponer el proveedor.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Handler):** `POST /v1/decision/evaluate` parsea el cuerpo con el esquema Zod de PBI-GW-001; discrimina `noul` vs `choice` y construye el payload de Jev AI.
- [ ] **CA-2 (Adaptador Jev AI):** Adaptador que invoca `POST /api/v1/systemone`, parsea la respuesta con Zod y extrae `probability` / `isAffirmative` (noul) o `selectedChoice` / `confidence` / `probabilities` (choice).
- [ ] **CA-3 (Métricas):** El campo `result.metrics` del `OperationEnvelope` incluye `engineType: 'TYPED_DECISION'`, `provider: 'JEV'`, `modelId`, `promptTokens`, `completionTokens`, `totalTokens` y `durationMs`.
- [ ] **CA-4 (Error Jev):** Si Jev AI responde con error (p. ej. `402` saldo insuficiente), el gateway devuelve `success: false` con error descriptivo, sin `500`.
- [ ] **CA-5 (Tests):** Tests colocalizados que cubren: petición `noul` exitosa, petición `choice` exitosa, error de Jev AI, cuerpo inválido (`400`). Mocks del adaptador HTTP.
- [ ] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint` y tests en verde. Cero `any`.
