# [ARQUITECTURA] Historia de Usuario: Clasificación de Argos sobre el Portal Open Data del Ajuntament

**Estatus:** Borrador / Depende del tipo `CKAN_DATASTORE`  
**Identificador numérico:** Pendiente de asignación por el Vértice Biológico. `HU 19` y `HU 20` ya están ocupadas.  
**Fecha de emisión:** 2026-10-12  
**Autor:** Vértice Biológico (Racso) & Nodo de Control (Tormentosa)  
**Precede:** [Extracción declarativa bifásica CKAN](../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) (REF-CTX-03, el literal de tipo)  
**Código:** `src/features/context-sources/maintain-context.use-case.ts`

---

## 1. Descripción

**Como** operador del motor de contexto,  
**Quiero** que Argos deje de etiquetar cualquier URL del Ajuntament como `SOCRATA`,  
**Para** que una propuesta del portal Open Data no entre al adaptador de la Generalitat, que solo acepta un array JSON.

---

## 2. Hecho vigente

La heurística está solo en la exploración de fuentes nuevas (grounding), no en las otras dos salidas de Argos.

| Camino | Qué tipo asigna |
|---|---|
| Redirección de una fuente `DEGRADED` | El `type` de la fuente ya guardada. |
| Alternativa por grounding de una fuente `DEGRADED` | El `type` de la fuente ya guardada. |
| Exploración de URLs nuevas | La cadena de `includes` de abajo. La `category` de esta rama es siempre `EVENT`. |

Orden actual de la exploración, sobre la URL en minúsculas:

1. Si contiene `socrata` **o** `opendata-ajuntament` → `SOCRATA`.
2. Si no, `.ics` o `ical` → `ICAL`.
3. Si no, `rss` o `feed` → `RSS`.
4. Si no, `sparql` o `wikidata` → `SPARQL`.
5. Si no → `JSON_LD`.

El primer predicado se come el resto cuando el host es el del Ajuntament. Una descarga iCal en ese host no llega al paso 2. El endpoint ya sembrado de `bcn-festes-laborals` (`…/dataset/…/resource/…/download`, sin `.ics` en la ruta) no se reclasifica: Argos solo propone URLs que no están ya en `existingEndpoints`.

`SocrataContextAdapter` responde `exitCode` 422 si el cuerpo no es un array. `package_search` y `package_show` devuelven un objeto `{ success, result }`. Una propuesta aprobada con tipo `SOCRATA` falla el fetch y, al tercer `INGEST_FAIL`, pasa a `DEGRADED`.

La propuesta nace `PENDING_APPROVAL`, `proposedBy: ARGOS`, sin `extractionConfig`. El panel tiene botón Aprobar y no tiene editor de `extraction`. El cupo por defecto sigue en 5 (`maxProposals`).

El tipo `CKAN_DATASTORE` no existe hasta REF-CTX-03 de la historia precedente. Esta historia no se implementa antes.

---

## 3. Matriz de exploración

Sustituir la cadena por una matriz evaluada en orden. La primera fila que cumple gana.

| Orden | Señal, sobre la URL ya normalizada a minúsculas | Tipo |
|---|---|---|
| 1 | Contiene `.ics` o `ical` | `ICAL` |
| 2 | Contiene `socrata`, o el host es `analisi.transparenciacatalunya.cat` | `SOCRATA` |
| 3 | El host es `opendata-ajuntament.barcelona.cat` y la ruta contiene `/api/3/action` | `CKAN_DATASTORE` |
| 4 | Contiene `rss` o `feed` | `RSS` |
| 5 | Contiene `sparql` o `wikidata` | `SPARQL` |
| 6 | Ninguna de las anteriores | `JSON_LD` |

`opendata-ajuntament` deja de ser señal de `SOCRATA`.

Una URL de ese host que no es la API de acción (por ejemplo `…/dataset/…/resource/…/download` sin `.ics`) cae en `JSON_LD` si no encaja en otra fila. Esta historia no inventa un detector de iCal para esa ruta: el fichero sembrado no lleva `.ics` en la URL y ya está en el catálogo.

La `category` de la exploración sigue siendo `EVENT`. No hay señal determinista en la URL para `VENUE` o `POI`.

Los caminos de redirección y de fuente degradada no usan esta matriz: conservan `source.type` y `source.category`.

---

## 4. Aprobar sin extracción

Argos no rellena `extraction`. El adaptador CKAN no puede minar una fuente sin `dataset` y `fieldMap`.

`ContextAdminService.transitionSource`, cuando el evento es `APPROVE`, el tipo es `CKAN_DATASTORE` y `extractionConfig` es null o no pasa el esquema de extracción, devuelve `exitCode` 422 y no escribe `ACTIVE`. Rechazar (`REJECT`) sigue permitido.

Esta guarda no añade un formulario de extracción al panel.

---

## 5. Archivos

| PBI | Archivos | Cierre |
|---|---|---|
| ARGOS-TIPO-01 | `maintain-context.use-case.ts`, `maintain-context.use-case.test.ts` | La matriz de §3. Los otros dos caminos de Argos no cambian de tipo. |
| ARGOS-TIPO-02 | `context-admin.service.ts`, `context-admin.service.test.ts` | `APPROVE` de un `CKAN_DATASTORE` sin extracción válida → 422 y el `status` no cambia. |

---

## 6. Criterios de aceptación

### Escenario 1 — API CKAN

**Dado** una URL nueva `https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=agenda-cultural` que no está en el catálogo,  
**cuando** la exploración de Argos la propone,  
**entonces** el tipo es `CKAN_DATASTORE`, la categoría es `EVENT`, el estado es `PENDING_APPROVAL` y `proposedBy` es `ARGOS`.

### Escenario 2 — Socrata real

**Dado** una URL de `analisi.transparenciacatalunya.cat` o que contiene `socrata`,  
**cuando** la exploración la propone,  
**entonces** el tipo es `SOCRATA`.

### Escenario 3 — iCal con extensión

**Dado** una URL del Ajuntament que contiene `.ics`,  
**cuando** la exploración la propone,  
**entonces** el tipo es `ICAL`, no `SOCRATA` ni `CKAN_DATASTORE`.

### Escenario 4 — Aprobar a ciegas

**Dado** una fila `CKAN_DATASTORE` en `PENDING_APPROVAL` sin `extractionConfig`,  
**cuando** un humano envía `APPROVE`,  
**entonces** el sobre tiene `exitCode` 422 y la fila sigue en `PENDING_APPROVAL`.

### Escenario 5 — Fuente ya degradada

**Dado** una fuente `DEGRADED` de tipo `ICAL` cuyo endpoint redirige,  
**cuando** Argos propone la URL final,  
**entonces** la propuesta conserva `ICAL` y la categoría que ya tenía la fuente.

---

## 7. Oráculos

Desde `src/`: `npx tsc --noEmit`, `npm run lint` y `npx vitest run` sobre los dos tests de §5.

---

## 8. Fuera de esta historia

- Rellenar `fieldMap` o dar de alta `agenda-diaria`, `agenda-activitats-esportives`, mercats o espais verds. Eso es la historia de fixtures.
- Editor de `extraction` en el panel.
- Cambiar el cupo `maxProposals`, el tag `-argos` o la categoría fija `EVENT` de la exploración.
- Reclasificar `bcn-festes-laborals`, que ya está sembrada como `ICAL`.
