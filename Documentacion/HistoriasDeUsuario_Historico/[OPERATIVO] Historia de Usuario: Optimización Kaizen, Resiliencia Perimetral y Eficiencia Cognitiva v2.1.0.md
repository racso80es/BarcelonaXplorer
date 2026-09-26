# [OPERATIVO] Historia de Usuario: Optimización Kaizen, Resiliencia Perimetral y Eficiencia Cognitiva v2.1.0

**Identificador:** HU-KAIZEN-001  
**Estatus:** Realizada / Certificada (5/5 PBIs Completados — 11/11 SP — Protocolo de Acero S+)  
**Fecha de Creación:** 2026-09-26  
**Última Actualización:** 2026-09-26  
**Naturaleza:** Optimización Kaizen Continua, Resiliencia Operativa y Reducción de Latencia Cognitiva  
**Auditoría Base Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Marco Normativo:** Protocolo de Acero — Grado S+ · [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) · [Anexo Constitucional: Axiomas de Forja S+ Grade](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/%5BARQUITECTURA%5D%20Anexo%20Constitucional:%20Axiomas%20de%20Forja%20S+%20Grade%20%28Optimizaci%C3%B3n%20para%20IA%29.md)  
**Módulos Afectados:** `src/features/auth/`, `src/features/cognitive-memory/`, `src/features/planner/affiliate/`, `src/features/triage/`, `src/app/orchestrator/`, `.githooks/`  
**Prioridad:** Alta (P1 / P2)  
**Estimación Global:** 11 Story Points (5/5 PBIs culminados exitosamente)  

---

## 1. Descripción General (INVEST)

**Como** Arquitecto de Software y Operador Táctico (Vértice Biológico),  
**Quiero** incorporar las mejoras derivadas del ciclo Kaizen post-anclaje `v2.0.1-doc-anchor`, implementando blindaje anti-abuso por *Token Bucket* en endpoints públicos, una caché semántica vectorial en LanceDB para reutilizar inferencias idénticas, un *Circuit Breaker* en las llamadas a proveedores de afiliación, *streaming* progresivo en el lienzo lateral y automatización de la higiene operativa local,  
**Para** reducir la latencia de respuesta percibida por el usuario a menos de 400ms, blindar las cuotas de inferencia LLM frente a sobreconsumo o ataques de denegación, evitar la degradación del sistema ante caídas de proveedores externos y asegurar la máxima economía termodinámica del ecosistema.

---

## 2. Justificación Arquitectónica (Los Cinco Axiomas S+ Grade)

1. **Axioma I — Ley de Economía Termodinámica (Localidad y Eficiencia):**  
   - La caché semántica vectorial en LanceDB suprime consultas redundantes a la API de Groq/Gemini, alcanzando una tasa de acierto estimada del 35-40% en consultas turísticas comunes.
   - Cada componente o servicio reside estrictamente en su vertical (`src/features/<modulo>/`), respetando $\le 3$ saltos de contexto.

2. **Axioma II — Tolerancia Cero a la Inferencia (Fronteras Deterministas):**  
   - Toda respuesta de degradación (*Fallback*) o bloqueo por límite de tasa (*Rate Limit*) viaja empaquetada bajo el sobre `OperationEnvelope<T>` con esquemas Zod rigurosos. Cero valores `any` o estados indefinidos.

3. **Axioma III — Diseño Declarativo sobre Lógica Imperativa:**  
   - Las políticas de límites de peticiones (capacidad de cubeta, tasa de recarga) y los umbrales del *Circuit Breaker* (fallos consecutivos, ventana de reseteo) se modelan declarativamente como matrices de configuración inmutables.

4. **Axioma IV — El Peaje del Oráculo (Santa Trinidad 100% Verde):**  
   - La inclusión de un hook `pre-commit` local determinista traslada la verificación de la Santa Trinidad (`tsc`, `eslint`, `vitest`) al instante previo de la confirmación física en Git, impidiendo regresiones tempranas.

5. **Axioma V — Ejecución Encapsulada y Aislamiento de Fallos:**  
   - El *Circuit Breaker* encapsula el tráfico hacia APIs externas (Civitatis, TheFork). Ante cualquier timeout o error HTTP 5xx externo, el orquestador continúa respondiendo con el catálogo curado local sin bloquear al turista.

---

## 3. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Blindaje por Token Bucket en `/api/triage` (Axioma II & V)
- **Dado** un cliente o bot que emite más de 10 peticiones por minuto hacia `/api/triage`.
- **Cuando** se procesa la 11ª petición dentro de la ventana activa.
- **Entonces** el sistema responde inmediatamente con código `HTTP 429 Too Many Requests`, cuerpo tipado indicando `retryAfterSeconds` y cabecera estándar `Retry-After`, sin consumir cuota del motor LLM.

