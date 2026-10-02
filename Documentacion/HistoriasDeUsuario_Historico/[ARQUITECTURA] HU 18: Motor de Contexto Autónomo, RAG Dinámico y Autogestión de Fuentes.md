# [ARQUITECTURA] Historia de Usuario 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes (S+ Grade)

**Identificador:** HU-ARCH-CTX-018  
**Estatus:** Realizado (Completado y Certificado bajo Protocolo de Acero S+)  
**Fecha de Revisión:** 2026-09-30  
**Fecha de Finalización:** 2026-10-02  
**Autor:** Operador Técnico / Arquitectura BarcelonaXplorer  
**Módulo:** Contexto Hiperlocal (nueva feature `src/features/context-sources/`) / Memoria Cognitiva (LanceDB) / IA Gateway (System Two) / Panel Admin  
**Fase del Plan Maestro:** Extensión de la **Fase Beta** (*Ingesta de Datos y Motor IA*, [Plan Maestro §Fases](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/Plan_Maestro.md)). No pertenece a Fase Gamma (Monetización).  
**HU Antecesoras:**
- [HU 5: Memoria Cognitiva Vectorial](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/Historia%20de%20Usuario%205:%20Memoria%20Cognitiva%20Vectorial%20y%20Optimizaci%C3%B3n%20Termodin%C3%A1mica%20para%20LLM.md) — infraestructura LanceDB (`IVectorStorePort`, `LanceDbVectorAdapter`).
- [HU 17: Reconexión de la Memoria Cognitiva](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20HU%2017:%20Reconexi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20a%20Largo%20Plazo%20y%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20%28S+%20Grade%29.md) — **dependencia dura**: regla *fail-closed* de persistencia (solo se persisten vectores con `source === 'provider'` de `IEmbeddingPort.generateEmbedding`). Ya implementada en `TriageInputUseCase` (`memoryEmbedding.source !== 'fallback'`); esta HU la replica en la ingesta.
- [HU 16: IA Gateway](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20%28Aduana%20Universal%29%20y%20Enrutamiento%20Multi-Modal.md) — endpoint `/llm` (System Two) y registro de esquemas.

---

## Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Tubería de ingestión de contexto hiperlocal (eventos, equipamientos, POIs) desde fuentes externas hacia una nueva tabla LanceDB, gobernada por un catálogo relacional de fuentes en MySQL con *Circuit Breaker*, un proceso de mantenimiento/exploración que solo **propone** fuentes, y un panel de gobernanza para la aprobación humana.
- **Entorno:** Backend Next.js App Router (Route Handlers protegidos por `CRON_SECRET`), Prisma/MySQL (nuevo modelo `ContextSource`), LanceDB embebido (nueva tabla `context_memory`), IA Gateway `/llm` (System Two: extracción estructurada y *grounding* de Gemini), `GeminiEmbeddingAdapter` (768 dims), planificador *sidecar* `cron` en `src/docker-compose.yml`, panel `/Admin/Context` sobre `DataTable<T>`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Cero Alucinación / Pureza del Corpus):* Todo contenido externo entra como `unknown` y se parsea con `ContextEntrySchema` (Zod) antes de vectorizar. Ningún vector con `source === 'fallback'` se persiste (herencia HU-17). Ninguna fuente descubierta por IA entra en producción sin aprobación humana.
  - *Filtro B (Determinismo Hexagonal):* Cada tipo de fuente es una implementación de un único puerto `IContextSourceAdapter`; el ciclo de vida de una fuente es una máquina de estados declarativa; toda salida viaja en `OperationEnvelope<T>` (Axioma V).
  - *Filtro C (Eficiencia Térmica):* Deduplicación por `contentHash` antes de invocar LLM/embeddings; fuentes degradadas se excluyen del consumo; extracción con LLM solo para tipos no estructurados (HTML), nunca para JSON/iCal/RSS/SPARQL ya tipados.

---

## 1. Descripción General (INVEST)

**Como** Orquestador de Experiencias Turísticas,  
**Quiero** disponer de un ecosistema de procesos programados que ingiera contexto hiperlocal de Barcelona hacia LanceDB desde un catálogo vivo de fuentes, que desactive automáticamente las fuentes que fallan de forma sostenida y que proponga nuevas fuentes o correcciones para revisión humana,  
**Para** mantener el RAG actualizado sin mantenimiento manual constante, proteger la economía de tokens y garantizar que ninguna vía de información entre en el torrente productivo sin la validación explícita del Vértice Biológico.  

> **Nota de gobernanza:** Esta HU introduce **infraestructura nueva** (feature `context-sources`, modelo Prisma, tabla LanceDB, dos Route Handlers, una vista Admin). No modifica el pipeline conversacional de HU-17; **lo consume** (mismo `IVectorStorePort`, mismo `IEmbeddingPort`, misma regla fail-closed).

---

