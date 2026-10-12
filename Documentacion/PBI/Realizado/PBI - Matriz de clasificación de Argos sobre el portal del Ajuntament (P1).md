# [ARQUITECTURA] PBI - Matriz de clasificación de Argos sobre el portal del Ajuntament

**Identificador:** PBI-CTX-027  
**Ref. de historia:** ARGOS-TIPO-01  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Clasificación de Argos sobre el Portal Open Data del Ajuntament](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Clasificaci%C3%B3n%20de%20Argos%20sobre%20el%20Portal%20Open%20Data%20del%20Ajuntament.md) · §3 · Escenarios 1, 2, 3 y 5  
**Módulo:** `src/features/context-sources/maintain-context.use-case.ts`, `src/features/context-sources/maintain-context.use-case.test.ts`  
**Prioridad:** Alta (P1)  
**Orden de forja:** 1 de 2. Este PBI va antes que PBI-CTX-028.  
**Depende de:** PBI-CTX-015 (el literal `CKAN_DATASTORE` ya está en Zod y en Prisma)  
**Bloquea:** PBI-CTX-028

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que la exploración de URLs nuevas de Argos asigne el tipo con una matriz ordenada,  
**Para** que una URL del portal Open Data del Ajuntament nazca `CKAN_DATASTORE` y no entre en `SocrataContextAdapter`.

La cadena actual vive solo en la exploración (a partir de la línea que hace `includes('socrata') || includes('opendata-ajuntament')`). `opendata-ajuntament` deja de ser señal de `SOCRATA`. La redirección de una fuente `DEGRADED` y la alternativa por grounding de una fuente `DEGRADED` conservan `source.type` y `source.category`.

La categoría de la exploración sigue siendo `EVENT`. Argos no rellena `extractionConfig`. El cupo `maxProposals` (5) y el tag de propuesta no cambian.

---

## 2. Matriz

Se evalúa sobre la URL ya normalizada (`toLowerCase()`, barra final recortada). La primera fila que cumple gana. Las filas de host usan `URL.hostname`. Si `new URL` lanza, esas filas son falsas y el resto de la matriz sigue sobre la cadena.

| Orden | Señal | Tipo |
|---|---|---|
| 1 | La cadena contiene `.ics` o `ical` | `ICAL` |
| 2 | La cadena contiene `socrata`, o el host es `analisi.transparenciacatalunya.cat` | `SOCRATA` |
| 3 | El host es `opendata-ajuntament.barcelona.cat` y el pathname contiene `/api/3/action` | `CKAN_DATASTORE` |
| 4 | La cadena contiene `rss` o `feed` | `RSS` |
| 5 | La cadena contiene `sparql` o `wikidata` | `SPARQL` |
| 6 | Ninguna fila anterior | `JSON_LD` |

Una URL de ese host que no es la API de acción (por ejemplo `…/dataset/…/resource/…/download` sin `.ics`) cae en `JSON_LD`. Esta entrega no añade un detector de iCal para esa ruta.

La matriz es datos evaluados en orden (Axioma III). Sustituye la cadena de `includes` de la exploración. No se extrae a otro fichero: los dos archivos de este PBI bastan (Axioma I).

---

## 3. Criterios de aceptación

- [x] **CA-1 (API CKAN, Escenario 1):** Una URL nueva `https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=agenda-cultural`, ausente de `existingEndpoints`, nace con `type: CKAN_DATASTORE`, `category: EVENT`, `status: PENDING_APPROVAL`, `proposedBy: ARGOS`. `create` no recibe `extractionConfig`.
- [x] **CA-2 (Socrata real, Escenario 2):** Una URL cuyo host es `analisi.transparenciacatalunya.cat`, y otra que contiene `socrata` en otro host, nacen `SOCRATA`.
- [x] **CA-3 (iCal con extensión, Escenario 3):** Una URL del Ajuntament que contiene `.ics` nace `ICAL`. Una cadena que contiene a la vez `.ics` y `socrata` nace `ICAL`: la fila 1 gana.
- [x] **CA-4 (Descarga sin extensión):** `https://opendata-ajuntament.barcelona.cat/data/dataset/foo/resource/bar/download` nace `JSON_LD`.
- [x] **CA-5 (Fuente ya degradada, Escenario 5):** Una fuente `DEGRADED` de tipo `ICAL` cuya sonda termina en una URL de `/api/3/action` del Ajuntament propone esa URL final conservando `ICAL` y la categoría ya guardada. El mismo conservadurismo vale para la alternativa por grounding: esa rama no consulta la matriz.
- [x] **CA-6 (Resto de la matriz):** Una URL con `rss` o `feed` que no cayó en las filas 1–3 nace `RSS`. Una con `sparql` o `wikidata` en el mismo caso nace `SPARQL`. Una URL `http` sin ninguna señal nace `JSON_LD`.
- [x] **CA-7 (Regresión):** Los cuatro tests actuales de `maintain-context.use-case.test.ts` siguen en verde. `https://opendata.bcn.cat/nou-endpoint` no es el host del Ajuntament y no rearranca la clasificación de la rama degradada.
- [x] **CA-8 (Oráculos):** Desde `src/`, `npx tsc --noEmit`, `npm run lint` y `npx vitest run features/context-sources/maintain-context.use-case.test.ts` en salida 0.

---

## 4. Fuera de alcance

- La guarda de `APPROVE` sin extracción (PBI-CTX-028).
- Editor de `extraction` en el panel, cupo `maxProposals`, tag `-argos` y la categoría fija `EVENT` de la exploración.
- Reclasificar `bcn-festes-laborals`: ya está en el catálogo y Argos no propone endpoints presentes en `existingEndpoints`.
- Alta de datasets ni `fieldMap` (historia de fixtures, ya cerrada).

---

## 5. Resolución y Evidencias Técnicas

1. **Matriz Declarativa de Clasificación (Axioma III):**
   - Implementado array inmutable `EXPLORATION_CLASSIFICATION_RULES` con evaluación ordenada de señales y función pura `classifyExploredEndpoint` en `maintain-context.use-case.ts`.
   - Evaluación segura de URLs mediante bloque `try/catch` con `new URL()`, aislando fallos de parseo sintáctico sin interrumpir la clasificación de cadenas.
2. **Conservadurismo en Fuentes Degradadas:**
   - La sonda determinista y el grounding para fuentes degradadas conservan invariantes `source.type` y `source.category` sin invocar la matriz exploratoria.
3. **Validación de Oráculos S+ Grade:**
   - **Vitest:** 12/12 pruebas unitarias e integradas superadas en `maintain-context.use-case.test.ts` (incluyendo cobertura para CA-1 a CA-6 y resistencia a URLs anómalas).
   - **TypeScript:** `npx tsc --noEmit` completado con salida 0.
   - **ESLint:** `npm run lint` limpio con 0 warnings y 0 errores.
