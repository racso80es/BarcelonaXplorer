# [OPERATIVO] Documento Destilado: PBI - Ingesta en error de agenda cultural CKAN, catálogo package_search y ventana Socrata

**Identificador:** PBI-CTX-031
**Estatus:** Realizado
**Fecha de Creación:** 2026-10-14
**Fecha de Cierre:** 2026-10-14
**Historia de Usuario Relacionada:** [Extracción declarativa bifásica, minería de contenedores CKAN y saneamiento de fuentes hiperlocales](../../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md)
**Módulo:** `src/features/context-sources/context-sources.seed.yml`, `src/features/context-sources/adapters/socrata-context.adapter.ts`, `src/features/context-sources/ingest-context.use-case.ts`
**Entorno:** Producción (ciclo de ingesta y panel `/Admin/Context`)
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-CTX-016, PBI-CTX-018, PBI-CTX-021, PBI-CTX-029, PBI-CTX-030
**Bloqueo:** El código no llama a `transitionSource`. Si una fila ya está `DEGRADED`, la reactivación (CA-5) la ejecuta el operador. Si `bcn-opendata-ckan` sigue en el ciclo (CA-4), el `DEACTIVATE` también lo ejecuta el operador.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** En PRO hay tres endpoints marcados con error. No comparten causa. `bcn-agenda-cultural` pide un `dataset` que el portal ya no publica. `gencat-agenda-cultural` añade un `$where` que SoQL rechaza. `bcn-opendata-ckan` sigue siendo un catálogo `package_search` y el adaptador REST, a propósito, no lo interpreta. El panel no guarda el motivo: el caso de uso marca el fallo y descarta el texto del adaptador.
- **Entorno:** Sonda del 2026-10-14 contra los portales vivos, semilla `context-sources.seed.yml` y los adaptadores `CKAN_DATASTORE`, `SOCRATA` y `API_REST`. El cron ya corre (PBI-CTX-030): un fallo repetido deja la fila en `DEGRADED` al tercer `INGEST_FAIL`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Soberanía):* La forja no ejecuta `APPROVE`, `REACTIVATE` ni `DEACTIVATE`. No reescribe `status` en la semilla de una fila que el operador ya decidió.
  - *Filtro B (Grano):* `package_search?q=agenda` no vuelve a entrar en `API_REST`. PBI-CTX-018 lo sacó de ahí. Las otras cuatro fuentes CKAN que comparten el endpoint base respondieron 200 en la sonda y no se tocan.
  - *Filtro C (Señal):* El `$where` de la agenda Socrata usa la fecha de calendario que el portal acepta. `lastError` guarda el aviso del adaptador, no un texto genérico.

---

## 0. Hecho observado (sonda 2026-10-14)

Las tres URLs del borrador son el `endpoint` guardado en la fila. El adaptador no llama siempre a esa URL tal cual.

### 0.1 `bcn-agenda-cultural` — dataset inexistente

Endpoint de la fila: `https://opendata-ajuntament.barcelona.cat/data/api/3/action`.

Esa base la comparten cinco fuentes `CKAN_DATASTORE`. `GET` de la base sola responde 404; el adaptador no la usa así. Llama a `package_show?id={extraction.dataset}`.

La semilla pide `dataset: cultura-agenda-cultural`. El portal responde:

`404` · `{"success": false, "error": {"message": "Not found"}}`

El paquete vivo se llama `agenda-cultural`. `package_show?id=agenda-cultural` responde 200, con un único recurso CSV y `datastore_active: true` (`3abb2414-1ee0-446e-9c25-380e938adb73`). `datastore_search` de ese recurso responde 200 (5013 registros). El `fieldMap` actual encuentra `register_id`, `name`, `institution_name`, `addresses_road_name`, `start_date`, `end_date`, `geo_epgs_4326_lat` y `geo_epgs_4326_lon`.

El test del adaptador y la semilla fijan el identificador que 404. El fixture `ckan-package-show-agenda-cultural.json` ya trae `"name": "agenda-cultural"`.

Las otras cuatro, el mismo día, no fallan en la sonda. `package_show` 200 y un solo CSV con datastore activo:

