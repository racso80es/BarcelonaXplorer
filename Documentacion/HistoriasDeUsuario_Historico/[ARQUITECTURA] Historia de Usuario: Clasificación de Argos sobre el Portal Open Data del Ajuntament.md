# [ARQUITECTURA] Historia de Usuario: Clasificación de Argos sobre el Portal Open Data del Ajuntament

**Estatus:** Cerrada / Implementada (100% PBIs completados)  
**Identificador numérico:** Pendiente de asignación por el Vértice Biológico. `HU 19` y `HU 20` ya están ocupadas.  
**Fecha de emisión:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Autor:** Vértice Biológico (Racso) & Nodo de Control (Tormentosa)  
**Precede:** [Extracción declarativa bifásica CKAN](../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) (REF-CTX-03, el literal de tipo)  
**Código:** `src/features/context-sources/maintain-context.use-case.ts`, `src/features/context-sources/context-admin.service.ts`

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
| Exploración de URLs nuevas | La matriz de clasificación ordenada (§3). La `category` de esta rama es siempre `EVENT`. |

`SocrataContextAdapter` responde `exitCode` 422 si el cuerpo no es un array. `package_search` y `package_show` devuelven un objeto `{ success, result }`. Una propuesta aprobada con tipo `SOCRATA` fallaba el fetch y, al tercer `INGEST_FAIL`, pasaba a `DEGRADED`.

La propuesta nace `PENDING_APPROVAL`, `proposedBy: ARGOS`, sin `extractionConfig`. La aduana implementada (§4) impide aprobarla (`exitCode: 422`) mientras carezca de una extracción válida.

---

## 3. Matriz de exploración

Sustituida la cadena imperativa previa por una matriz declarativa evaluada en orden (Axioma III):

| Orden | Señal, sobre la URL ya normalizada a minúsculas | Tipo |
|---|---|---|
| 1 | Contiene `.ics` o `ical` | `ICAL` |
| 2 | Contiene `socrata`, o el host es `analisi.transparenciacatalunya.cat` | `SOCRATA` |
| 3 | El host es `opendata-ajuntament.barcelona.cat` y la ruta contiene `/api/3/action` | `CKAN_DATASTORE` |
| 4 | Contiene `rss` o `feed` | `RSS` |
| 5 | Contiene `sparql` o `wikidata` | `SPARQL` |
| 6 | Ninguna de las anteriores | `JSON_LD` |

`opendata-ajuntament` deja de ser señal de `SOCRATA`.

Una URL de ese host que no es la API de acción (por ejemplo `…/dataset/…/resource/…/download` sin `.ics`) cae en `JSON_LD` si no encaja en otra fila.

La `category` de la exploración sigue siendo `EVENT`.

Los caminos de redirección y de fuente degradada conservan `source.type` y `source.category` sin consultar la matriz.

---

## 4. Aprobar sin extracción

Argos no rellena `extraction`. El adaptador CKAN no puede minar una fuente sin `dataset` y `fieldMap`.

`ContextAdminService.transitionSource`, cuando el evento es `APPROVE`, el tipo es `CKAN_DATASTORE` y `extractionConfig` es null o no pasa `CkanDatastoreExtractionConfigSchema`, devuelve `exitCode` 422 y no escribe `ACTIVE`. Rechazar (`REJECT`) sigue permitido.

---

## 5. Entregas y PBIs

Ambos PBIs completados y validados secuencialmente con oráculos en verde:

| Orden | PBI | Ref. | Archivos | Estado | Commit |
|---|---|---|---|---|---|
| 1 | [PBI-CTX-027](../PBI/Realizado/PBI%20-%20Matriz%20de%20clasificaci%C3%B3n%20de%20Argos%20sobre%20el%20portal%20del%20Ajuntament%20%28P1%29.md) | ARGOS-TIPO-01 | `maintain-context.use-case.ts`, `maintain-context.use-case.test.ts` | Realizado | `a1d3182` |
| 2 | [PBI-CTX-028](../PBI/Realizado/PBI%20-%20Aduana%20de%20APPROVE%20de%20CKAN_DATASTORE%20sin%20extracci%C3%B3n%20%28P1%29.md) | ARGOS-TIPO-02 | `context-admin.service.ts`, `context-admin.service.test.ts` | Realizado | `9dca01b` |

---

## 6. Criterios de aceptación (Verificación de Escenarios)

- **Escenario 1 — API CKAN (Cumplido):** Una URL nueva `https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=agenda-cultural` nace con `type: CKAN_DATASTORE`, `category: EVENT`, `status: PENDING_APPROVAL`, `proposedBy: ARGOS` y sin `extractionConfig`.
- **Escenario 2 — Socrata real (Cumplido):** URLs de `analisi.transparenciacatalunya.cat` o que contienen `socrata` nacen `SOCRATA`.
- **Escenario 3 — iCal con extensión (Cumplido):** Una URL del Ajuntament que contiene `.ics` nace `ICAL` con máxima prioridad sobre `socrata`.
- **Escenario 4 — Aprobar a ciegas (Cumplido):** `APPROVE` sobre `CKAN_DATASTORE` sin `extractionConfig` responde `exitCode: 422`, abortando mutación sin llamar a `save`.
- **Escenario 5 — Fuente ya degradada (Cumplido):** Sondas de redirección y grounding sobre fuentes degradadas mantienen el tipo y categoría preexistentes sin consultar la matriz de exploración.

---

## 7. Oráculos

Verificados en verde en cada ciclo: `npx tsc --noEmit`, `npm run lint` y `npx vitest run features/context-sources/` (115/115 tests pasando).

---

## 8. Fuera de esta historia

- Rellenar `fieldMap` o dar de alta `agenda-diaria`, `agenda-activitats-esportives`, mercats o espais verds (cerrado en historia de fixtures).
- Editor de `extraction` en el panel.
- Cambiar el cupo `maxProposals`, el tag `-argos` o la categoría fija `EVENT` de la exploración.
- Reclasificar `bcn-festes-laborals`, que ya está sembrada como `ICAL`.