## 2. Fase 0 — Estudio y Validación de Fuentes (Prerrequisito Bloqueante)

> Observación del Vértice Biológico integrada: este es el punto de máximo valor y complejidad. Las fuentes listadas en el Anexo A son **candidatas**, no fuentes validadas. Antes de forjar el pipeline de ingesta hay que verificar empíricamente cada una.

**Entregables:**
- Informe `Documentacion/Fuentes/[ESTUDIO] Viabilidad de Fuentes de Contexto Hiperlocal.md`.
- Veredicto arquitectónico del parser HTML de servidor (§4.3).
- Seed YAML inicial (§3.3) con **solo** las fuentes que superen los cuatro criterios:

| Criterio | Qué se verifica | Evidencia exigida |
|---|---|---|
| **Acceso** | Endpoint alcanzable, sin autenticación o con clave gratuita obtenible; límites de peticiones documentados | Respuesta HTTP 200 real y captura del *rate limit* oficial |
| **Licencia** | Licencia de reutilización compatible (CC-BY, ODbL, CC0) o ToS que permitan uso automatizado | Enlace al texto de licencia/ToS |
| **Estructura** | Formato parseable de forma determinista (JSON, iCal, RSS, JSON-LD, SPARQL) o, si es HTML, viabilidad de extracción con LLM | Muestra cruda + mapeo a `ContextEntrySchema` |
| **Valor** | Cobertura de Barcelona, frescura (frecuencia de actualización) y campos mínimos (título, fecha o ubicación) | Conteo de entradas útiles en la muestra |

Además, la Fase 0 debe **ampliar el catálogo**: buscar fuentes viables no listadas en el Anexo A (agendas de distrito, centros cívicos, bibliotecas, mercados, festivales) y documentarlas con la misma matriz.

### 2.1 Directriz de Materialización (Constitución §IV — Protocolo de Trazabilidad y Materialización, Filtro Empírico)

Hasta que el estudio de viabilidad esté consolidado con muestras reales de datos, queda **prohibido** forjar:

| Bloqueado hasta cerrar Fase 0 | Motivo |
|---|---|
| Adaptadores `IContextSourceAdapter` (§4.2) | Sus fixtures y su mapeo dependen de las muestras crudas capturadas en el estudio |
| Modelo Prisma `ContextSource` y DDL en `after_symlink.yml` (§3) | El `type` enum y las categorías se cierran con las fuentes que resulten viables |
| Tabla LanceDB `context_memory` y `ContextEntrySchema` definitivo (§4.1) | Los campos mínimos exigibles se calibran con los datos reales |
| Seed YAML (§3.3) | Solo puede contener fuentes con veredicto *Viable* |

**Permitido en paralelo** (no depende de las fuentes): la capacidad de *grounding* en el IA Gateway (§6.1) y el esqueleto del *sidecar* planificador (§5) con un `crontab` vacío o con solo las entradas de procesos ya existentes (`/api/telemetry/prune`). Las entradas para `/api/context/*` se añaden al `crontab` únicamente cuando esos Route Handlers existan.

**Procedimiento de la Fase 0:** aislar cada fuente del Anexo A, ejecutar peticiones reales de validación contra su endpoint (capturando cabeceras de *rate limit* y una muestra cruda), y consolidar `[ESTUDIO] Viabilidad de Fuentes de Contexto Hiperlocal.md` con las muestras adjuntas.

---

## 3. Gobernanza de Fuentes (MySQL + Seed YAML)

Las fuentes no existen hoy en el repositorio en ningún formato. Nacen como entidad relacional en Prisma/MySQL para que su **estado operativo sobreviva a los despliegues inmutables de Ansistrano** (un fichero dentro de la *release* se sobrescribiría en cada `deploy`).

### 3.1 Modelo Prisma `ContextSource` (convención camelCase del esquema actual)

```prisma
model ContextSource {
  id             String              @id @default(cuid())
  sourceTag      String              @unique @db.VarChar(64)   // Identificador estable (ej. 'gencat-agenda-cultural')
  displayName    String              @db.VarChar(191)
  endpoint       String              @db.VarChar(2048)
  type           ContextSourceType                             // Selecciona el adaptador (matriz de adaptadores §4.2)
  category       String              @db.VarChar(64)           // 'EVENT' | 'VENUE' | 'POI' | 'NEWS' (Zod en frontera)
  status         ContextSourceStatus @default(PENDING_APPROVAL)
  failedAttempts Int                 @default(0)
  lastSuccessAt  DateTime?
  lastErrorAt    DateTime?
  lastError      String?             @db.VarChar(512)
  proposedBy     String              @default("SEED") @db.VarChar(32) // 'SEED' | 'HUMAN' | 'ARGOS'
  supersedesSourceTag String?        @db.VarChar(64)           // Fuente DEGRADED que esta propuesta de Argos corrige
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  @@index([status])
  @@map("context_sources")
}

enum ContextSourceType   { API_REST SOCRATA JSON_LD ICAL RSS SPARQL HTML_LLM }
enum ContextSourceStatus { ACTIVE DEGRADED PENDING_APPROVAL INACTIVE }
```

