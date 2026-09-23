Historia de Usuario 2: Aduana Universal y Triaje Entrópico con Jev y SLM RápidoIdentificador: HU-CORE-TRIAGE-002Estatus: Listo para ImplementaciónEntorno: Next.js App Router (src/application/use-cases/)   Componente: Aduana Universal / Módulo 3   1. Descripción GeneralComo Turista interactuando con la PWA de BarcelonaXplorer,   Quiero que el sistema evalúe mis peticiones en lenguaje natural de forma instantánea mediante la combinación de decisiones tipadas y generación contextual ligera,   Para recibir respuestas inmediatas si mi consulta excede el perímetro de Barcelona o le faltan variables críticas, evitando la latencia y el coste computacional del orquestador pesado.   2. Componentes Arquitectónicos y Flujo Operativo2.1. Arquitectura de Casos de UsoPlaintextsrc/application/
├── ports/
│   ├── in/
│   │   └── ITriageInputUseCase.ts           # Interfaz de entrada del triaje
│   └── out/
│       ├── ITypedDecisionEngine.ts          # Puerto Jev (System One)
│       └── IConversationalSLM.ts            # Puerto SLM (System Two ligero)
└── use-cases/
    └── TriageInputUseCase.ts                # Orquestador del triaje entrópico
2.2. Coreografía de Estados en la Aduana[ Prompt del Usuario ] 
          │
          ▼
  TriageInputUseCase ──► JevClient.evaluate({
          │                is_barcelona_scope: Primitive.Noul,
          │                detected_intent: Primitive.Choice,
          │                missing_variables: Primitive.Choice[]
          │              })
          │
    ┌─────┴────────────────────────────────────────────────┐
    ▼                                                      ▼
[ Fallo de Alcance o Intención ]               [ Perímetro Válido BCN ]
    │                                                      │
    ▼                                                      ▼
SLM Rápido (Prompt microscópico)               ¿Matriz saturada (>= Umbral)?
"Redacta rebote empático en 1 frase"                       │
    │                                            ┌─────────┴─────────┐
    ▼                                            ▼                   ▼
Retorno inmediato a UI                     [ Sí: 100% ]        [ No: Incompleta ]
                                                 │                   │
                                                 │                   ▼
                                                 │         SLM Rápido (Repregunta)
                                                 │         "Solicita solo la variable X"
                                                 ▼                   │
                                      Inyección a LanceDB            ▼
                                      y Orquestador Pesado    Retorno a UI
2.3. Blindaje de la Matriz de DensidadEvaluación System One (Jev): Retorna is_barcelona_scope con probabilidad calibrada y las variables identificadas mapeables a src/domain/schemas/matrix.ts.   Rebote Guiado: Si Jev determina que la consulta no pertenece a Barcelona, el SLM rápido recibe una directriz estricta con la causa técnica. El SLM no evalúa geografía, solo sintetiza la disculpa.   Completitud Progresiva: Si la suma de pesos no alcanza el survival_threshold, Jev señala la clave exacta omitida (ej. time_window), y el SLM formula una única repregunta conversacional sin formato de interrogatorio.   3. Criterios de Aceptación (Verificación Empírica)[ ] Escenario 1: Bloqueo de Petición Fuera de PerímetroDado un prompt como "Recomiéndame tres restaurantes en Girona".Cuando TriageInputUseCase ejecuta la evaluación con Jev.   Entonces Jev resuelve is_barcelona_scope = false en < 200 ms.   Y el SLM rápido emite una respuesta amable restringiendo el servicio a Barcelona sin invocar a Gemini ni a LanceDB.   [ ] Escenario 2: Extracción Directa a Matriz y Despacho RAGDado un prompt completo dentro de Barcelona ("Ruta de 4 horas por el Gótico para 2 personas, presupuesto medio").Cuando Jev evalúa el texto y satura las variables obligatorias de la matriz de exploración.   Entonces el caso de uso omite la intervención del SLM conversacional y transfiere directamente el payload tipado hacia LanceDB y el orquestador principal.   [ ] Escenario 3: Repregunta Atómica por Umbral InsuficienteDado un prompt válido pero carente de tiempo ("Quiero ver arquitectura modernista con amigos").Cuando Jev detecta que la matriz no supera el umbral y marca missing_variable: "time_window".   Entonces el SLM formula únicamente una repregunta contextual orientada a resolver el tiempo disponible, manteniendo el estado de sesión sin bloquear al usuario.
