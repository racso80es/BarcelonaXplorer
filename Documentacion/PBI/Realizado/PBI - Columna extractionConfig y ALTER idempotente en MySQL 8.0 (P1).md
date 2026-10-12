# [ARQUITECTURA] PBI - Columna extractionConfig y ALTER idempotente en MySQL 8.0

**Identificador:** PBI-CTX-014  
**Ref. de historia:** REF-CTX-02b  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.2  
**Módulo:** `src/prisma/schema.prisma`, `src/features/context-sources/prisma-context-source.repository.ts`, `ansible/hooks/after_symlink.yml`  
**Entorno:** Prisma 5, imagen `mysql:8.0`. Producción no ejecuta `prisma migrate`.  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-013  
**Bloquea:** PBI-CTX-015, PBI-CTX-016, PBI-CTX-017

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que `extraction` sobreviva en MySQL y se actualice en filas ya existentes,  
**Para** que un segundo despliegue no falle y un segundo `loadSeed` no borre el estado operativo.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Prisma):** `ContextSource.extractionConfig` es `Json?`. El repositorio lo convierte al value object de PBI-CTX-013. Ningún tipo de `@prisma/client` sale del puerto (`TC-PRISMA-001`). Tras el cambio, `npx prisma generate`.
- [x] **CA-2 (Base nueva):** El `CREATE TABLE IF NOT EXISTS` de `context_sources` en `after_symlink.yml` incluye la columna `extractionConfig` JSON NULL. El `ENUM` de `type` no cambia en este PBI.
- [x] **CA-3 (Base ya creada):** Antes del `ADD COLUMN` se consulta `INFORMATION_SCHEMA.COLUMNS` con `TABLE_SCHEMA = DATABASE()`, `TABLE_NAME = 'context_sources'` y `COLUMN_NAME = 'extractionConfig'`. El `ALTER` solo corre si el recuento es 0. No se usa `ADD COLUMN IF NOT EXISTS` (MySQL 8.0 lo rechaza con 1064). Un segundo pase del playbook no emite 1060.
- [x] **CA-4 (Upsert):** Create y update escriben `extractionConfig`. No escriben `status`, `failedAttempts`, `lastError` ni `lastErrorAt`. La comparación es el objeto parseado: si el JSON no cambió, la fila cuenta como `untouched`.
- [x] **CA-5 (Oráculos):** Desde `src/`, `npx tsc --noEmit`, `npm run lint` y `npx vitest run` en salida 0.

---

## 3. Fuera de alcance

- Añadir `CKAN_DATASTORE` al enum (PBI-CTX-015).
- Quitar la guarda de catálogo vacío (PBI-CTX-017).

---

## 4. Evidencia de Implementación y Certificación de Oráculos

1. **Esquema Relacional Prisma y Generación (`schema.prisma`):**
   - Se añadió el campo `extractionConfig Json? @db.Json` al modelo `ContextSource`.
   - Se ejecutó `npx prisma generate`, actualizando los tipos del cliente Prisma sin fugas fuera del repositorio hexagonal (`TC-PRISMA-001`).
2. **Repositorio Hexagonal (`prisma-context-source.repository.ts`):**
   - Mapeo bidireccional entre la columna relacional JSON y el value object `ExtractionConfigSchema`.
   - En `upsertFromSeed`:
     - Inserta `extractionConfig` en filas nuevas.
     - En filas existentes, compara la igualdad semántica del JSON parseado; si no hay cambios, preserva la fila como `untouched`.
     - Si hay cambios, actualiza los metadatos y `extractionConfig` sin tocar `status`, `failedAttempts`, `lastError` ni `lastErrorAt`.
3. **IaaC y DDL Idempotente en Ansible (`ansible/hooks/after_symlink.yml`):**
   - Se incluyó `extractionConfig JSON NULL` en la sentencia `CREATE TABLE IF NOT EXISTS context_sources`.
   - Para bases de datos ya existentes (como Nodo 11 en producción), se implementó una verificación condicional determinista mediante sonda a `INFORMATION_SCHEMA.COLUMNS` (`TABLE_SCHEMA = DATABASE()`, `TABLE_NAME = 'context_sources'`, `COLUMN_NAME = 'extractionConfig'`) y ejecución dinámica con `PREPARE`/`EXECUTE` únicamente si el recuento es 0, evitando el error 1064 de `ADD COLUMN IF NOT EXISTS` y previniendo el error 1060 (`Duplicate column name`) en despliegues sucesivos.
4. **Batería de Pruebas Colocalizadas (`prisma-context-source.repository.test.ts`):**
   - 3 tests unitarios pasando, certificando inserción, actualización condicional sin pisar estado operativo, y conteo `untouched` ante configuraciones idénticas.
5. **Oráculos:**
   - `npx tsc --noEmit`: 0 errores.
   - `npm run lint`: 0 advertencias, 0 errores.
   - `npx vitest run`: 3 tests pasando en verde.