### 3.2 Máquina de Estados (Axioma III — declarativa, sin `if/else` anidados)

| Estado origen | Evento | Estado destino | Actor |
|---|---|---|---|
| `PENDING_APPROVAL` | Aprobar | `ACTIVE` | Humano (Admin) |
| `PENDING_APPROVAL` | Rechazar | `INACTIVE` | Humano (Admin) |
| `ACTIVE` | Ingesta OK | `ACTIVE` (`failedAttempts = 0`, `lastSuccessAt = now`) | Cron Ingesta |
| `ACTIVE` | Ingesta KO y `failedAttempts + 1 < 3` | `ACTIVE` (`failedAttempts + 1`) | Cron Ingesta |
| `ACTIVE` | Ingesta KO y `failedAttempts + 1 >= 3` | `DEGRADED` | Cron Ingesta (*Circuit Breaker*) |
| `DEGRADED` | Reactivar | `ACTIVE` (`failedAttempts = 0`) | Humano (Admin) |
| `DEGRADED` | Argos propone corrección | `DEGRADED` + nueva fila `PENDING_APPROVAL` enlazada | Sonda Argos |
| `ACTIVE` / `DEGRADED` | Desactivar | `INACTIVE` | Humano (Admin) |
| `INACTIVE` | Reactivar | `PENDING_APPROVAL` | Humano (Admin) |

Cualquier transición no listada es ilegal y debe rechazarse con `OperationEnvelope` de error. **Solo el actor Humano puede llevar una fuente a `ACTIVE`.** La Sonda Argos jamás escribe en filas `ACTIVE`; solo crea filas `PENDING_APPROVAL`.

### 3.3 Seed YAML (arranque)

- Fichero `src/features/context-sources/context-sources.seed.yml`, conforme a [`Estandar-Formato-Configuracion.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/Estandar-Formato-Configuracion.yml) (comentado, parseado con `YAML.parse()` + Zod).
- Se aplica **una sola vez** por `sourceTag` (idempotente: `upsert` que no pisa `status` ni `failedAttempts` de filas existentes). Las fuentes del seed nacen con `status: ACTIVE` únicamente si han superado la Fase 0; en caso contrario, `PENDING_APPROVAL`.
- **Despliegue:** la tabla `context_sources` debe añadirse al DDL idempotente de [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) (mecanismo real de sincronización de esquemas en el Nodo 11; el proyecto no ejecuta `prisma migrate` en producción).

---

## 4. Contrato Único de Fuente (Cada Fuente es una Implementación)

### 4.1 Esquema de salida normalizado `ContextEntrySchema` (Zod, frontera)

```ts
export const ContextEntrySchema = z.object({
  id: z.string().min(1),                 // `${sourceTag}:${externalId | hash}`
  sourceTag: z.string().min(1),
  category: z.enum(['EVENT', 'VENUE', 'POI', 'NEWS']),
  title: z.string().min(3).max(200),
  summary: z.string().min(10).max(1200), // Texto que se vectoriza
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  location: z.object({
    name: z.string().optional(),
    lat: z.number().min(41.2).max(41.5).optional(),   // Caja geográfica Barcelona (HU-1)
    lng: z.number().min(2.0).max(2.3).optional(),
  }).optional(),
  url: z.string().url().optional(),
  price: z.string().max(64).optional(),
  tags: z.array(z.string()).max(12).default([]),
  expiresAt: z.string().datetime(),      // endsAt + 1 día, o TTL por categoría (VENUE/POI: 90 días)
  contentHash: z.string().length(64),    // SHA-256 del payload normalizado (deduplicación)
});
```

### 4.2 Puerto `IContextSourceAdapter` (Pure DI, Axioma V)

```ts
export interface IContextSourceAdapter {
  readonly type: ContextSourceType;
  fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>>;
}
```

- Un adaptador por `ContextSourceType`, seleccionado desde una **matriz** `Record<ContextSourceType, IContextSourceAdapter>` (no `switch` disperso).
- Los adaptadores estructurados (`API_REST`, `SOCRATA`, `JSON_LD`, `ICAL`, `RSS`, `SPARQL`) parsean **sin LLM**: mapeo determinista + Zod.
- Solo `HTML_LLM` invoca el IA Gateway `/llm` (**System Two**, generación estructurada) con un esquema `context-entries` registrado en [`ia-gateway/src/endpoints/llm/schemas-registry.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/endpoints/llm/schemas-registry.ts). System One (endpoint `/decision`, Jev) **no** es apto para extracción de contenido: su contrato es de decisión tipada corta.
- Test colocalizado por adaptador con *fixtures* crudos capturados en la Fase 0 (`<adapter>.test.ts`).

