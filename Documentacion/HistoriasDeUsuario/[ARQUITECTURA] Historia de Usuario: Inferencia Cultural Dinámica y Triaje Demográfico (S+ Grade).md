---
document_id: HU-ARCH-CULT-001
title: "[ARQUITECTURA] Inferencia Cultural Dinámica y Triaje Demográfico (S+ Grade)"
format: markdown
version: "2.0.0"
created: "2026-09-26"
revised: "2026-10-04"
status: "en refinamiento"
priority: media
process: feature
author: "Operador Técnico / Arquitectura BarcelonaXplorer"
related:
  - src/features/triage/triage-input.use-case.ts
  - src/features/triage/triage.schema.ts
  - src/features/planner/matrix.ts
  - src/features/cognitive-memory/dense-semantic-matrix.vo.ts
  - src/features/cognitive-memory/cognitive-memory-metadata.schema.ts
  - src/features/ai-engine/conversational-slm.port.ts
  - src/features/planner/generate-tactical-route.use-case.ts
  - src/prisma/schema.prisma
---

### [ARQUITECTURA] Inferencia Cultural Dinámica y Triaje Demográfico (S+ Grade)

#### Matriz de Indexación Tridimensional

- **Naturaleza:** Extracción conversacional acotada, memoria cognitiva (LanceDB) y adaptación narrativa en el orquestador pesado (Gemini).
- **Entorno:** Aduana Universal (`TriageInputUseCase`), SLM conversacional (Groq, `IConversationalSLMPort`), memoria vectorial LanceDB (`cognitive-memory`), orquestador Gemini (`GenerateTacticalRouteUseCase`).
- **Entropía asimilada:** Se rechaza la segmentación estática por nacionalidad. La base de datos relacional (MySQL/Prisma) permanece agnóstica a la procedencia; la adaptación cultural vive solo en la memoria de sesión y en la redacción que produce Gemini.

---

#### 1. Descripción General

**Como** Operador Técnico de BarcelonaXplorer,
**Quiero** que la Aduana Universal capture la procedencia del usuario **solo cuando él la declara explícitamente** en la conversación, la guarde en su memoria cognitiva de sesión (LanceDB) y la entregue a Gemini como marco de referencia narrativo,
**Para** que las descripciones y recomendaciones del itinerario usen comparaciones y advertencias útiles para ese visitante, **sin** alterar la logística de la ruta, **sin** estereotipar y **sin** crear variantes por nacionalidad en MySQL.

---

#### 2. Estado actual verificado (punto de partida)

Esta sección corrige supuestos de la versión 1.0 que no se correspondían con el código.

| Supuesto de la v1.0 | Realidad en el código |
|---|---|
| "El SLM extrae las variables de la matriz con un JSON tipado con Zod" | Las variables de `DefaultDensityPayload` se extraen con **regex deterministas** en `TriageInputUseCase.extractMatrixVariables`. El SLM Groq solo redacta rebotes, repreguntas, diálogo empático, saludos y detecta idioma. |
| "Ampliar el esquema JSON del triaje" | El único esquema JSON emitido por un LLM en el triaje es la sonda de Jev (`DensityPresenceProbeSchema`): cuatro booleanos `.strict()` con "ceguera conversacional". **No debe ampliarse** con la procedencia. |
| "El motor RAG ensambla el Template de MySQL (`GuideTemplate`, `TemplateItem`) con el contexto de LanceDB" | `GenerateTacticalRouteUseCase` **no consume plantillas**. Gemini recibe el prompt enriquecido (directiva de idioma, distritos, GPS, `DenseSemanticMatrix.toDensePromptString()`) más el contexto hiperlocal de `ContextSource`. Las plantillas solo se sirven por `/api/guides/*`. |
| "Gemini recibe una instrucción del sistema (System Prompt)" | `GeminiClient` concatena su prompt de sistema dentro de `contents`. La vía canónica para nuevas directivas es el prompt enriquecido, igual que `buildRouteLanguageDirective`. |
| "Matriz hiper-densa vinculada a `bx_session_id`" | Correcto: `bx_session_id` (cookie de `session-perimeter.ts`) es el `sessionId` de `DenseSemanticMatrix` y de `CognitiveMemoryMetadata`. |
| "Filtro A" y "Filtro C" | No están definidos en ningún documento ni en el código. Se eliminan y se sustituyen por los invariantes de la sección 4. |
| "Presupuesto" como variable del triaje | No existe una variable de presupuesto. Solo hay `constraints` (por ejemplo, `económico`). |

Las tablas `*Translation` de Prisma son variantes **por idioma** (HU 12), no por procedencia, y quedan fuera del alcance de esta HU.

---

#### 3. Alcance funcional

