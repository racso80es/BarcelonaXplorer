# [ARQUITECTURA] PBI - Matriz Tipográfica y Token de Datos del Nodo /Admin

**Identificador:** PBI-ADMIN-UI-001
**Estatus:** Implementado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 2 puntos
**Dependencias:** ninguna. Los PBI 002, 003, 005 y 006 consumen esta matriz y no empiezan antes.

---

## 1. Intención

**Como** operador del nodo `/Admin`,
**Quiero** que los tamaños de la tabla compartida salgan de un único objeto y de un token de Tailwind,
**Para** que el resto de PBIs cambien clases de presentación sin inventar `text-[15px]` ni repetir literales.

## 2. Localidad

| Archivo | Acción |
| :--- | :--- |
| `src/app/globals.css` | Añadir el token dentro del `@theme inline` ya existente |
| `src/components/ui/data-table/typography.ts` | Crear |
| `src/components/ui/data-table/index.ts` | Reexportar |
| `src/components/ui/data-table/typography.test.ts` | Test colocalizado del objeto |

No se añade `@source`: `typography.ts` cae bajo `@source "../components"`. Prohibido crear `tailwind.config.*` (`TC-UI-001`).

## 3. Cambio

En `@theme inline` de `globals.css`:

```css
--text-data: 0.9375rem;
--text-data--line-height: calc(1.25 / 0.9375);
```

Eso genera la utilidad `text-data` (15px). `typography.ts` exporta dos objetos `as const`, sin `'use client'` y sin casts:

```ts
export const dataTableTypography = {
  headerText: 'text-xs md:text-sm font-mono font-semibold uppercase tracking-wide',
  cellText: 'text-sm lg:text-data font-mono leading-snug',
  badgeText: 'text-xs md:text-sm font-mono',
  chromeText: 'text-sm font-mono',
  emptyMessage: 'text-sm',
} as const;

export const dataTableLayout = {
  semanticColumn: 'min-w-72',
  semanticContent: 'line-clamp-2 break-words',
  nowrap: 'whitespace-nowrap',
  touchControl: 'min-h-11 md:min-h-9',
  touchIconButton: 'min-h-11 min-w-11 md:min-h-8 md:min-w-8',
  search: 'w-full md:w-80 lg:w-96',
  filterGrid: 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap',
} as const;
```

`font-mono` se conserva: es la voz actual de la tabla y este PBI no la retira. `index.ts` reexporta ambos objetos. Ningún componente los consume todavía; el cambio visible llega en los PBI siguientes.

## 4. Fuera de alcance

Sustituir clases en `data-table-*.tsx`, en las vistas de `/Admin` o en `layout.tsx`.

## 5. Criterios de aceptación

- [x] `text-data` existe como utilidad generada por el token, y el código de este PBI no contiene `text-[15px]` ni ningún `text-[Npx]`.
- [x] `typography.test.ts` importa los dos objetos y comprueba que `cellText` contiene `text-sm` y `lg:text-data`, que `badgeText` contiene `text-xs` y `md:text-sm`, y que ningún valor contiene `text-[`.
- [x] El tipado sale de `as const`. El test no usa `any`.

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`. El build comprueba que Tailwind 4 emite `text-data` con `source(none)` activo.

## 7. Registro de Implementación y Certificación

- **Token CSS:** Añadido `--text-data: 0.9375rem;` y `--text-data--line-height: calc(1.25 / 0.9375);` en `@theme inline` en `src/app/globals.css`.
- **Matriz Declarativa:** Creado `src/components/ui/data-table/typography.ts` exportando `dataTableTypography` y `dataTableLayout` con inferencia `as const`.
- **Barrel:** Reexportado en `src/components/ui/data-table/index.ts`.
- **Oráculos:** Validado con `tsc --noEmit`, ESLint AST y Vitest colocalizado (`src/components/ui/data-table/typography.test.ts`, 4 tests en verde).