### 4.3 Adaptador `HTML_LLM`: reducción determinista previa a la inferencia (Filtro C)

Inyectar el DOM crudo de una página en el LLM saturaría la ventana de contexto y dispararía el coste por fuente. El adaptador ejecuta, **antes** de cualquier llamada al gateway, una cascada determinista en el servidor:

1. **Atajo JSON-LD:** si el HTML contiene `<script type="application/ld+json">` con objetos `Event`/`LocalBusiness`, se delega al adaptador `JSON_LD` y **no se invoca LLM**. Es el caso esperado en las webs de ocio del Anexo A (A8).
2. **Purga estructural:** eliminar `<script>`, `<style>`, `<noscript>`, `<svg>`, `<iframe>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, comentarios HTML y atributos; conservar solo el texto del `<body>` (con `<main>`/`<article>` como raíz preferente si existen).
3. **Normalización y tope:** colapsar espacios, deduplicar líneas y **truncar a un máximo configurable** (valor inicial 12 000 caracteres). Si el texto útil supera el tope, se fragmenta por bloques semánticos y se procesa por lotes con límite de lotes por fuente.
4. **Inferencia acotada:** el texto purgado va a `/llm` con `engineType: 'REASONING_LLM'`, `responseFormat: 'json'`, `schemaId: 'context-entries'`, `temperature: 0`. La respuesta se parsea con `ContextEntrySchema` (Zod) en la frontera; entradas inválidas se descartan una a una, no el lote entero.

**Dependencia (entregable obligatorio de la Fase 0):** el proyecto adoptó `node-html-parser` (ultraligero, 0 dependencias) para extracción determinista. El estudio de la Fase 0 concluyó que el 100% de las fuentes viables se resuelven mediante conectores estructurados o JSON-LD, cancelando formalmente `HTML_LLM` en PBI-CTX-008 para ahorrar costes y latencia.

**Telemetría:** registrar por fuente `rawBytes`, `purgedChars`, `promptTokens` del gateway y `entriesValid/entriesRejected`, para auditar el ahorro térmico real.

---

## 5. Proceso de Ingesta y Autodefensa (Programado, diario)

**Mecanismo de disparo:** Route Handler `POST /api/context/ingest` protegido con `CRON_SECRET` (mismo patrón fail-closed que [`/api/telemetry/prune`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts): `Authorization: Bearer` o `x-cron-secret`, comparación en tiempo constante).

### 5.1 Planificador físico: contenedor *sidecar* en Docker Compose (patrón IaaC)

| Elemento | Especificación | Justificación |
|---|---|---|
| Servicio | `cron` (`container_name: barcelonaxplorer_cron`), `restart: unless-stopped`, `depends_on: [web]` | Misma convención de nombres que `barcelonaxplorer_web` / `barcelonaxplorer_ia_gateway` |
| Imagen | `alpine:3.20` (**versión fijada**), demonio BusyBox `crond -f -l 2` | `alpine:latest` es un puntero mutable y contradice el Dogma del Código Inmutable |
| Cliente HTTP | BusyBox `wget` (`wget -qO- --header="Authorization: Bearer ${CRON_SECRET}" --post-data='' http://web:3000/api/context/ingest`) | La imagen `alpine` no incluye `curl`; `wget` nativo asegura determinismo |
| Red | Red por defecto del proyecto Compose; DNS interno `web:3000` | Los Route Handlers `/api/context/*` quedan alcanzables solo por DNS interno |
| Horarios | Fichero `src/cron/crontab` versionado, montado `ro` en `/etc/crontabs/root` | Los horarios viven en Git y se despliegan con cada *release* de Ansistrano |
| Secreto | `env_file: .env.cron` con **solo** `CRON_SECRET` (idéntico al de `.env.web`) | El `crontab` versionado jamás contiene el secreto |
| Aislamiento | Sin volúmenes de datos, sin puertos publicados, sin acceso a `db` | El fallo del sidecar no afecta a la disponibilidad del monolito |
| Observabilidad | Salida de `crond` a `stdout` (`-l 2`); cada Route Handler registra su propio `TelemetryLog` | Trazabilidad en `docker logs` y en `/Admin/Logs` |

**Cadencias iniciales (`src/cron/crontab`):** ingesta diaria (`/api/context/ingest`, madrugada), mantenimiento semanal (`/api/context/maintain`, domingos 05:00) y purga programada de telemetría (`/api/telemetry/prune`).

**Coreografía por fuente `ACTIVE`:**

