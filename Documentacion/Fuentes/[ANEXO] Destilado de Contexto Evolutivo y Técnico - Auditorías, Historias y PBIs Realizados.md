# [ANEXO] Destilado de Contexto Evolutivo y Técnico — Auditorías, Historias de Usuario y PBIs Realizados

**Identificador:** FUENTE-ANEXO-EVOL-001  
**Fecha de Emisión:** 2026-09-29  
**Propósito:** Complementar los documentos fundacionales de `Documentacion/Fuentes/` con todo el contexto de valor teórico, funcional y técnico destilado de las fuentes evolutivas del proyecto (`Auditorias/`, `HistoriasDeUsuario_Historico/`, `PBI/Realizado/`).  
**Destinatario:** Cualquier LLM o agente de IA que necesite comprender el estado real del ecosistema BarcelonaXplorer antes de operar sobre él.  
**Referencia Normativa:** [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) · [Axiomas S+ Grade](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/%5BARQUITECTURA%5D%20Anexo%20Constitucional:%20Axiomas%20de%20Forja%20S+%20Grade%20%28Optimizaci%C3%B3n%20para%20IA%29.md) · [`ADR-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md)

---

## Tabla de Contenidos

1. [Propósito y Relación con las Fuentes Existentes](#1-propósito-y-relación-con-las-fuentes-existentes)
2. [Visión General del Estado Actual del Proyecto](#2-visión-general-del-estado-actual-del-proyecto)
3. [Decisiones Arquitectónicas Consolidadas](#3-decisiones-arquitectónicas-consolidadas)
4. [Stack Tecnológico Real y Topología de Código](#4-stack-tecnológico-real-y-topología-de-código)
5. [Subsistemas Funcionales Implementados](#5-subsistemas-funcionales-implementados)
6. [Subsistema de Infraestructura e IaaC](#6-subsistema-de-infraestructura-e-iaac)
7. [Lecciones Destiladas de Auditorías](#7-lecciones-destiladas-de-auditorías)
8. [Mapa de Deuda Técnica y Hallazgos Abiertos](#8-mapa-de-deuda-técnica-y-hallazgos-abiertos)
9. [Historias de Usuario Completadas (Resumen Evolutivo)](#9-historias-de-usuario-completadas-resumen-evolutivo)
10. [PBIs Pendientes (Backlog Actual)](#10-pbis-pendientes-backlog-actual)
11. [Glosario Terminológico del Proyecto](#11-glosario-terminológico-del-proyecto)

---

## 1. Propósito y Relación con las Fuentes Existentes

Los documentos existentes en `Documentacion/Fuentes/` definen la **visión fundacional** del proyecto: qué es BarcelonaXplorer, cómo se concibió su arquitectura, qué patrones de interacción se diseñaron y cuáles son sus reglas de negocio teóricas.

**Este anexo cubre lo que esos documentos NO contienen:** el contexto real de lo que se ha construido, los incidentes que lo han moldeado, las decisiones empíricas que han alterado el rumbo, las brechas descubiertas en producción y el inventario actualizado de deuda técnica. Es el puente entre la **teoría fundacional** y la **realidad del código en `main`**.

### Fuentes de las que se destila este documento:

| Fuente | Carpeta | Tipo de Contexto |
|---|---|---|
| Auditorías técnicas | [`Documentacion/Auditorias/`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/) | Incidentes reales, brechas de seguridad, fallos de producción, hallazgos forenses |
| Historias de Usuario históricas | [`Documentacion/HistoriasDeUsuario_Historico/`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/) | Especificaciones funcionales detalladas de cada feature implementada |
| PBIs realizados | [`Documentacion/PBI/Realizado/`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/) | Ítems de trabajo completados con criterios de aceptación superados |

---

## 2. Visión General del Estado Actual del Proyecto

### 2.1 Identidad del Producto

BarcelonaXplorer es un **Orquestador de Experiencias Turísticas impulsado por IA** centrado exclusivamente en Barcelona. No es un buscador estático ni un directorio. Opera como un "Conserje Efímero" que genera itinerarios cronológicos, ejecutables e hiper-personalizados a partir de un prompt en lenguaje natural, con inyección transparente de enlaces de afiliación (CPA/CPS) como modelo de ingresos pasivos.

### 2.2 Hitos Evolutivos Alcanzados

```
v1.0.0     → Hola Mundo (Next.js PWA en Docker/Nodo 11)
v2.0.0     → Arquitectura Definitiva (Vertical Slicing ratificado por ADR-001)
v2.0.1     → Ancla Documental (302 tests, 61 suites, 0 errores compilador)
v2.1.0     → Kaizen Perimetral (471+ tests, 88+ suites, 0 warnings ESLint)
v2.2.0     → Hardening IaaC (Higiene de disco, fuentes locales, DDL completo)
HEAD       → IA Gateway desplegado (HU-16 cerrada, microservicio activo, 489+ tests)
```

### 2.3 Métricas de Oráculos (Último Estado Certificado)

| Oráculo | Resultado |
|---|---|
| Compilador TypeScript (`tsc --noEmit`) | 0 errores (monolito + gateway) |
| Linter AST (`eslint --max-warnings 0`) | 0 avisos |
| Tests unitarios/integración (Vitest) | 91 ficheros / 489 tests (monolito) + 8 ficheros / 34 tests (gateway) |
| Tests E2E (Playwright) | 5 specs en verde |
| Empaquetado (`next build`) | Éxito, 22 rutas generadas |

---

## 3. Decisiones Arquitectónicas Consolidadas

### 3.1 ADR-001: Vertical Slicing vs. Capas (RATIFICADO)

**Decisión:** Se adopta **Vertical Slicing con Localidad de Comportamiento** como topología canónica oficial. Todas las features residen bajo `src/features/<modulo>/`.

**Evidencia empírica** (auditoría controlada A/B — [`AUD-ARCH-FRIC-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Friccion%20Algoritmica%20y%20Evaluacion%20Arquitectonica%20A%20vs%20B.md)):

