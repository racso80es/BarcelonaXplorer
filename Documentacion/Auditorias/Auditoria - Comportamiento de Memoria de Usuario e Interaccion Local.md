# [AUDITORÍA TÉCNICA] Comportamiento del Subsistema de Memoria de Usuario e Interacción Local

**Identificador:** AUD-MEM-LOC-001  
**Fecha de Emisión:** 2026-09-25  
**Clasificación:** Operativo Interno / Diagnóstico S+ Grade  
**Alcance:** Ciclo de Vida de Memoria de Usuario (Identidad Sombra, Matriz de Densidad Multivuelta, Anclaje Táctico Telegram, Persistencia Vectorial LanceDB y Telemetría Centralizada)  
**Entorno Auditado:** Local Host (Linux Mint, Next.js 16 Turbopack en puerto 3000, MySQL 3306 `barcelonaxplorer_db`, LanceDB `./data/lancedb`)  
**Auditor Técnico:** Antigravity AI Architecture Sentinel  
**Calificación Global:** **B+ (Excelente Gobernanza de Estado y Trazabilidad; Memoria Vectorial Aislada y Fallback de Resiliencia Pendiente)**  

---

## 1. Resumen Ejecutivo y Hallazgo Forense

Tras la ejecución de pruebas directas en local en la ruta `/orchestrator`, se realizó una inspección forense exhaustiva sobre los componentes en memoria, bases de datos (MySQL), almacenamiento vectorial (LanceDB) y registros de telemetría (`TelemetryLog`).

Se identificó una sesión de usuario real completa con identificador de identidad sombra:
```text
Session ID: a4a9ab20-7d8f-4186-a8d6-6053b48adb09
Intervalo Temporal: 2026-09-25T05:06:52.073Z — 2026-09-25T05:08:49.770Z (07:06:52 - 07:08:49 hora local)
```

### Veredicto Rápido de las 4 Capas de Memoria:
1. **Identidad Sombra (Cookie `bx_session_id`):** **100% OPERATIVA**. Persistió inalterada a través de todos los turnos multivuelta mediante cookie perimetral HTTP-only.
2. **Memoria de Trabajo Multivuelta (Matriz de Densidad):** **100% EFECTIVA**. Retuvo el contexto previo (`group_size: 4`) entre turnos, activó repregunta atómica y fusionó variables acumuladas con el nuevo turno (`time_window: "dos dias"`).
3. **Memoria de Largo Alcance (Anclaje Telegram):** **PREPARADA (En Espera)**. El endpoint `/api/telegram/anchor-link` emitió el Deep Link cifrado con AES-256-GCM. No se materializó registro en la tabla `user_anchors` dado que el usuario no completó el flujo `/start` en el bot de Telegram.
4. **Memoria Semántica Vectorial (LanceDB):** **DESACOPLADA POR DISEÑO (HU 3 vs HU 5)**. LanceDB está desplegado, probado y sano a nivel de infraestructura, pero el pipeline conversacional actual no indexa aún fragmentos vectoriales de la conversación (pendiente de HU 5).

---

## 2. Reconstrucción Cronológica del Comportamiento en Memoria

### Turno 1: Generación Directa de Ruta Táctica (Monovuelta Saturada)
* **Timestamp:** `2026-09-25T05:06:52Z` (07:06:52 local)
* **Prompt del Usuario:** 
  > *"Cata de vinos por la mañana, buen restaurante de marisco para comer, teatro por la tarde y por la noche un evento deportivo"*
