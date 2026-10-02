# [ARQUITECTURA] Historia de Usuario 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes (S+ Grade)

**Identificador:** HU-ARCH-CTX-018
**Estatus:** Refinado v2.3 / Listo para Implementación — ejecución condicionada: el primer PBI del backlog es la Fase 0 (Estudio Empírico de Fuentes), bloqueante según §2.1
**Fecha de Revisión:** 2026-09-30
**Autor:** Operador Técnico / Arquitectura BarcelonaXplorer
**Módulo:** Contexto Hiperlocal (nueva feature `src/features/context-sources/`) / Memoria Cognitiva (LanceDB) / IA Gateway (System Two) / Panel Admin
**Fase del Plan Maestro:** Extensión de la **Fase Beta** (*Ingesta de Datos y Motor IA*, [Plan Maestro §Fases](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/Plan_Maestro.md)). No pertenece a Fase Gamma (Monetización).
**HU Antecesoras:**
- [HU 5: Memoria Cognitiva Vectorial](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/Historia%20de%20Usuario%205:%20Memoria%20Cognitiva%20Vectorial%20y%20Optimizaci%C3%B3n%20Termodin%C3%A1mica%20para%20LLM.md) — infraestructura LanceDB (`IVectorStorePort`, `LanceDbVectorAdapter`).
- [HU 17: Reconexión de la Memoria Cognitiva](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2017:%20Reconexi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20a%20Largo%20Plazo%20y%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20%28S+%20Grade%29.md) — **dependencia dura**: regla *fail-closed* de persistencia (solo se persisten vectores con `source === 'provider'` de `IEmbeddingPort.generateEmbedding`). Ya implementada en `TriageInputUseCase` (`memoryEmbedding.source !== 'fallback'`); esta HU la replica en la ingesta.
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

**Dependencia (entregable obligatorio de la Fase 0):** el proyecto no tiene ningún parser HTML en `dependencies` (`jsdom` es solo `devDependency` de Vitest y queda vetado en runtime por peso). La Fase 0 emite un veredicto arquitectónico entre `cheerio` (que incluye `htmlparser2` y `parse5`), `htmlparser2` directo y otras ligeras (`node-html-parser`, `linkedom`), con medidas de tamaño instalado y tiempo de parseo sobre las muestras HTML reales. **Los PBIs de los adaptadores `JSON_LD` y `HTML_LLM` no pueden iniciarse sin ese veredicto.** Si la Fase 0 concluye que ninguna fuente viable necesita `HTML_LLM`, ese PBI se cancela. Prohibido parsear HTML con expresiones regulares.

**Telemetría:** registrar por fuente `rawBytes`, `purgedChars`, `promptTokens` del gateway y `entriesValid/entriesRejected`, para auditar el ahorro térmico real.

---

## 5. Proceso de Ingesta y Autodefensa (Programado, diario)

**Mecanismo de disparo:** Route Handler `POST /api/context/ingest` protegido con `CRON_SECRET` (mismo patrón fail-closed que [`/api/telemetry/prune`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts): `Authorization: Bearer` o `x-cron-secret`, comparación en tiempo constante).

### 5.1 Planificador físico: contenedor *sidecar* en Docker Compose (patrón IaaC)

