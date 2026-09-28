# [OPERATIVO] Log de Fricción — Auditoría Ontológica de Acero (El Hombre de Acero)

**Identificador:** AUD-OPS-STEEL-001
**Historia de origen:** [`HU-15 — Auditoría Ontológica de Acero y Purga Kaizen`](../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md) · Escenario 1 (Ataque Asimétrico)
**Fecha de ejecución:** 2026-09-28
**Delta auditado:** `v2.0.1-doc-anchor` (`210d415`, 2026-09-26 13:34) `..` `HEAD` (`1c4d1b0`, 2026-09-28 10:20) — 62 commits, 127 ficheros de código/IaaC, +10 949 / −155 líneas
**Auditor:** Claude Opus 5.5 en Cursor, rol de antagonista sistémico (ver hallazgo F-19 sobre la asimetría)
**Marco normativo:** [`CONSTITUTION.md`](../../CONSTITUTION.md) · [Axiomas S+](../../.SddIA/library/norms/) · [`ADR-001`](../ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [Códice `tech-master-nextjs-prisma`](../../.SddIA/library/codexes/tech-master-nextjs-prisma.md)
**Estado:** Log publicado. Purga Kaizen (Escenario 2) **pendiente**. Este documento es la entrada para complementar la HU-15 y derivar PBIs.

---

## 1. Resumen ejecutivo

El cuádruple oráculo está en verde y, aun así, el delta contiene **1 hallazgo P0 activo en producción**, **9 P1** y **11 P2/P3**. Los oráculos no los detectan porque son fallos de lógica, de seguridad perimetral, de contrato o de IaaC, no de sintaxis ni de tipos.

Lo más grave, en orden:

1. **P0 — Ruta de patrulla Telegram abierta en producción (F-01).** `/api/telegram/patrol` acepta el token por defecto `bcn_patrol_secret_default`, escrito en el código, porque en el Nodo 11 no están definidas `PATROL_SECRET_TOKEN` ni `TELEGRAM_BOT_WEBHOOK_SECRET` (verificado en el contenedor). Cualquiera que lea el repositorio puede disparar mensajes Telegram a las 50 sesiones ancladas más recientes y recibe sus `sessionId` y `telegramChatId`.
2. **P1 — Memoria cognitiva y caché semántica funcionando sobre vectores falsos (F-02).** Desde el 2026-09-25 el modelo `text-embedding-004` responde 404 en producción (16 eventos). El adaptador cae en silencio a un vector pseudoaleatorio derivado de un hash y lo persiste en LanceDB.
3. **P1 — La caché semántica sirve el resultado de una sesión a otra (F-03).** La clave es solo el vector del prompt; el resultado cacheado incluye la matriz acumulada y el itinerario de la sesión que lo generó.
4. **P1 — Regresión del PBI‑P0 de barrels (F-07).** El bundle cliente de `/orchestrator` vuelve a contener `new PrismaClient` vía `export *` en `@/features/planner`.
5. **P1 — El rollback automático post‑despliegue no revierte la imagen (F-09).**

Veredicto: el delta **no** puede recibir el estatus "Sabiduría Estratégica Blindada" hasta cerrar F-01 y los P1.

---

## 2. Línea base de oráculos (ejecutada durante la auditoría, desde `src/`)

| Oráculo | Comando | Resultado |
|---|---|---|
| Linter AST | `npx eslint . --max-warnings 0` | Código 0, sin salida |
| Compilador | `npx tsc --noEmit` | Código 0 |
| Tests unitarios | `npx vitest run` | 88 ficheros, 471 tests, todos en verde (22,9 s) |
| E2E | `CI=1 npm run test:e2e` | 5 specs en verde (16,0 s) |

Nota: la HU (Anexo A.2) registra 87 ficheros y 467 tests; la diferencia son los 4 tests del contrato del Códice (`library-codex.contract.test.ts`) añadidos después del refinamiento.

---

## 3. Fuentes de evidencia operativa (sección D de la HU)

Todas las consultas fueron de solo lectura. No se copian secretos: las variables se comprobaron como `SET/UNSET` y la contraseña de `DATABASE_URL` se enmascaró.

| Fuente | Ventana | Resultado relevante |
|---|---|---|
| `docker logs barcelonaxplorer_nginx` (Nodo 11) | Desde el reinicio del contenedor, 2026-09-28 06:41 UTC | 5 líneas de arranque de Next.js; sin errores. El despliegue de hoy borró el histórico del contenedor |
| `docker logs barcelonaxplorer_mysql` | 7 días | Solo 3 avisos de configuración del servidor MySQL (pid-file, `--skip-host-cache`, CA autofirmada) |
| Tabla `TelemetryLog` (MySQL producción) | 2026-09-22 12:52 → 2026-09-28 06:41 (121 filas) | Ver tabla siguiente |
| Entorno del contenedor web | 2026-09-28 10:54 | `PATROL_SECRET_TOKEN=UNSET`, `TELEGRAM_BOT_WEBHOOK_SECRET=UNSET`, `TELEGRAM_WEBHOOK_SECRET=SET`, `CRON_SECRET=SET`; `DATABASE_URL=mysql://bx_admin:***@db:3306/barcelonaxplorer_db` |
| Local | Ejecución de los 4 oráculos y build de Playwright | Chunk cliente `.next/static/chunks/04ff15n2oxfdp.js` (490 KB) referenciado por `/orchestrator` |

Patrones WARN/ERROR en `TelemetryLog` (últimos 7 días, números normalizados):

| Nivel | HTTP | Mensaje (extracto) | N | Último |
|---|---|---|---|---|
| WARN | 500 | `[GeminiEmbeddingAdapter Fail-Soft] Error invocando modelo text-embedding-004: ... 404 ... is not found for API version v1beta` | 16 | 2026-09-27 19:07 |
| WARN | 200 | `[Telegram Bot] Fricción de entrega reportada: Wrong response from the webhook: 404 Not Found` | 8 | 2026-09-24 15:50 |
| ERROR | 500 | `Minified React error #412` en `https://barcelonaxplorer.com/Admin/System` (contexto `CLIENT_UI`) | 7 | 2026-09-23 09:06 |
| ERROR | 503 | `[LLM ERROR] ... This model is currently experiencing high demand` (Gemini) | 6 | 2026-09-27 15:11 |
| ERROR | 503 | `[Jev AI] Sonda de salud fallida: Timeout perimetral excedido (2000ms)` | 6 | 2026-09-26 15:16 |
| ERROR | 500 | `[Jev AI System One] Fallo en inferencia: fetch failed` | 4 | 2026-09-27 15:08 |
| WARN | 500 | `[GeminiEmbeddingAdapter Fail-Soft] ... fetch failed. Activado fallback determinista.` | 3 | 2026-09-27 15:09 |
| ERROR | 401 | `[Telegram Bot] Sonda táctica degradada: Token Inválido / No Configurado` | 2 | 2026-09-26 15:16 |
| WARN | 500 | `[Aduana Jev Fall-Soft] ... Assume-Barcelona-Default: fetch failed` | 1 | 2026-09-27 15:08 |

Los errores React #412 y el 404 del webhook de Telegram son **anteriores al tag** `v2.0.1-doc-anchor` (2026-09-26 13:34). Quedan fuera del delta pero se registran en la sección 7 como deuda observada. Ninguno de los 20 eventos `SECURITY_PERIMETER` más recientes tiene `cacheHit`, es decir, la caché semántica no ha servido ningún acierto en producción.

---

## 4. Escala de severidad

| Nivel | Criterio | Trato según la HU |
|---|---|---|
| P0 | Riesgo de seguridad o de datos **activo en producción** | Corrección inmediata, bloquea el cierre |
| P1 | Fallo funcional, de contrato o de seguridad latente con evidencia; regresión de un PBI cerrado | Corrección dentro de la HU-15 (Escenario 2) |
| P2 | Deuda de diseño, observabilidad o pipeline sin impacto inmediato | Diferible como PBI en `Documentacion/PBI/Pendiente/` |
| P3 | Higiene, documentación o trazabilidad | Diferible como PBI o tarea documental |

---

## 5. Hallazgos

### F-01 · P0 · Seguridad y configuración — Secreto por defecto en la patrulla Telegram

- **Archivo:** `src/app/api/telegram/patrol/route.ts:28-41`, `:63-67`, `:147-152`
- **Evidencia (código):**

```ts
// src/app/api/telegram/patrol/route.ts:28-41
  const secretHeader =
    request.headers.get('x-telegram-patrol-token') ||
    request.headers.get('x-telegram-bot-api-secret-token');

  const configuredSecret =
    process.env.PATROL_SECRET_TOKEN ||
    process.env.TELEGRAM_BOT_WEBHOOK_SECRET ||
    'bcn_patrol_secret_default';

  if (!secretHeader || secretHeader !== configuredSecret) {
    return new NextResponse('Unauthorized: Invalid patrol secret token', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
```

- **Evidencia (producción):** en `barcelonaxplorer_nginx`, `PATROL_SECRET_TOKEN=UNSET` y `TELEGRAM_BOT_WEBHOOK_SECRET=UNSET`. La variable que sí existe se llama `TELEGRAM_WEBHOOK_SECRET` (otro nombre). `src/.env.production` tampoco define ninguna de las dos. Por tanto el secreto efectivo es el literal público del repositorio.
- **Impacto:** un `POST` con `x-telegram-patrol-token: bcn_patrol_secret_default` recorre hasta 50 `userAnchor`, envía drops Telegram reales (lluvia o Cabify) y devuelve en claro `sessionId` y `telegramChatId` de cada usuario (`details`, líneas 124-140). Además la comparación usa `!==` y no la comparación en tiempo constante que la propia base de código exige para `CRON_SECRET`.
- **Por qué no lo vio ningún oráculo:** el test de la ruta fija siempre `process.env.PATROL_SECRET_TOKEN` (`route.test.ts:61-65`) y nunca prueba la ausencia del secreto (ver T-01).
- **Corrección propuesta:** Fail-Closed idéntico a `/api/telemetry/prune`: sin `PATROL_SECRET_TOKEN` configurado, `503`/`401` y telemetría de alerta; eliminar el literal; comparar con `constantTimeEqual`; no devolver `telegramChatId` ni `sessionId` en la respuesta (solo recuentos); añadir `PATROL_SECRET_TOKEN` al control de `src/deploy.sh` (líneas 69-86) y a `.env.example`; test de ausencia del secreto. Tras desplegar, **rotar** el valor (el literal ya es público).

### F-02 · P1 · Evidencia operativa / Fronteras — Embeddings caídos en producción y vectores falsos persistidos

- **Archivo:** `src/features/ai-engine/gemini-embedding.adapter.ts:21-25` (modelo por defecto `text-embedding-004`), `:73-83` (fallback silencioso), `:90-115` (vector por hash)
- **Evidencia (logs):** 16 eventos `WARN 500` entre 2026-09-25 07:46 y 2026-09-27 19:07: `models/text-embedding-004 is not found for API version v1beta, or is not supported for embedContent`.
- **Impacto:** todo vector generado en producción desde el 25‑09 es pseudoaleatorio (LCG sobre un hash del texto). Consecuencias:
  - `persistMemory` (triaje, `triage-input.use-case.ts:438-455`) guarda en LanceDB vectores sin semántica, mezclados con los reales anteriores: la tabla queda contaminada.
  - La caché semántica degenera en caché de coincidencia exacta (dos textos distintos dan vectores casi ortogonales), lo que enmascara F-03 pero no lo elimina.
  - El Fail-Soft oculta la caída: el sistema "funciona" y el Admin no muestra la degradación como incidente.
- **Corrección propuesta:** migrar a un modelo de embeddings vigente de `@google/genai` fijando la dimensionalidad de salida a 768 para no romper las tablas existentes (verificar la dimensión por defecto del modelo elegido antes de migrar); purgar o reindexar las filas generadas con el fallback (marcarlas con `metadata.embeddingSource = 'fallback'` para poder filtrarlas); **no persistir** vectores de fallback en memoria ni en caché; alerta explícita (`ERROR`) cuando el proveedor devuelve 404 de modelo, que no es un fallo transitorio.

### F-03 · P1 · Fronteras de dominio / Seguridad — La caché semántica ignora sesión, matriz e idioma

- **Archivo:** `src/features/triage/triage-input.use-case.ts:135-172`, `:357`, `:564`, `:766-773`; `src/features/cognitive-memory/lancedb-semantic-cache.adapter.ts:76-97`
- **Evidencia:** la búsqueda (`semanticCache.get(promptVector)`) y la escritura (`set(prompt, vector, outcome.toDto(), 850)`) solo usan el prompt. Pero el `TriageOutcome` cacheado depende de `priorPayload` (estado multivuelta de la sesión), de `matrixId` y del idioma, e incluye `payload`, `route` e `itinerary` de la sesión que lo generó. En el acierto solo se sobrescriben `sessionId`, `matrixId`, `durationMs` y `_sys_lang` (líneas 143-149).
- **Escenario de ruptura:** la sesión A acumula "Gràcia, 2 personas, 4 horas" y escribe "hola" (diálogo casual, se cachea con su `partialPayload`). La sesión B escribe "hola" y recibe la matriz de A. Con prompts de despacho ("sí, adelante") B recibe el itinerario de A. El acierto además se salta la persistencia de matriz e itinerario.
- **Agravante (TC-TS-001):** `cached.result as unknown as TriageOutcomeDto` (línea 142), deuda ya catalogada en el Códice.
- **Corrección propuesta:** cachear solo resultados que no dependan del estado de sesión (o incluir en la clave un hash de `matrixId + idioma + payload previo`); nunca cachear `payload`/`itinerary` personales; validar el acierto con `TriageOutcomeSchema.safeParse` en lugar del cast; test con dos `sessionId` distintos (ver T-09).

### F-04 · P1 · Seguridad — Limitador de tasa eludible y endpoint de streaming sin límite

- **Archivo:** `src/app/api/triage/route.ts:51-66`; `src/app/api/orchestrator/stream/route.ts:17-51`
- **Evidencia:** la clave del Token Bucket es `` `${clientIp}:${existingCookie || 'anon'}` ``, y `bx_session_id` la controla el cliente: enviar una cookie aleatoria por petición da un cubo nuevo cada vez. La IP sale de `x-forwarded-for` sin verificar la cadena de proxies. `/api/orchestrator/stream` no tiene limitador, no requiere sesión, acepta `GET ?prompt=` y llama directamente a Gemini (`routeUseCase.execute`, líneas 109-119).
- **Impacto:** amplificación de coste de inferencia y de cuota Gemini (ya saturada: 6 eventos 503 *high demand* en la ventana).
- **Corrección propuesta:** clave del limitador solo por IP de confianza (cabecera fijada por el proxy real del Nodo 11); aplicar el mismo limitador a `/api/orchestrator/stream`; eliminar el `GET` o exigir sesión emitida por el servidor.

### F-05 · P1 · Fugas de contratos (Axioma II) — `any` implícito y `unknown` sin parsear en la cadena triaje → UI

- **Archivos y evidencia:**
  - `src/app/api/triage/route.ts:40-41,97-98` y `src/app/api/orchestrator/stream/route.ts:19-21`: `await req.json()` devuelve `any`; `body?.prompt`, `body?.userLocation`, `body?.matrixId` se consumen sin Zod en la frontera. En triaje el `TriageInputSchema.parse` del caso de uso lanza `ZodError`, que la ruta convierte en **500** con `details` (debería ser 400).
  - `src/app/api/telegram/patrol/route.ts:45-50`: `bodyFilter = rawBody` asigna `any` a un tipo declarado; `fatigueThresholdKm` llega sin validar al VO.
  - `src/features/triage/triage.schema.ts:71-72`: `route: z.unknown()`, `itinerary: z.unknown()` — el contrato público del DTO no describe su carga principal.
  - `src/features/triage/triage-input.use-case.ts:458-486`: `forgedRoute: unknown` y `forgedRoute as TacticalRoute` (dos casts) aunque `GenerateTacticalRouteUseCase.execute` ya devuelve `Promise<TacticalRoute | string>`.
  - `src/app/orchestrator/page.tsx:207,320,635-644`: `triageData` es `any` (`res.json()`), `triageData.itinerary as EnrichedRoute` y `turn.aiResponse as TacticalRoute` sin validación. Si `route` llega vacío, `routeData` cae a `triageData.payload` (línea 378-381), un objeto sin `waypoints`, y el render de la línea 638 lanzaría `TypeError`.
- **Corrección propuesta:** esquema de entrada por ruta (`safeParse` → 400 con `OperationEnvelope`); tipar `route` e `itinerary` en `TriageOutcomeSchema` con `TacticalRouteSchema | z.string()` y `EnrichedRouteSchema`; en la página, `TriageOutcomeSchema.safeParse(await res.json())` antes de usar el resultado.

### F-06 · P1 · Lógica de orquestación — Doble invocación a Gemini cuando la primera claudica

- **Archivo:** `src/app/orchestrator/page.tsx:319-376`; `src/features/triage/triage-input.use-case.ts:474-480`; `src/app/api/orchestrator/stream/route.ts:114-136`
- **Evidencia:** si Gemini devuelve la claudicación (`'No se pudo forjar la ruta.'`, un `string`), el triaje no enriquece y responde `DISPATCH_READY` sin `itinerary`. La página interpreta la ausencia como "usar streaming" y llama a `/api/orchestrator/stream`, que vuelve a llamar a Gemini con el `userPrompt` crudo, **sin** la directiva de idioma, los distritos ni el contexto denso que sí llevaba la primera llamada (`enrichedPrompt`, línea 465).
- **Impacto:** bajo 503/429 (evidencia en logs) se duplica la presión sobre la cuota justo cuando falla, y la segunda ruta ignora el idioma soberano y la matriz de la sesión.
- **Corrección propuesta:** decidir el camino (inline o streaming) en el servidor y declararlo en el DTO (`deliveryMode`); si la ruta claudica, devolver un estado explícito de degradación y no reintentar desde el cliente; si se mantiene el streaming, que reciba la sesión y reutilice el contexto del triaje.

### F-07 · P1 · Localidad / Coherencia ADR — Regresión del PBI‑P0: Prisma en el bundle del navegador

- **Archivo:** `src/features/planner/index.ts:6-25` (`export *` de 20 módulos, incluido `prisma-itinerary.repository`); consumidores cliente `src/app/orchestrator/page.tsx:10` y `src/components/tactical/hybrid-canvas.tsx:20`; regla ESLint `src/eslint.config.mjs:47-50` (solo prohíbe el barrel de `triage`).
- **Evidencia (build):** el chunk `.next/static/chunks/04ff15n2oxfdp.js` (490 KB), referenciado por `server/app/orchestrator/page_client-reference-manifest.js`, contiene `globalThis.prismaItineraryClient??new m1.PrismaClient` y las clases de error de Prisma.
- **Contradicción normativa:** el [PBI‑P0 de barrels](../PBI/Realizado/PBI%20-%20Blindaje%20de%20Frontera%20Cliente-Servidor%20y%20Erradicacion%20de%20Contaminacion%20por%20Barrel%20Files%20%28LanceDB%20fs%29%20%28P0%29.md) prescribe *Named Exports Explícitos* y cero `@prisma/client` en artefactos cliente; `ADR-001` (línea 49) prescribe consumir "exclusivamente los puertos exportados por el barrel `index.ts`". Ninguno de los dos distingue superficie cliente de superficie servidor, y el código actual no cumple ninguno.
- **Corrección propuesta:** separar la superficie pública de `planner` en un barrel de dominio puro (esquemas, entidades, `ChronologicalPropagator`, `consumeOrchestratorStream`) y uno de servidor (casos de uso, adaptadores Prisma, marcado `server-only`); extender la regla `no-restricted-imports` a todos los barrels con adaptadores; enmendar ADR-001 para fijar la norma vigente (ver F-20).

### F-08 · P1 (delta) / P2 (heredado) · TC-PRISMA-001 — `PrismaClient` fuera del singleton

- **Evidencia:** `new PrismaClient()` en `src/app/api/telegram/patrol/route.ts:17-24` (delta), y fuera del delta en `features/planner/prisma-itinerary.repository.ts:16`, `features/auth/prisma-user-anchor.repository.ts:11`, `features/auth/prisma-magic-link-nonce.repository.ts:11`, `features/telemetry/prisma-telemetry.repository.ts:17`. El Códice dice "Excepción: Ninguna para instanciar `PrismaClient` fuera del singleton" y su tabla de deuda heredada **no** cataloga estos cinco puntos.
- **Agravante en la patrulla:** la ruta consulta `prisma.userAnchor.findMany` directamente, saltándose el puerto de `UserAnchor` que ya existe en `features/auth`.
- **Impacto:** hasta 6 pools de conexión por proceso contra MySQL; la regla del Códice no es fiable como guía mientras la deuda no esté catalogada.
- **Corrección propuesta:** P1 para la ruta de patrulla (usar el singleton y el repositorio de anclajes); P2 para migrar los cuatro repositorios al singleton `src/shared/persistence/prisma.ts`, y añadir mientras tanto las cinco entradas a la tabla de deuda del Códice.

### F-09 · P1 · IaaC — El rollback automático post‑despliegue no revierte la imagen

- **Archivo:** `ansible/hooks/after_symlink.yml:13-20` (build) y bloque `rescue` del Oráculo de Salud; `src/docker-compose.yml:12-16` (servicio `web` sin `image:`).
- **Evidencia:** la imagen se construye siempre con el mismo nombre (`barcelonaxplorer-web`, visible en `docker ps` del Nodo 11). El `rescue` conmuta el symlink a la release anterior y ejecuta `docker compose ... up -d --remove-orphans` **sin** `build`, así que levanta de nuevo la imagen recién construida, la defectuosa. `ansible/rollback.yml` sí reconstruye porque reutiliza el hook completo; el rescate automático no.
- **Corrección propuesta:** etiquetar la imagen por release (`image: barcelonaxplorer-web:${RELEASE_ID}`) y revertir a la etiqueta previa, o incluir `build web` en el rescate antes del `up -d`. Añadir al PBI una prueba del rescate en un entorno no productivo.

### F-10 · P2 · Alucinación de diseño — Circuit Breaker sin operación externa que proteger

- **Archivo:** `src/features/planner/affiliate/affiliate-enricher.service.ts:105,156-185`; `circuit-breaker.ts:46-83`; instanciación por petición en `app/api/triage/route.ts:118` y `app/api/orchestrator/stream/route.ts:112`.
- **Evidencia:** la operación protegida es un `map` síncrono en memoria sobre palabras clave; no hay ninguna llamada a TheFork, Civitatis ni otro proveedor. El `AbortSignal` de timeout no se consume. Cada petición crea un `AffiliateEnricherService` con un `CircuitBreaker` nuevo, por lo que el estado `OPEN` nunca sobrevive entre peticiones. El "fallback resiliente" solo es alcanzable inyectando un breaker ya abierto (test CA-3).
- **Impacto:** complejidad sin función y falsa sensación de resiliencia documentada en el PBI‑RESIL‑CIRCUIT‑001.
- **Corrección propuesta:** retirar el breaker hasta que exista una integración real con proveedor, o mantenerlo como singleton de módulo junto a un adaptador HTTP real que respete el `signal`. Si se mantiene, el timeout debe aplicarse con `Promise.race` y no depender de que la operación coopere.

### F-11 · P2 · Alucinación de diseño — El "streaming progresivo" no es progresivo

- **Archivo:** `src/app/api/orchestrator/stream/route.ts:114-166`
- **Evidencia:** la ruta espera la respuesta completa de Gemini (`await routeUseCase.execute`) y después trocea la ruta ya terminada en eventos `stop_emitted`. El primer waypoint llega cuando la generación ha acabado; solo `meta_init` es inmediato.
- **Corrección propuesta:** o bien streaming real (`generateContentStream` con parseo incremental validado), o documentar que el SSE es una entrega por fases y retirar la afirmación de reducción de tiempo al primer waypoint.

### F-12 · P2 · Lógica de negocio — La patrulla asume progreso que nadie ha registrado

- **Archivo:** `src/app/api/telegram/patrol/route.ts:106-114`
- **Evidencia:** "completadas" son todas las paradas menos la última y "siguiente" es la última, sin ningún dato de posición o de progreso del usuario. La fatiga geométrica se calcula sobre el plan, no sobre lo andado, y el caso `isOutdoor` depende de `rainFriendly`, que el enriquecedor fija siempre a `true` (`affiliate-enricher.service.ts:268-271`).
- **Impacto:** drops de Cabify a usuarios que no han empezado la ruta. Combinado con F-01, cualquiera puede provocarlos.
- **Corrección propuesta:** registrar el progreso real (check‑in desde Telegram o la UI) antes de evaluar la fatiga; hasta entonces, desactivar el drop por fatiga.

### F-13 · P2 · Evidencia operativa — Telemetría con valores inventados

- **Archivo:** `src/features/triage/triage-input.use-case.ts:326-331`; `src/features/cognitive-memory/lancedb-semantic-cache.adapter.ts:66,80`; `src/app/Admin/Cognitive/CognitiveKpiCards.tsx:135`
- **Evidencia:** el diálogo casual registra `model: 'groq/qwen3.8-27b'` fijo (el adaptador usa `GROQ_FAST_MODEL`, por defecto `qwen/qwen3.8-27b`), `tokenEstimate: 45` y `tokensSaved: 850` constantes. El KPI del Admin suma esos 850 y, si la suma es 0, muestra un literal `'92%'`.
- **Corrección propuesta:** registrar el modelo real y los tokens reportados por el SDK (`usage`); si no hay dato, omitir el campo y mostrar "sin datos" en el Admin.

### F-14 · P2 · Gobernanza del DOM — Re-render global por pulsación y efectos en actualizadores de estado

- **Archivo:** `src/app/orchestrator/page.tsx`, `src/components/tactical/hybrid-canvas.tsx`
- **Evidencia:**
  - `onChange={(e) => setInputValue(e.target.value)}` (línea 716) re-renderiza la página entera, todos los turnos y `HybridCanvas` en cada tecla; `HybridCanvas` no está envuelto en `memo` y `handleSelectOption`/`handleTimeShift` (líneas 436-485) se recrean en cada render.
  - `setNotification` se llama **dentro** del actualizador de `setActiveItinerary` (líneas 460-484): en React Strict Mode los actualizadores se ejecutan dos veces.
  - `timestamp={new Date()}` en cada bloque (líneas 571, 589, 616, 677): la hora mostrada cambia en cada render.
  - `useState` inicializado leyendo `window.location` (líneas 31-47) en un componente que también se renderiza en servidor: riesgo de desajuste de hidratación.
  - `expandedNodeId` se inicializa con el primer waypoint (hybrid-canvas línea 89-91); en streaming el lienzo se monta con 0 waypoints y ninguna parada queda expandida.
- **Corrección propuesta:** input no controlado (el formulario ya se lee por `FormData`) o estado local aislado; `memo(HybridCanvas)` + `useCallback`; mover la notificación fuera del actualizador; fijar la marca de tiempo al crear el turno; leer `searchParams` en un efecto o desde el Server Component (TC-NEXT-001).

### F-15 · P3 · i18n incompleta en el lienzo y el orquestador

- **Evidencia:** literales en castellano fuera del diccionario en `hybrid-canvas.tsx:192,201,209,286,363,378,436-442,478` y en las chispas y mensajes de `page.tsx:237-244,259-301,409`. Con `lang='en'` la UI mezcla idiomas.
- **Corrección propuesta:** mover los literales a `ui-dictionary.ts` y añadir un test que renderice el lienzo en inglés sin texto en castellano.

### F-16 · P2 · Pipeline de oráculos — Perímetro de los oráculos más estrecho de lo declarado

- **Evidencia:**
  - `scripts/audit-anchor.sh:52` ejecuta `npm run lint` (sin `--max-warnings 0`), en contra del criterio del Escenario 2 de la HU; CI (`.github/workflows/ci.yml`) solo invoca ese script.
  - El árbol `tests/` está fuera de la base de ESLint (`File ignored because outside of base path`) y fuera del `include` de `src/tsconfig.json`: sus 3 `as any` (`tests/integration/telemetry-audit.test.ts:86,87,117`) y el `as unknown as PrismaClient` (línea 243) no los ve ningún oráculo estático.
  - `src/tsconfig.json:46` excluye `playwright-e2e`: los specs E2E no pasan por `tsc --noEmit`.
- **Corrección propuesta:** `--max-warnings 0` en el script; `tsconfig` específico para `playwright-e2e` incluido en el oráculo; migrar `tests/` (ver T-08) o, mientras exista, incluirlo en ESLint y `tsc`.

### F-17 · P2 · Seguridad y configuración — Credenciales en claro en `docker-compose.yml` y nombre de servicio engañoso

- **Archivo:** `src/docker-compose.yml:16,27`
- **Evidencia:** `DATABASE_URL=mysql://bx_admin:<contraseña en claro>@db:3306/...` versionado en git y efectivo en producción (el usuario `bx_admin` coincide con el del contenedor). El bloque `environment` **sobrescribe** el `DATABASE_URL` de `.env.production`. El contenedor Next.js se llama `barcelonaxplorer_nginx` sin ejecutar Nginx.
- **Mitigación existente:** MySQL solo escucha en `127.0.0.1:3306`.
- **Corrección propuesta:** `DATABASE_URL=${DATABASE_URL}` desde `.env.production`, rotar la contraseña, renombrar el contenedor (`barcelonaxplorer_web`) actualizando `docker logs`, sondas y documentación.

### F-18 · P2 · Seguridad — Identidad de sesión tomada de cabecera o cuerpo

- **Archivo:** `src/app/api/triage/route.ts:53-57`; `src/app/api/triage/ignition/route.ts:22-26`
- **Evidencia:** sin cookie, el `sessionId` se toma de `x-session-id` o de `body.sessionId`, y la respuesta incluye la matriz acumulada (`payload`) de esa sesión. Quien conozca un `sessionId` ajeno puede leer y alterar su estado. Los UUID son difíciles de adivinar, pero F-01 los expone.
- **Corrección propuesta:** identidad solo desde la cookie `httpOnly` emitida por el servidor (idealmente firmada); eliminar los caminos por cabecera y cuerpo.

### F-19 · P3 · Trazabilidad — Asimetría del auditor no demostrable

- **Evidencia:** 19 de los 62 commits del delta llevan `Co-authored-by: Cursor <cursoragent@cursor.com>` (todos los de HU-13, HU-14 y los de i18n `4f83830` y `003e779`), sin registrar el modelo. La HU pide Claude Opus 4.8 High; esta auditoría la ejecuta Claude Opus 5.5 en Cursor. No es determinable si alguno de esos 19 commits lo generó la misma familia de modelos.
- **Corrección propuesta:** registrar el modelo forjador en un *trailer* de commit (`Forged-by: <modelo>`) y exigir en la HU que el auditor sea de otra familia cuando coincidan.

### F-20 · P3 · Documental — Incoherencias de la propia HU y de la norma de barrels

- **Evidencia:**
  - El título H1 de la HU-15 dice "Historia de Usuario 14" y la sección B dice "HU-14 añade la capa de juicio".
  - El Anexo A.2 cifra 87 ficheros / 467 tests; la cifra actual es 88 / 471 (sección 2).
  - Norma de barrels: ADR-001 (consumo por barrel) y PBI‑P0 (named exports, cero servidor en cliente) no están reconciliados, y la realidad es un tercer estado (9 barrels, `planner` con `export *`, regla ESLint solo para `triage`). Ver F-07.
- **Corrección propuesta:** corregir título y referencias de la HU; enmienda de ADR-001 que fije la norma vigente: barrel de dominio puro consumible desde cliente + barrel de servidor con `server-only`, siempre con exports nominales.

### F-21 · P3 · Coherencia de diseño — Métrica de similitud de la caché

- **Archivo:** `src/features/cognitive-memory/lancedb-vector.adapter.ts:90-92`; `lancedb-semantic-cache.adapter.ts:16`; `gemini-embedding.adapter.ts:87-89`
- **Evidencia:** el adaptador convierte distancia L2 en `1/(1+d)` y la caché exige `≥ 0,95` (distancia ≤ 0,053), mientras la documentación del embedding habla de similitud coseno. Con vectores unitarios el umbral equivale a coseno ≈ 0,9986: prácticamente solo aciertos idénticos.
- **Corrección propuesta:** fijar explícitamente la métrica (`distanceType('cosine')` en LanceDB) y calibrar el umbral con prompts reales una vez resuelto F-02.

---

## 6. Calidad y coherencia de los tests existentes

Los oráculos certifican que los tests pasan, no que prueben lo que dicen. Hallazgos:

| ID | Sev. | Hallazgo | Evidencia | Corrección |
|---|---|---|---|---|
| T-01 | P0 (acompaña a F-01) | El test de la patrulla nunca prueba la ausencia del secreto; por eso el Fail-Open no se detectó | `src/app/api/telegram/patrol/route.test.ts:61-65,74-83` fija siempre `PATROL_SECRET_TOKEN` | Casos: secreto no configurado → rechazo; token por defecto → 401; respuesta sin `telegramChatId` |
| T-02 | P1 | Test de ruta no determinista: la ignición llama a la API real de Open‑Meteo | `src/app/api/triage/ignition/route.test.ts` mockea Groq, LanceDB y telemetría, pero no `OpenMeteoWeatherAdapter` (`fetchFn` por defecto = `fetch` global, timeout 200 ms). Además `vitest.config.ts:7-14` carga `.env.local`, así que en local los tests corren con claves reales y en CI sin ellas | Inyectar `fetchFn` falso o mockear el adaptador; no cargar `.env.local` en el oráculo unitario |
| T-03 | P2 | Los tests del Circuit Breaker prueban la mecánica, no la resiliencia del producto | `circuit-breaker.test.ts:114-134` usa una operación que coopera con el `signal` (la real no lo hace); CA-3 (`:136-156`) inyecta un breaker abierto a mano | Tras decidir F-10, test con adaptador HTTP simulado que no respete el `signal` |
| T-04 | P1 | Rutas críticas sin test propio | No existe test de `src/app/api/triage/route.ts` (limitador, cookies, estado 400/422/500) ni de `src/app/api/orchestrator/stream/route.ts` (solo se prueba el consumidor cliente) | Tests de route handler para ambas, incluidos F-04 y F-05 |
| T-05 | P2 | Los E2E certifican solo la UI: todo el backend está simulado y los fixtures no se validan contra los esquemas | `playwright-e2e/helpers/network-mocks.ts` intercepta ignición, triaje y stream; `fixtures/routes.fixture.ts:3` declara que "espeja" `EnrichedRoute` sin importarlo | Test Vitest que valide cada fixture con `TriageOutcomeSchema`/`EnrichedRouteSchema` para detectar deriva de contrato |
| T-06 | P2 | El test de caché del triaje usa la misma sesión para escribir y leer, así que no puede detectar F-03 | `src/features/triage/triage.test.ts:272,307` (`'sess-cached'` en ambos lados); `semantic-cache.test.ts` no tiene ningún caso con sesión o matriz | Caso con dos `sessionId` y dos `matrixId` distintos |
| T-07 | P2 | `as any` silenciado en tests | `src/features/ai-engine/groq-tests/groq-fast-ai.adapter.test.ts:50-51` (`eslint-disable-next-line`, semilla 1 de la HU); `tests/integration/telemetry-audit.test.ts:86,87,117` (invisible para ESLint, F-16) | Tipar el doble con `Pick<Groq, ...>` o `vi.mocked` |
| T-08 | P2 | Árbol espejo `tests/` (14 ficheros) contra TC-TEST-001; 3 de ellos huérfanos | 11 entran en Vitest vía `../tests/**`; `tests/e2e/*.e2e.test.ts` (2) y `tests/integration/**` (1) están excluidos (`vitest.config.ts:21-26`) y ningún job de CI los ejecuta (`ci.yml` solo llama a `audit-anchor.sh`) | Colocalizar los 11 junto a su código; para los 3 excluidos, job programado (manual o nocturno) o retirada justificada |
| T-09 | P3 | Densidad de aserciones débiles como indicador (no veredicto) | Recuento de `toBeDefined()/toBeTruthy()/not.toBeNull()`: `ui-dictionary.test.ts` 18, `data-table.test.tsx` 18, `orchestrator/__tests__/page.test.tsx` 17, `cognitive-kpi-cards.test.tsx` 13 | Revisar esos cuatro ficheros y sustituir por aserciones de valor |

No se encontraron `it.skip`, `it.only`, `describe.skip` ni `todo` en el repositorio.

---

## 7. Deuda observada fuera del delta (no bloquea el cierre de HU-15)

| Observación | Evidencia | Destino sugerido |
|---|---|---|
| 7 errores `Minified React error #412` en `/Admin/System` (2026-09-22 y 23) | `TelemetryLog`, contexto `CLIENT_UI` | PBI-STEEL-023. En React 19.2.8 el texto del código es `Connection closed.`, no hidratación (418, 423, 425) |
| 8 avisos "Wrong response from the webhook: 404" del bot Telegram, último 2026-09-24 | `TelemetryLog`, `[Telegram Bot] Fricción de entrega` | PBI-STEEL-024. La ruta `app/api/telegram/webhook/route.ts` existe; el 404 es `last_error_message` de Telegram |
| Sonda Jev con timeout de 2000 ms y `fetch failed` en inferencia | 6 + 4 eventos | Laudo 2026-09-28: sin PBI. *Assume-Barcelona-Default* funcionó. No se reabre |
| `Token Inválido / No Configurado` | 2 eventos, 2026-09-26 15:16, dentro de la ventana | PBI-STEEL-001 CA-10. La sonda usa `TELEGRAM_BOT_TOKEN` y registra 401 también si `getMe` agota el tiempo |
| Deuda del Códice ya catalogada: TC-NEXT-001 en `orchestrator/page.tsx` y `telegram-anchor-drop.tsx`; TC-TS-001 en `triage-input.use-case.ts:142` | Códice, tabla "Deuda heredada" | TC-TS-001 se resuelve dentro de F-03; TC-NEXT-001 junto a F-14 |

---

## 8. Semillas de la HU: confirmación

| Semilla (Anexo A.3) | Estado | Hallazgo |
|---|---|---|
| 1. `as any` en `groq-fast-ai.adapter.test.ts:51` | Confirmada (fuera del delta) | T-07 |
| 2. Árbol espejo `tests/` | Confirmada; 14 ficheros | T-08 |
| 3. `tests/e2e` y `tests/integration` huérfanos | Confirmada: ningún job los ejecuta | T-08 |
| 4. Credenciales en claro en `docker-compose.yml` | Confirmada y efectiva en producción | F-17 |
| 5. Contenedor `barcelonaxplorer_nginx` sin Nginx | Confirmada | F-17 |
| 6. Tensión barrel ADR-001 vs PBI‑P0 | Confirmada y con regresión medible en el bundle | F-07, F-20 |

---

## 9. Propuesta de derivación (entrada para complementar la HU y generar PBIs)

Agrupación sugerida para respetar el Axioma I (≤ 3 ficheros por operación atómica cuando sea posible). Las estimaciones son orientativas.

### Dentro de HU-15 (Escenario 2: P0 y P1)

| PBI propuesto | Hallazgos | Ámbito principal | Prioridad |
|---|---|---|---|
| Blindaje Fail-Closed de la patrulla Telegram y rotación del secreto | F-01, T-01, parte de F-08 (patrulla) | `app/api/telegram/patrol/`, `deploy.sh`, `.env.example` | P0 |
| Restauración del motor de embeddings y saneamiento de LanceDB | F-02, F-21 | `ai-engine/gemini-embedding.adapter.ts`, `cognitive-memory/` | P1 |
| Aislamiento de sesión en la caché semántica | F-03, T-06, TC-TS-001 | `triage/triage-input.use-case.ts`, `cognitive-memory/lancedb-semantic-cache.adapter.ts` | P1 |
| Perímetro de tasa e identidad en triaje y streaming | F-04, F-18, T-04 (parcial) | `app/api/triage/`, `app/api/orchestrator/stream/` | P1 |
| Contrato Zod extremo a extremo triaje → UI | F-05, T-04 (parcial), T-05 | `triage/triage.schema.ts`, `app/orchestrator/page.tsx`, rutas API | P1 |
| Decisión de entrega en servidor y fin de la doble invocación Gemini | F-06 | `triage-input.use-case.ts`, `page.tsx`, ruta de stream | P1 |
| Partición cliente/servidor del barrel `planner` y regla ESLint general | F-07, F-20 (enmienda ADR) | `features/planner/index.ts`, `eslint.config.mjs`, ADR-001 | P1 |
| Rollback real por etiqueta de imagen | F-09 | `ansible/hooks/after_symlink.yml`, `docker-compose.yml` | P1 |
| Aislamiento de red en el test de ignición y oráculo sin `.env.local` | T-02 | `app/api/triage/ignition/route.test.ts`, `vitest.config.ts` | P1 |

### Diferibles a `Documentacion/PBI/Pendiente/` (P2 y P3)

Materializados el 2026-09-28 como PBI-STEEL-010 a PBI-STEEL-021. No forman parte del Escenario 2. F-18, F-21, T-05 y T-06 no tienen PBI propio: ya están en PBI-STEEL-004, PBI-STEEL-002, PBI-STEEL-006 y PBI-STEEL-003. La mitad documental de F-20 ya está corregida en la HU; la enmienda de ADR-001 es PBI-STEEL-007.

| PBI propuesto | Hallazgos | Prioridad |
|---|---|---|
| Singleton Prisma único y actualización de la deuda del Códice | F-08 (heredado) | P2 |
| Retirada o integración real del Circuit Breaker de afiliados | F-10, T-03 | P2 |
| Streaming SSE real o redefinición honesta del contrato por fases | F-11 | P2 |
| Progreso real del usuario antes de los drops de fatiga | F-12 | P2 |
| Telemetría veraz de modelo y tokens | F-13 | P2 |
| Gobernanza de render del orquestador y del lienzo | F-14 | P2 |
| Ampliación del perímetro de los oráculos (`--max-warnings 0`, `tsc` de E2E, `tests/`) | F-16, T-07 | P2 |
| Externalización de credenciales y renombrado del contenedor web | F-17 | P2 |
| Colocalización del árbol `tests/` y destino de los tests huérfanos | T-08 | P2 |
| Cierre de i18n en lienzo y orquestador | F-15 | P3 |
| Trazabilidad del modelo forjador en commits | F-19 | P3 |
| Corrección documental de la HU-15 y revisión de aserciones débiles | F-20, T-09 | P3 |

### Ajustes sugeridos a la HU-15

1. Corregir el título ("Historia de Usuario 15") y la referencia "HU-14 añade" de la sección B.
2. Actualizar el Anexo A.2 con la línea base de la sección 2 de este Log.
3. Añadir a la DoD: "Secreto de patrulla rotado y verificado como `SET` en el Nodo 11" y "Filas de LanceDB generadas con vector de fallback purgadas o marcadas".
4. Añadir a los vectores de inquisición el de **Fail-Soft que oculta caídas permanentes** (F-02): un 404 de modelo no es un fallo transitorio y no debe degradarse en silencio.
5. Declarar en el Escenario 2 que la ventana de logs del contenedor web se pierde en cada despliegue, y que la fuente persistente es `TelemetryLog`.
