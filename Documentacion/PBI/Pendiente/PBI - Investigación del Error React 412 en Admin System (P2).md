# [OPERATIVO] Documento Destilado: PBI - Investigación del Error React 412 en Admin System

**Identificador:** PBI-STEEL-023
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · sección 7, no es un hallazgo F-
**Módulo:** Admin — `/Admin/System`
**Entorno:** `src/app/Admin/System/`. La página concreta se localiza al reproducir.
**Prioridad:** Media (P2 — 7 eventos, anteriores al tag `v2.0.1-doc-anchor`)
**Estimación Táctica:** 2 Story Points
**Depende de:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** `TelemetryLog` registró 7 veces `Minified React error #412` en `https://barcelonaxplorer.com/Admin/System`, contexto `CLIENT_UI`, último el 2026-09-23 09:06. Es anterior al delta.
- **Entorno:** Panel de sistema.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El código 412, en el diccionario de React 19.2.8, es la cadena `Connection closed.`
  - *Filtro B:* La forja reproduce o declara que no se reproduce. No parte de una causa supuesta.
  - *Filtro C:* Si la causa es otra página, el PBI se cierra con esa constatación y no se parchea `/Admin/System` a ciegas.

---

## 1. Declaración de Intención (INVEST)

**Como** operador de `/Admin/System`,
**Quiero** saber qué cerró la conexión que React registró como error 412,
**Para** no tratar un corte de stream como si fuera un desajuste de HTML.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Código leído, no interpretado):** la forja cita el diccionario de la versión instalada (`react` 19.2.8): el 412 es `Connection closed.` Los códigos de hidratación en ese mismo diccionario son el 418, el 423 y el 425. Este PBI no arregla fechas ni `Date.now()` salvo que la reproducción demuestre uno de esos tres códigos.
- [ ] **CA-2 (Reproducción):** se abre `/Admin/System` con la build de producción y se anota si el 412 vuelve. Si no vuelve, el PBI se cierra como no reproducido, con la fecha del intento.
- [ ] **CA-3 (Si vuelve):** se identifica el request que se corta (documento RSC, un `fetch` del panel o el socket) y se corrige esa causa. La certificación nombra el fichero. No se reescribe el panel entero.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No es el hallazgo F-14.** Las horas que cambian en cada render están en el orquestador y las trata PBI-STEEL-015. El 412 no se observó en esa ruta.
- **`react.dev/errors/412` no documenta este texto** en una consulta anterior de la auditoría. La fuente usada al redactar este PBI es `scripts/error-codes/codes.json` de la etiqueta `v19.2.8` del repositorio de React, que coincide con la versión de `src/package.json`.

---

## 4. Evidencia de Certificación

Pendiente de forja.
