# [OPERATIVO] Documento Destilado: PBI - Streaming Progresivo SSE en Lienzo Lateral HybridCanvas

**Identificador:** PBI-FEAT-STREAM-001  
**Estatus:** Pendiente / Listo para Forja (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Optimización Kaizen, Resiliencia Perimetral y Eficiencia Cognitiva v2.1.0](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Estabilizaci%C3%B3n%20Evolutiva%20y%20Saneamiento%20Post-Anclaje%20v2.0.1.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** `src/app/orchestrator/`, `src/components/tactical/`, `src/features/planner/`  
**Entorno:** Next.js 16 App Router, React 19 Streaming & Server Actions, Server-Sent Events (SSE)  
**Prioridad:** Media (P2 - Mejora de Experiencia de Usuario y Reducción de Latencia Percibida)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Transformación de la entrega sincrónica del itinerario a un flujo reactivo progresivo mediante *Server-Sent Events* (SSE) o ReadableStreams en el Route Handler de orquestación, proyectando en el lienzo lateral (`HybridCanvas`) cada segmento del plan a medida que es sintetizado y enriquecido.
- **Entorno:** `src/app/orchestrator/`, `src/components/tactical/OrchestratorBlock.tsx` y endpoints `/api/orchestrator/stream`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Protocolo de streaming tipado con eventos deterministas (`meta_init`, `stop_emitted`, `affiliate_injected`, `stream_complete`). Cada fragmento se valida contra un esquema Zod antes de su emisión.
  - *Filtro B (Determinismo y Soberanía):* En caso de desconexión del cliente, el servidor detecta el cierre del canal (`request.signal.aborted`) y detiene la computación de inmediato, evitando el consumo inútil de recursos.
  - *Filtro C (Eficiencia Operativa):* Reducción drástica del tiempo hasta el primer contenido significativo (*Time to First Meaningful Paint*) de ~2500ms a $< 400\text{ ms}$.

---

## 1. Declaración de Intención (INVEST)

**Como** Turista o Usuario Móvil en Barcelona (Vértice Biológico),  
**Quiero** ver aparecer progresivamente en el lienzo lateral las paradas y el contexto de mi ruta mientras se calcula el itinerario,  
**Para** no quedarme esperando frente a una pantalla de carga vacía, comprendiendo de inmediato la dirección del plan y accediendo a las primeras recomendaciones de inmediato.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Route Handler de Streaming Tipado):** Endpoint `/api/orchestrator/stream` que retorna un `ReadableStream` con eventos SSE codificados bajo el estándar `data: JSON.stringify(chunk)\n\n`.
- [ ] **CA-2 (Renderizado Incremental en HybridCanvas):** Actualización de `HybridCanvas` y `OrchestratorBlock` para consumir el stream mediante `fetch` + `getReader()`, mostrando el encabezado y contexto en la primera ráfaga ($\le 400\text{ ms}$) y añadiendo secuencialmente las paradas.
- [ ] **CA-3 (Cancelación Proactiva de Computación):** Detección de `AbortSignal` en el servidor para abortar la generación LLM si el usuario navega a otra sección antes de finalizar el streaming.
- [ ] **CA-4 (Verificación de Oráculos):** Pruebas de integración colocadas en `src/app/orchestrator/__tests__/streaming.test.tsx` verificando la recepción de chunks, la reconstrucción del estado en UI y el cierre limpio del flujo.
