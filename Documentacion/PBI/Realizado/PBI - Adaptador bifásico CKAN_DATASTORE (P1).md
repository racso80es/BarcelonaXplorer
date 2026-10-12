# [ARQUITECTURA] PBI - Adaptador bifásico CKAN_DATASTORE

**Identificador:** PBI-CTX-016  
**Ref. de historia:** REF-CTX-03a  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de realización:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.3 · Escenario 3  
**Módulo:** `src/features/context-sources/adapters/ckan-datastore-context.adapter.ts`, su test, `src/app/api/context/ingest/route.ts`, fixtures en `Documentacion/Fuentes/muestras-contexto/`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-013, PBI-CTX-014, PBI-CTX-015  
**Bloquea:** PBI-CTX-017, PBI-CTX-018

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** un adaptador que baje del dataset al recurso y de ahí a registros,  
**Para** obtener actividades de la agenda cultural del Ajuntament sin tratar el paquete CKAN como un evento.

El tope de 20 entradas nuevas por fuente y ciclo no se toca. No hay LLM.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Fixtures):** Existen `ckan-package-show-agenda-cultural.json` y `ckan-datastore-agenda-cultural.json`, tomados de `package_show` y `datastore_search` del dataset `cultura-agenda-cultural`. El `fieldMap` sale de esos ficheros reales (`geo_epgs_4326_lat`, `geo_epgs_4326_lon`, `register_id`).
- [x] **CA-2 (Resolve):** `package_show?id={dataset}` se parsea con Zod (`CkanPackageShowResponseSchema`). `resourceSelector` selecciona de forma determinista un único recurso compatible (`CSV` con `datastore_active: true`). Si hay 0 o >1 recursos o si la configuración de extracción es inválida, se devuelve un sobre de error determinista (`OperationEnvelope`). El timeout (`signal: AbortSignal.timeout(config.timeoutMs)`) se aplica en el adaptador.
- [x] **CA-3 (Extract):** `datastore_search` se pagina con `limit` y `offset` hasta `maxRecords` o `result.total`. No se usa `datastore_search_sql`.
- [x] **CA-4 (Map):** Identificador compuesto `${sourceTag}:${externalId}` con recorte de UTF-8 BOM (`\ufeff`). Categoría tipada procedente de `source.category`. Normalización de fechas ISO UTC (`Z`), saneamiento de HTML en sumario, cálculo de `expiresAt` (fin + 1 día o inicio + 1 día), omisión de coordenadas fuera de la caja de Barcelona (lat 41.2–41.5, lng 2.0–2.3), y ordenación cronológica estricta (`startsAt` ascendente).
- [x] **CA-5 (Registro):** `defaultContextAdapters` en `src/app/api/context/ingest/route.ts` incluye la clave `CKAN_DATASTORE: new CkanDatastoreContextAdapter()`.
- [x] **CA-6 (Prueba):** Suite colocalizada `src/features/context-sources/adapters/ckan-datastore-context.adapter.test.ts` con 7 tests pasando en verde, validando fixtures reales, esquemas, paginación, manejo de ambigüedad, errores HTTP y saneamiento.
- [x] **CA-7 (Oráculos):** Compilación `npx tsc --noEmit` limpia, `npm run lint` en 0 warnings, suite completa de `vitest` (124 archivos, 698 tests pasando) y `npm run build` en código de salida 0.

---

## 3. Evidencias de Implementación y Oráculos

- **Código fuente:** `src/features/context-sources/adapters/ckan-datastore-context.adapter.ts`
- **Tests colocalizados:** `src/features/context-sources/adapters/ckan-datastore-context.adapter.test.ts`
- **Registro:** `src/app/api/context/ingest/route.ts`
- **Fixtures reales:**
  - `Documentacion/Fuentes/muestras-contexto/ckan-package-show-agenda-cultural.json`
  - `Documentacion/Fuentes/muestras-contexto/ckan-datastore-agenda-cultural.json`
- **Validación Oráculos:**
  - `npx tsc --noEmit` -> Exit 0
  - `npm run lint` -> Exit 0
  - `npx vitest run` -> 124 archivos pasados, 698 tests pasados
  - `npm run build` -> Exit 0
