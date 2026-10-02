# [ARQUITECTURA] Documento Destilado: PBI - Panel de Gobernanza de Contexto en /Admin/Context

**Identificador:** PBI-CTX-010
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-30
**Fecha de Finalización:** 2026-10-02
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §8 · Escenario 4
**Módulo:** `src/app/Admin/Context/`, `src/app/Admin/api/context-sources/`, `src/app/Admin/_components/AdminSidebarRight.tsx`, `src/features/context-sources/context-admin.service.ts`
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

- [x] **CA-1 (Navegación):** Entrada "Contexto" en `NAV_ITEMS` de `AdminSidebarRight.tsx` apuntando a `/Admin/Context`, con test de estado activo en `AdminSidebarRight.test.tsx`.
- [x] **CA-2 (Vista 1):** `DataTable<ContextMemoryEntryItem>` sobre `context_memory` con `sourceTag`, `category`, `title`, `startsAt`, `expiresAt` e inspección modal del `metadata` crudo.
- [x] **CA-3 (Vista 2):** `DataTable<ContextSourceSnapshot>` con insignias de `status` (Verde `ACTIVE`, Rojo `DEGRADED`, Ámbar `PENDING_APPROVAL`, Gris `INACTIVE`), `failedAttempts`, `lastSuccessAt`, `lastError`, `proposedBy` y `supersedesSourceTag`.
- [x] **CA-4 (Acciones):** Aprobar (`APPROVE`), Rechazar (`REJECT`), Reactivar (`REACTIVATE`), Desactivar (`DEACTIVATE`) y Editar endpoint (`PROPOSE_CORRECTION`), mostradas solo cuando la transición es legal para el estado actual. Transición ilegal forzada ⇒ `OperationEnvelope` de error 422 sin mutar la base de datos (Escenario 4).
- [x] **CA-5 (Perímetro):** Acciones expuestas a través de `POST /Admin/api/context-sources/route.ts` protegido con Basic Auth mediante el matcher perimetral `/Admin/:path*` de `src/middleware.ts`.
- [x] **CA-6 (Resiliencia):** LanceDB no inicializado o caído ⇒ la Vista 1 muestra estado vacío con aviso sin lanzar excepción ni romper la Vista 2.
- [x] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` (606 tests en verde) y `npm run build` en verde.

---

## 3. Evidencia de Implementación y Oráculos

- **Navegación:** `src/app/Admin/_components/AdminSidebarRight.tsx` con entrada `Contexto` y test unitario en `AdminSidebarRight.test.tsx`.
- **Servicio de Administración:** `src/features/context-sources/context-admin.service.ts` con transiciones gobernadas y consulta resiliente a LanceDB.
- **Ruta Perimetral de API:** `src/app/Admin/api/context-sources/route.ts` con validación Zod y manejo de transiciones legales/ilegales.
- **Componentes de Vista:**
  - `src/app/Admin/Context/page.tsx`
  - `src/app/Admin/Context/ContextSourcesCard.tsx` & `ContextSourcesTableClient.tsx`
  - `src/app/Admin/Context/ContextMemoryCard.tsx` & `ContextMemoryTableClient.tsx`
- **Resultados de Oráculos:**
  - `tsc --noEmit`: 0 errores.
  - `eslint`: 0 warnings, 0 errores.
  - `vitest run`: 110 suites de prueba, 606 tests pasados al 100%.
  - `npm run build`: compilación de producción exitosa en 3.1s con las nuevas rutas `/Admin/Context` y `/Admin/api/context-sources`.
