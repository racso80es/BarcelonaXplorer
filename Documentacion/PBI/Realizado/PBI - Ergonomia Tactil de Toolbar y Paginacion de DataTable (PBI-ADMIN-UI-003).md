# [ARQUITECTURA] PBI - Ergonomía Táctil de Toolbar y Paginación de DataTable

**Identificador:** PBI-ADMIN-UI-003
**Estatus:** Implementado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 3 puntos
**Dependencias:** PBI-ADMIN-UI-001. Puede hacerse en paralelo con 002 y 004. El spec de navegador (PBI-ADMIN-UI-009) lo verifica junto con el contenedor.

---

## 1. Intención

**Como** operador en un móvil de 375px,
**Quiero** buscar, filtrar y paginar con controles de 44px y un scroll horizontal que se quede dentro de la tabla,
**Para** usar `/Admin/Logs`, `/Admin/Cognitive` y `/Admin/Context` sin pulsar al lado del control ni empujar el scroll de la página.

La toolbar ya es `flex flex-col md:flex-row` y la paginación ya es `flex flex-col sm:flex-row`. Este PBI no vuelve a apilarlas. El hueco real es la altura (~28px, `py-1.5` y botones `p-1.5`) y el grupo izquierdo de la paginación, que no parte línea.

## 2. Localidad

| Archivo | Cambio |
| :--- | :--- |
| `src/components/ui/data-table/data-table-toolbar.tsx` | Ancho del buscador, rejilla de filtros, altura táctil, `chromeText` |
| `src/components/ui/data-table/data-table-pagination.tsx` | `flex-wrap`, botones de 44px, `chromeText` |
| `src/components/ui/data-table/data-table.tsx` | Añadir `overscroll-x-contain` al `overflow-x-auto` existente |

## 3. Cambio

**Toolbar**

- El contenedor del buscador sustituye `min-w-[240px] flex-1 max-w-sm` por `dataTableLayout.search` (`w-full md:w-80 lg:w-96`).
- Los `<select>` de filtro se agrupan en un nodo con `dataTableLayout.filterGrid`. El botón "Limpiar filtros" puede quedar fuera de esa rejilla.
- Buscador, cada `<select>` y el botón "Limpiar filtros" añaden `dataTableLayout.touchControl` (`min-h-11` por debajo de `md`, `min-h-9` desde `md`).
- Los textos `text-xs font-mono` de input, selects, botón y contador pasan a `dataTableTypography.chromeText`.

**Paginación**

- Se conserva `flex flex-col sm:flex-row items-center justify-between`.
- El grupo "Filas por página" + "Mostrando" añade `flex-wrap justify-center`.
- El `<select>` de densidad usa `touchControl`.
- Los cuatro botones de navegación sustituyen el área útil de `p-1.5` por `dataTableLayout.touchIconButton`. El icono puede seguir en 14px.
- El contenedor y los contadores usan `chromeText`.

**Tabla**

- El envoltorio pasa de `overflow-x-auto` a `overflow-x-auto overscroll-x-contain`. No se crea un segundo envoltorio.

`min-h-11` son 44px. `min-h-10` son 40px y no cumple este PBI.

## 4. Fuera de alcance

Ocultar columnas (`hidden sm:table-cell`), cambiar `ColumnDef`, y el ancho de las columnas de mensaje. El `min-w-0` de `<main>` ya existe y se preserva en el PBI 004; este PBI no lo toca.

## 5. Criterios de aceptación

- [x] En los tres archivos, el tamaño de texto de controles sale de `chromeText`.
- [x] Buscador, selects y botón de limpiar incluyen `min-h-11`. Los botones de página incluyen `min-h-11` y `min-w-11`.
- [x] El envoltorio de `<table>` incluye `overscroll-x-contain` y conserva `overflow-x-auto`.
- [x] `data-table.test.tsx` sigue en verde, incluida la búsqueda, el filtro por columna y el cambio de página.

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`. La altura real en un viewport de 375px la mide el PBI-ADMIN-UI-009; jsdom no calcula layout.

## 7. Registro de Implementación y Certificación

- **Toolbar Táctil:** `data-table-toolbar.tsx` actualizado con buscador de ancho fluido (`dataTableLayout.search`), rejilla de filtros de 2 columnas en móvil (`dataTableLayout.filterGrid`), controles con objetivo táctil de 44px (`dataTableLayout.touchControl`) y tipografía `chromeText`.
- **Paginación Ergonómica:** `data-table-pagination.tsx` actualizado con `flex-wrap justify-center` en selector de densidad, select con `touchControl`, 4 botones de navegación con `dataTableLayout.touchIconButton` (44x44px en móvil), y tipografía `chromeText`.
- **Aislamiento de Scroll:** `data-table.tsx` actualizado con `overscroll-x-contain` en el contenedor `overflow-x-auto`.
- **Oráculos:** Validado con TypeScript, ESLint AST y Vitest (suite completa de `data-table` en verde).
