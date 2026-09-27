# [OPERATIVO] Historia de Usuario 10: Gamificación Logística y Escudo de Supervivencia (Fase de Generación)

- **Estatus:** Realizado (S+ Grade) · Forja Culminada y Validada
- **Fecha de Aprobación & Culminación:** 2026-09-27
- **Autor:** Operador Técnico / Arquitectura BarcelonaXplorer
- **Módulo:** Motor Híbrido, Planificador Táctico y Lienzo de Orquestación (`src/features/planner/`, `src/features/guide-templates/`, `src/components/tactical/hybrid-canvas.tsx`, `src/app/orchestrator/`)
- **Marco Normativo & Diseño:** [AGENTS.md (Protocolo de Acero S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/AGENTS.md) · [ADR-001 (Vertical Slicing)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [HU-8 (Gamificación Sensorial y Medidor Térmico)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%208%20%28Refinada%29:%20Gamificaci%C3%B3n%20Sensorial%20y%20Medidor%20T%C3%A9rmico%20Agn%C3%B3stico%20%28UI-UX%29.md) · [Esquema Prisma Relacional](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma) · [Contratos Zod de Templates y Metadatos Tácticos](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts)

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Revelación Progresiva de Valor (Gradiente de Recompensa Cognitiva), Desacoplamiento Ético de la Seguridad (Táctica del Refugio), Curaduría Hiperlocal Premium, Monetización Asimétrica Preventiva (CPA) y Resiliencia Fail-Soft.
- **Entorno:** Ecosistema Híbrido BarcelonaXplorer (Next.js 16 App Router, React 19 Client Components, MySQL 8 / Prisma ORM, Motor de Inferencia Gemini, Memoria Cognitiva LanceDB, Lienzo Lateral `HybridCanvas` y `ThermalMeter`).
- **Entropía Asimilada:**
  1. **Alineación con la Máquina de Estados del `ThermalMeter` (Filtro A):** Se erradica la noción vaga de un "umbral bloqueante" desconectado. La generación se rige por la bifurcación termodinámica formal:
     - **Estado Operativo (`operational`, `survivalThreshold <= score < 100%`):** Genera la **Ruta Operativa Segura**, garantizando viabilidad física, cronológica e inyección innegociable de la seguridad vital (`antiTrapShield.warnings`, `microLogistics.pickpocketAlertLevel`, `transitTips`) con catálogo comercial pasivo.
     - **Estado Saturado (`saturated`, `score === 100%`):** Genera la **Ruta Táctica S+ Grade**, desbloqueando la curaduría gastronómica hiperlocal (`antiTrapShield.recommendedAlternatives`), la calibración fina de marcha a pie y los **Drops Preventivos de Afiliación** (`affiliateRefs` con acceso prioritario sin colas).
  2. **Diagnóstico Ético y Desacoplamiento de la Seguridad (Filtro B - La Táctica del Refugio):** Se prohíbe terminantemente condicionar la integridad física del usuario biológico (alertas de carteristas en puntos calientes o trampas turísticas) al llenado de variables de perfil comercial (presupuesto o acompañantes). La *Honestidad Radical* es un principio innegociable, nunca un rehén transaccional. La protección vital viaja desde el umbral operativo mínimo; la saturación al 100% se reserva para la excelencia curativa y la erradicación de colas operativas.
  3. **Tolerancia Cero a la Inferencia en Contratos de Metadatos (Axioma II):** Se erradica el modelado ad-hoc en texto libre. Toda la sabiduría táctica se tipa estrictamente mediante esquemas Zod canónicos ([`TacticalMetadataSchema`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts#L12-L36) y [`AffiliateRefSchema`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts#L55-L67)), garantizando interoperabilidad entre las plantillas de MySQL (`TemplateItem`) y los nodos enriquecidos del itinerario ([`EnrichedWaypoint`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/affiliate-enricher.schema.ts#L20-L33)).
  4. **Ausencia de Alucinación Temporal en Resiliencia Fail-Soft (Filtro A & Axioma IV):** Se erradica la falsa certeza temporal de entregas globales en "menos de 100 ms" ante timeouts de red durante la inferencia LLM. El [`CircuitBreaker`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/circuit-breaker.ts) aísla fallos en servicios externos y MySQL mediante conmutación transparente al catálogo estático, garantizando degradación elegante sin error 500 y sin bloqueo del renderizado en cliente.
  5. **Coherencia de Superficies Visuales (Chat + `HybridCanvas`):** La visualización del itinerario no queda restringida a un scroll de mensajes. El resultado se proyecta de forma sincronizada en el panel interactivo lateral [`HybridCanvas`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/tactical/hybrid-canvas.tsx), permitiendo edición horaria con propagación cronológica, visualización de alertas tácticas y selección de opciones comerciales verificadas.

---

## 1. Descripción General

**Como** turista en fase de planificación interactuando con el orquestador de BarcelonaXplorer,  
**Quiero** recibir un itinerario que garantice mi seguridad física y me advierta de trampas turísticas desde el umbral operativo básico, y que recompense la saturación completa de mi contexto desbloqueando alternativas gastronómicas hiperlocales genuinas y drops de acceso prioritario para evitar colas críticas,  
**Para** sentirme protegido en todo momento sin pagar un peaje ético por mi integridad física, experimentando que mi esfuerzo de entrada desbloquea alta curaduría y conveniencia logística de nivel S+ Grade.

---

## 2. Justificación Arquitectónica y Principios de Forja

### 2.1. Psicodinámica de la Gamificación: Desacoplamiento Ético de la Seguridad y Curaduría Premium
En la fase de generación previa al viaje, la gamificación no consiste en coleccionar medallas vacías ni mecánicas cosméticas, ni en secuestrar advertencias de seguridad física para forzar la recolección de datos. Se fundamenta en dos principios irrenunciables:
1. **La Táctica del Refugio (Seguridad Innegociable en Ruta Base 60%-99%):** Resuelve la viabilidad logística espaciotemporal mediante [`ChronologicalPropagator`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/chronological-propagator.ts) e integra obligatoriamente los metadatos de protección vital: advertencias contra trampas masificadas ([`antiTrapShield.warnings`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts#L16)) y el semáforo de riesgo de carteristas ([`microLogistics.pickpocketAlertLevel`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts#L22) y `transitTips`). Cumple el principio de Fricción Cero y Honestidad Radical sin dejar desamparado al usuario biológico.
2. **Curaduría Hiperlocal y Fricción Cero Premium (Ruta S+ Grade al 100%):** Lo que permanece reservado exclusivamente como recompensa a la saturación térmica del contexto es el valor curativo diferencial y la conveniencia operativa:
   - **Alternativas Locales Auténticas (`antiTrapShield.recommendedAlternatives`):** Sugerencias gastronómicas y culturales de barrio fuera de las rutas comerciales tradicionales.
   - **Drops Preventivos de Afiliación (Monetización Asimétrica CPA):** Enlaces directos de reserva y pases prioritarios (`placementTrigger: HIGH_QUEUE_MONUMENT` o `POST_WARNING`), neutralizando colas de más de 90 minutos en monumentos masificados (Sagrada Familia, Casa Batlló).
   - **Micro-Logística Calibrada:** Estimación exacta de marcha a pie (`realWalkingTimeMinutes`) y adaptabilidad ambiental (`environmentalConditions`).

```
+---------------------------------------------------------------------------------------------------+
|                         MATRIZ DE BIFURCACIÓN DE GENERACIÓN TÁCTICA                              |
+---------------------------------------------------------------------------------------------------+
| UMBRAL TÉRMICO         | TIPO DE RUTA             | CONTENIDO DE LA RESPUESTA                     |
+------------------------+--------------------------+-----------------------------------------------+
| score < threshold      | NINGUNA (Fase Inerte)    | Repregunta atómica del SLM (TriageOutcome)    |
| (ej. < 60% default)    |                          | Sin consumo de tokens de Gemini               |
+------------------------+--------------------------+-----------------------------------------------+
| threshold <= score <100| RUTA OPERATIVA SEGURA    | - Nodos físicos con horarios propagados       |
| (ej. 60% a 99%)        | (Táctica del Refugio)    | - Alertas Anti-Trampas (warnings vitales)     |
|                        |                          | - Alerta de carteristas y tips de tránsito    |
|                        |                          | - Opciones estándar de catálogo pasivo        |
|                        |                          | - Banner didáctico: Curaduría S+ latente      |
+------------------------+--------------------------+-----------------------------------------------+
| score === 100%         | RUTA TÁCTICA S+ GRADE    | - Todo el blindaje de la Ruta Operativa       |
| (Saturación Térmica)   | (Curaduría & Cero Colas) | - Alternativas gastronómicas locales genuinas |
|                        |                          | - Drops Preventivos CPA (Pases sin colas)     |
|                        |                          | - Micro-logística calibrada de marcha a pie   |
+------------------------+--------------------------+-----------------------------------------------+
```

### 2.2. Contratos Deterministas Zod (Axioma II)
Para erradicar inferencias difusas y alucinaciones, la sabiduría hiperlocal y los acuerdos comerciales se rigen por los esquemas deterministas Zod validados en el dominio:

```typescript
// src/features/guide-templates/domain/guide-template.schema.ts
export const PickpocketAlertLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']);
export type PickpocketAlertLevel = z.infer<typeof PickpocketAlertLevelEnum>;

export const TacticalMetadataSchema = z.object({
  antiTrapShield: z.object({
    warnings: z.array(z.string().max(250)).default([]),
    recommendedAlternatives: z.array(z.string().max(250)).default([]),
  }).optional(),
  microLogistics: z.object({
    pickpocketAlertLevel: PickpocketAlertLevelEnum.default('LOW'),
    transitTips: z.string().max(300).optional(),
    realWalkingTimeMinutes: z.number().int().nonnegative().optional(),
  }).optional(),
  environmentalConditions: z.object({
    rainFriendly: z.boolean().default(true),
    requiresDaylight: z.boolean().default(false),
  }).optional(),
}).strict();

export const AffiliateRefSchema = z.object({
  provider: z.enum(['THE_FORK', 'CIVITATIS', 'TIQETS', 'CABIFY', 'FREE_NOW']),
  externalId: z.string().max(64),
  campaignUrl: z.string().url().max(512),
  ctaLabel: z.string().max(60),
  placementTrigger: z.enum(['POST_WARNING', 'ROUTE_END', 'HIGH_QUEUE_MONUMENT', 'MEAL_TIME']),
}).strict();
```

### 2.3. Doble Superficie Visual de Renderizado (Axioma I & III)
La entrega del itinerario se orquesta reactivamente en dos superficies complementarias de la interfaz:
1. **Línea de Turnos Conversacional ([`src/app/orchestrator/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/page.tsx)):**
   - Renderiza la tarjeta resumen con título, secuencia ordenada de paradas, chips de franjas horarias y recomendaciones de ruta.
   - En ambas modalidades (Base y S+ Grade), expone las advertencias de seguridad física y el enlace al puente táctico de Telegram ([`TelegramAnchorDrop`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/TelegramAnchorDrop.tsx)).
2. **Lienzo Lateral Híbrido ([`HybridCanvas`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/tactical/hybrid-canvas.tsx)):**
   - Panel interactivo desplegable a la derecha que exhibe el desglose granular de cada parcela con soporte para streaming progresivo SSE.
   - **En Ruta Operativa Base (60%-99%):** Cada tarjeta muestra las alertas de peligro (`antiTrapShield.warnings`) y la insignia de carteristas (`microLogistics.pickpocketAlertLevel`). Las alternativas gastronómicas permanecen ocultas y se renderiza el banner didáctico:  
     `"Ruta Operativa Segura. Completa tu perfil para desbloquear alternativas gastronómicas hiperlocales y pases de acceso prioritario."`
   - **En Ruta Táctica S+ Grade (100%):** Cada tarjeta despliega las alternativas de locales auténticos (`antiTrapShield.recommendedAlternatives`) y los slots de reserva con CTA directo de acceso prioritario (Civitatis / TheFork) validados por [`CircuitBreaker`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/circuit-breaker.ts).

---

## 3. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Generación de Ruta Operativa Segura (Umbral de Supervivencia 60%-99%)
**Dado** un usuario en la matriz de exploración general (`default`) que ha aportado la variable crítica `time_window` (alcanzando un score de 60% sobre el umbral de supervivencia 60%),  
**Y** el estado del `ThermalMeter` se encuentra en modo `operational` (`isThresholdSatisfied = true`),  
**Cuando** el orquestador procesa la solicitud de generación (o el usuario pulsa "Forjar Ruta Inmediata"),  
**Entonces** el motor [`GenerateTacticalRouteUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/generate-tactical-route.use-case.ts) forja una ruta viable con horarios propagados correctamente,  
**Y** el sistema inyecta en los nodos de alta concurrencia los metadatos de seguridad vital:  
  - Advertencias anti-trampa (`antiTrapShield.warnings`),  
  - Semáforo de riesgo de carteristas (`microLogistics.pickpocketAlertLevel`),  
  - Consejos de tránsito (`microLogistics.transitTips`),  
**Y** las alternativas gastronómicas recomendadas (`antiTrapShield.recommendedAlternatives`) y los pases de acceso prioritario permanecen latentes,  
**Y** el panel lateral [`HybridCanvas`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/tactical/hybrid-canvas.tsx) exhibe el banner didáctico:  
`"Ruta Operativa Segura. Completa tu perfil para desbloquear alternativas gastronómicas hiperlocales y pases de acceso prioritario."`

---

### Escenario 2: Desbloqueo S+ Grade: Curaduría Hiperlocal y Alternativas Genuinas
**Dado** un usuario que ha proporcionado un contexto completo (`time_window`, `group_size`, `vibe`, `constraints`), saturando la matriz al 100% (`state === 'saturated'`),  
**Cuando** el orquestador forja el itinerario y cruza una parada con trampa turística (ej. "Basílica de la Sagrada Família"),  
**Entonces** además de las alertas de seguridad obligatorias, el sistema extrae e inyecta las `antiTrapShield.recommendedAlternatives` validadas por [`TacticalMetadataSchema`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts),  
**Y** la tarjeta del nodo en el [`HybridCanvas`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/tactical/hybrid-canvas.tsx) renderiza recomendaciones concretas de locales tradicionales y auténticos fuera del circuito masificado (ej. bodegas históricas y restaurantes de cocina de mercado adyacentes en el Eixample),  
**Y** se recalculan los tiempos de marcha con precisión granular mediante `microLogistics.realWalkingTimeMinutes`.

---

### Escenario 3: Drop Preventivo de Afiliación (Pases de Acceso Prioritario en Puntos de Fricción)
**Dado** un itinerario S+ Grade que incorpora un monumento de colapso de aforo (ej. Sagrada Família o Casa Batlló) clasificado bajo la categoría `CULTURE`,  
**Cuando** se renderiza la parada correspondiente en el [`HybridCanvas`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/tactical/hybrid-canvas.tsx),  
**Entonces** el servicio de afiliados detecta el disparador `placementTrigger: 'HIGH_QUEUE_MONUMENT'`,  
**Y** despliega de forma destacada la tarjeta de acción preventiva con llamada de acceso prioritario:  
`"Aforo crítico de alta congestión. Asegura tu acceso prioritario aquí antes de desplazarte para evitar colas de más de 90 minutos."`  
**Y** el enlace externo contiene los parámetros de afiliación auditados y etiquetados (`tag=bcn_xplorer` / `aid=bcn_xplorer`) sin alterar la fluidez de navegación del usuario.

---

### Escenario 4: Persistencia Relacional y Resiliencia Fail-Soft (Degradación Elegante)
**Dado** un itinerario generado tanto en modalidad Base como S+ Grade,  
**Cuando** se completa el ciclo de ensamblaje en [`TriageInputUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts),  
**Entonces** el repositorio [`PrismaItineraryRepository`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/prisma-itinerary.repository.ts) persiste la estructura completa en las tablas `tactical_itineraries` y `tactical_itinerary_nodes` de MySQL,  
**Y** ante cualquier timeout o fallo transitorio en la conexión a MySQL o servicios de afiliados externos, el [`CircuitBreaker`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/circuit-breaker.ts) conmuta de inmediato al catálogo estático resiliente ([`STATIC_AFFILIATE_CATALOG`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/static-affiliate-catalog.ts)),  
**Y** el sistema entrega la ruta a la interfaz garantizando degradación elegante, sin arrojar errores 500 y sin bloqueo del renderizado en cliente.

---

## 5. Trazabilidad de Forja e Implementación (PBIs Realizados)

Toda la especificación de esta Historia de Usuario ha sido descompuesta, planificada, implementada y verificada bajo la Santa Trinidad de Oráculos (`tsc`, `eslint`, `vitest`) mediante los siguientes Product Backlog Items:

1. **[PBI-PLN-TACTICAL-ENRICH-001 (Realizado)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Esquemas%20Deterministas,%20Value%20Objects%20y%20Servicio%20de%20Enriquecimiento%20T%C3%A1ctico%20con%20Escudo%20de%20Supervivencia%20%28P1%29.md):**
   - Esquemas deterministas Zod (`TacticalMetadataSchema`, `PickpocketAlertLevelEnum`, `PlacementTriggerEnum`).
   - Base de conocimiento táctico canónica (`TACTICAL_KNOWLEDGE_BASE`).
   - Bifurcación termodinámica en `AffiliateEnricherService` (`operational` vs `saturated`).
   - Suite de pruebas unitarias al 100% en `affiliate-enricher.service.test.ts`.

2. **[PBI-FEAT-CANVAS-SURVIVAL-002 (Realizado)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Renderizado%20Reactivo%20del%20Escudo%20de%20Supervivencia%20y%20Drops%20Preventivos%20en%20HybridCanvas%20y%20Orquestador%20UI%20%28P1%29.md):**
   - Banner reactivo de estado táctico en `HybridCanvas` con microcopy contextual diferenciado.
   - Escudo de supervivencia incondicional (alertas de trampas y badges de carteristas).
   - Desbloqueo S+ Grade de alternativas hiperlocales auténticas y drops preventivos de afiliación (`HIGH_QUEUE_MONUMENT` con etiqueta de acceso prioritario).
   - Suite de pruebas de componentes colocada en `hybrid-canvas.test.tsx`.

3. **[PBI-ORCH-TACTICAL-SYNC-003 (Realizado)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Sincronizaci%C3%B3n%20End-to-End%20de%20la%20Bifurcaci%C3%B3n%20T%C3%A1ctica%20y%20Persistencia%20Relacional%20en%20MySQL%20con%20Fail-Soft%20%28P1%29.md):**
   - Integración end-to-end de `thermalState` en `TriageInputUseCase` y streaming de API (`/api/orchestrator/stream`).
   - Extracción de restricciones (`constraints`) para permitir saturación al 100%.
   - Persistencia relacional de `metadata` e `itineraryNodes` en MySQL con fallback resiliente `CircuitBreaker`.
   - Suite de pruebas de integración en `triage.test.ts` (11/11 tests en verde).

