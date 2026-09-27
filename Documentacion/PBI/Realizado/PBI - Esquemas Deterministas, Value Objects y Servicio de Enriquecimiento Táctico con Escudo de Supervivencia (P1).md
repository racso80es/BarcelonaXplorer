# [OPERATIVO] Documento Destilado: PBI - Esquemas Deterministas, Value Objects y Servicio de Enriquecimiento Táctico con Escudo de Supervivencia

**Identificador:** PBI-PLN-TACTICAL-ENRICH-001  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 10: Gamificación Logística y Escudo de Supervivencia (Fase de Generación)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2010:%20Gamificaci%C3%B3n%20Log%C3%ADstica%20y%20Escudo%20de%20Supervivencia%20%28Fase%20de%20Generaci%C3%B3n%29.md)  
**Módulo:** `src/features/planner/affiliate/` y `src/features/planner/`  
**Entorno:** TypeScript 5.8+, Zod 4+, Vitest  
**Prioridad:** Alta (P1 - Núcleo de Dominio y Seguridad Vital)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Extensión determinista de contratos Zod, desacoplamiento ético de seguridad (Táctica del Refugio), y lógica de bifurcación de enriquecimiento táctico según el estado térmico (`operational` vs `saturated`).
- **Entorno:** `src/features/planner/affiliate/affiliate-enricher.schema.ts`, `affiliate-enricher.service.ts` y colocated tests `affiliate-enricher.service.test.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tolerancia Cero a la Inferencia):* Tipado estricto mediante esquemas Zod deterministas acoplados a `TacticalMetadataSchema` y `AffiliateRefSchema`.
  - *Filtro B (Táctica del Refugio - Seguridad Innegociable):* En modo `operational` (60%-99%) se inyectan de forma mandatoria `antiTrapShield.warnings`, `microLogistics.pickpocketAlertLevel` y `transitTips`. Las alternativas gastronómicas recomendadas y los drops CPA preventivos de pases de acceso prioritario se reservan exclusivamente para modo `saturated` (100%).
  - *Filtro C (Resiliencia Fail-Soft):* Preservación del `CircuitBreaker` ante caídas de proveedores, sin comprometer el renderizado en cliente ni la seguridad física del usuario.

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador Backend y Especialista en Dominio Táctico de BarcelonaXplorer,  
**Quiero** incorporar los metadatos del Escudo de Supervivencia (`antiTrapShield` y `microLogistics`) en el contrato `EnrichedWaypoint` y actualizar `AffiliateEnricherService` para bifurcar el enriquecimiento según el estado de saturación térmica,  
**Para** garantizar que la Ruta Operativa Base proporcione protección vital inmediata y la Ruta S+ Grade entregue la curaduría gastronómica y conveniencia operativa premium sin alucinaciones.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Ampliación Contractual Zod):** Actualización de `EnrichedWaypointSchema` en [`src/features/planner/affiliate/affiliate-enricher.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/affiliate-enricher.schema.ts) para soportar opcionalmente `tacticalMetadata` (`antiTrapShield`, `microLogistics`, `environmentalConditions`) y metadatos de bifurcación térmica (`thermalState?: 'operational' | 'saturated'`).
- [x] **CA-2 (Bifurcación en Servicio de Enriquecimiento):** Adaptación del método `enrichRoute(route: TacticalRoute, thermalState?: 'operational' | 'saturated'): Promise<EnrichedRoute>` en [`AffiliateEnricherService`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/affiliate-enricher.service.ts):
  - Si `thermalState === 'operational'` (o por defecto en Base): inyecta advertencias de trampa y nivel de carteristas de puntos críticos conocidos de Barcelona, pero omite alternativas gastronómicas y pases CPA de alta prioridad.
  - Si `thermalState === 'saturated'`: inyecta alternativas gastronómicas auténticas fuera del circuito masificado y drops de acceso prioritario con etiqueta preventiva (`placementTrigger: HIGH_QUEUE_MONUMENT`).
- [x] **CA-3 (Preservación de Fail-Soft en CircuitBreaker):** El comportamiento de contingencia ante fallos (`fallbackWaypoint`) respeta la inyección de seguridad física sin colapsar.
- [x] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias colocadas en [`src/features/planner/affiliate/affiliate-enricher.service.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/affiliate-enricher.service.test.ts) certificando al 100% la bifurcación Base vs S+ Grade y el desacoplamiento de la seguridad física (5 tests en verde).

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (Cero errores de compilación)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npm run lint
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Oráculo de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/planner/affiliate/
   # Test Files: 2 passed (2)
   # Tests: 11 passed (11)
   # Duration: 535ms
   ```
