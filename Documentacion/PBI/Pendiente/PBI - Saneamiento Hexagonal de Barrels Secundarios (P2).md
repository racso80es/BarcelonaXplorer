# [OPERATIVO] Documento Destilado: PBI - Saneamiento Hexagonal de Barrels Secundarios

**Identificador:** PBI-STEEL-022
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-07, acotado fuera de PBI-STEEL-007
**Módulo:** Arquitectura — barrels de feature
**Entorno:** los ocho `src/features/*/index.ts` que no son `planner`
**Prioridad:** Media (P2 — deuda catalogada; no purga el bundle de `/orchestrator`)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-STEEL-007 cerrado. Cada feature es un cambio aparte.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** PBI-STEEL-007 se queda en `planner`. Los otros barrels no se refactorizan "de paso". Este PBI parte de un inventario leído el 2026-09-28, no de un recuento de ocho culpables iguales.
- **Entorno:** `i18n`, `triage`, `cognitive-memory`, `auth`, `telegram`, `ai-engine`, `telemetry`, `guide-templates`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Un cambio, una feature.
  - *Filtro B:* El que ya exporta solo dominio se deja escrito como revisado y no se toca.
  - *Filtro C:* El que exporta Prisma, un cliente HTTP o un caso de uso de servidor gana una superficie `server-only`, con exports nominales.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio del Axioma I,
**Quiero** que la deuda de barrels quede nombrada por fichero y se sanee de uno en uno,
**Para** no meter ocho módulos dentro del PBI que solo tiene que sacar Prisma del bundle del orquestador.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

Inventario de partida (lectura del 2026-09-28):

| Feature | Qué exporta el `index.ts` | Trato |
|---|---|---|
| `i18n` | `export *` de value object, esquema y diccionario. Sin Prisma | Revisado. No se parte |
| `triage` | Exports nominales, incluido `TriageInputUseCase` | Partir si un componente cliente importa el barrel |
| `cognitive-memory` | Exports nominales, e incluye `LanceDb*` y `PrismaCognitiveMetricsRepository` | Partir |
| `auth` | `export *`, e incluye `prisma-user-anchor.repository` y `prisma-magic-link-nonce.repository` | Partir |
| `telegram` | `export *`, e incluye `telegram-bot-api.gateway` y el caso de uso de patrulla | Partir |
| `ai-engine` | `export *`, e incluye `gemini-client`, adaptadores Groq y `jevClient` | Partir |
| `telemetry` | `export *`, e incluye `prisma-telemetry.repository` | Partir |
| `guide-templates` | `export *`, e incluye repositorios Prisma y el adaptador Gemini | Partir |

- [ ] **CA-1 (`i18n`):** se deja como está y la certificación lo marca revisado.
- [ ] **CA-2 (Una feature por cambio):** cada fila "Partir" separa dominio puro y superficie `server-only`, con exports nominales, y mueve los imports de Route Handlers. El criterio de PBI-STEEL-007 se repite en esa feature: ningún chunk de `.next/static/` nuevo contiene el adaptador de servidor de esa feature.
- [ ] **CA-3 (Sin big bang):** no hay un diff que toque las seis features a la vez.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Ocho no significa ocho fugas.** `i18n` no arrastra servidor. Catalogarlo como deuda igual que `auth` habría sido falso.
- **`planner` no se reabre.** Si PBI-STEEL-007 dejó el bundle limpio, este PBI no vuelve a medir ese chunk salvo que un cambio lo rompa.
- **El orden entre las seis no está fijado.** Cualquiera puede ir primero. No se bloquean entre sí.

---

## 4. Evidencia de Certificación

Pendiente de forja.