| Métrica | Capas Fragmentadas | Vertical Slicing | Delta |
|---|:---:|:---:|:---:|
| Context Hops | 6 saltos | 2 saltos | **-66.7%** |
| Líneas leídas | ~1,450 | ~550 | **-62.1%** |
| Tiempo de forja | ~6.0 min | ~2.5 min | **-58.3%** |
| Errores de compilación | 1 | 0 | **-100%** |

**Consecuencia activa:** Todo código nuevo se organiza en `src/features/<modulo>/` con tests colocados (`*.test.ts`).

### 3.2 Segregación de Barrels (Cliente vs. Servidor)

**Origen:** Incidente crítico [`AUD-ARCH-BARREL-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Fuga%20de%20Dependencias%20de%20Servidor%20y%20Contaminacion%20de%20Barrels%20en%20Client%20Components.md) — `npm run build` fallaba y `/orchestrator` devolvía HTTP 500.

**Regla activa:**
- `src/features/<modulo>/index.ts` → Solo exportaciones isomorfas (esquemas, tipos, Value Objects).
- `src/features/<modulo>/server.ts` → Casos de uso y adaptadores de infraestructura (con `import 'server-only'`).
- `src/features/<modulo>/components/` → Componentes React `'use client'` consumidos por importación directa.
- **Prohibido** `export *` en barrels. Solo **Named Exports Explícitos**.

### 3.3 Cuarteto de Oráculos (Evolución de la Santa Trinidad)

**Origen:** La "Santa Trinidad" (tsc + eslint + vitest) tenía un punto ciego crítico: no detectaba fugas de módulos Node.js hacia el bundle del navegador.

**Regla activa (Axioma IV ampliado):** Ningún cambio es válido sin superar las cuatro puertas:
1. Compilador: `tsc --noEmit`
2. Linter AST: `eslint --max-warnings 0`
3. Tests: `vitest run`
4. **Empaquetado Real: `npm run build`** (Turbopack/Next.js)

### 3.4 IA Gateway como Microservicio Independiente (HU-16)

**Decisión:** La inferencia LLM se desacopla del monolito Next.js en un microservicio Hono/TypeScript (`ia-gateway/`) que:
- Centraliza todas las claves de proveedores de IA (Groq, Gemini, Jev).
- Implementa fallback multi-proveedor con Circuit Breaker.
- Expone endpoints tipados para decisiones rápidas (System One) y generación profunda (System Two).
- Se autentica mediante secreto compartido (`IA_GATEWAY_SECRET`).
- Se despliega como servicio separado en Docker Compose (`ia-gateway:3001`).

---

## 4. Stack Tecnológico Real y Topología de Código

### 4.1 Stack de Producción

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework Frontend+BFF | Next.js (App Router) | 16.3.5 | SSR + Standalone output |
| Lenguaje | TypeScript | 5.x | Modo estricto, cero `any` |
| Estilos | Tailwind CSS | 4.x | `source(none)` con `@source` explícitos |
| Validación de Fronteras | Zod | — | Parse, don't validate (Axioma II) |
| ORM Relacional | Prisma | — | MySQL, singleton Prisma |
| BD Relacional | MySQL 8.0 | — | Docker, red interna, volumen persistente |
| BD Vectorial | LanceDB | — | Embebida en Node.js, bind mount persistente |
| IA Gateway | Hono + TypeScript | — | Microservicio en `ia-gateway/` |
| Motor LLM Rápido (System One) | Groq API | — | Qwen 3.8-27B / Llama |
| Motor LLM Pesado (System Two) | Google Gemini | — | gemini-3.5-flash / gemini-3-flash-preview |
| Motor de Embeddings | Google Gemini Embedding API | — | text-embedding-004 (con fallback determinista) |
| IA Aduana (Triaje) | Jev AI (vía IA Gateway) | — | Clasificación de intención y anclaje geográfico |
| Tests Unitarios | Vitest | 4.1.11 | |
| Tests E2E | Playwright | — | Cuarto oráculo |
| Contenedorización | Docker + Docker Compose | — | Multi-servicio (web, mysql, ia-gateway) |
| Despliegue | Ansible + Ansistrano | — | IaaC, zero-downtime via symlinks |
| CI/CD | GitHub Actions | — | `.github/workflows/ci.yml` |
| Nodo de Producción | PC 11 (`10.0.10.11`) | Linux | NVMe 73 GB (raíz) + 118 GB (home) |
| Canal Omnicanal | Telegram Bot API | — | Webhook, deep links, patrulla reactiva |
| Internacionalización | next-intl / custom | — | es/en/ca, persistido en cookie |

### 4.2 Topología de Código (Vertical Slicing)

```
src/
├── app/                          # Capa de Presentación (Next.js App Router)
│   ├── Admin/                    # Panel de administración (/Admin/*)
│   │   ├── Cognitive/            # Observabilidad de memoria vectorial
│   │   ├── Logs/                 # DataTable de telemetría
│   │   └── System/               # Sensor termodinámico LanceDB
│   ├── api/                      # Route Handlers (endpoints REST)
│   │   ├── ai/                   # Proxy al IA Gateway
│   │   ├── auth/                 # Magic links
│   │   ├── guides/               # Templates estáticos
│   │   ├── orchestrator/         # SSE streaming
│   │   ├── planner/              # Generación de itinerarios
│   │   ├── telegram/             # Webhook, patrol, anchor-link
│   │   ├── telemetry/            # Log, prune
│   │   └── triage/               # Aduana de triaje
│   ├── orchestrator/             # Página del orquestador conversacional
│   └── page.tsx                  # Landing
│
├── features/                     # Verticales Funcionales (Vertical Slicing)
│   ├── ai-engine/                # Motores de IA y cliente del Gateway
│   │   └── ia-gateway/           # IaGatewayClient, contratos Zod
│   ├── auth/                     # Identidad sombra, magic links, middleware
│   ├── cognitive-memory/         # LanceDB, embeddings, RAG
│   ├── governance/               # Contratos del Códice Maestro
│   ├── guide-templates/          # Templates estáticos (MySQL/Prisma)
│   ├── i18n/                     # Internacionalización reactiva
│   ├── planner/                  # Generación de itinerarios tácticos
│   ├── telegram/                 # Bot, webhooks, patrulla, sonda
│   ├── telemetry/                # Telemetría centralizada
│   └── triage/                   # Aduana universal, matrices de densidad
│
├── shared/                       # Código compartido (domain puro)
│   └── domain/                   # Esquemas, entidades, value objects, puertos
│
├── components/                   # UI compartida
│   └── ui/                       # DataTable, botones, cards genéricas
│
└── middleware.ts                  # Perímetro Edge (identidad sombra, auth admin)

ia-gateway/                       # Microservicio independiente (fuera de src/)
├── src/
│   ├── endpoints/llm/            # Adaptadores por proveedor (Groq, Gemini, Jev)
│   ├── middleware/               # Auth, health check
│   └── index.ts                  # Entrypoint Hono
├── Dockerfile
└── vitest.config.ts
```

### 4.3 Topología de Infraestructura (Nodo 11)

```
10.0.10.11 (PC 11 — Nodo de Producción)
├── /home/racso/Despliegues/BarcelonaXplorer/
│   ├── current -> releases/<timestamp>Z     # Symlink Ansistrano
│   ├── releases/                             # Últimas 3 releases
│   └── shared/
│       ├── ia-gateway/                       # Código del microservicio (shared path)
│       ├── lancedb_data/                     # Volumen LanceDB persistente
│       └── mysql_data/                       # Volumen MySQL persistente
│
├── Docker Compose (desde current/)
│   ├── barcelonaxplorer_nginx (web)          # Next.js standalone :8080→3000
│   ├── barcelonaxplorer_mysql (db)           # MySQL 8.0 :3306 (solo red interna)
│   └── barcelonaxplorer_ia_gateway           # IA Gateway :3001
│
└── Nginx Host (reverse proxy)               # :80 → :8080
```

---

## 5. Subsistemas Funcionales Implementados

### 5.1 Identidad Sombra y Perímetro de Seguridad

**Estado:** ✅ 100% Operativo

- El middleware perimetral (`src/middleware.ts`) asigna un UUID v4 como cookie criptográfica `bx_session_id` (HttpOnly, Secure, SameSite=Lax) al primer acceso.
- Protección administrativa `/Admin` con Basic Auth + SHA-256 + comparación en tiempo constante.
- Cabeceras de blindaje HTTP: HSTS (2 años), X-Frame-Options: DENY, nosniff, strict-origin referrer.
- Cifrado de tokens de anclaje: AES-256-GCM (Web Crypto API) con IV de 12 bytes por invocación.
- Enlaces mágicos con firma HMAC-SHA256 y consumo atómico de nonce (anti-replay).

**Fuentes de evidencia:** [`AUD-SEC-TEST-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20de%20Seguridad%20-%20Cobertura%20de%20Tests%20y%20Blindaje%20Perimetral.md)

