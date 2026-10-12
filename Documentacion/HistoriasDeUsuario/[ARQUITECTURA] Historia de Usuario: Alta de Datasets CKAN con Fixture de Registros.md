# [ARQUITECTURA] Historia de Usuario: Alta de Datasets CKAN con Fixture de Registros

**Estatus:** Borrador / Depende de la historia de extracción bifásica CKAN  
**Identificador numérico:** Pendiente de asignación por el Vértice Biológico. `HU 19` y `HU 20` ya están ocupadas.  
**Fecha de emisión:** 2026-10-12  
**Autor:** Vértice Biológico (Racso) & Nodo de Control (Tormentosa)  
**Precede:** [Extracción declarativa bifásica CKAN](../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) (REF-CTX-02, REF-CTX-03, REF-CTX-03a y REF-CTX-03b)  
**Estudios:** [ESTUDIO-CTX-001](../Fuentes/%5BESTUDIO%5D%20Viabilidad%20de%20Fuentes%20de%20Contexto%20Hiperlocal.md) (E1, E2) · [ESTUDIO-CTX-002](../Fuentes/%5BESTUDIO%5D%20Contexto%20Vigente%20de%20Fuentes%20Locales%20y%20Refactorizaciones%20de%20Miner%C3%ADa%20de%20Contenedores.md) §5.1

---

## 1. Descripción

**Como** operador del motor de contexto,  
**Quiero** dar de alta datasets del Ajuntament solo cuando un fixture de `package_show` y otro de `datastore_search` demuestren que cada fila es una actividad o un lugar,  
**Para** ampliar el catálogo sin repetir el error de `package_search?q=agenda`, que persistió fichas de catálogo como eventos.

Esta historia no crea un adaptador nuevo. Reutiliza `CKAN_DATASTORE` y el bloque `extraction` de la historia precedente. No sube el tope de 20 entradas nuevas por fuente y ciclo.

---

## 2. Qué está verificado y qué no

En el repositorio no hay fixtures de estos cuatro candidatos. `Documentacion/Fuentes/muestras-contexto/` no contiene `package_show` ni `datastore_search` de ninguno.

| Candidato | Qué dice la documentación | Qué no dice |
|---|---|---|
| `agenda-diaria` | El 2026-10-12, `package_search?q=activitats culturals agenda` devolvió este `name`, con recurso CSV `datastore_active: true` y otro recurso JSON. | Columnas, volumen, si hay una fila por actividad, ni fechas. |
| `agenda-activitats-esportives` | Misma sonda y el mismo nivel de evidencia que `agenda-diaria`. | Lo mismo. |
| Mercats (E1) | CTX-001 registra la URL `package_search?q=mercats`, licencia CC-BY 4.0 y el veredicto *Viable*. El texto mezcla directorio de mercados y eventos gastronómicos. | El `name` del dataset, el recurso, las columnas y si el grano es un mercado o un evento. |
| Espais verds (E2) | CTX-001 registra `package_search?q=espais-verds` y habla de parques georreferenciados. El veredicto *Viable* sale de esa búsqueda de catálogo. | El `name` del dataset y el grano de cada fila. |

`equipament-associacions` salió en la misma sonda que las agendas y no entra en esta historia.

El `fieldMap` de `agenda-cultural`, incluido el nombre `geo_epgs_4326_*` del estudio, no se copia. Cada dataset trae el suyo, leído del fixture.

---

## 3. Precondición

La historia precedente ya tiene en marcha:

- la columna `extractionConfig` y `upsertFromSeed` que la persiste en filas nuevas y existentes;
- el tipo `CKAN_DATASTORE` en Zod, Prisma y el `ENUM` de MySQL 8.0;
- el adaptador registrado en `src/app/api/context/ingest/route.ts`;
- `loadSeed` también con `context_sources` ya poblada, desde la ingesta y desde `ContextSourcesCard`.

Sin eso, una línea nueva en `context-sources.seed.yml` no llega a MySQL.

---

## 4. Regla de alta

Un candidato se siembra solo si se cumplen las cuatro condiciones. Si falla una, no hay línea en la semilla.

