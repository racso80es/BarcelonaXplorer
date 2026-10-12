# [ARQUITECTURA] PBI - Adaptador API_REST sin heurística CKAN

**Identificador:** PBI-CTX-018  
**Ref. de historia:** REF-CTX-04  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de realización:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.4  
**Módulo:** `src/features/context-sources/adapters/api-rest-context.adapter.ts`, `api-rest-context.adapter.test.ts`  
**Prioridad:** Media (P2)  
**Depende de:** PBI-CTX-012, PBI-CTX-016  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que el adaptador REST genérico deje de interpretar un `package_search` del Ajuntament,  
**Para** que el catálogo CKAN solo lo mine `CKAN_DATASTORE`.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Sin CKAN):** El adaptador no lee `result.results`, no utiliza el literal `bcn-opendata`, no fuerza `category: EVENT` ni impone un TTL artificial de 30 días acoplado al catálogo municipal.
- [x] **CA-2 (Identidad de la fuente):** El identificador compuesto `id` inicia deterministamente con `${source.sourceTag}:${itemId}`. La categoría `category` se extrae de `source.category` validada mediante `ContextEntryCategorySchema`. El JSON recibido se valida mediante esquemas deterministas Zod (`RestPayloadSchema` / `RestItemSchema`) sin aserciones ciegas ni dobles conversiones prohibidas (`as unknown as`, conforme a `TC-TS-001`).
- [x] **CA-3 (Test):** La suite de pruebas `api-rest-context.adapter.test.ts` sustituye el fixture CKAN por payloads JSON planos representativos de APIs REST genéricas, validando mapeo, categorías de fuente (`POI`, `EVENT`), sobre de error 422 ante payload incompatible y propagación de errores HTTP.
- [x] **CA-4 (Oráculos):** Compilación `npx tsc --noEmit` en 0 errores, linter `npm run lint` en 0 advertencias y suite de tests `npx vitest run` (124 archivos, 702 tests) en salida 0.

---

## 3. Evidencias de Implementación y Oráculos

- **Adaptador genérico:** `src/features/context-sources/adapters/api-rest-context.adapter.ts`
- **Tests colocalizados:** `src/features/context-sources/adapters/api-rest-context.adapter.test.ts`
- **Resultados de Oráculos:**
  - `npx tsc --noEmit`: Salida 0 (tipado determinista)
  - `npm run lint`: Salida 0 (cero warnings)
  - `npx vitest run`: 124 archivos pasados, 702 tests pasados (100% verde)