Hoy no existe ningún planificador (ni en Ansible, ni en el host, ni en Compose). Para respetar la Vía del Yunque (Constitución §II, despliegue inmutable por Ansistrano) y no externalizar tareas al `crontab`/`systemd` del Nodo 11, el planificador se integra en la orquestación existente de [`src/docker-compose.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/src/docker-compose.yml):

| Elemento | Especificación | Justificación |
|---|---|---|
| Servicio | `cron` (`container_name: barcelonaxplorer_cron`), `restart: unless-stopped`, `depends_on: [web]` | Misma convención de nombres que `barcelonaxplorer_web` / `barcelonaxplorer_ia_gateway` |
| Imagen | `alpine` **con versión fijada** (ej. `alpine:3.20`), demonio BusyBox `crond -f -l 2` | `alpine:latest` es un puntero mutable y contradice el Dogma del Código Inmutable |
| Cliente HTTP | BusyBox `wget` (`wget -qO- --header="Authorization: Bearer ${CRON_SECRET}" --post-data='' http://web:3000/api/context/ingest`) | La imagen `alpine` **no incluye `curl`**; instalarlo en arranque (`apk add`) introduce red y no determinismo en el *boot*. Si se prefiere `curl`, se construye un `Dockerfile` mínimo versionado en `src/cron/` |
| Red | Red por defecto del proyecto Compose; DNS interno `web:3000` | El compose actual **no define redes con nombre**; no existe ninguna `bx_internal`. Los Route Handlers `/api/context/*` quedan alcanzables solo por DNS interno y el `web` solo publica `8080:3000` |
| Horarios | Fichero `src/cron/crontab` versionado, montado `ro` en `/etc/crontabs/root` | Los horarios viven en Git y se despliegan con cada *release* de Ansistrano |
| Secreto | `env_file: .env.cron` con **solo** `CRON_SECRET` (idéntico al de `.env.web`) | El `crontab` versionado jamás contiene el secreto; no se reutiliza `.env.web` para no exponer credenciales de MySQL al sidecar. `src/deploy.sh` debe validar `.env.cron` y la igualdad de `CRON_SECRET` con `.env.web` (mismo patrón que `IA_GATEWAY_SECRET`) |
| Aislamiento | Sin volúmenes de datos, sin puertos publicados, sin acceso a `db` | El fallo del sidecar no afecta a la disponibilidad del monolito; el sidecar solo emite HTTP |
| Observabilidad | Salida de `crond` a `stdout` (`-l 2`); cada Route Handler registra su propio `TelemetryLog` | Trazabilidad en `docker logs` y en `/Admin/Logs` |

**Verificación empírica obligatoria en la forja:** BusyBox `crond` propaga a los trabajos el entorno del proceso `crond` (a diferencia de Vixie cron), lo que hace viable leer `CRON_SECRET` desde `env_file`. Debe confirmarse con un trabajo de prueba antes de dar por cerrado el sidecar; si no se propagara, se envuelve el comando en un script que cargue el entorno explícitamente.

**Cadencias iniciales (`src/cron/crontab`):** ingesta diaria (`/api/context/ingest`, madrugada), mantenimiento semanal (`/api/context/maintain`) y, opcionalmente, migrar aquí el disparo de `/api/telemetry/prune`.

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

**Decisión:** exponer la búsqueda con *grounding* nativa de Gemini a través del endpoint `/llm` existente. Contrato y restricciones, contrastados con el código actual del gateway:

| Aspecto | Especificación |
|---|---|
| Contrato `/llm` | Nuevo campo opcional `grounding: z.boolean().default(false)` en `LlmGenerateInputSchema` ([`llm.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/schemas/llm.schema.ts)) |
| Adaptador Gemini | [`GeminiAdapter.generate`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/endpoints/llm/gemini.adapter.ts) añade `config.tools = [{ googleSearch: {} }]` cuando `grounding === true`. **Herramienta correcta para Gemini 2.x y posteriores** (los entornos configuran `GEMINI_MODELS="gemini-3.5-flash,gemini-3-flash-preview,gemini-3.6-flash"`; `gemini-2.5-flash` es solo el valor por defecto del código); `googleSearchRetrieval` es la herramienta *legacy* de Gemini 1.5 y no debe usarse |
| Restricción de motor | `grounding: true` solo se admite con `engineType: 'REASONING_LLM'` (cadena `['GOOGLE', 'GROQ']` en [`llm.handler.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/endpoints/llm/llm.handler.ts)). Con `FAST_LLM` (cadena `['GROQ', 'GOOGLE']`) se rechaza en validación |
| Fail-closed de proveedor | Con `grounding: true`, el handler **omite** todo proveedor distinto de `GOOGLE` en la cadena y **omite el anclaje** (que para `REASONING_LLM` es Groq por imposición de `fallback.config.ts`). Si todos los modelos Gemini fallan o el [`CircuitBreaker`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/health/circuit-breaker.ts) del proveedor `GOOGLE` está `OPEN`, se responde con sobre de error sin enrutar a un modelo sin búsqueda |
| Forma del error | El `OperationEnvelope` del gateway no tiene campo de código; se expresa como `createErrorEnvelope(['UNSUPPORTED_CAPABILITY: grounding requiere proveedor GOOGLE disponible'], 501, 'Capacidad no disponible')`. El cliente (`IaGatewayClient`) discrimina por el prefijo `UNSUPPORTED_CAPABILITY:` en `errors[0]` y por `exitCode 501` |
| Métricas | `GatewayMetricsSchema` añade `grounded: z.boolean().default(false)` para auditar el coste de las llamadas con búsqueda |
| Salida | Cuando la API devuelva `groundingMetadata` (fuentes citadas), el adaptador la propaga en `result.json.groundingSources` para que Argos registre el origen de cada propuesta |

**CA obligatorio del PBI de evolución del Gateway (spike residual):**
- Verificar la combinación `tools: [{ googleSearch: {} }]` + `responseMimeType: 'application/json'` con **cada modelo** de `GEMINI_MODELS` en `.env.ia-gateway` (hoy `gemini-3.5-flash`, `gemini-3-flash-preview`, `gemini-3.6-flash`), no con el valor por defecto del código. El gateway degrada entre modelos de esa lista, así que todos deben soportar la capacidad.
- La combinación se considera **incompatible** si ocurre cualquiera de estos casos: (a) la API la rechaza (4xx), (b) la respuesta llega sin `groundingMetadata` (búsqueda ignorada en silencio), (c) la salida no supera `JSON.parse` + Zod.
- Si es incompatible con algún modelo de la lista, se aplica el **plan de dos pasos** a todas las peticiones con `grounding: true`:
  1. Búsqueda con `grounding: true`, `responseFormat: 'text'`; se guardan `groundingSources`.
  2. Estructuración sin grounding, `responseFormat: 'json'`, `schemaId: 'context-entries'`, validación Zod posterior (el gateway no envía `responseSchema` a Gemini salvo que este PBI lo añada).
- **Anti-alucinación del paso 2:** toda URL del JSON estructurado debe estar en las `groundingSources` del paso 1; la entrada que no cumpla se descarta.
- El resultado de la verificación (modelo → compatible sí/no) se deja registrado en el PBI como evidencia.

**Nota:** Jev no participa en `/llm` (solo en `/decision`), por lo que el único proveedor "ciego" a excluir en la cadena de `/llm` es Groq.

> **Precisión terminológica:** en la [Constitución §IV.3](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) el *Filtro de Materialización* es el gate CI/CD del despliegue (linter + tipos + tests), y §III *Autopoiesis Crítica* es el blindaje contra la deriva de agentes IA. La barrera de aprobación humana de esta HU se denomina **Aduana de Aprobación Humana** y se ampara en §III.2 (Triaje Entrópico de payloads LLM) y en la soberanía del Vértice Biológico, no en §IV.3.

---

## 7. Recuperación RAG (Consumo del Contexto)

Para que la ingesta tenga valor de usuario, el contexto debe llegar al orquestador:

- Nuevo puerto `IContextRetrievalPort.search(queryVector, { limit, category?, notExpired: true }) → OperationEnvelope<ContextEntry[]>` sobre `context_memory`.
- El generador táctico ([`GenerateTacticalRouteUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/generate-tactical-route.use-case.ts)) recibe el puerto por constructor (opcional, *fail-soft*) e inyecta como máximo **K=5** entradas compactas (`title · startsAt · location.name · url`) en el prompt de System Two.
- Sin entradas o con LanceDB caído, el flujo continúa sin contexto y emite `WARN`.

---

## 8. Evolución del Panel de Observabilidad (`/Admin/Context`)

Nueva ruta bajo el perímetro Basic Auth existente (`src/middleware.ts`), construida con [`DataTable<T>`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/ui/data-table/index.ts) (`ColumnDef<T>`, `accessorFn → ComparableValue`) siguiendo el patrón de `/Admin/Cognitive` y `/Admin/System`.

- **Vista 1 — Contexto Vectorial Activo (`DataTable<ContextEntry>`):** entradas de `context_memory` (no confundir con la bitácora de `cognitive_memories` ya existente en `/Admin/Cognitive`). Columnas: `sourceTag`, `category`, `title`, `startsAt`, `expiresAt`; acción para inspeccionar el `metadata` crudo.
- **Vista 2 — Gobernanza de Fuentes (`DataTable<ContextSource>`):**
  - `status` con insignias: Verde `ACTIVE`, Rojo `DEGRADED`, Ámbar `PENDING_APPROVAL`, Gris `INACTIVE`.
  - `failedAttempts`, `lastSuccessAt`, `lastError`, `proposedBy`.
  - Acciones (Server Actions con Zod en frontera, una por transición legal de §3.2): Aprobar, Rechazar, Reactivar, Desactivar, Editar endpoint. Cada acción devuelve `OperationEnvelope`.

---

## 9. Criterios de Aceptación (Verificación Empírica)

- [ ] **Escenario 0 — Fase 0 cerrada:**
  *Dado* el Anexo A de fuentes candidatas,
  *cuando* se entrega el estudio de viabilidad,
  *entonces* cada fuente tiene veredicto (Viable / No viable / Requiere clave) con evidencia de los cuatro criterios, y el seed YAML solo contiene fuentes viables.

- [ ] **Escenario 1 — Activación del Circuit Breaker:**
  *Dado* una fuente `ACTIVE` cuyo endpoint devuelve HTML que ya no valida `ContextEntrySchema`,
  *cuando* el proceso de ingesta falla en 3 ejecuciones consecutivas,
  *entonces* `context_sources.status = 'DEGRADED'`, `failedAttempts = 3`, y la cuarta ejecución no la consulta.

- [ ] **Escenario 2 — Reset tras éxito:**
  *Dado* una fuente `ACTIVE` con `failedAttempts = 2`,
  *cuando* la siguiente ingesta tiene éxito,
  *entonces* `failedAttempts = 0` y `lastSuccessAt` se actualiza.

- [ ] **Escenario 3 — Aduana de Aprobación Humana:**
  *Dado* la Sonda Argos en ejecución,
  *cuando* propone una nueva fuente o una corrección,
  *entonces* la fila se crea con `PENDING_APPROVAL` y `proposedBy = 'ARGOS'`, y la ingesta diaria la ignora hasta que un humano la apruebe.

- [ ] **Escenario 4 — Intervención Biológica:**
  *Dado* `/Admin/Context` → Gobernanza de Fuentes con una fila `PENDING_APPROVAL`,
  *cuando* el Vértice Biológico ejecuta "Aprobar",
  *entonces* el estado muta a `ACTIVE` y la siguiente ingesta la consume. Toda transición ilegal (ej. aprobar una `ACTIVE`) devuelve `OperationEnvelope` de error sin mutar la fila.

- [ ] **Escenario 5 — Pureza del Corpus (herencia HU-17):**
  *Dado* un fallo del modelo de embeddings que activa el fallback determinista,
  *cuando* la ingesta procesa una entrada,
  *entonces* no se escribe ningún documento en `context_memory` y se emite telemetría `WARN`.

- [ ] **Escenario 6 — Deduplicación y Caducidad:**
  *Dado* una fuente cuyas entradas no han cambiado desde la última ingesta,
  *cuando* se ejecuta de nuevo,
  *entonces* no se invoca al embedder (0 llamadas), y las entradas con `expiresAt < now` han sido eliminadas.

- [ ] **Escenario 7 — Recuperación RAG:**
  *Dado* `context_memory` con ≥1 entrada `EVENT` vigente relacionada semánticamente con la petición,
  *cuando* se genera una ruta táctica,
  *entonces* el prompt de System Two incluye esa entrada (verificable en telemetría) y el flujo no se rompe si LanceDB no responde.

- [ ] **Escenario 8 — Seguridad de los disparadores:**
  *Dado* `CRON_SECRET` definido,
  *cuando* se invoca `/api/context/ingest` o `/api/context/maintain` sin secreto o con secreto inválido,
  *entonces* HTTP 401 y ninguna fuente es consultada.

- [ ] **Escenario 9 — Grounding fail-closed en el Gateway:**
  *Dado* una petición `/llm` con `grounding: true` y `engineType: 'REASONING_LLM'`,
  *cuando* el proveedor `GOOGLE` falla o su `CircuitBreaker` está `OPEN`,
  *entonces* el gateway responde `success: false`, `exitCode: 501`, `errors[0]` con prefijo `UNSUPPORTED_CAPABILITY:` y `attemptedProviders` **no contiene** `GROQ` ni el anclaje.
  *Y* una petición con `grounding: true` y `engineType: 'FAST_LLM'` se rechaza en validación con HTTP 400.

- [ ] **Escenario 10 — Reducción determinista previa al LLM:**
  *Dado* una fuente `HTML_LLM` cuya página contiene JSON-LD `Event`,
  *cuando* se ingiere,
  *entonces* no se realiza ninguna llamada a `/llm` (0 invocaciones) y las entradas provienen del adaptador `JSON_LD`.
  *Y* para una página sin JSON-LD, el texto enviado a `/llm` no contiene `<script>`, `<style>`, `<nav>`, `<footer>` y no supera el tope configurado.

- [ ] **Escenario 11 — Sidecar planificador:**
  *Dado* `docker compose up` con el servicio `cron`,
  *cuando* vence una entrada del `crontab` montado en solo lectura,
  *entonces* el contenedor `web` recibe la petición por DNS interno con `Authorization: Bearer <CRON_SECRET>` y registra un `TelemetryLog` de ejecución; el sidecar no tiene puertos publicados ni acceso a `db`.

- [ ] **Escenario 12 — Cuarteto de Oráculos en Verde:**
  `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` superan en verde en `src/` y en `ia-gateway/` (Axioma IV ampliado).

---

## 10. Contratos, Axiomas y Trazabilidad

| Elemento | Referencia |
|---|---|
| Almacén vectorial (existente) | [`IVectorStorePort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/vector-store.port.ts) / [`LanceDbVectorAdapter`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/lancedb-vector.adapter.ts) |
| Embeddings (existente) | [`GeminiEmbeddingAdapter`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/gemini-embedding.adapter.ts) (`embedding-001`, 768 dims, fallback determinista no persistible) |
| Extracción estructurada (existente) | IA Gateway `/llm` — [`schemas-registry.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/ia-gateway/src/endpoints/llm/schemas-registry.ts) (nuevo esquema `context-entries`) |
| Patrón de disparador protegido (existente) | [`/api/telemetry/prune`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts) |
| Tabla UI (existente) | [`DataTable<T>`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/ui/data-table/types.ts) |
| Sincronización DDL en producción (existente) | [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) |
| Nuevo | `src/features/context-sources/` (`ContextEntrySchema`, `IContextSourceAdapter`, adaptadores, máquina de estados, `IngestContextUseCase`, `MaintainContextUseCase`, `IContextRetrievalPort`, seed YAML, tests colocalizados) |
| Nuevo | Modelo Prisma `ContextSource` + enums; tabla LanceDB `context_memory`; rutas `/api/context/ingest`, `/api/context/maintain`; página `/Admin/Context` |
| Nuevo (IA Gateway) | Campo `grounding` en `LlmGenerateInputSchema`; herramienta `googleSearch` en `GeminiAdapter`; gating fail-closed en `llm.handler.ts`; esquema `context-entries` en `schemas-registry.ts`; métrica `grounded` |
| Nuevo (IaaC) | Servicio `cron` en `src/docker-compose.yml`; `src/cron/crontab` (montaje `ro`); `.env.cron` validado por `src/deploy.sh`; DDL `context_sources` en `after_symlink.yml` |
| Nuevo (dependencia) | Parser HTML ligero de producción para `HTML_LLM` (decisión en Fase 0; `cheerio` candidata) |
| Axiomas aplicados | I (feature autocontenida), II (Zod en cada frontera externa), III (máquina de estados + matriz de adaptadores + YAML canónico), IV (Cuarteto de Oráculos), V (`OperationEnvelope<T>`, Pure DI) |

**Fuera de alcance:** scraping de sitios cuyos ToS prohíban el acceso automatizado; traducción multilingüe de las entradas (se ingiere en el idioma de la fuente); ranking/reordenación avanzada del RAG.

---

## Anexo A — Fuentes Candidatas (Entrada a la Fase 0)

Aportadas por el Vértice Biológico y **revisadas** en este refinamiento. La columna *Estado de verificación* es el resultado del contraste documental; la Fase 0 debe confirmarlo empíricamente.

| # | Fuente | Tipo previsto | Qué aporta | Estado de verificación |
|---|---|---|---|---|
| A1 | [Open Data Ajuntament de Barcelona](https://opendata-ajuntament.barcelona.cat/es/desenvolupadors) (API CKAN) | `API_REST` | Equipamientos, agenda, mercados, POIs municipales | Plausible. Respetar el límite de peticiones publicado en la sección de desarrolladores. Identificar datasets concretos en Fase 0. |
| A2 | Dades Obertes Generalitat de Catalunya — *Agenda cultural de Catalunya* (Socrata/SODA) | `SOCRATA` | Eventos culturales con fechas y ubicación | Plausible. Filtrar por municipio vía SoQL; **el nombre exacto del campo de municipio y el ID del dataset deben confirmarse en el esquema del dataset** (no asumir `?municipi=Barcelona`). Sin token para volúmenes bajos; con *app token* para límites mayores. |
| A3 | Dades Obertes Generalitat — *Equipaments de Catalunya* (Socrata) | `SOCRATA` | Museos, bibliotecas, teatros, centros cívicos | Plausible. Confirmar ID de dataset y frescura. |
| A4 | Diputació de Barcelona — Open Data / agenda de Biblioteques | `API_REST` / `RSS` | Actividades de la red de bibliotecas y parques (Collserola) | **Por verificar**: existencia de API pública estable y cobertura del municipio de Barcelona (la XBM cubre principalmente la provincia). |
| A5 | Ticketmaster Discovery API | `API_REST` | Conciertos y grandes eventos (Palau Sant Jordi, Estadi Olímpic) | Plausible. Requiere clave gratuita; cuota diaria y límite por segundo documentados (confirmar cifras vigentes). Contenido comercial: revisar términos de uso para mostrar/enlazar. |
| A6 | Eventbrite API | `API_REST` | Eventos locales de nicho | **No viable como se describía**: Eventbrite retiró el endpoint público de búsqueda de eventos (`/v3/events/search/`) en 2020; la API solo expone eventos de organizaciones que el propio token administra. Descartar salvo hallazgo contrario en Fase 0. |
| A7 | Meetup GraphQL API | `API_REST` | Grupos y eventos por coordenadas/radio | **No gratuita**: el acceso a la API exige suscripción Meetup Pro. Descartar o clasificar como "Requiere pago". |
| A8 | JSON-LD (Schema.org `Event` / `LocalBusiness`) en webs de ocio (Time Out Barcelona, Teatre Barcelona, Barcelona Turisme) | `JSON_LD` | Eventos estructurados sin parsear HTML visual | Técnicamente correcto y determinista. **Condicionado a ToS y `robots.txt`** de cada sitio; verificar por dominio en Fase 0. |
| A9 | Feeds iCal (.ics) de Centros Cívicos y bibliotecas | `ICAL` | Calendarios de actividades | Plausible; identificar URLs concretas de feeds en Fase 0. |
| A10 | Feeds RSS de medios locales (Betevé, revistas de barrio) — secciones Agenda/Cultura | `RSS` | Noticias y agenda de barrio | Plausible; confirmar feeds activos. Categoría `NEWS`, TTL corto. |
| A11 | Wikidata SPARQL (`query.wikidata.org`) | `SPARQL` | Directorio geolocalizado de monumentos, esculturas, museos, con imágenes de Wikimedia | Correcto. Licencia CC0. Respetar la política de *User-Agent* y los límites del endpoint; categoría `POI`, TTL largo (90 días). |

**Notas transversales para la Fase 0:**
- Toda fuente comercial (A5) y todo scraping (A8) requieren veredicto legal explícito antes de entrar al seed.
- La caja geográfica de `ContextEntrySchema` (§4.1) descarta entradas fuera de Barcelona en la frontera, con independencia del filtro de la fuente.
- Priorizar tipos estructurados (A1–A3, A9–A11) sobre `HTML_LLM`: son deterministas y no consumen tokens.

---

## Anexo B — Registro de Refinamiento (v1.2 → v2.0)

Correcciones aplicadas por incoherencia, inexactitud o alucinación detectada contra el repositorio:

1. **Identificador:** `HU-17-CONTEXT-RAG` colisionaba con la HU 17 real (`HU-ARCH-COG-017`). Renombrado a `HU-ARCH-CTX-018`.
2. **Marcadores `[cite: N]`:** residuo de una herramienta externa sin correspondencia en el repositorio. Eliminados y sustituidos por enlaces reales.
3. **"Fase Gamma":** en el Plan Maestro, Gamma = Monetización; la ingesta de datos es Fase Beta. Corregido.
4. **"Las fuentes dejan de ser un YAML estático":** no existía ningún YAML de fuentes. Premisa reescrita.
5. **"Mutar sus estados de forma inmutable":** frase contradictoria; se explicita la intención real (persistencia del estado entre releases de Ansistrano).
6. **System One para parsear HTML:** System One es el endpoint `/decision` (Jev, decisión tipada). La extracción estructurada corresponde a System Two (`/llm` + `schemas-registry.ts`). Corregido.
7. **"Gemini Embedding API" sin condiciones:** el adaptador real (`embedding-001`, 768 dims) llama a `@google/genai` directamente, no vía gateway, y tiene fallback determinista. Se incorpora la regla fail-closed de HU-17 que la v1.2 omitía.
8. **"Cron Diario/Horario" sin mecanismo:** no hay cron en Ansible. Se especifica el patrón real (Route Handler + `CRON_SECRET`) y se declara el planificador como entregable.
9. **Sincronización de esquema:** producción usa DDL crudo en `after_symlink.yml`, no `prisma migrate`. Añadido como requisito de despliegue.
10. **Nomenclatura Prisma:** `source_tag`/`failed_attempts` (snake_case) contradecían la convención camelCase del esquema. Alineado con `@@map` para el nombre de tabla.
11. **Estado `INACTIVE` huérfano:** estaba declarado sin ninguna transición. Definida máquina de estados completa (Axioma III), incluido el reset de `failedAttempts` tras éxito, ausente en v1.2.
12. **"Filtro de Materialización" y "Autopoiesis Crítica / Crecimiento Personal":** términos usados con un significado distinto al constitucional ("Crecimiento Personal" no existe). Renombrado a *Aduana de Aprobación Humana* con cita correcta.
13. **"LLM con capacidad de búsqueda":** el gateway no expone búsqueda web ni grounding. Marcado como riesgo abierto con spike obligatorio.
14. **Tabla `context_memory` y `expiresAt`:** no existían; se declaran como nuevos y separados de `cognitive_memories`/`semantic_prompt_cache`. Se sustituye "JSON desnormalizado" por el contrato real `VectorDocument`.
15. **Vista 1 del panel:** solapaba con la bitácora existente de `/Admin/Cognitive`. Delimitada a `context_memory`.
16. **Consumo RAG ausente:** la v1.2 describía ingesta sin recuperación. Añadida §7 con puerto y escenario.
17. **Fuentes A6 (Eventbrite) y A7 (Meetup):** presentadas como viables/gratuitas; la búsqueda pública de Eventbrite fue retirada en 2020 y Meetup exige suscripción Pro. Reclasificadas. Filtro `?municipi=Barcelona` (A2) marcado como no verificado.
18. **Observaciones inline del Vértice Biológico:** integradas como Fase 0 bloqueante (§2) y contrato único de fuente (§4).

### v2.0 → v2.1 (integración de "Resolución de Riesgos Abiertos y Adecuaciones Arquitectónicas")

Decisiones adoptadas: *grounding* de Gemini en el gateway (§6.1), pre-paso determinista en `HTML_LLM` (§4.3), planificador *sidecar* en Compose (§5.1) y directriz de materialización (§2.1). Inexactitudes de la clarificación corregidas al integrarla:

19. **`googleSearchRetrieval`:** es la herramienta *legacy* de Gemini 1.5. El gateway usa `gemini-2.5-flash` por defecto; la herramienta correcta en `@google/genai` para Gemini 2.x es `googleSearch`.
20. **"Error `UNSUPPORTED_CAPABILITY`":** el `OperationEnvelope` del gateway no tiene campo de código de error (`errors: string[]`, `exitCode`). Se especifica cómo expresarlo dentro del contrato existente (prefijo en `errors[0]` + `exitCode 501`).
21. **"Modelo ciego como Jev o Groq":** Jev no participa en `/llm` (solo en `/decision`). El único proveedor a excluir en la cadena y en el anclaje es Groq. Se añade la restricción a `REASONING_LLM`, derivada de la matriz real de proveedores del handler.
22. **Compatibilidad grounding + JSON estructurado:** la clarificación la asumía; se marca como verificación empírica obligatoria con plan de dos pasos si no es compatible.
23. **"Circuit Breaker del Gateway":** confirmado que existe (`ia-gateway/src/health/circuit-breaker.ts`); no confundir con el breaker de afiliados retirado en `PBI-STEEL-011`.
24. **"Librerías como cheerio o jsdom":** ninguna es dependencia de producción (`jsdom` es solo `devDependency` para Vitest). Se declara la nueva dependencia como entregable y se veta `jsdom` en runtime por peso.
25. **"Red interna `bx_internal`":** no existe en `src/docker-compose.yml` (red por defecto sin nombre). Se usa el DNS interno real `web:3000`.
26. **`alpine:latest`:** puntero mutable, contradice la Vía del Yunque (Constitución §II). Versión fijada.
27. **"Comandos `curl`" en Alpine:** la imagen base no incluye `curl`. Se especifica BusyBox `wget` o un `Dockerfile` mínimo versionado.
28. **Inyección de `CRON_SECRET`:** la clarificación no indicaba de dónde lo toma el sidecar. Se define `.env.cron` segregado (sin reutilizar `.env.web`), validación en `deploy.sh` y verificación de la propagación de entorno de BusyBox `crond`.
29. **"Protocolo de Trazabilidad Empírica":** el nombre constitucional es §IV *Protocolo de Trazabilidad y Materialización (Filtro Empírico)*. Corregido; la directriz de prohibición se formaliza en §2.1 con la lista explícita de lo permitido en paralelo.

### v2.1 → v2.2 (cierre de huecos para la generación de PBIs)

30. **Estatus:** "Listo para Implementación" con la condición del PBI de Fase 0 escrita en el propio estatus, para no contradecir §2.1.
31. **Referencia cruzada en §3.1:** `type` apuntaba a §5.1 (planificador); corregido a §4.2 (matriz de adaptadores) en la propia HU, no solo en el PBI.
32. **Modelo de verificación del grounding:** el punto 19 daba `gemini-2.5-flash` como modelo del gateway; eso es solo el valor por defecto del código. Los entornos usan `gemini-3.5-flash`, `gemini-3-flash-preview` y `gemini-3.6-flash`, y la verificación se hace contra esa lista.
33. **Cómo falla grounding + JSON:** se añaden la búsqueda ignorada en silencio y el JSON inválido, además del rechazo explícito.
34. **"Guiada por esquema":** el gateway valida con Zod después de generar; no envía `responseSchema`. Se añade la regla de que las URLs del paso 2 deben estar en `groundingSources`.
35. **Cheerio frente a htmlparser2:** no son alternativas del mismo nivel (cheerio incluye htmlparser2). El veredicto del parser pasa a ser entregable de la Fase 0 y bloquea también el adaptador `JSON_LD`, no solo `HTML_LLM`.

### v2.2 → v2.3 (contraste previo a la generación de PBIs)

36. **Contrato de embeddings:** la HU (y la HU 17) citaban `IEmbeddingPort.embed()` y `origin: 'model' | 'deterministic-fallback'`. El contrato real es `generateEmbedding(text) → { vector, source: 'provider' | 'fallback' }` ([`embedding.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/embedding.port.ts)). La regla fail-closed ya está implementada en el triaje.
37. **Contexto de telemetría:** `AI_INFERENCE` no existe en `TelemetryContextEnum`; el valor real es `LLM_ENGINE`.
38. **Enlace de correcciones de Argos:** la máquina de estados exigía una fila "enlazada" sin campo que lo soportara. Añadido `supersedesSourceTag` al modelo.
39. **Backlog:** desglose en `PBI-CTX-001` … `PBI-CTX-011` en `Documentacion/PBI/Pendiente/`.
