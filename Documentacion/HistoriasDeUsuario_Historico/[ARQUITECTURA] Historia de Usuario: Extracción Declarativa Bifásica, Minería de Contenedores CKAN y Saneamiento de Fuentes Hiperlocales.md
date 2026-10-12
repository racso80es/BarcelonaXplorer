# [ARQUITECTURA] Historia de Usuario: Extracción Declarativa Bifásica, Minería de Contenedores CKAN y Saneamiento de Fuentes Hiperlocales

**Estatus:** Realizada / Cerrada (PBIs [PBI-CTX-012](../PBI/Realizado/PBI%20-%20Contenci%C3%B3n%20de%20bcn-opendata-ckan%20y%20purga%20del%20corpus%20%28P1%29.md) a [PBI-CTX-022](../PBI/Realizado/PBI%20-%20Festivos%20iCal%20sin%20precio%20impuesto%20%28P3%29.md) completados y validados; REF-CTX-06 no tiene PBI).  
**Identificador numérico:** Pendiente de asignación por el Vértice Biológico. `HU 19` ya nombra la historia de Linear Tracker y `HU 20` el blindaje de despliegue.  
**Fecha de emisión:** 2026-10-12  
**Fecha de refinamiento:** 2026-10-12  
**Autor:** Vértice Biológico (Racso) & Nodo de Control (Tormentosa)  
**Precedente directo:** [ESTUDIO-CTX-002](../Fuentes/%5BESTUDIO%5D%20Contexto%20Vigente%20de%20Fuentes%20Locales%20y%20Refactorizaciones%20de%20Miner%C3%ADa%20de%20Contenedores.md) · [HU 18](./%5BARQUITECTURA%5D%20HU%2018:%20Motor%20de%20Contexto%20Aut%C3%B3nomo,%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md)  
**Marco normativo:** Protocolo de Acero S+ · Axiomas I, II, III y IV · Códice (`TC-PRISMA-001`, `TC-ZOD-001`, `TC-TS-001`, `TC-TEST-001`)

---

## 1. Descripción

**Como** operador del motor de contexto de BarcelonaXplorer,  
**Quiero** que cada fuente declare cómo se extraen sus ítems, que el catálogo CKAN del Ajuntament se resuelva en registros atómicos y que las fichas de dataset ya persistidas salgan de `context_memory`,  
**Para** que el RAG recupere actividades y lugares, y deje de recuperar metadatos de catálogo.

El resultado de un ciclo de ingesta sigue siendo como máximo **20 entradas nuevas por fuente** (`MAX_NEW_ENTRIES_PER_SOURCE` en `ingest-context.use-case.ts`). Esta historia no eleva ese tope ni promete miles de vectores en un solo ciclo.

---

## 2. Hechos vigentes (contrastados con el código el 2026-10-12)

Estos hechos fijan el alcance. Lo que no aparece aquí no se da por implementado.

