# [ARQUITECTURA] PBI - Esquema Zod de extracción CKAN en la semilla

**Identificador:** PBI-CTX-013  
**Ref. de historia:** REF-CTX-02a  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.2 · Escenario 2  
**Módulo:** `src/features/context-sources/context-source.types.ts`, `context-source-seed.service.ts`, `context-source-seed.service.test.ts`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-004  
**Bloquea:** PBI-CTX-014, PBI-CTX-016

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** un bloque `extraction` opcional en la semilla, validado entero con Zod,  
**Para** declarar dataset, recurso y mapa de campos sin añadir todavía el tipo de fuente `CKAN_DATASTORE`.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Semilla actual):** `context-sources.seed.yml` vigente, sin bloque `extraction`, sigue cargando con sobre de éxito.
- [x] **CA-2 (Estrategia única):** La unión discriminada tiene un solo valor de `strategy`: `CKAN_DATASTORE`. Ese literal no entra en `ContextSourceTypeSchema`. No existen `RSS_ENRICHED`, `SPARQL_CUSTOM` ni `SOCRATA_WINDOW`.
- [x] **CA-3 (Contrato):** El objeto exige `dataset`, `resourceSelector` (`format`, `datastoreActive`), `fieldMap`, `pageSize`, `maxRecords` y `timeoutMs`. `groupBy` es opcional. No hay campo `resource_id`. Esquemas nuevos usan la API de Zod 4 (`TC-ZOD-001`).
- [x] **CA-4 (Rechazo atómico):** Una estrategia distinta o un mapa incompleto devuelve `exitCode` 422 y no llama a `upsertFromSeed`. El fichero no se acepta a medias.
- [x] **CA-5 (Oráculos):** Desde `src/`, `npx tsc --noEmit`, `npm run lint` y `npx vitest run` en salida 0.

`SeedSourceInput` puede llevar `extraction` opcional. Persistirlo es PBI-CTX-014. Hasta entonces el cargador puede parsearlo y el repositorio aún no tiene columna.

---

## 3. Fuera de alcance

- Columna MySQL, `schema.prisma` y `ALTER` (PBI-CTX-014).
- Valor `CKAN_DATASTORE` en el enum de tipo de fuente (PBI-CTX-015).
- Adaptador y fixtures (PBI-CTX-016).

---

## 4. Evidencia de Implementación y Certificación de Oráculos

1. **Esquemas Zod Deterministas (`context-source.types.ts`):**
   - Se forjaron los esquemas inmutables `CkanResourceSelectorSchema`, `CkanFieldMapSchema` y `CkanDatastoreExtractionConfigSchema` con `.strict()` para prevenir contaminación por atributos espurios o no contratados (como `resource_id`).
   - Se expuso la unión discriminada `ExtractionConfigSchema = z.discriminatedUnion('strategy', [CkanDatastoreExtractionConfigSchema])`, garantizando que únicamente la estrategia `CKAN_DATASTORE` sea aceptada y rechazando estrategias tentativas no canónicas.
   - `ContextSourceTypeSchema` permanece inalterado con los 6 valores iniciales.
2. **Cargador de Semilla (`context-source-seed.service.ts`):**
   - Se actualizó `SeedSourceYamlSchema` para admitir `extraction: ExtractionConfigSchema.optional()`.
   - Se enriqueció `SeedSourceInput` con el campo `extraction` para desacoplar la validación de la posterior persistencia relacional.
   - En caso de fallo de validación en cualquier entrada, se emite un `OperationEnvelope` con `exitCode: 422` y cero llamadas a `upsertFromSeed` (rechazo atómico).
3. **Batería de Pruebas Colocalizadas (`context-source-seed.service.test.ts`):**
   - 8 tests unitarios pasando, cubriendo retrocompatibilidad de semilla sin `extraction`, aceptación de bloque válido, rechazo de estrategias ilegales (`RSS_ENRICHED`), rechazo de `fieldMap` incompleto y rechazo ante la presencia de `resource_id`.
4. **Oráculos:**
   - `npx tsc --noEmit`: 0 errores.
   - `npm run lint`: 0 advertencias, 0 errores.
   - `npx vitest run`: 8 tests pasando en verde.
