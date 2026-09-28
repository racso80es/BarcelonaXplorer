# [OPERATIVO] Documento Destilado: PBI - Gobernanza de Render del Orquestador y del Lienzo

**Identificador:** PBI-STEEL-015
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-14, y la fila TC-NEXT-001 de `page.tsx` en el Códice
**Módulo:** Orquestador — UI
**Entorno:** `src/app/orchestrator/page.tsx`, `src/components/tactical/hybrid-canvas.tsx`
**Prioridad:** Media (P2 — la página entera se vuelve a pintar en cada tecla)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-STEEL-005 y PBI-STEEL-006, que reescriben la entrega y el contrato que esta página pinta. No se arregla el caso "lienzo montado con 0 waypoints porque está streameando": ese montaje desaparece con PBI-STEEL-005.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Cada tecla llama a `setInputValue` y repinta turnos y lienzo. `setNotification` se invoca dentro del actualizador de `setActiveItinerary` (en Strict Mode corre dos veces). `timestamp={new Date()}` cambia en cada render. El estado inicial lee `window.location` en un componente que también se renderiza en servidor.
- **Entorno:** Página del orquestador y `HybridCanvas`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El texto tecleado no vuelve a renderizar el lienzo.
  - *Filtro B:* La hora de un turno es la de su creación.
  - *Filtro C:* La URL se lee donde el Códice ya permite leerla, no durante el render compartido con el servidor.

---

## 1. Declaración de Intención (INVEST)

**Como** usuario del orquestador,
**Quiero** que escribir en el campo no reconstruya el lienzo ni cambie las horas ya mostradas,
**Para** que la interfaz no haga trabajo ni enseñe datos distintos en cada pulsación.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Campo de texto):** el input deja de ser la fuente de un `useState` de la página. El envío sigue leyendo el formulario. Un test de pulsación demuestra que `HybridCanvas` no se vuelve a renderizar por cada carácter.
- [ ] **CA-2 (Lienzo estable):** `HybridCanvas` se memoiza. `handleSelectOption` y `handleTimeShift` no se recrean en cada render de la página.
- [ ] **CA-3 (Notificación fuera del actualizador):** `setNotification` no se llama dentro de la función pasada a `setActiveItinerary`. El test cubre que una sola acción produce una sola notificación.
- [ ] **CA-4 (Marca de tiempo):** el `Date` se crea al añadir el turno y se guarda en el dato del turno. Re-renderizar la página no cambia el texto de la hora.
- [ ] **CA-5 (TC-NEXT-001 en esta página):** desaparece la lectura de `window.location` durante el estado inicial. La query se obtiene en un efecto o desde el Server Component, como ya pide el Códice. Al cerrar, la fila de deuda TC-NEXT-001 de `page.tsx` se borra. La de `telegram-anchor-drop.tsx` se queda: es otro fichero y no entra aquí.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Las líneas del Log (716, 460-484, 571, 31-47, 89-91) son las del 2026-09-28.** PBI-STEEL-005 y PBI-STEEL-006 mueven `page.tsx`. Al forjar, se localiza el comportamiento, no el número de línea.
- **`expandedNodeId` con cero waypoints** era un síntoma del streaming. No se añade un caso especial para un modo que PBI-STEEL-005 elimina.

---

## 4. Evidencia de Certificación

Pendiente de forja.