| Hecho | Dónde |
|---|---|
| Seis fuentes `ACTIVE` en semilla, sin bloque `extraction`. `bcn-opendata-ckan` apunta a `package_search?q=agenda` con tipo `API_REST`. | `context-sources.seed.yml` |
| `ApiRestContextAdapter` trata cada elemento de `result.results[]` como un evento: `id` con prefijo literal `bcn-opendata:`, `category` forzada a `EVENT`, TTL fijo de 30 días, sin fechas ni coordenadas. Ignora `resources[]`. | `adapters/api-rest-context.adapter.ts` |
| El documento en LanceDB usa ese `id` (`bcn-opendata:${id del package}`). El SHA-256 vive en `metadata.contentHash`, no es la clave del documento. | `ingest-context.use-case.ts` |
| `upsertFromSeed` **no pisa** `status`, `failedAttempts` ni la bitácora de una fila ya existente. Cambiar el YAML a `INACTIVE` no desactiva la fuente en MySQL. | `prisma-context-source.repository.ts` |
| La desactivación legal es el evento `DEACTIVATE` del actor `HUMAN` desde `ACTIVE` o `DEGRADED` hacia `INACTIVE`. `ContextAdminService.transitionSource` no escribe telemetría. | `context-source-state-machine.ts`, `context-admin.service.ts` |
| Un fallo de fetch (incluido `AbortSignal.timeout(10000)`) cuenta como `INGEST_FAIL`. La fuente pasa a `DEGRADED` al **tercer** fallo consecutivo, no al primero. El timeout está en cada adaptador, no en el caso de uso. | Adaptadores y máquina de estados |
| `loadSeed` valida el YAML entero. Un fallo Zod devuelve `OperationEnvelope` con `exitCode` 422 y no hace upsert. No rechaza una sola fuente dejando el resto. | `context-source-seed.service.ts` |
| `loadSeed` solo se invoca con el catálogo vacío. Los dos call sites son `IngestContextUseCase` (`allSources.length === 0`) y `ContextSourcesCard` (`sources.length === 0`). No hay endpoint de sincronización ni hook de arranque que lo llame. | `ingest-context.use-case.ts`, `ContextSourcesCard.tsx` |
| En una fila ya existente, `upsertFromSeed` escribe `displayName`, `endpoint`, `type` y `category`. No existe columna `extractionConfig`. | `prisma-context-source.repository.ts` |
| `purge-fallback-vectors.ts` borra vectores de fallback por recálculo del embedding. No borra por prefijo de fuente. El puerto sí borra por `{ ids: string[] }`. | `cognitive-memory/` |
| El esquema de producción se aplica con el DDL de `ansible/hooks/after_symlink.yml` (`CREATE TABLE IF NOT EXISTS`). Ese `CREATE` no altera una tabla ya creada. El enum MySQL actual es `API_REST`, `SOCRATA`, `JSON_LD`, `ICAL`, `RSS`, `SPARQL`. | `after_symlink.yml` |
| El registro de adaptadores que ejecuta el cron está en `src/app/api/context/ingest/route.ts`. Su tipo es `ContextAdapterRegistry = Partial<Record<ContextSourceType, IContextSourceAdapter>>`. Una clave ausente compila. En ejecución, una fuente `ACTIVE` de ese tipo cuenta como `INGEST_FAIL`. El slice no tiene un `switch` exhaustivo sobre `ContextSourceType`. | `context-source-adapter.port.ts`, `route.ts`, `ingest-context.use-case.ts` |
| El contenedor de base de datos es `mysql:8.0` (`docker-compose.yml` y el nodo de producción). | `src/docker-compose.yml` |
| El panel Admin pinta `item.type` como texto. No hay un desplegable de tipos que actualizar. | `ContextSourcesTableClient.tsx` |
| `ContextEntrySchema` exige `summary` de 10 a 1200 caracteres, `startsAt`/`endsAt`/`expiresAt` como datetime con zona, y coordenadas dentro de lat 41.2–41.5 y lng 2.0–2.3. Una coordenada fuera de rango invalida la entrada entera si se incluye en `location`. | `context-entry.schema.ts` |
| SPARQL ya parsea la respuesta con Zod. La consulta selecciona `?description` y no lo enlaza, así que el adaptador cae al resumen sintético. El servicio de etiquetas de Wikidata rellena `?itemLabel` y `?itemDescription`, no `?description`. | `sparql-context.adapter.ts` |
| Socrata y el resto de adaptadores comparten el mismo `fetch(source.endpoint)`. Agenda (`rhpv-yr4f`) y equipamientos (`48s6-82h2`) son endpoints distintos. Solo la agenda tiene `data_inici` / `data_fi`. | `socrata-context.adapter.ts`, semilla |
| iCal impone `price: 'Gratis'` y tags `festiu` / `oficial` / `barcelona`. El fixture `bcn-festes.ics` trae `DESCRIPTION` con valores reales (`Festes estatals`, `Festes autonòmiques`, `Festes locals de Barcelona`). El test afirma `price === 'Gratis'`. | `ical-context.adapter.ts` y su test |
| RSS lee `<description>` y ya recorta a 1200. El fixture `beteve-agenda.rss` incluye `<content:encoded>` y un ítem de categoría `mobilitat`, no cultural. El `id` va prefijado con el literal `beteve:`. | `rss-context.adapter.ts` |
| `MaintainContextUseCase` clasifica cualquier URL con `opendata-ajuntament` como `SOCRATA`. | `maintain-context.use-case.ts` |

`TC-ZOD-001` obliga a la API de Zod 4 en esquemas nuevos. `TC-TS-001` prohíbe `as unknown as T` en producción. El estrechamiento `as Record<string, unknown>` se sustituye por un esquema Zod en las fronteras JSON que esta historia toque; no se reescribe el proyecto entero.

