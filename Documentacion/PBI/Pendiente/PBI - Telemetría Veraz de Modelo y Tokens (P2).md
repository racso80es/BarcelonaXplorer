# [OPERATIVO] Documento Destilado: PBI - Telemetría Veraz de Modelo y Tokens

**Identificador:** PBI-STEEL-014
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-13
**Módulo:** Telemetría cognitiva
**Entorno:** `src/features/triage/triage-input.use-case.ts`, `src/features/cognitive-memory/lancedb-semantic-cache.adapter.ts`, `src/app/Admin/Cognitive/CognitiveKpiCards.tsx`
**Prioridad:** Media (P2 — el panel muestra cifras que el código ha escrito a mano)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-STEEL-003, PBI-STEEL-005 y PBI-STEEL-006, que también editan el caso de uso de triaje.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El diálogo casual registra `model: 'groq/qwen3.8-27b'`, `tokenEstimate: 45` y `tokensSaved: 850`. El adaptador Groq, en cambio, usa `GROQ_FAST_MODEL` con defecto `qwen/qwen3.8-27b` (otro prefijo). La caché semántica vuelve a poner `tokensSaved ?? 850`. Si la suma del Admin es 0, la tarjeta enseña el literal `92%`.
- **Entorno:** Caso de uso de triaje, adaptador de caché y tarjetas KPI.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El modelo escrito es el que el adaptador ha usado en esa llamada.
  - *Filtro B:* Los tokens salen del uso que devuelva el SDK. Si no viene, el campo no se envía.
  - *Filtro C:* Cero en el KPI se muestra como ausencia de datos, no como un porcentaje.

---

## 1. Declaración de Intención (INVEST)

**Como** operador de `/Admin/Cognitive`,
**Quiero** que el modelo y los tokens sean los de la llamada real,
**Para** no tomar una constante del código por un ahorro medido.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Modelo):** el evento de telemetría del diálogo casual copia `this.model` del adaptador Groq (el valor de `GROQ_FAST_MODEL` o su defecto `qwen/qwen3.8-27b`). Desaparece el literal `groq/qwen3.8-27b`.
- [ ] **CA-2 (Uso real):** `tokenEstimate` y `tokensSaved` se rellenan solo con números presentes en la respuesta del SDK. El nombre del campo se toma del tipo de esa respuesta en el momento de la forja. Si la respuesta no trae uso, los campos se omiten. Prohibido dejar `45` y `850`.
- [ ] **CA-3 (Caché):** `lancedb-semantic-cache.adapter.ts` deja de sustituir un `tokensSaved` ausente por `850`. Lo que no se pasó, no se guarda.
- [ ] **CA-4 (Admin):** `CognitiveKpiCards` muestra un texto de "sin datos" cuando `tokensSavedTotal` es 0. Desaparece el literal `92%`.
- [ ] **CA-5 (Tests que fijan la mentira):** se actualizan en el mismo cambio las aserciones que esperan `850` o el modelo con prefijo `groq/` como si fueran el contrato: `triage.test.ts`, `semantic-cache.test.ts`, `telemetry.test.ts` y `HybridTelemetryCard.test.tsx`. Un test nuevo cubre "sin uso del SDK → campo ausente" y "suma 0 → sin datos".

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No inventar el nombre del campo de uso.** Groq suele devolver `usage`, pero el CA-2 obliga a leerlo del tipo instalado (`groq-sdk`), no de la memoria.
- **El esquema ya admite la ausencia.** `telemetry.schema.ts` marca `tokenEstimate` y `tokensSaved` como opcionales. No hace falta un valor centinela.
- **Este cambio toca más de tres ficheros** porque los tests repiten las constantes. El núcleo es el caso de uso, el adaptador de caché y la tarjeta. Los tests van en el mismo cambio o el oráculo falla por aserciones viejas, no por una regresión.

---

## 4. Evidencia de Certificación

Pendiente de forja.
