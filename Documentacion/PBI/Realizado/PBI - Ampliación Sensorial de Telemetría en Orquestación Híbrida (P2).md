# [OPERATIVO] Documento Destilado: PBI - Ampliación Sensorial de Telemetría en Orquestación Híbrida

**Identificador:** PBI-OPS-TELEM-002  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Culminación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Estabilización Evolutiva y Saneamiento Post-Anclaje v2.0.1](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Estabilizaci%C3%B3n%20Evolutiva%20y%20Saneamiento%20Post-Anclaje%20v2.0.1.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** `src/features/telemetry/`, `src/app/Admin/System/`, `src/app/Admin/Cognitive/`  
**Entorno:** Next.js 16 (App Router), Prisma ORM / MySQL 8.0, WebSockets / SSE / Server Actions  
**Prioridad:** Media (P2 - Observabilidad y Supervisión de Rutas Cognitivas)  
**Estimación Táctica:** 2 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Instrumentación sensorial y telemetría de eventos termodinámicos generados en la orquestación híbrida (latencia de enrutamiento semántico Jev AI, conteo de tokens consumidos en SLM vs LLM pesado, y tasa de bifurcación empática vs logística).
- **Entorno:** Capa de telemetría unificada (`src/features/telemetry/`), endpoints de registro `/api/telemetry/log`, y dashboards de administración (`src/app/Admin/`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Todos los nuevos tipos de eventos (`triage_routed`, `density_evaluated`, `provider_queried`) se modelan mediante esquemas Zod estrictos, impidiendo registros amorfos o fugas de datos sensibles del usuario.
  - *Filtro B (Determinismo y Soberanía):* Ingesta no bloqueante en base de datos MySQL con buffers defensivos y políticas de purga automática ya establecidas en el sistema.
  - *Filtro C (Eficiencia Operativa):* Presentación de métricas resumidas en la Sala de Control Táctica para supervisión sin latencia.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador del Sistema y Centinela de Telemetría (Vértice Biológico),  
**Quiero** monitorizar en tiempo real el comportamiento de las nuevas rutas de triaje y orquestación híbrida desde la Sala de Control Táctica,  
**Para** medir con precisión milimétrica la latencia de clasificación, el ahorro de costes en tokens gracias al SLM y el rendimiento de las llamadas a proveedores de afiliación.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Esquemas de Evento Tipados):** Se incorporan al discriminador Zod de telemetría los esquemas formales y deterministas: `TriageRoutedEventSchema` (`TRIAGE_ROUTED`), `DensityThresholdCheckEventSchema` (`DENSITY_THRESHOLD_CHECK`), `ProviderAffiliateFetchEventSchema` (`PROVIDER_AFFILIATE_FETCH`) y la unión discriminada `HybridOrchestrationEventSchema` en [`src/features/telemetry/telemetry.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/telemetry/telemetry.schema.ts).
- [x] **CA-2 (Captura de Métricas Clave):** Cada evento registra duración en milisegundos, modelo utilizado (Groq/Jev vs Gemini), tokens consumidos/ahorrados y código de respuesta HTTP. Instrumentado en [`src/features/triage/triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts).
- [x] **CA-3 (Visualización en Admin):** 
  - En `/Admin/System`: Integración de la sonda reactiva de orquestación híbrida [`HybridTelemetryCard.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/System/HybridTelemetryCard.tsx) con métricas en tiempo real de latencia, eventos y tokens conservados.
  - En `/Admin/Cognitive`: Adición de la 5ª tarjeta de KPI cognitivo "Ahorro Cognitivo SLM" en [`CognitiveKpiCards.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/Cognitive/CognitiveKpiCards.tsx), con cálculo acumulativo de tokens derivados fuera del LLM pesado.
- [x] **CA-4 (Verificación de Oráculos):** 
  - Pruebas unitarias colocadas en [`src/features/telemetry/telemetry.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/telemetry/telemetry.test.ts) validando validación de esquemas Zod, mitigación anti-fuga en `TelemetryEntry.sanitizePayload` y persistencia Prisma/MySQL.
  - Pruebas UI en [`src/app/Admin/System/__tests__/HybridTelemetryCard.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/System/__tests__/HybridTelemetryCard.test.tsx) y [`tests/app/Admin/Cognitive/cognitive-kpi-cards.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/Admin/Cognitive/cognitive-kpi-cards.test.tsx).

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (0 errores de tipos en todo el proyecto)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npm run lint
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Suite de Pruebas Unitarias e Integración (`vitest`):**
   ```bash
   npm test
   # Test Files: 65 passed (65)
   # Tests: 323 passed (323)
   # Duración: 18.90s
   ```
4. **Verificación de Ancla Evolutiva (`./scripts/audit-anchor.sh`):**
   ```bash
   ./scripts/audit-anchor.sh
   # Exit code: 0 - 100% verde en compilador, tests y linter.
   ```
