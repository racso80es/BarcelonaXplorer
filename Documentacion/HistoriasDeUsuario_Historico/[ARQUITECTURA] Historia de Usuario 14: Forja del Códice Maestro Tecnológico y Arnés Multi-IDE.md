# [ARQUITECTURA] Historia de Usuario 14: Forja del Códice Maestro Tecnológico y Arnés Multi-IDE (Preparación SddIA)

- **Estatus:** Realizado (S+ Grade) · Forja Culminada — Códice en `active` tras evaluación Antigravity (PBI-CODEX-005)
- **Fecha de Revisión:** 2026-09-28
- **Fecha de Culminación:** 2026-09-28
- **Autor:** Orquestador Tormentosa / Vértice Biológico (Racso)
- **Módulo:** Gobernanza Tecnológica, Ecosistema de Agentes y Transición a Librería SddIA
- **Marco Normativo & Diseño:** [Simetría Fractal de Infraestructura] · [Ley de Jurisdicción Dividida] · [Ontología de Activos (`Library_Codex`)] · [`Axiomas de Forja S+ Grade`](../../.SddIA/library/norms/) · [`Estandar-Formato-Configuracion.yml`](../../.SddIA/library/norms/Estandar-Formato-Configuracion.yml) · [`ADR-001 (Vertical Slicing)`](../ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [`CONSTITUTION.md`](../../CONSTITUTION.md)

> **Nota de refinamiento (2026-09-28):** Esta historia se contrastó contra el estado real del repositorio. Se corrigieron: la numeración (el título decía HU‑15), las versiones difusas del stack (Prisma, Tailwind y Zod sin versión; omisión de `@base-ui/react`, Zod 4 y Vitest 4, principales focos de alucinación real), el mandato de Server Actions (el repositorio no contiene ninguna; las mutaciones viajan por Route Handlers con `OperationEnvelope<T>`), el Escenario 3 (un RSC invocando Prisma directamente viola la arquitectura de puertos y casos de uso vigente, y no existe modelo `User`), la omisión de los archivos de arranque reales de los IDEs (`.cursor/rules/`, `.agents/rules/`, `CLAUDE.md`), la presentación de un documento Markdown como "reglas de compilación estáticas" y la dependencia de un esquema SddIA Core que no existe en el repositorio. Detalle en el **Anexo A: Verificación Empírica (Anti‑Alucinación)**.

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Creación de un activo de conocimiento programático (el Códice Maestro Tecnológico), acoplamiento obligatorio al arnés de los IDEs actuales y preparación estructural (frontmatter YAML + cuerpo Markdown) para su futura asimilación por el Core SddIA.
- **Entorno:** Repositorio BarcelonaXplorer (BX) · IDEs de IA: Google Antigravity, Cursor y Claude Code · futura arquitectura SddIA Core.
- **Entropía Asimilada:** Los LLM responden con su "memoria base", entrenada sobre versiones anteriores del stack. En BX los riesgos concretos son: Pages Router en lugar de App Router; API de Zod 3 sobre Zod 4; primitivas Radix sobre `@base-ui/react`; `tailwind.config.js` sobre la configuración CSS-first de Tailwind 4; APIs de Prisma ≥ 6 sobre Prisma 5.22; SDK `@google/generative-ai` sobre `@google/genai`. El Códice fija estas versiones y patrones como fundamentos verificables.
- **Límite declarado:** Un documento Markdown **no es un compilador**. Su lectura por un LLM es probabilística. La obligatoriedad real solo existe donde un fundamento esté respaldado por un oráculo mecánico (`tsc --noEmit`, `eslint`, `vitest run`); el resto se certifica mediante evaluación conductual documentada (Escenario 4).

---

## 1. Descripción General

**Como** Arquitecto de Plataforma (Vértice Biológico),
**Quiero** forjar un activo documental estructurado (Códice Maestro Tecnológico) que fije las versiones exactas y los patrones programáticos obligatorios del stack de BX, y enlazarlo desde todos los archivos de arranque de los IDEs activos,
**Para** reducir la generación de código basado en APIs obsoletas o ajenas al proyecto y, a la vez, dejar el activo con una estructura (frontmatter YAML validado + Markdown) apta para que el Core SddIA lo asimile como `Library_Codex` sin refactorización.

---

## 2. Ejes Arquitectónicos y Directrices de Forja (El Yunque Rúnico)

### A. Topología de Simetría Fractal (Preparación SddIA)

El activo no se mezcla con la documentación de negocio de BX (`Documentacion/`). Se instancia junto a la Biblioteca Canónica existente:

| Elemento | Valor | Estado actual |
|---|---|---|
| Directorio | `.SddIA/library/codexes/` | **No existe.** Hoy solo existe `.SddIA/library/norms/`. |
| Archivo | `tech-master-nextjs-prisma.md` (decisión 1 de la sección 6) | No existe. |
| Índice | `.SddIA/library/codexes/index.md` | No existe. Se crea en esta HU (ver Escenario 5). |

**Jerarquía normativa (sin solapamiento):**

1. `CONSTITUTION.md` → 2. `.SddIA/library/norms/` (axiomas agnósticos de tecnología) → 3. `.SddIA/library/codexes/` (concreción tecnológica).
- El Códice **no redefine** los axiomas (p. ej. la prohibición de `any` ya reside en las normas); los **referencia** y los concreta para el stack. Ante conflicto prevalece el nivel superior.

**Coherencia con el manifiesto SddIA:** `.SddIA/project.md` declara `codex_slug: codex-software-engineering`. Ese campo y el Códice son identidades distintas; la relación queda cruzada en el índice, sin editar `project.md` (decisión 1 de la sección 6).

### B. Anatomía del Activo (Cicatriz Digital SddIA)

#### B.1. Frontmatter YAML (El Genoma)

Debe cumplir [`Estandar-Formato-Configuracion.yml`](../../.SddIA/library/norms/Estandar-Formato-Configuracion.yml) (YAML comentado, parseo seguro) y validarse con un esquema Zod (Axioma II). Campos mínimos:

| Campo | Tipo / Restricción | Nota |
|---|---|---|
| `uuid` | UUID v4 | Generado con `crypto.randomUUID()` o `uuidgen`. **Prohibido que el LLM lo invente**: un UUID "tecleado" puede ser sintácticamente válido y no aleatorio. |
| `slug` | `kebab-case` | Reconciliado con `codex_slug` de `project.md`. |
| `version` | SemVer (`1.0.0`) | |
| `type` | literal `Library_Codex` | |
| `status` | `draft` \| `active` \| `deprecated` | |
| `updated_at` | fecha ISO 8601 | |
| `source_of_truth` | `src/package.json` | Las versiones del códice se contrastan contra este archivo. |
| `target_technologies` | lista de `{ name, version }` | Versiones **fijadas**, no genéricas. Ver tabla B.2. |

#### B.2. Stack real a declarar en `target_technologies` (fuente: `src/package.json`, 2026-09-28)

| Tecnología | Versión instalada | Riesgo de alucinación que el Códice debe neutralizar |
|---|---|---|
| Next.js | `16.3.5` (App Router, `output: 'standalone'`) | Pages Router, `getServerSideProps`, APIs síncronas de `params`/`cookies()`/`headers()`. El repo aún usa `src/middleware.ts`; Next 16 promueve `proxy.ts`: el Códice debe fijar la postura vigente. |
| React / React DOM | `19.2.8` | `useEffect` + `fetch` para carga inicial de datos; `'use client'` en nodos altos del árbol. |
| TypeScript | `^5` | — |
| Prisma (`prisma`, `@prisma/client`) | `^5.22.0`, proveedor **MySQL** | APIs de Prisma ≥ 6; instanciar `PrismaClient` fuera del singleton `src/shared/persistence/prisma.ts`. |
| Zod | `^4.6.5` | API de Zod 3. |
| Tailwind CSS | `^4` (CSS-first, `@tailwindcss/postcss`, sin `tailwind.config.*`) | Generar `tailwind.config.js`. |
| shadcn/ui | estilo `base-nova` sobre `@base-ui/react` | Importar primitivas `@radix-ui/*`. |
| Vitest | `^4` (tests colocalizados) | Árboles espejo de tests; APIs de Jest. |
| Playwright | `^1.63` (`src/playwright-e2e/`) | — |
| SDK IA | `@google/genai`, `groq-sdk` | SDK obsoleto `@google/generative-ai`. |
| Vectorial | `@lancedb/lancedb` (en `serverExternalPackages`) | — |

#### B.3. Cuerpo Markdown (El Alma Programática)

Cada fundamento es una sentencia verificable con identificador y mecanismo de cumplimiento, no un consejo:

```markdown
### TC-NEXT-001 — Carga inicial de datos en servidor
- Sentencia: En código nuevo, la carga inicial de datos se realiza en React Server Components asíncronos. Prohibido `useEffect` + `fetch` para datos disponibles en el servidor.
- Excepción: datos que dependen exclusivamente del navegador (APIs del cliente, suscripciones en tiempo real).
- Cumplimiento: revisión (sin oráculo mecánico en esta HU).
- Anclaje: Axioma III; `src/components.json` (`rsc: true`).
```

**Fundamentos corregidos respecto al borrador original:**

1. **Carga de datos (TC-NEXT-001):** como el ejemplo anterior. El borrador mezclaba carga y mutación en una misma sentencia; se separan.
2. **Mutaciones (TC-NEXT-002):** el patrón único son Route Handlers en `src/app/api/**` que retornan `OperationEnvelope<T>` (Axioma V) y delegan en casos de uso. Son **obligatorios** para webhooks externos (Telegram), streaming SSE (`/api/triage`) y telemetría emitida desde error boundaries. Las Server Actions no se admiten (decisión 2 de la sección 6). La ruta o la página, como raíz de composición, puede instanciar el adaptador Prisma e inyectarlo en el caso de uso.
3. **Persistencia (TC-PRISMA-001):** Prisma solo se usa en adaptadores `prisma-*.repository.ts` dentro de su feature, a través del singleton `src/shared/persistence/prisma.ts`. Los repositorios implementan un puerto y **retornan entidades o Value Objects de dominio**: los tipos generados por Prisma no cruzan el puerto. (El borrador exigía retornar "tipos generados", lo que filtra infraestructura al dominio.)
4. **Casts (TC-TS-001):** prohibido `as unknown as T` en código de producción, salvo excepciones catalogadas en el propio Códice. Excepciones conocidas hoy: el patrón `globalThis` del singleton de Prisma. Infracción conocida: `src/features/triage/triage-input.use-case.ts:142`. La postura para dobles de test (`weather.adapter.test.ts`, `triage.test.ts`) se fija en el Códice.

### C. El Puente Físico de Acoplamiento (Arnés Multi-IDE)

Hasta que SddIA asuma la orquestación, los IDEs actúan como IA obrera. La directiva de lectura del Códice debe inyectarse en **todos** los archivos de arranque que existen hoy, no solo en `AGENTS.md` y `.cursorrules`:

| Archivo | Consumidor | Acción |
|---|---|---|
| `AGENTS.md` | Google Antigravity y agentes genéricos | Añadir bloque "Inyección de Códice Tecnológico". |
| `.agents/rules/sddia-axiomas-forja.md` | Google Antigravity (reglas de workspace) | Añadir referencia al Códice. |
| `.cursor/rules/sddia-axiomas-forja.mdc` | Cursor (formato vigente de reglas) | Añadir referencia al Códice. |
| `.cursorrules` | Cursor (formato heredado) | Añadir referencia al Códice. |
| `CLAUDE.md` | Claude Code / agentes CLI | Añadir referencia al Códice. |

**Texto canónico del bloque** (idéntico en los cinco archivos para facilitar su verificación mecánica):

> **Inyección de Códice Tecnológico:** Antes de crear o modificar código fuente, lee `.SddIA/library/codexes/tech-master-nextjs-prisma.md`. Si tu propuesta contradice un fundamento `TC-*`, no la emitas: señala el fundamento afectado y propone una alternativa conforme. Los fundamentos del Códice prevalecen sobre tu conocimiento previo del stack.

Se sustituye el "aborta la generación" del borrador por "señala el fundamento y propone una alternativa": un rechazo silencioso no es auditable.

### D. Deuda heredada (Cláusula de Transición)

El Códice rige para **código nuevo o modificado**. Las infracciones existentes se registran como deuda y se derivan a la auditoría de HU‑15 (Auditoría Ontológica de Acero), sin remediarse en esta historia:

| Fundamento | Infracción existente |
|---|---|
| TC-NEXT-001 | `src/app/orchestrator/page.tsx` (ignición con `useEffect` + `fetch('/api/triage/ignition')`), `src/components/tactical/telegram-anchor-drop.tsx` |
| TC-TS-001 | `src/features/triage/triage-input.use-case.ts:142` |

### E. Alcance y Axioma I

Esta HU toca más de 3 archivos (el Códice, su índice, 5 archivos de arranque, un test y `package.json`). No es una feature de negocio. Para respetar el umbral de ≤ 3 context hops se descompone en los cinco PBIs de la sección 5; ninguno de ellos modifica más de 3 archivos.

---

## 3. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Forja de la Cicatriz Digital (Contrato verificable)

- **Dado** el requerimiento de instanciar el Códice Maestro,
- **Cuando** se crea `.SddIA/library/codexes/tech-master-nextjs-prisma.md`,
- **Entonces** el archivo inicia con un bloque YAML delimitado por `---`, parseado con `YAML.parse()` y validado por un esquema Zod que exige los campos de la tabla B.1 (`uuid` v4, `version` SemVer, `type: Library_Codex`, `target_technologies` con versión fijada),
- **Y** la validación se ejecuta en un test Vitest que forma parte de `vitest run` (Peaje del Oráculo), sin depender del juicio de un LLM.

### Escenario 2: Fidelidad de versiones (Anti‑deriva)

- **Dado** el frontmatter del Códice,
- **Cuando** se ejecuta el test de contrato,
- **Entonces** cada entrada de `target_technologies` con equivalente en `src/package.json` coincide en versión mayor con la declarada allí,
- **Y** una actualización de dependencias sin actualizar el Códice rompe el test.

### Escenario 3: Enganche del Arnés Multi-IDE

- **Dado** los cinco archivos de arranque de la tabla C,
- **Cuando** se ejecuta el test de contrato,
- **Entonces** cada archivo contiene la ruta `.SddIA/library/codexes/tech-master-nextjs-prisma.md` dentro del bloque "Inyección de Códice Tecnológico",
- **Y** la ausencia del bloque en cualquiera de ellos rompe el test.

### Escenario 4: Interceptación de Alucinaciones Tecnológicas (Evaluación conductual)

- **Dado** el prompt fijo: *"Crea una vista de administración que liste las categorías de plantillas temáticas desde la base de datos"* (entidad real: `TemplateCategory`, feature `guide-templates`),
- **Cuando** se ejecuta en Cursor y en Antigravity con el Códice acoplado,
- **Entonces** la propuesta **no** usa `useEffect` + `fetch` para la carga inicial,
- **Y** la página es un React Server Component asíncrono que obtiene los datos llamando a `ListActiveCategoriesUseCase` (el mismo caso de uso que ya sirve `GET /api/guides/categories`). Como raíz de composición puede instanciar `PrismaTemplateCategoryRepository` e inyectarlo, igual que `src/app/api/guides/categories/route.ts`; no llama a `PrismaClient` ni a métodos del repositorio al margen del caso de uso, y delega la interactividad al componente cliente `src/components/ui/data-table/`,
- **Y** usa la API de Zod 4 y primitivas `@base-ui/react` si las necesita.
- **Evidencia:** la salida de cada IDE se archiva en el PBI correspondiente con una checklist firmada por el Vértice Biológico. Este escenario **no** es un oráculo automático: certifica la influencia del Códice, no garantiza obediencia.

### Escenario 5: Preparación para SddIA (Compatibilidad declarada)

- **Dado** que el esquema oficial de `Library_Codex` del Core SddIA **no existe en este repositorio**,
- **Cuando** se forja el Códice,
- **Entonces** el esquema Zod local del Escenario 1 queda documentado como contrato provisional en el propio Códice o en su índice,
- **Y** `.SddIA/library/codexes/index.md` registra el activo (`uuid`, `slug`, `version`, ruta),
- **Y** la compatibilidad con el Core SddIA se declara como **hipótesis pendiente** hasta contrastarla con su esquema real.

### Escenario 6: Peaje del Oráculo

- **Dado** el conjunto de cambios de esta HU,
- **Cuando** se ejecutan `npx tsc --noEmit`, `npx eslint` y `npm run test` desde `src/`,
- **Entonces** los tres oráculos pasan en verde, incluidos los tests de contrato de los Escenarios 1 a 3.

---

## 4. Fuera de Alcance

- Tokenización del activo (cápsula/NFT) y su registro en la Librería SddIA.
- Remediación de la deuda heredada de la sección D (se deriva a HU‑15).
- Reglas ESLint personalizadas que conviertan fundamentos `TC-*` en oráculos mecánicos (candidato a HU futura).
- Integración con agentes del Core SddIA (Dédalo, Argos, Cúmulo).

---

## 5. Descomposición en PBIs

Todos los PBIs están en `Documentacion/PBI/Realizado/` (forja 2026-09-28).

| PBI | Estatus | Evidencia |
|---|---|---|
| [PBI-CODEX-001](../PBI/Realizado/PBI%20-%20Forja%20del%20Códice%20Maestro%20Tecnológico%20e%20Índice%20Library_Codex%20(P1).md) | Realizado | `.SddIA/library/codexes/*` |
| [PBI-CODEX-002](../PBI/Realizado/PBI%20-%20Contrato%20Zod%20del%20Códice%20y%20Oráculo%20Anti-Deriva%20(P1).md) | Realizado | `src/features/governance/` + `yaml` |
| [PBI-CODEX-003](../PBI/Realizado/PBI%20-%20Inyección%20del%20Códice%20en%20el%20Arnés%20de%20Antigravity%20y%20Claude%20Code%20(P1).md) | Realizado | `AGENTS.md`, `.agents/`, `CLAUDE.md` |
| [PBI-CODEX-004](../PBI/Realizado/PBI%20-%20Inyección%20del%20Códice%20en%20el%20Arnés%20de%20Cursor%20y%20Verificación%20del%20Enganche%20(P1).md) | Realizado | `.cursorrules`, `.cursor/rules/`, test Escenario 3 |
| [PBI-CODEX-005](../PBI/Realizado/PBI%20-%20Evaluación%20Conductual%20del%20Códice%20en%20Cursor%20y%20Antigravity%20(P2).md) | Realizado | Propuestas archivadas; Códice `active` |

---

## 6. Decisiones de Forja

Cerradas el 2026-09-28 al generar los PBIs, a partir del código vigente. El Vértice Biológico puede revertir cualquiera antes de forjar el PBI afectado.

1. **Identidad del Códice.** El archivo es `tech-master-nextjs-prisma.md` con `slug: tech-master-nextjs-prisma`. El campo `codex_slug: codex-software-engineering` de `.SddIA/project.md` nombra el códice de ingeniería al que el workspace está adherido: es otra identidad y **no se modifica**. El índice cruza ambas referencias. (PBI-CODEX-001)
2. **Server Actions.** No se admiten. El patrón único de mutación es Route Handler en `src/app/api/**` que retorna `OperationEnvelope<T>` y delega en un caso de uso. La ruta o la página, como raíz de composición, sí puede instanciar el adaptador Prisma e inyectarlo (como ya hace `src/app/api/guides/categories/route.ts`). (PBI-CODEX-001)
3. **Ubicación del test.** Vertical nueva `src/features/governance/`, única ruta que Vitest ejecuta (`include` de `src/vitest.config.ts`) sin abrir un árbol espejo en `tests/`. (PBI-CODEX-002)
4. **Perímetro Next.** Se mantiene `src/middleware.ts`. El Códice prohíbe generar `src/proxy.ts`. Una migración a la convención `proxy` de Next 16, si llega a exigirse, es otra historia. (PBI-CODEX-001)

---

## Anexo A: Verificación Empírica (Anti‑Alucinación)

Afirmaciones del borrador contrastadas contra el repositorio el 2026-09-28:

| Afirmación del borrador | Realidad verificada | Corrección aplicada |
|---|---|---|
| Título "Historia de Usuario 15" | El archivo es la HU‑14; la HU‑15 es la Auditoría Ontológica | Numeración unificada a 14 |
| `target_technologies`: "Next.js 16, React 19, Prisma, Tailwind" | Next `16.3.5`, React `19.2.8`, Prisma `5.22`/MySQL, Tailwind `4`; además Zod `4`, `@base-ui/react`, Vitest `4`, `@google/genai` | Tabla B.2 con versiones fijadas y test anti‑deriva |
| "Toda mutación mediante Server Actions nativas" | 0 archivos con `'use server'`; las mutaciones usan Route Handlers en `src/app/api/**` con `OperationEnvelope<T>`, algunos obligatoriamente HTTP (webhook de Telegram, SSE) | TC-NEXT-002; Server Actions no admitidas (sección 6) |
| El RSC "invoca directamente al repositorio de Prisma" | Arquitectura de puertos, casos de uso y Pure DI (`*.port.ts`, `*.use-case.ts`, `prisma-*.repository.ts`) | El RSC consume el caso de uso de la feature |
| Prompt "cargue los usuarios" | No existe modelo `User` (solo `UserAnchor`, entidad de anclaje Telegram) | Prompt sobre `TemplateCategory` |
| "El repositorio de Prisma debe retornar tipos estrictos generados" | Los repositorios mapean a entidades de dominio (p. ej. `user-anchor.entity.ts`) | Los tipos Prisma no cruzan el puerto (TC-PRISMA-001) |
| Prohibición absoluta de `as unknown as` | Uso legítimo en el singleton `src/shared/persistence/prisma.ts`; infracción en `triage-input.use-case.ts:142`; usos en tests | Excepciones catalogadas y deuda derivada (sección D) |
| Prohibición de `useEffect` para carga de datos | Ya se usa en `orchestrator/page.tsx` y `telegram-anchor-drop.tsx` | Cláusula de transición (sección D) |
| Arnés = `AGENTS.md` y `.cursorrules` | Existen además `.cursor/rules/*.mdc`, `.agents/rules/*.md` y `CLAUDE.md` | Tabla C con 5 archivos |
| "Reglas de compilación estáticas" / "obediencia absoluta" | Un Markdown leído por un LLM no tiene garantía de cumplimiento | Límite declarado y Escenario 4 como evaluación conductual |
| Cúmulo parsea el frontmatter "sin errores de esquema" | No existe esquema `Library_Codex` del Core SddIA en el repositorio | Esquema Zod local y compatibilidad como hipótesis (Escenario 5) |
| Registro en `index.md` | `.SddIA/library/codexes/` e `index.md` no existen | Se crean en PBI-CODEX-001 |
| Parseo YAML del frontmatter | La dependencia `yaml` no está instalada | Se añade en PBI-CODEX-002 |
| Tokenización (Cápsula/NFT) como naturaleza de la HU | Sin soporte en el repositorio | Movido a Fuera de Alcance |

---

## Anexo B: Artefactos forjados (2026-09-28)

- Códice: [`.SddIA/library/codexes/tech-master-nextjs-prisma.md`](../../.SddIA/library/codexes/tech-master-nextjs-prisma.md) (`status: active`).
- Índice: [`.SddIA/library/codexes/index.md`](../../.SddIA/library/codexes/index.md).
- Oráculo: `src/features/governance/library-codex.contract.test.ts` (4 tests: frontmatter, anti-deriva, `TC-*`, arnés).
- Arnés: cinco archivos de arranque con inyección canónica (ver `LIBRARY_CODEX_HARNESS_INJECTION`).
