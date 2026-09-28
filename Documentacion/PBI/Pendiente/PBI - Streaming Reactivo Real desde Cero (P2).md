# [OPERATIVO] Documento Destilado: PBI - Streaming Reactivo Real desde Cero

**Identificador:** PBI-STEEL-012
**Estatus:** Congelado (2026-09-28). Cerrar PBI-STEEL-005 no lo abre. Solo se descongela con una orden del Vértice Biológico que nazca de cuota, interfaz o estabilidad, no de esta deuda.
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-11, después de la decisión de PBI-STEEL-005
**Módulo:** Orquestación — entrega progresiva
**Entorno:** por definir en el momento de abrir el bloqueo. No reutiliza `src/app/api/orchestrator/stream/`.
**Prioridad:** Media (P2 — diferido a propósito)
**Estimación Táctica:** 5 Story Points, solo si se desbloquea
**Depende de:** PBI-STEEL-005 cerrado (la ruta falsa ya no existe). PBI-STEEL-004 y PBI-STEEL-006 cerrados, para no repetir el límite eludible ni el DTO sin esquema.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** F-11 describía un SSE que esperaba a Gemini y luego troceaba la ruta. PBI-STEEL-005 elimina ese canal. Este PBI existe para que la fila del Log no se interprete como permiso para reconstruirlo.
- **Entorno:** Ninguno hasta el desbloqueo.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El primer waypoint tiene que salir mientras el modelo sigue generando, no después.
  - *Filtro B:* Cada fragmento pasa por Zod antes de pintarse.
  - *Filtro C:* La sesión, el idioma y el límite de tasa son los del servidor, los mismos que fijen PBI-STEEL-004 y PBI-STEEL-006.

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico,
**Quiero** un documento que fije las condiciones de un streaming futuro y que impida empezarlo por inercia,
**Para** no reintroducir el canal que PBI-STEEL-005 acaba de condenar.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Compuerta):** no se escribe código de este PBI hasta una instrucción explícita del Vértice Biológico que diga que el producto necesita ver la ruta antes de que la generación termine. Cerrar PBI-STEEL-005 no es esa instrucción.
- [ ] **CA-2 (Ruta nueva):** el endpoint, si llega a existir, tiene otro contrato y otro nombre. No se restaura `/api/orchestrator/stream` ni el troceo de una `TacticalRoute` ya completa.
- [ ] **CA-3 (SDK verificado):** el método de streaming se copia de los tipos de `@google/genai` instalado en ese momento. Al redactar este PBI no se confirmó un símbolo concreto: `gemini-client.ts` solo usa `models.generateContent`.
- [ ] **CA-4 (Primer token):** un test demuestra que el cliente recibe el primer fragmento válido antes de que la promesa de generación se resuelva. Si el SDK no puede hacerlo, el PBI se cierra como no viable y se deja constancia. No se simula el efecto troceando el JSON final.
- [ ] **CA-5 (Mismos perímetros):** la ruta aplica el limitador y la cookie de sesión resultantes de PBI-STEEL-004, y el mismo esquema de PBI-STEEL-006. No acepta el prompt crudo como único contexto.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **`PBI-FEAT-STREAM-001` ya está en Realizado y no cumplía esto.** Describía reducción del tiempo al primer waypoint. La implementación esperaba la respuesta completa. No se reabre aquel PBI.
- **No nombrar `generateContentStream` como hecho.** Puede existir en otra versión del SDK. Aquí no se ha verificado, y afirmarlo repetiría el error de fiarse del ejemplo del paquete.

---

## 4. Evidencia de Certificación

Pendiente de forja. Mientras CA-1 siga abierto, la certificación correcta es no haber tocado código.
