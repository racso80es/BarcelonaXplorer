# [OPERATIVO] Historia de Usuario 14: Auditoría Ontológica de Acero y Purga Kaizen (El Hombre de Acero)

- **Estatus:** Refinado / Listo para Ejecución Inmediata
- **Fecha de Revisión:** 2026-09-28
- **Autor:** Orquestador Tormentosa / Vértice Biológico (Racso)
- **Módulo:** Gobernanza de IA, QA Arquitectónico y Ciclo de Vida del Software
- **Marco Normativo & Diseño:** Protocolo de Acero (Red Teaming / Filtro A) · [`Axiomas de Forja S+ Grade`](../../.SddIA/library/norms/) · [`ADR-001 (Vertical Slicing)`](../ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [`CONSTITUTION.md`](../../CONSTITUTION.md)

> **Nota de refinamiento (2026-09-28):** Esta historia se contrastó contra el estado real del repositorio. Se corrigieron: la secuencia temporal respecto a HU-13 (Playwright ya está forjado y archivado, no pendiente), la referencia a una "Guía Maestra de Arquitectura" inexistente, rutas `domain/` que solo existen en 2 de 9 features, la ubicación real de `HybridCanvas` y `DataTable` (fuera de `src/features/`), el criterio "cero advertencias" (que `eslint` por sí solo no garantiza) y la indefinición del delta a auditar. Se integró el anexo de Racso (logs y calidad de tests). Detalle en el **Anexo A: Verificación Empírica (Anti‑Alucinación)**.

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Auditoría arquitectónica asimétrica, erradicación del sesgo de confirmación generativa y consolidación de la deuda técnica (Fricción Evolutiva) acumulada en el último ciclo.
- **Entorno:** IDE Cursor operado por un modelo auditor de alto razonamiento (Claude Opus 4.8 High) · Repositorio local BarcelonaXplorer · Nodo 11 de producción (`10.0.10.11`, grupo `nodos_pro`) como fuente de logs de solo lectura.
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

La tubería ya dispone del **cuádruple oráculo automatizado** (`eslint → tsc → vitest → playwright`, en `scripts/audit-anchor.sh` y como puerta previa a Ansistrano en `src/deploy.sh`). HU-14 añade la capa de juicio que las máquinas no cubren:

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
| Seguridad y configuración | ¿Hay secretos en claro, credenciales por defecto o nombres de servicio engañosos en IaaC? | `src/docker-compose.yml`, `ansible/` |

### D. Fuentes de Logs (Contexto de Situación Actual)

Los logs se consultan en **modo solo lectura**; está prohibido modificar el nodo de producción durante la auditoría.

| Entorno | Fuente | Acceso |
|---|---|---|
| Local | Salida de `npm run dev`, volcados de los oráculos y artefactos Playwright (`src/test-results/`) | Directo |
| Local / Producción | Telemetría LLM persistida en MySQL | `/Admin/Logs` y `/Admin/System` (protegidas por `middleware.ts`) |
| Producción | Logs del contenedor web (`barcelonaxplorer_nginx`, Next.js en `:3000`) y de MySQL (`barcelonaxplorer_mysql`) | `ssh racso@10.0.10.11` + `docker logs --since <ventana> <contenedor>` |

Cada hallazgo derivado de logs debe citar la fuente, la ventana temporal y un extracto mínimo, sin copiar secretos ni datos personales.

---

## 3. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Ejecución del Ataque Asimétrico (El Hombre de Acero)

- **Dado** el delta `v2.0.1-doc-anchor..HEAD` (orquestación y streaming, escudo de supervivencia, afiliación con circuit breaker, drops reactivos de Telegram, i18n y Playwright) y los logs locales y de producción de la sección D.
- **Cuando** el Vértice Biológico ordena al auditor: *"Audita este delta bajo el Protocolo de Acero de SddIA, asumiendo el rol del antagonista sistémico"*.
- **Entonces** el auditor genera un **Log de Fricción** en `Documentacion/Auditorias/` que, para cada hallazgo, indica: vector de inquisición, severidad (P0–P3), archivo y línea, evidencia (código o extracto de log) y corrección propuesta.
- **Y** el Log incluye una sección específica de **calidad y coherencia de los tests existentes**.
- **Y** ningún hallazgo se da por válido sin evidencia verificable en el repositorio o en los logs (prohibido reportar sospechas como hechos).

### Escenario 2: Saneamiento y Purga Kaizen (Resolución de Fricción)

- **Dado** el Log de Fricción generado.
- **Cuando** se aplican las correcciones de los hallazgos P0 y P1 (los P2–P3 pueden diferirse como PBIs en `Documentacion/PBI/Pendiente/` con justificación).
- **Entonces** el cuádruple oráculo, ejecutado desde `src/`, devuelve código de salida 0:
  1. `npx eslint . --max-warnings 0`
  2. `npx tsc --noEmit`
  3. `npm test` (`vitest run`)
  4. `npm run test:e2e` (`playwright test`)
- **Y** ninguna corrección relaja aserciones, añade `eslint-disable` o elimina tests para conseguir el verde (Bucle Kaizen del Axioma IV).

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

- [ ] Log de Fricción publicado en `Documentacion/Auditorias/` con evidencia por hallazgo.
- [ ] Sección de calidad y coherencia de tests incluida en el Log.
- [ ] Hallazgos derivados de logs locales y de producción documentados con fuente y ventana temporal.
- [ ] Hallazgos P0/P1 corregidos; P2/P3 convertidos en PBIs pendientes.
- [ ] Cuádruple oráculo en verde con `--max-warnings 0`.
- [ ] Tag de cierre de ciclo creado.

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

La línea base verde **no** invalida la auditoría: los oráculos no detectan tests débiles, fugas lógicas ni deuda documental.

### A.3 Semillas de inquisición detectadas durante el refinamiento

No son el Log de Fricción; son puntos de partida verificados que el auditor debe confirmar y ampliar:

1. `src/features/ai-engine/groq-tests/groq-fast-ai.adapter.test.ts:51` usa `as any` silenciado con `eslint-disable-next-line`, en contra del Axioma II.
2. Persiste el árbol espejo `tests/` en la raíz (14 ficheros en `app/`, `security/`, `e2e/`, `integration/`), incluido en Vitest vía `../tests/**`, en contra del Colocated Testing del Axioma I.
3. `tests/e2e/` (live) y `tests/integration/` están excluidos del oráculo por defecto: evaluar si tienen ejecución periódica o son tests huérfanos.
4. `src/docker-compose.yml` declara `DATABASE_URL` con credenciales en claro.
5. El servicio Next.js se llama `barcelonaxplorer_nginx` sin ejecutar Nginx: nombre engañoso para diagnóstico en producción.
6. Tensión documental entre el barrel `index.ts` de `ADR-001` y la erradicación de barrels del PBI‑P0.