---

## 3. Alcance

### 3.1 REF-CTX-01 · Contención de `bcn-opendata-ckan` (P1)

1. En bases nuevas, la semilla queda en `status: INACTIVE` para que el primer `loadSeed` no la cree `ACTIVE`.
2. En bases ya pobladas, la desactivación es el evento `DEACTIVATE` (actor `HUMAN`) desde el panel Admin o el servicio de administración. Recargar la semilla no cambia el estado.
3. Si se exige rastro de auditoría, este PBI añade el apunte de telemetría en `transitionSource`. Hoy ese apunte no existe.
4. Purga de `context_memory`: localizar documentos cuyo `id` empieza por `bcn-opendata:` (y, en la misma pasada, `metadata.sourceTag = bcn-opendata-ckan`) y borrarlos con `{ ids }` del puerto vectorial. Dry-run por defecto. No reutilizar `purge-fallback-vectors.ts`. El listado del Admin (`limit` 100) no es la purga.

### 3.2 REF-CTX-02 · `extraction` solo para CKAN (P1)

Un bloque opcional `extraction` en la semilla y una columna `extractionConfig` (JSON nullable) en `ContextSource`. El repositorio la convierte a un value object de dominio y no deja salir tipos de `@prisma/client` (`TC-PRISMA-001`).

La unión discriminada de la primera entrega tiene una sola estrategia, `CKAN_DATASTORE`, en el esquema de `extraction`. Ese literal no se añade aquí a `ContextSourceTypeSchema`: es el discriminante del bloque, no el tipo de fuente. No se declaran estrategias `RSS_ENRICHED`, `SPARQL_CUSTOM` ni `SOCRATA_WINDOW`.

Contrato de la estrategia:

- `dataset`: identificador de `package_show`.
- `resourceSelector`: `format` y `datastoreActive` para elegir el recurso en cada ejecución. El `resource_id` no se guarda en la semilla.
- `fieldMap`: nombres de campo confirmados contra un fixture, no contra el borrador del estudio. El estudio escribe `geo_epgs_4326_*`; esa grafía se verifica en el JSON real antes de fijarla.
- `pageSize`, `maxRecords`, `timeoutMs` (entero, por defecto 10000 en el resto de adaptadores; el valor CKAN se fija cuando el fixture de latencia lo justifique).
- `groupBy`: opcional. Solo se activa si el fixture muestra más de una fila por identificador de actividad.

Validación: el YAML se acepta o se rechaza entero, como hoy. `extraction` ausente es válido. `extraction` malformada produce `exitCode` 422 y cero upserts.

Persistencia en producción, en el mismo playbook `ansible/hooks/after_symlink.yml` y contra `mysql:8.0`:

- El `CREATE TABLE IF NOT EXISTS` de `context_sources` se actualiza para una base que aún no existe (columna `extractionConfig` JSON NULL). En el Nodo 11 la tabla ya existe: ese `CREATE` no la altera.
- La columna nueva, en una tabla ya creada, sale de una sonda a `INFORMATION_SCHEMA.COLUMNS` (`TABLE_SCHEMA = DATABASE()`, `TABLE_NAME = 'context_sources'`, `COLUMN_NAME = 'extractionConfig'`) y de un `ALTER TABLE ... ADD COLUMN` solo cuando el recuento es 0. MySQL 8.0 rechaza `ADD COLUMN IF NOT EXISTS` (error 1064). Un `ADD COLUMN` a pelo en el segundo despliegue falla con 1060 (`Duplicate column name`). La sonda puede ir en el `shell` del playbook o en un `PREPARE`/`EXECUTE`; las dos formas son válidas. El `ENUM` de `type` no se toca en este PBI.
- `upsertFromSeed`, en fila nueva y en fila existente, persiste `extractionConfig`. Sigue sin escribir `status`, `failedAttempts` ni la bitácora de errores. El update compara el objeto ya parseado, no el texto del YAML: si el valor es el mismo, la fila cuenta como `untouched`.

El caso de uso de ingesta no recibe el timeout. Lo lee el adaptador que abre el socket.

### 3.3 REF-CTX-03 · Tipo, adaptador y alta (P1)

