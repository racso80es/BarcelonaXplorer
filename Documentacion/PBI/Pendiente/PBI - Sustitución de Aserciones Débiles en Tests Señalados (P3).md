# [OPERATIVO] Documento Destilado: PBI - Sustitución de Aserciones Débiles en Tests Señalados

**Identificador:** PBI-STEEL-021
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · T-09. F-20 queda fuera: ver notas.
**Módulo:** QA — aserciones
**Entorno:** los cuatro ficheros del recuento del Log. Al redactar, `cognitive-kpi-cards.test.tsx` está en `tests/app/Admin/Cognitive/`; los otros tres se localizan al forjar (`ui-dictionary.test.ts`, `data-table.test.tsx`, `orchestrator/__tests__/page.test.tsx`)
**Prioridad:** Baja (P3 — indicador, no veredicto)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-STEEL-018 si alguno de los cuatro sigue bajo `tests/` en el momento de forjar: se mueven antes, o este PBI los edita ya en su sitio nuevo. No se editan en el espejo para volver a moverlos.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El Log contó `toBeDefined()`, `toBeTruthy()` y `not.toBeNull()`: 18 en el diccionario de UI, 18 en la tabla, 17 en la página del orquestador y 13 en las tarjetas KPI. Es una densidad, no una lista de tests rotos.
- **Entorno:** Esos cuatro ficheros, allí donde estén cuando se forje.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Una aserción que solo prueba que algo existe pasa a comparar un valor o un esquema.
  - *Filtro B:* Se conserva un `toBeTruthy` cuando el valor bajo prueba es un booleano con significado.
  - *Filtro C:* La certificación anota cuántas se sustituyeron en cada fichero. No se exige cero.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio del oráculo,
**Quiero** que esos cuatro tests fallen cuando el dato cambie y no solo cuando desaparezca,
**Para** que un verde signifique el valor esperado.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (F-20, título y baseline):** ya cerrado el 2026-09-28. La HU-15 se titula como HU-15 y el Anexo A.2 cifra 88 ficheros y 471 tests. No se reabre.
- [x] **CA-2 (F-20, barrels):** la enmienda de ADR-001 es de PBI-STEEL-007. No se duplica aquí.
- [ ] **CA-3 (Revisión):** cada uno de los cuatro ficheros se lee. Toda aserción de la familia contada que no compruebe un valor pasa a `toBe`, `toEqual` o un `safeParse` del esquema correspondiente.
- [ ] **CA-4 (Certificación):** el cierre lista, por fichero, cuántas aserciones había de esa familia y cuántas quedaron, con el motivo de las que se conservan.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El recuento no es una deuda de "borrar el matcher".** `toBeTruthy()` sobre un flag calculado puede ser la aserción correcta. CA-4 existe para no convertir el indicador en una cuota.
- **La página del orquestador la reescriben PBI-STEEL-005, 006 y 015.** Si `page.test.tsx` desaparece o cambia de sitio, se revisa el test que haya quedado cubriendo la página. No se restaura el fichero viejo para poder editarlo.
- **Las otras observaciones de la sección 7 del Log no son este PBI** ni tienen documento: el error minificado #412 en `/Admin/System`, los 404 del webhook de Telegram y los timeouts de Jev. Siguen siendo observaciones.

---

## 4. Evidencia de Certificación

Pendiente de forja. CA-1 y CA-2 ya están hechos en la documentación de la HU y en el encargo de PBI-STEEL-007.
