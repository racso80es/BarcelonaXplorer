# [INFRAESTRUCTURA] Auditoría de Aplicación: HU-16 IA Gateway (Aduana Universal) y Fallo de Arranque Local

**Identificador:** AUD-INFRA-GW-001
**Historia auditada:** [`HU-16 — Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor`](../HistoriasDeUsuario_Historico/Historia%20de%20Usuario%2016%3A%20Microservicio%20IA%20Gateway%20%28Aduana%20Universal%29%20y%20Enrutamiento%20Multi-Modal.md) · PBI-GW-001 a PBI-GW-009 (commits `a1f3950` … `1cdc1fa`)
**Fecha de ejecución:** 2026-09-29
**Disparador:** El lanzador local `~/Aplicaciones/BarcelonaXplorer/BX-Arranque Local.sh` falla tras el cierre de la HU-16.
**Auditor:** Claude Fable 5.1 en Cursor (familia distinta a la forjadora de PBI-GW-008, `Forged-by: Google Gemini 3.8 Flash`; cumple la cláusula de auditoría cruzada de PBI-STEEL-020)
**Marco normativo:** [`CONSTITUTION.md`](../../CONSTITUTION.md) · [Axiomas S+](../../.SddIA/library/norms/) · [Códice `tech-master-nextjs-prisma`](../../.SddIA/library/codexes/tech-master-nextjs-prisma.md) · [`ADR-001`](../ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md)
**Dictamen:** 🟢 **RECUPERADO** — 7 hallazgos corregidos en sesión (F-01 a F-07), 13 hallazgos abiertos derivados a [`HU-KAIZEN-003`](../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md).

---

## 1. Resumen ejecutivo

La HU-16 está implementada de forma completa en cuanto a código: los dos endpoints del gateway, el cliente `IaGatewayClient` en `src/features/ai-engine/ia-gateway/`, la telemetría bajo `LLM_ENGINE`, el servicio Compose y el pipeline Ansistrano existen y los tres oráculos estáticos están en verde. Sin embargo, **la aplicación no arrancaba** ni en desarrollo (`next dev`) ni en producción (`next build`): todas las páginas devolvían HTTP 500.

La causa raíz es un efecto colateral de IaaC no cubierto por ningún oráculo: PBI-GW-008 introdujo el enlace simbólico versionado `src/ia-gateway -> ../ia-gateway` para que `build.context: ./ia-gateway` de `src/docker-compose.yml` tenga paridad con el layout de Ansistrano (`ansistrano_shared_paths: [ia-gateway]`). La autodetección de fuentes de Tailwind 4 sigue enlaces simbólicos y registra la ruta real como dependencia de directorio; Turbopack rechaza cualquier ruta que salga de la raíz del proyecto (`FileSystemPath("").join("../ia-gateway") leaves the filesystem root`) y aborta el procesamiento de `app/globals.css`.

Segunda constatación: la migración Big-Bang (PBI-GW-009) convirtió al gateway en dependencia dura del monolito, pero ni `.env.local` ni `.env.production` contenían ninguna variable de la HU-16 y el lanzador local no arrancaba el gateway. Con el símbolo corregido, la aplicación habría arrancado pero toda inferencia habría fallado (URL `http://ia-gateway:3001` irresoluble en el host, secreto vacío) y `deploy.sh` habría abortado en la aduana de `IA_GATEWAY_SECRET`.

Los tres oráculos no detectan nada de esto porque ninguno ejecuta el pipeline CSS de Turbopack ni lee los ficheros de entorno reales. El quinto paso de `scripts/audit-anchor.sh` (E2E con `npm run build`) sí lo habría detectado; no consta que se ejecutase para PBI-GW-008 y en local `reuseExistingServer: true` puede reutilizar un servidor previo.

---

## 2. Línea base de oráculos

Ejecutados antes y después de las correcciones. La columna "antes" demuestra el punto ciego.

