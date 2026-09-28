# [OPERATIVO] Documento Destilado: PBI - Desactivación del Drop de Fatiga sin Progreso Real

**Identificador:** PBI-STEEL-013
**Estatus:** Realizado (2026-09-28)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-12
**Módulo:** Telegram — patrulla reactiva
**Entorno:** `src/app/api/telegram/patrol/route.ts`, `src/features/planner/affiliate/affiliate-enricher.service.ts`, `src/features/telegram/reactive/reactive-patrol.use-case.ts`
**Prioridad:** Media (P2 — drops de Cabify calculados sobre un plan, no sobre lo andado)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-STEEL-001, porque ambos editan la ruta de patrulla. PBI-STEEL-011 puede haber retirado el breaker del enriquecedor; este PBI no lo restaura.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Con dos o más paradas, la ruta marca como completadas todas menos la última y evalúa la fatiga sobre ese plan. No hay posición ni check-in del usuario. Además, `isOutdoor` sale de `rainFriendly === false`, y el enriquecedor fija `rainFriendly` siempre a `true`.
- **Entorno:** Ruta de patrulla, caso de uso reactivo y metadato del enriquecedor.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Decisión tomada: el drop por fatiga no se envía hasta que exista un progreso registrado. No se diseña el check-in en este PBI.
  - *Filtro B:* Una parada no se declara al aire libre por un booleano que el código escribe siempre igual.
  - *Filtro C:* El resto de la patrulla (anclajes, secreto, recuentos) sigue en PBI-STEEL-001.

---

## 1. Declaración de Intención (INVEST)

**Como** usuario con un anclaje de Telegram,
**Quiero** no recibir un drop de fatiga por una ruta que no he empezado,
**Para** que el aviso dependa de un desplazamiento real y no del dibujo del itinerario.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Sin progreso inventado):** desaparece el reparto "todas las paradas menos la última están completadas" (`route.ts`, bloque que parte `mappedWaypoints`). Sin un registro de progreso, `completedWaypoints` va vacío y no hay `nextWaypoint` supuesto.
- [x] **CA-2 (Drop apagado):** el caso de uso no dispara el drop de fatiga cuando no hay progreso registrado. El test cubre una ruta de varias paradas y cero avances, y espera que no haya envío a Telegram por fatiga.
- [x] **CA-3 (`rainFriendly`):** el enriquecedor deja de escribir `rainFriendly: true` como constante. Hasta que un dato real lo rellene, el campo se omite y la patrulla no deduce `isOutdoor` de su ausencia. El caso `ACTIVITY` / `GENERAL` se revisa en el mismo cambio: hoy marca al aire libre categorías que no lo dicen.
- [x] **CA-4 (Check-in fuera de alcance):** no se añade botón, comando de Telegram ni tabla de progreso. Si más adelante hace falta, será otro PBI.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El Log proponía "registrar el progreso o, hasta entonces, desactivar el drop".** Se toma la segunda. La primera es un producto nuevo (qué cuenta como avance, quién lo escribe, desde qué superficie) y no cabe en tres ficheros ni está especificado.
- **F-01 ya no es el agravante de este PBI** una vez desplegado PBI-STEEL-001. El defecto de negocio permanece: un operador legítimo seguiría avisando a quien no ha andado.

---

## 4. Evidencia de Certificación

Patrulla sin progreso inventado; test CA-2 en reactive-patrol y route.test.