**REF-CTX-03 (tipo).** `CKAN_DATASTORE` entra en `ContextSourceTypeSchema` y en el enum de Prisma en este PBI. El repositorio ya asigna `source.type` al cliente Prisma: si el literal está solo en Zod, `tsc --noEmit` falla en `prisma-context-source.repository.ts`; si está solo en Prisma, `ContextSourceSnapshotSchema.parse` rechaza la fila en runtime. `route.ts` no entra en ese PBI. `ContextAdapterRegistry` es un `Partial`, así que el mapa puede seguir sin la clave y el oráculo compila. La clave se registra en el PBI del adaptador, antes de que nadie pase la fuente a `ACTIVE`: una fuente activa sin adaptador suma `INGEST_FAIL` y, al tercer ciclo, `DEGRADED`.

El `ENUM` MySQL se amplía con `MODIFY COLUMN` listando los seis valores actuales más `CKAN_DATASTORE`. Repetir ese `MODIFY` en el despliegue siguiente es válido en MySQL 8.0. No usa `IF NOT EXISTS`.

**REF-CTX-03a (adaptador).** Adaptador colocalizado `adapters/ckan-datastore-context.adapter.ts` con test, registrado en `defaultContextAdapters`.

Tres fases, sin LLM (Filtro C de HU 18: lo ya estructurado no pasa por el gateway):

1. **Resolve.** `package_show?id={dataset}`, respuesta parseada con Zod. Elección determinista del recurso según `resourceSelector`. Si hay cero o más de un recurso compatible, la fuente falla con sobre de error y no inventa un recurso.
2. **Extract.** `datastore_search` con `limit` y `offset`, hasta `maxRecords` o hasta `result.total`. El avance es `offset`/`total`. `_links.next` solo se usa si el fixture lo trae; no es el contrato. `datastore_search_sql` queda fuera hasta que una sonda devuelva 200 en este portal: el filtro exacto de `datastore_search` no expresa `end_date >= hoy`. La ventana temporal, si hace falta, se aplica en memoria sobre el lote ya acotado.
3. **Map.** `fieldMap` hacia `ContextEntry`. Fechas de solo día se normalizan a datetime con zona (`…T00:00:00.000Z`) porque el esquema rechaza una fecha sin hora. HTML de campos marcados en el mapa se reduce a texto. `id = ${sourceTag}:${externalId}`. `category` sale de `source.category`. `expiresAt` es `endsAt + 1 día`; si no hay fin y sí hay inicio, el fin es el inicio. Sin ninguna fecha parseable, la fila no entra. Coordenadas fuera de la caja de Barcelona se omiten del `location` (el ítem puede sobrevivir con `name`); no se fuerzan dentro del esquema.

Orden de salida: `startsAt` ascendente, para que el corte de 20 entradas del caso de uso se quede con lo más próximo.

**Alta de fuentes.** Solo `bcn-agenda-cultural`, en `PENDING_APPROVAL`, cuando existan los fixtures `ckan-package-show-agenda-cultural.json` y `ckan-datastore-agenda-cultural.json` y el `fieldMap` coincida con ellos. `agenda-diaria` y `agenda-activitats-esportives` esperan su propio fixture: la sonda del estudio vio que tienen CSV en datastore, no el mapa de columnas. `mercats` y `espais-verds` siguen siendo los candidatos E1/E2 de CTX-001, verificados solo como `package_search` (el mismo patrón contenedor). No se dan de alta en esta historia.

**REF-CTX-03b (disparo) y la línea de semilla.** Escribir la entrada en `context-sources.seed.yml` no la inserta en una base que ya tiene filas. `upsertFromSeed` sí crea un `sourceTag` ausente, pero solo si `loadSeed` llega a ejecutarse. REF-CTX-03b quita la guarda de catálogo vacío en los dos call sites (`IngestContextUseCase` y `ContextSourcesCard`). `loadSeed` corre al principio del ciclo de ingesta y al pintar el panel, también con las seis fuentes ya cargadas. Un `exitCode` 422 no corta la ingesta de las fuentes que ya están en MySQL: el caso de uso hoy ignora el sobre, y este PBI debe leerlo. La fila nueva nace `PENDING_APPROVAL` y no entra en el ciclo hasta un `APPROVE` humano. No se añade un endpoint ni un hook de arranque: no existen, y los dos call sites ya cubren el cron y el panel. La línea de `bcn-agenda-cultural` va en la misma entrega: sin ella el disparo no tiene una fila nueva que crear. Esa línea es el cuarto archivo; la guarda está duplicada fuera del slice y no cabe en tres rutas.

