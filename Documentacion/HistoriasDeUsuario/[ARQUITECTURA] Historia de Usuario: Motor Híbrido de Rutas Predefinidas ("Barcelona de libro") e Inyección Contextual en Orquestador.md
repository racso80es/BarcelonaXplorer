### [ARQUITECTURA] Historia de Usuario: Motor Híbrido de Rutas Predefinidas ("Barcelona de libro") e Inyección Contextual en Orquestador
**Identificador:** HU-19 (Propuesto)
**Estatus:** Refinado / Listo para Desglose en PBIs
**Fecha de Emisión:** 2026-10-14
**Autor:** Vértice Biológico (Racso) & Tormentosa (Protocolo de Acero S+ Grade)
**Referencias Normativas:** `CONSTITUTION.md` · `ADR-001 (Vertical Slicing)` · `ESTUDIO-CTX-002`[cite: 19, 21]

--------------------------------------------------------------------------------

#### Matriz de Indexación Tridimensional
* **Naturaleza:** Especificación Funcional y Arquitectónica de Motor Híbrido (Templates Estáticos + Orquestación Generativa), Gobernanza de Fuentes Curadas y Monetización Asimétrica CPA/CPS.
* **Entorno:** Monolito Next.js (App Router) + Microservicio `ia-gateway` (Hono) + Persistencia Híbrida (`MySQL/Prisma` + `LanceDB`) en Nodo 11[cite: 19, 30].
* **Entropía Asimilada:** Destilado de la fricción simbiótica directa. Evolución de los templates estáticos (`HU-9`) hacia un sistema de anclaje conversacional donde la selección de una ruta temática predefinida (iniciando con *"Barcelona de libro"*) se acopla al prompt del usuario, impulsa la Matriz de Densidad Polimórfica y guía al LLM pesado (`System Two`) para enlazar paradas literarias o FreeTours con servicios gastronómicos y de movilidad en tiempo real.

--------------------------------------------------------------------------------

#### 1. Descripción General
**Como** Explorador / Usuario de BarcelonaXplorer,
**Quiero** poder explorar y seleccionar rutas temáticas predefinidas —comenzando por la categoría **"Barcelona de libro"** con itinerarios basados en obras literarias ambientadas en Barcelona, tanto en modalidad de recorrido autoguiado paso a paso como en modalidad de servicio de FreeTour/visita guiada contratable— para que mi selección se integre directamente en mi prompt de conversación,
**Para** superar la parálisis por análisis y obtener un itinerario cronológico, ejecutable y personalizado donde el orquestador respete los escenarios literarios (o el horario del tour contratado) y los enlace orgánicamente con recomendaciones de restaurantes cercanos, advertencias tácticas (`Escudo Anti-Trampas`) y opciones de transporte según mi contexto personal.

--------------------------------------------------------------------------------

#### 2. Gobernanza de Fuentes de Información y Relación con Fuentes Existentes (`context-sources`)

##### 2.1. Diagnóstico Arquitectónico: ¿Se tratan igual que `src/features/context-sources/`?
**Veredicto de Arquitectura:** Se desacopla la persistencia y el contrato de ingesta respecto a `context-sources`, pero se unifica el **patrón de aprovisionamiento declarativo mediante semilla YAML validada con Zod**[cite: 19, 21].

1. **Incompatibilidad con el Pipeline Vectorial Efímero (`context_memory`):**
   * El subsistema `src/features/context-sources/` está diseñado bajo la premisa de `1 petición HTTP → N ítems atómicos (Clase G0)` con caducidad temporal (`expiresAt` / TTL) y un `summary` restringido a 10–1.200 caracteres en `LanceDB`[cite: 21].
   * Como demostró empíricamente el diagnóstico `ESTUDIO-CTX-002`, inyectar estructuras compuestas o listados de paradas en `context_memory` provoca polución semántica por **Contenedores de Datos (`Clase G2`)** o **Agregadores Editoriales (`Clase G4`)**[cite: 21].
   * Una ruta literaria posee **orden secuencial inmutable** (el hilo narrativo de los capítulos) y vocación **permanente** (no caduca como un evento de agenda cultural)[cite: 21, 22].
