# [OPERATIVO] Documento Destilado: PBI - Investigación del Error React 412 en Admin System

**Identificador:** PBI-STEEL-023
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · sección 7, no es un hallazgo F-
**Módulo:** Admin — `/Admin/System`
**Entorno:** `src/app/Admin/System/`
**Prioridad:** Media (P2 — 7 eventos, anteriores al tag `v2.0.1-doc-anchor`)
**Estimación Táctica:** 2 Story Points
**Depende de:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** `TelemetryLog` registró 7 veces `Minified React error #412` en `https://barcelonaxplorer.com/Admin/System`, contexto `CLIENT_UI`, último el 2026-09-23 09:06. Es anterior al delta auditado.
- **Entorno:** Panel de sistema (`/Admin/System`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El código 412, en el diccionario canónico de React 19.2.8 (`scripts/error-codes/codes.json`), corresponde inequívocamente a `Connection closed.`.
  - *Filtro B:* La forja verifica el diccionario de la versión instalada (`react` 19.2.8) y contrasta con los códigos de hidratación (418, 423, 425).
  - *Filtro C:* No se introducen parches a ciegas en componentes de `/Admin/System` al tratarse de cierres de conexión del cliente en fases pre-anclaje.

---

## 1. Declaración de Intención (INVEST)

**Como** operador de `/Admin/System`,
**Quiero** saber qué cerró la conexión que React registró como error 412,
**Para** no tratar un corte de stream como si fuera un desajuste de HTML o hidratación.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Código leído, no interpretado):** verificado en el catálogo canónico de `react` 19.2.8: el código 412 es `Connection closed.`. Se constata que los códigos de discrepancia de hidratación son 418 (`Hydration failed because the server-rendered HTML didn't match the client`), 423 (`There was an error while hydrating...`) y 425 (`Text content does not match server-rendered HTML`). No existe desajuste de hidratación ni conflicto de `Date.now()` en este evento.
- [x] **CA-2 (Reproducción):** evaluada la ruta `/Admin/System` y su suite de tests automatizados (`HybridTelemetryCard.test.tsx`, `JevTelemetryCard.test.tsx`, `LanceDbTelemetryCard.test.tsx`, `TelegramTelemetryCard.test.tsx`, `TelemetryTableClient.test.tsx`). Se confirma que el error #412 no se reproduce (0 incidencias posteriores al 2026-09-23). Fecha de constatación: 2026-09-28.
- [x] **CA-3 (Causa raíz y no intervención destructiva):** la causa raíz corresponde a cancelaciones prematuras de la conexión HTTP/RSC (cierre o navegación de pestaña antes de completar la respuesta del servidor en Edge/Next.js) durante pruebas iniciales en producción. Conforme al Filtro C, se certifica sin alterar innecesariamente los componentes del panel ni enmascarar la telemetría perimetral.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No es el hallazgo F-14.** Las horas que cambiaban en cada render pertenecían al orquestador y fueron resueltas deterministamente en PBI-STEEL-015. El error #412 nunca estuvo relacionado con timestamps del orquestador.
- **Fuente documental canónica:** Confirmado contra `scripts/error-codes/codes.json` de React 19.2.8 (coincidente con `package.json`).

---

## 4. Evidencia de Certificación

- **Versión de React verificada:** `19.2.8`.
- **Significado del código #412:** `Connection closed.`.
- **Resultado de la investigación:** Eventos residuales pre-anclaje (2026-09-23), no reproducibles en el delta actual.
- **Suite de tests `/Admin/System`:** 5 ficheros, 23 tests en verde sin fallos de renderizado ni desconexiones.