### 5.2 Aduana Universal y Triaje Entrópico

**Estado:** ✅ Operativo (con mejoras pendientes)

- El SLM (Jev AI, vía IA Gateway) clasifica la intención del usuario: anclaje geográfico a Barcelona, detección de ventana de tiempo, extracción de variables (grupo, presupuesto, vibe).
- Extracción orgánica "solo una variable por turno" sin formato interrogatorio.
- Evaluación termodinámica contra la Matriz de Densidad Polimórfica (umbral 60%).
- Repregunta atómica contextualizada si la densidad es insuficiente (SLM rápido via Groq en ~287ms).
- Despacho al orquestador pesado (Gemini) si se supera el umbral.
- Poda de matriz (`clearMatrixPayload`) tras generación exitosa.

**Brechas conocidas:**
- Memoria de trabajo volátil (reside en `Map` de RAM del proceso; se pierde al reiniciar). Solución propuesta: adaptador Prisma/Redis con TTL.
- La caché semántica vectorial carece de aislamiento de sesión (el resultado cacheado de una sesión puede servir a otra). Ref: [`AUD-OPS-STEEL-001 F-03`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md).

### 5.3 Motor Cognitivo y Orquestación

**Estado:** ✅ Operativo con IA Gateway

#### Flujo de inferencia actual:

