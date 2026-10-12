# [ARQUITECTURA] PBI - Alta CKAN de agenda deportiva

**Identificador:** PBI-CTX-024  
**Ref. de historia:** ALT-CKAN-02  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Alta de Datasets CKAN con Fixture de Registros](../../HistoriasDeUsuario/[ARQUITECTURA]%20Historia%20de%20Usuario:%20Alta%20de%20Datasets%20CKAN%20con%20Fixture%20de%20Registros.md) · §4 · §5 · Escenario 1  
**Módulo:** `Documentacion/Fuentes/muestras-contexto/`, `src/features/context-sources/context-sources.seed.yml`, `src/features/context-sources/adapters/ckan-datastore-context.adapter.test.ts`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-016, PBI-CTX-017  
**Orden de forja:** Después de PBI-CTX-023. Los cuatro tocan la misma semilla y el mismo test.  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** sembrar `agenda-activitats-esportives` solo si sus fixtures muestran una fila por actividad,  
**Para** tener la agenda deportiva del Ajuntament como `EVENT` sin tratar el paquete CKAN como un evento.

El adaptador `CKAN_DATASTORE` no se modifica. El `fieldMap` se lee del fixture de este dataset. No se copia el de `cultura-agenda-cultural` ni el de la agenda diaria. El tope de 20 entradas nuevas por fuente y ciclo no se toca. No hay LLM.

El segundo pase de `loadSeed` ya está cerrado en PBI-CTX-017.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Fixtures):** Existen `ckan-package-show-agenda-activitats-esportives.json` y `ckan-datastore-agenda-activitats-esportives.json` en `Documentacion/Fuentes/muestras-contexto/`, tomados de `package_show?id=agenda-activitats-esportives` y de `datastore_search` del recurso elegido.
- [x] **CA-2 (Un recurso):** `resourceSelector` (`format: CSV` y `datastoreActive: true`) deja exactamente un solo recurso compatible (`ab2d47b7-8493-4ed5-9f63-49ed116135f9`).
- [x] **CA-3 (Grano):** Cada registro, tras `groupBy: register_id`, cabe en un `ContextEntry` de categoría `EVENT` con inicio (`start_date`), fin (`end_date`), identificador estable (`register_id`) y coordenadas geográficas verificadas en la delimitación de Barcelona (lat 41.2–41.5 y lng 2.0–2.3).
- [x] **CA-4 (Semilla):** Registrada en `context-sources.seed.yml` la fuente `sourceTag: bcn-agenda-esportiva`, `type: CKAN_DATASTORE`, `category: EVENT`, `status: PENDING_APPROVAL`, `proposedBy: HUMAN`, endpoint `https://opendata-ajuntament.barcelona.cat/data/api/3/action` y `extraction.dataset: agenda-activitats-esportives` con `fieldMap` extraído del fixture.
- [x] **CA-5 (Prueba):** Añadido caso de prueba en `ckan-datastore-context.adapter.test.ts` para `bcn-agenda-esportiva`, verificando que se extraen entradas `EVENT` válidas con `startsAt` ISO e `id` único `${sourceTag}:${externalId}`.
- [x] **CA-6 (Oráculos):** Aprobación limpia de `npx tsc --noEmit`, `npm run lint` y `npx vitest run` desde `src/`.

---

## 3. Resolución y Evidencias Técnicas

1. **Fixtures generados y preservados:**
   - `Documentacion/Fuentes/muestras-contexto/ckan-package-show-agenda-activitats-esportives.json`
   - `Documentacion/Fuentes/muestras-contexto/ckan-datastore-agenda-activitats-esportives.json` (15 registros reales con datastore activo).
2. **Identificación de recurso unívoco:**
   - Recurso CSV activo: `ab2d47b7-8493-4ed5-9f63-49ed116135f9` (`opendatabcn_agenda-esportiva-csv.csv`).
3. **Mapeo declarativo incorporado en `context-sources.seed.yml`:**
   - `sourceTag`: `bcn-agenda-esportiva`
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
   - Vitest: 9/9 tests pasados exitosamente en `ckan-datastore-context.adapter.test.ts`.
   - TypeScript: `tsc --noEmit` exitoso sin errores.
   - ESLint: 0 warnings, 0 errors.
