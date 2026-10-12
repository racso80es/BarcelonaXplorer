# [ARQUITECTURA] PBI - Aduana de APPROVE de CKAN_DATASTORE sin extracción

**Identificador:** PBI-CTX-028  
**Ref. de historia:** ARGOS-TIPO-02  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [Clasificación de Argos sobre el Portal Open Data del Ajuntament](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Clasificaci%C3%B3n%20de%20Argos%20sobre%20el%20Portal%20Open%20Data%20del%20Ajuntament.md) · §4 · Escenario 4  
**Módulo:** `src/features/context-sources/context-admin.service.ts`, `src/features/context-sources/context-admin.service.test.ts`  
**Prioridad:** Alta (P1)  
**Orden de forja:** 2 de 2. Después de PBI-CTX-027.  
**Depende de:** PBI-CTX-013 (`CkanDatastoreExtractionConfigSchema`), PBI-CTX-015 (literal `CKAN_DATASTORE`), PBI-CTX-027 (la propuesta que esta aduana protege)  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que `APPROVE` de un `CKAN_DATASTORE` sin extracción válida responda 422 y no escriba `ACTIVE`,  
**Para** que una propuesta de Argos, que nace sin `dataset` ni `fieldMap`, no entre en el ciclo de ingesta y caiga a `DEGRADED` al tercer `INGEST_FAIL`.

La guarda vive en `ContextAdminService.transitionSource`, después de `canTransition` y antes de `applyTransition` / `save`. El esquema de contraste es `CkanDatastoreExtractionConfigSchema` (`strategy`, `dataset`, `resourceSelector`, `fieldMap`, `pageSize`, `maxRecords`, `timeoutMs`). `null`, `undefined` y un objeto que no pasa `safeParse` son extracción inválida.

`REJECT` de esa misma fila sigue permitido y pasa a `INACTIVE`. Un `APPROVE` de otro tipo sin `extractionConfig` sigue escribiendo `ACTIVE`: la guarda solo aplica cuando `type` es `CKAN_DATASTORE`. Un `CKAN_DATASTORE` con extracción que sí pasa el esquema se aprueba como hasta ahora.

Esta entrega no añade un formulario de extracción al panel.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Aprobar a ciegas, Escenario 4):** Una fila `CKAN_DATASTORE` en `PENDING_APPROVAL` con `extractionConfig` ausente o `null`, ante `APPROVE` / `HUMAN`, devuelve un `OperationEnvelope` con `success: false` y `exitCode: 422`. `save` no se llama. El estado persistido sigue siendo `PENDING_APPROVAL`.
- [x] **CA-2 (Esquema):** El mismo 422, sin `save`, cuando `extractionConfig` es un objeto que no pasa `CkanDatastoreExtractionConfigSchema` (falta `dataset` o `fieldMap`, u otra clave que el `.strict()` rechaza).
- [x] **CA-3 (Extracción válida):** `APPROVE` de un `CKAN_DATASTORE` cuyo `extractionConfig` pasa el esquema escribe `ACTIVE` y llama a `save`. El test de `JSON_LD` sin extracción que hoy aprueba sigue en verde.
- [x] **CA-4 (Rechazo):** `REJECT` de un `CKAN_DATASTORE` sin extracción sigue siendo legal: el sobre es de éxito, el estado pasa a `INACTIVE` y `save` se llama.
- [x] **CA-5 (Oráculos):** Desde `src/`, `npx tsc --noEmit`, `npm run lint` y `npx vitest run features/context-sources/context-admin.service.test.ts` en salida 0.

---

## 3. Fuera de alcance

- La matriz de exploración (PBI-CTX-027).
- Editor de `extraction` en el panel.
- Rellenar `fieldMap` o dar de alta datasets. Las filas de semilla que ya traen extracción válida siguen aprobables (CA-3).
- Cambiar la máquina de estados: la regla `PENDING_APPROVAL` + `APPROVE` → `ACTIVE` permanece. La aduana es una precondición del servicio, anterior a `applyTransition`.

---

## 4. Resolución y Evidencias Técnicas

1. **Aduana Determinista en el Servicio Administrativo:**
   - Incorporada validación previa en `ContextAdminService.transitionSource` ejecutada tras `canTransition` y previa a `applyTransition`/`save`.
   - Contrasta `source.extractionConfig` mediante `CkanDatastoreExtractionConfigSchema.safeParse` únicamente si `event === 'APPROVE'` y `source.type === 'CKAN_DATASTORE'`.
   - Si la extracción es nula, indefinida o no cumple con el esquema estricto (faltan `dataset`, `resourceSelector` o `fieldMap`), emite un `OperationEnvelope` de error con `exitCode: 422` y aborta la persistencia.
2. **Preservación de Flujos Operativos:**
   - La transición `REJECT` para fuentes `CKAN_DATASTORE` sin extracción se ejecuta limpiamente hacia `INACTIVE` llamando a `save`.
   - Fuentes de otros tipos (p. ej. `JSON_LD`) se aprueban hacia `ACTIVE` sin requerir `extractionConfig`.
3. **Validación de Oráculos S+ Grade:**
   - **Vitest:** 11/11 pruebas unitarias superadas en `context-admin.service.test.ts` (115/115 en todo el vertical slice `context-sources`).
   - **TypeScript:** `npx tsc --noEmit` completado con salida 0.
   - **ESLint:** `npm run lint` limpio con 0 warnings y 0 errores.
