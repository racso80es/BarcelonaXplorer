# [ARQUITECTURA] PBI - Columnas Fluidas y Suelo Tipográfico de /Admin/Context

**Identificador:** PBI-ADMIN-UI-006
**Estatus:** Realizado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 2 puntos
**Dependencias:** PBI-ADMIN-UI-001. Puede hacerse en paralelo con 005.

---

## 1. Intención

**Como** operador de fuentes y memoria de contexto,
**Quiero** el mismo suelo de 12px y las mismas columnas de texto a dos líneas que en Logs,
**Para** leer título, resumen, endpoint y último error sin un tope de 320px (`max-w-xs`) ni de 448px (`max-w-md`).

`/Admin/Context` no estaba en el primer borrador de la historia. Concentra 16 de las 44 clases `text-[10px]` / `text-[11px]` del nodo.

## 2. Localidad

| Archivo | Qué cambia en la tabla |
| :--- | :--- |
| `src/app/Admin/Context/ContextMemoryTableClient.tsx` | Columna `title`: contenedor `max-w-md`, resumen `text-[11px] line-clamp-2`. Seis `text-[11px]` entre tabla y modal |
| `src/app/Admin/Context/ContextSourcesTableClient.tsx` | `endpoint` dentro de `max-w-xs`; `lastError` con `line-clamp-2 max-w-xs text-[11px]`. Ocho `text-[11px]` y dos `text-[10px]` |

## 3. Cambio

Importar `dataTableTypography` y `dataTableLayout` desde `@/components/ui/data-table`.

- **Título / resumen:** se elimina el `max-w-md` que envuelve título y resumen. La columna recibe `semanticColumn`. El resumen usa `semanticContent` y `badgeText`. El título puede seguir en una línea (`line-clamp-1`) porque el resumen ya ocupa la segunda.
- **Endpoint:** se elimina el `max-w-xs` del contenedor. La columna recibe `semanticColumn`. El enlace usa `semanticContent` (dos líneas, `break-words`) y conserva el `href`.
- **Última bitácora:** se elimina `max-w-xs` de `lastError`. Se conservan `line-clamp-2` y `title`, que ya coinciden con `semanticContent`, y el tamaño pasa a `badgeText`.
- El resto de `text-[10px]` y `text-[11px]` de estos dos archivos, modales incluidos, pasa a `badgeText` o a `text-xs`.
- Los marcos de diálogo (`max-w-2xl`, `max-w-lg`) se quedan. También se quedan los `truncate max-w-sm` y `truncate max-w-xs` de dentro del modal de memoria (título de cabecera y `contentHash`): acotan un diálogo, no la tabla.

## 4. Fuera de alcance

`TelemetryTableClient.tsx`, `CognitiveTableClient.tsx` y el `max-w-7xl` de `Context/page.tsx` (PBI-ADMIN-UI-004).

## 5. Criterios de aceptación

- [x] Ninguno de los dos archivos contiene `text-[10px]` ni `text-[11px]`.
- [x] La celda de título/resumen no tiene `max-w-md`. La celda de endpoint y la de `lastError` no tienen `max-w-xs`.
- [x] Esas columnas de tabla incluyen `min-w-72`.
- [x] Los diálogos siguen abriendo y cerrando. Los tests de `Context`, si existen y cubren estas tablas, siguen en verde.

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## 7. Certificación de Implementación

- Erradicadas todas las instancias de `text-[10px]` y `text-[11px]` en `ContextMemoryTableClient.tsx` y `ContextSourcesTableClient.tsx`.
- Sustitución de `max-w-md` y `max-w-xs` en celdas de tabla por tokens compartidos `dataTableLayout.semanticColumn` (`min-w-72`) y `dataTableLayout.semanticContent` (`line-clamp-2 break-words`).
- Ajustadas etiquetas, metadatos y modales a `dataTableTypography.badgeText` (`text-xs font-mono`) o `text-xs`.
- Validado con `tsc --noEmit` y `eslint --max-warnings 0`.
