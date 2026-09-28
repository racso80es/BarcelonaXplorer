# [OPERATIVO] Documento Destilado: PBI - Saneamiento Hexagonal de Barrels Secundarios

**Identificador:** PBI-STEEL-022  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-28  
**Fecha de Certificación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)  
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-07, acotado fuera de PBI-STEEL-007  
**Módulo:** Arquitectura — barrels de feature  
**Entorno:** los ocho `src/features/*/index.ts` que no son `planner`  
**Prioridad:** Media (P2 — deuda catalogada; no purga el bundle de `/orchestrator`)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** PBI-STEEL-007 cerrado. Cada feature es un cambio aparte.  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** PBI-STEEL-007 se quedó en `planner`. Los otros barrels fueron saneados secuencialmente estableciendo su enclave server-only y superficie de dominio puro.
- **Entorno:** `i18n`, `triage`, `cognitive-memory`, `auth`, `telegram`, `ai-engine`, `telemetry`, `guide-templates`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Un cambio, una feature.
  - *Filtro B:* `i18n` ya exportaba solo dominio puro (VO, esquema, diccionario) y se certificó sin modificaciones innecesarias.
  - *Filtro C:* Cada feature con persistencia, adaptadores HTTP o casos de uso de servidor cuenta ahora con su archivo `server.ts` con protección `import 'server-only'`, y su `index.ts` exporta exclusivamente entidades, VOs, puertos y esquemas.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio del Axioma I,  
**Quiero** que la deuda de barrels quede nombrada por fichero y se sanee de uno en uno,  
**Para** no meter ocho módulos dentro del PBI que solo tiene que sacar Prisma del bundle del orquestador.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

Inventario forjado y saneado:

| Feature | Qué exporta el `index.ts` | Trato | Estatus |
|---|---|---|---|
| `i18n` | Value object, esquema y diccionario. Sin Prisma ni I/O | Revisado. Dominio puro mantenido | ✅ Conforme |
| `triage` | Schemas, VOs, perimeters, language detector | Creado `server.ts` (`TriageInputUseCase`, `ContextualIgnitionUseCase`, `OpenMeteoWeatherAdapter`) | ✅ Conforme |
| `cognitive-memory` | VOs (`DenseSemanticMatrixVo`), puertos y tipos de telemetría | Creado `server.ts` (`LanceDbCognitiveMemoryAdapter`, `LanceDbSemanticCacheAdapter`, `PrismaCognitiveMetricsRepository`, etc.) | ✅ Conforme |
| `auth` | `UserAnchor`, `TelegramChatId`, puertos, utils criptográficos, `TokenBucketRateLimiter` | Creado `server.ts` (`PrismaUserAnchorRepository`, `PrismaMagicLinkNonceRepository`, adaptadores AES-GCM/HMAC, casos de uso) | ✅ Conforme |
| `telegram` | Schemas de webhook, puertos, VOs reactivos, shelters, puertos de casos de uso | Creado `server.ts` (`TelegramBotApiGateway`, `AuditTelegramBotHealthUseCase`, `ReactivePatrolUseCase`) | ✅ Conforme |
| `ai-engine` | Interfaces de decisión, puertos de SLM/embedding, tipos y configuraciones puras, VOs, schemas | Creado `server.ts` (`GeminiClient`, `GeminiEmbeddingAdapter`, `JevClient`, adaptadores Groq, use cases de servidor) | ✅ Conforme |
| `telemetry` | `TelemetryEntry`, `TelemetryRepositoryPort`, tipos LLM, schemas Zod | Creado `server.ts` (`PrismaTelemetryRepository`, `PruneTelemetryUseCase`) | ✅ Conforme |
| `guide-templates` | VOs de slug, entidades, schemas, puertos de repositorios y traducción | Creado `server.ts` (`PrismaTemplateCategoryRepository`, `PrismaGuideTemplateRepository`, adaptador Gemini, use cases) | ✅ Conforme |

- [x] **CA-1 (`i18n`):** se deja como está y la certificación lo marca revisado como dominio puro.
- [x] **CA-2 (Una feature por cambio):** cada feature con I/O separa dominio puro en `index.ts` y superficie `server-only` en `server.ts`, migrando todos los Route Handlers y Server Components correspondientes.
- [x] **CA-3 (Sin big bang):** se sanearon ordenadamente los 8 barrels secundarios garantizando contratos estables en cada capa consumidora.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Ocho no significa ocho fugas.** `i18n` no arrastra servidor. Certificado como dominio puro intacto.
- **Enclave server-only:** Todos los archivos `server.ts` forjados (`src/features/*/server.ts`) importan `'server-only'` como primer mandato para blindar el árbol de dependencias contra fugas al cliente.
- **Oráculos en verde:** Validación estricta con `tsc --noEmit`, `eslint --max-warnings 0` y la suite de 432 tests en Vitest sin ninguna regresión.

---

## 4. Evidencia de Certificación

1. **Compilador TypeScript (`npx tsc --noEmit`):**
   ```
   Exit code: 0 (0 errores de tipado)
   ```
2. **Linter AST (`npm run lint`):**
   ```
   > temp_app@0.1.0 lint
   > cd .. && eslint --config ./src/eslint.config.mjs --max-warnings 0 src
   Exit code: 0 (0 warnings, 0 errors)
   ```
3. **Suite de Pruebas Automatizadas (`npx vitest run features app/api app/Admin`):**
   ```
   Test Files  82 passed (82)
   Tests       432 passed (432)
   Duration    23.59s
   ```
