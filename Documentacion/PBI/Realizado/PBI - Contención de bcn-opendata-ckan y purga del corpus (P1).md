# [ARQUITECTURA] PBI - Contención de bcn-opendata-ckan y purga del corpus

**Identificador:** PBI-CTX-012  
**Ref. de historia:** REF-CTX-01  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.1 · Escenario 1  
**Módulo:** `src/features/context-sources/context-sources.seed.yml`, purga nueva en `src/features/context-sources/`, lectura paginada en `src/features/cognitive-memory/`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-005, PBI-CTX-010  
**Bloquea:** PBI-CTX-018

---

### Hecho de partida

`upsertFromSeed` no cambia el `status` de una fila ya existente. Pasar la semilla a `INACTIVE` solo afecta a una base vacía. La fila viva se apaga con `DEACTIVATE` (actor `HUMAN`), que el panel ya ejecuta. `ContextAdminService.transitionSource` no escribe telemetría; este PBI no la añade.

El documento en `context_memory` usa `id = bcn-opendata:${id del package}`. El SHA-256 está en `metadata.contentHash`. `IVectorStorePort.delete` acepta `{ ids }`. No hay listado por prefijo: `search` es una búsqueda vectorial con límite. `purge-fallback-vectors.ts` pagina de 500 en 500 (`PAGE_SIZE`) las tablas `cognitive_memories` y `semantic_prompt_cache`, y no toca `context_memory`. El listado del Admin corta en 100 filas.

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** dejar `bcn-opendata-ckan` fuera de la ingesta y borrar sus fichas de catálogo,  
**Para** que el RAG deje de recuperar metadatos de dataset como si fueran eventos.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Semilla para base nueva):** En `context-sources.seed.yml`, `bcn-opendata-ckan` queda `status: INACTIVE`. Un `loadSeed` sobre catálogo vacío la crea `INACTIVE`.
- [x] **CA-2 (Fila ya existente):** El código no intenta pisar el `status` por semilla. El cierre operativo es un `DEACTIVATE` humano desde el panel si la fila está `ACTIVE` o `DEGRADED`. Ese paso queda escrito en el PBI como operación, no como efecto del YAML.
- [x] **CA-3 (Lectura):** El puerto vectorial gana un listado paginado de `context_memory` (páginas de 500, el mismo tamaño que `purge-fallback-vectors.ts`), sin búsqueda vectorial. El filtro de negocio vive en `context-sources`: entra una fila si `id` empieza por `bcn-opendata:` o `metadata.sourceTag` es `bcn-opendata-ckan`.
- [x] **CA-4 (Borrado):** Dry-run por defecto, devuelve los ids y no llama a `delete`. Con apply, borra solo esos ids mediante `{ ids }`. Una fila de otra fuente sobrevive. Un dry-run posterior devuelve 0 ids.
- [x] **CA-5 (Oráculos):** Desde `src/`, `npx tsc --noEmit`, `npm run lint` y `npx vitest run` en salida 0.

La purga toca el puerto, el adaptador LanceDB y su test, además del módulo nuevo y la semilla. No cabe en tres archivos: el puerto no sabe listar `context_memory`.

---

## 3. Fuera de alcance

- Apunte de telemetría en `transitionSource`.
- Alta de `bcn-agenda-cultural` (PBI-CTX-017).
- Reescribir `ApiRestContextAdapter` (PBI-CTX-018).

---

## 4. Evidencia de Implementación y Certificación de Oráculos

1. **Semilla:** En `src/features/context-sources/context-sources.seed.yml`, `bcn-opendata-ckan` pasó de `status: ACTIVE` a `status: INACTIVE`. En bases de datos nuevas, la semilla la instanciará inactiva.
2. **Cierre Operativo de Bases Existentes:** En bases de datos en producción y desarrollo que ya contienen la fila, la desactivación se realiza mediante la acción soberana `DEACTIVATE` (actor `HUMAN`) desde la interfaz administrativa (`/Admin/Context`), preservando la inmutabilidad de la bitácora de la fila en MySQL.
3. **Puerto Vectorial Paginado (`IVectorStorePort`):** Se incorporó el método inmutable `list(tableName: string, options?: VectorListOptions): Promise<VectorDocument[]>` tanto en el contrato como en `LanceDbVectorAdapter` con soporte de `limit` y `offset`. Se verificó mediante test unitario colocalizado en `lancedb-vector.adapter.test.ts`.
4. **Módulo de Purga Táctica (`purge-ckan-corpus.ts`):**
   - Localización: `src/features/context-sources/purge-ckan-corpus.ts`.
   - Lógica de negocio: Identifica registros con prefijo `bcn-opendata:` o `metadata.sourceTag === 'bcn-opendata-ckan'`.
   - Modo `dryRun`: habilitado por defecto, recopila y retorna identificadores sin mutar el almacén.
   - Modo `apply`: elimina de forma determinista mediante el filtro `{ ids }`, asegurando la preservación intacta de fuentes colindantes (`gencat-agenda-cultural`, `wikidata-barcelona-monuments`, etc.).
   - Colocated tests en `purge-ckan-corpus.test.ts` pasando 100% en verde.
5. **Oráculos:**
   - `npx tsc --noEmit`: 0 errores.
   - `npm run lint`: 0 advertencias, 0 errores.
   - `npx vitest run`: 122 suites, 684 tests pasando.