| Oráculo | Comando | Antes | Después |
|---|---|---|---|
| Linter AST | `npm run lint` (`eslint --max-warnings 0 src`) | 0 avisos | 0 avisos |
| Compilador (monolito) | `npx tsc --noEmit` (src/) | 0 errores | 0 errores |
| Compilador (gateway) | `npx tsc --noEmit` (ia-gateway/) | 0 errores | 0 errores |
| Tests (monolito) | `npx vitest run` (src/) | 91 ficheros / 489 tests | 91 / 489 |
| Tests (gateway) | `npx vitest run` (ia-gateway/) | 8 / 34 (16 / 68 con `dist/` presente, ver F-07) | 8 / 34 |
| **Empaquetado dev** | `next dev` + `GET /` | **HTTP 500 `TurbopackInternalError`** | HTTP 200 |
| **Empaquetado producción** | `npx next build` | **`Build error occurred` (mismo panic)** | Éxito, 22 rutas |
| Compose | `docker compose --env-file .env.production config --quiet` | OK | OK |
| Cadena E2E real | `GET /api/ai/test` → gateway → Groq | No alcanzable | `{"ok":true,"text":"Barcelona es una vibrante ciudad…"}` en 0,88 s |

---

## 3. Evidencia forense

### 3.1 Panic de Turbopack (idéntico en `next dev` y `next build`)

```text
TurbopackInternalError: Failed to write app endpoint /page
Caused by:
- [project]/app/globals.css [app-client] (css)
- FileSystemPath("").join("../ia-gateway") leaves the filesystem root
Debug info:
- Execution of PostCssTransformedAsset::process failed
- Execution of evaluate_webpack_loader failed
```

### 3.2 Origen del symlink

```text
$ git ls-files -s src/ia-gateway
120000 4c90fa42… 0	src/ia-gateway          # modo 120000 = enlace simbólico versionado
$ ls -la src/ia-gateway
lrwxrwxrwx 1 racso racso 13 sep 29 16:13 ia-gateway -> ../ia-gateway
```

Introducido en `f58068f` (PBI-GW-008) junto con `"exclude": [..., "ia-gateway"]` en `src/tsconfig.json` y `'ia-gateway/**'` en `src/vitest.config.ts`: el autor previó el impacto sobre `tsc` y Vitest, pero no sobre el escáner de Tailwind, que no lee ninguna de esas dos exclusiones.

### 3.3 Ficheros de entorno reales (secretos no reproducidos)

| Variable HU-16 | `.env.example` | `.env.local` (antes) | `.env.production` (antes) |
|---|---|---|---|
| `IA_GATEWAY_URL` | documentada | ausente | ausente |
| `IA_GATEWAY_SECRET` | documentada | ausente | ausente → `deploy.sh` aborta |
| `DEFAULT_FAST_LLM` / `DEFAULT_REASONING_LLM` | documentadas | ausentes | ausentes (defaults del código) |
| `GEMINI_REASONING_MODEL` | **no documentada** (el gateway la lee en `ia-gateway/src/index.ts:31`) | ausente | ausente |

### 3.4 Lanzador local previo

El script original solo arrancaba `bx-mysql-dev` y `npm run dev`. Además, una instancia `next dev` previa (PID 62026, iniciada 16:24) hacía abortar cualquier relanzamiento con `⨯ Another next dev server is already running`.

---

## 4. Escala de severidad

| Nivel | Criterio |
|---|---|
| P0 | Bloquea el arranque o el despliegue del producto |
| P1 | Fallo funcional, de contrato o de seguridad latente con evidencia; regresión de un PBI cerrado |
| P2 | Deuda de diseño, observabilidad o pipeline sin impacto inmediato |
| P3 | Higiene, documentación o trazabilidad |

---

## 5. Hallazgos corregidos en esta sesión

### F-01 · P0 · IaaC / Empaquetado — Symlink `src/ia-gateway` rompe el pipeline CSS de Turbopack

