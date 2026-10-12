# [ARQUITECTURA] PBI - Alta CKAN de mercats

**Identificador:** PBI-CTX-025  
**Ref. de historia:** ALT-CKAN-03  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Alta de Datasets CKAN con Fixture de Registros](../../HistoriasDeUsuario/[ARQUITECTURA]%20Historia%20de%20Usuario:%20Alta%20de%20Datasets%20CKAN%20con%20Fixture%20de%20Registros.md) · §2 · §4 · §5 · Escenario 2  
**Módulo:** `Documentacion/Fuentes/muestras-contexto/`, `src/features/context-sources/context-sources.seed.yml`, `src/features/context-sources/adapters/ckan-datastore-context.adapter.test.ts`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-016, PBI-CTX-017  
**Orden de forja:** Después de PBI-CTX-024.  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** identificar el `name` del dataset de mercados y sembrarlo solo si el fixture tiene un grano único,  
**Para** no asignar `EVENT` a un directorio de mercados por el veredicto de CTX-001.

CTX-001 no alcanza: registra `package_search?q=mercats` y mezcla directorio de mercados con eventos gastronómicos. El `name`, el recurso, las columnas y el grano salen de los fixtures. La categoría `EVENT` no se asigna hasta que el fixture muestre una actividad con inicio.

El dataset identificado empíricamente es `mercats-municipals`. Las filas no poseen fechas de actividad (`start_date` / `end_date` vacíos) y representan equipamientos permanentes; por tanto, se tipifica como categoría `VENUE` con TTL determinista (90 días). Se aprovecha `groupBy: register_id` para desduplicar repeticiones.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Name y fixtures):** El `name` del paquete queda documentado en `ckan-package-show-mercats-municipals.json` y `ckan-datastore-mercats-municipals.json`, tomados de `package_show?id=mercats-municipals` y de `datastore_search` del recurso elegido. No se usa la query `q=mercats` como endpoint.
- [x] **CA-2 (Un recurso):** `resourceSelector` (`format: CSV` y `datastoreActive: true`) deja un solo recurso en el `package_show` (`9caf3470-f325-4079-9884-8bc819104884`).
- [x] **CA-3 (Categoría según el grano):** El fixture muestra mercados municipales con nombre y coordenadas geográficas sin fechas de actividad: se tipifica estrictamente como `VENUE`. Se aplica `groupBy: register_id` para deduplicar filas con identificador idéntico. Coordenadas validadas en la caja geográfica de Barcelona.
- [x] **CA-4 (Semilla, si el grano es único):** Sembrada en `context-sources.seed.yml` con `sourceTag: bcn-mercats-municipals`, `type: CKAN_DATASTORE`, `category: VENUE`, `status: PENDING_APPROVAL`, `proposedBy: HUMAN`, endpoint `https://opendata-ajuntament.barcelona.cat/data/api/3/action`, `dataset: mercats-municipals` y `fieldMap` leído del fixture.
- [x] **CA-5 (Cierre sin semilla):** No aplicable, dado que el dataset posee grano unívoco de mercado (`VENUE`) y se siembra de acuerdo con CA-3 y CA-4.
- [x] **CA-6 (Prueba):** Añadido caso de prueba en `ckan-datastore-context.adapter.test.ts` para `bcn-mercats-municipals`, verificando la extracción de entradas `VENUE` con `id` único, localización, sumario y `expiresAt` con TTL válido.
- [x] **CA-7 (Oráculos):** Superados en verde los tres oráculos (`npx tsc --noEmit`, `npm run lint`, `npx vitest run`).

---

## 3. Resolución y Evidencias Técnicas

1. **Identificación empírica del dataset:**
   - Dataset: `mercats-municipals`
   - Recurso CSV datastore activo: `9caf3470-f325-4079-9884-8bc819104884`
   - Fixtures: `Documentacion/Fuentes/muestras-contexto/ckan-package-show-mercats-municipals.json` y `Documentacion/Fuentes/muestras-contexto/ckan-datastore-mercats-municipals.json`.
2. **Soporte de categoría `VENUE` en adaptador CKAN:**
   - Actualizado `CkanDatastoreContextAdapter` para permitir entidades de lugares (`VENUE` / `POI`) que carecen de fecha de inicio/fin, asignando TTL canónico de 90 días en `expiresAt` conforme a `ContextEntrySchema`.
3. **Semilla:**
   - Incorporada en `context-sources.seed.yml` bajo `sourceTag: bcn-mercats-municipals`, `category: VENUE`, `status: PENDING_APPROVAL`.
4. **Validación empírica:**
   - Vitest: 10/10 tests pasados exitosamente en `ckan-datastore-context.adapter.test.ts`.
   - TypeScript: `tsc --noEmit` sin errores.
   - ESLint: 0 warnings, 0 errors.