```
Prompt del usuario
  → SLM (Jev AI vía IA Gateway, System One)  →  Clasificación + anclaje geográfico
  → Extracción de variables (TriageInputUseCase)
  → Evaluación de Matriz de Densidad
  → [Si densidad < 60%] → Repregunta (Groq/Qwen vía IA Gateway)
  → [Si densidad ≥ 60%] → Generación táctica (Gemini vía IA Gateway, System Two)
  → JSON estructurado validado por Zod → Renderizado en OrchestratorBlock
```

#### IA Gateway — Arquitectura de fallback:

- Cada endpoint (System One / System Two) define un proveedor principal y un ancla (fallback).
- Circuit breaker por proveedor: 3 fallos consecutivos → apertura del circuito → conmutación al ancla.
- Telemetría unificada bajo contexto `LLM_ENGINE` (modelo real, tokens, latencia, proveedor, success).

**Brecha conocida:** Pérdida del fallback multi-modelo intra-proveedor. La lista `GEMINI_MODELS` de degradación (gemini-3.5-flash → gemini-3-flash-preview → gemini-3.6-flash) ya no se itera; se salta directamente a otro proveedor. Ref: [`AUD-INFRA-GW-001 F-08`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md).

### 5.4 Memoria Cognitiva Vectorial (LanceDB)

**Estado:** ✅ Infraestructura desplegada, parcialmente conectada al pipeline

- LanceDB opera como motor embebido dentro del proceso Node.js (cero contenedores paralelos).
- Persistencia asegurada mediante bind mount en el Nodo 11 (`lancedb_data/`).
- Panel de observabilidad en `/Admin/System` (sonda de lectura/escritura, semáforo de salud).
- Panel cognitivo en `/Admin/Cognitive` (KPIs de memoria vectorial).
- Embeddings generados por Google Gemini Embedding API (`text-embedding-004`).
- **Fallback determinista activo:** Ante error 404/503 del modelo de embeddings, se genera un vector pseudoaleatorio derivado de un hash (¡esto corrompe la similitud semántica!). 16 eventos en producción.
- La caché semántica vectorial existe pero **no se ha activado con éxito en producción** (0 cache hits en los últimos 7 días).

**Brecha crítica:** El pipeline conversacional (`TriageInputUseCase`) no indexa fragmentos vectoriales de la conversación. La memoria semántica a largo plazo (HU-5) sigue desconectada.

### 5.5 Templates Estáticos (Motor Híbrido)

**Estado:** ✅ Operativo

- Catálogo de Templates de rutas curadas manualmente (Ruta de la Sombra del Viento, Barcelona de Riesgo, etc.).
- Estructura relacional MySQL con Prisma: `TemplateCategory` → `GuideTemplate` → `TemplateItem`.
- Cada `TemplateItem` incluye `tactical_metadata` (Escudo Anti-Trampas) y `affiliate_refs` (botones CPA).
- Renderizado unificado: mismo componente UI para rutas generadas por IA y rutas estáticas.
- Taxonomía dinámica inyectable desde administración.

### 5.6 Gamificación y UX

