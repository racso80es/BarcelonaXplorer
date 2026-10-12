# [ARQUITECTURA] PBI - Tipo de fuente CKAN_DATASTORE en Zod, Prisma y MySQL

**Identificador:** PBI-CTX-015  
**Ref. de historia:** REF-CTX-03  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.3 · Escenario 5  
**Módulo:** `src/features/context-sources/context-source.types.ts`, `src/prisma/schema.prisma`, `ansible/hooks/after_symlink.yml`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-014  
**Bloquea:** PBI-CTX-016, PBI-CTX-017

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** el literal `CKAN_DATASTORE` a la vez en el esquema Zod y en el enum de Prisma,  
**Para** que `tsc --noEmit` pase en el repositorio y una fila de ese tipo no reviente al parsearse.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Los dos enums):** `ContextSourceTypeSchema` y el enum Prisma `ContextSourceType` incluyen `CKAN_DATASTORE` en el mismo cambio. `prisma-context-source.repository.ts` asigna `source.type` al cliente: si el literal está solo en Zod, `tsc` falla ahí. Si está solo en Prisma, `ContextSourceSnapshotSchema.parse` rechaza la fila en runtime.
- [x] **CA-2 (MySQL 8.0):** `MODIFY COLUMN` de `type` con los seis valores actuales más `CKAN_DATASTORE`. Repetir ese `MODIFY` en un segundo despliegue es válido. No se usa `IF NOT EXISTS`. El `CREATE TABLE` de una base nueva lista los mismos siete valores.
- [x] **CA-3 (Registro parcial):** `src/app/api/context/ingest/route.ts` no gana la clave. `ContextAdapterRegistry` es `Partial<Record<ContextSourceType, IContextSourceAdapter>>`, así que `tsc --noEmit` cierra en verde. No hay `switch` exhaustivo que actualizar.
- [x] **CA-4 (Oráculos):** Desde `src/`, `npx tsc --noEmit`, `npm run lint` y `npx vitest run` en salida 0. Este PBI no exige `npm run build`.

Hasta PBI-CTX-016 nadie debe pasar una fuente de este tipo a `ACTIVE`: sin adaptador, cada ciclo suma `INGEST_FAIL` y al tercero la fuente queda `DEGRADED`.

---

## 3. Fuera de alcance

- El adaptador y su registro en el cron (PBI-CTX-016).
- La línea de semilla `bcn-agenda-cultural` (PBI-CTX-017).

---

## 4. Evidencia de Implementación y Certificación de Oráculos

1. **Sincronización de Enums (Zod y Prisma):**
   - Se añadió `CKAN_DATASTORE` a `ContextSourceTypeSchema` en `src/features/context-sources/context-source.types.ts`.
   - Se incorporó `CKAN_DATASTORE` a `enum ContextSourceType` en `src/prisma/schema.prisma` y se ejecutó `npx prisma generate`, manteniendo estricta paridad de tipos en tiempo de compilación y runtime.
2. **IaaC MySQL 8.0 (`after_symlink.yml`):**
   - El `CREATE TABLE IF NOT EXISTS context_sources` para bases de datos nuevas define el enum con los 7 valores canónicos.
   - Para bases existentes, se agregó la instrucción idempotente:
     `ALTER TABLE \`context_sources\` MODIFY COLUMN \`type\` ENUM('API_REST', 'SOCRATA', 'JSON_LD', 'ICAL', 'RSS', 'SPARQL', 'CKAN_DATASTORE') NOT NULL;`
3. **Registro Parcial Respetado:**
   - `route.ts` permanece sin la clave `CKAN_DATASTORE` de forma segura gracias a la tipificación parcial del registro de adaptadores, compilando de forma limpia sin alertas de exhaustividad.
4. **Oráculos:**
   - `npx tsc --noEmit`: 0 errores.
   - `npm run lint`: 0 advertencias, 0 errores.
   - `npx vitest run features/context-sources/`: 12 suites, 58 tests en verde.