| `sourceTag` | `dataset` |
|---|---|
| `bcn-agenda-diaria` | `agenda-diaria` |
| `bcn-agenda-esportiva` | `agenda-activitats-esportives` |
| `bcn-mercats-municipals` | `mercats-municipals` |
| `bcn-espais-verds` | `culturailleure-parcsjardins` |

Si el panel pinta la misma URL en varias filas, el defecto de este apartado es solo `bcn-agenda-cultural`.

### 0.2 `gencat-agenda-cultural` — `$where` con instante y zona horaria

Endpoint: `https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json?municipi=agenda:ubicacions/barcelona/barcelones/barcelona&$limit=25`.

Sin el añadido del adaptador, responde 200 y un array. `SocrataContextAdapter`, si la URL contiene `rhpv-yr4f` y no trae `$where`, concatena `$where=data_fi >= '<toISOString()>'`. Ese literal acaba en `Z`.

La columna `data_fi` es `calendar_date` (vista `rhpv-yr4f`). SoQL responde 400:

`query.soql.type-mismatch; Type mismatch for op>=, is text`

El mismo filtro con fecha de calendario, `$where=data_fi >= '2026-10-14'`, más `$order=data_inici ASC`, responde 200 y devuelve actividades vigentes (muestra: `data_fi` en 2027). `$order=data_inici ASC` solo, sin `$where`, también responde 200. El 400 lo provoca el literal con hora y `Z`, no la ordenación ni el filtro de municipio.

`{hoy}` hoy se sustituye por el mismo instante ISO. La semilla no usa ese marcador; el test sí. Los equipamientos (`48s6-82h2`) no llevan esas columnas y no deben recibir este `$where` (PBI-CTX-021).

### 0.3 `bcn-opendata-ckan` — catálogo que el adaptador REST rechaza a propósito

Endpoint: `https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_search?q=agenda`.

Responde 200 con `{ success, result: { count: 131, results: [...] } }`. `ApiRestContextAdapter` solo acepta un array o un objeto con `data` o `items`. El sobre es 422: el payload no cumple el esquema. Eso es el cierre de PBI-CTX-018. Volver a leer `result.results` reintroduce el grano de catálogo que PBI-CTX-012 sacó del corpus.

La semilla ya está en `INACTIVE`. `upsertFromSeed` no pisa el `status` de una fila existente. La auditoría de inanición la vio `ACTIVE` en PRO. Si el cron la sigue tomando, cada ciclo es `INGEST_FAIL` y al tercero pasa a `DEGRADED`. La corrección es sacarla del ciclo, no enseñarle CKAN al adaptador REST.

### 0.4 El panel no dice por qué

`IngestContextUseCase` llama a `applyIngestionResult(source, { success: fetchSuccess })` y no pasa `error`. La máquina guarda `Error de ingesta no especificado`. Por eso el borrador solo tenía URLs. El texto útil ya está en el sobre del adaptador (`feedback` y `errors`) y se tira.

Un array vacío es éxito del adaptador. No cuenta como `INGEST_FAIL`. Este PBI no cambia esa regla.

---

## 1. Declaración de Intención (INVEST)