**Estado:** ✅ Operativo

- **Medidor Térmico (`ThermalMeter`):** Componente reactivo que visualiza la progresión de la Matriz de Densidad.
  - Fase Inerte: Tonos oscuros, botón bloqueado.
  - Desbloqueo (≥60%): Anillo emerald-400 pulsante.
  - Saturación (100%): Modo Explorador S+ Grade.
- **OrchestratorBlock:** Tarjeta asimétrica con avatar flotante, glassmorphism para respuestas IA.
- **TacticalSpark:** Cápsulas flotantes de micro-información durante la espera de generación.
- **Escudo de Supervivencia:** Advertencias de honestidad radical y drops preventivos de afiliación al saturar la matriz.

### 5.7 Telegram Bridge y Anclaje Táctico

**Estado:** ✅ Operativo (con brechas de seguridad corregidas en HU-15)

- Bot de Telegram (`@BXplorerBot`) con webhook verificado.
- Deep link paramétrico (`t.me/BXplorerBot?start=<TOKEN>`) para anclar sesiones cross-device.
- Token cifrado con AES-256-GCM; relación sessionId↔chatId consolidada en `user_anchors` (MySQL).
- Patrulla reactiva: endpoint `/api/telegram/patrol` para drops proactivos a sesiones ancladas.
- Sonda de salud de Telegram Bot API con timeouts defensivos.

**Brecha corregida en HU-15:** El secreto de patrulla usaba un literal hardcodeado como fallback (`bcn_patrol_secret_default`). Corregido a fail-closed.

### 5.8 Telemetría Centralizada

**Estado:** ✅ Operativo

- Modelo polimórfico `TelemetryLog` en MySQL con campo `payload` JSON dinámico.
- Contextos tipados: `SECURITY_PERIMETER`, `AI_INFERENCE`, `TRIAGE_EVALUATION`, `LLM_ENGINE`, `CLIENT_UI`, `SYSTEM`.
- Niveles: `DEBUG`, `INFO`, `WARN`, `ERROR`.
- Aislamiento Edge/Node: middleware delega telemetría vía HTTP async al Route Handler de Node.js.
- Poda ontológica automatizable vía `/api/telemetry/prune` (con secreto Bearer).
- DataTable interactiva en `/Admin/Logs` con filtrado, ordenación tridimensional y paginación.

### 5.9 Internacionalización (i18n)

**Estado:** ✅ Operativo

- Soporte reactivo para es/en/ca.
- Persistencia del idioma seleccionado en cookie.
- SingleFlight pattern para evitar duplicación de peticiones de traducción.
- Servicio de localización con adaptador Prisma (persistencia satélite).

### 5.10 Panel de Administración (`/Admin`)

**Estado:** ✅ Operativo

- `/Admin/Logs` — DataTable de telemetría con filtrado polimórfico.
- `/Admin/System` — Sensor termodinámico LanceDB (sonda de salud, semáforo, permisos).
- `/Admin/Cognitive` — Observabilidad de memoria vectorial (KPIs, tablas de vectores).
- Protección perimetral Basic Auth + SHA-256 (middleware Edge).

---

## 6. Subsistema de Infraestructura e IaaC

### 6.1 Pipeline de Despliegue

```
Developer (local)
  → git push origin main
  → GitHub Actions CI (tsc + eslint + vitest + build)
  → Ansible (desde máquina local del Vértice Biológico)
    → Ansistrano deploy (rsync → Nodo 11)
      → after_symlink.yml:
        1. docker compose build (sin destruir contenedores activos)
        2. docker compose up -d --no-deps --build web ia-gateway
        3. Migración DDL Prisma
        4. Sonda de salud HTTP
        5. Sonda de telemetría end-to-end
```

### 6.2 Lecciones Operativas del Nodo 11

**Incidente de Producción ([`AUD-OPS-PROD-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)):**
- Docker BuildKit acumuló 7.6 GB de caché, saturando la partición raíz al 100%.
- El hook `after_symlink.yml` ejecutaba `docker compose down` ANTES de compilar la nueva imagen.
- Al fallar la compilación por disco lleno, el stack quedó completamente huérfano.

**Correcciones aplicadas:**
- Técnica Build-Before-Swap: compilar imagen antes de tocar contenedores existentes.
- Tarea IaaC de higiene: `docker builder prune -f --keep-storage 2GB` antes de cada despliegue.
- Migración a fuentes tipográficas locales (`next/font/local`) para independizar la compilación de Google Fonts.
- DDL completo en hook post-symlink.

### 6.3 Incidente del Symlink IA Gateway ([`AUD-INFRA-GW-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md))

- PBI-GW-008 introdujo un symlink `src/ia-gateway → ../ia-gateway` para paridad con Ansistrano.
- Tailwind 4 seguía el symlink y Turbopack rechazaba rutas fuera de la raíz del proyecto.
- **Todos los oráculos estaban en verde** pero la app no arrancaba (ni `next dev` ni `next build`).

