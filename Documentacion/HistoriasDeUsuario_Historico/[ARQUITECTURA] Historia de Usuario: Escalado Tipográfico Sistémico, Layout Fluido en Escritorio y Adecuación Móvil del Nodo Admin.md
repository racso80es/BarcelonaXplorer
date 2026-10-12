---
document_id: HU-ARCH-ADMIN-UI-001
title: "[ARQUITECTURA] Escalado Tipográfico Sistémico, Layout Fluido en Escritorio y Adecuación Móvil del Nodo /Admin"
format: markdown
version: "1.3.0"
created: "2026-10-12"
revised: "2026-10-12"
status: "completada"
priority: media
process: feature
author: "Vértice Biológico (Racso) & Nodo de Control (Tormentosa)"
related:
  - src/app/Admin/layout.tsx
  - src/app/Admin/page.tsx
  - src/app/Admin/Logs/page.tsx
  - src/app/Admin/System/page.tsx
  - src/app/Admin/System/TelemetryTableClient.tsx
  - src/app/Admin/Cognitive/page.tsx
  - src/app/Admin/Cognitive/CognitiveTableClient.tsx
  - src/app/Admin/Context/page.tsx
  - src/app/Admin/Context/ContextMemoryTableClient.tsx
  - src/app/Admin/Context/ContextSourcesTableClient.tsx
  - src/components/ui/data-table/
  - src/app/globals.css
---

# [ARQUITECTURA] Historia de Usuario: Escalado Tipográfico Sistémico, Layout Fluido en Escritorio y Adecuación Móvil del Nodo /Admin

**Estatus:** Completada (100% de los PBIs PBI-ADMIN-UI-001 a 009 implementados, certificados por el Cuarteto de Oráculos y archivados en Realizado)  
**Numeración:** Sin número asignado. `HU 17`, `HU 18`, `HU 19` y `HU 20` ya están ocupadas; se propone `HU 21`, a confirmar por el Vértice Biológico.  
**Marco Normativo:** Protocolo de Acero S+ Grade · ADR-001 (Vertical Slicing) · Códice `TC-UI-001`, `TC-UI-002`, `TC-NEXT-005` · Cuarteto de Oráculos  

---

## Matriz de Indexación Tridimensional

* **Naturaleza:** Evolución de UI/UX sobre Tailwind CSS 4 (CSS-first), diseño responsivo y densidad visual.
* **Entorno:** Rama `/Admin` completa — Dashboard (`/Admin`), `/Admin/Logs`, `/Admin/System`, `/Admin/Cognitive`, `/Admin/Context` — y el componente transversal `src/components/ui/data-table/`.
* **Entropía Asimilada:**
  1. **Micro-tipografía dispersa:** Se erradicaron las 44 ocurrencias de `text-[10px]` y `text-[11px]` en `/Admin` (concentradas en `TelemetryTableClient.tsx`, `ContextSourcesTableClient.tsx`, `ContextMemoryTableClient.tsx`, Dashboard, Sidebar y ErrorBoundary), unificando el suelo a 12px y estableciendo la escala de celdas, cabeceras y controles de `DataTable` con el token `text-data` (15px) y la matriz `typography.ts`.
  2. **Anchura desaprovechada en escritorio:** Las cinco páginas de `/Admin` retiraron `max-w-7xl` (1280px); el layout raíz centraliza el lienzo fluido `w-full max-w-[1920px] mx-auto` y las columnas de carga semántica ahora usan `min-w-72` y `line-clamp-2 break-words`.
  3. **Ergonomía móvil:** Se elevaron controles de búsqueda, selects, botones de filtro y paginación a un objetivo táctil mínimo de 44px (`min-h-11`) en móvil, con `overscroll-x-contain` en la tabla para aislar el desplazamiento horizontal.

---

## 1. Descripción General

**Como** Operador Técnico y Administrador de BarcelonaXplorer,  
**Quiero** que el nodo `/Admin` y sus tablas usen una escala tipográfica legible gobernada desde un único punto, un contenedor que aproveche el ancho de los monitores grandes y controles táctiles cómodos en móvil,  
**Para** inspeccionar telemetría, sondas del sistema, memoria cognitiva y fuentes de contexto con máxima legibilidad en escritorio y sin fricción desde un terminal móvil.

---

## 2. Estado Actual Verificado (Línea Base)

Inventario contrastado con el código a fecha de emisión. Cualquier PBI derivado parte de esta línea base, no de supuestos.