2. **Convergencia en el Modelo Relacional (`src/features/guide-templates/`):**
   * Las rutas temáticas predefinidas deben residir en la estructura relacional `MySQL / Prisma` creada en `HU-9`: `TemplateCategory` $\rightarrow$ `GuideTemplate` $\rightarrow$ `TemplateItem`.
   * Al igual que `context-sources.seed.yml` gobierna las fuentes dinámicas, se instituye el catálogo declarativo `guide-templates.seed.yml` para aprovisionar e hidratar de forma idempotente las categorías temáticas y sus rutas sin bifurcaciones imperativas[cite: 21].

##### 2.2. Matriz de Orígenes de Datos para la Categoría "Barcelona de libro"
La obtención y preparación de la información para poblar `guide-templates.seed.yml` se estructura en cuatro canales verificables:

| Vector de Fuente | Origen de Datos | Modalidad Objetivo | Datos Extraídos y Tratamiento |
| :--- | :--- | :--- | :--- |
| **1. Cartografía Municipal e Institucional** | Open Data Ajuntament de Barcelona (`CKAN` / mapas de *Barcelona Ciutat de la Literatura UNESCO* y `MUHBA`)[cite: 21]. | `SELF_GUIDED_ITINERARY` | Nombres oficiales de vías/espacios, distritos (`addresses_district_name`) y coordenadas geodésicas verificadas (`lat`, `lng`) dentro de la caja de Barcelona[cite: 21, 22]. |
| **2. Grafo Patrimonial Abierto** | `Wikidata SPARQL` (reutilizando la infraestructura de consulta de `wikidata-barcelona-monuments`)[cite: 21]. | `SELF_GUIDED_ITINERARY` | Identificadores canónicos de edificios históricos, placas literarias y monumentos referenciados en las novelas[cite: 21]. |
| **3. Forja Curada S+ (Cero Reserva TDM)** | Destilación editorial interna a partir de las ubicaciones físicas reales de las obras literarias, respetando la Directiva UE 2019/790 (sin *scraping* de prosa con copyright de terceros como TimeOut)[cite: 21, 27]. | Ambas modalidades | Contexto narrativo propio de cada parada, `tactical_metadata` (`Escudo Anti-Trampas` para zonas saturadas como Las Ramblas o el Gótico) y micro-logística peatonal[cite: 22, 27]. |
| **4. Catálogos de Afiliación CPA/CPS** | Plataformas de experiencias (`Civitatis`, `GetYourGuide`, `Tiqets`) alineadas con la **Vía del Fuego**. | `BOOKABLE_TOUR` (FreeTour / Visita Guiada) | Punto de encuentro (inicio), nodo de cierre del tour, duración estimada, franjas horarias habituales y URL de conversión en `affiliate_refs`[cite: 19, 22, 23, 27]. |

--------------------------------------------------------------------------------

#### 3. Arquitectura de Módulos y Contratos de Datos (Vertical Slicing)

Siguiendo el `ADR-001` y la regla de **Segregación de Barrels** (`AUD-ARCH-BARREL-001`), toda modificación se confina en las verticales funcionales correspondientes, prohibiendo `export *` y aislando la lógica de servidor en `server.ts` con `import 'server-only'`.

```text
src/
├── features/
│   ├── guide-templates/
│   │   ├── guide-templates.seed.yml          # Catálogo semilla declarativo ("Barcelona de libro", etc.)
│   │   ├── guide-template.schema.ts          # Esquemas Zod (SELF_GUIDED_ITINERARY | BOOKABLE_TOUR)
│   │   ├── guide-template-seed.service.ts    # Ingesta idempotente YAML -> Prisma/MySQL
│   │   ├── components/
│   │   │   ├── ThematicCategorySelector.tsx  # Selector táctico de categorías ("Barcelona de libro")
│   │   │   └── RouteTemplatePickerCard.tsx   # Tarjeta de selección e inyección al prompt ('use client')
│   │   ├── index.ts                          # Exportaciones isomorfas (Tipos y Esquemas Zod)
│   │   └── server.ts                         # Casos de uso y repositorio Prisma ('server-only')
│   ├── triage/                               # Extensión de Matriz de Densidad con anchorTemplate
│   └── planner/                              # Ensamblaje híbrido (Template MySQL + RAG LanceDB + LLM)