- **Archivos:** `src/ia-gateway` (symlink), `src/app/globals.css`
- **Evidencia:** secciones 3.1 y 3.2. Reproducido en frío con `next dev` (500 en todas las rutas) y `next build` (abort).
- **Corrección aplicada (Axioma III):** autodetección desactivada y fuentes declaradas explícitamente en `src/app/globals.css`:

```css
@import "tailwindcss" source(none);
@source "../app";
@source "../components";
@source "../features";
@source "../lib";
@source "../shared";
```

  Nota de implementación: `@source` se resuelve relativo a la hoja de estilos (`src/app/`), no a la raíz del proyecto. Un primer intento con `@source not "./ia-gateway"` no funcionó en arranque en frío: la negación filtra candidatos pero el walker sigue registrando la ruta real del symlink.
- **Verificación:** CSS resultante byte‑idéntico al original (100 392 B, mismas utilidades `.flex .grid .rounded-md .bg-background .bg-card .text-muted-foreground`); `next dev` y `next build` limpios.
- **Alternativas descartadas:** `turbopack.root` en la raíz del repositorio (alteraría la estructura de `.next/standalone` y rompería `CMD ["node","server.js"]` del Dockerfile); mover el gateway dentro de `src/` (contradice D-1 de la HU-16 y la imagen `web` arrastraría el microservicio); retirar el symlink y usar `context: ../ia-gateway` (rompe el layout de releases de Ansistrano).

### F-02 · P1 · Configuración — Variables HU-16 ausentes en los ficheros de entorno reales

- **Evidencia:** sección 3.3.
- **Impacto:** en local, `IaGatewayClient` apunta a `http://ia-gateway:3001` (irresoluble en el host) con secreto `''`; en producción `deploy.sh` aborta y, si no lo hiciera, `web` recibiría `IA_GATEWAY_SECRET=` vacío.
- **Corrección aplicada:** bloque HU-16 añadido a `.env.local` (URL `http://127.0.0.1:3001`) y `.env.production` (URL `http://ia-gateway:3001`) con secretos distintos de 64 hex generados con `openssl rand -hex 32`, `GEMINI_REASONING_MODEL`, `DEFAULT_FAST_LLM` y `DEFAULT_REASONING_LLM` alineados con los modelos ya declarados en cada fichero (`gemini-3.5-flash`, `qwen/qwen3.8-27b`). Ambos ficheros están fuera de git; el secreto de producción es nuevo y entra en vigor en el próximo despliegue.

### F-03 · P1 · Operación local — El lanzador no arranca el gateway tras la migración Big-Bang

- **Archivo:** `~/Aplicaciones/BarcelonaXplorer/BX-Arranque Local.sh` (fuera del repositorio; ver F-17)
- **Corrección aplicada:** el script compila el gateway (`npm run build`), lo arranca con `node --env-file=src/.env.local dist/index.js` en `127.0.0.1:3001`, espera `GET /healthz`, detiene instancias `next dev` previas del mismo directorio y limpia el gateway al salir (`trap`). Aduana previa: exige `IA_GATEWAY_URL` e `IA_GATEWAY_SECRET` en `.env.local`.

### F-04 · P2 · Gateway — Script `dev` referencia una dependencia inexistente

- **Archivo:** `ia-gateway/package.json`
- **Evidencia:** `"dev": "node --watch --loader ts-node/esm src/index.ts"`; `ts-node` no figura en `devDependencies` ni en `node_modules/.bin`.
- **Corrección aplicada:** `"dev": "tsc && node --watch dist/index.js"`.

### F-05 · P2 · IaaC — La imagen `web` arrastraría el symlink colgante

- **Archivo:** `src/.dockerignore`
- **Evidencia:** `COPY . .` en `src/Dockerfile` copia el enlace; dentro del contexto de build `../ia-gateway` no existe y el enlace queda colgante durante `npm run build` en la fase `builder`.
- **Corrección aplicada:** entrada `ia-gateway` en `.dockerignore`. El microservicio se compila exclusivamente en su propia imagen.

### F-06 · P3 · Documentación — `GEMINI_REASONING_MODEL` sin documentar

