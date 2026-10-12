# [ARQUITECTURA] PBI - Contenedor Fluido del Layout /Admin

**Identificador:** PBI-ADMIN-UI-004
**Estatus:** Implementado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 2 puntos
**Dependencias:** ninguna. Puede hacerse en paralelo con 001–003. El PBI-ADMIN-UI-009 mide el resultado y necesita el atributo `data-testid` definido aquí.

---

## 1. Intención

**Como** operador en un monitor grande,
**Quiero** que las cinco vistas de `/Admin` compartan un solo contenedor de hasta 1920px,
**Para** dejar de verlas cortadas a 1280px (`max-w-7xl`) con márgenes vacíos.

## 2. Localidad y excepción

Son seis archivos con el mismo literal. Partirlos deja padding doble: el layout sumaría `py-4` y la página conservaría `p-4`. Van juntos por esa razón.

| Archivo | Clase actual del contenedor de página |
| :--- | :--- |
| `src/app/Admin/layout.tsx` | No tiene contenedor de ancho. `<main className="flex-1 min-w-0 order-last lg:order-first">` |
| `src/app/Admin/page.tsx` | `p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto` |
| `src/app/Admin/Logs/page.tsx` | el mismo literal |
| `src/app/Admin/System/page.tsx` | el mismo literal |
| `src/app/Admin/Cognitive/page.tsx` | el mismo literal |
| `src/app/Admin/Context/page.tsx` | el mismo literal |

`layout.tsx` ya existe. Este PBI lo refactoriza; no crea la ruta.

## 3. Cambio

`<main>` conserva `flex-1 min-w-0 order-last lg:order-first` y añade `text-sm md:text-base leading-relaxed`. Dentro, un único lienzo:

```tsx
<div
  data-testid="admin-canvas"
  className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8"
>
  {children}
</div>
```

En los cinco `page.tsx` el contenedor pasa a `space-y-6 sm:space-y-8`. Se retiran `p-4`, `sm:p-8`, `max-w-7xl` y `mx-auto`.

Anchura efectiva: desde `lg` el sidebar (`lg:w-64`) resta 256px, así que `<main>` mide `viewport − 256px`. `max-w-[1920px]` incluye el padding (`border-box`), y el tope solo se alcanza con un viewport de al menos 2176px. En 1920×1080 el lienzo ocupa todo `<main>`.

La base tipográfica de `<main>` solo afecta a texto sin tamaño propio. Casi todo `/Admin` ya declara tamaño; amplar esas clases es trabajo de los PBI 002, 005, 006 y 007.

## 4. Fuera de alcance

- `src/app/Admin/error.tsx` conserva su tarjeta `max-w-2xl`. Al ser hijo del layout recibirá el padding exterior; no se crea una ruta de escape.
- Rejillas de KPIs. System muestra 8 sondas en `lg:grid-cols-4` (dos filas completas). Cognitive muestra 5 tarjetas en `xl:grid-cols-5`. Cambiar esos números deja una tarjeta sola en la fila siguiente.
- Badges `text-[10px]` de `page.tsx`: PBI-ADMIN-UI-007.

## 5. Criterios de aceptación

- [x] Ningún `page.tsx` de `/Admin` contiene `max-w-7xl`.
- [x] El lienzo con `data-testid="admin-canvas"` vive en `layout.tsx` y lleva `max-w-[1920px]`.
- [x] `<main>` conserva `min-w-0`.
- [x] Las cinco páginas siguen siendo Server Components, sin `'use client'` (`TC-NEXT-005`).

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## 7. Registro de Implementación y Certificación

- **Lienzo Centralizado:** `src/app/Admin/layout.tsx` refactorizado con `<main>` provisto de `min-w-0`, `text-sm md:text-base leading-relaxed` y envoltorio `admin-canvas` (`data-testid="admin-canvas"`, `max-w-[1920px]`, `px-4 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8`).
- **Erradicación de max-w-7xl y Padding Duplicado:** Eliminados `p-4 sm:p-8 max-w-7xl mx-auto` de las 5 páginas (`Dashboard`, `Logs`, `System`, `Cognitive`, `Context`), preservando `space-y-6 sm:space-y-8`.
- **Frontera Server Components:** Las 5 páginas permanecen estrictamente como Server Components.
- **Oráculos:** Validado con TypeScript, ESLint AST y Vitest (14 suites de `app/Admin` en verde).