| Elemento | Archivo | Estado actual |
| :--- | :--- | :--- |
| Layout raíz `/Admin` | `src/app/Admin/layout.tsx` | Contenedor centralizado `w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8` con tipografía base. |
| Contenedor de página | `page.tsx` de Dashboard, Logs, System, Cognitive y Context | Limpio de límites rígidos: `space-y-6 sm:space-y-8` sin `max-w-7xl`. |
| Cabecera `<th>` | `data-table-header.tsx` | `dataTableTypography.headerText`: `text-xs md:text-sm font-semibold uppercase tracking-wide`. |
| Celda `<td>` | `data-table-cell.tsx` | `dataTableTypography.cellText`: `text-sm lg:text-data leading-snug`. |
| Toolbar | `data-table-toolbar.tsx` | Apilable con `dataTableLayout.touchControl` (44px móvil), buscador fluido `w-full sm:w-72` y `filterGrid`. |
| Paginación | `data-table-pagination.tsx` | `flex-wrap justify-center`, botones de navegación con 44×44px táctil en móvil. |
| Scroll horizontal | `data-table.tsx` | `overflow-x-auto overscroll-x-contain`. |
| Ocultación de columnas | `types.ts` | `ColumnDef<T>` expone `className` y `headerClassName`. |
| Columna de mensaje | `System/TelemetryTableClient.tsx` (montada en `/Admin/Logs`) | `semanticColumn` (`min-w-72`) y `semanticContent` (`line-clamp-2 break-words`). Modal "Ver" para inspección exhaustiva. |
| Columna de mensaje | `Cognitive/CognitiveTableClient.tsx` | `semanticColumn` (`min-w-72`) y `semanticContent` (`line-clamp-2 break-words`). |
| Resumen de memoria | `Context/ContextMemoryTableClient.tsx` | `semanticColumn` (`min-w-72`), `badgeText` y `semanticContent`. |
| Rejillas de KPIs | Dashboard, System, Cognitive | Responsivas con métricas tácticas. |
| Fuentes Tailwind | `src/app/globals.css` | Token `@theme { --text-data: 0.9375rem; --text-data--line-height: calc(1.375 / 0.9375); }`. |

---

## 3. Pilares de Diseño

### 3.1. Escalado Tipográfico Centralizado

1. **Matriz declarativa de tipografía tabular (Axioma III):** `src/components/ui/data-table/typography.ts` exporta `dataTableTypography` y `dataTableLayout` inmutables (`as const`). Consumida en cabeceras, celdas, toolbar, paginación, celdas vacías y renderizadores de clientes.
2. **Token semántico CSS-first (`TC-UI-001`):** Tamaño de 15px declarado en `globals.css` como `--text-data: 0.9375rem`, generando la utilidad canónica `text-data`.
3. **Suelo tipográfico de 12px en `/Admin`:** Toda micro-tipografía inferior a 12px eliminada en todo el árbol `/Admin`.
4. **Base heredable en el layout:** `<main>` de `src/app/Admin/layout.tsx` adopta `text-sm md:text-base leading-relaxed`.

### 3.2. Anchura Fluida en Escritorio

1. **Contenedor único en el layout:** `src/app/Admin/layout.tsx` aloja `data-testid="admin-canvas"` con `w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8`. Eliminado `max-w-7xl` de todas las vistas hijas.
2. **Columnas de metadatos acotados:** Anchos fijos con `whitespace-nowrap`.
3. **Columnas de carga semántica:** Absorben el ancho remanente con `min-w-72` y `line-clamp-2 break-words`.

### 3.3. Ergonomía Móvil (viewport < 768px)

1. **Toolbar (`data-table-toolbar.tsx`):** Buscador `w-full sm:w-72`, rejilla responsiva de selects y altura mínima táctil de 44px (`min-h-11`).
2. **Paginación (`data-table-pagination.tsx`):** Flex-wrap en controles y botones de paginación de 44×44px en móvil.
3. **Scroll horizontal aislado (`data-table.tsx`):** `overscroll-x-contain` para impedir arrastre de la página completa.

---

## 4. Descomposición y Estado de PBIs

Todos los 9 PBIs fueron implementados secuencialmente, validados con el Cuarteto de Oráculos y archivados en `Documentacion/PBI/Realizado/`:

