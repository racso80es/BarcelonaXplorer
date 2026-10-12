# [ARQUITECTURA] PBI - Escala Tipográfica del Cromo de DataTable

**Identificador:** PBI-ADMIN-UI-002
**Estatus:** Implementado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 2 puntos
**Dependencias:** PBI-ADMIN-UI-001. Puede hacerse en paralelo con 003 y 004.

---

## 1. Intención

**Como** operador,
**Quiero** que cabeceras, celdas y el estado vacío de `DataTable` usen la escala de la matriz,
**Para** leer la tabla a 14px en móvil y a 15px desde el breakpoint `lg`, aunque la vista aún pinte badges más pequeños dentro de la celda.

Una clase de tamaño en el contenido de la celda sigue ganando a la del `<td>`. Los badges de cada vista se corrigen en los PBI 005 y 006.

## 2. Localidad

| Archivo | Estado actual a sustituir |
| :--- | :--- |
| `src/components/ui/data-table/data-table-header.tsx` | `text-xs font-mono ... uppercase tracking-wider` |
| `src/components/ui/data-table/data-table-cell.tsx` | `text-xs font-mono` en las dos ramas del `<td>` (con `cell` y sin él) |
| `src/components/ui/data-table/data-table-empty.tsx` | Mensaje `text-xs`; el botón de limpiar queda en `text-xs py-1.5` |

## 3. Cambio

- La cabecera usa `dataTableTypography.headerText` y conserva las clases de interacción que ya añade (`cursor-pointer`, foco, hover). `tracking-wider` pasa a `tracking-wide` porque viaja dentro de `headerText`.
- Las dos plantillas de `<td>` usan `dataTableTypography.cellText` y siguen concatenando `column.className`.
- El párrafo del mensaje vacío usa `dataTableTypography.emptyMessage`. El botón "Limpiar filtros" de ese estado usa `chromeText` y `dataTableLayout.touchControl`.
- `max-w-md` del bloque ilustrado del estado vacío se queda: no es una columna de datos.

## 4. Fuera de alcance

Toolbar, paginación, `overflow-x-auto`, `ColumnDef` y las clases `text-[10px]` / `text-[11px]` escritas dentro de los `cell` de cada vista.

## 5. Criterios de aceptación

- [x] Cabecera, celda y mensaje vacío leen sus tamaños de `dataTableTypography`, no de literales `text-xs` propios.
- [x] `data-table.test.tsx` sigue en verde. Si se añade una aserción, comprueba que una celda sin `cell` personalizado contiene `text-sm` en su `className`.
- [x] No aparece `text-[Npx]` en estos tres archivos.

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## 7. Registro de Implementación y Certificación

- **Cabeceras:** Actualizado `data-table-header.tsx` para consumir `dataTableTypography.headerText`.
- **Celdas:** Actualizadas las dos ramas de `data-table-cell.tsx` para consumir `dataTableTypography.cellText`.
- **Estado Vacío:** Actualizado `data-table-empty.tsx` para consumir `dataTableTypography.emptyMessage` en mensaje y `dataTableLayout.touchControl` + `dataTableTypography.chromeText` en botón de reset.
- **Suite de Tests:** Validado con `data-table.test.tsx` enriquecido con aserción sobre `text-sm` y `lg:text-data`.
- **Oráculos:** Validado con TypeScript, ESLint AST y Vitest (13 tests en verde).