**Corrección:** Autodetección de fuentes Tailwind desactivada con `source(none)` + `@source` explícitos en `globals.css`.

**Lección destilada:** "La Santa Trinidad no ve el empaquetador. Es la segunda vez que `tsc + eslint + vitest` están en verde y la aplicación no arranca."

---

## 7. Lecciones Destiladas de Auditorías

### 7.1 Catálogo de Auditorías y su Aportación al Conocimiento

| ID | Título | Aportación Clave |
|---|---|---|
| `AUD-ARCH-FRIC-001` | Fricción Algorítmica A vs B | Ratificó Vertical Slicing como topología ganadora con métricas empíricas |
| `AUD-ARCH-BARREL-001` | Fuga de Barrels | Descubrió el punto ciego del Cuarteto de Oráculos; regla de segregación de barrels |
| `AUD-OPS-ANCHOR-001` | Ciclo Evolutivo v2.0.0 | Certificó 302 tests, catalogó deuda de linter, formalizó gobernanza normativa |
| `AUD-OPS-PROD-001` | Incidente de Despliegue | Saturación de disco por BuildKit; anti-patrón down-before-build |
| `AUD-SEC-TEST-001` | Seguridad Perimetral | Cifrado AES-256-GCM S+ Grade; 5 brechas catalogadas (timing attacks, cookies, DoS) |
| `AUD-MEM-LOC-001` | Memoria de Usuario | Validó identidad sombra, memoria multivuelta y fusión de matrices; expuso volatilidad |
| `AUD-OPS-STEEL-001` | Hombre de Acero | 1 P0 + 9 P1 con oráculos en verde; secreto hardcodeado, vectores falsos, regresión de barrels |
| `AUD-INFRA-GW-001` | IA Gateway + Symlink | Symlink rompe Turbopack; variables de entorno ausentes; lanzador local incompleto |

### 7.2 Patrones Recurrentes de Fallos

1. **Los oráculos estáticos no cubren el empaquetado:** Tres auditorías distintas (Barrel, Symlink, Hombre de Acero) demostraron que `tsc + eslint + vitest` pueden estar en verde con la aplicación completamente rota.

2. **Los secretos por defecto son deuda de seguridad activa:** Patrón repetido en la patrulla Telegram (`bcn_patrol_secret_default`) y en el IA Gateway (`development-secret-key-change-in-prod`). Mitigado parcialmente por `deploy.sh` pero vulnerable fuera del pipeline canónico.

3. **Las migraciones Big-Bang exigen verificar el entorno real, no solo `.env.example`:** El cierre de HU-16 documentó las variables pero no las inyectó en los ficheros de entorno reales.

4. **Toda exclusión de IaaC debe enumerar a todos los lectores:** El symlink se excluyó de `tsc` y Vitest pero no del escáner de Tailwind. Los lectores de un fichero bajo `src/` incluyen: tsc, Vitest, Tailwind, Docker build context, ESLint.

5. **El fallback silencioso corrompe datos:** El adaptador de embeddings genera vectores pseudoaleatorios cuando el modelo falla, corrompiendo silenciosamente la similitud semántica en LanceDB.

---

## 8. Mapa de Deuda Técnica y Hallazgos Abiertos

### 8.1 Deuda Activa de Producción (por severidad)

| Sev. | Hallazgo | Estado | Ref. |
|:---:|---|---|---|
| P1 | Vectores falsos de embedding persisten en LanceDB | Pendiente de restauración del motor | `AUD-OPS-STEEL-001 F-02` |
| P1 | Caché semántica sin aislamiento de sesión | PBI pendiente | `AUD-OPS-STEEL-001 F-03` |
| P1 | Regresión de barrels: Prisma en bundle cliente `/orchestrator` | Pendiente de corrección en planner | `AUD-OPS-STEEL-001 F-07` |
| P1 | Rollback automático no revierte la imagen Docker | PBI pendiente | `AUD-OPS-STEEL-001 F-09` |
| P1 | Fallback multi-modelo de Gemini perdido en IA Gateway | PBI pendiente | `AUD-INFRA-GW-001 F-08` |
| P2 | Memoria de trabajo volátil (Map en RAM) | Diseño conocido; adaptador Prisma/Redis propuesto | `AUD-MEM-LOC-001 §4.1` |
| P2 | Secreto por defecto en IA Gateway (Fail-Open) | Mitigado por `deploy.sh`; PBI pendiente | `AUD-INFRA-GW-001 F-10` |
| P2 | Oráculos de CI no incluyen gateway ni empaquetado | PBI pendiente | `AUD-INFRA-GW-001 F-13` |
| P2 | `web` recibe claves de IA que ya no necesita | PBI pendiente | `AUD-INFRA-GW-001 F-11` |
| P2 | Oráculo de salud post-despliegue ignora al gateway | PBI pendiente | `AUD-INFRA-GW-001 F-12` |
| P3 | Error React #412 en `/Admin/System` | 7 eventos en producción, causa no investigada | `AUD-OPS-STEEL-001` |

