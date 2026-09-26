# BarcelonaXplorer

> **Orquestador de Experiencias Híbrido, PWA y Conserjería Efímera impulsada por Inteligencia Artificial.**  
> Diseñado bajo la **Táctica del Refugio**: soberanía financiera (Ingeniería de Ingresos Pasivos desatendida), arquitectura defensiva de código único (**La Vía del Yunque**), orquestación en tiempo real sin fricción cognitiva (**La Vía de la Red**) y gobernanza simbiótica Grado S+ (**Vertical Slicing Canónico**).

[![Architecture](https://img.shields.io/badge/Architecture-Vertical%20Slicing%20Modular-blueviolet.svg)](#-arquitectura-del-sistema-vertical-slicing--monolito-modular)
[![Version](https://img.shields.io/badge/Version-v2.0.1--doc--anchor-blue.svg)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md)
[![Tests](https://img.shields.io/badge/Tests-323%20passing%20%7C%2065%20suites-success.svg)](#-instalación-y-ejecución-local)
[![Linter](https://img.shields.io/badge/Linter-0%20warnings%20%7C%20clean-success.svg)](#-instalación-y-ejecución-local)
[![Constitution](https://img.shields.io/badge/Governance-CONSTITUTION.md-gold.svg)](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md)

---

## 🧭 Índice de Contenidos

1. [Visión y Propuesta de Valor](#-visión-y-propuesta-de-valor)
2. [Ecosistema Tecnológico (Stack v2.0)](#-ecosistema-tecnológico-stack-v20)
3. [Arquitectura del Sistema (Vertical Slicing & Monolito Modular)](#-arquitectura-del-sistema-vertical-slicing--monolito-modular)
4. [Motor Cognitivo Dual y Respuesta Inmediata (Groq + Gemini)](#-motor-cognitivo-dual-y-respuesta-inmediata-groq--gemini)
5. [Memoria Cognitiva Vectorial y RAG Híbrido (LanceDB)](#-memoria-cognitiva-vectorial-y-rag-híbrido-lancedb)
6. [Canal Conversacional Omnicanal (Bot de Telegram)](#-canal-conversacional-omnicanal-bot-de-telegram)
7. [Blindaje Perimetral y Seguridad (`/Admin`)](#-blindaje-perimetral-y-seguridad-admin)
8. [Observabilidad y Órgano Sensorial (`/Admin/System` & `/Admin/Cognitive`)](#-observabilidad-y-órgano-sensorial-adminsystem--admincognitive)
9. [Componentes Tácticos de Interfaz (UI)](#-componentes-tácticos-de-interfaz-ui)
10. [Estructura del Proyecto](#-estructura-del-proyecto)
11. [Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
12. [Instalación y Ejecución Local](#-instalación-y-ejecución-local)
13. [Despliegue Continuo e Infraestructura (IaaC - Nodo 11)](#-despliegue-continuo-e-infraestructura-iaac---nodo-11)
14. [Axiomas y Dogmas de Ingeniería (CONSTITUTION.md)](#-axiomas-y-dogmas-de-ingeniería-constitutionmd)

---

## 🏛️ Visión y Propuesta de Valor

BarcelonaXplorer no es un buscador estático ni un directorio clónico de "Top 10 cosas que hacer". Se define como un **Orquestador de Experiencias Híbrido** enfocado en aniquilar la fricción de decisión del turista:

- **Fricción Cero (El Conserje Efímero):** El usuario introduce su contexto en lenguaje natural (tiempo disponible, ubicación actual, presupuesto, compañía e intereses).
- **Ruta Milimétrica y Ejecutable:** En lugar de listas dispersas, genera un itinerario cronológico exacto cruzado con variables ambientales (clima, horarios de cierre, desplazamientos peatonales reales).
- **El Escudo Anti-Trampas (Honestidad Radical):** Avisos hiperlocales sobre trampas para turistas, zonas masificadas a evitar y precauciones logísticas/seguridad de última milla.
- **Motor Híbrido:** Conjunción armónica entre un catálogo de *Templates Estáticos* curados manualmente (ej. "Ruta de la Sombra del Viento") y generación generativa dinámica en tiempo real.
- **Ingeniería de Ingresos Pasivos (Monetización Asimétrica):** Inyección desatendida y contextual de enlaces de afiliados (CPA/CPS) exclusivamente en los puntos de máxima fricción logística del usuario:
  - **Movilidad (Cansancio):** Cabify / FreeNow al finalizar tramos peatonales exigentes.
  - **Gastronomía (Incertidumbre):** Reservas directas vía TheFork tras el filtrado del Escudo Anti-Trampas.
  - **Cultura y Ocio (Colas y Esperas):** Entradas a monumentos y experiencias vía Civitatis, Tiqets o GetYourGuide.

---

## ⚡ Ecosistema Tecnológico (Stack v2.0)

| Capa / Subsistema | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Framework Base** | **Next.js 16 (App Router)** | Monolito modular, SSR/BFF, Streaming SSE y compilación Standalone |
| **Núcleo Front-End** | **React 19, TypeScript 5, Tailwind CSS 4** | Tipado estricto, reactividad moderna y estilos fluidos mobile-first |
| **Despliegue Universal** | **PWA (Progressive Web App)** | Manifiesto y Service Workers para experiencia nativa sin App Stores |
| **Inferencia Dual** | **Google Gemini SDK + Groq Cloud API** | Razonamiento profundo estructurado (Gemini) + Inferencia ultrarrápida (Groq/Llama 3.1) |
| **Memoria Vectorial Embebida** | **LanceDB** *(Local & Hybrid Search)* | Persistencia vectorial local (`storage/lancedb`), RAG contextual, nodos urbanos y memoria episódica |
| **Canal Conversacional** | **Telegram Bot API (Webhook + Polling)** | Interfaz conversacional omnicanal con streaming de respuestas y teclados dinámicos |
| **Validación y Aduana** | **Zod** | Aduana estricta de esquemas y triaje entrópico contra alucinaciones LLM |
| **Persistencia Relacional** | **MySQL 8 + Prisma ORM** | Logs polimórficos de telemetría, auditoría de IA y configuraciones del sistema |
| **Seguridad de Borde** | **Edge Runtime + Web Crypto API** | HTTP Basic Auth RFC 7617, `constantTimeEqual`, HSTS y redirección canónica 308 |
| **Gobernanza Declarativa** | **YAML Canónico + Safe Loading** | Ahorro del ~30% en tokens para agentes de IA y deserialización segura inmune a RCE |
| **Infraestructura e IaaC** | **Docker, Ansible & Ansistrano** | Despliegue atómico inmutable Zero Downtime en Nodo 11 (`10.0.10.11`) |
| **Suite de Pruebas** | **Vitest 4 + Testing Library** | 323 tests en 65 suites (features aisladas, dominio puro, adaptadores y perimetral) |

---

## 🏗️ Arquitectura del Sistema (Vertical Slicing & Monolito Modular)

Tras el veredicto empírico de fricción algorítmica ([`ADR-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) y [`PBI-ARCH-TEST-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Test%20de%20Fricci%C3%B3n%20Algor%C3%ADtmica%20-%20Evaluaci%C3%B3n%20Emp%C3%ADrica%20de%20Opciones%20Arquitect%C3%B3nicas%20%28A%20vs%20B%29.md)), la base de código abandonó la fragmentación en capas globales y adoptó de forma canónica **Vertical Slicing por Features**.

Cada módulo funcional es una cápsula autónoma y cohesionada en `src/features/`, mientras que los componentes y utilidades verdaderamente transversales residen en `src/shared/`:

```
src/
├── app/                          # Capa de Presentación, Páginas y Route Handlers (App Router)
│   ├── Admin/                    # Paneles de Control Protegidos (/Admin/System, /Admin/Cognitive)
│   ├── orchestrator/             # Interfaz inmersiva de orquestación dual
│   ├── api/                      # Route Handlers (/api/telemetry, /api/telegram, /api/triage, etc.)
│   ├── error.tsx                 # Sensor de excepciones de cliente (sendBeacon)
│   └── layout.tsx                # Layout raíz PWA
│
├── features/                     # CÁPSULAS VERTICALES AUTÓNOMAS (Vertical Slices)
│   ├── triage/                   # Triaje reactivo, validación Zod, scoring y aduana de entrada
│   │   ├── domain/               # Entidades, Value Objects e invariantes de triaje
│   │   ├── application/          # Casos de uso de triaje y puertos
│   │   └── infrastructure/       # Adaptadores de entrada y validadores
│   │
│   ├── telemetry/                # Sensor termodinámico, métricas Prometheus y persistencia de logs
│   │   ├── domain/               # Entidades de telemetría y tipos polimórficos
│   │   ├── application/          # Casos de uso (RecordLog, PruneTelemetry)
│   │   └── infrastructure/       # Adaptador Prisma y sensor de latencia
│   │
│   ├── auth/                     # Seguridad perimetral, tokens criptográficos, RBAC y guardias
│   │   ├── domain/               # Value Objects de autenticación y credenciales
│   │   ├── application/          # Casos de uso de validación de acceso
│   │   └── infrastructure/       # Middleware perimetral y Web Crypto constant-time
│   │
│   ├── cognitive-memory/         # Memoria vectorial LanceDB, RAG híbrido y nodos urbanos
│   │   ├── domain/               # Entidades de memoria semántica y embeddings
│   │   ├── application/          # Casos de uso (StoreMemory, QuerySimilarNodes)
│   │   └── infrastructure/       # Cliente LanceDB embebido y persistencia local
│   │
│   ├── ai-engine/                # JEV System One, dualidad Groq / Gemini y fallback termodinámico
│   │   ├── domain/               # Puertos de inferencia y modelos abstractos
│   │   ├── application/          # Casos de uso de inferencia rápida y profunda
│   │   └── infrastructure/       # Adaptadores GroqFastAi y GeminiProAi
│   │
│   ├── planner/                  # Motor de itinerarios, optimización de grafos y rutas tácticas
│   │   ├── domain/               # Entidades TacticalRoute, Waypoints, TimeSpans
│   │   ├── application/          # Generación y curación de rutas
│   │   └── infrastructure/       # Generadores de enlaces de afiliación y templates
│   │
│   └── telegram/                 # Bot conversacional, webhooks, streaming y comandos interactivos
│       ├── domain/               # Sesiones de usuario, eventos de chat y teclados
│       ├── application/          # Casos de uso (HandleTelegramMessage, StreamResponse)
│       └── infrastructure/       # Cliente HTTP Telegram API y webhook handler
│
├── shared/                       # NÚCLEO TRANSVERSAL COMPARTIDO
│   ├── config/                   # Gobernanza declarativa YAML y cargadores seguros
│   ├── domain/                   # Excepciones de dominio base y contratos compartidos
│   ├── infrastructure/           # Prisma Client compartido, utilidades criptográficas
│   └── ui/                       # Design System, DataTable<T> y componentes tácticos
│
└── middleware.ts                 # Centinela Perimetral (Edge Runtime Security Interceptor)
```

---

## ⚡ Motor Cognitivo Dual y Respuesta Inmediata (Groq + Gemini)

Para eliminar la percepción de latencia inerte (3-8 segundos en la generación de rutas complejas), BarcelonaXplorer desacopla la carga cognitiva en **dos vías concurrentes**:

```
                       ┌───────────────────────────────────┐
                       │        Prompt del Usuario         │
                       └─────────────────┬─────────────────┘
                                         │
                       ┌─────────────────┴─────────────────┐
                       │    BFF / Route Handler (Next.js)  │
                       └─────────┬───────────────────┬─────┘
          (Inmediato / SSE Stream)│                   │(Asíncrono / Pesado)
                                 ▼                   ▼
                  ┌────────────────────────┐  ┌────────────────────────┐
                  │   Vía Rápida (Groq)    │  │  Vía Lenta (Gemini)    │
                  │   Modelo: Llama 3.1 8B │  │  Modelo: Gemini 1.5/2.0│
                  ├────────────────────────┤  ├────────────────────────┤
                  │ • TTFT < 200 ms        │  │ • Latencia: 3 - 8 s    │
                  │ • Streaming (SSE)      │  │ • Consulta de Nodos    │
                  │ • Micro-tips / Radar   │  │ • JSON estructurado    │
                  │ • Escudo Anti-Trampas  │  │ • Rutas y Afiliación   │
                  └──────────────┬─────────┘  └───────────┬────────────┘
                                 │                        │
                                 ▼                        ▼
                  ┌────────────────────────┐  ┌────────────────────────┐
                  │   TacticalSparks UI    │  │   TacticalRoute Final  │
                  │  (Chispas asíncronas)  │  │  (Sustituye asimilación│
                  └────────────────────────┘  └────────────────────────┘
```

1. **Fase 1 (Ignición):** El usuario emite su prompt táctico. Se bloquea la caja de mando para evitar condiciones de carrera.
2. **Fase 2 (Asimilación & Chispas):** El canal Server-Sent Events (SSE) conecta con **Groq**. Cada chunk validado por Zod brota en la interfaz como un `TacticalSpark` (alertas ambientales, seguridad o logística) con latencia cero.
3. **Fase 3 (Resolución Táctica):** **Gemini** resuelve el razonamiento profundo, devolviendo la entidad `TacticalRoute` con paradas cronológicas, *Waypoints*, *TimeSpans* y enlaces de afiliados inyectados. La interfaz realiza la transición final y libera la caja de mando.

---

## 🧠 Memoria Cognitiva Vectorial y RAG Híbrido (LanceDB)

La vertical `src/features/cognitive-memory/` incorpora un motor de persistencia vectorial embebido ultraligero impulsado por **LanceDB**:

- **Almacenamiento Local Embebido:** Los vectores residen en el volumen local (`storage/lancedb`), eliminando la latencia de red de servicios vectoriales remotos y garantizando soberanía operativa.
- **RAG Híbrido:** Cruce multidimensional de similitud semántica con filtros de proximidad geográfica, horario de apertura y presupuesto.
- **Resiliencia Térmica:** Si el subsistema vectorial se encuentra en mantenimiento, el sistema activa un modo degradado no intrusivo sin interrumpir la experiencia de usuario.

---

## 🤖 Canal Conversacional Omnicanal (Bot de Telegram)

La vertical `src/features/telegram/` amplía la presencia de BarcelonaXplorer al ecosistema móvil sin fricción de descarga en App Stores:

- **Modo Dual (Webhook + Polling):** En producción responde vía Webhook criptográficamente autenticado (`POST /api/telegram/webhook`); en entornos de desarrollo local admite ejecución vía long-polling.
- **Streaming y Teclados Tácticos:** Renderizado progresivo de chispas informativas, botones interactivos de confirmación de ruta y enlaces directos de geolocalización.
- **Seguridad Perimetral:** Validación del secreto de webhook de Telegram (`X-Telegram-Bot-Api-Secret-Token`) y control de tasa de mensajes.

---

## 🛡️ Blindaje Perimetral y Seguridad (`/Admin`)

El acceso a `/Admin` y todas sus subrutas (`/Admin/:path*`) está custodiado en el borde por **`src/middleware.ts` (El Centinela del Yunque)**:

- **Runtime de Borde (Edge Runtime):** Intercepción en milisegundos sin consumir ciclos de renderizado del App Router. Proscripción absoluta de APIs nativas pesadas de Node.js o Prisma Client en esta capa.
- **Validación Criptográfica Nativa (Web Crypto API):** Hash SHA-256 en memoria (`crypto.subtle.digest`) y comparación en tiempo constante (`constantTimeEqual`) para erradicar ataques de canal lateral (*Timing Attacks*). Compatible con caracteres UTF-8.
- **Redirección Canónica 308 (RFC 7617):** Las peticiones a `/admin` en minúsculas son redirigidas de forma permanente a `/Admin`. Esto unifica el *realm* del navegador y previene fallos de resolución en sistemas de archivos *case-sensitive* (Linux Nodo 11).
- **Cifrado Forzoso en Tránsito:** En producción, las peticiones sin cifrar (`http://`) son redirigidas a `https://` (o rechazadas con `403 Forbidden` si transmiten credenciales en texto plano). Se inyectan cabeceras HSTS estrictas (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff`.
- **Principio Fail-Closed:** Si `ADMIN_USER` o `ADMIN_PASSWORD_HASH` no están configuradas en el entorno, el Centinela deniega automáticamente el acceso (`401 Unauthorized`) registrando una alerta sin exponer datos internos.

---

## 👁️ Observabilidad y Órgano Sensorial (`/Admin/System` & `/Admin/Cognitive`)

Sistema de trazabilidad desacoplado y polimórfico en el motor MySQL del Nodo 11 y métricas cognitivas en tiempo real:

```
[ Borde: Edge Runtime ]       [ Cliente: React Browser ]       [ Servidor: App Router ]       [ IA: Gemini/Groq ]
 src/middleware.ts             error.tsx / global-error        Route Handlers / Services      Interceptors / Adapters
 (fetch asíncrono)             (navigator.sendBeacon)          (Catch de Excepciones)         (Fire-and-Forget)
        │                              │                               │                              │
        └──────────────────────────────┴───────────────┬───────────────┴──────────────────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │  POST /api/telemetry/log (NodeJS) │
                                     │  - Escudo Zod y Sanitización      │
                                     │  - Respuesta rápida 202 Accepted  │
                                     └─────────────────┬─────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │     PrismaTelemetryRepository     │
                                     │     MySQL (Tabla TelemetryLog)    │
                                     └─────────────────┬─────────────────┘
                                                       │
                           Cronjob 03:00 AM ───────────┴──► POST /api/telemetry/prune
                           (Bearer CRON_SECRET)             (DEBUG/INFO > 7d | WARN/ERROR > 30d)
```

- **Fronteras Sensoriales:**
  - `SECURITY_PERIMETER`: Despacho no bloqueante desde el middleware ante anomalías o accesos no autorizados.
  - `CLIENT_UI`: Error boundaries (`error.tsx`, `global-error.tsx`) con despacho resiliente vía `navigator.sendBeacon`.
  - `SERVER_API`: Errores técnicos y excepciones capturadas en los Route Handlers.
  - `LLM_ENGINE`: Auditoría de tiempos de respuesta, modelos y conteo de tokens gobernada por el feature flag `TELEMETRY_LLM_ENABLED`.
- **Panel Cognitivo (`/Admin/Cognitive`):** Muestra el estado del índice vectorial LanceDB, recuento de nodos vectorizados, latencia de embeddings y tasa de aciertos de memoria.
- **Poda Ontológica Automatizada:** Endpoint `POST /api/telemetry/prune` protegido con `CRON_SECRET`. Purgado diario (03:00 AM) de registros operativos (`DEBUG`/`INFO` > 7 días) e incidencias (`WARN`/`ERROR` > 30 días) para blindar el volumen de almacenamiento del Nodo 11.
- **Principio Fail-Safe:** Ningún fallo o congestión en MySQL o LanceDB colapsa la experiencia de usuario ni propaga excepciones al hilo principal.

---

## 📊 Componentes Tácticos de Interfaz (UI)

### Componente Genérico de Tablas y Listas Tácticas (`DataTable<T>`)
Ubicado en `src/shared/ui/data-table/`, proporciona una solución completa, reutilizable y fuertemente tipada:
- **Tolerancia Cero a `any`:** Basado en genéricos `<T>` y en el extractor `ComparableValue`.
- **Ordenación Tridimensional:** Ciclo declarativo `asc` ➡️ `desc` ➡️ `null` con sincronización `aria-sort`.
- **Filtrado Multidimensional:** Búsqueda rápida por múltiples claves y selectores facetados por columna.
- **Gobernanza de Volumetría del DOM:** Paginación configurable (`pageSize`, `pageSizeOptions`) con estados de carga (`Skeleton`) y estados vacíos (*Empty state*) resilientes.

### Componentes de Diálogo y Mando
- **`OrchestratorBlock`:** Losa de mando asimétrica con avatar desvinculado flotante, diseño opaco para el usuario y *glassmorphism* con borde luminoso dinámico para la IA.
- **`TacticalSpark`:** Nodos de contexto minimalistas (clima, seguridad, logística, afiliación) con animaciones de latido y codificación semántica de urgencia.

---

## 📂 Estructura del Proyecto

```
BarcelonaXplorer/
├── ansible/                          # Infraestructura como Código (IaaC)
│   ├── hooks/
│   │   └── after_symlink.yml         # Recarga atómica de Docker tras actualización de symlink
│   ├── deploy.yml                    # Playbook maestro de Ansistrano
│   ├── inventory.ini                 # Nodo de producción (10.0.10.11)
│   └── rollback.yml                  # Playbook de reversión instantánea
│
├── Documentacion/                    # Acervo documental y arquitectura de acero
│   ├── ADR/                          # Decisiones Arquitectónicas (ADR-001 Vertical Slicing)
│   ├── Auditorias/                   # Evaluaciones empíricas y benchmarks de fricción
│   ├── Gobernanza/                   # Estándares YAML y políticas de configuración
│   ├── HistoriasDeUsuario/           # Historias de Usuario y Axiomas Constitucionales S+
│   └── PBI/                          # Product Backlog Items
│       ├── Realizado/                # PBIs completados y certificados empíricamente
│       └── Pendiente/                # PBIs en cola de ejecución
│
├── src/                              # Código fuente de la aplicación (Next.js Monolito Modular)
│   ├── app/                          # App Router (Páginas públicas, Admin y APIs)
│   ├── features/                     # 7 Cápsulas Verticales Autónomas
│   │   ├── triage/                   # Aduana de entrada, scoring y validación
│   │   ├── telemetry/                # Sensor termodinámico y métricas
│   │   ├── auth/                     # Autenticación perimetral y RBAC
│   │   ├── cognitive-memory/         # LanceDB vectorial y RAG híbrido
│   │   ├── ai-engine/                # Orquestador dual Groq / Gemini
│   │   ├── planner/                  # Generador de itinerarios y waypoints
│   │   └── telegram/                 # Bot conversacional omnicanal
│   ├── shared/                       # Núcleo transversal (config, domain, infrastructure, ui)
│   ├── prisma/
│   │   └── schema.prisma             # Esquema de persistencia relacional MySQL
│   ├── deploy.sh                     # Script de verificación y disparo automatizado de despliegue
│   ├── docker-compose.yml            # Orquestación de contenedores (Web + MySQL)
│   ├── Dockerfile                    # Multi-stage build para contenedor Standalone Alpine
│   ├── middleware.ts                 # Centinela de seguridad perimetral (/Admin)
│   └── package.json                  # Dependencias y scripts del proyecto
│
├── tests/                            # Suite completa de pruebas con Vitest (323 tests)
│   ├── features/                     # Pruebas unitarias y de integración por vertical
│   └── shared/                       # Pruebas de utilidades compartidas y UI
│
├── CONSTITUTION.md                   # Constitución Arquitectónica y Dogmas de Ingeniería
└── README.md                         # Documento maestro de referencia técnica del proyecto
```

---

## ⚙️ Configuración y Variables de Entorno

Crea el archivo `src/.env.local` tomando como base `src/.env.example`:

```bash
cp src/.env.example src/.env.local
```

### Tabla de Variables Críticas

| Variable | Descripción | Ejemplo / Valor por defecto |
| :--- | :--- | :--- |
| `MYSQL_ROOT_PASSWORD` | Contraseña root del motor MySQL | `secret_root_password` |
| `MYSQL_DATABASE` | Nombre de la base de datos | `barcelonaxplorer_db` |
| `MYSQL_USER` | Usuario de la aplicación | `bx_admin` |
| `MYSQL_PASSWORD` | Contraseña del usuario de base de datos | `secret_password` |
| `DATABASE_URL` | Cadena de conexión JDBC/Prisma | `mysql://bx_admin:secret@127.0.0.1:3306/barcelonaxplorer_db` |
| `GEMINI_API_KEY` | Clave API de Google AI Studio | `"AIzaSy..."` |
| `GEMINI_MODELS` | Cadena de modelos Gemini con fallback | `"gemini-1.5-flash,gemini-1.5-pro"` |
| `GROQ_API_KEY` | Clave API de Groq Cloud | `"gsk_..."` |
| `GROQ_FAST_MODEL` | Modelo ligero para inferencia rápida | `"llama-3.1-8b-instant"` |
| `GROQ_RADAR_SYSTEM_PROMPT` | Prompt de sistema para el Radar BX | Micro-consejos de logística y Escudo Anti-Trampas (< 250 tokens) |
| `LANCEDB_DATA_DIR` | Directorio local de persistencia vectorial LanceDB | `./storage/lancedb` |
| `TELEGRAM_BOT_TOKEN` | Token secreto del bot de Telegram | `"123456:ABC-DEF..."` |
| `TELEGRAM_WEBHOOK_SECRET` | Token de verificación de webhook de Telegram | Token seguro alfanumérico |
| `ADMIN_USER` | Usuario autorizado para `/Admin` | `admin` |
| `ADMIN_PASSWORD_HASH` | Hash SHA-256 de la contraseña de `/Admin` | *(Ver comando de generación inferior)* |
| `TELEMETRY_LLM_ENABLED` | Feature flag para auditar inferencias IA | `true` (auditar) / `false` (reposo térmico) |
| `CRON_SECRET` | Token Bearer para el endpoint `/api/telemetry/prune` | Token alfanumérico seguro para el cronjob |

#### Generación de Contraseña para el Panel `/Admin`:
```bash
echo -n "tu_contraseña_elegida" | sha256sum | awk '{print $1}'
```

---

## 🚀 Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/racso80es/BarcelonaXplorer.git
cd BarcelonaXplorer
```

### 2. Instalar dependencias
```bash
cd src
npm install
```

### 3. Configurar entorno y base de datos
Asegúrate de tener una instancia local de MySQL en ejecución o levántala con Docker Compose:
```bash
# Desde el directorio src/
docker compose up -d db
npx prisma generate
npx prisma db push
```

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará accesible en:
- **Página Principal / Landing:** [http://localhost:3000](http://localhost:3000)
- **Orquestador Táctico:** [http://localhost:3000/orchestrator](http://localhost:3000/orchestrator)
- **Panel Administrativo:** [http://localhost:3000/Admin](http://localhost:3000/Admin) *(solicitará credenciales HTTP Basic Auth)*
- **Telemetría del Sistema:** [http://localhost:3000/Admin/System](http://localhost:3000/Admin/System)
- **Observabilidad Cognitiva (LanceDB):** [http://localhost:3000/Admin/Cognitive](http://localhost:3000/Admin/Cognitive)
- **Webhook de Telegram:** [http://localhost:3000/api/telegram/webhook](http://localhost:3000/api/telegram/webhook)

### 5. Verificación de Tipado y Pruebas
```bash
# Comprobación de tipos estática
npx tsc --noEmit

# Ejecución de la suite completa de tests Vitest
npm test
```
*Vitest ejecutará los **323 tests** unitarios y de integración a lo largo de **65 suites** con cobertura en todas las verticales (`triage`, `telemetry`, `auth`, `cognitive-memory`, `ai-engine`, `planner`, `telegram`), middleware perimetral y componentes UI.*

---

## 🚢 Despliegue Continuo e Infraestructura (IaaC - Nodo 11)

El despliegue en producción hacia el **Nodo 11 (`10.0.10.11`)** se realiza mediante **Ansistrano** con un esquema inmutable y atómico de enlaces simbólicos (`releases/`, `shared/`, `current/`):

```
/home/racso/Despliegues/BarcelonaXplorer/
├── releases/
│   ├── 20260922120000/
│   ├── 20260922130000/
│   └── 20260922140000/
├── shared/
│   └── .env.local             # Sincronizado atómicamente con permisos 0600
├── current ───► releases/20260922140000/ (Symlink activo)
├── storage/
│   └── lancedb/               # Volumen de persistencia vectorial LanceDB
└── mysql_data/                # Volumen persistente de base de datos MySQL
```

### Despliegue Automatizado con Verificaciones Pre-Flight:
El script `src/deploy.sh` orquesta las validaciones de seguridad antes de transferir código:
1. Comprueba conectividad SSH con clave Ed25519 hacia `racso@10.0.10.11`.
2. Ejecuta `tsc --noEmit` y `npm test` para garantizar compilación y tests limpios.
3. Verifica la presencia de credenciales perimetrales en `src/.env.local`.
4. Dispara el playbook de Ansistrano (`ansible-playbook -i ansible/inventory.ini ansible/deploy.yml`).
5. Tras cambiar el symlink, el hook `after_symlink.yml` recarga los contenedores Docker (`docker compose down && docker compose up -d --remove-orphans`).

```bash
# Ejecutar despliegue a producción
./src/deploy.sh
```

### Rollback Instantáneo (Táctica del Refugio):
En caso de anomalía imprevista, revierte a la versión inmediatamente anterior sin tiempo de inactividad:
```bash
ansible-playbook -i ansible/inventory.ini ansible/rollback.yml
```

---

## 📜 Axiomas y Dogmas de Ingeniería (CONSTITUTION.md)

Todo el código de BarcelonaXplorer está blindado bajo las directivas de su **[Constitución Arquitectónica](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md)**:

1. **Aislamiento del Dominio:** Las dependencias fluyen estrictamente de fuera hacia adentro. El núcleo de negocio jamás conoce los detalles de su propia infraestructura (LLMs, MySQL, LanceDB, frameworks).
2. **Sustitución de Entropía:** Sustituir un proveedor de IA o cambiar el motor de persistencia no alterará un solo token de la lógica de negocio ni de las entidades de dominio.
3. **Prohibición de Primitivos (Value Objects):** Todo concepto (coordenadas, presupuestos, intervalos temporales) se encapsula en Objetos de Valor inmutables que autovalidan sus invariantes en el constructor. El estado inválido es físicamente imposible de instanciar en memoria.
4. **Vertical Slicing Canónico (Axioma I):** Erradicación de capas globales dispersas. Todo el código de una vertical funcional vive encapsulado en `src/features/<feature>/`, reduciendo la dispersión a ≤ 3 archivos por operación atómica para modelos de IA.
5. **Tolerancia Cero a `any`:** Proscripción absoluta del tipo `any`. Toda entropía externa entrante (especialmente JSONs de LLMs) pasa por el Triaje Entrópico de Zod antes de ingresar al sistema.
6. **Consolidación Declarativa YAML (Axioma III):** Primacía de YAML sobre JSON para configuración estática e IaaC (~30% de ahorro en tokens para IA), habilitación de JSONC documentado (`tsconfig.json`, `components.json`) y blindaje P0 con deserialización segura (`yaml.safe_load`).
7. **Filtro Empírico (Axioma IV):** El código teórico es ruido; solo el código desplegado y testado es vitalidad. Ningún cambio se valida por auto-aprobación del agente: la suite de tests (323 tests) y el linter AST (0 advertencias) son los únicos oráculos con potestad para conceder estado ejecutable.
