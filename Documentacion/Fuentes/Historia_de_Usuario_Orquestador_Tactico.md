# Historia de Usuario: Interfaz del Orquestador Táctico (Coreografía de Vías Concurrentes)

## 1. Descripción General
**Como** turista planificando una ruta por Barcelona,
**Quiero** interactuar con una interfaz inmersiva tipo "orquestador" que me ofrezca retroalimentación ultrarrápida (chispas) mientras procesa en paralelo mi ruta táctica final,
**Para** no tener la sensación de "espera inactiva" y recibir contexto ambiental y logístico inmediato antes del plan detallado.

---

## 2. Componentes de la Interfaz (UI)
La experiencia se fundamenta en un diseño inmersivo, tipografía monoespaciada táctica y colores ciber-orgánicos (Zincs y Emeralds).

### 2.1. `OrchestratorPage` (Página Principal del Orquestador)
- **Ruta**: `/orchestrator`
- **Zona de Conversación (Scroll Iterativo)**: Contenedor principal que almacena el histórico de turnos. Efectúa auto-scroll hacia abajo ("sticky to bottom") de manera fluida cada vez que ingresan nuevas "chispas" o se resuelve un bloque de IA, manteniendo siempre visible la respuesta más reciente y empujando las anteriores hacia arriba.
- **Input Táctico (Caja de Mando)**: Bloqueada mecánicamente (`disabled`) en cuanto se emite un prompt. No vuelve a habilitarse hasta que la Vía Lenta finaliza su asimilación (Fase 3).

### 2.2. `OrchestratorBlock` (Bloque de Diálogo)
- Contenedor atómico que encapsula tanto el mensaje del usuario (alineado a la derecha, tono esmeralda apagado) como la resolución consolidada final de la IA (alineada a la izquierda, diseño jerárquico).

### 2.3. `TacticalSpark` (Chispa de Consciencia)
- Cajas de alerta asíncronas de diseño minimalista con bordes vibrantes y animaciones de latido de red (efecto pulse) en sus iconos.
- Representan los retornos de la Vía Rápida. Aparecen como revelaciones orgánicas de latencia cero, nunca gobernadas por un temporizador `setTimeout`, sino disparadas reactivamente al recibir un NDJSON validado.

---

## 3. Coreografía de Estados (Las Tres Fases)

### Fase 1: Ignición Inmediata
- El usuario teclea su intención táctica y pulsa Enter.
- Se renderiza instantáneamente el `OrchestratorBlock` del usuario.
- La caja de input se bloquea.
- Transición automática a Fase 2 en 400ms.

### Fase 2: Asimilación y Chispas de Consciencia (Vía Rápida)
- Aparece un `OrchestratorBlock` con el estado `orchestrating` ("Asimilando entropía y trazando ruta...").
- Paralelamente, se abre un túnel de conexión Streaming (SSE) contra Groq (Vía Rápida).
- Groq envía *chunks* NDJSON (Newline Delimited JSON). Cada línea parseada y aprobada por el Escudo Zod es instanciada como un `TacticalSpark` y renderizada en tiempo real.
- **Tipos de Chispas Mapeadas**:
  - `environmental` ➡️ (Icono: Lluvia / Nubes)
  - `security` ➡️ (Icono: Escudo / Alerta)
  - `transit` ➡️ (Icono: Navegación / Logística)

### Fase 3: Resolución Táctica (Vía Lenta)
- De forma asíncrona a las chispas, se resuelve la promesa pesada contra Gemini (Vía Lenta).
- Gemini devuelve el objeto JSON complejo. Tras cruzar la Aduana Zod y la validación de Entidades Puras del Dominio, el componente UI mapea la entidad `TacticalRoute`.
- El bloque "Asimilando" se reemplaza por el `OrchestratorBlock` final, iterando sobre los Waypoints, renderizando *TimeSpans*, coordenadas y una lista de recomendaciones para cada parada táctica.
- Se libera la caja de Input para permitir la continuación de la conversación.

---

## 4. Normativas Arquitectónicas (Certificación S+ Grade)

Esta funcionalidad opera bajo las normas puristas de Arquitectura Hexagonal y Gobernanza IA.

### 4.1. Escudo Zod (Aduana de Infraestructura)
- Queda estrictamente prohibido que la UI consuma datos brutos del LLM. 
- Todos los JSON (FastInsights y TacticalRoutes) pasan primero por `src/infrastructure/ai/schemas`. 

### 4.2. Dominio Puro y Violation of Boundaries
- El esquema Zod no penetra en la capa de dominio. `FastInsight` y `TacticalRoute` son entidades 100% puras de TypeScript.
- **Value Objects**: Se emplean `GeoCoordinates` y `TimeSpan`. Estos instancian su propia validación de negocio en el constructor (ej. Rango de latitud `[-90, 90]`, invariante `start < end`).

### 4.3. Excepciones de Dominio Personalizadas
- Si un Objeto de Valor es instanciado con alucinaciones matemáticas o lógicas de la IA, arroja excepciones precisas (`InvalidCoordinatesException`, `InvalidTimeSpanException`).
- Estas excepciones extienden de `DomainException` y son interceptadas por los adaptadores (Ej. `gemini-client.ts`), permitiendo aislar el fallo de infraestructura (Timeout) del fallo por alucinación lógica, disparando inmediatamente los mecanismos de *Fallback Chain* hacia otro modelo LLM.

### 4.4. Mapeo de Frontera
- La capa de infraestructura genera DTOs de dominio (`category: 'security'`). Es responsabilidad exclusiva de la vista de React transmutar eso a propiedades del Framework (`type: 'security'`, `<ShieldAlert />`). La infraestructura jamás conoce las `props` de la interfaz.