* **Comportamiento en Memoria:**
  1. **Aduana y Perímetro (Jev AI System One):** Clasificó el destino dentro del perímetro de Barcelona (probabilidad foránea: `0.04`, latencia: `1228 ms`).
  2. **Evaluación de Densidad:** Reconoció implícitamente ventana de tiempo completa (`time_window`) y vibración gastronómica (`vibe: restaurante`). Densidad alcanzada $\ge 60\%$.
  3. **Despacho Orquestador Pesado:** Invocación a Gemini 3.5 Flash (`gemini-3.5-flash`), forjando en `16.4s` la ruta táctica `ruta_tactica_bcn_completa` con 4 puntos de interés:
     - Bodega Maestrazgo (Sant Pere, 11:00-13:00)
     - La Mar Salada (Barceloneta, 13:30-15:30)
     - Teatre Tívoli (Eixample, 17:00-19:30)
     - Palau Blaugrana (FC Barcelona, 20:30-22:30)
  4. **Poda de Matriz:** Al finalizar con éxito, se ejecutó `clearMatrixPayload`, dejando la memoria de trabajo limpia para la siguiente interacción.
  5. **Disparo de Anclaje:** El cliente renderizó el componente `TelegramAnchorDrop`, invocando `/api/telegram/anchor-link` y forjando el token cifrado de recuperación.

---

### Turno 2: Inyección de Estado Parcial y Repregunta Atómica (Memoria de Corto Alcance)
* **Timestamp:** `2026-09-25T05:08:15Z` (07:08:15 local)
* **Prompt del Usuario:** 
  > *"seremos 4 personas"*
* **Comportamiento en Memoria:**
  1. **Aduana Jev AI:** Perímetro confirmado dentro de Barcelona (`p=0.05`). Detección de ventana de tiempo negativa (`p=0.04`).
  2. **Extracción y Persistencia de Estado:** El extractor identificó `group_size: 4`.
  3. **Evaluación Termodinámica de Supervivencia:**
     - Score obtenido: **10%** (por debajo del umbral del 60%).
     - Variable crítica faltante: `time_window` (peso 60%).
  4. **Persistencia Soberana en Backend:**
     - Se guardó en `InMemoryDensityMatrixRepository` el payload acumulado asociado a la cookie de sesión:
       ```json
       {
         "group_size": 4,
         "constraints": [],
         "districts": []
       }
       ```
  5. **Activación de SLM Rápido (Groq Qwen 3.8-27b):** En `287 ms`, generó una repregunta contextualizada y empática:
     > *"Qué buen plan para cuatro, ¿cuánto tiempo tenéis disponible para disfrutar de la ciudad?"*

---

### Turno 3: Fusión de Memoria Multivuelta e Incidente de Infraestructura Externa
* **Timestamp:** `2026-09-25T05:08:34Z` (07:08:34 local)
* **Prompt del Usuario:** 
  > *"dos dias"*
* **Comportamiento en Memoria:**
  1. **Recuperación Soberana:** El caso de uso `TriageInputUseCase` recuperó el estado acumulado previo (`group_size: 4`) de la sesión.
  2. **Inferencia Semántica Jev AI:** Evaluó el prompt *"dos dias"*: probabilidad de ventana de tiempo válida `p=0.87` (afirmativo en `440 ms`).
  3. **Fusión de Matrices (State Merging):** Se consolidó el payload en memoria:
     ```json
     {
       "group_size": 4,
       "time_window": "dos dias",
       "constraints": [],
       "districts": []
     }
     ```
  4. **Superación del Umbral:** Densidad superó el 60%, procediendo a despachar al orquestador pesado con el prompt enriquecido con la memoria acumulada:
     > `[Geo: Barcelona | Distritos: Global] dos dias | Contexto de Matriz: {"constraints":[],"districts":[],"group_size":4,"time_window":"dos dias"}`
  5. **Incidente Externo (Gemini API 503):** 
     - La API de Google Gemini devolvió un error de saturación de demanda a nivel de proveedor:
       ```json
       {
         "error": {
           "code": 503,
           "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
           "status": "UNAVAILABLE"
         }
       }
       ```
  6. **Efecto Colateral en la Memoria:**
     - Al arrojar una excepción antes de alcanzar la instrucción `clearMatrixPayload(sessionId, matrixId)`, el estado acumulado **no se eliminó**, permaneciendo en el repositorio para reintentos posteriores.

---