| PBI | Estado | Archivos de producción | Depende de |
| :--- | :--- | :--- | :--- |
| [001](../PBI/Realizado/PBI%20-%20Matriz%20Tipografica%20y%20Token%20de%20Datos%20del%20Nodo%20Admin%20%28PBI-ADMIN-UI-001%29.md) Matriz y token `text-data` | [x] Realizado | `globals.css`, `typography.ts`, `index.ts`, `typography.test.ts` | — |
| [002](../PBI/Realizado/PBI%20-%20Escala%20Tipografica%20del%20Cromo%20de%20DataTable%20%28PBI-ADMIN-UI-002%29.md) Escala del cromo de `DataTable` | [x] Realizado | `data-table-header.tsx`, `data-table-cell.tsx`, `data-table-empty.tsx`, `data-table.test.tsx` | 001 |
| [003](../PBI/Realizado/PBI%20-%20Ergonomia%20Tactil%20de%20Toolbar%20y%20Paginacion%20de%20DataTable%20%28PBI-ADMIN-UI-003%29.md) Toolbar, paginación y `overscroll-x-contain` | [x] Realizado | `data-table-toolbar.tsx`, `data-table-pagination.tsx`, `data-table.tsx` | 001 |
| [004](../PBI/Realizado/PBI%20-%20Contenedor%20Fluido%20del%20Layout%20Admin%20%28PBI-ADMIN-UI-004%29.md) Contenedor `max-w-[1920px]` | [x] Realizado | `layout.tsx` y los cinco `page.tsx` | — |
| [005](../PBI/Realizado/PBI%20-%20Columnas%20Fluidas%20de%20Logs%20y%20Memoria%20Cognitiva%20%28PBI-ADMIN-UI-005%29.md) Columnas de Logs y Cognitive | [x] Realizado | `TelemetryTableClient.tsx`, `CognitiveTableClient.tsx` | 001 |
| [006](../PBI/Realizado/PBI%20-%20Columnas%20Fluidas%20de%20Contexto%20%28PBI-ADMIN-UI-006%29.md) Columnas de Context | [x] Realizado | `ContextMemoryTableClient.tsx`, `ContextSourcesTableClient.tsx` | 001 |
| [007](../PBI/Realizado/PBI%20-%20Suelo%20Tipografico%20Residual%20del%20Nodo%20Admin%20%28PBI-ADMIN-UI-007%29.md) Suelo residual a 12px | [x] Realizado | `page.tsx`, `AdminSidebarRight.tsx`, `error.tsx` | — |
| [008](../PBI/Realizado/PBI%20-%20Contrato%20de%20Suelo%20Tipografico%20del%20Nodo%20Admin%20%28PBI-ADMIN-UI-008%29.md) Contrato `text-[Npx]` | [x] Realizado | `src/features/governance/admin-typography.contract.test.ts` | 002, 005, 006, 007 |
| [009](../PBI/Realizado/PBI%20-%20Spec%20Playwright%20de%20Layout%20y%20Tacto%20del%20Nodo%20Admin%20%28PBI-ADMIN-UI-009%29.md) Spec Playwright | [x] Realizado | `src/playwright-e2e/admin-layout.spec.ts`, `src/playwright.config.ts` | 003, 004 |

---

## 5. Normativas Arquitectónicas

1. **Tailwind 4 CSS-first (`TC-UI-001`, `TC-UI-002`):** Los tokens se declaran en `src/app/globals.css`. Prohibido `tailwind.config.*`.
2. **Agnosticismo de `DataTable`:** Operaciones de tabla agnósticas del dominio.
3. **Frontera cliente/servidor (`TC-NEXT-005`):** Server Components puros en `page.tsx`; client components solo en `*TableClient.tsx` y controles interactivos.
4. **Tipado hermético:** Cero `any` o aserciones inseguras.
5. **Cuarteto de Oráculos:** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` en verde.

---

## 6. Criterios de Aceptación Cumplidos

- **Escenario 1 (Suelo tipográfico y escala):** Certificado mediante contrato de gobernanza `admin-typography.contract.test.ts` (0 violaciones de `text-[Npx]`).
- **Escenario 2 (Anchura fluida en escritorio):** Certificado con contenedor `admin-canvas` (`max-w-[1920px]`) y columnas `min-w-72` / `line-clamp-2`.
- **Escenario 3 (Móvil y tacto):** Certificado con spec Playwright `admin-layout.spec.ts` (sin desbordamiento horizontal a 375px y controles táctiles de 44px).
- **Escenario 4 (Cuarteto de Oráculos):** 100% en verde tras cada commit individual.

---

## 7. Registro de Cierre y Trazabilidad de Forja

- **PBI-ADMIN-UI-001:** Commit `5fecafe` — Token CSS `--text-data` y matriz `typography.ts`.
- **PBI-ADMIN-UI-002:** Commit `b8271f3` — Cromo de tabla `<th>`, `<td>` y mensajes de tabla vacía.
- **PBI-ADMIN-UI-003:** Commit `b95a24e` — Ergonomía táctil de toolbar, paginación y `overscroll-x-contain`.
- **PBI-ADMIN-UI-004:** Commit `403e971` — Contenedor fluido en `Admin/layout.tsx` y purga de `max-w-7xl` en 5 páginas.
- **PBI-ADMIN-UI-005:** Commit `ee105da` — Columnas fluidas y erradicación de micro-tipografía en Logs y Cognitive.
- **PBI-ADMIN-UI-006:** Commit `43f1300` — Columnas fluidas y erradicación de micro-tipografía en Context.
- **PBI-ADMIN-UI-007:** Commit `d3b8dc7` — Suelo tipográfico residual en Dashboard, Sidebar y ErrorBoundary.
- **PBI-ADMIN-UI-008:** Commit `6df081d` — Contrato determinista de gobernanza tipográfica.
- **PBI-ADMIN-UI-009:** Commit `a456ef7` — Spec Playwright de layout, contención móvil y tacto.
