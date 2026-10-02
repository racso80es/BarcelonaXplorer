# [ARQUITECTURA] Documento Destilado: PBI - Adaptadores Estructurados de Fuentes de Contexto sin LLM

**Identificador:** PBI-CTX-006
**Estatus:** Pendiente (bloqueado por PBI-CTX-001 y PBI-CTX-005)
**Fecha de Creación:** 2026-09-30
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

- [ ] **CA-1 (Cobertura):** Un adaptador por cada `ContextSourceType` estructurado con fuentes viables, registrado en la matriz de PBI-CTX-005.
- [ ] **CA-2 (Frontera Zod):** Cada adaptador parsea la respuesta cruda con Zod antes de mapear; sin `any` ni `as any`.
- [ ] **CA-3 (Mapeo):** El mapeo sigue la tabla de CA-4 de PBI-CTX-001; `expiresAt` calculado según HU §4.1 (fin del evento + 1 día, o TTL por categoría).
- [ ] **CA-4 (Tests colocalizados):** `<adaptador>.test.ts` con el fixture real: número esperado de entradas válidas, descarte de entradas fuera de la caja geográfica y de entradas malformadas.
- [ ] **CA-5 (Errores):** HTTP ≥ 400, timeout o Zod global inválido ⇒ `OperationEnvelope` con `success: false` (lo consume el Circuit Breaker).
- [ ] **CA-6 (Rate limit y cortesía):** Límites del estudio aplicados (pausa entre páginas, `User-Agent` identificable exigido por Wikidata, *app token* opcional de Socrata vía variable de entorno documentada).
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` en verde.

---

## 3. Fuera de Alcance

- `JSON_LD` (PBI-CTX-007) y `HTML_LLM` (PBI-CTX-008).
