# [ARQUITECTURA] Historia de Usuario 6: Matriz de Densidad Polimórfica y Umbral Operativo (El Peaje Termodinámico)

- **Estatus:** Refinado / Ratificado con Estado del Código
- **Fecha de Revisión:** 2026-09-26
- **Módulo:** `src/features/planner/` (Matriz y Reglas), `src/features/triage/` (Aduana Universal) y `src/features/cognitive-memory/` (Persistencia Vectorial)
- **Marco Normativo:** [AGENTS.md (Protocolo de Acero S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/AGENTS.md) · [ADR-001 (Vertical Slicing)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [CONSTITUTION.md](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md)

---

## 1. Descripción General

**Como** Arquitecto de Software y guardián de la integridad lógica y cognitiva de BarcelonaXplorer,  
**Quiero** estructurar la extracción de información del usuario mediante un Catálogo de Matrices de Densidad Polimórficas (Patrón Registry y Envelope) gobernado por esquemas estrictos Zod, con reglas termodinámicas descentralizadas por matriz (pesos específicos por variable y umbral de supervivencia `survival_threshold`),  
**Para** garantizar que el motor principal (LLM) no alucine por falta de contexto operativo ni se despachen peticiones inviables, permitiendo a la Aduana Universal (SLM) priorizar atómicamente la variable faltante de mayor peso y a la interfaz de usuario (medidor térmico y botón de acción) reaccionar de forma completamente agnóstica sin acoplarse a reglas rígidas en el frontend, manteniendo el sistema abierto a nuevas matrices temáticas sin alterar la base de datos vectorial ni el motor de enrutamiento.

---

## 2. Justificación Arquitectónica y Principios de Forja

### 2.1. Localidad de Comportamiento y Vertical Slicing (Axioma I & ADR-001)
Históricamente, la matriz se proyectaba sobre una capa dispersa (`src/domain/schemas/matrix.ts`). Conforme al [ADR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md), la totalidad de las reglas, esquemas y evaluadores residen agrupados en [`src/features/planner/matrix.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.ts) con sus pruebas unitarias colocadas en [`src/features/planner/matrix.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.test.ts). Cualquier modificación atómica de las reglas de densidad se confina a $\le 3$ archivos adyacentes.

### 2.2. Tolerancia Cero a la Inferencia y Parse, Don't Validate (Axioma II)
Queda prohibido el uso de tipos `any`, aserciones ciegas (`!`) o validaciones heurísticas no tipadas. Toda entrada de usuario (`unknown`) se valida en la frontera con **Zod** (`TriageInputSchema`, `DefaultDensityPayloadSchema`, `DensityMatrixEnvelopeSchema`). Si el dato no satisface la frontera formal, se rechaza o se sanitiza de forma determinista antes de alcanzar el cómputo de densidad.

### 2.3. Principio de Abierto/Cerrado (OCP) y Diseño Declarativo (Axioma III)
El umbral de supervivencia (ej. 60%) y la ponderación de las variables no están cableados en la UI ni en condicionales imperativos (`if/else`) del backend. Cada matriz encierra su propio objeto `rules` dentro del registro central `DENSITY_MATRIX_REGISTRY`. Añadir una nueva matriz (ej. `"gastronomy"` con umbral al 70% donde el tamaño de grupo pese 50% y el tiempo 20%) solo requiere una entrada declarativa adicional en el catálogo, sin modificar la lógica del cálculo ni los componentes visuales.

### 2.4. Peaje Termodinámico y Fricción Cero
El Filtro A (Lógica Férrea) establece que para la matriz de exploración general (`"default"`), la **Ventana Temporal (`time_window`)** constituye el parámetro de supervivencia bloqueante con peso del **60%**. Sin conocer el tiempo disponible, la física de cruzar distancias geográficas con horarios de apertura de Barcelona es inviable. Con solo fijar el tiempo, el sistema alcanza el umbral de supervivencia (60% $\ge$ 60%) y activa el principio de **Fricción Cero**, habilitando la generación inmediata de la ruta asumiendo valores predeterminados para las variables accesorias.

---

## 3. Coreografía de Contratos, Evaluación y Memoria Vectorial

### 3.1. Contrato Declarativo Zod y Envelope
En [`src/features/planner/matrix.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.ts):

- **`MatrixRuleSetSchema`**: Define el conjunto de reglas termodinámicas:
  - `survival_threshold`: Número entero entre 0 y 100.
  - `weights`: Diccionario de claves tipadas (`Record<string, number>`) con el porcentaje asignado a cada campo.
- **`DefaultDensityPayloadSchema`**: Define la carga útil para la matriz `"default"`:
  - `time_window`: `z.string().optional()`
  - `group_size`: `z.number().int().positive().optional()`
  - `vibe`: `z.string().optional()`
  - `mood`: `z.enum(['relaxed', 'adventurous', 'cultural', 'gastronomic']).optional()` (peso adaptativo 10)
  - `constraints`: `z.array(z.string()).optional().default([])`
  - `districts`: `z.array(z.string()).optional().default([])`
- **`DensityMatrixEnvelopeSchema`**: Patrón envoltorio canónico:
  - `matrix_id`: Identificador técnico (ej. `"default"`).
  - `name`: Nombre descriptivo (ej. `"Exploración Urbana Base"`).
  - `description`: Contexto semántico inyectado al LLM principal durante la fase de síntesis.
  - `rules`: Objeto `MatrixRuleSet`.
  - `payload`: Esquema tipado de datos.

### 3.2. Evaluación Termodinámica Pura (`calculateMatrixDensity`)
La función pura `calculateMatrixDensity(matrixId, payload): MatrixDensityEvaluation` opera determinísticamente:
1. Resuelve la matriz desde `DENSITY_MATRIX_REGISTRY[matrixId]`.
2. Ordena las variables por peso descendente.
3. Evalúa la presencia y no vaciedad de cada variable en el payload, acumulando el puntaje (`totalScore`).
4. Asimila variables adaptativas (ej. `mood` con peso 10 si está presente).
5. Normaliza el puntaje a $[0, 100]$.
6. Determina `isThresholdSatisfied = score >= survival_threshold`.
7. Aísla `highestMissingVariable`: la primera variable faltante en el orden de mayor impacto porcentual.

### 3.3. Intercepción en la Aduana Universal (`TriageInputUseCase`)
En [`src/features/triage/triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts):
- Si `isThresholdSatisfied === false`: Persiste el estado acumulado en `DensityMatrixRepositoryPort` por sesión (`sessionId`), invoca al SLM para emitir una **repregunta atómica** dirigida exclusivamente hacia `highestMissingVariable` y retorna un `TriageOutcome.createIncompleteReprompt`.
- Si `isThresholdSatisfied === true`: Persiste la matriz, emite telemetría y desbloquea el despacho hacia la generación de itinerario (`GenerateTacticalRouteUseCase`).

### 3.4. Anclaje en Memoria Cognitiva Vectorial (`DenseSemanticMatrix` en LanceDB)
El payload validado no se vierte en texto crudo en la base de datos vectorial. El Value Object inmutable [`DenseSemanticMatrix`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/dense-semantic-matrix.vo.ts):
- Genera una representación sintética ultra-densa mediante `toDensePromptString()` ($\le 45$ tokens):  
  `[Grupo: 4 personas | Ventana: todo el sábado | Vibe: modernismo | Distritos: Eixample | Restricciones: sin gluten]`
- Serializa a diccionario plano Arrow para LanceDB vía `toMetadata()`, indexando `sessionId`, `matrixId`, `score`, `survivalThreshold` y `updatedAt`.
- Reconstruye el payload tipado mediante `toPayload()` para la recuperación RAG silenciosa multivuelta.

---

## 4. Criterios de Aceptación (Verificación Empírica Gherkin S+ Grade)

### Escenario 1: Blindaje del Dominio y Erradicación de Any (Axioma II & IV)
- **Dado** el módulo [`src/features/planner/matrix.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.ts).
- **Cuando** se ejecuta la validación estática con `tsc --noEmit` y el linter AST sobre el módulo.
- **Entonces** el compilador concluye con código de salida 0 sin aserciones ciegas (`any` o `as any`).
- **Y** el esquema `DensityMatrixEnvelopeSchema.safeParse()` rechaza cualquier objeto que omita `matrix_id`, `name`, `description`, `rules` o contenga un payload incompatible con `DefaultDensityPayloadSchema`.

### Escenario 2: Desbloqueo del Umbral y Fricción Cero en Matriz Base
- **Dado** un usuario que interactúa con la Aduana Universal bajo la matriz `"default"` (`survival_threshold: 60`).
- **Cuando** el usuario proporciona únicamente la variable de supervivencia: `"Tengo 4 horas por la tarde"` (`time_window: '4 horas por la tarde'`).
- **Entonces** `calculateMatrixDensity('default', payload)` calcula exactamente un `score: 60`.
- **Y** `isThresholdSatisfied` se evalúa como `true`.
- **Y** la Aduana Universal desbloquea la generación de ruta, informando al usuario que la ruta puede forjarse inmediatamente o ser enriquecida opcionalmente con acompañantes o preferencias.

### Escenario 3: Bloqueo de Supervivencia y Repregunta Atómica Orientada por Peso
- **Dado** un usuario que inicia el diálogo indicando únicamente detalles accesorios: `"Somos 3 personas y queremos ver modernismo"` (`group_size: 3`, `vibe: 'modernismo'`).
- **Cuando** se evalúa la densidad del payload (`group_size: 15%` + `vibe: 15%` = `30%`).
- **Entonces** `score: 30` resulta estrictamente menor que `survival_threshold: 60`.
- **Y** `isThresholdSatisfied` se evalúa como `false`.
- **Y** `highestMissingVariable` devuelve con exactitud `'time_window'` (peso 60).
- **Y** el SLM intercepta la conversación sin disparar el generador pesado, repreguntando de forma atómica y precisa por el tiempo disponible: *"Plan modernista para tres. Para calibrar los traslados y accesos, ¿de cuántas horas o en qué franja horaria disponéis?"*.

### Escenario 4: Saturación Táctica y Participación Adaptativa de Mood
- **Dado** un usuario que completa todos los parámetros de la matriz `"default"`: `time_window`, `group_size`, `vibe`, `constraints` y añade el parámetro adaptativo `mood: 'cultural'`.
- **Cuando** se ejecuta `calculateMatrixDensity('default', payload)`.
- **Entonces** el `score` alcanza el tope máximo normalizado de `100`.
- **Y** `missingVariables` es un array vacío y `highestMissingVariable` es `null`.
- **Y** el payload resultante habilita la inyección de recompensas tácticas en el itinerario.

### Escenario 5: Persistencia Vectorial Inmutable y Recuperación RAG Silenciosa
- **Dado** un payload validado correspondiente a una sesión activa (`bx_session_id`).
- **Cuando** se instancia el Value Object `DenseSemanticMatrix.create({ sessionId, matrixId: 'default', payload, score })`.
- **Entonces** `toDensePromptString()` produce una cadena sintética compacta $\le 45$ tokens con formato canónico `[Grupo: ... | Ventana: ... | ...]`.
- **Y** `toMetadata()` expone los campos indexables compatibles con Apache Arrow para su persistencia en LanceDB.
- **Y** ante un nuevo turno donde el borrador en memoria esté ausente, `TriageInputUseCase` rescata la entidad desde `cognitiveMemory.getLatestSessionMemory()` y restaura el payload previo mediante `toPayload()`.

### Escenario 6: Desacoplamiento Agnóstico de la Capa Visual (UI Medidor Térmico)
- **Dado** el componente cliente del Medidor Térmico ([HU-8](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%208%20%28Refinada%29:%20Gamificaci%C3%B3n%20Sensorial%20y%20Medidor%20T%C3%A9rmico%20Agn%C3%B3stico%20%28UI-UX%29.md)).
- **Cuando** recibe el resultado de la evaluación termodinámica (`MatrixDensityEvaluation`).
- **Entonces** el componente no ejecuta cálculos condicionales específicos de la matriz activa.
- **Y** conmuta su estado visual (Inerte si `score < survivalThreshold`, Desbloqueo si `isThresholdSatisfied === true`, Saturación si `score === 100`) basándose únicamente en las propiedades numéricas del contrato determinista.

---

## 5. Fricción de Acero (Red Teaming / Puntos Críticos Detectados)

Sometiendo la especificación a la forja del **Protocolo de Acero (S+ Grade)**, se aíslan tres vectores de fragilidad operativa que deben asegurarse de manera innegociable en la implementación física:

### 5.1. Manejo de Reentrancia en LanceDB y Límites de Payload
- **Fricción:** `toDensePromptString()` establece una cota de diseño de $\le 45$ tokens. Si el usuario suministra descripciones extensas en `vibe` (ej. párrafos conversacionales prolijos) o arrays sobredimensionados en `constraints` o `districts`, el límite de tokens puede ser superado de forma imprevista, degradando la compresión de contexto en LanceDB.
- **Directriz Operativa:** El Value Object inmutable [`DenseSemanticMatrix`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/dense-semantic-matrix.vo.ts) debe incorporar truncamiento y compactación sintáctica estricta sobre los campos accesorios (ej. límite de caracteres por cadena y truncamiento de arrays a $N \le 5$ elementos esenciales) antes de emitir la cadena densa o serializar hacia LanceDB.

### 5.2. Sincronización Bidireccional y Transición entre Matrices Dinámicas
- **Fricción:** La historia asume `"default"` como matriz de arranque. Si en el turno 2 la Aduana detecta una intención hiper-específica (ej. cambio radical hacia `"gastronomy"`), una mezcla descuidada de payloads podría heredar restricciones o supuestos incompatibles o dejar variables huérfanas en el estado de sesión.
- **Directriz Operativa:** El flujo de triaje en [`TriageInputUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts) debe orquestar una migración limpia: las variables universales (`time_window`, `group_size`, `districts`) se preservan de forma segura, mientras que las variables tácticas exclusivas de la matriz previa deben ser depuradas o revalidadas contra el esquema Zod de la nueva matriz activa para erradicar cualquier contaminación cruzada.

### 5.3. Salvaguarda Contra Regresión de Deuda Técnica y Linter AST (Axioma II & IV)
- **Fricción:** El informe de auditoría histórica `c82b741` evidenció 85 advertencias de linter en el repositorio (focalizadas en `ai-engine/` y `planner/`), las cuales fueron saneadas integralmente mediante [`PBI-OPS-LINT-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Saneamiento%20Integral%20de%20Linter%20AST%20y%20Erradicaci%C3%B3n%20de%20Any.md). Existe el riesgo de que nuevas extensiones de matrices o pruebas mockeadas reintroduzcan aserciones ciegas (`any`).
- **Directriz Operativa:** La ratificación e implementación de este PBI actúa como barrera de calidad permanente: queda estrictamente prohibida la incorporación de `any` o `as any` en [`matrix.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.test.ts) o en cualquier fixture de prueba. Todo mock de infraestructura o repositorios debe tiparse con precisión mediante las firmas de Vitest y las entidades y puertos canónicos.

---

## 6. Trazabilidad con la Suite de Pruebas Automatizadas

La presente historia de usuario cuenta con verificación empírica automatizada en el árbol de pruebas de Vitest:

| Caso de Prueba | Ubicación de Test Colocated | Propósito de Verificación |
|---|---|---|
| `TC-TRIAGE-01` | [`src/features/planner/matrix.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.test.ts) | Verificación del 60% por `time_window` y satisfacción del umbral en matriz `default`. |
| `TC-TRIAGE-02` | [`src/features/planner/matrix.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.test.ts) | Detección de umbral insuficiente (30%) e identificación de `time_window` como `highestMissingVariable`. |
| `TC-TRIAGE-03` | [`src/features/planner/matrix.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.test.ts) | Saturación al 100% y ausencia de variables faltantes. |
| `TC-TRIAGE-04` | [`src/features/planner/matrix.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.test.ts) | Validación estricta de `DensityMatrixEnvelopeSchema` y `DefaultDensityPayloadSchema`. |
| `TC-COGMEM-01` | [`src/features/cognitive-memory/dense-semantic-matrix.vo.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/dense-semantic-matrix.vo.test.ts) | Validación de inmutabilidad, generación de `toDensePromptString()` y persistencia Arrow en LanceDB. |
| `TC-TRIAGE-USECASE` | [`src/features/triage/triage.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.test.ts) | Orquestación completa de triaje, repregunta atómica y despacho hacia el generador de rutas. |