1. **Extracción normalizada:** `adapter.fetch(source)` → `OperationEnvelope<ContextEntry[]>`. Fallo de red, HTTP ≥ 400 o Zod inválido ⇒ `success: false`.
2. **Circuit Breaker:** aplicar la fila correspondiente de la máquina de estados (§3.2). Tras 3 fallos consecutivos la fuente pasa a `DEGRADED` y se excluye de ingestas futuras sin intervención humana. Un éxito resetea `failedAttempts`.
3. **Deduplicación térmica:** descartar entradas cuyo `contentHash` ya exista en `context_memory` (consulta por `id`). Solo el delta continúa.
4. **Vectorización verificada:** `IEmbeddingPort.generateEmbedding(summary)` (`GeminiEmbeddingAdapter`, modelo `embedding-001`, 768 dims, llamada directa a `@google/genai`; **no** pasa por el IA Gateway). Si `source === 'fallback'` la entrada **se descarta** y se emite telemetría `WARN` con contexto `LLM_ENGINE` (regla HU-17, Filtro A).
5. **Persistencia:** `IVectorStorePort.upsert('context_memory', docs)` con `VectorDocument { id, vector, text: summary, metadata: ContextEntry }`. Tabla **nueva**, separada de `cognitive_memories` (memoria de sesión) y `semantic_prompt_cache`.
6. **Caducidad:** al final de cada ejecución, `IVectorStorePort.delete('context_memory', { expiresAt < now })`. La tabla no acumula entropía muerta.
7. **Telemetría:** un `TelemetryLog` por ejecución con conteos (`fetched`, `deduplicated`, `persisted`, `discardedFallback`, `sourcesDegraded`).

---

## 6. Proceso de Mantenimiento (Sonda Argos, programado, semanal)

**Disparo:** `POST /api/context/maintain`, misma protección `CRON_SECRET`.

1. **Diagnóstico de fuentes `DEGRADED`:** para cada una, ejecutar sondas **deterministas** primero (seguir redirecciones 301/308, comprobar `robots.txt`, `HEAD` al endpoint). Solo si la sonda determinista no resuelve, invocar System Two para proponer una hipótesis de nueva URL a partir del error y el HTML de la página de error.
2. **Exploración de nuevas fuentes:** búsqueda estructurada de agendas culturales y portales Open Data de Barcelona mediante el *grounding* nativo de Gemini expuesto en el IA Gateway (§6.1). Argos consume exclusivamente esa capacidad; no se integran APIs de búsqueda de terceros (Filtro C, sin fragmentar la infraestructura).
3. **Registro de propuestas (Aduana de Aprobación Humana):** toda fuente descubierta o corregida se inserta en `context_sources` con `status: PENDING_APPROVAL`, `proposedBy: 'ARGOS'` y, si corrige una degradada, `supersedesSourceTag` apuntando al `sourceTag` original. **Argos nunca escribe `ACTIVE`.**

### 6.1 Resolución del spike: *grounding* de Gemini en el IA Gateway

**Decisión:** exponer la búsqueda con *grounding* nativa de Gemini a través del endpoint `/llm` existente. Contrato y restricciones:

| Aspecto | Especificación |
|---|---|
| Contrato `/llm` | Nuevo campo opcional `grounding: z.boolean().default(false)` en `LlmGenerateInputSchema` ([`llm.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/schemas/llm.schema.ts)) |
| Adaptador Gemini | [`GeminiAdapter.generate`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/endpoints/llm/gemini.adapter.ts) añade `config.tools = [{ googleSearch: {} }]` cuando `grounding === true`. |
| Restricción de motor | `grounding: true` solo se admite con `engineType: 'REASONING_LLM'`. Con `FAST_LLM` se rechaza en validación |
| Fail-closed de proveedor | Con `grounding: true`, el handler **omite** todo proveedor distinto de `GOOGLE` en la cadena y **omite el anclaje** (Groq). Si Gemini falla o su `CircuitBreaker` está `OPEN`, se responde con sobre de error 501 `UNSUPPORTED_CAPABILITY` |
| Métricas | `GatewayMetricsSchema` añade `grounded: z.boolean().default(false)` para auditar el coste |
| Salida | Propagación de `groundingSources` para que Argos registre el origen de cada propuesta |

---

## 7. Recuperación RAG (Consumo del Contexto)

Para que la ingesta tenga valor de usuario, el contexto llega al orquestador táctico:

- Nuevo puerto `IContextRetrievalPort.search(queryVector, { limit, category?, notExpired: true }) → OperationEnvelope<ContextEntry[]>` sobre `context_memory` con adaptador `LanceDbContextRetrievalAdapter`.
- El generador táctico ([`GenerateTacticalRouteUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/generate-tactical-route.use-case.ts)) recibe el puerto por constructor (opcional, *Pure DI*, *fail-soft*) e inyecta como máximo **K=5** entradas compactas (`title · startsAt · location.name · url`) en el prompt de System Two.
- Sin entradas o con LanceDB caído, el flujo continúa sin contexto y emite `WARN`.

---

## 8. Evolución del Panel de Observabilidad (`/Admin/Context`)

Nueva ruta bajo el perímetro Basic Auth existente (`src/middleware.ts`), construida con [`DataTable<T>`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/ui/data-table/index.ts):