##### 3.1. Variable `cultural_origin`

- **Nombre único:** `cultural_origin` en `DefaultDensityPayload` (snake_case, como el resto del payload) y `culturalOrigin` en `DenseSemanticMatrix` y `CognitiveMemoryMetadataSchema` (camelCase, como el resto de esos contratos). Se descarta el alias `nationality`.
- **Semántica:** procedencia **declarada** por quien escribe (o por su grupo). No es nacionalidad legal, etnia ni idioma.
- **Tipo:** cadena opcional/nullable, normalizada (trim, espacios colapsados) y truncada a 48 caracteres, conservando la forma que usó el usuario (`"Japón"`, `"Buenos Aires"`).
- **Independencia del idioma:** `cultural_origin` **nunca** modifica `_sys_lang` ni la cookie `bx_lang`, y el idioma **nunca** se usa para deducir la procedencia (un usuario que escribe en inglés no es británico).

##### 3.2. Extracción con Ignorancia Activa

- El sistema **no pregunta** por la procedencia. `cultural_origin` no puede ser `missingVariable` ni disparar `INCOMPLETE_REPROMPT`.
- `cultural_origin` **no suma** a la puntuación de densidad ni modifica `survivalThreshold`.
- **Solo se captura con marcadores explícitos de identidad o procedencia del hablante** (por ejemplo, "soy de…", "somos argentinos", "venimos de Japón a pasar unos días").
- **Anclaje literal:** la extracción devuelve también la evidencia textual. Si la evidencia no aparece literalmente en el prompt, el valor se descarta y queda `null`. Así se bloquea la invención del modelo.
- **Mecanismo de extracción:** ver la decisión abierta D-1.

##### 3.3. Memoria cognitiva (LanceDB)

- `cultural_origin` se fusiona con el `priorPayload` de la sesión igual que el resto de variables. Si un turno posterior declara otra procedencia, prevalece la última declaración.
- Se persiste mediante el `sessionMemoryIndexer` existente, en los mismos flujos que ya indexan memoria (repregunta, despacho y claudicación).
- `MEMORY_VARIABLE_DURABILITY` es un `Record<keyof DefaultDensityPayload, …>`, por lo que la nueva clave obliga a declarar su durabilidad (ver la decisión abierta D-2).

##### 3.4. Adaptación narrativa en Gemini

- Cuando `cultural_origin` no es `null`, el prompt enriquecido incluye una **directiva cultural declarativa**, construida desde una constante de plantilla (no con texto libre del usuario), con estas reglas:
  1. Usar la procedencia solo como marco de comparación en `description` y `recommendations` de los waypoints (horarios comerciales, paralelismos gastronómicos, clima, costumbres locales).
  2. **Prohibido** modificar la selección de paradas, coordenadas, `timeSpan`, número de waypoints o restricciones por causa de la procedencia.
  3. **Prohibido** atribuir gustos, presupuesto, capacidades o comportamientos a la persona por su procedencia; prohibidos los estereotipos.
  4. Si no hay un paralelismo pertinente, no forzarlo.
- Cuando `cultural_origin` es `null`, **no** se inyecta ninguna directiva cultural y el prompt es idéntico al actual.
- El contrato de salida (`TacticalRouteZodSchema` / `EnrichedRouteSchema`) **no cambia**.

##### 3.5. Caché semántica

La clave de la caché semántica (`cacheContext`) hoy es `matrixId` + idioma. Una ruta adaptada a una procedencia podría servirse a otro usuario con un prompt parecido. Por eso, si `cultural_origin` no es `null`, **no se lee ni se escribe** en la caché semántica para esa petición (o se incorpora `cultural_origin` a la clave; ver la decisión abierta D-3).

##### 3.6. Privacidad

- La procedencia es un dato personal y puede acercarse a una categoría especial (origen étnico) del RGPD.
- No se añaden columnas ni campos estructurados con `cultural_origin` en MySQL, tampoco en `TelemetryLog`.
- Su ciclo de vida queda ligado al de la memoria cognitiva de la sesión en LanceDB y a sus purgas.

---

#### 4. Invariantes verificables

1. **Agnosticismo relacional:** el diff de `src/prisma/schema.prisma` de esta HU es vacío. No hay tablas, columnas ni variantes de `GuideTemplate`/`TemplateItem` por procedencia.
2. **Sonda de Jev intacta:** `DensityPresenceProbeSchema` mantiene exactamente sus cuatro claves `.strict()`.
3. **Neutralidad de la puntuación:** para un mismo prompt, la puntuación de densidad y el `status` del triaje son idénticos con y sin una declaración de procedencia.
4. **Neutralidad logística:** la directiva cultural solo se inyecta cuando `cultural_origin` no es `null` y su texto procede de una constante declarativa.
5. **Tipado hermético:** `cultural_origin` entra como `unknown` y se valida con Zod en la frontera. Prohibido `any`.