`groupBy` (por ejemplo `register_id`) se incluye en el test únicamente si el fixture de agenda cultural repite el identificador. Si cada actividad ocupa una fila, el adaptador no agrupa.

Argos no se modifica. Las fuentes nuevas nacen de la semilla, no de la clasificación por URL.

### 3.4 REF-CTX-04 · `API_REST` genérico (P2)

Cuando `CKAN_DATASTORE` cubra el catálogo municipal, el adaptador REST deja de reconocer `package_search`, el literal `bcn-opendata:` y la categoría fija `EVENT`. El `id` usa `source.sourceTag`, la categoría usa `source.category` y el JSON de entrada pasa por Zod.

El test actual, atado a `bcn-opendata-ckan.json`, se sustituye por un JSON plano. Los prefijos literales de los otros adaptadores (`beteve:`, `wikidata:`, `gencat-agenda:`, `bcn-festes:`) quedan fuera de este PBI.

### 3.5 REF-CTX-05 · RSS de Betevé (P2)

Preferir el texto de `<content:encoded>` (sin HTML, recortado a 1200, mínimo 10) cuando venga informado; si no, `<description>`.

Una lista blanca de `<category>` solo entra si se declara en configuración y hay un fixture con al menos un ítem que la cumple y el ítem `mobilitat` del fixture actual, que debe quedar excluido. Cambiar el endpoint `https://beteve.cat/feed/` exige antes una respuesta 200 de un feed de sección. Hasta esa sonda, el feed generalista sigue siendo el de la semilla.

No se marca el tag `agregador`. No hay una regla determinista que distinga un artículo de varios planes, y esta historia no usa un LLM para inventarla.

### 3.6 REF-CTX-06 · JSON-LD de segundo nivel

No se implementa. Sigue bloqueado por la reserva TDM ya registrada en CTX-001 para Time Out. El adaptador actual, que ignora un `WebPage` sin `Event`, se mantiene.

### 3.7 REF-CTX-07 · Consultas de fuentes atómicas (P3)

Tres PBIs separados. Cada uno cabe en el adaptador, su test y, si hace falta, la línea de semilla.

- **SPARQL.** Enlazar `?description` con prioridad de lengua `ca`, luego `es`, luego `en`, una fila por monumento. El esquema Zod del adaptador ya espera `description`, no `itemDescription`.
- **Socrata.** Añadir orden por `data_inici` ascendente y filtro `data_fi` desde el instante del fetch solo en el endpoint de agenda (`rhpv-yr4f`). El endpoint de equipamientos no recibe ese `$where`.
- **iCal.** Dejar de escribir `price` y la terna fija de tags. El tag sale del `DESCRIPTION` del fixture (un valor como `Festes estatals`). Actualizar el test que hoy exige `price === 'Gratis'`.

---

## 4. Desglose y archivos

El umbral del Axioma I se cumple dentro de cada fila, no sumando toda la historia. REF-CTX-03b es la excepción: la guarda de `loadSeed` está copiada en el caso de uso y en el panel, y la semilla es el cuarto archivo de esa entrega.