- **Vista 1 — Contexto Vectorial Activo (`DataTable<ContextEntry>`):** entradas de `context_memory`. Columnas: `sourceTag`, `category`, `title`, `startsAt`, `expiresAt`; acción para inspeccionar el `metadata` crudo.
- **Vista 2 — Gobernanza de Fuentes (`DataTable<ContextSource>`):**
  - `status` con insignias: Verde `ACTIVE`, Rojo `DEGRADED`, Ámbar `PENDING_APPROVAL`, Gris `INACTIVE`.
  - `failedAttempts`, `lastSuccessAt`, `lastError`, `proposedBy`.
  - Acciones (Server Actions con Zod en frontera): Aprobar, Rechazar, Reactivar, Desactivar. Cada acción devuelve `OperationEnvelope`.

---

## 9. Criterios de Aceptación (Verificación Empírica)

- [x] **Escenario 0 — Fase 0 cerrada:**
  *Dado* el Anexo A de fuentes candidatas,
  *cuando* se entrega el estudio de viabilidad,
  *entonces* cada fuente tiene veredicto (Viable / No viable / Requiere clave) con evidencia de los cuatro criterios, y el seed YAML solo contiene fuentes viables.
  *Evidencia:* Cerrado con PBI-CTX-001 (`d21345f`) y documento `Documentacion/Fuentes/[ESTUDIO] Viabilidad de Fuentes de Contexto Hiperlocal.md`.

- [x] **Escenario 1 — Activación del Circuit Breaker:**
  *Dado* una fuente `ACTIVE` cuyo endpoint devuelve HTML que ya no valida `ContextEntrySchema`,
  *cuando* el proceso de ingesta falla en 3 ejecuciones consecutivas,
  *entonces* `context_sources.status = 'DEGRADED'`, `failedAttempts = 3`, y la cuarta ejecución no la consulta.
  *Evidencia:* Implementado y testeado en PBI-CTX-005 (`b68327f`) con `IngestContextUseCase` (`ingest-context.use-case.test.ts`).

- [x] **Escenario 2 — Reset tras éxito:**
  *Dado* una fuente `ACTIVE` con `failedAttempts = 2`,
  *cuando* la siguiente ingesta tiene éxito,
  *entonces* `failedAttempts = 0` y `lastSuccessAt` se actualiza.
  *Evidencia:* Implementado y testeado en PBI-CTX-005 (`b68327f`) con `IngestContextUseCase`.

- [x] **Escenario 3 — Aduana de Aprobación Humana:**
  *Dado* la Sonda Argos en ejecución,
  *cuando* propone una nueva fuente o una corrección,
  *entonces* la fila se crea con `PENDING_APPROVAL` y `proposedBy = 'ARGOS'`, y la ingesta diaria la ignora hasta que un humano la apruebe.
  *Evidencia:* Implementado y testeado en PBI-CTX-009 (`b043991`) con `MaintainContextUseCase` (`maintain-context.use-case.test.ts`).

- [x] **Escenario 4 — Intervención Biológica:**
  *Dado* `/Admin/Context` → Gobernanza de Fuentes con una fila `PENDING_APPROVAL`,
  *cuando* el Vértice Biológico ejecuta "Aprobar",
  *entonces* el estado muta a `ACTIVE` y la siguiente ingesta la consume. Toda transición ilegal (ej. aprobar una `ACTIVE`) devuelve `OperationEnvelope` de error sin mutar la fila.
  *Evidencia:* Implementado y testeado en PBI-CTX-010 (`44a09ea`) con `ContextAdminService` (`context-admin.service.test.ts`).

- [x] **Escenario 5 — Pureza del Corpus (herencia HU-17):**
  *Dado* un fallo del modelo de embeddings que activa el fallback determinista,
  *cuando* la ingesta procesa una entrada,
  *entonces* no se escribe ningún documento en `context_memory` y se emite telemetría `WARN`.
  *Evidencia:* Implementado y testeado en PBI-CTX-005 (`b68327f`) con descarte estricto en `IngestContextUseCase`.

- [x] **Escenario 6 — Deduplicación y Caducidad:**
  *Dado* una fuente cuyas entradas no han cambiado desde la última ingesta,
  *cuando* se ejecuta de nuevo,
  *entonces* no se invoca al embedder (0 llamadas), y las entradas con `expiresAt < now` han sido eliminadas.
  *Evidencia:* Implementado y testeado en PBI-CTX-005 (`b68327f`) mediante deduplicación térmica por `contentHash`.

- [x] **Escenario 7 — Recuperación RAG:**
  *Dado* `context_memory` con ≥1 entrada `EVENT` vigente relacionada semánticamente con la petición,
  *cuando* se genera una ruta táctica,
  *entonces* el prompt de System Two incluye esa entrada (verificable en telemetría) y el flujo no se rompe si LanceDB no responde.
  *Evidencia:* Implementado y testeado en PBI-CTX-011 (`5a4264f`) en `GenerateTacticalRouteUseCase` y `LanceDbContextRetrievalAdapter`.

