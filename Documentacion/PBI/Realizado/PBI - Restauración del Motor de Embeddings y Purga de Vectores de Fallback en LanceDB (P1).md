# [OPERATIVO] Documento Destilado: PBI - Restauración del Motor de Embeddings y Purga de Vectores de Fallback en LanceDB

**Identificador:** PBI-STEEL-002
**Estatus:** Realizado (S+ Grade — código y oráculos; CA-1 ping y CA-6 purga en Nodo 11 pendientes de operación)
**Fecha de Creación:** 2026-09-28
**Fecha de Culminación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-02, F-21
**Módulo:** Memoria cognitiva vectorial (RAG) y caché semántica
**Entorno:** `gemini-embedding.adapter.ts`, `deterministic-embedding-fallback.ts`, `lancedb-vector.adapter.ts`, `lancedb-semantic-cache.adapter.ts`, `purge-fallback-vectors.ts`, `scripts/gemini-embedding-ping.ts`, `scripts/purge-lancedb-fallback-vectors.ts`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** —

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Ping empírico):** `scripts/gemini-embedding-ping.ts` (Node suelto, sin Next) prueba `text-embedding-004` y `embedding-001` con `outputDimensionality: 768` y sugiere `GEMINI_EMBEDDING_MODEL`. *Ejecución con clave real: operador en Nodo/dev.*
- [x] **CA-2 (Dimensión estable):** `embedContent` con `config.outputDimensionality: 768`; respuestas con longitud distinta se rechazan (`ERROR`) y no se persisten.
- [x] **CA-3 (Clasificación de errores):** 401/403/404 → `ERROR` en `LLM_ENGINE`; transitorios (429, 5xx, timeout, `fetch failed`) → `WARN`.
- [x] **CA-4 (Sin persistencia degradada):** `generateEmbedding` devuelve `{ vector, source }`; triaje no llama a `persistMemory` ni escribe caché con `source: 'fallback'`.
- [x] **CA-5 (Script de purga):** `purgeFallbackVectors` + CLI `scripts/purge-lancedb-fallback-vectors.ts` (`--dry-run` por defecto, `--apply` para borrar).
- [ ] **CA-6 (Ejecución en producción):** backup del volumen, dry-run/apply en Nodo 11 con contenedor web parado en `--apply`; recuentos en esta sección tras operación.
- [x] **CA-7 (Coseno, F-21):** `distanceType('cosine')`, score = `1 - _distance`, umbral caché `0.98`.
- [x] **CA-8 (Tests):** adaptador (404→ERROR, 429→WARN, dimensión inválida), purga idempotente, triaje sin `persistMemory` en fallback.

---

## 4. Evidencia de Certificación

| Oráculo | Resultado |
|---|---|
| `npx tsc --noEmit` | OK |
| `npm run lint` | OK |
| `vitest run` | 89 ficheros, 478 tests OK |

**Ping:** `cd src && npx --yes tsx ../scripts/gemini-embedding-ping.ts`  
**Purga (dry-run):** `cd src && npx --yes tsx ../scripts/purge-lancedb-fallback-vectors.ts`

**Purga producción (CA-6):** pendiente — anotar aquí recuentos dry-run / eliminados tras Escenario 2.