### Escenario 2: Aceleración por Caché Semántica Vectorial en LanceDB
- **Dado** una consulta de usuario semánticamente idéntica ($\ge 0.95$ similitud coseno) a una procesada en las últimas 24 horas.
- **Cuando** el caso de uso `TriageInputUseCase` evalúa el vector de entrada.
- **Entonces** recupera la respuesta de la tabla de caché semántica en LanceDB en menos de 50ms, omitiendo la llamada remota al SLM/LLM y registrando en telemetría el evento con `tokensSaved > 0`.

### Escenario 3: Resiliencia ante Caída de Proveedores Externos (Circuit Breaker)
- **Dado** que la API de TheFork o Civitatis responde con timeout $> 1500\text{ ms}$ o errores HTTP 500 consecutivos.
- **Cuando** el `AffiliateEnricherService` intenta enriquecer las paradas del itinerario.
- **Entonces** el Circuit Breaker pasa al estado `OPEN`, degradando de inmediato a las sugerencias del catálogo estático local, garantizando la generación fluida del itinerario sin bloquear la interfaz.

### Escenario 4: Streaming Progresivo en el Lienzo Lateral (`HybridCanvas`)
- **Dado** el inicio de generación de un itinerario complejo.
- **Cuando** el backend orquesta la respuesta mediante Server-Sent Events (SSE) a través de `/api/orchestrator/stream`.
- **Entonces** el componente `HybridCanvas` proyecta progresivamente el contexto inicial ($\le 400\text{ ms}$), luego las paradas y el mapa, y finalmente las sugerencias de afiliación, erradicando pantallas en blanco prolongadas.

### Escenario 5: Aduana Local Pre-Commit e Higiene de Logs
- **Dado** el repositorio local clonado por cualquier agente o desarrollador.
- **Cuando** se ejecuta `git commit`.
- **Entonces** el hook `.githooks/pre-commit` valida automáticamente tipos y linter sobre los archivos staged, rechazando la operación si existen errores; complementado con la ejecución programada de `PruneTelemetryUseCase` vía `/api/telemetry/prune`.

---

## 4. Desglose Operativo en Ítems del Backlog (PBIs Vinculados y Ejecutados)

| Prioridad | Identificador | Título del PBI | Módulos Principales | Estimación | Commit | Estatus |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **P1** | `PBI-SEC-RATE-001` | [[OPERATIVO] Rate Limiting Defensivo por Token Bucket en Endpoints de Triaje](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Rate%20Limiting%20Defensivo%20por%20Token%20Bucket%20en%20Endpoints%20de%20Triaje%20%28P1%29.md) | `src/features/auth/`, `src/app/api/triage/` | 2 SP | `4e1355e` | ✅ Realizado |
| **P1** | `PBI-COGN-CACHE-001` | [[OPERATIVO] Caché Semántica Vectorial en LanceDB para Inferencia Dual](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Cach%C3%A9%20Sem%C3%A1ntica%20Vectorial%20en%20LanceDB%20para%20Inferencia%20Dual%20%28P1%29.md) | `src/features/cognitive-memory/`, `src/features/triage/` | 3 SP | `090f6b3` | ✅ Realizado |
| **P2** | `PBI-RESIL-CIRCUIT-001` | [[OPERATIVO] Circuit Breaker y Fallback Resiliente para Proveedores de Afiliación](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Circuit%20Breaker%20y%20Fallback%20Resiliente%20para%20Proveedores%20de%20Afiliaci%C3%B3n%20%28P2%29.md) | `src/features/planner/affiliate/` | 2 SP | `ef8b952` | ✅ Realizado |
| **P2** | `PBI-FEAT-STREAM-001` | [[OPERATIVO] Streaming Progresivo SSE en Lienzo Lateral HybridCanvas](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Streaming%20Progresivo%20SSE%20en%20Lienzo%20Lateral%20HybridCanvas%20%28P2%29.md) | `src/app/orchestrator/`, `src/components/tactical/` | 3 SP | `9acca96` | ✅ Realizado |
| **P2** | `PBI-OPS-HOOK-001` | [[OPERATIVO] Hook Pre-commit Determinista Local y Purga Programada de Telemetría](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Hook%20Pre-commit%20Determinista%20Local%20y%20Purga%20Programada%20de%20Telemetr%C3%ADa%20%28P2%29.md) | `.githooks/`, `scripts/`, `src/features/telemetry/` | 1 SP | `6cab36a` | ✅ Realizado |

---

## 5. Dictamen Final de Certificación Grado S+

La historia de usuario **HU-KAIZEN-001** ha alcanzado el 100% de cumplimiento táctico bajo los estándares de forja más rigurosos del Protocolo de Acero:
- **Cobertura de la Santa Trinidad:** Compilador TypeScript (`tsc --noEmit`), Linter AST (`eslint`) y suite de pruebas (`vitest run`, 69 archivos de prueba y 348 tests) superados en verde sin excepciones.
- **Tolerancia Cero a la Inferencia:** Eliminación absoluta de `any` y esquemas Zod en todas las fronteras de entrada/salida.
- **Cadena Causal de Commits:** Cada PBI cuenta con su commit atómico debidamente documentado y verificado por la aduana local.
