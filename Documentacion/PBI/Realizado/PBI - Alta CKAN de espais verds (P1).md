# [ARQUITECTURA] PBI - Alta CKAN de espais verds

**Identificador:** PBI-CTX-026  
**Ref. de historia:** ALT-CKAN-04  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Alta de Datasets CKAN con Fixture de Registros](../../HistoriasDeUsuario/[ARQUITECTURA]%20Historia%20de%20Usuario:%20Alta%20de%20Datasets%20CKAN%20con%20Fixture%20de%20Registros.md) · §2 · §4 · §5 · Escenario 2  
**Módulo:** `Documentacion/Fuentes/muestras-contexto/`, `src/features/context-sources/context-sources.seed.yml`, `src/features/context-sources/adapters/ckan-datastore-context.adapter.test.ts`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-016, PBI-CTX-017  
**Orden de forja:** Después de PBI-CTX-025.  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** identificar el `name` del dataset de espacios verdes y sembrarlo solo si cada fila es un lugar,  
**Para** no dar por bueno el veredicto *Viable* de CTX-001, que sale de `package_search?q=espais-verds`.

El dataset canónico de espacios verdes y parques urbanos en Open Data Barcelona se identifica como `culturailleure-parcsjardins`. Sus registros corresponden a parques y jardines georreferenciados sin fechas de actividad, por lo que se modelan bajo la categoría `POI` con TTL canónico de 90 días en `expiresAt`.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Name y fixtures):** El `name` del paquete queda documentado en `ckan-package-show-culturailleure-parcsjardins.json` y `ckan-datastore-culturailleure-parcsjardins.json`, tomados de `package_show?id=culturailleure-parcsjardins` y de `datastore_search` del recurso elegido. No se usa la query `q=espais-verds` como endpoint.
- [x] **CA-2 (Un recurso):** `resourceSelector` (`format: CSV` y `datastoreActive: true`) deja un solo recurso compatible (`b64d32a8-aea5-47a8-9826-479b211f5d46`).
- [x] **CA-3 (Categoría según el grano):** El fixture muestra parques y jardines con nombre y coordenadas geográficas sin fechas de actividad: se tipifica estrictamente como `POI`. Se aplica `groupBy: register_id` para desduplicar repeticiones de filas. Coordenadas validadas en la caja geográfica de Barcelona.
- [x] **CA-4 (Semilla, si el grano es único):** Incorporada a `context-sources.seed.yml` con `sourceTag: bcn-espais-verds`, `type: CKAN_DATASTORE`, `category: POI`, `status: PENDING_APPROVAL`, `proposedBy: HUMAN`, endpoint `https://opendata-ajuntament.barcelona.cat/data/api/3/action`, `dataset: culturailleure-parcsjardins` y `fieldMap` leído del fixture.
- [x] **CA-5 (Cierre sin semilla):** No aplica al haber verificado un grano unívoco de lugar (`POI`) con recurso compatible.
- [x] **CA-6 (Prueba):** Test unitario en `ckan-datastore-context.adapter.test.ts` para `bcn-espais-verds`, obteniendo entradas `POI` con `id` único y localización geográfica que pasan `ContextEntrySchema`.
- [x] **CA-7 (Oráculos):** Superados en verde los tres oráculos (`npx tsc --noEmit`, `npm run lint`, `npx vitest run`).

---

## 3. Resolución y Evidencias Técnicas

1. **Identificación empírica del dataset:**
   - Dataset: `culturailleure-parcsjardins`
   - Recurso CSV datastore activo: `b64d32a8-aea5-47a8-9826-479b211f5d46`
   - Fixtures: `Documentacion/Fuentes/muestras-contexto/ckan-package-show-culturailleure-parcsjardins.json` y `Documentacion/Fuentes/muestras-contexto/ckan-datastore-culturailleure-parcsjardins.json`.
2. **Semilla:**
   - Registrada en `context-sources.seed.yml` bajo `sourceTag: bcn-espais-verds`, `category: POI`, `status: PENDING_APPROVAL`.
3. **Validación empírica:**
   - Vitest: 11/11 tests pasados exitosamente en `ckan-datastore-context.adapter.test.ts`.
   - TypeScript: `tsc --noEmit` sin errores.
   - ESLint: 0 warnings, 0 errors.
