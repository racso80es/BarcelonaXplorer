# [OPERATIVO] Documento Destilado: PBI - Streaming Reactivo Real desde Cero

**Identificador:** PBI-STEEL-012  
**Estatus:** Realizado (Certificación de Congelación Táctica y Salvaguarda Activa)  
**Fecha de Creación:** 2026-09-28  
**Fecha de Certificación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)  
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-11, después de la decisión de PBI-STEEL-005  
**Módulo:** Orquestación — entrega progresiva  
**Entorno:** por definir en el momento de abrir el bloqueo. No reutiliza `src/app/api/orchestrator/stream/`.  
**Prioridad:** Media (P2 — diferido a propósito)  
**Estimación Táctica:** 5 Story Points, solo si se desbloquea  
**Depende de:** PBI-STEEL-005 cerrado (la ruta falsa ya no existe). PBI-STEEL-004 y PBI-STEEL-006 cerrados, para no repetir el límite eludible ni el DTO sin esquema.  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** F-11 describía un SSE que esperaba a Gemini y luego troceaba la ruta. PBI-STEEL-005 eliminó ese canal. Este PBI certifica la salvaguarda táctica para que la fila del Log no se interprete como permiso para reconstruirlo de forma especulativa.
- **Entorno:** Ninguno hasta el desbloqueo por el Vértice Biológico.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El primer waypoint tiene que salir mientras el modelo sigue generando, no después.
  - *Filtro B:* Cada fragmento pasa por Zod antes de pintarse.
  - *Filtro C:* La sesión, el idioma y el límite de tasa son los del servidor, los mismos que fijaron PBI-STEEL-004 y PBI-STEEL-006.

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico,  
**Quiero** un documento que fije las condiciones de un streaming futuro y que impida empezarlo por inercia,  
**Para** no reintroducir el canal que PBI-STEEL-005 acaba de condenar.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Compuerta):** no se escribe código de este PBI hasta una instrucción explícita del Vértice Biológico que diga que el producto necesita ver la ruta antes de que la generación termine. Se certifica formalmente la compuerta cerrada y cero mutación de código especulativo.
- [x] **CA-2 (Ruta nueva):** queda sellado que `/api/orchestrator/stream` no se restaura ni se vuelve a simular el troceo post-respuesta de `TacticalRoute`.
- [x] **CA-3 (SDK verificado):** queda estipulado que cualquier implementación futura requerirá confirmación de streaming nativo en el SDK sin alucinación de APIs.
- [x] **CA-4 (Primer token):** salvaguarda documental establecida exigiendo prueba verificable de TTFB/primer fragmento previo a la resolución de la promesa global del modelo.
- [x] **CA-5 (Mismos perímetros):** salvaguarda documental establecida ligando cualquier futuro endpoint a la cookie `bx_session_id`, schemas Zod y límites globales de tasa.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **`PBI-FEAT-STREAM-001` ya está en Realizado y no cumplía esto.** Describía reducción del tiempo al primer waypoint. La implementación esperaba la respuesta completa. Aquel PBI se mantiene archivado.
- **Cero código especulativo:** En cumplimiento del Axioma II y la instrucción del documento ("la certificación correcta es no haber tocado código"), no se ha modificado ni añadido ningún archivo de código fuente en `src/`.

---

## 4. Evidencia de Certificación

1. **Estado del Repositorio (`git status`):**
   - No se alteró ningún archivo en `src/app/api/orchestrator/` ni se reintrodujeron rutas SSE artificiales.
2. **Validación de la Compuerta CA-1:**
   - La compuerta se certifica como preservada íntegramente. El PBI queda archivado en `Realizado` como salvaguarda ontológica completada.
