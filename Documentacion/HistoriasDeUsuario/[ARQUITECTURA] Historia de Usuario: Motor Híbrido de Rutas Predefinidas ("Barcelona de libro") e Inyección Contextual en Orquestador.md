### [ARQUITECTURA] Historia de Usuario: Motor Híbrido de Rutas Predefinidas ("Barcelona de libro") e Inyección Contextual en Orquestador

**Identificador:** pendiente de numeración. `HU-19` ya designa la historia operativa de configuración de entorno. `HU-21` está propuesta, sin confirmar, para el escalado tipográfico del admin.
**Estatus:** Desglosada en PBI-TMPL-001 … PBI-TMPL-007 (`Documentacion/PBI/Pendiente/`)
**Fecha de emisión:** 2026-10-14
**Fecha de refinamiento:** 2026-10-14
**Autor:** Vértice Biológico (Racso)
**Referencias:** [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) · [`ADR-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [`HU 9`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%209%20%28Refinada%29:%20Arquitectura%20Relacional%20de%20Templates%20Tem%C3%A1ticos%20y%20Taxonom%C3%ADa%20Din%C3%A1mica.md) · [`HU 12`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md) · [`ESTUDIO-CTX-002`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/%5BESTUDIO%5D%20Contexto%20Vigente%20de%20Fuentes%20Locales%20y%20Refactorizaciones%20de%20Miner%C3%ADa%20de%20Contenedores.md) · [`AUD-ARCH-BARREL-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Fuga%20de%20Dependencias%20de%20Servidor%20y%20Contaminacion%20de%20Barrels%20en%20Client%20Components.md)

--------------------------------------------------------------------------------

#### Matriz de indexación

* **Naturaleza:** Rutas temáticas permanentes en MySQL, ancladas al triaje y al generador táctico. La primera categoría es "Barcelona de libro".
* **Entorno:** Monolito Next.js (App Router) en el Nodo 11, microservicio `ia-gateway` (Hono), MySQL/Prisma y LanceDB (`context_memory`). El generador de rutas ya llama a `POST /v1/llm/generate` con `engineType: 'REASONING_LLM'` desde [`ia-gateway.client.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/ia-gateway/ia-gateway.client.ts). Ese contrato es el System Two de HU-16. El SLM Groq sigue siendo la vía rápida de diálogo, no el ensamblador de la ruta.
* **Qué cambia respecto de HU-9:** HU-9 ya persistió `TemplateCategory` → `GuideTemplate` → `TemplateItem`, con `tacticalMetadata` y `affiliateRefs` en el ítem. Esta historia añade la modalidad de la ruta, la URL de reserva de la cabecera, la ficha literaria y el anclaje de una plantilla publicada al prompt del orquestador.

--------------------------------------------------------------------------------

#### 1. Descripción

**Como** explorador,  
**Quiero** elegir una ruta publicada de la categoría "Barcelona de libro" y seguir escribiendo mi propio contexto en el prompt,  
**Para** recibir un itinerario que conserve el orden de las paradas curadas y deje hueco a la hora, la compañía y la comida que yo haya pedido.

La categoría arranca con dos modalidades:

| Modalidad | Significado en el producto |
| :--- | :--- |
| `SELF_GUIDED_ITINERARY` | Paradas ordenadas que el usuario recorre por su cuenta. |
| `BOOKABLE_TOUR` | Bloque contratado, con punto de encuentro, punto de finalización y una URL de reserva en la cabecera. |

Un tour de pago y un free tour son el mismo modo `BOOKABLE_TOUR`. El precio no se inventa en el enum: vive en el copy y en la URL del producto real.

--------------------------------------------------------------------------------

#### 2. Relación con `context-sources`

Las rutas no se ingieren en `context_memory`.

`context-sources` persiste unidades de contexto (`ContextEntrySchema`): `summary` de 10 a 1.200 caracteres, `expiresAt` obligatorio y deduplicación por `contentHash`. ESTUDIO-CTX-002 clasifica la forma del objeto de origen:

| Clase | Qué es | Qué no es |
| :--- | :--- | :--- |
| G0 | El objeto devuelto ya es el evento, el lugar o la noticia. | No significa "una petición HTTP produce N ítems". Hay adaptadores RSS, iCal y SPARQL. |
| G2 | Metadato de un conjunto (el caso `bcn-opendata-ckan`). Los ítems reales están en recursos hijos. | No es el resultado de guardar una ruta literaria. |
| G4 | Un artículo que enumera varias actividades en prosa. | No es el nombre de un itinerario ordenado. |

Una ruta literaria tiene orden fijo y no caduca. Meterla en `context_memory` la convertiría en un vecino RAG más, sin orden. Por eso vive en las tablas de HU-9.

El RAG actual no sustituye a la plantilla. [`GenerateTacticalRouteUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/generate-tactical-route.use-case.ts) pide como máximo 5 entradas no caducadas, por similitud del prompt, sin filtro por radio geográfico. Esas entradas pueden colorear el texto. No son el inventario de restaurantes de la ruta.

