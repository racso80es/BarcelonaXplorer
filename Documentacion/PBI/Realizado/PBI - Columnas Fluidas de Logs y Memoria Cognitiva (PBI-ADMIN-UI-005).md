# [ARQUITECTURA] PBI - Columnas Fluidas de Logs y de Memoria Cognitiva

**Identificador:** PBI-ADMIN-UI-005
**Estatus:** Implementado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 3 puntos
**Dependencias:** PBI-ADMIN-UI-001. La ruta `/Admin/Logs` solo monta la tarjeta; las columnas viven en System. Puede hacerse en paralelo con 006.

---

## 1. Intención

**Como** operador en escritorio,
**Quiero** leer el mensaje de un log y la matriz densa de una sesión en dos líneas y a 12px como mínimo,
**Para** dejar de entrar al modal solo porque la celda corta el texto a 448px y a 10px.

## 2. Localidad

| Archivo | Micro-tipografía actual | Columna semántica |
| :--- | :--- | :--- |
| `src/app/Admin/System/TelemetryTableClient.tsx` | 14 de `text-[11px]` y 5 de `text-[10px]`, tabla y modal | `message`: `truncate max-w-sm sm:max-w-md` |
| `src/app/Admin/Cognitive/CognitiveTableClient.tsx` | 1 de `text-[11px]` y 2 de `text-[10px]`, tabla y modal | `denseText`: `truncate max-w-xs sm:max-w-md` |

Los tests colocalizados (`System/__tests__/TelemetryTableClient.test.tsx`, `Cognitive/__tests__/cognitive-table-client.test.tsx`) se tocan solo si una aserción deja de cumplirse. Hoy no afirman estas clases.

## 3. Cambio

En ambos archivos, importar `dataTableTypography` y `dataTableLayout` desde `@/components/ui/data-table`.

**Columnas semánticas** (`message`, `denseText`):

- Quitar `truncate`, `max-w-sm`, `max-w-md` y `max-w-xs` del contenido.
- El contenido usa `dataTableLayout.semanticContent` (`line-clamp-2 break-words`) y conserva `title`.
- `ColumnDef.className` de esa columna añade `dataTableLayout.semanticColumn` (`min-w-72`) sin borrar el resto de clases que ya tenga.
- Se descarta `hover:line-clamp-none`: no existe en táctil y cambia la altura de la fila. El modal "Ver" sigue mostrando el texto completo.

**Metadatos** (columnas que ya tienen ancho fijo: `w-24`, `w-36`, `w-44`, `w-48`, `w-20`):

- Añadir `dataTableLayout.nowrap` en `className`. No inventar anchos nuevos.

**Suelo de 12px**, en la tabla y en el modal de cada archivo:

- `text-[10px]` y `text-[11px]` pasan a `dataTableTypography.badgeText` (`text-xs md:text-sm`).
- Un badge que solo necesita el suelo puede quedarse en `text-xs` si `badgeText` rompe una fila ya apretada; en ese caso se deja `text-xs` y un comentario de una línea. No se reintroduce `text-[Npx]`.

Los diálogos conservan `max-w-3xl` y `max-h-[85vh]`. Esas clases limitan el modal, no la columna.

## 4. Fuera de alcance

`ContextMemoryTableClient.tsx`, `ContextSourcesTableClient.tsx`, el contenedor `max-w-7xl` de las páginas y cualquier cambio de `ColumnDef` en `types.ts`. Ocultar columnas con `hidden sm:table-cell` queda fuera: si más adelante se usa, la misma clase va en `className` y en `headerClassName`.

## 5. Criterios de aceptación

- [x] Ninguno de los dos archivos contiene `text-[10px]`, `text-[11px]`, `max-w-md`, `max-w-sm` ni `truncate` en la celda de `message` o `denseText`.
- [x] Esas dos columnas incluyen `min-w-72` y `line-clamp-2`.
- [x] El modal de detalle sigue abriéndose con el botón "Ver" y muestra el mensaje completo. Los tests de cliente existentes siguen en verde.

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## 7. Registro de Implementación y Certificación

- **Columnas Semánticas Fluidas:** `message` (Logs) y `denseText` (Cognitive) refactorizadas para consumir `dataTableLayout.semanticColumn` (`min-w-72`) y `dataTableLayout.semanticContent` (`line-clamp-2 break-words`), eliminando límites rígidos `max-w-sm` / `max-w-md` / `truncate`.
- **Columnas de Metadatos:** Añadido `dataTableLayout.nowrap` a columnas acotadas (`level`, `context`, `statusCode`, `createdAt`, `actions`, `sessionId`, `timestamp`, `score`).
- **Suelo Tipográfico de 12px:** Erradicadas las 22 ocurrencias de `text-[10px]` y `text-[11px]` en `TelemetryTableClient.tsx` (19) y `CognitiveTableClient.tsx` (3), sustituidas por `dataTableTypography.badgeText` y `text-xs`.
- **Oráculos:** Validado con TypeScript, ESLint AST (0 warnings) y Vitest (`TelemetryTableClient.test.tsx` y `cognitive-table-client.test.tsx` en verde).
