# [ARQUITECTURA] PBI - RSS de Betevé con content:encoded

**Identificador:** PBI-CTX-019  
**Ref. de historia:** REF-CTX-05  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de realización:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.5 · Escenario 4  
**Módulo:** `src/features/context-sources/adapters/rss-context.adapter.ts`, `rss-context.adapter.test.ts`  
**Prioridad:** Media (P2)  
**Depende de:** PBI-CTX-006  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que el resumen RSS salga de `<content:encoded>` cuando el ítem lo traiga,  
**Para** dejar de vectorizar el extracto cortado de `<description>`.

El fixture `Documentacion/Fuentes/muestras-contexto/beteve-agenda.rss` ya contiene `<content:encoded>` y un ítem de categoría `mobilitat`. El adaptador hoy lee `<description>`, recorta a 1200 y prefija el id con `beteve:`.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Cuerpo):** Si `<content:encoded>` contiene al menos 10 caracteres tras eliminar etiquetas HTML (`stripHtml`), dicho texto constituye el `summary`, recortado a 1200 caracteres. Si no está presente o no alcanza la longitud mínima, se realiza fallback a `<description>` con la misma regla de saneamiento.
- [x] **CA-2 (Fixture):** La prueba unitaria con `beteve-agenda.rss` verifica que el resumen se extrae del cuerpo `content:encoded` (incluyendo oraciones posteriores como `en què van morir 11 persones`) y no del extracto mutilado con puntos suspensivos (`[…]` / `[&#8230;]`).
- [x] **CA-3 (Semilla):** El endpoint se mantiene en `https://beteve.cat/feed/`. No se introducen listas blancas de categorías no auditadas, ni el tag artificial `agregador`. El prefijo identificador `beteve:` se mantiene inalterado.
- [x] **CA-4 (Oráculos):** Compilación `npx tsc --noEmit` en 0 errores, linter `npm run lint` en 0 advertencias y suite `npx vitest run` (124 archivos, 703 tests) en salida 0.

---

## 3. Evidencias de Implementación y Oráculos

- **Adaptador RSS actualizado:** `src/features/context-sources/adapters/rss-context.adapter.ts`
- **Tests colocalizados:** `src/features/context-sources/adapters/rss-context.adapter.test.ts`
- **Resultados de Oráculos:**
  - `npx tsc --noEmit`: Salida 0 (sin errores)
  - `npm run lint`: Salida 0 (cero warnings)
  - `npx vitest run`: 124 archivos pasados, 703 tests pasados (100% verde)
