# [OPERATIVO] Documento Destilado: PBI - Configuración del Motor Playwright y Convivencia con Vitest

**Identificador:** PBI-QA-E2E-002  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-28  
**Fecha de Culminación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 13: Blindaje Empírico E2E y Tubería de Certificación Continua (Playwright)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2013:%20Blindaje%20Emp%C3%ADrico%20E2E%20y%20Tuber%C3%ADa%20de%20Certificaci%C3%B3n%20Continua%20(Playwright).md)  
**Módulo:** Infraestructura de Calidad (QA) — Configuración de runners  
**Entorno:** `src/playwright.config.ts`, `src/vitest.config.ts`, `src/tsconfig.json`  
**Prioridad:** Alta (P1 - Fundación del arnés E2E)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** PBI-QA-E2E-001  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Configurar el motor Playwright con un servidor de producción fiel al Edge Runtime y garantizar que no colisione con la suite Vitest existente.
- **Entorno:** [`src/playwright.config.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/playwright.config.ts), [`src/vitest.config.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/vitest.config.ts), [`src/tsconfig.json`](file:///home/racso/Proyectos/BarcelonaXplorer/src/tsconfig.json).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El `webServer` levanta la app compilada en modo standalone, no `next dev`.
  - *Filtro B:* Extensiones disjuntas (`*.spec.ts` vs `*.e2e.test.ts`) y exclusión explícita blindan contra colisiones de runner.
  - *Filtro C:* `reuseExistingServer: !process.env.CI` evita recompilaciones en local.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio de la Arquitectura,  
**Quiero** un `playwright.config.ts` que sirva la app compilada y una exclusión correcta en Vitest,  
**Para** ejecutar E2E con fidelidad de Edge Runtime sin que Vitest intente correr los specs de Playwright (ni escanee `node_modules`).

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Config del motor):** Existe `src/playwright.config.ts` con `use.baseURL: 'http://localhost:3000'`, `testDir: './playwright-e2e'` y `webServer`:
  - `command`: build con `NEXT_PUBLIC_E2E_DISPATCH_HOOK=1`, copia de `.next/static` y `public` dentro de `.next/standalone/`, y `PORT=3000 node .next/standalone/server.js`
  - `url: 'http://localhost:3000'`
  - `reuseExistingServer: !process.env.CI`
  - `timeout: 300_000`
- [x] **CA-2 (Convención de extensiones):** Playwright recoge `*.spec.ts` (descubrimiento verificado: 5 tests en 4 archivos). Las pruebas en vivo de Vitest siguen en `tests/e2e/*.e2e.test.ts`.
- [x] **CA-3 (Exclusión segura en Vitest):** `exclude: [...configDefaults.exclude, '**/playwright-e2e/**']`.
- [x] **CA-4 (Sin colisión):** `npx vitest list` no enumera ningún `*.spec.ts`. `npx playwright test --list` resuelve `testDir` y lista los specs.

---

## 3. Evidencia de Certificación

1. **Compilador:** `npx tsc --noEmit` — exit 0.
2. **Linter:** `npm run lint` — 0 errores (el warning de `react-hooks/exhaustive-deps` en `orchestrator/page.tsx` pertenece al trabajo aún no confirmado de los specs).
3. **Descubrimiento Playwright:** `Total: 5 tests in 4 files`.
4. **Aislamiento Vitest:** ninguna línea `playwright-e2e` ni `.spec.ts` en `vitest list`.

---

## 4. Notas de Forja (Anti‑Alucinación)

- **`next start` no sirve con `output: 'standalone'`.** Next.js 16 emite el aviso y el proceso no arranca. El `webServer` usa `node .next/standalone/server.js` con `PORT=3000`.
- **El standalone no sirve el cliente solo.** Tras el build hay que copiar `.next/static` a `.next/standalone/.next/static` y `public` a `.next/standalone/public`. Sin esa copia el HTML llega, los chunks responden 404 y React no hidrata.
- **Los specs no pueden vivir en `/tests` (raíz).** Desde ahí Node no resuelve `@playwright/test`, que está instalado en `src/node_modules`. El `testDir` real es `src/playwright-e2e/`.
- **`src/tsconfig.json` excluye `playwright-e2e`.** El `include` es `**/*.ts`; sin esa exclusión, `tsc --noEmit` typechequeaba los specs.
- **`next start` no habilita la 308→HTTPS en localhost.** `isSecureConnection()` retorna `true` para `localhost`/`127.0.0.1` con independencia de `NODE_ENV`.
- **Footgun Vitest 4:** el `exclude` extiende `configDefaults.exclude`; una lista plana sobrescribiría `node_modules`.
