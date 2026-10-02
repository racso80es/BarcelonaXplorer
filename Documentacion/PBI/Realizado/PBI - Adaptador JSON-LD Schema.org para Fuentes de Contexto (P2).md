# [ARQUITECTURA] Documento Destilado: PBI - Adaptador JSON-LD Schema.org para Fuentes de Contexto

**Identificador:** PBI-CTX-007
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-30
**Fecha de Finalización:** 2026-10-02
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §4.2, §4.3 (paso 1), Anexo A8
**Módulo:** `src/features/context-sources/adapters/json-ld.adapter.ts` + test; `src/package.json` (`node-html-parser`)
**Entorno:** Parser HTML ligero de producción decidido en PBI-CTX-001 (`node-html-parser`)
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

- [x] **CA-1 (Dependencia):** Se añade a `dependencies` exactamente la librería del veredicto de PBI-CTX-001 (`node-html-parser` v9.0.4). Prohibido parsear HTML con expresiones regulares.
- [x] **CA-2 (Extractor):** Función pura exportada `extractJsonLdBlocks(html: string): unknown[]` que devuelve todos los objetos JSON-LD de una página, soportando arrays y `@graph`; JSON inválido en un bloque no invalida los demás.
- [x] **CA-3 (Mapeo):** `Event` (`name`, `startDate`, `endDate`, `location`, `offers`, `url`) y `LocalBusiness` / `Place` mapeados a `ContextEntrySchema` con validación Zod y deduplicación con hash SHA-256.
- [x] **CA-4 (Tests colocalizados):** Pruebas colocalizadas en `src/features/context-sources/adapters/json-ld.adapter.test.ts` con fixture real `timeout-jsonld.html`: número esperado de entradas; página sin JSON-LD ⇒ lista vacía con `success: true`.
- [x] **CA-5 (Cortesía):** `User-Agent` identificable (`BarcelonaXplorer-Bot/1.0 (+https://barcelonaxplorer.cat)`) y respeto de cabeceras de cortesía.
- [x] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` (590 tests en verde) y `npm run build` en verde (la nueva dependencia compila limpiamente en Next.js Turbopack).

---

## 3. Evidencia de Implementación y Oráculos

- **Dependencia instalada:** `node-html-parser` v9.0.4 en `src/package.json`.
- **Adaptador:** `src/features/context-sources/adapters/json-ld.adapter.ts`.
- **Registro en Ingesta:** `JSON_LD` registrado en `defaultContextAdapters` en `src/app/api/context/ingest/route.ts`.
- **Suite de pruebas:** `src/features/context-sources/adapters/json-ld.adapter.test.ts` (5 tests unitarios).
- **Resultados de Oráculos:**
  - `tsc --noEmit`: 0 errores.
  - `eslint`: 0 warnings, 0 errores.
  - `vitest run`: 106 test files pasados, 590 tests pasados.
  - `npm run build`: compilación exitosa en 1418ms con 16 rutas estáticas y todas las API dinámicas.
