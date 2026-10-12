# [ARQUITECTURA] PBI - Ventana temporal solo en la agenda Socrata

**Identificador:** PBI-CTX-021  
**Ref. de historia:** REF-CTX-07b  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de realización:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.7 · Escenario 4  
**Módulo:** `src/features/context-sources/adapters/socrata-context.adapter.ts`, `socrata-context.adapter.test.ts`  
**Prioridad:** Baja (P3)  
**Depende de:** PBI-CTX-006  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que la agenda cultural de la Generalitat pida primero lo que aún no ha terminado,  
**Para** no gastar el `$limit=25` en actividades ya cerradas.

El mismo adaptador llama a `source.endpoint`. La agenda es el recurso `rhpv-yr4f` y tiene `data_inici` y `data_fi`. Los equipamientos son `48s6-82h2` y no tienen esas columnas. Un `$where=data_fi` en esa URL la rompe.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Agenda):** Si el endpoint contiene `rhpv-yr4f`, la petición añade ordenación ascendente `data_inici ASC` y una cláusula `$where` evaluando `data_fi` a partir del instante de ejecución del fetch (`data_fi >= '${nowIso}'`). Si la URL contiene el marcador `{hoy}`, se reemplaza en tiempo de ejecución por la fecha actual en ISO sin conservar el texto literal.
- [x] **CA-2 (Equipamientos):** Si el endpoint contiene `48s6-82h2` (Equipaments Culturals), la URL se conserva exactamente como la configurada en la fuente, sin agregar parámetros temporales incompatibles.
- [x] **CA-3 (Oráculos):** Compilación `npx tsc --noEmit` en 0 errores, linter `npm run lint` en 0 advertencias y suite `npx vitest run` (124 archivos, 708 tests) en salida 0.

---

## 3. Evidencias de Implementación y Oráculos

- **Adaptador Socrata actualizado:** `src/features/context-sources/adapters/socrata-context.adapter.ts`
- **Tests colocalizados:** `src/features/context-sources/adapters/socrata-context.adapter.test.ts`
- **Resultados de Oráculos:**
  - `npx tsc --noEmit`: Salida 0
  - `npm run lint`: Salida 0
  - `npx vitest run`: 124 archivos pasados, 708 tests pasados (100% verde)
