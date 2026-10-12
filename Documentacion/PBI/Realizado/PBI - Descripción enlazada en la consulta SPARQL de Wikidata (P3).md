# [ARQUITECTURA] PBI - Descripción enlazada en la consulta SPARQL de Wikidata

**Identificador:** PBI-CTX-020  
**Ref. de historia:** REF-CTX-07a  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de realización:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.7 · Escenario 4  
**Módulo:** `src/features/context-sources/adapters/sparql-context.adapter.ts`, `sparql-context.adapter.test.ts`  
**Prioridad:** Baja (P3)  
**Depende de:** PBI-CTX-006  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que la consulta enlace `?description`,  
**Para** que el resumen del monumento deje de ser la frase sintética fija.

La consulta por defecto selecciona `?description` y no lo une a ningún patrón. El servicio de etiquetas de Wikidata rellena `?itemLabel` y `?itemDescription`, no `?description`. El esquema Zod del adaptador ya espera el binding `description`.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Consulta):** La consulta por defecto proyecta deterministamente `(?itemDescription AS ?description)` en conjunción con `SERVICE wikibase:label { bd:serviceParam wikibase:language "ca,es,en". }`, enlazando la descripción con prioridad lingüística `ca > es > en`. Se asegura deduplicación en memoria para que una misma URI produzca exactamente una entrada única en el sobre.
- [x] **CA-2 (Test):** Las pruebas con fixtures conteniendo descripciones en catalán (`ca`) de al menos 10 caracteres verifican que se asigna dicho contenido como `summary` sin recurrir a la frase sintética fallback.
- [x] **CA-3 (Esquema):** El nombre del binding en `SparqlBindingSchema` y en la proyección se mantiene como `description` (sin renombrar a `itemDescription`).
- [x] **CA-4 (Oráculos):** Compilación `npx tsc --noEmit` en 0 errores, linter `npm run lint` en 0 advertencias y suite `npx vitest run` (124 archivos, 706 tests) en salida 0.

---

## 3. Evidencias de Implementación y Oráculos

- **Adaptador SPARQL actualizado:** `src/features/context-sources/adapters/sparql-context.adapter.ts`
- **Tests colocalizados:** `src/features/context-sources/adapters/sparql-context.adapter.test.ts`
- **Resultados de Oráculos:**
  - `npx tsc --noEmit`: Salida 0
  - `npm run lint`: Salida 0
  - `npx vitest run`: 124 archivos pasados, 706 tests pasados (100% verde)