**Como** operador de producción,
**Quiero** que la agenda cultural del Ajuntament y la de la Generalitat vuelvan a ingerirse, y que el catálogo `package_search` salga del ciclo,
**Para** que el cron deje de degradar fuentes cuyo portal responde y el panel muestre el motivo cuando una fuente falle de verdad.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Identificador CKAN vivo):** En `context-sources.seed.yml`, `bcn-agenda-cultural` queda con `extraction.dataset: agenda-cultural`. El resto de esa entrada no cambia: `type`, `category`, `status: PENDING_APPROVAL`, `proposedBy: HUMAN`, endpoint base, `resourceSelector`, `pageSize`, `maxRecords`, `timeoutMs`, `groupBy` y `fieldMap`. Las otras cuatro fuentes CKAN de la tabla del §0.1 no se editan. El test del adaptador que hoy espera `package_show?id=cultura-agenda-cultural` espera `package_show?id=agenda-cultural` y sigue usando el recurso `3abb2414-1ee0-446e-9c25-380e938adb73`. `upsertFromSeed` sigue sin escribir `status`, `failedAttempts`, `lastError` ni `lastErrorAt`.
- [x] **CA-2 (Fecha de calendario en la agenda Socrata):** Si el endpoint contiene `rhpv-yr4f`, el `$where` que añade el adaptador compara `data_fi` con la fecha UTC `YYYY-MM-DD` del instante del fetch. El literal no lleva hora ni `Z`. Se mantiene `$order=data_inici ASC` cuando la URL no trae `$order`. Si la URL ya trae `$where`, no se añade otro. Si contiene `{hoy}`, la sustitución usa esa misma fecha `YYYY-MM-DD`, entre comillas, y no queda el marcador. Un endpoint con `48s6-82h2` sale byte a byte igual que la fuente. El test que hoy exige un `$where` con `T` y hora pasa a exigir `data_fi >= 'YYYY-MM-DD'` y a fallar si el literal contiene `T` o `Z`.
- [x] **CA-3 (El fallo deja rastro):** Cuando el adaptador devuelve un sobre de error, `applyIngestionResult` recibe un `error` armado con `feedback` y el primer elemento de `errors`, recortado a 300 caracteres. No incluye el cuerpo HTTP ni la URL con query completa si el adaptador ya la metió en ese texto: se guarda el texto del sobre, no se vuelve a leer la respuesta. Si el adaptador no dejó texto, se conserva `Error de ingesta no especificado`. Un test del caso de uso, con el adaptador sustituido, comprueba que un 400 o un 422 deja ese aviso en `lastError` y que un éxito pone `lastError` a `null` por la transición `INGEST_OK` ya existente.
- [x] **CA-4 (Catálogo fuera del ciclo, acto soberano):** `ApiRestContextAdapter` no gana rama CKAN, no lee `result.results` y no reconoce `package_search`. La semilla de `bcn-opendata-ckan` sigue en `INACTIVE`. En PRO, si esa fila está `ACTIVE` o `DEGRADED`, el operador ejecuta `DEACTIVATE`. La forja no llama a `transitionSource`. La purga de fichas `bcn-opendata:*`, si aún existen, es el script ya cerrado en PBI-CTX-012; este PBI no lo reescribe. `DEACTIVATE` no borra `lastError`: el criterio es que el cron ya no la selecciona (`findByStatus('ACTIVE')`), no que el texto histórico desaparezca.
- [x] **CA-5 (Reactivar lo que el breaker ya apartó, acto soberano):** Tras desplegar CA-1 y CA-2, el operador mira en el panel el `status` de `bcn-agenda-cultural` y de `gencat-agenda-cultural`. Si alguna está `DEGRADED`, ejecuta `REACTIVATE`. La forja no lo hace. El siguiente ciclo con el portal en el estado de la sonda debe poder completar `INGEST_OK`: `package_show?id=agenda-cultural` no es 404, y la agenda Socrata no recibe un `$where` con `Z`. Si el ciclo devuelve cero entradas válidas, la fila permanece `ACTIVE` (éxito vacío, §0.4).
- [x] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` en verde sobre los tests tocados del slice `context-sources`. Cero `any`. Ningún test abre red ni usa la clave de un proveedor.

---

## 3. Acción kaizen (no recaer)

La recaída concreta es doble. El test del adaptador CKAN certificó `cultura-agenda-cultural`, un identificador que el portal responde 404, mientras el fixture ya se llamaba `agenda-cultural`. El test de PBI-CTX-021 certificó un `$where` con instante ISO, y SoQL lo rechaza porque `data_fi` es `calendar_date`. Un test que fija la URL no sustituye una sonda del literal contra el tipo de la columna.

La otra recaída es de lectura. Se retiró el parseo CKAN de `API_REST` y la fila de PRO puede seguir `ACTIVE`. Corregir el rojo de `package_search` enseñándole otra vez `result.results` deshace PBI-CTX-018 y PBI-CTX-012.

---

## 4. Fuera de alcance

- Cambiar `fieldMap` de `bcn-agenda-cultural`. En la muestra viva no aparece `interest_name`; las etiquetas salen vacías y eso no es un `INGEST_FAIL`.
- Las cuatro fuentes CKAN del §0.1 que respondieron 200. Mismo endpoint base, otro `dataset`.
- `gencat-equipaments-culturals` (`48s6-82h2`).
- Tratar un array vacío como fallo de ingesta.
- Borrar `lastError` en la transición `DEACTIVATE`.
- Añadir tests que llamen a los portales reales.
- Subir `timeoutMs` o tocar el sidecar cron.