## 3. Matriz de Auditoría por Capas de Persistencia

| Capa de Memoria | Componente Técnico | Estado Observado | Veredicto |
| :--- | :--- | :--- | :---: |
| **Identidad Sombra** | Cookie `bx_session_id` | Mismo UUID en los 3 turnos: `a4a9ab20-7d8f-4186-a8d6-6053b48adb09` | **A+ (Excelente)** |
| **Memoria de Trabajo** | `InMemoryDensityMatrixRepository` | Fusión exacta de `group_size: 4` + `time_window: "dos dias"` | **A (Sólido)** |
| **Anclaje Táctico** | `user_anchors` en MySQL | 0 registros creados (el enlace fue forjado pero no activado en Telegram) | **B (Esperado)** |
| **Memoria Vectorial** | LanceDB (`./data/lancedb`) | 0 tablas creadas en el flujo conversacional (desacoplado hasta HU 5) | **B (Conforme a Alcance)** |
| **Telemetría de Memoria** | `TelemetryLog` en MySQL | 6 registros generados con payload JSON completo de cada inferencia | **A+ (Exhaustivo)** |

---

## 4. Puntos Críticos y Brechas Identificadas

### 4.1. Volatilidad de la Memoria de Trabajo (`InMemoryDensityMatrixRepository`)
* **Diagnóstico:** La memoria multivuelta reside en un `Map` en la memoria RAM del proceso Node.js (`src/infrastructure/repositories/in-memory-density-matrix.repository.ts`).
* **Riesgo:** Si el proceso de Node.js se reinicia, o si el tráfico se distribuye entre múltiples workers o réplicas en el Nodo 11, el usuario que esté en mitad de una repregunta perderá su contexto previo (`group_size: 4`), teniendo que reiniciar la aduana.
* **Solución Recomendada:** Desarrollar un adaptador `PrismaDensityMatrixRepository` o un almacén Redis/MySQL con TTL para las matrices activas en vuelo.

### 4.2. Vulnerabilidad ante Caídas 503 del Proveedor LLM (Falta de Fallback / Reintento)
* **Diagnóstico:** Cuando Gemini devolvió `503 Service Unavailable`, la API falló abruptamente devolviendo HTTP 500 al cliente.
* **Riesgo:** Pérdida de experiencia de usuario tras haber invertido tiempo en responder las repreguntas de triaje.
* **Solución Recomendada:** Implementar un mecanismo de *Exponential Backoff* con reintento automático o conmutación hacia modelos alternativos declarados en `GEMINI_MODELS` (`gemini-3-flash-preview`, `gemini-3.6-flash`).

### 4.3. Desconexión de LanceDB en el Pipeline Conversacional
* **Diagnóstico:** LanceDB quedó verificado mediante pruebas y panel `/Admin/System`, pero no forma parte de la cadena de dependencias de `TriageInputUseCase` ni de `GenerateTacticalRouteUseCase`.
* **Riesgo:** No existe memoria episódica ni preferencias a largo plazo aprendidas a partir de interacciones pasadas.
* **Solución Recomendada:** Abordar formalmente la **Historia de Usuario 5 (Memoria Vectorial Cognitiva y Optimización Termodinámica)**, conectando el puerto `IVectorStorePort` al ciclo de vida del orquestador.

---

## 5. Conclusiones y Plan de Acción

1. **La memoria a corto plazo y la identidad sombra funcionan con absoluta precisión.** El usuario mantuvo su contexto, su número de personas y su intención entre turnos sin fisuras de sesión.
2. **La telemetría sensorial capturó con fidelidad milimétrica cada evento,** permitiendo reconstruir con precisión quirúrgica todo el flujo de pensamiento de los modelos Jev AI, Groq y Gemini.
3. **El fallo percibido al final de la interacción no fue un fallo de memoria, sino una indisponibilidad temporal (503 High Demand) de los servidores de Google Gemini.** La memoria previa del usuario quedó preservada de forma segura para reintentar la operación.
