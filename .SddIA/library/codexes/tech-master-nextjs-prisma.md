---
# Axioma III: metadata procesable por máquinas (Library_Codex)
uuid: "227512a2-b980-4d90-8c45-2fd81017aabd"
slug: tech-master-nextjs-prisma
version: "1.0.0"
type: Library_Codex
status: active
updated_at: "2026-09-28"
source_of_truth: src/package.json
target_technologies:
  - name: next
    version: "16.3.5"
    package: next
  - name: react
    version: "19.2.8"
    package: react
  - name: react-dom
    version: "19.2.8"
    package: react-dom
  - name: typescript
    version: "5"
    package: typescript
  - name: prisma
    version: "5.22.0"
    package: prisma
  - name: prisma-client
    version: "5.22.0"
    package: "@prisma/client"
  - name: zod
    version: "4.6.5"
    package: zod
  - name: tailwindcss
    version: "4"
    package: tailwindcss
  - name: base-ui
    version: "1.8.0"
    package: "@base-ui/react"
  - name: vitest
    version: "4.1.11"
    package: vitest
  - name: playwright
    version: "1.63.0"
    package: "@playwright/test"
  - name: google-genai
    version: "2.23.0"
    package: "@google/genai"
  - name: groq-sdk
    version: "1.6.0"
    package: groq-sdk
  - name: lancedb
    version: "0.37.1"
    package: "@lancedb/lancedb"
---

# Códice Maestro Tecnológico — Next.js, React, Prisma (BarcelonaXplorer)

## Jerarquía normativa

1. [`CONSTITUTION.md`](../../../CONSTITUTION.md)
2. [`.SddIA/library/norms/`](../norms/) — axiomas agnósticos de tecnología (incluye la prohibición de `any` en el **Axioma II**)
3. Este Códice — concreción del stack instalado en BX

Ante conflicto prevalece el nivel superior. Este documento no redefine los axiomas; los referencia y los aplica al stack.

---

### TC-NEXT-001 — Carga inicial de datos en servidor

- **Sentencia:** En código nuevo, la carga inicial de datos disponibles en el servidor se realiza en un React Server Component asíncrono. Prohibido `useEffect` + `fetch` para esa carga.
- **Excepción:** Datos que solo existen en el navegador (APIs del cliente, suscripciones en tiempo real).
- **Cumplimiento:** revisión
- **Anclaje:** `src/components.json` (`rsc: true`)

### TC-NEXT-002 — Mutaciones vía Route Handlers

- **Sentencia:** Toda mutación pasa por un Route Handler en `src/app/api/**` que retorna `OperationEnvelope<T>` y delega en un caso de uso. Prohibidas las Server Actions (`'use server'`).
- **Excepción:** Ninguna. Webhooks (Telegram), SSE (`/api/triage`) y telemetría emitida desde error boundaries son HTTP por naturaleza.
- **Cumplimiento:** revisión
- **Anclaje:** `src/shared/operation-envelope.ts`

### TC-NEXT-003 — App Router exclusivo

- **Sentencia:** Solo App Router (`src/app/`). Prohibidos `pages/`, `getServerSideProps` y el uso síncrono de `params`, `cookies()` y `headers()`.
- **Excepción:** Ninguna.
- **Cumplimiento:** revisión
- **Anclaje:** `next@16.3.5`

### TC-NEXT-004 — Perímetro `middleware.ts`

- **Sentencia:** El perímetro de red y auth en el edge es `src/middleware.ts`. Prohibido crear `src/proxy.ts` o un segundo middleware.
- **Excepción:** Una migración futura a la convención `proxy` de Next 16 es otra historia.
- **Cumplimiento:** revisión
- **Anclaje:** `src/middleware.ts`

### TC-NEXT-005 — `'use client'` en la hoja

- **Sentencia:** `'use client'` solo en el componente hoja que necesita interactividad. La página que carga datos sigue siendo un Server Component.
- **Excepción:** El cliente existente `src/components/ui/data-table/`.
- **Cumplimiento:** revisión
- **Anclaje:** `src/components.json`

### TC-PRISMA-001 — Adaptadores y puertos

- **Sentencia:** Prisma solo dentro de adaptadores `prisma-*.repository.ts`, vía el singleton `src/shared/persistence/prisma.ts`, proveedor **MySQL**, API de Prisma 5. El repositorio implementa un puerto y retorna entidades o Value Objects; los tipos generados por Prisma no cruzan el puerto. La página o la ruta, como raíz de composición, puede instanciar el adaptador e inyectarlo (como `src/app/api/guides/categories/route.ts`).
- **Excepción:** Ninguna para instanciar `PrismaClient` fuera del singleton.
- **Cumplimiento:** revisión
- **Anclaje:** `src/shared/persistence/prisma.ts`, `src/prisma/schema.prisma`