| Ref. | Prioridad | Archivos | Cierre |
|---|---|---|---|
| REF-CTX-01 | P1 | `context-sources.seed.yml`; purga en `context-sources`; listado paginado de `context_memory` en el puerto vectorial (no existe hoy). Sin telemetría en `transitionSource` | 0 documentos `bcn-opendata:` / `sourceTag` `bcn-opendata-ckan`. Fila viva en `INACTIVE` por `DEACTIVATE` humano. Semilla `INACTIVE` para instalaciones nuevas. |
| REF-CTX-02a | P1 | `context-source.types.ts`, `context-source-seed.service.ts`, `context-source-seed.service.test.ts` | Semilla actual válida sin `extraction`. Estrategia desconocida o mapa incompleto: `exitCode` 422 y ningún upsert. `ContextSourceTypeSchema` sigue con los seis valores actuales. |
| REF-CTX-02b | P1 | `schema.prisma`, `prisma-context-source.repository.ts`, `ansible/hooks/after_symlink.yml` | Columna `extractionConfig` en Prisma y, en MySQL 8.0, `ADD COLUMN` condicionado a `INFORMATION_SCHEMA.COLUMNS`. Create y update de `upsertFromSeed` persisten ese JSON y no tocan `status`. Sin valor nuevo en el enum `type`. |
| REF-CTX-03 | P1 | `context-source.types.ts`, `schema.prisma`, `ansible/hooks/after_symlink.yml` | Literal `CKAN_DATASTORE` en Zod y en Prisma a la vez. `MODIFY COLUMN` del `ENUM` con los siete valores. `route.ts` sigue sin la clave; `tsc --noEmit` pasa porque el registro es `Partial`. |
| REF-CTX-03a | P1 | `ckan-datastore-context.adapter.ts`, su test, `src/app/api/context/ingest/route.ts` | Fixture de agenda cultural: al menos una entrada con `startsAt` datetime, `id` único y coordenadas solo dentro de la caja. Clave `CKAN_DATASTORE` en `defaultContextAdapters`. |
| REF-CTX-03b | P1 | `ingest-context.use-case.ts`, su test, `ContextSourcesCard.tsx`; semilla `context-sources.seed.yml` en la misma entrega | Con las seis filas ya presentes, `loadSeed` crea `bcn-agenda-cultural` en `PENDING_APPROVAL` y rellena `extractionConfig`. Un YAML inválido no aborta el ciclo. Sin `mercats` ni `espais-verds`. |
| REF-CTX-04 | P2 | `api-rest-context.adapter.ts`, su test | Cero literales `bcn-opendata` y cero rama `package_search`. |
| REF-CTX-05 | P2 | `rss-context.adapter.ts`, su test, semilla solo si la sonda del feed cultural ya respondió 200 | `content:encoded` alimenta `summary` cuando existe. |
| REF-CTX-07a | P3 | `sparql-context.adapter.ts`, su test | El fixture con `description` en `ca` no cae al resumen sintético. Una URI, una entrada. |
| REF-CTX-07b | P3 | `socrata-context.adapter.ts`, su test | La URL de agenda lleva orden y ventana; la de equipamientos, no. |
| REF-CTX-07c | P3 | `ical-context.adapter.ts`, su test | Sin `price: 'Gratis'`. Tag tomado de `DESCRIPTION`. |

REF-CTX-06 no tiene PBI: el crawl JSON-LD sigue bloqueado.

| Ref. | PBI |
|---|---|
| REF-CTX-01 | [PBI-CTX-012](../PBI/Realizado/PBI%20-%20Contenci%C3%B3n%20de%20bcn-opendata-ckan%20y%20purga%20del%20corpus%20%28P1%29.md) |
| REF-CTX-02a | [PBI-CTX-013](../PBI/Realizado/PBI%20-%20Esquema%20Zod%20de%20extracci%C3%B3n%20CKAN%20en%20la%20semilla%20%28P1%29.md) |
| REF-CTX-02b | [PBI-CTX-014](../PBI/Realizado/PBI%20-%20Columna%20extractionConfig%20y%20ALTER%20idempotente%20en%20MySQL%208.0%20%28P1%29.md) |
| REF-CTX-03 | [PBI-CTX-015](../PBI/Realizado/PBI%20-%20Tipo%20de%20fuente%20CKAN_DATASTORE%20en%20Zod,%20Prisma%20y%20MySQL%20%28P1%29.md) |
| REF-CTX-03a | [PBI-CTX-016](../PBI/Realizado/PBI%20-%20Adaptador%20bif%C3%A1sico%20CKAN_DATASTORE%20%28P1%29.md) |
| REF-CTX-03b | [PBI-CTX-017](../PBI/Realizado/PBI%20-%20Carga%20de%20semilla%20en%20cat%C3%A1logo%20poblado%20y%20alta%20de%20bcn-agenda-cultural%20%28P1%29.md) |
| REF-CTX-04 | [PBI-CTX-018](../PBI/Realizado/PBI%20-%20Adaptador%20API_REST%20sin%20heur%C3%ADstica%20CKAN%20%28P2%29.md) |
| REF-CTX-05 | [PBI-CTX-019](../PBI/Realizado/PBI%20-%20RSS%20de%20Betev%C3%A9%20con%20content%20encoded%20%28P2%29.md) |
| REF-CTX-07a | [PBI-CTX-020](../PBI/Realizado/PBI%20-%20Descripci%C3%B3n%20enlazada%20en%20la%20consulta%20SPARQL%20de%20Wikidata%20%28P3%29.md) |
| REF-CTX-07b | [PBI-CTX-021](../PBI/Realizado/PBI%20-%20Ventana%20temporal%20solo%20en%20la%20agenda%20Socrata%20%28P3%29.md) |
| REF-CTX-07c | [PBI-CTX-022](../PBI/Realizado/PBI%20-%20Festivos%20iCal%20sin%20precio%20impuesto%20%28P3%29.md) |