- **Corrección aplicada:** documentada en `src/.env.example` junto con la aclaración de que `GROQ_FAST_MODEL` también gobierna el modelo Groq del gateway y con la URL local del gateway.

### F-07 · P3 · Oráculo — Vitest del gateway ejecutaba los tests compilados de `dist/`

- **Evidencia:** tras `npm run build`, `npx vitest run` reporta 16 ficheros / 68 tests (los 8 de `src/` más sus copias `.test.js` en `dist/`).
- **Corrección aplicada:** `ia-gateway/vitest.config.ts` con `include: ['src/**/*.test.ts']` y `exclude: [..., 'dist/**']`.

---

## 6. Hallazgos abiertos (derivados a HU-KAIZEN-003)

**Nota de gobernanza (2026-09-29):** El Vértice Biológico confirmó las decisiones D-1 a D-3 de [HU-KAIZEN-003](../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) §7 conforme a las recomendaciones de esta auditoría: **fail‑fast** ante anclaje incoherente (F-09 → PBI-GW-012), **ficheros de entorno separados** por servicio (F-11 → PBI-GW-014) y **matrices de modelos en variables de entorno** `GEMINI_MODELS` / `GROQ_MODELS` (F-08 → PBI-GW-010).

### F-08 · P1 · Regresión funcional — Pérdida del fallback multi‑modelo de Gemini

- **Archivos:** `ia-gateway/src/index.ts:29-32`, `ia-gateway/src/endpoints/llm/gemini.adapter.ts`
- **Evidencia:** el `GeminiClient` retirado en PBI-GW-009 iteraba la lista `GEMINI_MODELS` (`gemini-3.5-flash,gemini-3-flash-preview,gemini-3.6-flash` en producción) como cadena de degradación. El gateway acepta un único `GEMINI_REASONING_MODEL` por proveedor; `GEMINI_MODELS` sigue en los ficheros de entorno pero ya nadie la lee. Ante un 404/503 del modelo (evidencia histórica en AUD-OPS-STEEL-001, F-02: 6 eventos *high demand*), el gateway salta directamente a otro proveedor en lugar de a otro modelo del mismo proveedor.
- **Corrección propuesta:** matriz declarativa por proveedor (`GEMINI_MODELS`, `GROQ_MODELS`) recorrida antes de conmutar de proveedor; telemetría con el modelo efectivo (ya existe `modelId`).

### F-09 · P2 · Contrato de diseño — La restricción de anclaje solo emite un aviso

- **Archivo:** `ia-gateway/src/endpoints/llm/fallback.config.ts:41-54`
- **Evidencia:** la HU-16 §2.4 declara como *restricción de diseño* que el anclaje pertenezca a un proveedor distinto del principal de su matriz; `resolveFallbackConfig` solo hace `console.warn`.
- **Corrección propuesta:** fail‑fast en el arranque (`process.exit(1)` con sobre de error) o, como mínimo, estado `DEGRADED_CONFIG` visible en `/healthz`.

### F-10 · P2 · Seguridad — Secreto por defecto en el gateway (patrón Fail-Open)

- **Archivo:** `ia-gateway/src/index.ts:12`
- **Evidencia:** `process.env.IA_GATEWAY_SECRET ?? 'development-secret-key-change-in-prod'`. Es el mismo patrón que el hallazgo F-01 de AUD-OPS-STEEL-001 (patrulla Telegram). Mitigado hoy porque `deploy.sh` exige ≥ 32 caracteres y Compose inyecta la variable; pero un contenedor arrancado fuera de ese pipeline aceptaría un literal público del repositorio. `validateGatewayAuth` sí rechaza el secreto vacío.
- **Corrección propuesta:** sin `IA_GATEWAY_SECRET` (o con menos de 32 caracteres) el gateway no arranca; test de arranque sin secreto.

### F-11 · P2 · Custodia de secretos — `web` sigue recibiendo todas las claves de proveedor