##### 2.1. De dónde sale el contenido de la semilla

| Canal | Uso permitido en esta historia | Límite |
| :--- | :--- | :--- |
| Curación propia | Texto breve de cada parada, escrito para este catálogo, y el `tacticalMetadata` que ya define `TacticalMetadataSchema`. | No se copia prosa de guías, prensa ni fichas de touroperador. La Directiva 2019/790 no se usa aquí como permiso para minar ese texto. |
| Callejero | Coordenadas comprobadas contra un callejero municipal antes de pasar la plantilla a `PUBLISHED`. | El bounding box de `GeographicScope` es metropolitano y admite el aeropuerto. Una parada literaria tiene que caer en un distrito de `CANONICAL_DISTRICTS`, no solo dentro de la caja. |
| Producto de afiliación ya contratado | URL, punto de encuentro, punto final, duración y proveedor del enum vigente. | Si la ficha pública no está confirmada, la plantilla se queda en `DRAFT`. |
| Wikidata `wikidata-barcelona-monuments` | Referencia de que el adaptador SPARQL existe y es G0. | No rellena plantillas. ESTUDIO-CTX-002 anota que la consulta no enlaza `?description`, así que el summary sale sintético. |
| CKAN `bcn-opendata-ckan` | Ninguno. | La fuente está `INACTIVE` en la semilla de contexto precisamente por ser un contenedor G2. |

Proveedores que el código ya nombra, y que no hay que ampliar en esta historia:

* En la plantilla ([`guide-template.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts)): `THE_FORK`, `CIVITATIS`, `TIQETS`, `CABIFY`, `FREE_NOW`.
* En el itinerario enriquecido ([`affiliate-enricher.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/affiliate-enricher.schema.ts)): `THEFORK`, `CIVITATIS`, `NONE`.

`GetYourGuide` no está en ninguno de los dos enums. `CABIFY` existe en la plantilla y no existe en `EnrichedRoute`. Un retorno en Cabify no puede ser criterio de aceptación del itinerario enriquecido hasta que ese enum lo admita.

--------------------------------------------------------------------------------

#### 3. Contrato sobre el modelo que ya existe

El esquema está en [`src/prisma/schema.prisma`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma). Los Zod de dominio están en [`src/features/guide-templates/domain/guide-template.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts). El barrel isomorfo es `index.ts`. El barrel de servidor es `server.ts` (`import 'server-only'`). Los componentes de cliente importan `index.ts` y no importan `server.ts` (AUD-ARCH-BARREL-001).

```text
src/features/guide-templates/
├── domain/guide-template.schema.ts          # ya existe; aquí entra el delta Zod
├── guide-templates.seed.yml                 # nuevo
├── use-cases/guide-template-seed.service.ts # nuevo
├── ports/guide-template-repository.port.ts  # ya tiene findPublishedByCategoryAndSlugLocalized
├── adapters/prisma-guide-template.repository.ts
├── index.ts
└── server.ts
src/prisma/schema.prisma
```

##### 3.1. Campos que ya existen y hay que reutilizar

| Concepto de la semilla | Columna o campo real | Regla que ya está en el código |
| :--- | :--- | :--- |
| `title` | `GuideTemplate.title` | `VarChar(255)` |
| texto de cabecera | `GuideTemplate.abstract` | Obligatorio. `CreateGuideTemplateInputSchema` exige mínimo 10 caracteres. |
| `estimatedTotalDurationMinutes` | `GuideTemplate.estimatedDuration` | Entero en minutos. |
| visibilidad | `GuideTemplate.status` | `DRAFT` por defecto. `findPublished*` solo devuelve `PUBLISHED`. |
| `categorySlug` + `slug` | `@@unique([categoryId, slug])` | El slug no es único global. HU-9 lo dejó compuesto a propósito. |
| texto de la parada | `TemplateItem.description` | No existe `literaryContext`. |
| `orderIndex` | `TemplateItem.orderIndex` | Único por plantilla. |
| `coordinates.lat` / `lng` | `coordinatesLat` / `coordinatesLng` | Flotantes anulables. |
| duración de la parada | `approxDurationMin` | Entero, default 30. |
| escudo y logística | `tacticalMetadata` JSON | `TacticalMetadataSchema` (warnings de 250 caracteres). |
| afiliados de la parada | `affiliateRefs` JSON | `AffiliateRefSchema`. |
| idioma maestro | columnas base | Castellano. |
| `ca` / `en` | tablas `*Translation` | HU-12 las rellena en cache miss con `GetPublishedTemplateBySlugUseCase`. La semilla no las escribe. |

La cookie de idioma es `bx_lang` (`BX_LANG_COOKIE` en [`language-detector.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/language-detector.ts)). El caso de uso ya acepta `language`. `GET /api/guides/[categorySlug]/[templateSlug]` hoy no se la pasa: la localización de la ficha queda fuera de este desglose mientras el maestro sea `es`.