Orden de los P1: 012 puede ir en paralelo. 013 → 014 → 015 → 016 → 017. 018 espera a 012 y 016. 019, 020, 021 y 022 no dependen de esa cadena.

---

## 5. Criterios de aceptación

### Escenario 1 — Contención

**Dado** una fila `bcn-opendata-ckan` en `ACTIVE` o `DEGRADED` y documentos `bcn-opendata:*` en `context_memory`,  
**cuando** un actor `HUMAN` ejecuta `DEACTIVATE` y la purga en modo apply,  
**entonces** la fila queda `INACTIVE`, la semilla de una base vacía también la crearía `INACTIVE`, y un dry-run posterior de la purga devuelve 0 identificadores.

### Escenario 2 — Semilla

**Dado** el cargador de `context-sources.seed.yml`,  
**cuando** el fichero no trae `extraction`, el sobre es de éxito y las filas previas conservan su `status`,  
**cuando** una estrategia no es `CKAN_DATASTORE` o el mapa está incompleto, el sobre tiene `exitCode` 422 y el recuento de creadas y actualizadas es 0,  
**cuando** el catálogo ya tiene las seis fuentes y la semilla añade `bcn-agenda-cultural`, el mismo `loadSeed` (ingesta o panel) crea esa fila en `PENDING_APPROVAL` con su `extractionConfig`, y un segundo pase deja la fila en `untouched` si el JSON no cambió.

### Escenario 3 — CKAN

**Dado** el adaptador contra los dos fixtures de agenda cultural,  
**cuando** se llama a `fetch()` de `bcn-agenda-cultural`,  
**entonces** el `resource_id` sale del recurso CSV con datastore activo, cada `id` aparece una vez, las fechas pasan `ContextEntrySchema`, el HTML mapeado queda en texto plano y toda coordenada emitida cae en la caja de Barcelona.

### Escenario 4 — Fuentes ya atómicas

**Dado** los adaptadores RSS, SPARQL, Socrata e iCal con sus tests colocalizados,  
**cuando** se ejecuta `vitest` sobre esos ficheros,  
**entonces** el RSS usa `content:encoded` si el ítem lo trae; SPARQL enlaza una descripción por monumento; Socrata solo reescribe la URL de `rhpv-yr4f`; iCal no envía `price`.

### Escenario 5 — Oráculos

Desde `src/`, cada PBI cierra con `npx tsc --noEmit`, `npm run lint` y `npx vitest run` en salida 0. Eso es el Peaje del Oráculo (Axioma IV). `npm run build` se añade en REF-CTX-03a porque toca `src/app/api/context/ingest/route.ts`. No hay umbral de cobertura del 100 % en `TC-TEST-001`. REF-CTX-03 cierra `tsc` sin la clave en `route.ts`.

---

## 6. Fuera de esta historia

- Crawl JSON-LD de páginas de detalle y cualquier otro descenso de nivel no autorizado.
- Alta de `mercats`, `espais-verds`, `agenda-diaria` y `agenda-activitats-esportives` antes de su fixture de registros. Historia propia: [Alta de datasets CKAN con fixture de registros](../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Alta%20de%20Datasets%20CKAN%20con%20Fixture%20de%20Registros.md).
- Subir el tope de 20 entradas nuevas por fuente y ciclo.
- Reescribir los prefijos de id de RSS, SPARQL, Socrata e iCal.
- Cambiar la heurística de Argos que marca `opendata-ajuntament` como `SOCRATA`. Historia propia: [Clasificación de Argos sobre el portal Open Data del Ajuntament](../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Clasificaci%C3%B3n%20de%20Argos%20sobre%20el%20Portal%20Open%20Data%20del%20Ajuntament.md).
- Descomponer artículos de agenda en varios eventos.