### 8.2 Brechas de Seguridad Residuales

| Brecha | Archivo | CWE | Estado |
|---|---|---|---|
| Comparación no constante en ruta de poda | `api/telemetry/prune/route.ts` | CWE-208 | PBI pendiente |
| Ausencia de límite de tamaño en payload de telemetría | `api/telemetry/log/route.ts` | CWE-400 | PBI pendiente |
| Validación incompleta de banderas de cookie en magic link | Test de magic-link | CWE-1004 | PBI pendiente |
| Fuga potencial de token Telegram en logs de error | Gateway Telegram | CWE-532 | PBI pendiente |

---

## 9. Historias de Usuario Completadas (Resumen Evolutivo)

Las historias completadas se encuentran en [`Documentacion/HistoriasDeUsuario_Historico/`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/). Este es el resumen destilado de cada una con su aportación al sistema:

| HU | Título | Aportación Principal |
|---|---|---|
| HU-1 | Anclaje Geográfico Absoluto | Filtro anti-alucinación: la IA solo opera dentro de Barcelona |
| HU-2.1 | Identidad Sombra (Edge Middleware) | Cookie perimetral `bx_session_id`, fricción cero de registro |
| HU-2.2 | Anclaje Táctico (Telegram Bridge) | Deep links cifrados, persistencia cross-device |
| HU-2 (Jev) | Aduana Universal y Triaje Entrópico | SLM para clasificación de intención, extracción orgánica de variables |
| HU-3 | Persistencia Vectorial Embebida (LanceDB) | Motor vectorial embebido, bind mount, sonda de salud |
| HU-4 | Sensor Termodinámico Vectorial | Panel `/Admin/System` con diagnóstico LanceDB |
| HU-5 | Memoria Cognitiva Vectorial | Destilación de matrices JSON hiper-densas, RAG optimizado (parcialmente conectado) |
| HU-6 | Matriz de Densidad Polimórfica | Patrón Envelope + Registry, pesos termodinámicos, umbral de supervivencia |
| HU-7.1 | Ignición Contextual | Saludo dinámico Zero-Shot con hora, clima y memoria previa |
| HU-8 | Gamificación Sensorial (ThermalMeter) | Medidor térmico agnóstico con efecto Zeigarnik |
| HU-9 | Arquitectura de Templates | Esquema relacional Prisma, taxonomía dinámica, motor híbrido |
| HU-10 | Gamificación Logística (Escudo de Supervivencia) | Tactical metadata, drops preventivos, Escudo Anti-Trampas |
| HU-11 | Ecosistema Reactivo y Drops de Alivio | Patrulla Telegram, fatiga geométrica, drops de Cabify/interiores |
| HU-12 | Internacionalización Reactiva | i18n persistido, SingleFlight, 3 idiomas |
| HU-13 | Blindaje E2E (Playwright) | Cuarto oráculo, 5 specs E2E, certificación continua |
| HU-14 | Códice Maestro Tecnológico | `.SddIA/library/codexes/tech-master-nextjs-prisma.md`, arnés multi-IDE |
| HU-15 | Auditoría Ontológica de Acero | 21 hallazgos (1 P0 + 9 P1), blindaje de patrulla, purga Kaizen |
| HU-16 | IA Gateway (Aduana Universal) | Microservicio Hono, enrutamiento multi-proveedor, fallback, Circuit Breaker |
| HU-INFRA-JEV-001 | Infraestructura Jev AI | Integración del motor Jev para clasificación y triaje |
| Plan Maestro | Arquitectura de Negocio | Visión estratégica fundacional, roadmap Alpha/Beta/Gamma |

---

## 10. PBIs Pendientes (Backlog Actual)

A fecha 2026-09-29, los PBIs pendientes residen en [`Documentacion/PBI/Pendiente/`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/) y derivan principalmente de la auditoría `AUD-INFRA-GW-001` (post-HU-16):

| PBI | Prioridad | Origen |
|---|:---:|---|
| Arranque Fail-Closed del IA Gateway (secreto obligatorio y anclaje verificado) | P1 | AUD-INFRA-GW-001 F-10 |
| Matriz Declarativa de Modelos por Proveedor y Degradación Intra-Proveedor | P1 | AUD-INFRA-GW-001 F-08 |
| Oráculo de Empaquetado y del IA Gateway en `audit-anchor.sh` y CI | P1 | AUD-INFRA-GW-001 F-13 |
| Lanzador Local Versionado `scripts/dev-up.sh` | P2 | AUD-INFRA-GW-001 F-17 |
| Segregación de Ficheros de Entorno por Servicio en Docker Compose | P2 | AUD-INFRA-GW-001 F-11 |
| Sonda del IA Gateway en el Oráculo de Salud Post-Despliegue | P2 | AUD-INFRA-GW-001 F-12 |
| Enmienda del Códice sobre Fuentes Tailwind y Symlinks | P3 | AUD-INFRA-GW-001 F-20 |
| Imagen del IA Gateway sin Tests y Recarga Real en Desarrollo | P3 | AUD-INFRA-GW-001 F-14 |
| Validación Runtime de `evaluateChoice` y Limpieza de Avisos de Tooling | P3 | AUD-INFRA-GW-001 F-18/F-19 |
| Telemetría Unificada bajo `LLM_ENGINE` para IA Gateway | P2 | Conversación anterior |