Métodos que no hay que crear: `findPublishedByCategoryAndSlug` y `findPublishedByCategoryAndSlugLocalized`. Un `findPublishedBySlug(slug)` contradice la unicidad compuesta.

##### 3.2. Delta de Prisma

Sobre `GuideTemplate`, sin renombrar columnas existentes:

* `mode`: enum `TemplateMode` con `SELF_GUIDED_ITINERARY` y `BOOKABLE_TOUR`. Default `SELF_GUIDED_ITINERARY`, para que las filas ya creadas sigan siendo válidas.
* `primaryAffiliateBookingUrl`: `String?` mapeada a `primary_affiliate_booking_url`, `VarChar(512)`.
* `literaryMetadata`: `Json?` mapeada a `literary_metadata`. Ficha de la obra. No reutiliza el `tacticalMetadata` del ítem.

`TemplateItem` no gana columnas en esta historia.

##### 3.3. Delta Zod

Se añade en el archivo de dominio que ya exporta `TacticalMetadataSchema` y `AffiliateRefSchema`. No se importa el propio archivo.

```typescript
export const TemplateModeEnum = z.enum([
  'SELF_GUIDED_ITINERARY',
  'BOOKABLE_TOUR',
]);

export const LiteraryWorkMetadataSchema = z.object({
  bookTitle: z.string().min(2),
  author: z.string().min(2),
  publicationYear: z.number().int().optional(),
  historicalPeriod: z.string().min(2),
  narrativeHook: z.string().min(20).max(500),
  factualNotes: z.array(z.string().max(250)).default([]),
});

export const GuideTemplateSeedItemSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(96),
    categorySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64),
    title: z.string().min(5).max(255),
    abstract: z.string().min(10),
    status: TemplateStatusEnum.default('DRAFT'),
    mode: TemplateModeEnum.default('SELF_GUIDED_ITINERARY'),
    literaryMetadata: LiteraryWorkMetadataSchema.optional(),
    estimatedDuration: z.number().int().positive(),
    primaryAffiliateBookingUrl: z.string().url().max(512).optional(),
    items: z.array(TemplateWaypointItemSeedSchema).min(1),
  })
  .refine(
    (data) =>
      data.mode !== 'BOOKABLE_TOUR' ||
      data.status !== 'PUBLISHED' ||
      Boolean(data.primaryAffiliateBookingUrl),
    { path: ['primaryAffiliateBookingUrl'], message: 'BOOKABLE_TOUR publicado requiere URL de reserva' },
  )
  .refine(
    (data) =>
      data.mode !== 'BOOKABLE_TOUR' ||
      (data.items.length >= 2 &&
        data.items.some((item) => item.orderIndex === 0) &&
        data.items.some((item) => item.orderIndex === 1)),
    { path: ['items'], message: 'BOOKABLE_TOUR declara el orden 0 y el orden 1' },
  );
```

`TemplateWaypointItemSeedSchema` mapea `description` → `TemplateItem.description`, `coordinates.lat/lng` → las dos columnas, y `approxDurationMin` → `approxDurationMin`. El regex del slug es el de `TemplateSlugVO`, no la variante que admite guiones dobles o de borde.

La geocerca de la semilla rechaza la parada si falta alguna coordenada, si cae fuera de `GeographicScope.BOUNDING_BOX`, o si el topónimo solo encaja con `PERIURBAN_EXCEPTIONS`.

En `BOOKABLE_TOUR` la duración bloqueada es `estimatedDuration` de la cabecera. Las paradas 0 y 1 son encuentro y cierre: su `approxDurationMin` es el tiempo de espera en el punto, no la duración del tour repartida sobre el nodo final.

--------------------------------------------------------------------------------

#### 4. Triaje y medidor

