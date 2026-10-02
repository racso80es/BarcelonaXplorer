# [ARQUITECTURA] Documento Destilado: PBI - Adaptadores Estructurados de Fuentes de Contexto sin LLM

**Identificador:** PBI-CTX-006
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-30
**Fecha de Finalización:** 2026-10-02
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §4.2, Anexo A
**Módulo:** `src/features/context-sources/adapters/` (un fichero + test por tipo)
**Entorno:** `fetch` nativo de Node, Zod, fixtures de PBI-CTX-001
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points (se puede partir por tipo si el estudio arroja muchas fuentes)
**Depende de:** PBI-CTX-001, PBI-CTX-005
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Implementaciones de `IContextSourceAdapter` para los tipos estructurados que PBI-CTX-001 declare necesarios: `API_REST` (CKAN, Ticketmaster si es viable), `SOCRATA`, `ICAL`, `RSS`, `SPARQL`. Mapeo determinista a `ContextEntrySchema`, **sin LLM**.
- **Entorno:** Solo tipos con al menos una fuente `Viable` en el estudio; los demás no se implementan.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Zod en frontera):* Respuesta externa como `unknown`, esquema Zod por fuente/tipo, entradas inválidas descartadas de una en una.
  - *Filtro B (Determinismo):* Tests con los fixtures crudos capturados en PBI-CTX-001, sin red.
  - *Filtro C (Eficiencia Térmica):* Cero tokens; respeto de límites de peticiones documentados en el estudio.

---

## 1. Declaración de Intención (INVEST)

**Como** pipeline de ingesta,
**Quiero** adaptadores deterministas para las fuentes estructuradas validadas,
**Para** ingerir la mayor parte del contexto sin coste de inferencia.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Cobertura):** Un adaptador por cada `ContextSourceType` estructurado viable implementado bajo `src/features/context-sources/adapters/`:
  - `SocrataContextAdapter` (`SOCRATA`)
  - `SparqlContextAdapter` (`SPARQL`)
  - `RssContextAdapter` (`RSS`)
  - `IcalContextAdapter` (`ICAL`)
  - `ApiRestContextAdapter` (`API_REST`)
  Todos registrados en `defaultContextAdapters` en `src/app/api/context/ingest/route.ts`.
- [x] **CA-2 (Frontera Zod):** Validación de payload con parseo Zod en frontera sin uso de `any` ni `as any`.
- [x] **CA-3 (Mapeo):** Mapeo de campos implementado conforme a la tabla de CA-4 del estudio con cálculo determinista de `contentHash` y políticas de TTL por categoría (`EVENT`: fin + 1d, `VENUE`/`POI`: 90d, `NEWS`: 7d).
- [x] **CA-4 (Tests colocalizados):** Suites de test colocalizadas (`*.test.ts`) ejecutadas contra los fixtures inmutables de `Documentacion/Fuentes/muestras-contexto/` sin consumo de red.
- [x] **CA-5 (Errores):** Retorno de `createErrorEnvelope` ante códigos HTTP ≥ 400 o fallos de estructura global para su procesamiento por el Circuit Breaker.
- [x] **CA-6 (Rate limit y cortesía):** Cabeceras de cortesía aplicadas (`User-Agent: BarcelonaXplorer/1.0` en SPARQL Wikidata, soporte opcional de `SOCRATA_APP_TOKEN` en Socrata).
- [x] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` en verde (48 tests colocalizados pasando).

---

## 3. Fuera de Alcance

- `JSON_LD` (PBI-CTX-007) y `HTML_LLM` (PBI-CTX-008).
