# BarcelonaXplorer

> **Orquestador de Experiencias Híbrido, PWA y Conserjería Efímera impulsada por Inteligencia Artificial.**  
> Diseñado bajo la **Táctica del Refugio**: soberanía financiera (Ingeniería de Ingresos Pasivos desatendida), arquitectura defensiva de código único (**La Vía del Yunque**) y orquestación en tiempo real sin fricción cognitiva (**La Vía de la Red**).

---

## 🧭 Índice de Contenidos

1. [Visión y Propuesta de Valor](#-visión-y-propuesta-de-valor)
2. [Ecosistema Tecnológico (Stack)](#-ecosistema-tecnológico-stack)
3. [Arquitectura del Sistema (Clean Architecture & Monolito Modular)](#-arquitectura-del-sistema-clean-architecture--monolito-modular)
4. [Motor de Interacción Dual y Respuesta Inmediata](#-motor-de-interacción-dual-y-respuesta-inmediata)
5. [Blindaje Perimetral y Seguridad (`/Admin`)](#-blindaje-perimetral-y-seguridad-admin)
6. [Órgano Sensorial y Telemetría Centralizada (`/Admin/System`)](#-órgano-sensorial-y-telemetría-centralizada-adminsystem)
7. [Componentes Tácticos de Interfaz (UI)](#-componentes-tácticos-de-interfaz-ui)
8. [Estructura del Proyecto](#-estructura-del-proyecto)
9. [Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
10. [Instalación y Ejecución Local](#-instalación-y-ejecución-local)
11. [Despliegue Continuo e Infraestructura (IaaC - Nodo 11)](#-despliegue-continuo-e-infraestructura-iaac---nodo-11)
12. [Axiomas y Dogmas de Ingeniería (CONSTITUTION.MD)](#-axiomas-y-dogmas-de-ingeniería-constitutionmd)

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

## ⚡ Ecosistema Tecnológico (Stack)

| Capa / Subsistema | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Framework Base** | **Next.js 16 (App Router)** | Monolito modular, SSR/BFF, Streaming SSE y compilación Standalone |
| **Núcleo Front-End** | **React 19, TypeScript 5, Tailwind CSS 4** | Tipado estricto, reactividad moderna y estilos fluidos mobile-first |
| **Despliegue Universal** | **PWA (Progressive Web App)** | Manifiesto y Service Workers para experiencia nativa sin App Stores |
| **Inferencia Dual** | **Google Gemini SDK + Groq Cloud API** | Razonamiento profundo estructurado (Gemini) + Inferencia ultrarrápida (Groq/Llama 3.1) |
| **Validación de Datos** | **Zod** | Aduana estricta de esquemas y triaje entrópico contra alucinaciones LLM |
| **Persistencia Relacional** | **MySQL 8 + Prisma ORM** | Logs polimórficos de telemetría, auditoría de IA y configuraciones del sistema |
| **Memoria Vectorial** | **LanceDB** *(Roadmap v2)* | Nodos urbanos vectorizados por atributos multidimensionales |
| **Seguridad de Borde** | **Edge Runtime + Web Crypto API** | HTTP Basic Auth RFC 7617, `constantTimeEqual`, HSTS y redirección canónica 308 |
| **Infraestructura e IaaC** | **Docker, Ansible & Ansistrano** | Despliegue atómico inmutable Zero Downtime en Nodo 11 (`10.0.10.11`) |
| **Suite de Pruebas** | **Vitest 4 + Testing Library** | Pruebas de dominio puro, adapters, middleware perimetral e integración |

---

## 🏗️ Arquitectura del Sistema (Clean Architecture & Monolito Modular)

El sistema implementa una **Arquitectura Hexagonal (Puertos y Adaptadores)** bajo el patrón **BFF (Backend For Frontend)**. Todas las capas conviven en un único contenedor sin dispersión de repositorios:

```
src/
├── app/                  # Capa de Presentación, Páginas y Route Handlers (Next.js App Router)
│   ├── Admin/            # Panel de control protegido (/Admin/System)
│   ├── orchestrator/     # Interfaz inmersiva de orquestación dual
│   ├── api/              # Route Handlers (/api/telemetry/log, /api/telemetry/prune, etc.)
│   ├── error.tsx         # Sensor de excepciones de cliente (sendBeacon)
│   └── layout.tsx        # Layout raíz PWA
├── domain/               # Núcleo de Negocio Puro (Independiente de Frameworks y Librerías)
│   ├── entities/         # Entidades de dominio puras (TacticalRoute, FastInsight)
│   └── exceptions/       # Excepciones de dominio (DomainException, InvalidCoordinatesException)
├── application/          # Lógica de Aplicación y Casos de Uso
│   ├── ports/            # Puertos de Entrada y Salida (Interfaces TypeScript puras)
│   │   └── out/          # FastInteractionAiPort, ItineraryPlannerAiPort, TelemetryRepositoryPort
│   └── use-cases/        # Casos de uso de negocio (PruneTelemetryUseCase, etc.)
├── infrastructure/       # Adaptadores Técnicos y Herramientas Externas
│   ├── ai/               # Clientes LLM (GeminiClient, GroqFastAiAdapter) y esquemas Zod
│   └── repositories/     # Adaptadores de persistencia (PrismaTelemetryRepository)
├── components/           # Componentes UI reutilizables
│   ├── ui/data-table/    # DataTable<T> genérico, reactivo y fuertemente tipado
│   ├── OrchestratorBlock.tsx # Losa de mando asimétrica (bloque de diálogo)
│   └── TacticalSpark.tsx     # Píldoras de micro-contexto y telemetría en tiempo real
└── middleware.ts         # El Centinela Perimetral (Edge Runtime Security Interceptor)
```

---

## ⚡ Motor de Interacción Dual y Respuesta Inmediata

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
                  │   Modelo: Llama 3.1 8B │  │  Modelo: Gemini 1.5    │
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

## 🛡️ Blindaje Perimetral y Seguridad (`/Admin`)

El acceso a `/Admin` y todas sus subrutas (`/Admin/:path*`) está custodiado en el borde por **`src/middleware.ts` (El Centinela del Yunque)**:

- **Runtime de Borde (Edge Runtime):** Intercepción en milisegundos sin consumir ciclos de renderizado del App Router. Proscripción absoluta de APIs nativas pesadas de Node.js o Prisma Client en esta capa.
- **Validación Criptográfica Nativa (Web Crypto API):** Hash SHA-256 en memoria (`crypto.subtle.digest`) y comparación en tiempo constante (`constantTimeEqual`) para erradicar ataques de canal lateral (*Timing Attacks*). Compatible con caracteres UTF-8.
- **Redirección Canónica 308 (RFC 7617):** Las peticiones a `/admin` en minúsculas son redirigidas de forma permanente a `/Admin`. Esto unifica el *realm* del navegador y previene fallos de resolución en sistemas de archivos *case-sensitive* (Linux Nodo 11).
- **Cifrado Forzoso en Tránsito:** En producción, las peticiones sin cifrar (`http://`) son redirigidas a `https://` (o rechazadas con `403 Forbidden` si transmiten credenciales en texto plano). Se inyectan cabeceras HSTS estrictas (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff`.
- **Principio Fail-Closed:** Si `ADMIN_USER` o `ADMIN_PASSWORD_HASH` no están configuradas en el entorno, el Centinela deniega automáticamente el acceso (`401 Unauthorized`) registrando una alerta sin exponer datos internos.

---

## 👁️ Órgano Sensorial y Telemetría Centralizada (`/Admin/System`)

Sistema de trazabilidad desacoplado y polimórfico en el motor MySQL del Nodo 11:

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
  - `LLM_ENGINE`: Auditoría de tiempos de respuesta, modelos y conteo de tokens gobernada por el feature flag `TELEMETRY_LLM_ENABLED` (coste térmico nulo si está inactivo).
- **Poda Ontológica Automatizada:** Endpoint `POST /api/telemetry/prune` protegido con `CRON_SECRET`. Purgado diario (03:00 AM) de registros operativos (`DEBUG`/`INFO` > 7 días) e incidencias (`WARN`/`ERROR` > 30 días) para blindar el volumen de almacenamiento del Nodo 11.
- **Principio Fail-Safe:** Ningún fallo o congestión en MySQL colapsa la experiencia de usuario ni propaga excepciones al hilo principal.

---

## 📊 Componentes Tácticos de Interfaz (UI)

### Componente Genérico de Tablas y Listas Tácticas (`DataTable<T>`)
Ubicado en `src/components/ui/data-table/`, proporciona una solución completa, reutilizable y fuertemente tipada:
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
├── Documentacion/                    # Acervo documental y arquitectura
│   ├── HistoriasDeUsuario/           # Historias de usuario refinadas y Plan Maestro
│   └── Fuentes/                      # Cuadernos de arquitectura, topologías y especificaciones
├── src/                              # Código fuente de la aplicación (Monolito Next.js)
│   ├── app/                          # App Router (Páginas públicas, Admin y APIs)
│   ├── application/                  # Puertos y Casos de Uso
│   ├── components/                   # Componentes UI (OrchestratorBlock, TacticalSpark, DataTable)
│   ├── domain/                       # Entidades y Excepciones puras de Dominio
│   ├── infrastructure/               # Clientes IA (Gemini/Groq), Repositorios Prisma y Esquemas Zod
│   ├── prisma/
│   │   └── schema.prisma             # Esquema de base de datos MySQL (TelemetryLog, SystemConfig)
│   ├── deploy.sh                     # Script de verificación y disparo automatizado de despliegue
│   ├── docker-compose.yml            # Orquestación de contenedores (Web + MySQL)
│   ├── Dockerfile                    # Multi-stage build para contenedor Standalone Alpine
│   ├── middleware.ts                 # Centinela de seguridad perimetral (/Admin)
│   └── package.json                  # Dependencias y scripts del proyecto
├── tests/                            # Suite completa de pruebas con Vitest
│   ├── app/                          # Pruebas de Route Handlers y endpoints
│   ├── application/                  # Pruebas de Casos de Uso
│   ├── components/                   # Pruebas de componentes React y DataTable
│   ├── infrastructure/               # Pruebas de adaptadores IA, Prisma y Middleware
│   └── integration/                  # Pruebas de integración sensorial y telemetría
├── CONSTITUTION.MD                   # Constitución Arquitectónica y Dogmas de Ingeniería
└── README.md                         # Documento de referencia técnica del proyecto
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
| `GROQ_FAST_MODEL` | Modelo ligero para inferencia rápida | `"llama-3.1-8b-instant"` o `"qwen/qwen3.8-27b"` |
| `GROQ_RADAR_SYSTEM_PROMPT` | Prompt de sistema para el Radar BX | Micro-consejos de logística y Escudo Anti-Trampas (< 250 tokens) |
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

### 5. Ejecutar la suite de pruebas
```bash
npm test
```
*Vitest ejecutará los 57+ tests unitarios y de integración (cobertura en middleware, telemetría, adaptadores Groq/Gemini, DataTable y componentes UI).*

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
└── mysql_data/                # Volumen persistente de base de datos MySQL
```

### Despliegue Automatizado con Verificaciones Pre-Flight:
El script `src/deploy.sh` orquesta las validaciones de seguridad antes de transferir código:
1. Comprueba conectividad SSH con clave Ed25519 hacia `racso@10.0.10.11`.
2. Ejecuta `tsc --noEmit` para garantizar compilación TypeScript limpia.
3. Verifica la presencia de credenciales perimetrales en `src/.env.local` (`ADMIN_USER`, `ADMIN_PASSWORD_HASH`, `TELEMETRY_LLM_ENABLED`, `CRON_SECRET`).
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

## 📜 Axiomas y Dogmas de Ingeniería (CONSTITUTION.MD)

Todo el código de BarcelonaXplorer está blindado bajo las directivas de su **Constitución Arquitectónica**:

1. **Aislamiento del Dominio:** Las dependencias fluyen estrictamente de fuera hacia adentro. El núcleo de negocio jamás conoce los detalles de su propia infraestructura (LLMs, MySQL, frameworks).
2. **Sustitución de Entropía:** Sustituir un proveedor de IA o cambiar el motor de persistencia no alterará un solo token de la lógica de negocio ni de las entidades de dominio.
3. **Prohibición de Primitivos (Value Objects):** Todo concepto (coordenadas, presupuestos, intervalos temporales) se encapsula en Objetos de Valor inmutables que autovalidan sus invariantes en el constructor. El estado inválido es físicamente imposible de instanciar en memoria.
4. **Tolerancia Cero a `any`:** Proscripción del tipo `any`. Toda entropía externa entrante (especialmente JSONs de LLMs) pasa por el Triaje Entrópico de Zod antes de ingresar al sistema.
5. **Filtro Empírico:** El código teórico es ruido; solo el código desplegado y testado es vitalidad. Toda funcionalidad se verifica empíricamente con suites de tests automatizados y pruebas de aislamiento.
