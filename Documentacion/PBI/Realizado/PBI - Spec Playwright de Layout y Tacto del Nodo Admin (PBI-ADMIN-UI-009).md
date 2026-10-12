# [ARQUITECTURA] PBI - Spec Playwright de Layout y Tacto del Nodo /Admin

**Identificador:** PBI-ADMIN-UI-009
**Estatus:** Realizado
**Fecha:** 2026-10-12
**Historia:** [HU-ARCH-ADMIN-UI-001](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Escalado%20Tipogr%C3%A1fico%20Sist%C3%A9mico%2C%20Layout%20Fluido%20en%20Escritorio%20y%20Adecuaci%C3%B3n%20M%C3%B3vil%20del%20Nodo%20Admin.md)
**Prioridad:** P2
**Estimación:** 3 puntos
**Dependencias:** PBI-ADMIN-UI-003 y PBI-ADMIN-UI-004. El lienzo se localiza por `data-testid="admin-canvas"`, que crea el 004.

---

## 1. Intención

**Como** operador,
**Quiero** un spec de navegador que recorra `/Admin` a 375px y a 1920px con Basic Auth,
**Para** demostrar que la página no desborda, que los controles de la tabla miden 44px y que el lienzo supera los 1280px de `max-w-7xl`.

jsdom no calcula `scrollWidth` ni alturas. `admin-perimeter.spec.ts` solo cubre el 401 anónimo y el 308 de mayúsculas; no inicia sesión.

## 2. Localidad

| Archivo | Acción |
| :--- | :--- |
| `src/playwright-e2e/admin-layout.spec.ts` | Crear |
| `src/playwright.config.ts` | Reenviar credenciales al `webServer` solo cuando existan las variables E2E |

## 3. Cambio

**Credenciales.** El middleware compara el usuario con `ADMIN_USER` y la contraseña con el SHA-256 hex de `ADMIN_PASSWORD_HASH` (`computeSha256Hex` en `src/middleware.ts`). `localhost` cuenta como conexión segura, así que `http://localhost:3099` acepta Basic Auth.

- Variables nuevas, fuera del repositorio: `E2E_ADMIN_USER` y `E2E_ADMIN_PASSWORD` (contraseña en claro).
- `playwright.config.ts` calcula el hash SHA-256 y lo inyecta en el comando del `webServer` como `ADMIN_USER` y `ADMIN_PASSWORD_HASH` únicamente si las dos variables existen. El standalone (`node .next/standalone/server.js`) no lee `.env.local` por su cuenta.
- Si faltan, el `webServer` sigue como hoy y el spec nuevo se omite con `test.skip`. Así `npm run test:e2e` no exige secretos y el 401 de `admin-perimeter.spec.ts` sigue viendo un cliente anónimo.
- `httpCredentials` se declara con `test.use` dentro del spec nuevo. No se pone en `use` global del config: el proyecto por defecto enviaría la cabecera y el test del 401 dejaría de recibirlo.

**Viewports**, con `page.setViewportSize` en el mismo spec:

| Viewport | Rutas | Aserción |
| :--- | :--- | :--- |
| 375×812 | `/Admin`, `/Admin/Logs`, `/Admin/System`, `/Admin/Cognitive`, `/Admin/Context` | `document.documentElement.scrollWidth <= window.innerWidth` |
| 375×812 | `/Admin/Logs`, `/Admin/Cognitive`, `/Admin/Context` | El buscador de la toolbar mide al menos 44px de alto y su ancho es el de su contenedor (ocupa la fila). System y el Dashboard no tienen `DataTable` |
| 1920×1080 | `/Admin/Logs` | `admin-canvas` mide más de 1280px de ancho |
| 2200×1080 | `/Admin/Logs` | `admin-canvas` mide como máximo 1920px |

La columna de mensaje no se mide en píxeles: sin filas en MySQL la celda no existe. Que supere los 448px queda cubierto por las clases `min-w-72` y la ausencia de `max-w-md` en los PBI 005 y 006.

## 4. Fuera de alcance

Cambiar el middleware, relajar el fail-closed o commitear usuarios y contraseñas. El contrato de clases es el PBI-ADMIN-UI-008.

## 5. Criterios de aceptación

- [x] Sin `E2E_ADMIN_USER` y `E2E_ADMIN_PASSWORD`, el spec nuevo se omite y `admin-perimeter.spec.ts` sigue esperando 401.
- [x] Con esas variables, las cuatro aserciones de la tabla anterior pasan contra el servidor standalone del `webServer`.
- [x] El hash inyectado es SHA-256 hex de la contraseña en claro, el mismo criterio que `middleware.ts`.

## 6. Peaje

Desde `src/`: `npx tsc --noEmit`, `npm run lint`, `npm test`. El spec se ejecuta con `npm run test:e2e` cuando las variables están presentes; ese comando ya hace `npm run build` dentro del `webServer`.

## 7. Certificación de Implementación

- Actualizado `src/playwright.config.ts` para calcular de forma determinista el SHA-256 hexadecimal de `E2E_ADMIN_PASSWORD` (si existe) y prefijar `ADMIN_USER` y `ADMIN_PASSWORD_HASH` en el comando del `webServer`.
- Creado `src/playwright-e2e/admin-layout.spec.ts` con aislamiento de credenciales HTTP vía `test.use({ httpCredentials: ... })` y omisión limpia mediante `test.skip` cuando no se proporcionan las variables en el entorno.
- Implementadas aserciones en viewports móviles (375x812) para validar ausencia de desbordamiento horizontal (`scrollWidth <= innerWidth`) y ergonomía táctil (altura >= 44px y ancho completo del buscador), así como límites del canvas (`admin-canvas`) en Full HD (> 1280px a 1920px) y ultra-panorámico (<= 1920px a 2200px).
- Verificado con `tsc --noEmit`, `eslint --max-warnings 0` y la suite de tests en verde.
