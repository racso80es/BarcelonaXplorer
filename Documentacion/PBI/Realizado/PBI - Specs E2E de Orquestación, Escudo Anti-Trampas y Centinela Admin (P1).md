# [OPERATIVO] Documento Destilado: PBI - Specs E2E de Orquestación, Escudo Anti-Trampas y Centinela Admin

**Identificador:** PBI-QA-E2E-004  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-28  
**Fecha de Culminación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 13: Blindaje Empírico E2E y Tubería de Certificación Continua (Playwright)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2013:%20Blindaje%20Emp%C3%ADrico%20E2E%20y%20Tuber%C3%ADa%20de%20Certificaci%C3%B3n%20Continua%20(Playwright).md)  
**Módulo:** Frontera de Interfaz (PWA) — Escenarios E2E críticos  
**Entorno:** `src/playwright-e2e/*.spec.ts`, `src/app/orchestrator/page.tsx`, `src/middleware.ts`  
**Prioridad:** Alta (P1 - Cobertura empírica de flujos críticos)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** PBI-QA-E2E-003  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Materializar los Escenarios 1, 2 y 3 de la HU como specs Playwright con selectores resilientes anclados a los `data-testid` reales.
- **Entorno:** [`src/components/tactical/hybrid-canvas.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/tactical/hybrid-canvas.tsx), [`src/features/triage/components/thermal-meter.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.tsx), [`src/middleware.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/middleware.ts).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Selectores por `data-testid`/`role` (proscritas clases CSS y jerarquías frágiles); aserciones con `toBeVisible()` (sin `waitForTimeout`).
  - *Filtro B:* Comportamiento del middleware verificado tal cual está implementado (401 vs. 308).
  - *Filtro C:* Reutiliza los helpers/fixtures del PBI-QA-E2E-003.

---

## 1. Declaración de Intención (INVEST)

**Como** Ingeniero de Calidad,  
**Quiero** specs E2E que validen la orquestación determinista, el Escudo Anti‑Trampas en saturación y la resiliencia del centinela `/Admin`,  
**Para** detectar regresiones de UI y de seguridad perimetral antes de cualquier promoción.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Escenario 1 — Orquestación determinista):** Con los mocks activos, solicitar un itinerario renderiza el `HybridCanvas` sin ninguna llamada de red externa (cero tokens). Aserción de visibilidad del lienzo.
- [x] **CA-2 (Escenario 2 — Saturación S+ Grade):** Con fixture `thermalState: 'saturated'` y `antiTrapShield` poblado, se localizan:
  - `data-testid="thermal-meter"`
  - `data-testid="canvas-s-grade-banner"`
  - `data-testid="anti-trap-warnings-<waypointId>"`
  - `data-testid="recommended-alternatives-<waypointId>"` (condicionado a `isSaturated`)
  - y el enlace de afiliación `<a href={opt.affiliateUrl}>` es visible y clickable.
- [x] **CA-3 (Escenario 3 — Centinela `/Admin`):** `page.goto('/Admin/System')` **sin** credenciales devuelve **HTTP 401** con cabecera `WWW-Authenticate: Basic realm="BarcelonaXplorer Admin"`, y el DOM restringido (telemetría/`DataTable`) no es accesible.
- [x] **CA-4 (308 de normalización):** `page.goto('/admin/system')` produce redirección **HTTP 308** hacia la ruta canónica `/Admin/system`.
- [x] **CA-5 (Selectores resilientes):** Ningún spec usa clases CSS ni selectores jerárquicos frágiles; todos los `data-testid` existen realmente en el código.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No existen** los `data-testid` `hybrid-canvas-node` ni `anti-trap-shield-warning`. Los reales son dinámicos por *waypoint* (`anti-trap-warnings-<id>`, `recommended-alternatives-<id>`).
- **`warnings` vs `alternatives`:** las advertencias anti‑trampas se muestran si hay `warnings`; las alternativas recomendadas exigen **además** `isSaturated` (modo S+).
- **401 determinista, no "401 o 308 a HTTPS".** En localhost `isSecureConnection()` retorna `true`, así que pedir `/Admin/System` da **401**, nunca la 308→HTTPS. La 308 testeable es la de normalización de mayúsculas (`/admin`→`/Admin`).
- Para el caso autenticado usar `httpCredentials` / cabecera `Authorization: Basic <base64>`.
- **La 308 no se observa con `page.goto`.** Playwright sigue la redirección y aterriza en 401. El spec usa `request.get(url, { maxRedirects: 0 })`.
- **`fill()` no actualiza el estado de React en el build de producción.** El textarea es no controlado (`name="prompt"`, `defaultValue=""`). El despacho lee el valor del DOM. El hook `window.__bxDispatchPrompt` solo existe si el build llevó `NEXT_PUBLIC_E2E_DISPATCH_HOOK=1`, y el spec espera a que el efecto de hidratación lo registre.
- **El CTA del enlace no usa `ctaLabel` del DTO.** `resolveAffiliateCta` devuelve el diccionario (`secureEntrance` = «Asegurar Entrada») cuando `isPriorityAccess` es verdadero.

---

## 4. Evidencia de Certificación

1. **Compilador:** `tsc --noEmit` — exit 0.
2. **Linter:** `eslint app/orchestrator/page.tsx playwright.config.ts --max-warnings 0` — exit 0.
3. **Unitarios del orquestador:** `vitest run app/orchestrator/__tests__/page.test.tsx app/orchestrator/__tests__/streaming.test.tsx` — 12 passed.
4. **Suite E2E:** `CI=1 npm run test:e2e` — 5 passed (admin 401, admin 308, orquestación inline, orquestación SSE, saturación S+).
