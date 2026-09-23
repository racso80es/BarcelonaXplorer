# Historia de Usuario 2: Aduana Universal y Triaje Entrópico (System One + System Two Ligero)

**Identificador**: `HU-CORE-TRIAGE-002`  
**Estatus**: `Refinado / Especificación Consolidada S+ Grade (Con Laudos 1 y 2 Asimilados)`  
**Módulo**: `Módulo 3: Motor Cognitivo y Orquestación (SLM + RAG) / Subcapítulo 3.1: Aduana Universal y Triaje Entrópico`  
**Entorno**: `Next.js App Router (BFF / Node.js Runtime) / Nodo de Producción 11`  
**Componentes**: `src/domain/schemas/matrix.ts`, `src/application/use-cases/triage-input.use-case.ts`, `src/infrastructure/ai/jev/`, `src/infrastructure/ai/groq/`, `src/infrastructure/repositories/in-memory-density-matrix.repository.ts`, `src/app/api/triage/`  
**Referencias Técnicas Oficiales**: [Jev AI Developer Docs](https://jev-ai.pro/docs) (Base URL: `https://jev-ai.pro/api`), [Groq Cloud Documentation](https://console.groq.com/docs)

---

## 1. Descripción General (INVEST)

**Como** explorador urbano interactuando con la PWA de BarcelonaXplorer,  
**Quiero** que el sistema evalúe mis peticiones en lenguaje natural de forma instantánea a través de un único endpoint frontal (`/api/triage`), combinando sinérgicamente decisiones deterministas (System One vía Jev AI), síntesis ligera (System Two vía Groq) y despacho interno al orquestador pesado (Gemini),  
**Para** recibir respuestas inmediatas sin fricción si mi consulta excede Barcelona o carece de variables críticas, forjando el itinerario automáticamente cuando la matriz alcanza el umbral de supervivencia (60%) y manteniendo la memoria de mis respuestas previas en el backend sin exponer el estado al frontend.

---

## 2. Justificación Arquitectónica y Decretos Vinculantes

### 2.1. Arquitectura Cognitiva en Dos Tiempos (System One vs System Two Ligero)
BarcelonaXplorer legisla una separación estricta entre la **evaluación lógica determinista** y la **expresión en lenguaje natural**:
- **System One (Jev AI - `/api/v1/systemone`)**: Actúa como juez estricto y clasificador categórico. Evalúa la pertenencia perimetral a Barcelona mediante evaluación booleana/probabilística (`noul`) y clasifica la presencia o ausencia de variables de contexto mediante selección tipada (`choice`). No genera prosa ni conversa; emite decisiones puras con probabilidades calibradas en < 150 ms.
- **System Two Ligero (Groq SLM - `qwen/qwen3.8-27b`)**: Actúa como conserje empático. No toma decisiones de negocio, no evalúa perímetros geográficos ni calcula pesos. Únicamente sintetiza en una sola frase (< 200 ms) el rebote amable ante consultas fuera de Barcelona o la repregunta atómica orientada a la variable faltante identificada por System One.
- **Orquestador Pesado (Gemini 1.5 Flash / Pro + LanceDB)**: Despachado internamente por el propio backend cuando se supera el umbral, sin exponer bifurcaciones a la UI.

### 2.2. Laudos Constitucionales de Unificación y Gobernanza (S+ Grade)

> [!IMPORTANT]
> #### Laudo 1: Unificación de la Aduana (Endpoint Único Frontal)
> Se consolida `/api/triage` como el **único punto de entrada frontal** para las peticiones de usuario. La interfaz de usuario (PWA) queda liberada de la carga cognitiva de decidir si invoca a un orquestador "rápido" o "lento".  
> El flujo es estrictamente unidireccional: la UI dispara contra `/api/triage`.
> - Si la matriz está incompleta o fuera de perímetro, el endpoint devuelve el rebote táctico o la repregunta atómica (Groq).
> - Si la matriz alcanza el umbral del 60%, el propio backend despacha internamente la ejecución hacia el orquestador pesado (`GenerateTacticalRouteUseCase` con Gemini) y devuelve el itinerario forjado en la misma petición HTTP.
> - Quedan formalmente desmantelados y erradicados los endpoints preliminares fragmentados `/api/orchestrator/fast` y `/api/orchestrator/slow`.

> [!IMPORTANT]
> #### Laudo 2: Gobernanza del Estado Multivuelta (Matriz Acumulativa Soberana en Backend)
> Queda **estrictamente prohibido delegar la responsabilidad del estado acumulado al cliente** a través del DTO. Confiar el progreso de la matriz a la PWA expone el sistema a manipulaciones, desincronización y trampas termodinámicas.  
> - El `TriageInputUseCase` utiliza el `sessionId` (`bx_session_id` UUID v4 inyectado por el Edge Middleware) para recuperar el estado previo de la matriz de densidad directamente desde la capa de persistencia del backend (`DensityMatrixRepositoryPort`).
> - Jev AI evalúa el nuevo prompt, el caso de uso fusiona las variables detectadas con el estado previo recuperado, persiste el nuevo progreso en el backend, calcula la suma de pesos y emite el dictamen (Repregunta o Despacho).
> - El DTO de entrada `TriageInputDto` solo contiene el `prompt` actual y el `sessionId`.

### 2.3. El Peaje Termodinámico: Matriz de Densidad Polimórfica (HU 6)
La evaluación de completitud se rige por el Catálogo de Matrices de Densidad tipado con Zod (`src/domain/schemas/matrix.ts`):
- En la matriz base (`default` - Exploración Urbana General):
  - `survival_threshold`: **60%**.
  - `time_window`: **60%** (Vector de Supervivencia Crítico y bloqueante).
  - `group`: **15%** (tamaño de grupo y tipología).
  - `vibe`: **15%** (atmósfera: nocturna, cultural, relajada).
  - `constraints`: **10%** (presupuesto, restricciones de movilidad o dieta).
- **Lógica de Desbloqueo**:
  - Si $\sum \text{pesos} \ge 60\%$: Matriz saturada. Despacho interno a Gemini y limpieza del estado temporal en la sesión.
  - Si $\sum \text{pesos} < 60\%$: Persistencia en el backend del progreso parcial y formulación de repregunta atómica orientada a la variable con mayor peso faltante.

> ### Laudo 3: Anclaje Perimetral y Localización en Barcelona (Integración HU-PERIM-GEO-001)
> Se decreta el anclaje perimetral irrestricto de la Aduana Universal al término municipal de Barcelona y su infraestructura de acceso:
> 1. **10 Distritos Canónicos**: Se reconocen y extraen automáticamente los 10 distritos oficiales: *Ciutat Vella, Eixample, Sants-Montjuïc, Les Corts, Sarrià-Sant Gervasi, Gràcia, Horta-Guinardó, Nou Barris, Sant Andreu, Sant Martí*. Estos distritos enriquecen la matriz de densidad (`districts`) y el prompt despachado al orquestador pesado.
> 2. **Nodos Periurbanos Autorizados (Micro-Logística de Última Milla)**: Se toleran exclusivamente nodos de acceso y transporte periférico (*Aeropuerto Josep Tarradellas Barcelona-El Prat, Port de Barcelona - Terminales de Cruceros, Estació d’El Prat*). Cualquier otra entidad turística externa activa rebote inmediato.
> 3. **Bounding Box GPS**: Se valida la geolocalización del dispositivo dentro del cuadrante $[41.317, 41.468]\text{N}, [2.052, 2.235]\text{E}$. Si el GPS está fuera del perímetro, solo se admite la petición si el prompt explicita una intención de viaje/planificación hacia Barcelona. De lo contrario, se emite un rebote táctico inmediato sin consumo de cuota de LLM.
> 4. **Enriquecimiento Espacial del Despacho**: La petición enviada a Gemini inyecta de forma inmutable la geolocalización detectada: `[Geo: Barcelona | Distritos: <distritos> | GPS: <lat,lng>]`.

---

## 3. Componentes Arquitectónicos, Diagramas y Contratos de Código

### 3.1. Coreografía de Estados en la Aduana Universal (Unificada)

```mermaid
flowchart TD
    A[UI / PWA: Prompt + Cookie bx_session_id] --> B[Endpoint Único: POST /api/triage]
    
    B --> C[TriageInputUseCase]
    C --> D[(DensityMatrixRepositoryPort\nRecuperar estado previo de la sesión)]
    
    C --> E[ITypedDecisionEngine - Jev AI\nPOST /api/v1/systemone\nState: { UUID, Prompt, Accumulated }]
    
    E --> F{¿Perímetro Válido BCN?\nNoul is_barcelona_scope >= 0.5}
    
    %% Flujo 1: Rebote Geográfico
    F -->|Falso: Fuera de Alcance| G[IConversationalSLMPort - Groq\nPrompt: 'Rebote empático en 1 frase']
    G --> H[Retorno HTTP 422 a UI < 200ms\nStatus: REBOUND_OUT_OF_SCOPE]
    
    %% Flujo 2: Evaluación de Matriz
    F -->|Verdadero: En Perímetro| I[Fusión de Variables Detectadas + Estado Previo\nCálculo Termodinámico de Pesos]
    
    I --> J{¿Suma >= survival_threshold?\nDefault: >= 60%}
    
    %% Flujo 2A: Repregunta Atómica
    J -->|No: Matriz Incompleta| K[(Guardar estado fusionado en Backend)]
    K --> L[IConversationalSLMPort - Groq\nPrompt: 'Repregunta orgánica sin interrogatorio']
    L --> M[Retorno HTTP 200 a UI\nStatus: INCOMPLETE_REPROMPT\nSin exponer payload al cliente]
    
    %% Flujo 2B: Despacho Directo S+ Grade (Laudo 1)
    J -->|Sí: Umbral Satisfecho| N[Despacho Interno: GenerateTacticalRouteUseCase\nGemini 1.5 Flash / Pro + LanceDB]
    N --> O[(Limpiar estado de matriz en sesión)]
    O --> P[Retorno HTTP 200 a UI con Ruta Forjada\nStatus: DISPATCH_READY\nroute: TacticalRoute]
```

### 3.2. Estructura de Capas en el Monolito (Clean Architecture / Hexagonal)

```
src/
├── domain/
│   ├── schemas/
│   │   ├── matrix.ts                              # Catálogo, Envelope y reglas de la Matriz de Densidad
│   │   └── triage.schema.ts                       # DTOs Zod estrictos (Sin accumulatedPayload en cliente)
│   └── value-objects/
│       └── triage-outcome.vo.ts                   # Value Object inmutable con soporte de route forjada
├── application/
│   ├── ports/
│   │   ├── in/
│   │   │   └── triage-input.use-case.port.ts      # Puerto de entrada del caso de uso
│   │   └── out/
│   │       ├── ITypedDecisionEngine.ts            # Puerto System One (evaluateNoul + evaluateChoice)
│   │       ├── conversational-slm.port.ts         # Puerto System Two Ligero (Groq SLM)
│   │       ├── density-matrix-repository.port.ts  # Puerto de persistencia de estado de sesión (Laudo 2)
│   │       └── telemetry-repository.port.ts       # Puerto de persistencia de telemetría
│   └── use-cases/
│       ├── triage-input.use-case.ts               # Orquestador del Triaje Entrópico (Laudos 1 y 2)
│       └── generate-tactical-route.use-case.ts    # Orquestador pesado de forja de rutas tácticas
├── infrastructure/
│   ├── ai/
│   │   ├── jev/
│   │   │   ├── jevClient.ts                       # Implementación de evaluateNoul y evaluateChoice
│   │   │   └── types.ts                           # Esquemas Zod de wire protocol Jev
│   │   └── groq/
│   │       ├── groq-conversational-slm.adapter.ts # Adaptador de inferencia rápida Groq
│   │       └── prompts/
│   │           └── conversational-reprompt.prompt.ts # Prompts de repregunta atómica y rebote
│   └── repositories/
│       ├── in-memory-density-matrix.repository.ts # Repositorio de estado de matriz de sesión (Laudo 2)
│       └── prisma-telemetry.repository.ts         # Repositorio de telemetría
└── app/
    └── api/
        └── triage/
            └── route.ts                           # Endpoint Único Frontal con despacho interno a Gemini
```

### 3.3. Contratos de Código Clave

#### DTO de Entrada Estricto (`src/domain/schemas/triage.schema.ts`)
```typescript
export const UserGpsLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const TriageInputSchema = z.object({
  sessionId: z.string().min(1, 'sessionId es requerido'),
  prompt: z.string().min(1, 'El prompt no puede estar vacío'),
  matrixId: z.string().default('default'),
  userLocation: UserGpsLocationSchema.optional(),
});

export type TriageInputDto = z.infer<typeof TriageInputSchema>;
```

#### DTO de Salida Estructurado (`src/domain/schemas/triage.schema.ts`)
```typescript
export const TriageOutcomeDtoSchema = z.object({
  status: TriageStatusSchema,
  sessionId: z.string(),
  matrixId: z.string(),
  score: z.number().min(0).max(100),
  survivalThreshold: z.number().min(0).max(100),
  isThresholdSatisfied: z.boolean(),
  bounceMessage: z.string().optional(),
  repromptMessage: z.string().optional(),
  missingVariable: z.string().optional(),
  rejectedEntity: z.string().optional(),
  detectedDistricts: z.array(z.string()).optional(),
  payload: DefaultDensityPayloadSchema.optional(),
  route: z.unknown().optional(),
  durationMs: z.number(),
});
```

#### Puerto de Persistencia de Estado (`src/application/ports/out/density-matrix-repository.port.ts`)
```typescript
export interface DensityMatrixRepositoryPort {
  getMatrixPayload(sessionId: string, matrixId: string): Promise<DefaultDensityPayload | null>;
  saveMatrixPayload(sessionId: string, matrixId: string, payload: DefaultDensityPayload): Promise<void>;
  clearMatrixPayload(sessionId: string, matrixId?: string): Promise<void>;
}
```

---

## 4. Estrategia de Pruebas Automatizadas (Vitest - Filtro Empírico)

### Catálogo de Casos de Prueba Implementados

| Suite | Identificador | Condición de Entrada | Comportamiento Esperado | Aserción Crítica |
| :--- | :--- | :--- | :--- | :--- |
| **Dominio** | `TC-TRIAGE-01` | Payload con `time_window` en matriz `default`. | Suma de pesos alcanza 60% ($\ge 60$). | `isThresholdSatisfied === true`, `score === 60`. |
| **Dominio** | `TC-TRIAGE-02` | Payload con solo `vibe` y `group_size`. | Suma de pesos alcanza 30% ($< 60$). | `isThresholdSatisfied === false`, `highestMissing === 'time_window'`. |
| **Infra/Jev** | `TC-TRIAGE-03` | Mock HTTP 200 de `/v1/systemone` con tipo `choice`. | `evaluateChoice` parsea con Zod sin `any`. | `result.selectedChoice` válido, `confidence >= 0`. |
| **Infra/Jev** | `TC-TRIAGE-04` | Invocación exitosa a `evaluateChoice`. | Registra telemetría bajo `LLM_ENGINE` con nivel `INFO`. | `telemetryRepo.log` invocado con código 200. |
| **Infra/Groq** | `TC-TRIAGE-05` | Petición de repregunta con `missingVariable: 'time_window'`. | Sintetiza pregunta natural sin formato policial. | Retorna string con longitud $> 10$ sin bloquear. |
| **Caso de Uso** | `TC-TRIAGE-06` | Prompt fuera de perímetro ("Restaurantes en Girona"). | Jev retorna `noul < 0.5`, se activa rebote táctico. | `outcome.status === 'REBOUND_OUT_OF_SCOPE'`, aborto rápido. |
| **Caso de Uso** | `TC-TRIAGE-07` | Prompt en BCN sin tiempo ("Ruta con amigos por Gràcia"). | Guarda estado en backend y solicita repregunta (Laudo 2). | `matrixRepo.getMatrixPayload` contiene `vibe`, repregunta activa. |
| **Caso de Uso** | `TC-TRIAGE-08` | Prompt en BCN completo ("4 horas por el Gótico para 2"). | Supera el 60%, despacha internamente a Gemini (Laudo 1). | `routeUseCase.execute` invocado, `outcome.route` presente. |
| **Caso de Uso** | `TC-TRIAGE-09` | Error de red o timeout en Jev AI. | Aplica política Fail-Soft `Assume-Barcelona-Default`. | `outcome.status !== 'ERROR'`, no propaga excepción 500. |
| **E2E Live** | `TC-TRIAGE-10` | Ejecución real contra API de Jev AI y Groq. | Evalúa Noul/Choice y genera repregunta en vivo. | Status esperado y tiempo de respuesta $< 1500$ ms. |
| **UI** | `TC-TRIAGE-11` | Interacción en `OrchestratorPage` contra `/api/triage`. | Transición fluida de fases con chispa y ruta final. | Desmantelamiento de endpoints viejos verificado. |
| **Localización** | `TC-TRIAGE-12` | Prompt menciona distrito canónico ("Gràcia"). | Extrae distrito canónico, enriquece matriz y prompt Gemini. | `outcome.detectedDistricts` contiene `'Gràcia'`. |
| **Localización** | `TC-TRIAGE-13` | Nodo logístico periurbano ("Aeropuerto de El Prat"). | Reconoce micro-logística permitida, no emite rebote. | En scope con `outcome.detectedDistricts` correcto. |
| **Localización** | `TC-TRIAGE-14` | GPS dentro del Bounding Box de Barcelona. | Valida coordenadas e inyecta en el prompt de despacho. | Prompt incluye `| GPS: 41.3851,2.1734`. |
| **Localización** | `TC-TRIAGE-15` | GPS fuera de Bounding Box con prompt genérico vs explícito. | Rebote si es genérico; admisión si planifica viaje a Barcelona. | Rebote con `'Ubicación GPS fuera de perímetro'` si genérico. |

---

## 5. Criterios de Aceptación (Verificación Empírica - Gherkin S+ Grade)

### Escenario 1: Bloqueo Táctico de Petición Fuera de Perímetro
```gherkin
Dado un prompt como "Recomiéndame los mejores restaurantes de Girona"
Y una cabecera con cookie de sesión bx_session_id válida
Cuando el usuario envía la consulta al endpoint único /api/triage
Entonces Jev resuelve la evaluación Noul is_barcelona_scope con probabilidad < 0.5
Y el SLM rápido emite una respuesta amable restringiendo el radar exclusivamente a Barcelona
Y el endpoint retorna en < 200 ms con HTTP 422 y status REBOUND_OUT_OF_SCOPE
Y se omite por completo cualquier invocación a Gemini o almacenamiento en LanceDB.
```

### Escenario 2: Repregunta Atómica y Gobernanza Backend del Estado (Laudo 2)
```gherkin
Dado un prompt perimetralmente válido pero carente de tiempo ("Quiero ver arquitectura modernista con amigos")
Y un UUID de sesión efímera bx_session_id
Cuando el usuario envía la consulta al endpoint único /api/triage
Entonces el caso de uso recupera el estado previo del backend y fusiona las nuevas variables
Y Jev detecta que la matriz no supera el umbral del 60%, faltando time_window
Y el sistema persiste de forma soberana el estado parcial en el repositorio del backend
Y el SLM rápido formula una repregunta contextual orientada al tiempo disponible
Y el endpoint responde con HTTP 200, status INCOMPLETE_REPROMPT y sin exponer el payload al cliente.
```

### Escenario 3: Despacho Directo al Orquestador Pesado (Laudo 1)
```gherkin
Dado un usuario con estado previo acumulado que envía "Tenemos 4 horas libres esta tarde"
Cuando el endpoint /api/triage procesa la petición con el mismo bx_session_id
Entonces el backend fusiona la variable temporal con el estado previo alcanzando el 90% de saturación
Y el backend despacha internamente la ejecución hacia Gemini forjando la ruta táctica completa
Y el sistema purga la memoria temporal de la matriz en la sesión
Y la petición HTTP retorna un código 200 con status DISPATCH_READY y el objeto route completo en la misma llamada.
```

### Escenario 4: Anclaje de Distritos Canónicos y Excepciones Periurbanas (Laudo 3)
```gherkin
Dado un prompt perimetral como "Ruta de 3 horas por Gràcia buscando tapas para 2 personas"
O un prompt de tránsito como "Llegando al Aeropuerto de El Prat con 2 horas libres"
Cuando la Aduana Universal evalúa la petición
Entonces el motor reconoce el distrito canónico de Barcelona o la excepción periurbana de transporte
Y el sistema inyecta la localización en el vector districts de la matriz de densidad
Y el prompt despachado a Gemini se enriquece inmutablemente con "[Geo: Barcelona | Distritos: ...]"
Y la petición no es rebotada.
```

### Escenario 5: Validación GPS de Bounding Box y Planificación Remota (Laudo 3)
```gherkin
Dado un explorador con coordenadas GPS fuera del Bounding Box de Barcelona ([41.317, 41.468], [2.052, 2.235])
Cuando envía una consulta genérica sin mención a Barcelona ("Quiero un café cerca")
Entonces la Aduana Universal emite un rebote táctico con entidad rechazada "Ubicación GPS fuera de perímetro"
Pero si el explorador envía una consulta explícita hacia Barcelona ("Viajo a Barcelona mañana, ruta de 4h")
Entonces la Aduana admite la consulta como planificación remota legítima y despacha al orquestador.
```

---

## 6. Plan de Implementación Técnica (WBS) y Definición de Hecho (DoD)

### Estado de Tareas de Construcción

| ID | Capa | Tarea Técnica | Fichero Objetivo | Estatus |
| :--- | :--- | :--- | :--- | :--- |
| **T-TRIAGE-01** | Dominio | Esquemas Zod para la Matriz de Densidad Polimórfica y Catálogo | `src/domain/schemas/matrix.ts` | Completado |
| **T-TRIAGE-02** | Dominio | DTOs de entrada y salida estrictos (Laudos 1, 2 y 3) | `src/domain/schemas/triage.schema.ts` | Completado |
| **T-TRIAGE-03** | Dominio | Value Object inmutable `TriageOutcome` con soporte de ruta y geolocalización | `src/domain/value-objects/triage-outcome.vo.ts` | Completado |
| **T-TRIAGE-04** | Puertos | Extender `ITypedDecisionEngine` con firma `evaluateChoice` | `src/application/ports/out/ITypedDecisionEngine.ts` | Completado |
| **T-TRIAGE-05** | Puertos | Puerto de persistencia de estado de matriz `DensityMatrixRepositoryPort` | `src/application/ports/out/density-matrix-repository.port.ts` | Completado |
| **T-TRIAGE-06** | Puertos | Puerto de salida `IConversationalSLMPort` y puerto driver | `src/application/ports/out/conversational-slm.port.ts` | Completado |
| **T-TRIAGE-07** | Infraestructura | Implementar `evaluateChoice` en `JevClient` con Zod y telemetría | `src/infrastructure/ai/jev/jevClient.ts` | Completado |
| **T-TRIAGE-08** | Infraestructura | Repositorio `InMemoryDensityMatrixRepository` para gobernar estado multivuelta | `src/infrastructure/repositories/in-memory-density-matrix.repository.ts` | Completado |
| **T-TRIAGE-09** | Infraestructura | Adaptador `GroqConversationalSlmAdapter` y prompts | `src/infrastructure/ai/groq/groq-conversational-slm.adapter.ts` | Completado |
| **T-TRIAGE-10** | Aplicación | Orquestador `TriageInputUseCase` con Laudo 1, 2 y 3 (Anclaje Barcelona) | `src/application/use-cases/triage-input.use-case.ts` | Completado |
| **T-TRIAGE-11** | BFF / API | Endpoint Único `/api/triage/route.ts` y desmantelamiento de rutas viejas | `src/app/api/triage/route.ts` | Completado |
| **T-TRIAGE-12** | Pruebas | Suite Vitest completa (Dominio, Infra, Caso de Uso, E2E y UI) | `tests/...` | Completado |
| **T-TRIAGE-13** | Dominio/App | Anclaje perimetral geográfico de Barcelona, distritos canónicos y GPS Bounding Box | `src/application/use-cases/triage-input.use-case.ts` | Completado |

### Definición de Hecho (Definition of Done)
- [x] **DoD-1**: `npx tsc --noEmit` compila con código de salida 0, sin advertencias ni ocurrencias del tipo `any`.
- [x] **DoD-2**: Cobertura completa en Vitest de todos los casos de prueba unitarios con aserciones rigurosas para rebote perimetral, repregunta atómica y despacho directo.
- [x] **DoD-3**: Pruebas E2E en vivo superadas exitosamente contra los servicios upstream de Jev AI y Groq.
- [x] **DoD-4**: Resiliencia perimetral Fail-Soft demostrada ante indisponibilidad simulada de upstream.
- [x] **DoD-5**: Laudo 1 cumplido: `/api/triage` consolidado como punto único frontal, orquestador pesado integrado internamente y `/api/orchestrator/fast|slow` desmantelados.
- [x] **DoD-6**: Laudo 2 cumplido: `accumulatedPayload` erradicado del frontend; estado multivuelta gobernado soberanamente en backend mediante `DensityMatrixRepositoryPort` y `bx_session_id`.
- [x] **DoD-7**: La especificación de HU-CORE-TRIAGE-002 cumple formalmente la Certificación S+ Grade y queda guardada en el repositorio.
- [x] **DoD-8**: Laudo 3 cumplido: Anclaje geográfico estricto a Barcelona (10 distritos canónicos, excepciones periurbanas de transporte, Bounding Box GPS y enriquecimiento espacial de la matriz y despacho) verificado con pruebas automatizadas dedicadas.