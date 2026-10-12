# [ARQUITECTURA] PBI - Suelo Tipográfico Residual del Nodo /Admin

**Identificador:** PBI-ADMIN-UI-007
**Estatus:** Realizado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 1 punto
**Dependencias:** ninguna de código. Conviene cerrarlo antes del PBI-ADMIN-UI-008, porque ese contrato recorre todo `src/app/Admin/`. Si el PBI-ADMIN-UI-004 ya editó `page.tsx`, este cambio se aplica sobre esa versión.

---

## 1. Intención

**Como** operador,
**Quiero** que badges, sidebar y la pantalla de error usen al menos 12px,
**Para** que el contrato del PBI 008 pueda prohibir `text-[Npx]` en todo el nodo sin dejar restos fuera de las tablas.

Las tarjetas de System, Cognitive y Context ya usan `text-xs` o mayor. No entran en este PBI. El inventario que sí queda, fuera de los archivos de los PBI 005 y 006, es este:

| Archivo | Ocurrencias |
| :--- | :--- |
| `src/app/Admin/page.tsx` | 2 × `text-[10px]` (badges "6 Sensores" y "Logs") |
| `src/app/Admin/_components/AdminSidebarRight.tsx` | 2 × `text-[10px]`, 1 × `text-[11px]` |
| `src/app/Admin/error.tsx` | 1 × `text-[11px]` (digest del error) |

## 2. Localidad

Esos tres archivos. El test `AdminSidebarRight.test.tsx` afirma `bg-emerald-50` en el enlace activo; esa clase no se toca.

## 3. Cambio

Cada `text-[10px]` y `text-[11px]` se sustituye por `text-xs`. No se importa la matriz de `DataTable`: estos nodos no son celdas de tabla y el componente compartido sigue siendo agnóstico del dominio.

`error.tsx` conserva `max-w-2xl` y `max-w-md` de la tarjeta de error.

## 4. Fuera de alcance

Cualquier `text-[10px]` o `text-[11px]` dentro de `TelemetryTableClient.tsx`, `CognitiveTableClient.tsx`, `ContextMemoryTableClient.tsx` y `ContextSourcesTableClient.tsx`.

## 5. Criterios de aceptación

- [x] Los tres archivos no contienen `text-[10px]` ni `text-[11px]`.
- [x] `AdminSidebarRight.test.tsx` sigue en verde, con el enlace activo en `bg-emerald-50`.

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## 7. Certificación de Implementación

- En `src/app/Admin/page.tsx`: sustituidos los dos badges ("6 Sensores" y "Logs") de `text-[10px]` por `text-xs`.
- En `src/app/Admin/_components/AdminSidebarRight.tsx`: sustituidos `text-[10px]` (badge de nodo y badge de item) y `text-[11px]` (título de sección) por `text-xs`.
- En `src/app/Admin/error.tsx`: sustituido el badge de firma digest de `text-[11px]` por `text-xs`.
- Verificado el conjunto con `tsc --noEmit`, `eslint --max-warnings 0` y la suite de tests unitarios de `AdminSidebarRight.test.tsx` (7 tests en verde).