- [x] **Escenario 8 — Seguridad de los disparadores:**
  *Dado* `CRON_SECRET` definido,
  *cuando* se invoca `/api/context/ingest` o `/api/context/maintain` sin secreto o con secreto inválido,
  *entonces* HTTP 401 y ninguna fuente es consultada.
  *Evidencia:* Implementado y testeado en PBI-CTX-005 (`b68327f`) y PBI-CTX-009 (`b043991`) con comparación en tiempo constante fail-closed.

- [x] **Escenario 9 — Grounding fail-closed en el Gateway:**
  *Dado* una petición `/llm` con `grounding: true` y `engineType: 'REASONING_LLM'`,
  *cuando* el proveedor `GOOGLE` falla o su `CircuitBreaker` está `OPEN`,
  *entonces* el gateway responde `success: false`, `exitCode: 501`, `errors[0]` con prefijo `UNSUPPORTED_CAPABILITY:` y `attemptedProviders` **no contiene** `GROQ` ni el anclaje.
  *Y* una petición con `grounding: true` y `engineType: 'FAST_LLM'` se rechaza en validación con HTTP 400.
  *Evidencia:* Implementado y testeado en PBI-CTX-002 (`f340ef1`) en `ia-gateway/src/endpoints/llm/`.

- [x] **Escenario 10 — Reducción determinista previa al LLM:**
  *Dado* una fuente `HTML_LLM` cuya página contiene JSON-LD `Event`,
  *cuando* se ingiere,
  *entonces* no se realiza ninguna llamada a `/llm` (0 invocaciones) y las entradas provienen del adaptador `JSON_LD`.
  *Y* para una página sin JSON-LD, el texto enviado a `/llm` no contiene `<script>`, `<style>`, `<nav>`, `<footer>` y no supera el tope configurado.
  *Evidencia:* Implementado en PBI-CTX-007 (`0463661`) con `JsonLdContextAdapter` (`node-html-parser`); cancelación formal de `HTML_LLM` en PBI-CTX-008 (`7aa1834`) por cobertura total determinista sin consumo de tokens.

- [x] **Escenario 11 — Sidecar planificador:**
  *Dado* `docker compose up` con el servicio `cron`,
  *cuando* vence una entrada del `crontab` montado en solo lectura,
  *entonces* el contenedor `web` recibe la petición por DNS interno con `Authorization: Bearer <CRON_SECRET>` y registra un `TelemetryLog` de ejecución; el sidecar no tiene puertos publicados ni acceso a `db`.
  *Evidencia:* Implementado en PBI-CTX-003 (`bcc14ef`) con servicio `cron` sobre `alpine:3.20` en `src/docker-compose.yml` y `src/cron/crontab`.

- [x] **Escenario 12 — Cuarteto de Oráculos en Verde:**
  `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` superan en verde en `src/` y en `ia-gateway/` (Axioma IV ampliado).
  *Evidencia:* 100% de la suite de tests (111 archivos de test, 613 tests en verde), `tsc --noEmit` limpio, `eslint` 0 advertencias, Next.js build producción exitoso.

---

## 10. Contratos, Axiomas y Trazabilidad

| Elemento | Referencia |
|---|---|
| Almacén vectorial (existente) | [`IVectorStorePort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/vector-store.port.ts) / [`LanceDbVectorAdapter`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/lancedb-vector.adapter.ts) |
| Embeddings (existente) | [`GeminiEmbeddingAdapter`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/gemini-embedding.adapter.ts) (`embedding-001`, 768 dims, fallback determinista no persistible) |
| Extracción estructurada (existente) | IA Gateway `/llm` — [`schemas-registry.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/endpoints/llm/schemas-registry.ts) |
| Patrón de disparador protegido (existente) | [`/api/telemetry/prune`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts) |
| Tabla UI (existente) | [`DataTable<T>`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/ui/data-table/types.ts) |
| Sincronización DDL en producción (existente) | [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) |
| Nuevo | `src/features/context-sources/` (`ContextEntrySchema`, `IContextSourceAdapter`, adaptadores, máquina de estados, `IngestContextUseCase`, `MaintainContextUseCase`, `IContextRetrievalPort`, seed YAML, tests colocalizados) |
| Nuevo | Modelo Prisma `ContextSource` + enums; tabla LanceDB `context_memory`; rutas `/api/context/ingest`, `/api/context/maintain`; página `/Admin/Context` |
| Nuevo (IA Gateway) | Campo `grounding` en `LlmGenerateInputSchema`; herramienta `googleSearch` en `GeminiAdapter`; gating fail-closed en `llm.handler.ts`; esquema `context-entries` en `schemas-registry.ts`; métrica `grounded` |
| Nuevo (IaaC) | Servicio `cron` en `src/docker-compose.yml`; `src/cron/crontab` (montaje `ro`); `.env.cron` validado por `src/deploy.sh`; DDL `context_sources` en `after_symlink.yml` |
| Nuevo (dependencia) | `node-html-parser` (0 dependencias) para JSON-LD determinista |
| Axiomas aplicados | I (feature autocontenida), II (Zod en cada frontera externa), III (máquina de estados + matriz de adaptadores + YAML canónico), IV (Cuarteto de Oráculos), V (`OperationEnvelope<T>`, Pure DI) |