### TC-TS-001 — Casts prohibidos en producción

- **Sentencia:** Prohibido `as unknown as T` en código de producción.
- **Excepción:** Catalogada: el patrón `globalThis` del singleton de Prisma. Los dobles de `*.test.ts` pueden castear el mock.
- **Cumplimiento:** revisión
- **Anclaje:** Axioma II (`.SddIA/library/norms/`)

### TC-ZOD-001 — API Zod 4

- **Sentencia:** Validar con la API de Zod 4 instalada (`z.uuid()`, `z.email()`, etc.). No usar formas marcadas `@deprecated` (`z.string().uuid()`, `z.string().email()`).
- **Excepción:** Ninguna.
- **Cumplimiento:** revisión
- **Anclaje:** `zod@4.6.5`

### TC-UI-001 — Base UI y Tailwind 4

- **Sentencia:** UI con `@base-ui/react` y shadcn estilo `base-nova`. Tailwind 4 es CSS-first (`src/app/globals.css`, `@tailwindcss/postcss`). Prohibido generar `tailwind.config.*` e importar `@radix-ui/*`.
- **Excepción:** Ninguna.
- **Cumplimiento:** revisión
- **Anclaje:** `src/components.json`

### TC-UI-002 — Declaración explícita de fuentes Tailwind

- **Sentencia:** Las fuentes de Tailwind se declaran de forma explícita (`@import "tailwindcss" source(none)` más directivas `@source` relativas a la hoja de estilos); se prohíbe la autodetección de fuentes mientras exista bajo `src/` cualquier ruta que salga del proyecto.
- **Excepción:** Ninguna.
- **Cumplimiento:** `npx next build` (oráculo de empaquetado)
- **Anclaje:** `src/app/globals.css`, originado por [`AUD-INFRA-GW-001`](../../Documentacion/Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) (F-01)

### TC-AI-001 — SDKs de inferencia

- **Sentencia:** SDK de Google: `@google/genai`. Prohibido `@google/generative-ai`. Groq: `groq-sdk`.
- **Excepción:** Ninguna.
- **Cumplimiento:** revisión
- **Anclaje:** `src/package.json`

### TC-TEST-001 — Vitest colocalizado y Playwright

- **Sentencia:** Tests de unidad colocalizados (`*.test.ts`) y ejecutados con Vitest. Prohibido Jest y un árbol espejo nuevo en `tests/`. Specs de navegador en `src/playwright-e2e/` con Playwright.
- **Excepción:** Los árboles `tests/e2e` y `tests/integration` ya existentes, excluidos del oráculo por `src/vitest.config.mts`.
- **Cumplimiento:** revisión
- **Anclaje:** `src/vitest.config.mts`

### TC-INFRA-001 — Gobernanza de enlaces simbólicos bajo `src/`

- **Sentencia:** Un enlace simbólico bajo `src/` solo se admite si declara su exclusión en los cuatro lectores — `tsconfig.json` (`exclude`), `vitest.config.mts` (`exclude`), las fuentes Tailwind (no aparece en ningún `@source`) y `src/.dockerignore` — y el PBI que lo introduce incluye la salida de `npx next build` entre sus evidencias.
- **Excepción:** Ninguna.
- **Cumplimiento:** `npx next build` + revisión
- **Anclaje:** `src/ia-gateway`, `src/.dockerignore`, `src/tsconfig.json`, `src/vitest.config.mts`, originado por [`AUD-INFRA-GW-001`](../../Documentacion/Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md)

### TC-INFRA-002 — Sanitización de comillas en variables de entorno Docker

- **Sentencia:** Docker `--env-file` no quita comillas. Todo parser de entorno las recorta antes del `regex` de Zod.
- **Excepción:** Ninguna.
- **Cumplimiento:** revisión
- **Anclaje:** `src/shared/config/...` (`parseAnchorString`), originado por `AUD-OPS-DEPLOY-002` (Fricción 1).

### TC-INFRA-003 — Plantillas Go en Ansible

- **Sentencia:** Toda plantilla Go (`{{. ... }}`) dentro de un YAML de Ansible va dentro de `{% raw %}`.
- **Excepción:** Ninguna.
- **Cumplimiento:** `scripts/check-ansible-go-templates.sh`
- **Anclaje:** `ansible/hooks/after_symlink.yml`, originado por `AUD-OPS-DEPLOY-002` (Fricción 2).

---

## Deuda heredada (no remediada en la forja del Códice)

| Fundamento | Archivo | Trato |
|---|---|---|
| TC-NEXT-001 | `src/components/tactical/telegram-anchor-drop.tsx` | Deuda de HU-15. Si un cambio posterior toca el archivo, el código nuevo cumple TC-NEXT-001. |