La matriz `default` ya está en [`src/features/planner/matrix.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.ts):

| Variable | Peso | Umbral |
| :--- | ---: | ---: |
| `time_window` | 60 | |
| `group_size` | 15 | |
| `vibe` | 15 | |
| `constraints` | 10 | |
| `mood` (si llega y no está en los pesos) | 10 | |
| suma, con tope | 100 | 60 |

`time_window` sola ya alcanza el umbral. La matriz `gastronomy` tiene umbral 70 y solo entra si el cliente envía `matrixId: 'gastronomy'`. Mencionar una cena en el prompt no cambia de matriz.

Esta historia añade la clave `anchored_template` con peso **45 puntos** en la matriz `default`. El `ThermalMeter` pinta ese score con el sufijo `%`: 45 puntos se ven como `45%`. No es un incremento relativo del 45 %.

Reglas de cómputo:

1. El cliente envía `selectedCategorySlug` y `selectedTemplateSlug` juntos. Con uno solo no hay ancla: la unicidad es compuesta.
2. Antes de puntuar, el triaje resuelve la plantilla con `GetPublishedTemplateBySlugUseCase`. Solo una respuesta `success` escribe `anchored_template: true` en el payload.
3. 45 puntos dejan el medidor por debajo de 60. Elegir la ruta no despacha sola.
4. 45 + `group_size` (15) = 60. 45 + `time_window` (60) se topa en 100.
5. Un slug desconocido o una plantilla `DRAFT` no suma puntos y el triaje sigue con el prompt normal.

`ThermalMeter` muestra el `TriageOutcomeDto`. No recalcula al pulsar la tarjeta. La previsualización del chip usa `calculateMatrixDensity` con el mismo payload que se va a enviar, para no mantener una segunda fórmula en el cliente.

`TriageInputSchema` gana dos opcionales: `selectedCategorySlug` y `selectedTemplateSlug`. El resto del DTO (`sessionId`, `prompt`, `matrixId`, `userLocation`, `mood`, `clientLanguage`) se mantiene.

--------------------------------------------------------------------------------

#### 5. Ensamblaje

```mermaid
sequenceDiagram
    actor User as Explorador
    participant UI as Orquestador
    participant Triage as POST /api/triage
    participant Templates as GetPublishedTemplateBySlugUseCase
    participant Planner as GenerateTacticalRouteUseCase
    participant RAG as context_memory (K=5, sin radio)
    participant Gateway as ia-gateway REASONING_LLM

    User->>UI: Elige una plantilla PUBLISHED y escribe el resto del prompt
    UI->>Triage: prompt + selectedCategorySlug + selectedTemplateSlug
    Triage->>Templates: categorySlug + templateSlug + idioma maestro es
    alt Plantilla publicada
        Templates-->>Triage: GuideTemplate localizado
        Triage->>Triage: payload.anchored_template = true
    else Ausente o DRAFT
        Triage->>Triage: sin bono; el prompt sigue su curso
    end
    Triage->>Triage: calculateMatrixDensity
    alt score >= umbral de la matriz enviada
        Triage->>Planner: prompt + anclas estructuradas
        Planner->>RAG: hasta 5 entradas vigentes, por similitud del texto
        Planner->>Gateway: prompt de usuario con las anclas; el system prompt global no se reescribe
        Gateway-->>Planner: JSON de ruta
        Planner->>Planner: parse TacticalRouteZodSchema y reinyecta las anclas en su orderIndex
        Planner-->>Triage: ruta
        Triage->>Triage: AffiliateEnricherService → EnrichedRouteSchema
    end
    Triage-->>UI: TriageOutcomeDto
```

La frase del prompt que prohíbe al modelo reordenar paradas no es la garantía. Después de `TacticalRouteZodSchema.parse`, el caso de uso vuelve a colocar cada `TemplateItem` de la plantilla en su `orderIndex`, con su `description`, sus coordenadas y su `tacticalMetadata`. El modelo puede rellenar huecos entre anclas. No puede borrarlas ni cambiarles el orden.

El `systemInstruction` fijo de `generateTacticalRoute` se deja como está. Cambiarlo alteraría todas las rutas, también las que no tienen plantilla. Las anclas viajan en el prompt de usuario y en el objeto que el triaje ya resolvió.

##### Caso A — `SELF_GUIDED_ITINERARY`

Las anclas son todos los ítems, en orden. Entre ellas el generador puede proponer un hueco de comida o de desplazamiento. Si el texto de ese hueco dispara las palabras clave de [`AffiliateEnricherService`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/affiliate-enricher.service.ts), el enriquecedor adjunta una URL de búsqueda de TheFork (`THEFORK`) o de Civitatis (`CIVITATIS`). Hoy esas URLs se construyen con el título del waypoint; no salen de un inventario geocodificado a menos de diez minutos.

##### Caso B — `BOOKABLE_TOUR`

El tramo bloqueado dura `estimatedDuration` minutos y va del ítem `orderIndex: 0` al ítem `orderIndex: 1`. El itinerario muestra la ficha literaria y la `primaryAffiliateBookingUrl` de la cabecera. A partir del nodo 1 se pueden proponer huecos con la misma regla del caso A. No se promete un enlace Cabify: `EnrichedRoute` no tiene ese proveedor.

`timeSpan` sigue el esquema ya publicado en `TimeSpanZodSchema`: `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`.

--------------------------------------------------------------------------------

#### 6. Semilla inicial

Archivo nuevo: `src/features/guide-templates/guide-templates.seed.yml`.

El ingestor valida el YAML con el Zod de §3.3 y hace upsert por `(categorySlug, slug)`. Coordenadas fuera de la regla de §3.3, o un `BOOKABLE_TOUR` en `PUBLISHED` sin URL, abortan con `OperationEnvelope` de error y no escriben un subconjunto.

Estado editorial de esta primera carga: **`DRAFT`**. Las coordenadas de abajo son aproximaciones de trabajo, no una extracción de open data. `findPublished*` las ignora hasta que una revisión humana compruebe el callejero y las pase a `PUBLISHED`.

Hechos literarios que la semilla sí puede afirmar:

* *La sombra del viento*, Carlos Ruiz Zafón, 2001. El Cementerio de los Libros Olvidados es ficción situada por el autor en el Arc del Teatre; no hay puerta. Els Quatre Gats y el Ateneu Barcelonès son locales reales. La plaça de Sant Felip Neri aparece en las rutas literarias de la novela (la vivienda de Núria Monfort); la librería Sempere e Hijos es ficción y no se geocodifica.
* *La catedral del mar*, Ildefonso Falcones, 2006. Santa Maria del Mar es el escenario. El Fossar de les Moreres conmemora 1714 y no forma parte del siglo XIV de la novela.
* *La plaça del Diamant*, Mercè Rodoreda, 1962. La plaza y el envelat son el escenario. La plaça de la Virreina y el carrer de les Astúries pertenecen al rodaje de la película de 1982, no a una parada de la novela.

Producto reservable contrastado el 2026-10-14: Civitatis publica un tour de pago de unas dos horas, con inicio en Rambla de Santa Mónica, 9, y cierre en el Ateneu Barcelonès. La ficha vista es `https://www.civitatis.com/en/barcelona/shadow-of-the-wind-tour/`. No es un free tour, no sale de la Font de Canaletes y no termina en Santa Maria del Mar. La URL en castellano y el `externalId` de afiliado siguen sin confirmar: por eso ese template nace en `DRAFT` y la URL inglesa no se copia a `primaryAffiliateBookingUrl` hasta cerrar la ficha `es`.

```yaml
# Semilla declarativa de guide-templates.
# Maestro: es. ca/en los produce HU-12 bajo demanda.
# status DRAFT hasta verificar coordenadas y, en el tour, la URL es.

categories:
  - slug: "barcelona-de-libro"
    name: "Barcelona de libro"
    description: "Escenarios reales de novelas ambientadas en Barcelona, en recorrido propio o en tour contratado."
    icon: "BookOpen"
    isActive: true

templates:
  - slug: "sombra-del-viento-itinerario"
    categorySlug: "barcelona-de-libro"
    title: "La sombra del viento: del Arc del Teatre al Ateneu"
    abstract: "Cuatro anclas del callejero asociadas a la novela de Zafón. El cementerio de libros es ficción y no tiene acceso."
    status: "DRAFT"
    mode: "SELF_GUIDED_ITINERARY"
    estimatedDuration: 150
    literaryMetadata:
      bookTitle: "La sombra del viento"
      author: "Carlos Ruiz Zafón"
      publicationYear: 2001
      historicalPeriod: "Barcelona de posguerra; el relato abre en el verano de 1945"
      narrativeHook: "Del Arc del Teatre a Els Quatre Gats, Sant Felip Neri y el Ateneu Barcelonès."
      factualNotes:
        - "El Cementerio de los Libros Olvidados no existe como edificio. El autor lo sitúa en esta calle."
        - "La librería Sempere e Hijos es ficción y no tiene coordenada."
    items:
      - orderIndex: 0
        title: "Carrer de l'Arc del Teatre"
        locationName: "Carrer de l'Arc del Teatre, Ciutat Vella"
        # Provisional. Verificar contra callejero antes de PUBLISHED.
        coordinates: { lat: 41.3768, lng: 2.1749 }
        approxDurationMin: 20
        description: "Calle real donde la novela sitúa el acceso al cementerio de libros. No hay puerta ni interior visitable."
      - orderIndex: 1
        title: "Els Quatre Gats"
        locationName: "Carrer de Montsió, 3 bis, Ciutat Vella"
        coordinates: { lat: 41.3858, lng: 2.1734 }
        approxDurationMin: 30
        description: "Local modernista real, citado en la novela. No comparte coordenada con la librería ficticia de los Sempere."
      - orderIndex: 2
        title: "Plaça de Sant Felip Neri"
        locationName: "Plaça de Sant Felip Neri, Barri Gòtic"
        coordinates: { lat: 41.3834, lng: 2.1752 }
        approxDurationMin: 20
        description: "Plaza real del Gótico. Las rutas literarias de la novela sitúan aquí la vivienda de Núria Monfort."
      - orderIndex: 3
        title: "Ateneu Barcelonès"
        locationName: "Carrer de la Canuda, 6, Ciutat Vella"
        coordinates: { lat: 41.3839, lng: 2.1718 }
        approxDurationMin: 25
        description: "Centro cultural real. Las rutas públicas de la novela cierran junto a este edificio."

  - slug: "sombra-del-viento-tour"
    categorySlug: "barcelona-de-libro"
    title: "Tour guiado de La sombra del viento"
    abstract: "Tour de pago publicado por Civitatis. Queda en borrador hasta confirmar la URL en castellano, el identificador de afiliado y las coordenadas de inicio y cierre."
    status: "DRAFT"
    mode: "BOOKABLE_TOUR"
    estimatedDuration: 120
    # primaryAffiliateBookingUrl: pendiente de la ficha https://www.civitatis.com/es/... 
    literaryMetadata:
      bookTitle: "La sombra del viento"
      author: "Carlos Ruiz Zafón"
      publicationYear: 2001
      historicalPeriod: "Siglo XX"
      narrativeHook: "Recorrido contratado de unas dos horas entre Rambla de Santa Mónica y el Ateneu."
      factualNotes:
        - "No es un free tour. La cancelación gratuita del operador no convierte la actividad en gratuita."
        - "Inicio público contrastado: Rambla de Santa Mónica, 9. Cierre público contrastado: Ateneu Barcelonès."
    items:
      - orderIndex: 0
        title: "Encuentro: Rambla de Santa Mónica, 9"
        locationName: "Rambla de Santa Mónica, 9, Ciutat Vella"
        coordinates: { lat: 41.3769, lng: 2.1758 }
        approxDurationMin: 10
        description: "Punto de encuentro del tour de pago. El tiempo de esta parada es la espera, no las dos horas del recorrido."
      - orderIndex: 1
        title: "Cierre: Ateneu Barcelonès"
        locationName: "Carrer de la Canuda, 6, Ciutat Vella"
        coordinates: { lat: 41.3839, lng: 2.1718 }
        approxDurationMin: 10
        description: "Punto en el que el grupo se disuelve. La duración del bloque es estimatedDuration de la cabecera."

  - slug: "catedral-del-mar-itinerario"
    categorySlug: "barcelona-de-libro"
    title: "La catedral del mar: Santa Maria del Mar y Montcada"
    abstract: "Dos anclas de la Ribera ligadas a la basílica del siglo XIV. El Fossar de les Moreres queda fuera porque es un memorial de 1714."
    status: "DRAFT"
    mode: "SELF_GUIDED_ITINERARY"
    estimatedDuration: 90
    literaryMetadata:
      bookTitle: "La catedral del mar"
      author: "Ildefonso Falcones"
      publicationYear: 2006
      historicalPeriod: "Barcelona del siglo XIV"
      narrativeHook: "De la basílica de Santa Maria del Mar al carrer de Montcada, calle de palacios de la Ribera."
      factualNotes:
        - "No se afirma que Arnau Estanyol tenga su mesa de cambista en Montcada."
    items:
      - orderIndex: 0
        title: "Basílica de Santa Maria del Mar"
        locationName: "Plaça de Santa Maria, 1, El Born"
        coordinates: { lat: 41.3839, lng: 2.1821 }
        approxDurationMin: 40
        description: "Basílica real y escenario central de la novela. El Fossar de les Moreres, al lado, no pertenece a esa cronología."
      - orderIndex: 1
        title: "Carrer de Montcada"
        locationName: "Carrer de Montcada, El Born"
        coordinates: { lat: 41.3848, lng: 2.1810 }
        approxDurationMin: 30
        description: "Calle de palacios medievales inmediata a la basílica. Contexto urbano de la Ribera, no una mesa de cambio geolocalizada."

  - slug: "placa-del-diamant-gracia"
    categorySlug: "barcelona-de-libro"
    title: "La plaça del Diamant"
    abstract: "Una sola ancla: la plaza del envelat donde Natàlia conoce a Quimet. Sin locales de la película que la novela no sitúa."
    status: "DRAFT"
    mode: "SELF_GUIDED_ITINERARY"
    estimatedDuration: 60
    literaryMetadata:
      bookTitle: "La plaça del Diamant"
      author: "Mercè Rodoreda"
      publicationYear: 1962
      historicalPeriod: "Segunda República, guerra y posguerra"
      narrativeHook: "La plaza de Gràcia donde empieza la historia de Natàlia, llamada Colometa."
      factualNotes:
        - "Plaça de la Virreina y carrer de les Astúries son localizaciones del rodaje de 1982, no paradas de esta ficha."
    items:
      - orderIndex: 0
        title: "Plaça del Diamant"
        locationName: "Plaça del Diamant, Vila de Gràcia"
        coordinates: { lat: 41.4042, lng: 2.1566 }
        approxDurationMin: 40
        description: "Plaza real del envelat. El refugio antiaéreo del entorno es patrimonio de la guerra que la novela atraviesa; no se describe como un interior del capítulo."
```

El ingestor traduce cada ítem al `CreateTemplateItemInputSchema` ya existente. Si el YAML trae `ca` o `en`, falla en frontera: esas lenguas no se siembran.

--------------------------------------------------------------------------------

#### 7. Criterios de aceptación

##### Escenario 1 — Semilla idempotente

* **Dado** `guide-templates.seed.yml` con la categoría `barcelona-de-libro`.
* **Cuando** corre el ingestor.
* **Entonces** hace upsert de `TemplateCategory`, `GuideTemplate` y `TemplateItem` en castellano, con `abstract`, `estimatedDuration` y `status: DRAFT`.
* **Y** no escribe filas en `TemplateCategoryTranslation`, `GuideTemplateTranslation` ni `TemplateItemTranslation`.
* **Y** una coordenada fuera de la regla de §3.3, o un `BOOKABLE_TOUR` en `PUBLISHED` sin `primaryAffiliateBookingUrl`, devuelve `OperationEnvelope` de error sin persistir un lote parcial. Un `BOOKABLE_TOUR` en `DRAFT` puede omitir la URL: es el caso de `sombra-del-viento-tour` en §6.

##### Escenario 2 — Selección en `/orchestrator`

* **Dado** un usuario en `/orchestrator` y solo plantillas `PUBLISHED` visibles. El catálogo de §6 no aparece hasta el cambio de estado.
* **Cuando** elige una ruta publicada.
* **Entonces** el cliente envía `selectedCategorySlug` y `selectedTemplateSlug`.
* **Y** la previsualización del medidor, calculada con `calculateMatrixDensity`, marca 45 si no hay otras variables, por debajo del umbral 60.

##### Escenario 3 — `SELF_GUIDED_ITINERARY`

* **Dado** una plantilla publicada de ese modo y un payload que ya supera el umbral de la matriz enviada.
* **Cuando** el triaje despacha.
* **Entonces** cada ítem de la plantilla está en el itinerario, en su `orderIndex`, con su `tacticalMetadata`.
* **Y** un hueco gastronómico, si el enriquecedor lo clasifica, lleva proveedor `THEFORK` y una URL de búsqueda, no un restaurante afirmado a menos de diez minutos.
* **Y** los `timeSpan` presentes cumplen `TimeSpanZodSchema`.

##### Escenario 4 — `BOOKABLE_TOUR`

* **Dado** una plantilla publicada de ese modo, con URL de reserva.
* **Cuando** el orquestador genera la ruta.
* **Entonces** el tramo entre el orden 0 y el orden 1 dura `estimatedDuration` minutos y muestra `primaryAffiliateBookingUrl`.
* **Y** los huecos posteriores al nodo 1 siguen la regla del escenario 3.
* **Y** el copy no llama free tour a un producto de pago.

--------------------------------------------------------------------------------

#### 8. PBIs

Cada PBI lista tres archivos como máximo. El test va colocado junto al código que cambia. La migración SQL que genere Prisma cuenta como artefacto de `schema.prisma`, no como un cuarto diseño.

1. **[`PBI-TMPL-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Delta%20de%20persistencia%20y%20Zod%20de%20plantillas%20%28PBI-TMPL-001%29.md) — Delta de persistencia y Zod**
   * `src/prisma/schema.prisma`
   * `src/features/guide-templates/domain/guide-template.schema.ts`
   * `src/features/guide-templates/domain/guide-template.schema.test.ts`

2. **[`PBI-TMPL-002`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Semilla%20Barcelona%20de%20libro%20%28PBI-TMPL-002%29.md) — Semilla**
   * `src/features/guide-templates/guide-templates.seed.yml`
   * `src/features/guide-templates/use-cases/guide-template-seed.service.ts`
   * `src/features/guide-templates/use-cases/guide-template-seed.service.test.ts`

3. **[`PBI-TMPL-003`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Peso%20y%20DTO%20de%20triaje%20%28PBI-TMPL-003%29.md) — Peso y DTO de triaje**
   * `src/features/planner/matrix.ts` (`anchored_template: 45` y el campo en `DefaultDensityPayloadSchema`)
   * `src/features/triage/triage.schema.ts` (los dos slugs)
   * `src/features/planner/matrix.test.ts`
   * El caso de uso de triaje no se toca aquí. Sin la resolución de §4, un booleano presente en el payload no debe poder enviarse desde el cliente para sumar 45 puntos: lo escribe solo el servidor en el PBI siguiente.

4. **[`PBI-TMPL-004`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Resolucion%20de%20la%20plantilla%20en%20el%20triaje%20%28PBI-TMPL-004%29.md) — Resolución de la plantilla en el triaje**
   * `src/features/triage/triage-input.use-case.ts`
   * `src/app/api/triage/route.ts` (inyección explícita de `GetPublishedTemplateBySlugUseCase`)
   * `src/features/triage/triage.test.ts`

5. **[`PBI-TMPL-005`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Reinyeccion%20de%20anclas%20%28PBI-TMPL-005%29.md) — Reinyección de anclas**
   * `src/features/planner/generate-tactical-route.use-case.ts`
   * `src/features/planner/generate-tactical-route.test.ts`
   * `src/features/triage/triage-input.use-case.ts` (pasar las anclas ya resueltas en la llamada existente a `execute`)
   * No se edita `ia-gateway.client.ts`.

6. **[`PBI-TMPL-006`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Listado%20para%20el%20selector%20%28PBI-TMPL-006%29.md) — Listado para el selector**
   * Falta la ruta HTTP que liste plantillas publicadas de una categoría. El puerto ya tiene `listPublishedByCategory`. Existen `GET /api/guides/categories` y `GET /api/guides/[categorySlug]/[templateSlug]`.
   * `src/features/guide-templates/use-cases/list-published-templates.use-case.ts`
   * `src/app/api/guides/[categorySlug]/route.ts`
   * `src/app/api/guides/__tests__/guides-routes.test.ts`

7. **[`PBI-TMPL-007`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Selector%20en%20el%20orquestador%20%28PBI-TMPL-007%29.md) — Selector en el orquestador**
   * `src/features/guide-templates/components/ThematicCategorySelector.tsx`
   * `src/features/guide-templates/components/RouteTemplatePickerCard.tsx`
   * El tercer archivo es el componente de cliente que ya posee el cuadro de prompt en `/orchestrator`, no un volcado nuevo dentro de `page.tsx` si ese componente ya existe al implementar.
   * Los dos componentes leen las rutas HTTP. No importan `server.ts`.

##### Decisiones tomadas al desglosar

* **URL de reserva y `DRAFT`.** El refine de §3.3 exige `primaryAffiliateBookingUrl` en todo `BOOKABLE_TOUR`. El YAML de §6 deja `sombra-del-viento-tour` en `DRAFT` sin esa URL, a propósito. PBI-TMPL-001 cierra así: la URL es obligatoria para `PUBLISHED`; en `DRAFT` puede faltar. El YAML canónico se ingiere entero. El error del escenario 1 se prueba con un fixture publicado sin URL, o con una coordenada fuera de la geocerca.
* **El itinerario y el enriquecedor.** `AffiliateEnricherService` hoy sustituye `tacticalMetadata` y `EnrichedRouteSchema` no tiene cabecera literaria ni URL de reserva. PBI-TMPL-005 conserva el escudo que ya trae el ancla y copia `mode`, `literaryMetadata`, `primaryAffiliateBookingUrl` y `estimatedDuration` al itinerario. `ia-gateway.client.ts` sigue fuera.

Cierre de cada PBI: `tsc --noEmit`, `eslint` y `vitest run` sobre los archivos del PBI. `npm run build` se añade cuando el PBI toca componentes de cliente o barrels, que es el hueco que ya documentó AUD-ARCH-BARREL-001.

--------------------------------------------------------------------------------

#### Anexo — Correcciones de este refinamiento

El borrador anterior se contrastó con el esquema Prisma, los Zod de plantillas y de enriquecimiento, `matrix.ts`, el caso de uso de ruta, ESTUDIO-CTX-002 y las fichas públicas del tour.

| Afirmación retirada | Hecho vigente |
| :--- | :--- |
| Identificador `HU-19` | `HU-19` ya está usada. Esta historia queda sin número. |
| Esquema en `guide-templates/guide-template.schema.ts` que se importa a sí mismo | El archivo real es `domain/guide-template.schema.ts` y ya contiene `TacticalMetadataSchema` y `AffiliateRefSchema`. |
| `findPublishedBySlug` nuevo | Ya existe la búsqueda por categoría y slug. El slug solo es único dentro de la categoría. |
| Semilla que hidrata `ca` y `en` | HU-12 traduce bajo demanda. El maestro es `es`. `abstract` es obligatorio y el default de estado es `DRAFT`. |
| Bono `+45 %` que deja la interacción al borde del despacho, y que con un poco de contexto lo supera de sobra | 45 puntos se muestran como `45 %` y quedan bajo el umbral 60. `time_window` sola ya vale 60. |
| El medidor salta al elegir la tarjeta | El medidor refleja el DTO del triaje. |
| El triaje recupera la plantilla después de puntuar | El bono solo se aplica si la plantilla publicada se resolvió antes. |
| Prohibir al LLM cambiar el orden basta como garantía | El orden se reinyecta después del parse Zod. |
| Reescribir el prompt de sistema del gateway | Ese texto es global. Las anclas van en el prompt de usuario. |
| RAG de restaurantes a menos de 10 minutos, con enlace real de TheFork y retorno Cabify | El RAG es K=5 sin radio. TheFork en el enriquecedor es una URL de búsqueda (`THEFORK`). Cabify no está en `EnrichedRoute`. |
| `GetYourGuide` como canal de afiliación | No está en los enums. |
| CKAN y el adaptador Wikidata como fuentes de la semilla | CKAN de catálogo está `INACTIVE` (G2). Wikidata no enlaza la descripción. |
| G0 = "1 HTTP → N ítems" | G0 significa que el objeto ya es la unidad de contexto. |
| Free tour oficial de Civitatis en `free-tour-sombra-viento`, salida en Canaletes y llegada al Born | El producto público contrastado es de pago, sale en Rambla de Santa Mónica 9 y cierra en el Ateneu. |
| Librería Sempere geocodificada junto a Els Quatre Gats | La librería es ficción. Els Quatre Gats es un local real distinto. |
| Fossar de les Moreres como parada del siglo XIV | Es un memorial de 1714. |
| Plaça de la Virreina como parada de Rodoreda | Es una localización del rodaje de 1982. |
| Coordenadas presentadas como open data verificado | Quedan marcadas como provisionales y la semilla nace en `DRAFT`. |
