# [ARQUITECTURA] Documento Destilado: PBI - Adaptador JSON-LD Schema.org para Fuentes de Contexto

**Identificador:** PBI-CTX-007
**Estatus:** Pendiente (bloqueado por PBI-CTX-001 — veredicto del parser HTML y veredicto legal A8 — y PBI-CTX-005)
**Fecha de Creación:** 2026-09-30
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §4.2, §4.3 (paso 1), Anexo A8
**Módulo:** `src/features/context-sources/adapters/json-ld.adapter.ts` + test; `src/package.json` (parser HTML elegido)
**Entorno:** Parser HTML ligero de producción decidido en PBI-CTX-001
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-CTX-001 (CA-6 legal, CA-7 parser), PBI-CTX-005
**Bloquea:** PBI-CTX-008 (reutiliza el extractor como atajo)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Extraer los bloques `<script type="application/ld+json">` de páginas con veredicto legal favorable y mapear objetos `Event` / `LocalBusiness` a `ContextEntrySchema`, sin LLM.
- **Entorno:** Primera dependencia de parseo HTML en producción del proyecto.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Solo dominios con ToS y `robots.txt` favorables en el estudio; JSON-LD como `unknown` + Zod.
  - *Filtro B:* Extractor puro y reutilizable (lo usa PBI-CTX-008 como atajo).
  - *Filtro C:* Cero tokens.

---

## 1. Declaración de Intención (INVEST)

**Como** pipeline de ingesta,
**Quiero** leer los datos estructurados Schema.org que las webs de ocio ya publican,
**Para** obtener eventos limpios sin parsear el HTML visual ni gastar tokens.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Dependencia):** Se añade a `dependencies` exactamente la librería del veredicto de PBI-CTX-001. Prohibido parsear HTML con expresiones regulares.
- [ ] **CA-2 (Extractor):** Función pura exportada que devuelve todos los objetos JSON-LD de una página, soportando arrays y `@graph`; JSON inválido en un bloque no invalida los demás.
- [ ] **CA-3 (Mapeo):** `Event` (`name`, `startDate`, `endDate`, `location`, `offers`, `url`) y `LocalBusiness` mapeados a `ContextEntrySchema` con Zod.
- [ ] **CA-4 (Tests colocalizados):** Fixtures HTML reales de PBI-CTX-001: número esperado de entradas; página sin JSON-LD ⇒ lista vacía con `success: true`.
- [ ] **CA-5 (Cortesía):** `User-Agent` identificable y respeto de la cadencia documentada por dominio.
- [ ] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` y `npm run build` en verde (la nueva dependencia no rompe el build Docker).

---

## 3. Fuera de Alcance

- Extracción con LLM de páginas sin JSON-LD (PBI-CTX-008).
