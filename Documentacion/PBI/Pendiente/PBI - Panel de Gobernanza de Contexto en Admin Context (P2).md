# [ARQUITECTURA] Documento Destilado: PBI - Panel de Gobernanza de Contexto en /Admin/Context

**Identificador:** PBI-CTX-010
**Estatus:** Pendiente (bloqueado por PBI-CTX-004 y PBI-CTX-005)
**Fecha de Creación:** 2026-09-30
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §8 · Escenario 4
**Módulo:** `src/app/Admin/Context/`, `src/app/Admin/_components/AdminSidebarRight.tsx`
**Entorno:** Next.js App Router, `DataTable<T>` (`src/components/ui/data-table/`), perímetro Basic Auth de `src/middleware.ts` (`matcher: ['/Admin', '/Admin/:path*', ...]`)
**Prioridad:** Media (P2)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-CTX-004, PBI-CTX-005
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Nueva vista Admin con dos tablas: contexto vectorial vigente (`context_memory`) y gobernanza de fuentes (`context_sources`) con acciones de transición.
- **Entorno:** Patrón de `/Admin/Cognitive` y `/Admin/System` (Server Components + `Suspense` + tabla cliente).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Soberanía Humana):* Única vía para llevar una fuente a `ACTIVE`; cada acción valida con Zod y pasa por la máquina de estados de PBI-CTX-004.
  - *Filtro B:* Una acción por transición legal; cada una devuelve `OperationEnvelope`.
  - *Filtro C:* Consultas acotadas a LanceDB (paginación de `DataTable`).

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico,
**Quiero** ver el contexto ingerido y el estado de cada fuente, y aprobar, rechazar, reactivar, desactivar o corregir fuentes,
**Para** gobernar el catálogo desde el panel sin tocar la base de datos.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Navegación):** Entrada "Contexto" en `NAV_ITEMS` de `AdminSidebarRight.tsx` apuntando a `/Admin/Context`, con test de estado activo como los existentes.
- [ ] **CA-2 (Vista 1):** `DataTable<ContextEntry>` sobre `context_memory` con `sourceTag`, `category`, `title`, `startsAt`, `expiresAt` e inspección del `metadata` crudo. No duplica la bitácora de `cognitive_memories` de `/Admin/Cognitive`.
- [ ] **CA-3 (Vista 2):** `DataTable<ContextSource>` con insignias de `status` (Verde `ACTIVE`, Rojo `DEGRADED`, Ámbar `PENDING_APPROVAL`, Gris `INACTIVE`), `failedAttempts`, `lastSuccessAt`, `lastError`, `proposedBy` y `supersedesSourceTag`.
- [ ] **CA-4 (Acciones):** Aprobar, Rechazar, Reactivar, Desactivar y Editar endpoint, mostradas solo cuando la transición es legal para el estado actual. Transición ilegal forzada ⇒ `OperationEnvelope` de error sin mutar (Escenario 4).
- [ ] **CA-5 (Perímetro):** Serán las primeras Server Actions del repositorio: se verifica con test o prueba manual documentada que invocarlas sin Basic Auth devuelve 401. Si no quedan cubiertas por el `matcher`, se usan Route Handlers bajo `/Admin` o se amplía el `matcher`.
- [ ] **CA-6 (Resiliencia):** LanceDB caído ⇒ la Vista 1 muestra estado vacío con aviso; la Vista 2 sigue operativa.
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` y `npm run build` en verde.
