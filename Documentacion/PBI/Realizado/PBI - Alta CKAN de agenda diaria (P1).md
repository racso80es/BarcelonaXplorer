# [ARQUITECTURA] PBI - Alta CKAN de agenda diaria

**Identificador:** PBI-CTX-023  
**Ref. de historia:** ALT-CKAN-01  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Alta de Datasets CKAN con Fixture de Registros](../../HistoriasDeUsuario/[ARQUITECTURA]%20Historia%20de%20Usuario:%20Alta%20de%20Datasets%20CKAN%20con%20Fixture%20de%20Registros.md) · §4 · §5 · Escenario 1  
**Módulo:** `Documentacion/Fuentes/muestras-contexto/`, `src/features/context-sources/context-sources.seed.yml`, `src/features/context-sources/adapters/ckan-datastore-context.adapter.test.ts`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-016, PBI-CTX-017  
**Orden de forja:** 023 → 024 → 025 → 026.  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** sembrar `agenda-diaria` solo si sus fixtures muestran una fila por actividad,  
**Para** ampliar el catálogo sin persistir fichas de paquete como eventos.

El adaptador `CKAN_DATASTORE` no se modifica. El `fieldMap` se lee del fixture de este dataset. No se copia el de `cultura-agenda-cultural`, incluido `geo_epgs_4326_*`. El tope de 20 entradas nuevas por fuente y ciclo no se toca. No hay LLM.

El segundo pase de `loadSeed` (`untouched`, `status` intacto) ya está cerrado en PBI-CTX-017. Este PBI no lo reimplementa.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Fixtures):** Existen `ckan-package-show-agenda-diaria.json` y `ckan-datastore-agenda-diaria.json` en `Documentacion/Fuentes/muestras-contexto/`, tomados de `package_show?id=agenda-diaria` y de `datastore_search` del recurso elegido. `<name>` es `agenda-diaria`, no el texto de `q=agenda`.
- [x] **CA-2 (Un recurso):** `resourceSelector` (`format: CSV` y `datastoreActive: true`) deja exactamente un solo recurso en el `package_show` (`877ccf66-9106-4ae2-be51-95a9f6469e4c`).
- [x] **CA-3 (Grano):** Cada registro del datastore, tras `groupBy: register_id`, cabe en un `ContextEntry` de categoría `EVENT`: hay inicio (`start_date`), fin (`end_date`), identificador estable (`register_id`) y `expiresAt` normalizado. Coordenadas válidas en la caja de Barcelona (lat 41.2–41.5 y lng 2.0–2.3).
- [x] **CA-4 (Semilla):** `context-sources.seed.yml` incorpora la entrada `sourceTag: bcn-agenda-diaria`, `type: CKAN_DATASTORE`, `category: EVENT`, `status: PENDING_APPROVAL`, `proposedBy: HUMAN`, endpoint canónico `https://opendata-ajuntament.barcelona.cat/data/api/3/action` y `extraction.dataset: agenda-diaria` con su respectivo `fieldMap` extraído del fixture.
- [x] **CA-5 (Prueba):** Test unitario incorporado en `ckan-datastore-context.adapter.test.ts` que simula `fetch()` contra los fixtures reales de `agenda-diaria`, validando la creación de entradas `EVENT` con `startsAt` válido e `id` único `bcn-agenda-diaria:${externalId}` sin BOM.
- [x] **CA-6 (Oráculos):** Ejecución limpia de `tsc --noEmit`, `npm run lint` y `npx vitest run` desde `src/`.

---

## 3. Resolución y Evidencias Técnicas

1. **Fixtures descargados:**
   - `Documentacion/Fuentes/muestras-contexto/ckan-package-show-agenda-diaria.json`
   - `Documentacion/Fuentes/muestras-contexto/ckan-datastore-agenda-diaria.json` (15 registros reales con datastore activo).
2. **Identificación de recurso unívoco:**
   - Recurso CSV activo: `877ccf66-9106-4ae2-be51-95a9f6469e4c` (`opendatabcn_agenda-csv.csv`).
3. **Mapeo declarativo incorporado en `context-sources.seed.yml`:**
   - `sourceTag`: `bcn-agenda-diaria`
   - `category`: `EVENT`
   - `status`: `PENDING_APPROVAL`
   - `fieldMap`:
     - `externalId`: `register_id`
     - `title`: `name`
     - `summary`: `["addresses_road_name", "addresses_neighborhood_name"]`
     - `startsAt`: `start_date`
     - `endsAt`: `end_date`
     - `locationName`: `addresses_road_name`
     - `lat`: `geo_epgs_4326_lat`
     - `lng`: `geo_epgs_4326_lon`
     - `tags`: `["addresses_district_name"]`
4. **Validación empírica:**
   - Vitest: 8/8 tests passed en `ckan-datastore-context.adapter.test.ts` (100/100 tests passed en el módulo).
   - TypeScript: `tsc --noEmit` exitoso sin errores.
   - ESLint: 0 warnings, 0 errors.