---

## 11. Trazabilidad de Ejecución de PBIs (100% Realizados y Certificados)

| PBI | Descripción | Commit | Estatus |
|---|---|---|---|
| **PBI-CTX-001** | Estudio Empírico de Fuentes de Contexto y Veredicto del Parser HTML (P0) | [`d21345f`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-002** | Grounding de Gemini Fail-Closed en el Endpoint `/llm` del IA Gateway (P1) | [`f340ef1`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-003** | Sidecar Planificador Cron en Docker Compose (P2) | [`bcc14ef`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-004** | Gobernanza Relacional de Fuentes, Máquina de Estados y Seed YAML (P1) | [`b381d81`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-005** | Contrato de Fuente y Pipeline de Ingesta hacia LanceDB con Circuit Breaker (P1) | [`b68327f`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-006** | Adaptadores de Fuentes Estructuradas Zero-Token (Socrata, SPARQL, RSS, iCal, REST) (P1) | [`a76c270`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-007** | Adaptador JSON-LD Schema.org de Eventos y Lugares (P2) | [`0463661`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-008** | Cancelación Formal de Adaptador HTML_LLM por Eficiencia Térmica (P3) | [`7aa1834`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-009** | Sonda Argos de Mantenimiento y Exploración de Fuentes (P2) | [`b043991`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-010** | Panel de Gobernanza de Contexto en `/Admin/Context` (P2) | [`44a09ea`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |
| **PBI-CTX-011** | Recuperación RAG de Contexto Hiperlocal en el Generador Táctico (P1) | [`5a4264f`](file:///home/racso/Proyectos/BarcelonaXplorer) | Realizado |

---

## Anexo A — Fuentes Candidatas (Entrada a la Fase 0)

Aportadas por el Vértice Biológico y revisadas en este refinamiento:

| # | Fuente | Tipo previsto | Qué aporta | Estado de verificación |
|---|---|---|---|---|
| A1 | Open Data Ajuntament de Barcelona (API CKAN) | `API_REST` | Equipamientos, agenda, mercados, POIs municipales | Viable. Integrado en seed y verificado empíricamente. |
| A2 | Dades Obertes Generalitat de Catalunya — *Agenda cultural de Catalunya* (Socrata/SODA) | `SOCRATA` | Eventos culturales con fechas y ubicación | Viable. Integrado en seed y verificado empíricamente. |
| A3 | Dades Obertes Generalitat — *Equipaments de Catalunya* (Socrata) | `SOCRATA` | Museos, bibliotecas, teatros, centros cívicos | Viable. Integrado en seed y verificado empíricamente. |
| A4 | Diputació de Barcelona — Open Data / agenda de Biblioteques | `API_REST` / `RSS` | Actividades de la red de bibliotecas y parques | Viable (vía RSS/REST verificado). |
| A5 | Ticketmaster Discovery API | `API_REST` | Conciertos y grandes eventos | Viable con API Key gratuita. |
| A6 | Eventbrite API | `API_REST` | Eventos locales de nicho | No viable (endpoint de búsqueda pública retirado en 2020). Descartado. |
| A7 | Meetup GraphQL API | `API_REST` | Grupos y eventos por coordenadas/radio | No viable / comercial (exige suscripción Pro de pago). Descartado. |
| A8 | JSON-LD (Schema.org `Event` / `LocalBusiness`) en webs de ocio | `JSON_LD` | Eventos estructurados sin parsear HTML visual | Viable y determinista vía `node-html-parser`. |
| A9 | Feeds iCal (.ics) de Centros Cívicos y bibliotecas | `ICAL` | Calendarios de actividades | Viable y determinista. |
| A10 | Feeds RSS de medios locales (Betevé, revistas de barrio) | `RSS` | Noticias y agenda de barrio | Viable y determinista. |
| A11 | Wikidata SPARQL (`query.wikidata.org`) | `SPARQL` | Directorio geolocalizado de monumentos, esculturas, POIs | Viable, CC0 y determinista. |

---

## Anexo B — Registro de Refinamiento (v1.2 → v2.3)

(Véase historial de versiones en la documentación histórica para la relación detallada de ajustes desde la concepción inicial hasta la forja completa y certificación S+ Grade de los 11 PBIs).
