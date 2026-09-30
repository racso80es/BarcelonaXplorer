### [ARQUITECTURA] Historia de Usuario 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes (Fase Gamma) v1.2

**Identificador:** HU-17-CONTEXT-RAG
**Estatus:** Especificación Consolidada (v1.2)
**Fecha de Revisión:** 2026-09-30
**Autor:** Operador Técnico / Arquitectura BarcelonaXplorer
**Naturaleza:** Tubería de Ingestión, Almacenamiento Vectorial, Mantenimiento Autónomo de Fuentes y Panel de Gobernanza.

---

#### 1. Descripción General
**Como** Orquestador de Experiencias Turísticas,
**Quiero** disponer de un ecosistema de procesos en segundo plano que ingiera contexto hiperlocal hacia LanceDB[cite: 1, 3], a la vez que un proceso explorador autónomo evalúa, desactiva fuentes fallidas (Circuit Breaker) y propone nuevas fuentes,
**Para** mantener el RAG dinámico actualizado sin mantenimiento manual constante, protegiendo la economía de tokens y respetando la autoridad del Vértice Biológico en la aprobación final de nuevas vías de información (Filtro de Materialización)[cite: 26, 28].

---

#### 2. Gobernanza de Fuentes (MySQL + Seed YAML)
Las fuentes de información dejan de ser un YAML estático en tiempo de ejecución para convertirse en una entidad viva en Prisma/MySQL[cite: 9], permitiendo al sistema mutar sus estados de forma inmutable frente a los despliegues de Ansistrano[cite: 12].

*   **Entidad Prisma (`ContextSource`):**
    *   `id`, `source_tag`, `endpoint`, `type` (API_REST, DOM_SCRAPING), `category`.
    *   `status`: Enum `['ACTIVE', 'DEGRADED', 'PENDING_APPROVAL', 'INACTIVE']`.
    *   `failed_attempts`: Contador de errores consecutivos para autodefensa.
*   **Arranque (Seed):** Un archivo YAML sirve exclusivamente para poblar la base de datos relacional la primera vez que se levanta el entorno o cuando se fuerza una sincronización de inicio.

---

#### 3. Proceso de Ingesta y Autodefensa (Cron Diario/Horario)
Este proceso ejecuta la recolección táctica de las fuentes en estado `ACTIVE`.

1.  **Extracción y Destilación:** Lee las fuentes `ACTIVE` de MySQL. Invoca al IA Gateway (System One)[cite: 2] para parsear el contenido caótico (HTML/Text) y asegurar el cumplimiento estricto del `ContextEntrySchema` (Zod).
2.  **Circuit Breaker (Tolerancia a Fallos):**
    *   Si la extracción falla (cambio de DOM, error HTTP 500), se incrementa `failed_attempts` en MySQL.
    *   Si `failed_attempts >= 3`, el sistema cambia automáticamente el estado de la fuente a `DEGRADED`. Se desactiva el consumo para proteger la economía termodinámica[cite: 26].
3.  **Vectorización:** La entropía validada se vectoriza a través de Gemini Embedding API y se persiste como JSON desnormalizado en la tabla `context_memory` de LanceDB[cite: 1, 2].

---

#### 4. Proceso de Mantenimiento (Sonda Argos - Cron Semanal)
Un proceso especializado en la salud del ecosistema de fuentes, operando bajo el mandato de Crecimiento Personal y Autopoiesis Crítica[cite: 29].

1.  **Diagnóstico de Caídas:** Analiza las fuentes `DEGRADED`. Utilizando un LLM con capacidad de búsqueda, intenta deducir si la fuente ha migrado (ej. redirecciones 301, cambios de dominio). Si halla una solución, propone la actualización.
2.  **Exploración de Entropía:** Ejecuta búsquedas estructuradas en la red para descubrir nuevas agendas culturales o fuentes Open Data en Barcelona.
3.  **Registro de Intención (Filtro de Materialización):** Toda fuente descubierta o corregida se guarda en MySQL con estado `PENDING_APPROVAL`. El sistema jamás inyecta una nueva fuente en el torrente productivo sin la validación explícita del creador[cite: 26].

---

#### 5. Evolución del Panel de Observabilidad (/Admin/Context)
El panel se divide en dos vistas tabulares aplicando la topología estricta de `DataTable<T>` y `ComparableValue`[cite: 5, 10].

*   **Vista 1: Memoria Vectorial Activa (`DataTable<ContextEntry>`)**
    *   Muestra la entropía actualmente inyectada en LanceDB, con su fecha de caducidad (`expiresAt`). Permite inspeccionar el `payload` crudo.
*   **Vista 2: Gobernanza de Fuentes (`DataTable<ContextSource>`)**
    *   Muestra el catálogo relacional de orígenes de datos (MySQL).
    *   **Columna Estado (`status`):** Renderiza insignias semánticas (Verde: `ACTIVE`, Rojo: `DEGRADED`, Ámbar: `PENDING_APPROVAL`).
    *   **Columna Fallos:** Muestra el contador de impacto del *Circuit Breaker*.
    *   **Acciones Operativas:** Botones tácticos para que el Vértice Biológico apruebe una fuente pendiente, reactive una degradada, o modifique URLs.

---

#### 6. Criterios de Aceptación (Verificación Empírica)

*   **Escenario 1: Activación del Circuit Breaker**
    *   **Dado** una fuente de scraping `ACTIVE` cuyo sitio web ha modificado su estructura HTML.
    *   **Cuando** el Cron de Ingesta falla al validar el esquema Zod durante 3 ejecuciones consecutivas.
    *   **Entonces** el sistema actualiza la entidad `ContextSource` en MySQL a `status: DEGRADED`, excluyéndola de futuras ingestas sin intervención humana.

*   **Escenario 2: Exploración y Filtro de Materialización**
    *   **Dado** el Cron Semanal de Mantenimiento (Sonda Argos) ejecutándose en segundo plano.
    *   **Cuando** el agente descubre un nuevo portal de eventos válido.
    *   **Entonces** lo registra en MySQL exclusivamente como `PENDING_APPROVAL`.
    *   **Y** la ingesta diaria lo ignora por completo hasta que exista una validación humana.

*   **Escenario 3: Intervención Biológica**
    *   **Dado** el panel `/Admin/Context` en la pestaña de Gobernanza de Fuentes.
    *   **Cuando** el Vértice Biológico inspecciona una fuente `PENDING_APPROVAL` descubierta por la Sonda Argos y ejecuta la acción "Aprobar".
    *   **Entonces** el estado muta a `ACTIVE` y la siguiente ejecución del Cron de Ingesta comenzará a asimilar su entropía.


Referencias de feuentes de datos:
Api BArcelona
https://opendata-ajuntament.barcelona.cat/es/desenvolupadors#Introducci%C3%B3
Extraer La información posible. Tener en cuenta el límite de peticiones por minuto.
