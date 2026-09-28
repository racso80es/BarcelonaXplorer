# [OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen (El Hombre de Acero)

- **Estatus:** Escenario 1 cumplido ([`AUD-OPS-STEEL-001`](../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md)) / Escenario 2 en curso (clúster Nivel 1: **6/9** en repo; pendientes 006–008)
- **Fecha de Revisión:** 2026-09-28
- **Autor:** Orquestador Tormentosa / Vértice Biológico (Racso)
- **Módulo:** Gobernanza de IA, QA Arquitectónico y Ciclo de Vida del Software
- **Marco Normativo & Diseño:** Protocolo de Acero (Red Teaming / Filtro A) · [`Axiomas de Forja S+ Grade`](../../.SddIA/library/norms/) · [`ADR-001 (Vertical Slicing)`](../ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [`CONSTITUTION.md`](../../CONSTITUTION.md)

> **Nota de refinamiento (2026-09-28):** Esta historia se contrastó contra el estado real del repositorio. Se corrigieron: la secuencia temporal respecto a HU-13 (Playwright ya está forjado y archivado, no pendiente), la referencia a una "Guía Maestra de Arquitectura" inexistente, rutas `domain/` que solo existen en 2 de 9 features, la ubicación real de `HybridCanvas` y `DataTable` (fuera de `src/features/`), el criterio "cero advertencias" (que `eslint` por sí solo no garantiza) y la indefinición del delta a auditar. Se integró el anexo de Racso (logs y calidad de tests). Detalle en el **Anexo A: Verificación Empírica (Anti‑Alucinación)**.

> **Nota de incorporación post‑auditoría (2026-09-28):** Tras publicar el Log de Fricción `AUD-OPS-STEEL-001` se incorporan: la enmienda documental (F-20), la DoD ampliada con la rotación del secreto de patrulla (F-01) y la purga de vectores de fallback en LanceDB (F-02), el Clúster de PBIs de Nivel 1 (sección 5) y el vector de inquisición de *Fail‑Softs Enmascarados*. Las sugerencias se contrastaron antes de incorporarlas; las correcciones aplicadas constan en el **Anexo A.4**.

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Auditoría arquitectónica asimétrica, erradicación del sesgo de confirmación generativa y consolidación de la deuda técnica (Fricción Evolutiva) acumulada en el último ciclo.
- **Entorno:** IDE Cursor operado por un modelo auditor de alto razonamiento (previsto: Claude Opus 4.8 High; ejecutado en `AUD-OPS-STEEL-001`: Claude Opus 5.5, ver hallazgo F-19) · Repositorio local BarcelonaXplorer · Nodo 11 de producción (`10.0.10.11`, grupo `nodos_pro`) como fuente de logs de solo lectura.
- **Entropía Asimilada:** Un agente de IA no debe auditar su propia obra sin riesgo de ceguera estructural. Se establece la topología de la **Fricción Cruzada**: el código se somete a un modelo ajeno a su forja original, que lo ataca, evalúa y propone su reconstrucción antes de que llegue a validación humana.

---

## 1. Descripción General

**Como** Arquitecto de Sistemas (Vértice Biológico),
**Quiero** someter el delta de código acumulado desde el último anclaje (`v2.0.1-doc-anchor`) a una auditoría estática y estructural implacable, operada por un oráculo externo de alto razonamiento, y contrastada con la evidencia de logs locales y de producción,
**Para** localizar fugas de tipado, alucinaciones de diseño, violaciones del Vertical Slicing y del aislamiento de dominio, tests débiles o incoherentes y cuellos de botella de renderizado, purgando esta deuda (Ciclo Kaizen) antes de invertir tiempo biológico en validación visual.

---

## 2. Ejes Arquitectónicos y Protocolos de Forja (El Yunque Rúnico)

La auditoría no es una lectura superficial; es un ataque preventivo contra el propio sistema.

### A. El Espejo Asimétrico (Forjador vs. Auditor)

- Se decreta la prohibición de auto‑auditoría: el modelo auditor no puede ser el mismo agente/modelo que forjó el bloque auditado.
- El código forjado por el agente primario (Google Antigravity) se audita en Cursor con Claude Opus 4.8 High en rol de **antagonista sistémico**, buscando cómo quebrar la lógica de los casos de uso, el flujo de streaming SSE hacia `HybridCanvas` y las fronteras Zod.
- **Riesgo declarado:** parte del delta (p. ej. los PBIs de HU-13) pudo forjarse ya dentro de Cursor. Para esos commits el auditor debe ser un modelo distinto al que los generó; si la autoría no es determinable, se declara en el Log de Fricción como hallazgo de trazabilidad.

### B. Secuencia de Validación (La Aduana Temporal)

La tubería ya dispone del **cuádruple oráculo automatizado** (`eslint → tsc → vitest → playwright`, en `scripts/audit-anchor.sh` y como puerta previa a Ansistrano en `src/deploy.sh`). HU-15 añade la capa de juicio que las máquinas no cubren:

1. **Aduana Lógica (Auditor IA):** arquitectura, tipos, fronteras, contratos de interfaces, prop drilling y calidad de tests.
2. **Ciclo Kaizen (Purga):** corrección de los hallazgos priorizados del Log de Fricción.
3. **Aduana Mecánica (cuádruple oráculo existente, HU-13):** re‑ejecución completa, incluidos los specs Playwright ya existentes en `src/playwright-e2e/`, para certificar que la purga no introduce regresiones.
4. **Aduana Empírica (Vértice Biológico):** solo tras superar los filtros anteriores, el humano valida la "Fricción Cero" y la gamificación en la interfaz.

### C. Vectores de Inquisición (Checklist del Auditor IA)

El auditor evalúa el delta contra la Biblioteca Canónica (`/.SddIA/library/norms/`), `ADR-001` y `CONSTITUTION.md`:

| Vector | Pregunta de inquisición | Ámbito real en el repositorio |
|---|---|---|
| Fugas de contratos | ¿Hay `any`, `as any`, aserciones `!` o casts ciegos, especialmente en el parseo de respuestas LLM (Groq / JEV)? ¿Todo `unknown` entrante pasa por Zod? | `src/features/ai-engine/`, `src/features/triage/`, `src/app/api/**` |
| Fronteras de dominio | ¿Se ha colado alguna dependencia de framework (`next/*`, Prisma, `server-only`) en esquemas, Value Objects o casos de uso puros? | Todas las features; las carpetas `domain/` explícitas solo existen en `guide-templates` e `i18n` |
| Localidad (Axioma I) | ¿Hay código de negocio o tests fuera de su vertical? ¿Alguna operación atómica exige más de 3 context hops? | `src/components/tactical/`, árbol espejo `tests/` en la raíz |
| Coherencia ADR vs. código | ¿Se respeta el consumo por barrel `index.ts` que declara `ADR-001` o prevalece la erradicación de barrels del PBI‑P0? Documentar cuál es la norma vigente. | `src/features/*/index.ts` |
| Gobernanza del DOM | ¿Hay re-renders no memoizados (`useMemo`, `useCallback`, `memo`) en el lienzo táctico o en las tablas de telemetría? | `src/components/tactical/hybrid-canvas.tsx`, `src/components/ui/data-table/`, `src/app/Admin/System/TelemetryTableClient.tsx` |
| Calidad de tests (anexo Racso) | ¿Los tests afirman comportamiento o solo implementación? ¿Hay mocks que vacían la aserción, tests duplicados, nombres engañosos o casos felices sin bordes? ¿Hay tests fuera de ejecución? | `src/**/*.test.ts(x)`, `tests/**`, `src/playwright-e2e/**` |
| Evidencia operativa (anexo Racso) | ¿Los logs revelan errores, reintentos, timeouts o fallbacks que el código o los tests no contemplan? | Ver sección D |
| Seguridad y configuración | ¿Hay secretos en claro, credenciales por defecto o nombres de servicio engañosos en IaaC? ¿Algún secreto tiene un valor de reserva escrito en el código? ¿El nombre de la variable que lee el código coincide con el que existe en el entorno de producción? | `src/docker-compose.yml`, `ansible/`, `src/app/api/**`, entorno del contenedor web (solo `SET/UNSET`) |
| Fail‑Softs enmascarados (mandato estándar, F-02) | ¿Algún error **permanente** de un proveedor externo (401/403 de credencial, 404 de modelo o recurso) se captura y se degrada sin alerta? ¿El comportamiento degradado **persiste** artefactos (vectores, cachés, filas) que contaminan datos reales? | Adaptadores de Gemini, Groq, Jev AI, Open‑Meteo y Telegram (`src/features/**/*adapter*.ts`, `*client*.ts`, `*gateway*.ts`); `TelemetryLog` de producción |

**Regla del vector *Fail‑Softs enmascarados*:** el Fail‑Soft sigue siendo la política correcta ante fallos **transitorios** (timeouts, 5xx, 429, `fetch failed`). Ante un fallo **permanente** (401/403 de credencial, 404 de modelo o recurso inexistente):

1. se emite telemetría de nivel `ERROR` con el proveedor y el código HTTP, visible en `/Admin/System`, en lugar de `WARN`;
2. el resultado degradado **no se persiste** en almacenes compartidos (LanceDB, cachés, MySQL);
3. el auditor lo clasifica como mínimo P1.

Precedente positivo en el repositorio: la sonda de Telegram ya registra `ERROR 401 Token Inválido / No Configurado`. Precedente negativo: `GeminiEmbeddingAdapter` registró 16 veces un 404 de modelo como `WARN` y persistió vectores de fallback (F-02).

### D. Fuentes de Logs (Contexto de Situación Actual)

Los logs se consultan en **modo solo lectura**; está prohibido modificar el nodo de producción durante la auditoría.

| Entorno | Fuente | Acceso |
|---|---|---|
| Local | Salida de `npm run dev`, volcados de los oráculos y artefactos Playwright (`src/test-results/`) | Directo |
| Local / Producción | Telemetría LLM persistida en MySQL | `/Admin/Logs` y `/Admin/System` (protegidas por `middleware.ts`) |
| Producción | Logs del contenedor web (`barcelonaxplorer_nginx`, Next.js en `:3000`) y de MySQL (`barcelonaxplorer_mysql`) | `ssh racso@10.0.10.11` + `docker logs --since <ventana> <contenedor>` |

Cada hallazgo derivado de logs debe citar la fuente, la ventana temporal y un extracto mínimo, sin copiar secretos ni datos personales.

**Persistencia de las fuentes:** `docker logs` del contenedor web se reinicia en cada despliegue (en `AUD-OPS-STEEL-001` solo quedaban 5 líneas de arranque). La fuente persistente es la tabla `TelemetryLog`. La configuración del entorno se verifica solo como `SET/UNSET`, nunca leyendo valores.

---

## 3. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Ejecución del Ataque Asimétrico (El Hombre de Acero)

- **Dado** el delta `v2.0.1-doc-anchor..HEAD` (orquestación y streaming, escudo de supervivencia, afiliación con circuit breaker, drops reactivos de Telegram, i18n y Playwright) y los logs locales y de producción de la sección D.
- **Cuando** el Vértice Biológico ordena al auditor: *"Audita este delta bajo el Protocolo de Acero de SddIA, asumiendo el rol del antagonista sistémico"*.
- **Entonces** el auditor genera un **Log de Fricción** en `Documentacion/Auditorias/` que, para cada hallazgo, indica: vector de inquisición, severidad (P0–P3), archivo y línea, evidencia (código o extracto de log) y corrección propuesta.
- **Y** el Log incluye una sección específica de **calidad y coherencia de los tests existentes**.
- **Y** ningún hallazgo se da por válido sin evidencia verificable en el repositorio o en los logs (prohibido reportar sospechas como hechos).
- **Estado:** cumplido con [`AUD-OPS-STEEL-001`](../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) (1 P0, 9 P1, 11 P2/P3 y 9 hallazgos de calidad de tests).

### Escenario 2: Saneamiento y Purga Kaizen (Resolución de Fricción)

- **Dado** el Log de Fricción generado.
- **Cuando** se aplican las correcciones de los hallazgos P0 y P1 mediante el Clúster de PBIs de Nivel 1 (sección 5), en el orden que allí se fija (los P2–P3 pueden diferirse como PBIs en `Documentacion/PBI/Pendiente/` con justificación).
- **Entonces** el cuádruple oráculo, ejecutado desde `src/`, devuelve código de salida 0:
  1. `npx eslint . --max-warnings 0`
  2. `npx tsc --noEmit`
  3. `npm test` (`vitest run`)
  4. `npm run test:e2e` (`playwright test`)
- **Y** ninguna corrección relaja aserciones, añade `eslint-disable` o elimina tests para conseguir el verde (Bucle Kaizen del Axioma IV).
- **Y** en el Nodo 11 se verifican empíricamente las dos purgas operativas de la DoD: secreto de patrulla definido y rechazo del literal por defecto (F-01), y vectores de fallback eliminados o marcados en LanceDB (F-02).

### Escenario 3: Bloqueo de Bypass Biológico (Protección de la Atención)

- **Dado** un impulso por probar visualmente la interfaz en `localhost:3000` tras codificar una nueva HU.
- **Cuando** no se ha ejecutado y resuelto previamente la auditoría asimétrica sobre ese delta.
- **Entonces** el operador detiene la validación manual, garantizando que el humano nunca opera como linter visual de primera línea.

### Escenario 4: Sello de Certificación y Paso a Validación Biológica

- **Dado** que el Log de Fricción no contiene hallazgos P0/P1 abiertos y el cuádruple oráculo está en verde.
- **Cuando** se cierra el Ciclo Kaizen.
- **Entonces** el delta adquiere el estatus de **"Sabiduría Estratégica Blindada"** en el ámbito del código.
- **Y** se ancla un tag de cierre de ciclo que sirve como frontera inicial del siguiente delta.
- **Y** se da luz verde a la validación final biológica (fricción de usuario).

---

## 4. Definición de Hecho (DoD)

El verde de los oráculos es condición necesaria pero **no suficiente**: la HU no se cierra sin las dos purgas operativas verificadas en producción.

- [x] Log de Fricción publicado en `Documentacion/Auditorias/` con evidencia por hallazgo (`AUD-OPS-STEEL-001`).
- [x] Sección de calidad y coherencia de tests incluida en el Log (sección 6, T-01 a T-09).
- [x] Hallazgos derivados de logs locales y de producción documentados con fuente y ventana temporal (sección 3 del Log).
- [x] Clúster de PBIs de Nivel 1 (sección 5) redactado en `Documentacion/PBI/Pendiente/` (`PBI-STEEL-001` a `009`).
- [ ] Clúster de PBIs de Nivel 1 ejecutado y movido a `Documentacion/PBI/Realizado/`.
- [ ] Hallazgos P0/P1 corregidos; P2/P3 convertidos en PBIs pendientes.
- [ ] **Purga F-01 (secreto de patrulla):** la ruta `/api/telegram/patrol` es Fail‑Closed (sin literal de reserva); `PATROL_SECRET_TOKEN` está definido con un valor nuevo en `.env.production`, verificado como `SET` en el contenedor del Nodo 11 y controlado por `deploy.sh`; una petición con `bcn_patrol_secret_default` devuelve 401.
- [ ] **Purga F-02 (vectores de fallback):** corregido primero el modelo de embeddings y bloqueada la persistencia de vectores de fallback; después, script idempotente con modo *dry‑run* que recorre `cognitive_memories` y `semantic_prompt_cache`, identifica cada fila cuyo `vector` coincide (con tolerancia de `float32`) con `generateDeterministicFallback(text)` y la elimina o la marca como descartada; recuento antes/después anotado en el PBI.
- [ ] Cuádruple oráculo en verde con `--max-warnings 0`.
- [ ] Tag de cierre de ciclo creado.

---

## 5. Clúster de PBIs de Nivel 1 (Backlog Inmediato, aprobado por el Vértice Biológico)

Derivado de la sección 9 del Log `AUD-OPS-STEEL-001`. Resuelve el P0 y los P1 dentro de esta HU (Escenario 2). Los P2/P3 quedaron redactados el mismo día (sección 6) y no se ejecutan hasta cerrar este clúster.

Documentos forjados el 2026-09-28 en `Documentacion/PBI/Pendiente/`:

| Orden | PBI | Hallazgos | Ámbito principal | Prioridad |
|---|---|---|---|---|
| 1 | ✅ [`PBI-STEEL-001` — Blindaje Fail‑Closed de la patrulla Telegram y definición del secreto](../PBI/Realizado/PBI%20-%20Blindaje%20Fail-Closed%20de%20la%20Patrulla%20Telegram%20y%20Definici%C3%B3n%20del%20Secreto%20%28P0%29.md) | F-01, T-01, F-08 (solo la ruta de patrulla) | `app/api/telegram/patrol/`, `deploy.sh`, `.env.example` | P0 — Realizado (CA-8 post-deploy) |
| 2 | ✅ [`PBI-STEEL-002` — Restauración del motor de embeddings y purga de vectores de fallback en LanceDB](../PBI/Realizado/PBI%20-%20Restauraci%C3%B3n%20del%20Motor%20de%20Embeddings%20y%20Purga%20de%20Vectores%20de%20Fallback%20en%20LanceDB%20%28P1%29.md) | F-02, F-21 | `ai-engine/gemini-embedding.adapter.ts`, `cognitive-memory/`, scripts de ping/purga | P1 — Realizado (CA-6 post-deploy) |
| 3 | ✅ [`PBI-STEEL-003` — Aislamiento de sesión en la caché semántica](../PBI/Realizado/PBI%20-%20Aislamiento%20de%20Sesi%C3%B3n%20en%20la%20Cach%C3%A9%20Sem%C3%A1ntica%20del%20Triaje%20%28P1%29.md) | F-03, T-06, TC-TS-001 | `triage/`, `cognitive-memory/` | P1 — Realizado |
| 4 | ✅ [`PBI-STEEL-004` — Perímetro de tasa e identidad en triaje](../PBI/Realizado/PBI%20-%20Per%C3%ADmetro%20de%20Tasa%20e%20Identidad%20de%20Sesi%C3%B3n%20en%20Triaje%20y%20Streaming%20%28P1%29.md) | F-04, F-18, T-04 (parcial) | `public-llm-rate-limit.ts`, rutas triaje/ignición | P1 — Realizado |
| 5 | ✅ [`PBI-STEEL-005` — Erradicación del streaming fingido y entrega única desde el triaje](../PBI/Realizado/PBI%20-%20Erradicaci%C3%B3n%20del%20Endpoint%20de%20Streaming%20Fingido%20y%20Entrega%20%C3%9Anica%20desde%20el%20Triaje%20%28P1%29.md) | F-06, F-11 | triaje + orquestador (sin SSE) | P1 — Realizado |
| 6 | ✅ [`PBI-STEEL-006` — Contrato Zod extremo a extremo triaje → UI](../PBI/Realizado/PBI%20-%20Contrato%20Zod%20Extremo%20a%20Extremo%20del%20Triaje%20a%20la%20Interfaz%20%28P1%29.md) | F-05, T-04 (parcial), T-05 | `triage/triage.schema.ts`, `app/orchestrator/page.tsx`, rutas API | P1 — Realizado |
| 7 | ✅ [`PBI-STEEL-007` — Desmantelamiento del barrel contaminado de `planner`](../PBI/Realizado/PBI%20-%20Desmantelamiento%20del%20Barrel%20Contaminado%20de%20Planner%20y%20Erradicaci%C3%B3n%20de%20Prisma%20del%20Bundle%20Cliente%20%28P1%29.md) | F-07, F-20 (enmienda ADR-001) | `features/planner/index.ts`, `eslint.config.mjs`, ADR-001 | P1 — Realizado |
| 8 | ✅ [`PBI-STEEL-008` — Rollback real por etiqueta de imagen](../PBI/Realizado/PBI%20-%20Rollback%20Real%20por%20Etiqueta%20de%20Imagen%20en%20el%20Or%C3%A1culo%20de%20Salud%20Post-Despliegue%20%28P1%29.md) | F-09 | `ansible/hooks/after_symlink.yml`, `docker-compose.yml` | P1 — Realizado (CA-5 staging) |
| 9 | ✅ [`PBI-STEEL-009` — Aislamiento de red en el test de ignición y oráculo sin `.env.local`](../PBI/Realizado/PBI%20-%20Aislamiento%20de%20Red%20en%20el%20Test%20de%20Ignici%C3%B3n%20y%20Or%C3%A1culo%20Unitario%20sin%20Credenciales%20Locales%20%28P1%29.md) | T-02 | `app/api/triage/ignition/route.test.ts`, `vitest.config.ts` | P1 — Realizado |

**Dependencias de orden:**
- Orden de fuego de la memoria vectorial: PBI 2 despliega primero la corrección del modelo y el bloqueo de persistencia, después ejecuta la purga, y solo entonces se despliega el PBI 3.
- El PBI 5 elimina `/api/orchestrator/stream`. El CA-3 del PBI 4 queda cerrado como no aplicable; el resto del PBI 4 (límite eludible por cookie e identidad de sesión) sigue abierto.
- El PBI 6 fija el esquema que los PBIs 3 y 5 consumen; puede forjarse en paralelo, pero se integra antes de cerrarlos.
- El PBI 7 no exporta `consumeOrchestratorStream`: el PBI 5 elimina ese módulo.

**Mandatos específicos:**
- **PBI 7 (F-07):** se acota a `planner`. Superficie de dominio puro y superficie `server-only`, exports nominales, y ningún chunk de `.next/static/` con `PrismaClient`. Los otros barrels son PBI-STEEL-022. Se enmienda ADR-001.
- **PBI 4 (F-04, F-18):** un solo cubo para `/api/triage` y `/api/triage/ignition`. La clave no usa IP ni cookie. `cf-connecting-ip` no se adopta. La cookie sigue siendo la identidad de sesión, no la clave del cubo.
- **PBI 5 (F-06, F-11):** se elimina el endpoint de streaming. El itinerario completo sigue saliendo de `/api/triage`, que es lo que ya ocurre cuando Gemini responde. La claudicación pasa a ser un estado explícito y el cliente no relanza la generación.

---

## 6. PBIs diferidos (P2 y P3)

Redactados el 2026-09-28 a partir de la tabla "Diferibles" de la sección 9 del Log. No cierran el Escenario 2. Se ejecutan después del clúster de la sección 5.

| ID | PBI | Hallazgos | Prioridad |
|---|---|---|---|
| ✅ PBI-STEEL-010 | [Singleton Prisma y catálogo de deuda del Códice](../PBI/Realizado/PBI%20-%20Singleton%20Prisma%20%C3%9Anico%20y%20Cat%C3%A1logo%20de%20Deuda%20del%20C%C3%B3dice%20%28P2%29.md) | F-08 (heredado; la patrulla es del 001) | P2 — Realizado |
| ✅ PBI-STEEL-011 | [Retirada del Circuit Breaker sin proveedor](../PBI/Realizado/PBI%20-%20Retirada%20del%20Circuit%20Breaker%20sin%20Proveedor%20Externo%20%28P2%29.md) | F-10, T-03 | P2 — Realizado |
| PBI-STEEL-012 | [Streaming reactivo real desde cero](../PBI/Pendiente/PBI%20-%20Streaming%20Reactivo%20Real%20desde%20Cero%20%28P2%29.md) | F-11, ya decidido en el 005 | P2, congelado |
| ✅ PBI-STEEL-013 | [Desactivación del drop de fatiga sin progreso](../PBI/Realizado/PBI%20-%20Desactivaci%C3%B3n%20del%20Drop%20de%20Fatiga%20sin%20Progreso%20Real%20%28P2%29.md) | F-12 | P2 — Realizado |
| ✅ PBI-STEEL-014 | [Telemetría veraz de modelo y tokens](../PBI/Realizado/PBI%20-%20Telemetr%C3%ADa%20Veraz%20de%20Modelo%20y%20Tokens%20%28P2%29.md) | F-13 | P2 — Realizado |
| PBI-STEEL-015 | [Gobernanza de render del orquestador y del lienzo](../PBI/Pendiente/PBI%20-%20Gobernanza%20de%20Render%20del%20Orquestador%20y%20del%20Lienzo%20%28P2%29.md) | F-14 | P2 |
| PBI-STEEL-016 | [Ampliación del perímetro de los oráculos](../PBI/Pendiente/PBI%20-%20Ampliaci%C3%B3n%20del%20Per%C3%ADmetro%20de%20los%20Or%C3%A1culos%20%28P2%29.md) | F-16, T-07 | P2 |
| PBI-STEEL-017 | [Externalización de credenciales y renombrado del contenedor](../PBI/Pendiente/PBI%20-%20Externalizaci%C3%B3n%20de%20Credenciales%20y%20Renombrado%20del%20Contenedor%20Web%20%28P2%29.md) | F-17 | P2 |
| PBI-STEEL-018 | [Colocalización del árbol de tests](../PBI/Pendiente/PBI%20-%20Colocalizaci%C3%B3n%20del%20%C3%81rbol%20de%20Tests%20y%20Destino%20de%20los%20Hu%C3%A9rfanos%20%28P2%29.md) | T-08 | P2 |
| PBI-STEEL-019 | [Cierre de i18n en lienzo y orquestador](../PBI/Pendiente/PBI%20-%20Cierre%20de%20i18n%20en%20Lienzo%20y%20Orquestador%20%28P3%29.md) | F-15 | P3 |
| PBI-STEEL-020 | [Trazabilidad del modelo forjador](../PBI/Pendiente/PBI%20-%20Trazabilidad%20del%20Modelo%20Forjador%20en%20Commits%20%28P3%29.md) | F-19 | P3 |
| PBI-STEEL-021 | [Aserciones débiles en los cuatro tests señalados](../PBI/Pendiente/PBI%20-%20Sustituci%C3%B3n%20de%20Aserciones%20D%C3%A9biles%20en%20Tests%20Se%C3%B1alados%20%28P3%29.md) | T-09. F-20 ya no está aquí | P3 |
| PBI-STEEL-022 | [Saneamiento de barrels secundarios](../PBI/Pendiente/PBI%20-%20Saneamiento%20Hexagonal%20de%20Barrels%20Secundarios%20%28P2%29.md) | Resto de F-07, fuera del 007 | P2 |
| PBI-STEEL-023 | [Error React 412 en Admin System](../PBI/Pendiente/PBI%20-%20Investigaci%C3%B3n%20del%20Error%20React%20412%20en%20Admin%20System%20%28P2%29.md) | Sección 7 del Log. El código es `Connection closed.` | P2 |
| PBI-STEEL-024 | [Webhook de Telegram registrado](../PBI/Pendiente/PBI%20-%20Verificaci%C3%B3n%20del%20Webhook%20de%20Telegram%20Registrado%20%28P2%29.md) | Sección 7 del Log. La ruta ya existe | P2 |

**Qué no se ha vuelto a abrir.** F-18 y F-21 siguen en PBI-STEEL-004 y PBI-STEEL-002. T-05 y T-06 siguen en PBI-STEEL-006 y PBI-STEEL-003. La enmienda de ADR-001 sigue en PBI-STEEL-007.

**Decisiones tomadas al redactar, distintas de la tabla del Log:**

- PBI-STEEL-011 retira el breaker. No se inventa un proveedor HTTP.
- PBI-STEEL-012 queda congelado. Cerrar PBI-STEEL-005 no lo abre.
- PBI-STEEL-013 apaga el drop de fatiga. No diseña el check-in.
- PBI-STEEL-021 no rehace F-20: el título, el baseline y el encargo del ADR ya están hechos.
- PBI-STEEL-004 usa un cubo único. No usa `cf-connecting-ip`.
- Los tests en vivo de PBI-STEEL-018 se quedan junto al módulo, fuera de CI. No hay carpeta `src/tests-live/`.

**Sección 7 del Log, laudo del 2026-09-28:**

- React #412 pasa a PBI-STEEL-023. En React 19.2.8 ese código es `Connection closed.`, no un fallo de hidratación.
- El 404 del webhook pasa a PBI-STEEL-024. La ruta `/api/telegram/webhook` ya está en el repositorio.
- Jev (6 timeouts y 4 `fetch failed`) no tiene PBI. *Assume-Barcelona-Default* hizo lo que el log ya describió. No se reabre.
- Los dos «Token inválido» no abren un PBI nuevo. PBI-STEEL-001, CA-10, comprueba si `TELEGRAM_BOT_TOKEN` está definido. El mensaje también se escribe cuando `getMe` hace timeout.

---

## Anexo A: Verificación Empírica (Anti‑Alucinación)

### A.1 Correcciones aplicadas sobre la versión anterior

| Afirmación original | Realidad verificada | Corrección |
|---|---|---|
| Purgar la deuda "antes de invertir un solo segundo en automatización Playwright" y "dar luz verde para activar la HU-13 (escribir y lanzar las pruebas E2E)" | HU-13 está en `HistoriasDeUsuario_Historico/` con estatus *Realizado*; existen 4 specs en `src/playwright-e2e/` y Playwright es el 4.º oráculo en `audit-anchor.sh`, CI y `deploy.sh` | Playwright pasa a ser regresión posterior a la purga, no un paso futuro |
| "Guía Maestra de Arquitectura" | No existe ningún documento con ese nombre | Sustituida por la Biblioteca Canónica, `ADR-001` y `CONSTITUTION.md` |
| Vector sobre `src/features/.../domain/` | Solo `guide-templates` e `i18n` tienen `domain/`; el resto de features son planas | Vector ampliado a esquemas, VOs y casos de uso de todas las features |
| "Violaciones de la Clean Architecture" como marco principal | `ADR-001` fija Vertical Slicing como topología canónica, manteniendo el aislamiento de dominio | Reformulado como Vertical Slicing + aislamiento de dominio |
| "Extractores del HybridCanvas" y "DataTable de telemetría" como parte del código de features | `HybridCanvas` vive en `src/components/tactical/`; `DataTable` en `src/components/ui/data-table/`, consumido por `TelemetryTableClient.tsx` | Rutas reales en el checklist; ubicación fuera de features añadida como vector de localidad |
| "Delta de las últimas HUs" sin frontera | Último tag: `v2.0.1-doc-anchor` (55 commits hasta `HEAD` a 2026-09-28) | Delta definido como `v2.0.1-doc-anchor..HEAD` |
| `npm run lint` con "cero advertencias" | El script `lint` ejecuta `eslint` sin `--max-warnings 0`: con advertencias sale con código 0 | Criterio explícito `npx eslint . --max-warnings 0` |
| Santa Trinidad de 3 oráculos | La tubería real ejecuta 4 oráculos (añade Playwright) | Criterio de cierre con el cuádruple oráculo |
| "Certeza matemática" de la ceguera de auto‑auditoría | Es un principio de gobernanza, no una demostración | Reformulado como riesgo y regla |
| Antigravity como forjador único del delta | La autoría por agente no es determinable desde git | Añadido riesgo declarado en el eje A |
| Anexo de Racso sin integrar | — | Integrado en vectores C y sección D, escenarios 1 y DoD |

### A.2 Línea base de oráculos al refinar (2026-09-28, desde `src/`)

- `npx tsc --noEmit` → código 0.
- `npx eslint .` → código 0, sin salida.
- `npx vitest run` → 87 ficheros, 467 tests, todos en verde.
- `npm run test:e2e` → no ejecutado durante el refinamiento.

**Línea base estabilizada en `AUD-OPS-STEEL-001` (2026-09-28, `HEAD 1c4d1b0`), vigente para el Escenario 2:**

- `npx eslint . --max-warnings 0` → código 0.
- `npx tsc --noEmit` → código 0.
- `npx vitest run` → 88 ficheros, 471 tests en verde (la diferencia con 87/467 son los tests del contrato del Códice, añadidos después del refinamiento).
- `CI=1 npm run test:e2e` → 5 specs en verde.

La línea base verde **no** invalida la auditoría: los oráculos no detectan tests débiles, fugas lógicas ni deuda documental.

### A.3 Semillas de inquisición detectadas durante el refinamiento

No son el Log de Fricción; son puntos de partida verificados que el auditor debe confirmar y ampliar:

1. `src/features/ai-engine/groq-tests/groq-fast-ai.adapter.test.ts:51` usa `as any` silenciado con `eslint-disable-next-line`, en contra del Axioma II.
2. Persiste el árbol espejo `tests/` en la raíz (14 ficheros en `app/`, `security/`, `e2e/`, `integration/`), incluido en Vitest vía `../tests/**`, en contra del Colocated Testing del Axioma I.
3. `tests/e2e/` (live) y `tests/integration/` están excluidos del oráculo por defecto: evaluar si tienen ejecución periódica o son tests huérfanos.
4. `src/docker-compose.yml` declara `DATABASE_URL` con credenciales en claro.
5. El servicio Next.js se llama `barcelonaxplorer_nginx` sin ejecutar Nginx: nombre engañoso para diagnóstico en producción.
6. Tensión documental entre el barrel `index.ts` de `ADR-001` y la erradicación de barrels del PBI‑P0.

Las seis semillas quedaron confirmadas en la sección 8 de `AUD-OPS-STEEL-001`.

### A.4 Contraste de las sugerencias incorporadas tras la auditoría

Las sugerencias del Vértice Biológico se contrastaron con el Log y con el repositorio antes de incorporarlas. Se ajustó lo siguiente:

| Sugerencia | Realidad verificada | Forma incorporada |
|---|---|---|
| "Rotación del token `PATROL_SECRET_TOKEN` en producción" | La variable **no existe** en el Nodo 11 ni en `.env.production`; el secreto efectivo es el literal `bcn_patrol_secret_default`, público en el repositorio. No hay nada que rotar, y definir la variable sin cambiar el código no basta: el literal de reserva seguiría activo si la variable faltase | DoD: ruta Fail‑Closed sin literal + variable definida con un valor nuevo + control en `deploy.sh` + verificación `SET` en el contenedor + 401 ante el literal |
| "Script de purga para los vectores generados con el LCG tras la caída de los embeddings" | Los vectores de fallback no llevan marca y no se pueden aislar por fecha: además de los 16 eventos 404 desde el 2026-09-25, hubo `fetch failed` puntuales, y el fallback también se activa sin clave. Como el fallback es determinista y el campo `text` de ambas tablas es exactamente el texto vectorizado, se identifican recalculando `generateDeterministicFallback(text)`. Purgar antes de corregir el modelo no sirve: la tabla se volvería a llenar | DoD: corrección del modelo y bloqueo de persistencia primero; después script idempotente con *dry‑run* sobre `cognitive_memories` y `semantic_prompt_cache` |
| El DELETE en LanceDB como parte de la auditoría | La sección D prohíbe modificar producción **durante la auditoría**. La purga pertenece al Escenario 2 (Kaizen), no al Escenario 1 | Ubicada en la DoD y en el PBI 2, fuera de la fase de auditoría |
| El P0 (F-01) "desvelado por el cruce con los logs de `barcelonaxplorer_mysql`" | F-01 se confirmó inspeccionando el **entorno** del contenedor web (`SET/UNSET`), no con logs de MySQL, cuyo log solo contenía avisos de configuración. `TelemetryLog` (en MySQL) fue la fuente de F-02 | Sección D: el entorno del contenedor se declara fuente explícita, verificada solo como `SET/UNSET` |
| Proveedores del mandato *Fail‑Soft*: "OpenAI, Groq, Gemini, Open‑Meteo" | El proyecto no usa OpenAI. Los proveedores externos reales son Gemini (`@google/genai`), Groq, Jev AI, Open‑Meteo y la Bot API de Telegram | Vector con Gemini, Groq, Jev AI, Open‑Meteo y Telegram |
| "Ningún 404 o 401 debe capturarse en silencio y degradarse" | Degradar sigue siendo correcto ante fallos transitorios (timeouts, 5xx, 429). El defecto de F-02 es tratar un error permanente como transitorio, registrarlo como `WARN` y persistir el resultado degradado. "Telemetría de Sistema" es ambiguo: `SYSTEM` es uno de los contextos de `TelemetryLog`, y los eventos de los proveedores de IA se registran en `LLM_ENGINE` | Regla: error permanente → nivel `ERROR` visible en `/Admin/System`, sin persistir el resultado degradado, y clasificación mínima P1 |
| "Dos barrels (cliente y servidor)" para `planner` | Correcto. Además hacen falta exports nominales (el PBI‑P0 ya lo exigía), ampliar la regla ESLint a todas las features (hoy solo cubre `triage`) y enmendar ADR-001, que prescribe un único barrel | Mandato del PBI 7 con criterio verificable: ningún chunk de `.next/static/` contiene `PrismaClient` |
| El auditor es "Opus" | La HU preveía Claude Opus 4.8 High; la auditoría la ejecutó Claude Opus 5.5. La asimetría respecto a los 19 commits co‑firmados por Cursor no es demostrable (F-19) | Campo *Entorno* actualizado |

### A.5 Contraste del refinamiento de los PBIs (2026-09-28)

| Afirmación del refinamiento | Realidad verificada | Forma incorporada |
|---|---|---|
| La patrulla es un artefacto huérfano, "probablemente un Cron de Vercel o un webhook externo" | Huérfano: sí. No hay cron en `ansible/` ni script que llame a `/api/telegram/patrol`. Vercel no: el despliegue es Docker + Ansistrano en el Nodo 11 | PBI-STEEL-001 CA-9: no se construye invocador. El comentario en `route.ts` se escribe al quitar el literal, no antes |
| "La rotación queda cumplida cuando se despliegue CA-1" | CA-1 solo cierra el agujero (`503` si falta el secreto). La ruta solo vuelve a ser utilizable si el contenedor recibe el `.env.production`, que ya define `PATROL_SECRET_TOKEN` (64 caracteres, fuera de git) | CA-8 exige el código y el secreto `SET` en el contenedor |
| Forzar el modelo `models/embedding-001` y "truncar" a 768 | El 404 de `text-embedding-004` está en `TelemetryLog`. El mensaje no dice que sea un corte por región o por plan. `embedding-001` es el modelo de 2023 y puede fallar igual. El SDK ya tiene `outputDimensionality`; recortar el array a mano rompe la normalización | CA-1: manda la respuesta de la API. `embedding-001` es un candidato. CA-2: parámetro del SDK, no un corte posterior |
| Purgar "desde el entorno local" con túnel SSH, o con `docker exec -it ... node /app/scripts/...`, o con un contenedor `node:20` montando el volumen y ejecutando el script desde dentro | LanceDB no tiene puerto. La imagen de la app es Alpine y declara `@lancedb/lancedb` como `serverExternalPackages`; `node:20` pelado no trae el paquete ni los binarios musl. El script no debe vivir dentro del volumen de datos. El volumen documentado es `/home/racso/Despliegues/BarcelonaXplorer/lancedb_data`, montado en `/app/vector_storage` | Purga en el Nodo 11, con la imagen `barcelonaxplorer-web`, UID 1001, script en `/tmp`. `--apply` con el contenedor web parado |
| "Borrar el stream anula el riesgo de tasa de PBI-STEEL-004" | Anula solo la ruta sin límite. `/api/triage` sigue eludible cambiando la cookie, y la sesión sigue aceptándose por cabecera o cuerpo | CA-3 de PBI-STEEL-004 cerrado como no aplicable. El resto del PBI sigue abierto |
| "El Nodo 11 (Raspberry Pi con Cloudflare Tunnel)" y "confírmalo en los logs de Nginx" | El cuaderno de topología dice `Nodo 11 → MikroTik → Raspberry Pi → Cloudflare`: la Pi es un salto. El nodo está documentado como Linux Mint / Ubuntu Server y tiene disco NVMe. No hay Nginx. Los logs del contenedor web se vaciaron en el despliegue del 2026-09-28. El puerto publicado es `8080:3000`; si la LAN puede abrirlo, el cliente puede falsificar `cf-connecting-ip` | Quedó superado por el Anexo A.6: el cubo no usa la cabecera |

### A.6 Contraste del laudo sobre puntos abiertos y fantasmas (2026-09-28)

| Afirmación del laudo | Realidad verificada | Forma incorporada |
|---|---|---|
| Apoyarse en `cf-connecting-ip` es un castillo en el aire | Cierto: no hay Nginx y no hay log que muestre la cabecera. El cubo único es la defensa de este PBI | PBI-STEEL-004 CA-1. La cookie de sesión (CA-4) sigue existiendo y no es la clave del cubo. El PBI de topología de red no se redacta |
| Ping a `text-embedding-004` y `models/embedding-001`, y anclar el que dé 200 con 768 dimensiones | El 404 de `text-embedding-004` ya está en `TelemetryLog`. El adaptador usa el nombre corto, sin `models/`. `embedding-001` puede fallar igual | CA-1 de PBI-STEEL-002: script fuera de Next, dos nombres cortos, y `models.list()` si el segundo no cumple. Sin tercer nombre inventado |
| `metric: 'cosine'` y umbral `> 0.98` | El paquete instalado expone `distanceType('cosine')`. Esa distancia va de 0 a 2; 0 es idéntico. Comparar `_distance` con `0.98` aceptaría casi todo. El umbral viejo `≥ 0.95` sobre `1/(1+d)` era casi solo aciertos idénticos | CA-7: se borra `1/(1+d)`. Similitud = `1 - _distance`. Umbral inicial `0.98`, declarado como punto de partida y no como calibración |
| Los ocho barrels restantes son deuda y se refactorizan en PBI-STEEL-022 | Hay ocho `index.ts` además de `planner`. `i18n` solo exporta dominio. El resto mezcla servidor, pero no los ocho por igual | PBI-STEEL-007 se queda en `planner`. PBI-STEEL-022 parte seis features, de una en una, y marca `i18n` como revisado |
| Tests en vivo en `src/tests-live/` y `npm run test:live` | `test:live` ya existe y apunta a `../tests/e2e`. Una carpeta `src/tests-live/` es otro árbol espejo | PBI-STEEL-018: sufijo `*.live.test.ts` junto al módulo, fuera de CI |
| El error #412 es hidratación por fechas | En `codes.json` de React `v19.2.8` el 412 es `Connection closed.`. Hidratación es 418, 423 y 425. Las fechas del orquestador son F-14 | PBI-STEEL-023 investiga el corte. No reescribe el panel por fechas |
| El webhook 404 significa que la ruta cambió o BotFather apunta mal, y hay que registrar `/api/telegram/webhook` | La ruta ya está en `src/app/api/telegram/webhook/route.ts`. El texto es `last_error_message` de Telegram, anterior al tag. La sonda ya ignora ese error si tiene más de 15 minutos | PBI-STEEL-024 lee `getWebhookInfo` y solo llama a `setWebhook` si la URL difiere |
| El token inválido es `TELEGRAM_BOT_TOKEN`, no el secreto del webhook | `getMe` usa `TELEGRAM_BOT_TOKEN`. Cierto que no es `TELEGRAM_WEBHOOK_SECRET`. El caso de uso escribe ese mensaje y un 401 también cuando `getMe` devuelve `null` por timeout. La auditoría no comprobó si el token estaba `SET` | PBI-STEEL-001 CA-10: comprobación `SET/UNSET`, sin cambiar la sonda ni rotar el token |