- **Archivo:** `src/docker-compose.yml:25` (`env_file: .env.production` en `web`)
- **Evidencia:** la HU-16 §2.1 afirma que al cerrar la migración `web` deja de necesitar `GEMINI_API_KEY`, `GROQ_API_KEY` y `JEV_API_KEY`. `web` sigue necesitando `GEMINI_API_KEY` para embeddings (fuera de alcance por §2.5), pero `GROQ_API_KEY` y `JEV_API_KEY` ya no tienen consumidor en el monolito y aun así se inyectan.
- **Corrección propuesta:** ficheros de entorno separados por servicio (`web.env`, `ia-gateway.env`) o lista `environment` explícita para `web`; actualizar la HU-16 §2.1 para reflejar la excepción de embeddings.

### F-12 · P2 · Observabilidad IaaC — El Oráculo de Salud post‑despliegue ignora al gateway

- **Archivo:** `ansible/hooks/after_symlink.yml:163-180`
- **Evidencia:** el sondeo `uri` solo comprueba `http://127.0.0.1:8080/api/telemetry/log`, que no atraviesa el gateway. Un gateway caído o mal configurado no revierte el despliegue; el usuario final recibiría los mensajes Fail‑Soft y nadie lo sabría hasta revisar `/Admin/Logs`.
- **Corrección propuesta:** segunda sonda que exija `docker inspect --format '{{.State.Health.Status}}' barcelonaxplorer_ia_gateway == healthy` y una ruta del monolito que ejecute `evaluateHealth()` del cliente (`/Admin/System` ya lo hace en UI; falta la versión sin sesión para Ansible).

### F-13 · P2 · Pipeline de oráculos — El gateway y el empaquetado están fuera de `audit-anchor.sh` y CI

- **Archivos:** `scripts/audit-anchor.sh`, `.github/workflows/ci.yml`
- **Evidencia:** los cinco pasos de `audit-anchor.sh` operan solo en `src/`; ningún paso ejecuta `tsc`/`vitest` de `ia-gateway/`. `npm run build` solo ocurre implícitamente dentro del `webServer` de Playwright y, en local, `reuseExistingServer: !process.env.CI` puede reutilizar un servidor anterior y no compilar nada. Este es el punto ciego por el que F-01 llegó a `main` con "oráculos en verde".
- **Corrección propuesta:** paso explícito `npx next build` (o `docker compose build web ia-gateway`) antes del E2E; pasos `6/7` para el gateway; `reuseExistingServer: false` cuando se ejecuta desde `audit-anchor.sh`.

### F-14 · P3 · Imagen — `dist/` del gateway incluye los tests compilados

- **Evidencia:** `ia-gateway/tsconfig.json` incluye `src/**/*`; el Dockerfile copia `dist/` completo (8 ficheros `*.test.js`).
- **Corrección propuesta:** `tsconfig.build.json` que excluya `**/*.test.ts`, usado por `npm run build`; `tsc --noEmit` sigue verificando los tests.

### F-15 · P3 · Higiene del repositorio — Next 16 genera `src/AGENTS.md` y `src/CLAUDE.md`

- **Evidencia:** `✓ Generated AGENTS.md and CLAUDE.md for AI agents` en cada `next dev`; ambos aparecen sin trackear y compiten con los canónicos de la raíz.
- **Corrección propuesta:** `agentRules: false` en `src/next.config.ts` y borrado de los dos ficheros.

### F-16 · P3 · Deprecación — Convención `middleware` obsoleta en Next 16

- **Evidencia:** `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` en cada arranque.
- **Trato:** TC-NEXT-004 declara `src/middleware.ts` como perímetro canónico y la migración a `proxy` como historia futura. Se registra sin acción; cualquier migración exige enmienda previa del Códice.

### F-17 · P3 · Localidad (Axioma I) — El lanzador local vive fuera del repositorio

