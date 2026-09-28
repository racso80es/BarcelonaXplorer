# [OPERATIVO] Documento Destilado: PBI - Cierre de i18n en Lienzo y Orquestador

**Identificador:** PBI-STEEL-019
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-15
**Módulo:** UI — diccionario
**Entorno:** `src/components/tactical/hybrid-canvas.tsx`, `src/app/orchestrator/page.tsx`, `src/features/i18n/domain/ui-dictionary.ts`
**Prioridad:** Baja (P3 — con `lang='en'` la interfaz mezcla castellano)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-STEEL-005, PBI-STEEL-006 y PBI-STEEL-015. Los tres reescriben la página y el lienzo. Traducir antes obliga a repetir el trabajo.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Hay literales en castellano fuera del diccionario. El Log los sitúa en `hybrid-canvas.tsx` (líneas 192, 201, 209, 286, 363, 378, 436-442 y 478 del 2026-09-28) y en las chispas y mensajes de `page.tsx` (líneas 237-244, 259-301 y 409).
- **Entorno:** Lienzo, página del orquestador y el diccionario que el proyecto ya usa.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Ningún texto visible se queda escrito en el componente.
  - *Filtro B:* Inglés y castellano salen de la misma tabla.
  - *Filtro C:* Un test de render en inglés falla si aparece una frase de la lista en castellano.

---

## 1. Declaración de Intención (INVEST)

**Como** usuario con idioma soberano en inglés,
**Quiero** que el lienzo y el orquestador no mezclen frases en castellano,
**Para** que el idioma elegido sea el de toda la pantalla, no solo el de una parte.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Inventario posterior):** inventario exhaustivo de literales en `hybrid-canvas.tsx` (banners didácticos base y S+ Grade, prefijos de transit tips, títulos de alternativas y opciones disponibles, 'Verificado vía', 'Proveedor', aria-labels de colapso y edición) y en `page.tsx` (mensajes de triaje, chispas de diagnóstico, errores de comunicación, notificaciones de propagación horaria, input en espera y estado de orquestación).
- [x] **CA-2 (Diccionario):** incorporadas todas las claves en `src/features/i18n/domain/ui-dictionary.ts` bajo `hybridCanvas` y `orchestrator`, cubriendo simétricamente los 6 idiomas soportados (`es`, `en`, `fr`, `de`, `it`, `ca`). Sin sistemas secundarios de traducción.
- [x] **CA-3 (Test):** tests específicos en `hybrid-canvas.test.tsx` y `app/orchestrator/__tests__/page.test.tsx` que renderizan con `lang='en'` y afirman explícitamente (`not.toContain`) la ausencia de cada una de las frases en castellano inventariadas en CA-1, validando la presencia de las correspondientes en inglés.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No traducir el repositorio entero.** F-15 nombra dos ficheros. Otros literales en castellano, si aparecen, se anotan y quedan fuera.
- **El diccionario ya existe** en `src/features/i18n/domain/ui-dictionary.ts`, con su test al lado. No se crea otro.

---

## 4. Evidencia de Certificación

- **Diccionario unificado:** `src/features/i18n/domain/ui-dictionary.ts` ampliado con sección canónica `orchestrator` y 10 nuevas propiedades en `hybridCanvas` para los 6 idiomas.
- **Componentes saneados:** `src/components/tactical/hybrid-canvas.tsx` y `src/app/orchestrator/page.tsx` vinculados 100% al diccionario mediante `getUiDictionary(lang)`.
- **Oráculos en verde:**
  - `npx vitest run components/tactical/hybrid-canvas.test.tsx app/orchestrator/__tests__/page.test.tsx features/i18n/domain/ui-dictionary.test.ts` → 3 ficheros, 13 tests en verde.
  - `npx tsc --noEmit && npm run lint` → 0 errores, 0 warnings.