---

#### 5. Criterios de Aceptación

**Escenario 1: Ignorancia Activa (sin procedencia)**
- **Dado** un usuario que escribe "Tenemos 4 horas esta tarde, somos 2 personas y nos gusta el modernismo"
- **Cuando** la Aduana Universal procesa la petición
- **Entonces** el payload resultante contiene `cultural_origin: null`
- **Y** ningún mensaje del sistema pregunta por la procedencia
- **Y** el prompt enviado a Gemini no contiene ninguna directiva cultural.

**Escenario 2: Extracción orgánica con anclaje literal**
- **Dado** un usuario que escribe "Somos 3 amigos, venimos de Japón y nos encanta la arquitectura"
- **Cuando** la Aduana Universal procesa la petición
- **Entonces** el payload contiene `cultural_origin: "Japón"` con una evidencia que aparece literalmente en el prompt
- **Y** el valor queda persistido en la memoria cognitiva de LanceDB de ese `bx_session_id`
- **Y** la puntuación de densidad es la misma que sin la frase "venimos de Japón".

**Escenario 3: Falsos positivos (anti-alucinación)**
- **Dado** cada uno de estos prompts:
  - "Queremos cenar comida japonesa en el Eixample" (interés, no procedencia)
  - "Mañana volamos desde Buenos Aires, ¿qué hacemos el sábado?" (aeropuerto de salida, sin marcador de identidad)
  - "Mi jefe es alemán y me recomendó el Born" (tercera persona ajena al grupo)
  - Un prompt escrito íntegramente en inglés sin mencionar procedencia
- **Cuando** la Aduana Universal procesa cada petición
- **Entonces** `cultural_origin` es `null` en todos los casos.

**Escenario 4: Persistencia entre turnos y última declaración**
- **Dado** un usuario que en el primer turno escribió "Soy de México"
- **Cuando** en un turno posterior de la misma sesión escribe "Tenemos todo el día para el Gòtic" sin repetir su procedencia
- **Entonces** el prompt enviado a Gemini mantiene la directiva cultural con `"México"`
- **Y** si más adelante declara "en realidad somos de Chile", el valor pasa a `"Chile"`.

**Escenario 5: Adaptación narrativa sin alteración logística**
- **Dado** un mismo prompt de ruta modernista despachado dos veces, una con `cultural_origin: null` y otra con `cultural_origin: "Japón"`
- **Cuando** Gemini genera ambos itinerarios
- **Entonces** el segundo prompt incluye la directiva cultural y el primero no
- **Y** ambas respuestas validan contra el mismo esquema Zod de ruta
- **Y** la verificación automatizada se limita al prompt construido (determinista). La calidad de las comparaciones narrativas se valida manualmente o en tests `live`, porque la salida de Gemini no es determinista.

**Escenario 6: Aislamiento de la caché semántica**
- **Dado** una ruta generada y adaptada para `cultural_origin: "Japón"`
- **Cuando** otro usuario sin procedencia declarada envía un prompt semánticamente equivalente
- **Entonces** no recibe la ruta adaptada desde la caché semántica.

---

#### 6. Decisiones abiertas (requieren veredicto del Vértice Biológico)

- **D-1. Mecanismo de extracción.**
  - *Opción A (recomendada):* nuevo método en `IConversationalSLMPort` (Groq) con salida Zod `{ cultural_origin: string | null, evidence: string | null }` y validación de anclaje literal. Cubre los seis idiomas soportados, a costa de una llamada adicional de baja latencia.
  - *Opción B:* regex deterministas en `extractMatrixVariables`, coherente con el resto de variables. Coste cero, pero cobertura limitada fuera del castellano.
- **D-2. Durabilidad en memoria.** `durable` (se recuerda entre sesiones del mismo usuario anclado) o `ephemeral` (solo la sesión actual). Recomendación: `ephemeral` mientras no exista consentimiento explícito, por la sensibilidad del dato.
- **D-3. Estrategia de caché.** Omitir la caché semántica cuando hay procedencia (más simple y seguro) o incluir `cultural_origin` en la clave (más aciertos de caché, pero fragmenta el índice).

---

#### 7. Fuera de alcance

- Inyectar `GuideTemplate`/`TemplateItem` en el prompt de Gemini. Si se desea, requiere una HU propia, y los invariantes de esta HU seguirían aplicando.
- Inferir la procedencia desde GPS, IP, idioma, cabeceras del navegador o nombre del usuario.
- Cualquier cambio en el esquema Prisma.