- **Evidencia:** `~/Aplicaciones/BarcelonaXplorer/BX-Arranque Local.sh` no está versionado; su lógica (arranque del gateway, aduana de variables, limpieza) es conocimiento operativo del proyecto.
- **Corrección propuesta:** `scripts/dev-up.sh` versionado con la lógica completa; el fichero de `~/Aplicaciones` queda como envoltorio de una línea.

### F-18 · P3 · Axioma II — Casts residuales en `evaluateChoice`

- **Archivo:** `src/features/ai-engine/ia-gateway/ia-gateway.client.ts:235-237`
- **Evidencia:** `envelope.result.selectedChoice as T` y `probabilities as Record<T, number>`. El esquema Zod no conoce el genérico `T`, así que el cast es la única vía hoy.
- **Corrección propuesta:** verificar en runtime que `selectedChoice ∈ choices` y que las claves de `probabilities` coinciden con `choices` antes de devolver; lanzar error tipado en caso contrario.

### F-19 · P3 · Oráculo — Aviso de Vite sobre el cargador de configuración

- **Evidencia:** `Your Vite config uses features that are unsupported by configLoader: 'native'` en cada `vitest run` de `src/`.
- **Corrección propuesta:** renombrar `src/vitest.config.ts` a `.mts` o fijar `configLoader` de forma explícita.

### F-20 · P3 · Documental — Trazabilidad del cierre de PBI-GW-008 y del Códice

- **Evidencia:** PBI-GW-008 §3 declara "0 errores en `src/` e `ia-gateway/`" y `docker compose config --quiet`, pero no `npm run build` ni arranque. La DoD de la HU-16 no incluye ningún criterio de arranque local ni de empaquetado. El Códice (TC-UI-001) no fija la política de fuentes de Tailwind ni la prohibición de enlaces simbólicos bajo `src/`.
- **Corrección propuesta:** anotar en PBI-GW-008 y HU-16 la referencia a esta auditoría; enmienda del Códice (ver HU-KAIZEN-003, PBI de gobernanza).

---

## 7. Cambios aplicados en esta sesión (working tree, sin commit)

| Archivo | Hallazgo | Naturaleza |
|---|---|---|
| `src/app/globals.css` | F-01 | `source(none)` + `@source` explícitos con comentario de motivación |
| `src/.dockerignore` | F-05 | Excluye `ia-gateway` |
| `ia-gateway/package.json` | F-04 | Script `dev` operativo |
| `ia-gateway/vitest.config.ts` (nuevo) | F-07 | Excluye `dist/` |
| `src/.env.example` | F-06 | `GEMINI_REASONING_MODEL`, URL local, aclaraciones |
| `src/.env.local`, `src/.env.production` (fuera de git) | F-02 | Bloque HU-16 con secretos nuevos |
| `~/Aplicaciones/BarcelonaXplorer/BX-Arranque Local.sh` (fuera de git) | F-03 | Arranque compuesto monolito + gateway |

---

## 8. Lecciones para el Protocolo de Acero

1. **La Santa Trinidad no ve el empaquetador.** Es la segunda vez (tras AUD-ARCH-BARREL-001) que `tsc` + `eslint` + `vitest` están en verde y la aplicación no arranca. El empaquetado (`next build`) debe ser un oráculo de primer orden, no un efecto secundario del E2E.
2. **Toda exclusión de IaaC debe enumerar a todos sus lectores.** El autor de PBI-GW-008 excluyó el symlink de `tsc` y Vitest; faltó el escáner de Tailwind. Un enlace simbólico bajo `src/` tiene al menos cuatro lectores (tsc, Vitest, Tailwind, Docker build context).
3. **Una migración Big-Bang exige verificar el entorno real, no solo el ejemplo.** `.env.example` estaba documentado y la DoD lo marcaba como cumplido; los ficheros que arrancan la aplicación no.
4. **Los valores por defecto de secretos son deuda de seguridad aunque estén mitigados.** F-10 repite el patrón de F-01 de AUD-OPS-STEEL-001; conviene una regla ESLint o un test de contrato que prohíba `?? '<literal>'` sobre variables `*_SECRET`.
