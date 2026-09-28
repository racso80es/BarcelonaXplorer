# [OPERATIVO] Documento Destilado: PBI - Instalación y Aislamiento de Playwright como devDependency

**Identificador:** PBI-QA-E2E-001  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-28  
**Fecha de Culminación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 13: Blindaje Empírico E2E y Tubería de Certificación Continua (Playwright)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2013:%20Blindaje%20Emp%C3%ADrico%20E2E%20y%20Tuber%C3%ADa%20de%20Certificaci%C3%B3n%20Continua%20(Playwright).md)  
**Módulo:** Infraestructura de Calidad (QA) — Tooling de pruebas  
**Entorno:** `src/package.json`, Node 20, Next.js 16 (output `standalone`), Docker multi‑stage  
**Prioridad:** Alta (P1 - Fundación del arnés E2E)  
**Estimación Táctica:** 1 Story Point  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Incorporar Playwright como motor E2E de navegador sin contaminar la imagen de producción que viaja al Nodo 11.
- **Entorno:** [`src/package.json`](file:///home/racso/Proyectos/BarcelonaXplorer/src/package.json), [`src/Dockerfile`](file:///home/racso/Proyectos/BarcelonaXplorer/src/Dockerfile), [`src/next.config.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/next.config.ts).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Playwright queda confinado a `devDependencies`; el runtime de producción no lo conoce.
  - *Filtro B (Determinismo):* Script `test:e2e` canónico y reproducible; binarios de navegador descargados de forma explícita.
  - *Filtro C (Eficiencia Operativa):* La imagen `standalone` del Nodo 11 no arrastra binarios de navegador ni la librería de test.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio de la Arquitectura,  
**Quiero** instalar `@playwright/test` estrictamente como `devDependency` y exponer el script `test:e2e`,  
**Para** disponer del motor E2E sin aumentar el peso ni la superficie de la imagen de producción del Nodo 11.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (devDependency):** `@playwright/test` se declara en `devDependencies` de `src/package.json` vía `npm install -D @playwright/test` (nunca en `dependencies`).
- [x] **CA-2 (Script canónico):** Existe el script `"test:e2e": "playwright test"` en `src/package.json`.
- [x] **CA-3 (Binarios de navegador):** Ejecutado `npx playwright install chromium` (en CI se usará `--with-deps`). Los binarios residen en la caché de Playwright (`~/.cache/ms-playwright` o equivalente), **no** en `node_modules`.
- [x] **CA-4 (Aislamiento de imagen — verificado):** La fase `runner` del `Dockerfile` copia únicamente `.next/standalone`, `.next/static` y `public` (no el `node_modules` de la fase `deps`); con `output: 'standalone'` ya activo, ni Playwright ni sus navegadores viajan a la imagen del Nodo 11 (`10.0.10.11`).

---

## 3. Evidencia de Certificación

- Paquete añadido: `@playwright/test` en `devDependencies` (`src/package-lock.json` actualizado).
- Script: `"test:e2e": "playwright test"`.

---

## 4. Notas de Forja (Anti‑Alucinación)

- `npm install -D` **no** descarga los binarios de navegador de `@playwright/test`; es un paso separado (`npx playwright install`).
- El aislamiento de la imagen ya está garantizado por la topología actual del `Dockerfile`; este PBI no requiere modificar el `Dockerfile`, solo verificarlo.
