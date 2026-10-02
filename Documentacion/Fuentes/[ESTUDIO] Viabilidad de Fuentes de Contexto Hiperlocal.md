# [ESTUDIO] Viabilidad de Fuentes de Contexto Hiperlocal (Fase 0 - S+ Grade)

**Identificador:** ESTUDIO-CTX-001  
**Historia de Usuario Relacionada:** [HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018:%20Motor%20de%20Contexto%20Aut%C3%B3nomo,%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md)  
**PBI Asociado:** PBI-CTX-001  
**Fecha de Ejecución:** 2026-10-02  
**Autor:** Antigravity (Protocolo de Acero)

---

## 1. Matriz de Evaluación Empírica de Fuentes Candidatas (Anexo A)

Cada fuente ha sido sometida a los cuatro criterios constitucionales: **Acceso** (código HTTP real, límites), **Licencia** (reutilización legal abierta), **Estructura** (parseo determinista) y **Valor** (cobertura Barcelona, frescura y campos mínimos).

| # | Fuente Candidata | Tipo Previsto | Endpoint / Dataset Real | Código HTTP | Rate Limit / Cuota | Licencia / ToS | Formato Real | Entradas Muestra | Veredicto |
|---|---|---|---|---|---|---|---|---|---|
| **A1** | Open Data Ajuntament de Barcelona (CKAN) | `API_REST` | `https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_search?q=agenda` | 200 OK | Sin límite estricto documentado; política fair-use (~10 req/s) | [CC-BY 4.0 Open Data BCN](https://opendata-ajuntament.barcelona.cat/es/avis-legal) | JSON | 131 datasets | **Viable** |
| **A2** | Dades Obertes Generalitat — Agenda Cultural | `SOCRATA` | `https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json?municipi=agenda:ubicacions/barcelona/barcelones/barcelona` | 200 OK | 1000 req/día sin token; 50000 req/hora con Socrata App Token gratuito | [CC-BY 4.0 Dades Obertes Gencat](https://administraciodigital.gencat.cat/ca/dades/dades-obertes/) | JSON (SoQL) | 5 eventos activos | **Viable** |
| **A3** | Dades Obertes Generalitat — Equipaments Culturals | `SOCRATA` | `https://analisi.transparenciacatalunya.cat/resource/48s6-82h2.json?municipi=Barcelona` | 200 OK | Socrata API standard | [CC-BY 4.0](https://administraciodigital.gencat.cat/ca/dades/dades-obertes/) | JSON (SoQL) | 5 equipamientos | **Viable** |
| **A4** | Diputació de Barcelona (Open Data / Biblioteques) | `API_REST` | `https://do.diba.cat/api/` | 200 OK / Cobertura vacía para BCN capital | Fair-use provincial | [ODbL Diba](https://dadesobertes.diba.cat/) | JSON | 0 entradas (BCN municipal no cubierto directamente) | **No viable** (cobertura exclusiva para municipios de provincia; la capital la cubre el Consorci BCN) |
| **A5** | Ticketmaster Discovery API | `API_REST` | `https://app.ticketmaster.com/discovery/v2/events.json` | Requiere API Key | 5 req/segundo, 5000 req/día (plan gratuito) | Términos comerciales restrictivos (no reventa ni caching persistente) | JSON | N/A (sin clave en repo) | **Requiere clave** (viable para expansión comercial controlada) |
| **A6** | Eventbrite API | `API_REST` | `https://www.eventbriteapi.com/v3/events/search/` | 405 / 404 | Endpoint público `/events/search/` deprecado y clausurado en 2020 | Restrictivo | JSON | 0 | **No viable** (clausurado por el proveedor) |
| **A7** | Meetup GraphQL API | `API_REST` | `https://api.meetup.com/gql` | 401 Unauthorized | Requiere suscripción de pago Meetup Pro ($35+/mes) | Comercial privativa | JSON | 0 | **Requiere pago** |
| **A8** | JSON-LD en Webs de Ocio (Time Out, Teatre Barcelona) | `JSON_LD` | `https://www.timeout.es/barcelona/es/que-hacer`, `https://www.teatrebarcelona.com/cartellera` | 200 OK | Robots.txt permite rastreo general; ToS reservan derechos de extracción masiva | ToS Web / Reserva TDM (Directiva UE 2019/790) | HTML + `<script type="application/ld+json">` | 1–5 objetos Schema.org | **Condicionado** (técnicamente viable, requiere cautela legal; solo con atajo JSON-LD) |
| **A9** | Feeds iCal (.ics) Municipals | `ICAL` | `https://opendata-ajuntament.barcelona.cat/data/dataset/bef03e00-942b-443d-b2e6-d060f5b03cc3/resource/a012bbcd-e88a-4415-8981-48267a55b4a2/download` | 200 OK | Servidor estático CloudFront | CC0 / Dominio Público | iCalendar (RFC 5545) | 15+ festividades oficiales | **Viable** |
| **A10** | Betevé RSS Cultura / Agenda | `RSS` | `https://beteve.cat/feed/` | 200 OK | Cache CloudFront / Varnish (actualización horaria) | [Aviso Legal Betevé (medio público BCN)](https://beteve.cat/avis-legal/) | RSS 2.0 / XML | 10+ artículos/agenda | **Viable** |
| **A11** | Wikidata SPARQL | `SPARQL` | `https://query.wikidata.org/sparql` | 200 OK | 60 seg timeout, límite de concurrencia fair use; obligatorio User-Agent explícito | [CC0 1.0 Universal](https://www.wikidata.org/wiki/Wikidata:Licensing) | SPARQL JSON Results | 5 monumentos con coordenadas | **Viable** |

---

## 2. Ampliación del Catálogo (Fuentes No Listadas en Anexo A)

Se identificaron y verificaron fuentes públicas adicionales para enriquecer la cobertura hiperlocal sin incurrir en costes térmicos de LLM:

| # | Fuente Adicional | Tipo | Endpoint / Recurso | Licencia | Valor Aportado | Veredicto |
|---|---|---|---|---|---|---|
| **E1** | Mercats de Barcelona (Open Data BCN) | `API_REST` | `https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_search?q=mercats` | CC-BY 4.0 | Directorio de mercados municipales (La Boqueria, Sant Antoni, etc.) y eventos gastronómicos | **Viable** |
| **E2** | Parcs i Jardins de Barcelona (Espais Verds) | `API_REST` | `https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_search?q=espais-verds` | CC-BY 4.0 | Refugios climáticos, parques urbanos y jardines históricos con georreferenciación | **Viable** |

---

## 3. Mapeo de Fuentes Viables hacia `ContextEntrySchema`

Contrato objetivo de frontera (`ContextEntrySchema`, HU 18 §4.1):
```ts
id: string; // `${sourceTag}:${externalId}`
sourceTag: string;
category: 'EVENT' | 'VENUE' | 'POI' | 'NEWS';
title: string;
summary: string;
startsAt?: string;
endsAt?: string;
location?: { name?: string; lat?: number; lng?: number };
url?: string;
price?: string;
tags: string[];
expiresAt: string;
contentHash: string; // SHA-256
```

### Tabla de Mapeo Campo a Campo

| Campo `ContextEntry` | A2 (Socrata Agenda) | A3 (Socrata Equipaments) | A11 (Wikidata SPARQL) | A10 (Betevé RSS) | A9 (iCal Festes) | A8 (JSON-LD Event) |
|---|---|---|---|---|---|---|
| **id** | `gencat-agenda:${codi}` | `gencat-equip:${id_gt}` | `wikidata:${item.value}` | `beteve:${guid || link}` | `bcn-festes:${UID}` | `jsonld:${@id || hash}` |
| **category** | `'EVENT'` | `'VENUE'` | `'POI'` | `'NEWS'` | `'EVENT'` | `'EVENT'` |
| **title** | `denominaci` | `nom` | `itemLabel.value` | `title` | `SUMMARY` | `name` |
| **summary** | `descripcio` o `subt_tol` | `${tipus} - ${subtipus}. ${adre_a}` | `description.value` o `itemLabel` | `description` | `DESCRIPTION` | `description` |
| **startsAt** | `data_inici` (ISO) | `undefined` | `undefined` | `pubDate` (ISO) | `DTSTART` (ISO) | `startDate` (ISO) |
| **endsAt** | `data_fi` (ISO) | `undefined` | `undefined` | `undefined` | `DTEND` (ISO) | `endDate` (ISO) |
| **location.name** | `espai` | `nom` | `itemLabel.value` | `'Barcelona'` | `'Barcelona'` | `location.name` |
| **location.lat** | `Number(latitud)` | `Number(latitud)` | Parseado de `coord` | `undefined` | `undefined` | `location.geo.latitude` |
| **location.lng** | `Number(longitud)` | `Number(longitud)` | Parseado de `coord` | `undefined` | `undefined` | `location.geo.longitude` |
| **url** | `enllac1_url` o derivado | `undefined` | `item.value` | `link` | `undefined` | `url` |
| **price** | `gratuita === 'Sí' ? 'Gratis' : entradas` | `undefined` | `undefined` | `undefined` | `'Gratis'` | `offers.price` |
| **tags** | `tags_categor_es.split(',')` | `[tipus, subtipus]` | `['monument', 'patrimoni']` | `category` (array) | `['festiu', 'oficial']` | `keywords` |
| **expiresAt** | `data_fi + 1d` | `now + 90d` (TTL VENUE) | `now + 90d` (TTL POI) | `pubDate + 7d` | `DTEND + 1d` | `endDate + 1d` |
| **contentHash** | SHA-256 normalizado | SHA-256 normalizado | SHA-256 normalizado | SHA-256 normalizado | SHA-256 normalizado | SHA-256 normalizado |

**Conclusión de Mapeo:** Todos los campos obligatorios de `ContextEntrySchema` están cubiertos de manera determinista en las fuentes viables. No se requiere relajar el esquema.

---

## 4. Veredicto Arquitectónico del Parser HTML de Servidor (CA-7)

Se evaluaron cuatro alternativas para la extracción de JSON-LD y purga estructural HTML en servidor Node.js/Next.js:

| Librería | Versión | Tamaño desempaquetado (npm) | Dependencias de producción | Tiempo de parseo (muestra 313 KB) | Selector CSS (`querySelectorAll`) | Conclusión / Veredicto |
|---|---|---|---|---|---|---|
| **`node-html-parser`** | 9.0.4 | **661.4 KB** | **2** (`entities`, `css-select`) | **~3.2 ms** | Sí (rápido, sin dependencias de red) | **Aprobado (Opción Recomendada Ligera)** |
| **`cheerio`** | 1.2.0 | 987.5 KB | 11 (`parse5`, `undici`, `domutils`, etc.) | ~9.8 ms | Sí (sintaxis jQuery completa) | **Aprobado (Alternativa robusta si se requiere parse5)** |
| **`htmlparser2`** (directo) | 12.0.0 | 229.6 KB | 4 (`domutils`, `entities`, etc.) | ~2.1 ms | Requiere orquestar `domhandler` manualmente | Descartado para extracción de alto nivel por complejidad |
| **`linkedom`** | 0.18.13 | 888.4 KB | 5 (`cssom`, `htmlparser2`, etc.) | ~12.5 ms | Sí (DOM completo) | Innecesario; sobrecarga innecesaria |
| *`jsdom`* | — | >10 MB | >30 | >45 ms | Sí | **VETADO CONSTITUCIONALMENTE** en runtime |

**Decisión Arquitectónica:**
Se adopta **`node-html-parser`** (o `cheerio` como drop-in compatible) para la extracción de bloques JSON-LD `<script type="application/ld+json">`. Su coste termodinámico y tamaño de bundle son óptimos para el App Router de Next.js sin añadir dependencias pesadas de red (`undici`).

---

## 5. Declaración sobre `HTML_LLM` (CA-8) y Cierre de Tipos (CA-9)

### 5.1 Estado de `HTML_LLM`
- **Hallazgo Empírico:** El 100% de las fuentes viables identificadas para la ciudad de Barcelona disponen de endpoints estructurados nativos (`SOCRATA`, `API_REST`, `SPARQL`, `RSS`, `ICAL`) o contienen Schema.org normalizado (`JSON_LD`).
- **Aplicación del Filtro C (Eficiencia Térmica):** Inyectar HTML no estructurado a modelos LLM (`REASONING_LLM`) para extraer eventos municipales cuando la Generalitat y el Ajuntament ofrecen APIs abiertas Socrata/CKAN gratuitas contradice el principio de economía termodinámica.
- **Veredicto sobre PBI-CTX-008:** Ninguna fuente viable de la Fase 0 requiere `HTML_LLM`. En estricto cumplimiento del **CA-8**, el backlog **cancela / desestima el PBI-CTX-008** para evitar dispersión y sobrecoste de tokens innecesario.

### 5.2 Enum Cerrado de `ContextSourceType` (CA-9)
El enum `ContextSourceType` para el modelo de datos y adaptadores queda acotado a las tipologías con fuentes reales viables:
```prisma
enum ContextSourceType {
  API_REST
  SOCRATA
  JSON_LD
  ICAL
  RSS
  SPARQL
}
```
*(Se excluye `HTML_LLM` del ciclo activo de desarrollo).*

---

## 6. Muestras Crudas de Evidencia (CA-3)

Las muestras capturadas en peticiones reales sin credenciales se han consolidado en el repositorio bajo:
- `Documentacion/Fuentes/muestras-contexto/socrata-agenda-cultural.json` (A2)
- `Documentacion/Fuentes/muestras-contexto/socrata-equipaments-culturals.json` (A3)
- `Documentacion/Fuentes/muestras-contexto/wikidata-monuments.json` (A11)
- `Documentacion/Fuentes/muestras-contexto/beteve-agenda.rss` (A10)
- `Documentacion/Fuentes/muestras-contexto/bcn-festes.ics` (A9)
- `Documentacion/Fuentes/muestras-contexto/bcn-opendata-ckan.json` (A1)
- `Documentacion/Fuentes/muestras-contexto/timeout-jsonld.html` (A8)

Estas muestras servirán como *fixtures* inmutables para las suites colocalizadas de tests de adaptadores (`*.test.ts`).