1. **Dos fixtures** en `Documentacion/Fuentes/muestras-contexto/`: `ckan-package-show-<dataset>.json` y `ckan-datastore-<dataset>.json`, tomados de `package_show?id=<name>` y de `datastore_search` del recurso elegido. El `name` es el del paquete CKAN, no el texto de la query `q=`.
2. **Un recurso.** `resourceSelector` (`format` y `datastoreActive`) deja un solo recurso. Cero o más de uno: no se siembra.
3. **Grano único.** Cada registro del fixture, tras `groupBy` solo si el identificador se repite, cabe en un `ContextEntry`. Fechas de solo día se normalizan a datetime con zona. Coordenadas fuera de lat 41.2–41.5 y lng 2.0–2.3 se omiten. Sin identificador estable, la fila no entra.
4. **Categoría según el grano del fixture**, no según CTX-001:

| Grano que muestra el fixture | `category` |
|---|---|
| Una actividad con inicio (agenda diaria, agenda deportiva u otra) | `EVENT`. `expiresAt` es fin + 1 día, o el inicio si no hay fin. |
| Un mercado: nombre y dirección o coordenadas, sin fechas de actividad | `VENUE` |
| Un parque o espacio verde: nombre y coordenadas, sin fechas de actividad | `POI` |
| El mismo dataset mezcla actividades y lugares, o solo describe el paquete | No se siembra |

La categoría `EVENT` no se asigna a mercats ni a espais verds hasta que el fixture lo muestre. CTX-001 no alcanza.

Cada alta queda `PENDING_APPROVAL` y `proposedBy: HUMAN`. El ciclo de ingesta no la toca hasta un `APPROVE`. El `id` es `${sourceTag}:${externalId}`.

`sourceTag` previstos, uno por dataset sembrado: `bcn-agenda-diaria`, `bcn-agenda-esportiva`, `bcn-mercats`, `bcn-espais-verds`. Si el `name` real del paquete no es el de la tabla §2, el tag sigue a ese `name` y el fixture lo documenta. No se crea una fuente cuyo endpoint sea `package_search?q=…`.

---

## 5. Entregas

Cada fila es un PBI. El adaptador no se modifica: el contrato ya es el `fieldMap`.

| PBI | Archivos | Cierre |
|---|---|---|
| ALT-CKAN-01 · Agenda diaria | Dos fixtures + la entrada en `context-sources.seed.yml` + un caso en el test del adaptador CKAN | `fetch()` contra el fixture produce al menos una entrada `EVENT` con `startsAt` válido e `id` único. |
| ALT-CKAN-02 · Agenda deportiva | Igual, con sus fixtures | Igual, para `bcn-agenda-esportiva`. |
| ALT-CKAN-03 · Mercats | Igual, después de identificar el `name` | Entradas `VENUE` o `EVENT` según §4. Si el grano es mixto, el PBI cierra sin semilla y deja los fixtures como evidencia. |
| ALT-CKAN-04 · Espais verds | Igual | Entradas `POI` si el grano es un lugar. Misma salida sin semilla si el grano no es único. |

El test del adaptador es el de REF-CTX-03a. Estos PBI lo amplían con un caso por fixture; no crean otro adaptador.

---

## 6. Criterios de aceptación

### Escenario 1 — Agenda con registros

**Dado** los dos fixtures de `agenda-diaria` o de `agenda-activitats-esportives` y la semilla cargada sobre un catálogo que ya tiene filas,  
**cuando** `loadSeed` termina y el adaptador lee el fixture,  
**entonces** existe una fila `PENDING_APPROVAL` con `extraction.strategy = CKAN_DATASTORE`, `dataset` igual al `name` del paquete, y el test obtiene entradas con `id` único y `startsAt` que pasa `ContextEntrySchema`.

### Escenario 2 — Catálogo sin grano

**Dado** un `package_show` cuyo datastore no tiene identificador de fila ni fechas ni coordenadas de un lugar,  
**cuando** se evalúa el candidato,  
**entonces** no se añade `sourceTag` a la semilla y no se llama a un LLM para partir el texto.

### Escenario 3 — Segundo pase

**Dado** la fila ya creada,  
**cuando** `loadSeed` corre otra vez sin cambios en el JSON de `extraction`,  
**entonces** la fila queda `untouched` y su `status` sigue siendo el que tuviera, incluido `PENDING_APPROVAL` o `ACTIVE` si un humano ya la aprobó.

---

## 7. Oráculos

Desde `src/`: `npx tsc --noEmit`, `npm run lint` y `npx vitest run` sobre el test del adaptador CKAN. El tope de 20 entradas del caso de uso no se modifica.

---

## 8. Fuera de esta historia

- `equipament-associacions` y cualquier otro `name` devuelto por `package_search` que no esté en §2.
- Crawl de páginas, `datastore_search_sql` y subida del tope de 20.
- Cambiar la heurística de Argos. Tiene su propia historia.