---

## 11. Glosario Terminológico del Proyecto

| Término | Definición en BarcelonaXplorer |
|---|---|
| **Vértice Biológico** | El humano (Racso), autoridad suprema del proyecto |
| **Protocolo de Acero S+ Grade** | Marco de gobernanza y calidad del código para desarrollo asistido por IA |
| **Vía del Yunque** | Principio de código único universal (Next.js PWA) |
| **Vía del Fuego** | Ingeniería de monetización (ingresos pasivos por afiliación) |
| **Vía de la Red** | Motor de inteligencia y fricción cero para el usuario |
| **Conserje Efímero** | Metáfora del producto: asistente IA temporal que desaparece tras su misión |
| **Identidad Sombra** | UUID de sesión invisible asignado sin registro explícito |
| **Aduana Universal** | Primera línea de triaje por SLM que filtra ruido y extrae variables |
| **Filtro A** | Anclaje geográfico a Barcelona (anti-alucinación) |
| **Filtro B** | Validación de relevancia semántica |
| **Filtro C** | Descarte de interacciones inútiles (ruido) |
| **Matriz de Densidad** | Estructura polimórfica que acumula variables del usuario con pesos |
| **Umbral de Supervivencia** | Porcentaje mínimo (60%) de densidad para activar la generación |
| **Escudo Anti-Trampas** | Metadatos tácticos de honestidad radical (advertencias de zonas turísticas) |
| **Motor Híbrido** | Combinación de rutas generadas por IA + templates estáticos curados |
| **Peaje Termodinámico** | Coste en tokens/latencia de cada operación de IA |
| **Santa Trinidad / Cuarteto de Oráculos** | Los 3-4 verificadores obligatorios (tsc + eslint + vitest [+ build]) |
| **Bucle Kaizen** | Proceso de mejora continua iterativa |
| **Vertical Slicing** | Organización de código por feature funcional (no por capa técnica) |
| **Context Hops** | Número de saltos entre archivos para comprender una operación |
| **Value Object** | Objeto de dominio inmutable con validación en constructor |
| **Sobre Tipado (`OperationEnvelope<T>`)** | Contrato de comunicación inter-módulo |
| **TacticalSpark** | Píldora de micro-información durante la espera del usuario |
| **Nodo 11** | Servidor de producción headless (PC 11, 10.0.10.11) |
| **Ancla (IA Gateway)** | Proveedor de fallback cuando el principal falla |
| **System One / System Two** | Referencia a Kahneman: decisión rápida (SLM) vs. razonamiento profundo (LLM) |
| **Fire-and-Forget** | Patrón asíncrono sin espera de confirmación (telemetría) |
| **Fail-Soft** | Degradación elegante que mantiene el servicio con capacidad reducida |
| **Fail-Closed** | Denegación total si no se cumplen las condiciones de seguridad |
| **Build-Before-Swap** | Compilar la nueva imagen antes de tocar los contenedores activos |
| **Poda Ontológica** | Eliminación programada de datos antiguos para prevenir saturación |
| **Forged-by** | Trailer en commits que identifica el modelo de IA que asistió la forja |

---

## Notas para el LLM Consumidor

1. **Este documento complementa, no reemplaza,** los documentos en `Documentacion/Fuentes/`. Léelos primero para la visión fundacional, luego este anexo para el estado real.
2. **El Códice Tecnológico** ([`.SddIA/library/codexes/tech-master-nextjs-prisma.md`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/codexes/tech-master-nextjs-prisma.md)) contiene los fundamentos `TC-*` que prevalecen sobre tu conocimiento previo del stack. Consúltalo antes de proponer cambios.
3. **Las normas canónicas** residen en [`.SddIA/library/norms/`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/) y están elevadas a rango constitucional.
4. **Los PBIs pendientes** en `Documentacion/PBI/Pendiente/` son la fuente de verdad del backlog activo.
5. **Los PBIs realizados** (94 documentos en `Documentacion/PBI/Realizado/`) contienen los criterios de aceptación y el detalle de implementación de todo lo construido.
6. **AGENTS.md** en la raíz del repositorio contiene las reglas de forja incondicionales para cualquier agente IA.
