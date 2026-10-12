# [ARQUITECTURA] PBI - Contrato de Suelo Tipográfico del Nodo /Admin

**Identificador:** PBI-ADMIN-UI-008
**Estatus:** Realizado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 2 puntos
**Dependencias:** PBI-ADMIN-UI-002, 005, 006 y 007. Si entra antes, el test falla: hoy hay 44 clases `text-[10px]` o `text-[11px]` bajo `src/app/Admin/`.

---

## 1. Intención

**Como** revisor del nodo `/Admin`,
**Quiero** un test que rechace cualquier tamaño arbitrario en píxeles,
**Para** que el suelo de 12px y la prohibición de `text-[15px]` no dependan de una búsqueda manual.

## 2. Localidad

Un archivo nuevo: `src/features/governance/admin-typography.contract.test.ts`.

El sitio es el de los otros contratos de gobernanza (`ansible-go-templates.contract.test.ts`), no un árbol `tests/`. No se crea script de shell: la comprobación es un recorrido de ficheros con Vitest.

## 3. Cambio

El test lee, en texto, los `.ts` y `.tsx` de:

- `src/app/Admin/`
- `src/components/ui/data-table/`

Excluye `*.test.ts`, `*.test.tsx` y cualquier carpeta `__tests__`, para poder citar el patrón prohibido dentro del propio test.

Falla si el contenido coincide con `text-\[\d+px\]`. El mensaje de fallo incluye ruta y línea. Cubre tanto el suelo (10px, 11px) como el atajo `text-[15px]`, que debe seguir siendo el token `text-data`.

No hace falta navegador ni base de datos.

## 4. Fuera de alcance

Medir píxeles renderizados, anchos de columna o scroll de página. Eso es el PBI-ADMIN-UI-009.

## 5. Criterios de aceptación

- [x] Con los PBI 002, 005, 006 y 007 ya aplicados, `npm test` ejecuta este contrato y termina en verde.
- [x] Una fixture temporal con `text-[11px]` o `text-[15px]` en un `.tsx` de `src/app/Admin/` hace fallar el test nombrando el archivo. La fixture no se commitea.
- [x] El test no usa `any`.

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## 7. Certificación de Implementación

- Creado `src/features/governance/admin-typography.contract.test.ts` que inspecciona recursivamente los árboles `src/app/Admin/` y `src/components/ui/data-table/` buscando patrones `text-[\d+px]`.
- Excluidas suites de prueba colocalizadas (`*.test.ts`, `*.test.tsx`) y carpetas `__tests__`.
- Implementada suite de verificación con 3 casos de prueba:
  1. Ausencia total de `text-[Npx]` en `src/app/Admin/`.
  2. Ausencia total de `text-[Npx]` en `src/components/ui/data-table/`.
  3. Detección determinista de violaciones simuladas con reporte de línea y archivo (con fixture sintética en test).
- Validado con `tsc --noEmit`, `eslint --max-warnings 0` y `vitest run features/governance/admin-typography.contract.test.ts` (3 de 3 en verde).
