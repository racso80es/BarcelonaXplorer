# [ARQUITECTURA] PBI - Festivos iCal sin precio impuesto

**Identificador:** PBI-CTX-022  
**Ref. de historia:** REF-CTX-07c  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de realización:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.7 · Escenario 4  
**Módulo:** `src/features/context-sources/adapters/ical-context.adapter.ts`, `ical-context.adapter.test.ts`  
**Prioridad:** Baja (P3)  
**Depende de:** PBI-CTX-006  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que un festivo no lleve `price: Gratis` ni la terna fija de tags,  
**Para** que el corpus no describa el calendario laboral como una actividad con entrada libre.

El adaptador escribe `price = 'Gratis'` y tags `festiu`, `oficial`, `barcelona`. El test espera `price === 'Gratis'`. El fixture `bcn-festes.ics` trae `DESCRIPTION` con valores reales: `Festes estatals`, `Festes autonòmiques`, `Festes locals de Barcelona`.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Precio):** La entrada omite deterministamente el campo `price` (queda `undefined`), eliminando la semántica engañosa de actividad con entrada libre.
- [x] **CA-2 (Tag):** El tag se extrae directamente de la propiedad `DESCRIPTION` del VEVENT (e.g. `Festes estatals`, `Festes autonòmiques`, `Festes locals de Barcelona`). Se elimina la terna fija `festiu`, `oficial` y `barcelona`.
- [x] **CA-3 (Test):** La prueba unitaria con el fixture `bcn-festes.ics` verifica que `price` no está definido y comprueba que para `Cap d'Any` el tag coincide con `Festes estatals` sin incluir los tags fijos desestimados.
- [x] **CA-4 (Oráculos):** Compilación `npx tsc --noEmit` en 0 errores, linter `npm run lint` en 0 advertencias y suite `npx vitest run` (124 archivos, 708 tests) en salida 0.

---

## 3. Evidencias de Implementación y Oráculos

- **Adaptador iCal actualizado:** `src/features/context-sources/adapters/ical-context.adapter.ts`
- **Tests colocalizados:** `src/features/context-sources/adapters/ical-context.adapter.test.ts`
- **Resultados de Oráculos:**
  - `npx tsc --noEmit`: Salida 0
  - `npm run lint`: Salida 0
  - `npx vitest run`: 124 archivos pasados, 708 tests pasados (100% verde)
