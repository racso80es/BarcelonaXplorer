# [OPERATIVO] Documento Destilado: PBI - Retirada del Circuit Breaker sin Proveedor Externo

**Identificador:** PBI-STEEL-011
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-10, T-03
**Módulo:** Planner — enriquecimiento de afiliados
**Entorno:** `src/features/planner/affiliate/affiliate-enricher.service.ts`, `src/features/planner/affiliate/circuit-breaker.ts`, `src/features/planner/affiliate/circuit-breaker.test.ts`
**Prioridad:** Media (P2 — complejidad que no protege ninguna llamada)
**Estimación Táctica:** 1 Story Point
**Depende de:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El enriquecedor envuelve un `map` síncrono en memoria con un `CircuitBreaker`. No hay llamada a TheFork, Civitatis ni a ningún otro proveedor. Cada petición crea un breaker nuevo, así que el estado `OPEN` no sobrevive. El `AbortSignal` no lo consume nadie.
- **Entorno:** Servicio de afiliados y su breaker colocalizado.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Decisión tomada: se retira. No se fabrica un proveedor HTTP para justificar el breaker.
  - *Filtro B:* Los tests dejan de afirmar una resiliencia que el producto no tiene.
  - *Filtro C:* `PBI-RESIL-CIRCUIT-001` permanece en `Realizado` como registro de lo que se construyó. Este PBI no lo reescribe.

---

## 1. Declaración de Intención (INVEST)

**Como** operador del lienzo,
**Quiero** que el enriquecimiento de afiliados haga solo el emparejamiento en memoria que realmente hace,
**Para** no leer un circuito abierto que nunca puede abrirse en producción.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Servicio):** `AffiliateEnricherService` deja de recibir y de construir un `CircuitBreaker`. El emparejamiento por palabras clave sigue siendo el mismo.
- [ ] **CA-2 (Módulo):** se eliminan `circuit-breaker.ts` y `circuit-breaker.test.ts`. Ningún otro fichero los importa: hoy solo los usa el enriquecedor.
- [ ] **CA-3 (Tests del producto):** el test del enriquecedor cubre el emparejamiento y el caso sin coincidencias. No hay un caso que inyecte un breaker ya abierto.
- [ ] **CA-4 (Documentación viva):** si algún comentario del servicio o del PBI en curso promete timeout o fallback de proveedor, se borra. No se abre un PBI de integración con TheFork o Civitatis.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **La alternativa "integración real" no está pedida.** El Log la dejaba abierta. No existe contrato, credencial ni puerto de un proveedor de afiliados. Construir uno aquí inventaría un producto.
- **El timeout del breaker no protege nada.** La operación es síncrona. Un `Promise.race` sobre un `map` no cambia el resultado.
- **`rainFriendly` fijo a `true` no es este PBI.** Está en F-12 y lo trata PBI-STEEL-013.

---

## 4. Evidencia de Certificación

Pendiente de forja.
