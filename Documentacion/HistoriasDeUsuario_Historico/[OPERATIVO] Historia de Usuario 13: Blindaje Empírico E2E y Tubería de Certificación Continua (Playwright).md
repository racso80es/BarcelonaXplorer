# [OPERATIVO] Historia de Usuario 13: Blindaje Empírico E2E y Tubería de Certificación Continua (Playwright)

- **Estatus:** Realizado (S+ Grade) · Forja Culminada y Validada
- **Fecha de Revisión:** 2026-09-28
- **Fecha de Culminación:** 2026-09-28
- **Autor:** Orquestador Tormentosa / Vértice Biológico (Racso)
- **Módulo:** Infraestructura de Calidad (QA), CI/CD y Frontera de Interfaz (PWA)
- **Marco Normativo & Diseño:** [`Axiomas de Forja S+ Grade`](../../.SddIA/library/norms/) · [`ADR-001 (Vertical Slicing)`](../ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · Infraestructura de Despliegue Continuo (Ansistrano/IaaC)

> **Nota de refinamiento (2026-09-28):** Esta historia se contrastó línea a línea contra el código real del repositorio. Se corrigieron `data-testid` inexistentes, el alcance real del mocking (no basta con `/api/triage`), el comportamiento verificado del `middleware.ts` (Basic Auth `401` vs. redirección `308`), y la cadena real CI → despliegue (el `ansible-playbook` **no** se dispara desde GitHub Actions). Consulta el **Anexo A: Verificación Empírica (Anti‑Alucinación)** al final del documento para la tabla de correcciones y la lista de artefactos verificados.

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Automatización de la Duda Metódica, Cortafuegos de Regresiones y Escalabilidad de Pruebas.
- **Entorno:** Ecosistema Next.js 16 (App Router, Client/Server Components), Motor **Playwright** (a incorporar como dependencia directa), Pipeline **GitHub Actions** (`.github/workflows/ci.yml`), Nodo 11 de producción (`10.0.10.11`, grupo `nodos_pro`).
- **Entropía Asimilada:** Erradicación del desgaste termodinámico biológico en validaciones repetitivas. Se trasciende la dependencia de pruebas manuales para anclar un sistema autónomo que audita la interfaz de usuario, intercepta el consumo innecesario de tokens de los proveedores LLM y bloquea despliegues defectuosos hacia producción de forma determinista.

---

## 1. Descripción General

**Como** Ingeniero de Software (Vértice Biológico) y Custodio de la Arquitectura,
**Quiero** instanciar Playwright como el motor canónico de pruebas **End‑to‑End (E2E) de navegador**, integrado en la tubería de Integración Continua (CI) y regido por normas de crecimiento simbiótico,
**Para** garantizar que ninguna funcionalidad crítica (orquestación del Lienzo Híbrido `HybridCanvas`, Escudo Anti‑Trampas, rutas `/Admin` protegidas por el `middleware.ts`) colapse por regresiones ocultas, bloqueando atómicamente la promoción del código hacia el Nodo 11 si el sistema no supera la auditoría empírica automatizada.

> **Precisión de estado (forjado):** `@playwright/test` es **devDependency** en `src/package.json` con script `test:e2e`; el motor vive en `src/playwright.config.ts` (`testDir: './playwright-e2e'`). Los specs E2E de navegador están en `src/playwright-e2e/*.spec.ts`. Vitest cubre `**/*.test.ts` excluyendo `playwright-e2e/` y los E2E *en vivo* `tests/e2e/*.e2e.test.ts` (opt-in con `npm run test:live` y credenciales en `.env.local`). El cuádruple oráculo (`eslint → tsc → vitest → playwright`) corre en `scripts/audit-anchor.sh` y la Aduana Empírica precede a Ansistrano en `src/deploy.sh`.

---

## 2. Ejes Arquitectónicos del Blindaje Empírico

El despliegue de este arnés no es la mera instalación de una librería; es la forja de un centinela perimetral que vigila el estado de la aplicación desde la perspectiva del usuario final, operando bajo las siguientes directrices:

### A. El Cortafuegos del Oráculo (Mocking Determinista)

Para garantizar la inmunidad ante fallos de red externos y evitar el consumo estéril de tokens durante la CI, el motor E2E tiene prohibido despertar a los proveedores LLM. La página de orquestación (`app/orchestrator/page.tsx`) que renderiza el `HybridCanvas` invoca **tres** rutas de red, todas las cuales deben interceptarse quirúrgicamente con `page.route()`:

1. `GET /api/triage/ignition` — arranque de sesión/idioma.
2. `POST /api/triage` — Aduana Universal de Triaje (devuelve el DTO de resultado del triaje: `DISPATCH_READY`, `INCOMPLETE_REPROMPT`, `REBOUND_OUT_OF_SCOPE`, etc.).
3. `GET /api/orchestrator/stream` — flujo **SSE** que entrega progresivamente los *waypoints* de la ruta táctica (incluida la `tacticalMetadata` con el `antiTrapShield`).

> **Corrección clave:** Interceptar únicamente `/api/triage` **no** es suficiente para renderizar el `HybridCanvas` con sus nodos: los *waypoints* llegan por el stream `/api/orchestrator/stream`. El mock debe cubrir las tres rutas, inyectando matrices JSON pre‑calculadas (Ruta Base vs. Ruta S+ Grade) con latencia constante para un entorno 100 % determinista. Internamente, el triaje coordina a **JEV** (motor de decisión), **Groq** (SLM conversacional) y **Gemini** (generación de ruta + *embeddings*); mockear las rutas HTTP los desactiva a todos sin acoplarse a un proveedor concreto.

### B. Pacto de Crecimiento Simbiótico (Cobertura Incremental)

El ecosistema de pruebas no es un bloque estático; es un organismo que debe expandirse en paralelo al código. Se instaura la norma de que toda nueva entidad funcional (Caso de Uso, Componente UI complejo o Endpoint) debe ir escoltada por su respectivo espectro de validación. La colocación de tests unitarios/integración de Vitest sigue siendo *colocated* junto a la feature (Axioma I); los *specs* de Playwright, por su naturaleza cross‑feature, residen en su propio árbol E2E (ver §3).

### C. La Aduana de Despliegue (Bloqueo Atómico)

Playwright se incrusta como una aduana adicional en el flujo de certificación. Aquí debe distinguirse el estado actual del objetivo de esta historia:

- **Estado actual (verificado):** `.github/workflows/ci.yml` define un único job `oracle-gate` que ejecuta `scripts/audit-anchor.sh`. Ese script hoy consulta la *Santa Trinidad* — `tsc --noEmit`, `vitest run` (`npm test`) y `eslint` — pero **no** ejecuta Playwright. Además, **el CI no despliega**: no existe ningún paso que invoque `ansible-playbook`. El despliegue al Nodo 11 se dispara manualmente vía `src/deploy.sh`, que a su vez ejecuta `ansible/deploy.yml` (Ansistrano).
- **Objetivo de esta historia:** añadir el paso E2E de Playwright como **cuarto oráculo** en dos fronteras complementarias:
  1. En la CI (`oracle-gate` / `audit-anchor.sh`), de modo que un fallo E2E devuelva código de salida ≠ 0 y marque el workflow en rojo sobre `main`/PR.
  2. En `src/deploy.sh`, **antes** de invocar `ansible-playbook`, de modo que un fallo E2E aborte el despliegue y proteja la versión de producción sana (**Táctica del Refugio / Zero Downtime**).

---

## 3. Normativas de Desarrollo y Forja (El Yunque de Pruebas)

- **Topología Aislada y Convivencia de Runners:** Los *specs* de Playwright residirán en un árbol E2E dedicado con **extensión distintiva** `*.spec.ts` (p. ej. `tests/e2e/playwright/**/*.spec.ts`) y `testDir` propio declarado en `playwright.config.ts`. Esto es **obligatorio** porque `src/vitest.config.ts` incluye `../tests/**/*.test.{ts,tsx}`: si los *specs* de Playwright usaran el sufijo `.test.ts`, Vitest intentaría ejecutarlos (colisión de runners). Debe además excluirse explícitamente el árbol de Playwright del `include`/`exclude` de Vitest.
- **Selectores Resilientes:** Queda proscrito localizar elementos del DOM mediante clases CSS (`.bg-zinc-900`) o jerarquías frágiles (`div > span`). Las interacciones se anclarán a atributos de accesibilidad (`aria-label`, `role`) o a los `data-testid` **realmente presentes** en el código (ver Anexo A), garantizando que las mutaciones de estilo de Tailwind no fracturen las pruebas.
- **Gestión del Estado Híbrido:** Las pruebas deben contemplar los retardos asíncronos del renderizado reactivo y del stream SSE, usando aserciones que esperen la resolución del DOM (`await expect(locator).toBeVisible()`) en lugar de pausas fijas (`page.waitForTimeout`), cumpliendo el Filtro C de economía termodinámica.
- **Autenticación en pruebas `/Admin`:** El `middleware.ts` protege `/Admin` con **HTTP Basic Auth**. Las pruebas que requieran acceso autenticado deben usar `httpCredentials`/cabecera `Authorization: Basic <base64>`; las pruebas de rechazo deben omitir dichas credenciales.

---

## 4. Criterios de Aceptación (Verificación Empírica)

### Escenario 1: Orquestación Determinista y Desacople del LLM
- **Dado** la ejecución de la suite E2E de Playwright sobre el entorno local o CI.
- **Cuando** el agente automatizado simula la solicitud de generación de un itinerario completo.
- **Entonces** Playwright intercepta `GET /api/triage/ignition`, `POST /api/triage` y el stream `GET /api/orchestrator/stream`, anula toda petición de red externa y devuelve DTOs mockeados con latencia constante (objetivo de SLA de mock ≤ 50 ms por respuesta).
- **Y** la interfaz renderiza el `HybridCanvas` con sus *waypoints* basándose exclusivamente en los mocks, validando la coreografía sin consumir tokens de JEV/Groq/Gemini.

### Escenario 2: Validación Visual de Saturación Térmica (S+ Grade)
- **Dado** un mock de contexto de usuario que fuerza `thermalState: 'saturated'` (100 % de saturación) y *waypoints* con `tacticalMetadata.antiTrapShield` poblado (`warnings` + `recommendedAlternatives`).
- **Cuando** el itinerario se proyecta en la interfaz.
- **Entonces** la aserción localiza el medidor `data-testid="thermal-meter"` y el banner de modo `data-testid="canvas-s-grade-banner"`.
- **Y** confirma la presencia del bloque de advertencias `data-testid="anti-trap-warnings-<waypointId>"` y del bloque de alternativas locales `data-testid="recommended-alternatives-<waypointId>"`.
- **Y** verifica la presencia y clickabilidad del enlace de afiliación (CPA) — el `<a href={opt.affiliateUrl}>` de proveedores como TheFork/Civitatis— dentro de las opciones del nodo.

> **Corrección clave:** No existe el `data-testid="anti-trap-shield-warning"` mencionado en versiones previas. Los identificadores reales son dinámicos por *waypoint* (`anti-trap-warnings-<id>`, `recommended-alternatives-<id>`). Nótese además que las advertencias anti‑trampas se muestran cuando hay `warnings`, mientras que las *alternativas recomendadas* están adicionalmente condicionadas a `isSaturated` (modo S+).

### Escenario 3: Resiliencia del Centinela Perimetral (`/Admin`)
- **Dado** un intento de acceso directo mediante `page.goto('/Admin/System')` **sin** cabecera `Authorization`.
- **Cuando** el Edge Middleware (`middleware.ts`) procesa la petición.
- **Entonces** Playwright valida que la respuesta es **HTTP 401 (Unauthorized)** con la cabecera `WWW-Authenticate: Basic realm="BarcelonaXplorer Admin"`.
- **Y** valida, como caso complementario, que una petición a la variante minúscula `/admin/system` produce una redirección **HTTP 308** hacia la ruta canónica `/Admin/system`.
- **Y** corrobora que el DOM restringido del panel (p. ej. la telemetría en `DataTable`) no es accesible sin credenciales válidas.

> **Corrección clave:** En entorno de prueba/CI (`NODE_ENV !== 'production'`) `isSecureConnection()` retorna `true`, por lo que **no** se emite la redirección `308` "forzada hacia HTTPS" al pedir `/Admin/System`; el resultado determinista es `401`. La redirección `308` a HTTPS solo ocurre en producción sobre conexiones inseguras; la redirección `308` de normalización de mayúsculas (`/admin` → `/Admin`) sí es reproducible en pruebas.

### Escenario 4: Bloqueo de Certificación/Despliegue ante Falla Empírica (CI/CD)
- **Dado** la inyección intencionada de un error de renderizado en un componente crítico (p. ej. ocultar el botón de generación de ruta).
- **Cuando** se dispara la CI de GitHub Actions sobre `main`/PR **o** se ejecuta `src/deploy.sh`.
- **Entonces** el paso `playwright test` colapsa con código de salida ≠ 0.
- **Y (CI):** el job `oracle-gate` falla y el workflow queda en rojo, impidiendo la fusión.
- **Y (Despliegue):** `src/deploy.sh` aborta **antes** de invocar `ansible-playbook -i ansible/inventory.ini ansible/deploy.yml`, garantizando el **Zero Downtime** y la inmutabilidad de la producción sana en el Nodo 11.

> **Corrección clave:** La versión previa afirmaba que la GitHub Action "impide la activación de `ansible-playbook`". Es una incoherencia: el `ci.yml` actual **no contiene** ningún paso de despliegue Ansible. La aduana de despliegue debe implementarse donde el `ansible-playbook` realmente se dispara (`src/deploy.sh`) y/o añadirse un job de deploy en el workflow **dependiente** del `oracle-gate` (esto último constituiría trabajo adicional de infraestructura).

---

## 5. Desglose Táctico de la Forja Implicada (Guía de Implementación)

> Esta sección concreta la mecánica de codificación. Se ha contrastado con el código real; los puntos marcados como **Corrección** ajustan afirmaciones inexactas del desglose original.

### 5.1 Dependencia y Scripting (Aislamiento de Producción)
- Instalar `@playwright/test` estrictamente como **devDependency** en `src/package.json` (`npm install -D @playwright/test`) y descargar navegadores con `npx playwright install --with-deps chromium` (el `npm install` por sí solo **no** descarga los binarios de `@playwright/test`; residen en `~/.cache/ms-playwright`, no en `node_modules`).
- Script: `"test:e2e": "playwright test"`.
- **Verificado (correcto y reforzado):** `src/next.config.ts` ya declara `output: 'standalone'` y el `Dockerfile` multi‑stage copia a la fase `runner` únicamente `.next/standalone`, `.next/static` y `public` — **no** copia el `node_modules` de la fase `deps`. Por tanto, ni `@playwright/test` ni los binarios de navegador viajan jamás a la imagen del Nodo 11 (`10.0.10.11`). La ligereza de la imagen queda doblemente garantizada por la topología del Dockerfile.

### 5.2 Configuración del Motor (`playwright.config.ts`)
- **Ubicación (Soberanía de Contexto):** `src/playwright.config.ts`. Como el ecosistema Node (`package.json`, `node_modules`, Next) reside íntegramente bajo `src/`, alojar ahí la config permite que el `webServer` ejecute `npm run build && npm run start` **sin** saltos de directorio (`cwd`), heredando limpiamente el contexto de `src/package.json`. Declarar `use.baseURL: 'http://localhost:3000'` y `testDir: '../tests/e2e/playwright'`.
  - **Corrección de ruta de specs:** los specs **no** van bajo `src/tests/` (ese directorio no existe). El árbol de tests canónico está en la **raíz del repo** (`/tests/e2e/`), ya referenciado por Vitest mediante `../tests/**`. Además, `src/tsconfig.json` incluye `**/*.ts`: colocar `*.spec.ts` dentro de `src/` los arrastraría al chequeo de tipos de la app. Por tanto, `testDir: '../tests/e2e/playwright'` (relativo a `src/`) mantiene la cohesión sin contaminar el tipo‑check.
- **`webServer`:** `command: 'npm run build && npm run start'`, `url: 'http://localhost:3000'`, `reuseExistingServer: !process.env.CI` (evita recompilar si ya hay servidor local levantado).
- **Corrección clave (fidelidad Edge Runtime ≠ 308→HTTPS en localhost):** usar la build de producción es buena práctica (middleware Edge realmente compilado, flags `secure` de cookies, `NODE_ENV=production`), pero atribuirle "validar las redirecciones 308 a HTTPS" es **inexacto en localhost**. `isSecureConnection()` retorna `true` cuando el `host` contiene `localhost`/`127.0.0.1` (independiente de `NODE_ENV`), de modo que la **308→HTTPS nunca se dispara** contra un `webServer` local, ni siquiera con `next start`. Lo que sí es reproducible en E2E:
  - **308 de normalización** `/admin` → `/Admin` (independiente del entorno; funciona incluso bajo `next dev`).
  - **401 Basic Auth** para `/Admin/...` sin credenciales (funciona en dev y prod).
  - Para ejercitar de verdad la **308→HTTPS** habría que falsear un `Host` no‑localhost + `x-forwarded-proto: http` (vía `page.route()`/`extraHTTPHeaders`); no basta con la build de producción.
- **Advertencia Operativa Nivel A (Fidelidad del Edge Runtime):** mantener `npm run build && npm run start` (proscribir `next dev`) por fidelidad general del Edge Runtime y de las cookies `secure`, **sin** afirmar que ello habilita la 308→HTTPS en localhost.

### 5.3 Convivencia de Runners (Vitest vs Playwright)
- Convención de extensiones: Playwright → `*.spec.ts` bajo `tests/e2e/playwright/`; pruebas en vivo de Vitest → `*.e2e.test.ts` (se conservan).
- **Corrección clave (footgun de Vitest):** definir `exclude` como lista plana **reemplaza** los valores por defecto de Vitest (`node_modules`, `dist`, `.git`, `.cache`, …), provocando que Vitest escanee `node_modules`. Debe **extenderse** desde `configDefaults`:

```ts
import { defineConfig, configDefaults } from 'vitest/config';
// ...
exclude: [...configDefaults.exclude, '**/tests/e2e/playwright/**'],
```

  Nota: como el `include` actual solo captura `*.test.{ts,tsx}` y Playwright usa `*.spec.ts`, esta exclusión es **defensa en profundidad** (redundante pero recomendable).

### 5.4 Mocking de Red (El Reto del SSE) — Advertencia Operativa Nivel A
- `GET /api/triage/ignition` y `POST /api/triage`: interceptar con `route.fulfill` devolviendo JSON estándar.
- `/api/orchestrator/stream` — **correcciones respecto al desglose original:**
  - **Método real:** el cliente `consumeOrchestratorStream` invoca este endpoint por **POST** (con body `{ prompt }` y `Accept: text/event-stream`) y lo lee vía `response.body.getReader()`. La descripción "`GET /api/orchestrator/stream`" es inexacta; aunque `page.route()` matchea por URL con independencia del método, el mock debe contemplar el **POST**.
  - **Formato SSE:** `route.fulfill({ contentType: 'text/event-stream', body })`, donde `body` concatena **eventos SSE tipados** — no "waypoints en crudo". Cada bloque es `data: <json>\n\n`, con `<json>` validando contra `OrchestratorStreamEventSchema` (`type` ∈ `meta_init` | `stop_emitted` | `affiliate_injected` | `stream_complete` | `stream_error`). El parser (`src/features/planner/stream-consumer.ts`) divide por `\n\n`, exige prefijo `data:` y hace `JSON.parse`.
  - **Terminología:** el flujo es **texto UTF-8** (SSE decodificado con `TextDecoder`), **no** "binario" ni "encriptado"; omitir el `\n\n` o el prefijo `data:` hace que el parser ignore los fragmentos y la prueba caduque por *timeout*.
  - **Naturaleza de `fulfill`:** es de **disparo único** (entrega el body completo de una vez), suficiente para aserciones de estado final; no reproduce el goteo incremental real del stream.
- **Atajo válido (menos frágil):** el cliente solo consume el stream si `/api/triage` responde `DISPATCH_READY` **sin** campo `itinerary`. Si el mock de `/api/triage` incluye un `itinerary` completo en su DTO, el `HybridCanvas` se renderiza directamente y **no** se necesita mockear el SSE. Recomendado para los Escenarios 1/2 salvo que se quiera probar específicamente la ruta de streaming.

### 5.5 La Frontera CI/CD (Scripts Bash)
- **`scripts/audit-anchor.sh`:** reordenar los oráculos por peso termodinámico / *Fail‑Fast* → `eslint → tsc → vitest → playwright test`, ejecutados desde `src/`. **Matiz verificado:** el orden actual del script es `tsc → vitest → eslint`; esta HU lo reordena y añade Playwright como **cuarto oráculo**. Situar `playwright test` al final es correcto porque su `webServer` levanta la app (build+start) y es el paso más costoso.
- **`src/deploy.sh` — Peaje de Infraestructura (orden por coste computacional):** el E2E **no** va en la primera línea. Un ping SSH o la comprobación de comandos (`ansible-playbook`, `rsync`) cuesta milisegundos, mientras que levantar Next y correr Playwright cuesta decenas de segundos. El orden correcto es: **(1) Aduana Física** (variables de entorno, conectividad SSH al Nodo 11, espacio en disco y presencia de Ansistrano) → **(2) Aduana Empírica** (`(cd "${PROJECT_ROOT}/src" && npm run test:e2e)` como oráculo final) → **(3) Ignición** (`ansible-playbook`). Con `set -euo pipefail` (ya presente) un código ≠ 0 aborta antes de desplegar, y nunca se gastan ciclos de CPU probando el código si la red hacia el Nodo 11 está caída.

---

## Anexo A: Verificación Empírica (Anti‑Alucinación)

### A.1 Tabla de correcciones respecto a la versión anterior

| # | Afirmación previa | Realidad verificada en el código | Corrección aplicada |
|---|-------------------|----------------------------------|---------------------|
| 1 | `data-testid="hybrid-canvas-node"` | No existe. Los testids reales del `HybridCanvas` son `canvas-safety-banner`, `canvas-s-grade-banner`, `pickpocket-badge-<id>`, `anti-trap-warnings-<id>`, `recommended-alternatives-<id>` | Ejemplos de selector sustituidos por los reales |
| 2 | `data-testid="anti-trap-shield-warning"` | El real es `anti-trap-warnings-<waypointId>` (dinámico) | Escenario 2 y §3 corregidos |
| 3 | Basta interceptar `/api/triage` para renderizar el Lienzo | El Lienzo se alimenta del stream `/api/orchestrator/stream`; la página también llama a `/api/triage/ignition` | Mock ampliado a las 3 rutas |
| 4 | "Prohibido despertar a Gemini" (único proveedor) | El triaje usa JEV + Groq + Gemini (+ embeddings Gemini) | Generalizado a "proveedores LLM"; el mock HTTP los cubre a todos |
| 5 | `/Admin/System` sin auth → `401` **o** `308` a HTTPS | En test/dev el resultado es `401` (Basic Auth). El `308` a HTTPS solo en producción; el `308` de mayúsculas (`/admin`→`/Admin`) sí es testeable | Escenario 3 desdoblado y precisado |
| 6 | La GitHub Action bloquea `ansible-playbook` | `ci.yml` no despliega; el deploy lo dispara `src/deploy.sh` | Escenario 4 y Eje C reescritos con las dos fronteras reales |
| 7 | `audit-anchor.sh` ya condiciona su salida a la suite E2E | Solo ejecutaba `tsc`, `vitest` y `eslint` | Reordenado a `eslint → tsc → vitest → playwright` (PBI-QA-E2E-005) |
| 8 | `tests/e2e/` es el hogar limpio de Playwright | Ya contiene E2E *en vivo* de **Vitest** (`*.e2e.test.ts`), capturados por `vitest.config.ts` | Definida convivencia: `*.spec.ts` + `testDir` propio + exclusión en Vitest |
| 9 | El mock de `/api/triage` devuelve un `TacticalMetadataSchema` | `/api/triage` devuelve el DTO del resultado de triaje; `TacticalMetadataSchema` vive anidado en los *waypoints* del stream | Aclarada la forma de cada mock |
| 10 | Interceptar `GET /api/orchestrator/stream` | El cliente `consumeOrchestratorStream` invoca el endpoint por **POST** (`body { prompt }`, `getReader()`) | §5.4: método corregido a POST |
| 11 | La build de producción (`next start`) permite "validar las redirecciones 308 a HTTPS" | En localhost `isSecureConnection()` retorna `true` (bypass `localhost`/`127.0.0.1`), la 308→HTTPS **no** se dispara; sí la 308 `/admin`→`/Admin` y el 401 | §5.2: justificación corregida y matizada |
| 12 | `exclude: ['**/tests/e2e/playwright/**']` (lista plana) | En Vitest 4, un `exclude` plano **sobrescribe** los defaults (escanearía `node_modules`) | §5.3: extender con `...configDefaults.exclude` |
| 13 | SSE como "protocolo binario" que hay que "desencriptar"; emitir "waypoints en crudo" | SSE es **texto UTF‑8**; deben emitirse **eventos tipados** (`type`+`data`) validables por `OrchestratorStreamEventSchema` | §5.4: terminología y payload corregidos |
| 14 | `@playwright/test` arrastraría binarios a la imagen del Nodo 11 | `output: 'standalone'` + `Dockerfile` runner sin `node_modules` de `deps` ⇒ nunca viajan | §5.1: afirmación confirmada y reforzada |
| 15 | Poner el E2E en la primera línea de `deploy.sh` | Un fallo de red/SSH se descubriría tras decenas de segundos de build | §5.5: orden Aduana Física → Aduana Empírica → Ignición |
| 16 | Specs bajo `src/tests/e2e/playwright/` | No existe `src/tests/`; `@playwright/test` se resuelve desde `src/node_modules` | Implementación: `src/playwright-e2e/` + `exclude` en `tsconfig` y `vitest.config` |

### A.2 Artefactos de código verificados (rutas reales)

- **Rutas API:** `src/app/api/triage/route.ts`, `src/app/api/triage/ignition/route.ts`, `src/app/api/orchestrator/stream/route.ts`.
- **UI / Lienzo:** `src/app/orchestrator/page.tsx` (fetch a `/api/triage/ignition`, `/api/triage`, `/api/orchestrator/stream`), `src/components/tactical/hybrid-canvas.tsx`, `src/features/triage/components/thermal-meter.tsx`.
- **Esquema:** `TacticalMetadataSchema` en `src/features/guide-templates/domain/guide-template.schema.ts`.
- **Seguridad perimetral:** `src/middleware.ts` (Basic Auth `401`, `WWW-Authenticate: Basic`, redirecciones `308`, matcher `['/Admin', '/Admin/:path*', '/admin', '/admin/:path*']`), panel `src/app/Admin/System/`.
- **CI/CD e IaaC:** `.github/workflows/ci.yml` (job `oracle-gate` → `scripts/audit-anchor.sh`), `src/deploy.sh`, `ansible/deploy.yml`, `ansible/inventory.ini` (`10.0.10.11`, grupo `nodos_pro`).
- **Config de test actual:** `src/vitest.config.ts` (`include: ['../tests/**/*.test.{ts,tsx}', './**/*.test.{ts,tsx}']`).

### A.3 Trabajo de forja implicado (checklist)

- [x] Declarar `@playwright/test` como **devDependency** en `src/package.json`, añadir script `"test:e2e": "playwright test"` y ejecutar `npx playwright install --with-deps chromium`. → **PBI-QA-E2E-001**
- [x] Crear `src/playwright.config.ts` con `testDir: './playwright-e2e'`, `baseURL: http://localhost:3000` y `webServer` (build standalone + copia de estáticos, `reuseExistingServer: !process.env.CI`). → **PBI-QA-E2E-002**
- [x] Ubicar *specs* como `*.spec.ts` en `src/playwright-e2e/` y extender `vitest.config.ts` con `exclude: [...configDefaults.exclude, '**/playwright-e2e/**']`. → **PBI-QA-E2E-002**
- [x] Implementar helpers de `page.route()`: JSON para `/api/triage/ignition` y `/api/triage`; SSE tipado sobre **POST** `/api/orchestrator/stream`; atajo `itinerary` inline. → **PBI-QA-E2E-003** / **PBI-QA-E2E-004**
- [x] Reordenar `scripts/audit-anchor.sh` a `eslint → tsc → vitest → playwright test` y Aduana Empírica en `src/deploy.sh` (física → E2E → `ansible-playbook`). → **PBI-QA-E2E-005**

---

## 6. Product Backlog Items (Forja Culminada)

1. **`PBI-QA-E2E-001` — Realizado (S+ Grade):** [Instalación y Aislamiento de Playwright como devDependency](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Instalaci%C3%B3n%20y%20Aislamiento%20de%20Playwright%20como%20devDependency%20(P1).md)
2. **`PBI-QA-E2E-002` — Realizado (S+ Grade):** [Configuración del Motor Playwright y Convivencia con Vitest](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Configuraci%C3%B3n%20del%20Motor%20Playwright%20y%20Convivencia%20con%20Vitest%20(P1).md)
3. **`PBI-QA-E2E-003` — Realizado (S+ Grade):** [Helpers de Mocking Determinista e Interceptor SSE](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Helpers%20de%20Mocking%20Determinista%20e%20Interceptor%20SSE%20(P1).md)
4. **`PBI-QA-E2E-004` — Realizado (S+ Grade):** [Specs E2E de Orquestación, Escudo Anti-Trampas y Centinela Admin](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Specs%20E2E%20de%20Orquestaci%C3%B3n,%20Escudo%20Anti-Trampas%20y%20Centinela%20Admin%20(P1).md)
5. **`PBI-QA-E2E-005` — Realizado (S+ Grade):** [Integración de Playwright como Cuarto Oráculo en CI y Despliegue](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Integraci%C3%B3n%20de%20Playwright%20como%20Cuarto%20Or%C3%A1culo%20en%20CI%20y%20Despliegue%20(P2).md)
