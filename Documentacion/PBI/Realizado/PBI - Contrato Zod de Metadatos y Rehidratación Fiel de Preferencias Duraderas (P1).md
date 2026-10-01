# [ARQUITECTURA] Documento Destilado: PBI - Contrato Zod de Metadatos y Rehidratación Fiel de Preferencias Duraderas

**Identificador:** PBI-MEM-002  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-30  
**Fecha de Finalización:** 2026-10-01  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 17: Reconexión de la Memoria Cognitiva a Largo Plazo y Pipeline de Indexación Vectorial (S+ Grade)](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2017%3A%20Reconexi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20a%20Largo%20Plazo%20y%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20%28S%2B%20Grade%29.md) · §1, §3.4 · Escenario 5  
**Módulo:** `src/features/cognitive-memory/` (`dense-semantic-matrix.vo.ts`, `cognitive-memory-metadata.schema.ts`, `lancedb-cognitive-memory.adapter.ts`), `src/features/triage/triage-input.use-case.ts` (paso 1.1)  
**Entorno:** LanceDB (`cognitive_memories`), `DefaultDensityPayload` del planner  
**Prioridad:** Alta (P1 — sin él, el Escenario 5 falla aunque la indexación funcione)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** —  
**Bloquea:** PBI-MEM-003, PBI-MEM-005  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Garantizar que lo que se rehidrata desde LanceDB es exactamente lo que el usuario reveló y sigue vigente, parseado con Zod en la frontera.
- **Defectos verificados en el código (2026-09-30):**
  1. **Ventana temporal obsoleta que bloquea la nueva.** Tras un despacho, la memoria guardaba `time_window` (vector crítico del 60 %). En la visita siguiente se rehidrataba y `extractMatrixVariables` solo rellenaba `time_window` si estaba vacío: *"algo para mañana por la tarde"* **no sobrescribía** la ventana antigua y el sistema despachaba de inmediato con la fecha anterior. Contradice directamente el Escenario 5.
  2. **Pérdida de variables.** `DenseSemanticMatrix` no modelaba `mood` ni `language`; `toPayload()` y la reconstrucción en el adaptador las descartaban.
  3. **Frontera sin Zod (Axioma II).** `parseRowMetadata` hacía `JSON.parse` y la reconstrucción usaba cadenas de `typeof`, duplicadas entre `getLatestSessionMemory` y `searchSimilarMemories`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Cero Alucinación):* Una preferencia caducada no se presenta como vigente.
  - *Filtro B (Axioma III):* Durabilidad de cada variable declarada en una matriz, no en `if`.
  - *Filtro C:* La cadena densa sigue < 45 tokens (límites de compactación de PBI-COGN-MEM-006 intactos).

---

## 1. Declaración de Intención (INVEST)

**Como** turista que vuelve días después,  
**Quiero** que el sistema recuerde quién soy y qué me gusta (grupo, vibe, restricciones, ánimo, idioma) pero no *cuándo* quise ir la vez anterior,  
**Para** pedir un plan nuevo con una frase corta sin que se reutilice una fecha pasada.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Matriz de durabilidad):** `MEMORY_VARIABLE_DURABILITY: Record<keyof DefaultDensityPayload, 'durable' | 'ephemeral'>` con `time_window` efímera y `group_size`, `vibe`, `constraints`, `districts`, `mood`, `language` duraderas. El tipo `Record` fuerza a clasificar cualquier variable nueva del payload.
- [x] **CA-2 (Rehidratación filtrada):** El paso 1.1 de `TriageInputUseCase` rehidrata solo las variables `durable`. Test del Escenario 5: memoria con `group_size: 4`, `vibe: 'familiar'`, `constraints: ['niños']`, `time_window: 'sábado'`; nuevo prompt *"algo para mañana por la tarde"* ⇒ `time_window` nuevo, resto heredado y **ninguna** repregunta por `group_size`/`vibe`.
- [x] **CA-3 (Modelo completo):** `DenseSemanticMatrixProps` incorpora `mood?` y `language?`; `toMetadata()` y `toPayload()` los incluyen. `toDensePromptString()` solo añade `mood` si cabe en el presupuesto de tokens (test de longitud existente ampliado).
- [x] **CA-4 (Contrato Zod):** `CognitiveMemoryMetadataSchema` en `cognitive-memory-metadata.schema.ts` parsea la fila de LanceDB (`metadata` como string JSON u objeto). Fila inválida ⇒ `null` con `WARN` en lugar de una matriz parcialmente vacía. Sin `as` ni `typeof` encadenados.
- [x] **CA-5 (Un solo reconstructor):** `getLatestSessionMemory` y `searchSimilarMemories` comparten `DenseSemanticMatrix.fromMetadata(parsed)`; se elimina la duplicación.
- [x] **CA-6 (Compatibilidad hacia atrás):** Filas antiguas sin `mood`/`language` se parsean sin error (campos opcionales). Test con una fila en el formato actual.
- [x] **CA-7 (Tests colocalizados):** `dense-semantic-matrix.vo.test.ts`, `lancedb-cognitive-memory.adapter.test.ts` y `triage.test.ts` actualizados.
- [x] **CA-8 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` en verde.

---

## 3. Evidencia de Cumplimiento

- **Esquema y Matriz:** `src/features/cognitive-memory/cognitive-memory-metadata.schema.ts` define `MEMORY_VARIABLE_DURABILITY` y `CognitiveMemoryMetadataSchema` con preprocesamiento Zod seguro.
- **Value Object:** `DenseSemanticMatrix` incorpora `mood`, `language`, método estático unificado `fromMetadata` y salvaguarda presupuestaria (<280 chars) para `toDensePromptString()`.
- **Adaptador:** `LanceDbCognitiveMemoryAdapter` erradica duplicación y cadenas de `typeof`, consumiendo `DenseSemanticMatrix.fromMetadata(parsed.data)` y devolviendo `null` ante filas corruptas.
- **Caso de Uso:** Paso 1.1 de `TriageInputUseCase` filtra la memoria recuperada usando `MEMORY_VARIABLE_DURABILITY`, rehidratando las preferencias duraderas e ignorando ventanas temporales pasadas.
- **Oráculos en Verde:**
  - `tsc --noEmit`: 0 errores.
  - `eslint --max-warnings 0`: 0 warnings.
  - `vitest run`: 94 suites pasadas (521 tests).
  - `npm run build`: Compilación Turbo App Router exitosa.
