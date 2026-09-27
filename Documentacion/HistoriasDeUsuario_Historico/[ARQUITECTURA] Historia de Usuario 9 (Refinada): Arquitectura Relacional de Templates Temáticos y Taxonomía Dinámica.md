# [ARQUITECTURA] Historia de Usuario 9 (Refinada S+ Grade): Arquitectura Relacional de Templates Temáticos y Taxonomía Dinámica

**Estatus:** Implementado / Certificado S+ Grade  
**Fecha de Revisión:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Autor:** Vértice Biológico & Arquitectura BarcelonaXplorer  
**Módulo:** Persistencia Relacional ([`src/prisma/schema.prisma`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma)), Vertical Slice Catálogo ([`src/features/guide-templates/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/)) y Motor Híbrido  

---

## Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Persistencia Relacional, Modelado de Dominio (DDD), Normalización OCP, Vertical Slicing, Fronteras Deterministas (Zod) e i18n Reactiva.
- **Entorno:** Ecosistema BarcelonaXplorer (Next.js 16 App Router, MySQL 8 / Prisma ORM, Motor Híbrido, LanceDB RAG y Panel Admin).
- **Entropía Asimilada:**
  - *Filtro A (Rigor Técnico y Erradicación de Alucinaciones):* Desmantelamiento de la colisión de slugs globales mediante la adopción de unicidad compuesta contextualizada por categoría (`@@unique([categoryId, slug])`), permitiendo que distintas temáticas compartan identificadores semánticos comunes (ej. `/guias/literatura/imprescindibles` y `/guias/arquitectura/imprescindibles`). Erradicación de la confusión topológica entre la consola de telemetría de infraestructura ([`/Admin/System`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/System/page.tsx)) y la gestión de catálogo editorial ([`/Admin/Templates`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/)). Preservación del anclaje espacial de Barcelona con coordenadas geográficas en cada nodo.
  - *Filtro B (Determinismo y Soberanía Arquitectónica):* Purificación topológica según DDD y Arquitectura Hexagonal: los esquemas deterministas Zod residen obligatoriamente en el estrato de dominio ([`src/features/guide-templates/domain/guide-template.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts)). Tipado estricto en camelCase con mapeo canónico SQL snake_case en Prisma. Integridad referencial determinista: bloqueo estricto (`onDelete: Restrict`) en categorías con guías hijas para proteger el patrimonio editorial, y borrado en cascada determinista (`onDelete: Cascade`) en los nodos secuenciales de un template.
  - *Filtro C (Eficiencia Termodinámica y Alineación con HU 12):* Eliminación del cuello de botella futuro en migraciones de Prisma (`prisma migrate dev`) al preconfigurar los conectores y modelos satélite bidireccionales de Internacionalización Reactiva Persistida ([`HU 12`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)), garantizando que los templates se sirvan en castellano (fallback universal) sin consumo de tokens, listos para traducirse bajo demanda sin alterar las entidades base.

---

## 1. Descripción General

**Como** Arquitecto de Software y Gestor de Contenidos de BarcelonaXplorer,  
**Quiero** establecer una estructura de base de datos relacional normalizada y gobernada por Prisma para el Catálogo de "Templates de Guías" que desacople la taxonomía de Categorías (`TemplateCategory`), las cabeceras de itinerario (`GuideTemplate`) y sus nodos secuenciales (`TemplateItem`), junto con los conectores relacionales para localización reactiva ([`HU 12`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)),  
**Para** permitir la creación, clasificación y publicación dinámica de verticales temáticas (ej. Literatura, Cine, Arquitectura Románica) desde el panel de administración sin ejecutar migraciones DDL ni despliegues de código, dotando al Motor Híbrido de paquetes hiper-curados con sabiduría táctica local y monetización asimétrica (CPA).

---

## 2. Justificación Arquitectónica y Principios de Forja

### 2.1. Normalización y Principio Abierto/Cerrado (OCP)
Restringir las categorías a un `enum` estático de TypeScript o Prisma fuerza un ciclo de despliegue continuo y una alteración de esquema DDL por cada vertical que el negocio desee explorar. Al aislar la taxonomía en la entidad relacional `TemplateCategory`, el sistema queda **abierto a la extensión** infinita de categorías temáticas desde base de datos, pero **cerrado a la modificación** del código fuente del motor.

### 2.2. Ley de Economía Termodinámica (Axioma I - Vertical Slicing)
En cumplimiento de [`ADR-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) y [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md), toda la lógica de templates se confina bajo el vertical slice `src/features/guide-templates/`. Quedan proscritos los árboles dispersos. Casos de uso, entidades, esquemas Zod en `domain/`, puertos de persistencia y adaptadores Prisma residirán adyacentes en un radio $\le 3$ archivos de salto contextual.

### 2.3. Tolerancia Cero a la Inferencia (Axioma II - Zod y Tipado Fuerte)
Los metadatos tácticos (`tacticalMetadata`) y las referencias de afiliación (`affiliateRefs`) almacenados en campos JSON de MySQL se blindan en la frontera de entrada y salida mediante esquemas **Zod** estrictos ubicados en el dominio, erradicando cualquier uso de `any`, `unknown` o aserciones forzadas (`!`).

---

## 3. Forja del Esquema Relacional (Prisma ORM)

La estructura relacional se define en el contrato canónico [`src/prisma/schema.prisma`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma). Incorpora identificadores CUID, marcas de tiempo de auditoría (`createdAt`, `updatedAt`), control de estado editorial (`isPublished`), nombres en camelCase para TypeScript y mapeos a columnas snake_case en MySQL.

Asimismo, **resuelve la colisión de slugs** mediante unicidad compuesta `@@unique([categoryId, slug])` y **deja preparados los conectores bidireccionales y tablas satélite para la Internacionalización Reactiva Persistida ([`HU 12`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md))**, erradicando bloqueos en futuras migraciones con `prisma migrate dev`:

```prisma
// ============================================================================
// CATÁLOGO DE TEMPLATES Y TAXONOMÍA DINÁMICA (MOTOR HÍBRIDO - HU 9 / HU 12)
// ============================================================================

enum TemplateStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

/// Taxonomía dinámica que gobierna la naturaleza y clasificación de las guías
model TemplateCategory {
  id           String                        @id @default(cuid())
  slug         String                        @unique @db.VarChar(64)
  name         String                        @db.VarChar(128)
  description  String                        @db.Text
  icon         String?                       @db.VarChar(64)
  displayOrder Int                           @default(0) @map("display_order")
  isActive     Boolean                       @default(true) @map("is_active")
  createdAt    DateTime                      @default(now()) @map("created_at")
  updatedAt    DateTime                      @updatedAt @map("updated_at")

  templates    GuideTemplate[]
  // Conector reactivo para Internacionalización Persistida (HU 12)
  translations TemplateCategoryTranslation[]

  @@index([slug])
  @@index([isActive, displayOrder])
  @@map("template_categories")
}

/// Cabecera de la ruta temática curada
model GuideTemplate {
  id                String                     @id @default(cuid())
  categoryId        String                     @map("category_id")
  category          TemplateCategory           @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  slug              String                     @db.VarChar(96)
  title             String                     @db.VarChar(255)
  abstract          String                     @db.Text
  estimatedDuration Int                        @map("estimated_duration") // Duración en minutos
  status            TemplateStatus             @default(DRAFT)
  isFeatured        Boolean                    @default(false) @map("is_featured")
  createdAt         DateTime                   @default(now()) @map("created_at")
  updatedAt         DateTime                   @updatedAt @map("updated_at")

  items             TemplateItem[]
  // Conector reactivo para Internacionalización Persistida (HU 12)
  translations      GuideTemplateTranslation[]

  // Unicidad contextualizada por categoría: permite slugs repetidos en distintas categorías
  @@unique([categoryId, slug])
  @@index([slug])
  @@index([status, isFeatured])
  @@map("guide_templates")
}

/// Nodos secuenciales y paradas físicas de la guía
model TemplateItem {
  id                String                    @id @default(cuid())
  templateId        String                    @map("template_id")
  template          GuideTemplate             @relation(fields: [templateId], references: [id], onDelete: Cascade)
  orderIndex        Int                       @map("order_index")
  title             String                    @db.VarChar(255)
  description       String                    @db.Text
  coordinatesLat    Float?                    @map("coordinates_lat")
  coordinatesLng    Float?                    @map("coordinates_lng")
  approxDurationMin Int                       @default(30) @map("approx_duration_min")
  tacticalMetadata  Json?                     @map("tactical_metadata") @db.Json
  affiliateRefs     Json?                     @map("affiliate_refs") @db.Json
  createdAt         DateTime                  @default(now()) @map("created_at")
  updatedAt         DateTime                  @updatedAt @map("updated_at")

  // Conector reactivo para Internacionalización Persistida (HU 12)
  translations      TemplateItemTranslation[]

  @@unique([templateId, orderIndex])
  @@index([templateId, orderIndex])
  @@map("template_items")
}

// ============================================================================
// MODELOS SATÉLITE DE LOCALIZACIÓN REACTIVA PERSISTIDA (CONECTORES HU 12)
// ============================================================================

/// Traducciones reactivas de categorías (Cache Miss persistido bajo demanda)
model TemplateCategoryTranslation {
  id          String           @id @default(cuid())
  categoryId  String           @map("category_id")
  category    TemplateCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  language    String           @db.VarChar(5) // ej. 'en', 'fr', 'de', 'it', 'ca'
  name        String           @db.VarChar(128)
  description String           @db.Text
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  @@unique([categoryId, language])
  @@index([language])
  @@map("template_category_translations")
}

/// Traducciones reactivas de cabeceras de guía
model GuideTemplateTranslation {
  id          String        @id @default(cuid())
  templateId  String        @map("template_id")
  template    GuideTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  language    String        @db.VarChar(5) // ej. 'en', 'fr', 'de', 'it', 'ca'
  title       String        @db.VarChar(255)
  abstract    String        @db.Text
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  @@unique([templateId, language])
  @@index([language])
  @@map("guide_template_translations")
}

/// Traducciones reactivas de paradas/nodos secuenciales
model TemplateItemTranslation {
  id          String       @id @default(cuid())
  itemId      String       @map("item_id")
  item        TemplateItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  language    String       @db.VarChar(5) // ej. 'en', 'fr', 'de', 'it', 'ca'
  title       String       @db.VarChar(255)
  description String       @db.Text
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  @@unique([itemId, language])
  @@index([language])
  @@map("template_item_translations")
}
```

### 3.1. Política Determinista de Integridad Referencial
1. **`TemplateCategory` $\rightarrow$ `GuideTemplate` (`onDelete: Restrict`):** Queda terminantemente prohibido borrar una categoría que contenga guías asociadas. El motor de base de datos bloqueará la operación, impidiendo la pérdida accidental de trabajo de curación humana y evitando la existencia de rutas huérfanas en la UI.
2. **`GuideTemplate` $\rightarrow$ `TemplateItem` (`onDelete: Cascade`):** Al purgar o eliminar un template específico, todos sus nodos e ítems secuenciales asociados se eliminan atómicamente en cascada, manteniendo la higiene de la base de datos sin necesidad de transacciones manuales dispersas.
3. **Maestros $\rightarrow$ Modelos Satélite de Traducción (`onDelete: Cascade`):** Si una categoría, guía o ítem maestro es eliminado, todas sus traducciones satélite en cualquier idioma son purgadas atómicamente en cascada.

---

## 4. Fronteras Deterministas (Esquemas Zod en Dominio)

Siguiendo el rigor de **DDD y Clean Architecture**, los esquemas de autovalidación de Objetos de Valor residen obligatoriamente en el estrato de dominio: [`src/features/guide-templates/domain/guide-template.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts):

```typescript
import { z } from 'zod';

/**
 * Sabiduría hiperlocal inyectada en cada nodo (Cuaderno Templates v1.1)
 */
export const TacticalMetadataSchema = z.object({
  // Escudo Anti-Trampas: Advertencias explícitas sobre timos y sobreprecios locales
  antiTrapShield: z.object({
    warnings: z.array(z.string().max(250)).default([]),
    recommendedAlternatives: z.array(z.string().max(250)).default([]),
  }).optional(),

  // Micro-Logística de Última Milla: Seguridad, transporte y tránsito
  microLogistics: z.object({
    pickpocketAlertLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']).default('LOW'),
    transitTips: z.string().max(300).optional(),
    realWalkingTimeMinutes: z.number().int().nonnegative().optional(),
  }).optional(),

  // Condicionales de Contexto Dinámico (Clima / Franja)
  environmentalConditions: z.object({
    rainFriendly: z.boolean().default(true),
    requiresDaylight: z.boolean().default(false),
  }).optional(),
}).strict();

export type TacticalMetadata = z.infer<typeof TacticalMetadataSchema>;

/**
 * Inyección de Afiliación Asimétrica (Táctica del Refugio)
 */
export const AffiliateProviderEnum = z.enum([
  'THE_FORK',
  'CIVITATIS',
  'TIQETS',
  'CABIFY',
  'FREE_NOW',
]);

export const AffiliateRefSchema = z.object({
  provider: AffiliateProviderEnum,
  externalId: z.string().max(64),
  campaignUrl: z.string().url().max(512),
  ctaLabel: z.string().max(60),
  placementTrigger: z.enum(['POST_WARNING', 'ROUTE_END', 'HIGH_QUEUE_MONUMENT', 'MEAL_TIME']),
}).strict();

export const AffiliateRefsSchema = z.array(AffiliateRefSchema);
export type AffiliateRefs = z.infer<typeof AffiliateRefsSchema>;
```

---

## 5. Coreografía de Integración en el Motor Híbrido

1. **Resolución de Enrutamiento Dinámico Jerárquico (Next.js PWA):**  
   La navegación pública consume los slugs normalizados:  
   `/guias/[categorySlug]/[templateSlug]` (ej. `/guias/rutas-literarias/la-sombra-del-viento`).  
   - `categorySlug` se resuelve con índice `@unique` sobre `TemplateCategory` ($O(1)$).
   - `templateSlug` se resuelve sobre `GuideTemplate` mediante el índice compuesto `[categoryId, slug]` ($O(1)$).  
   Esto erradica colisiones globales y permite que categorías independientes reutilicen slugs conceptuales idénticos (ej. `/guias/literatura/imprescindibles` y `/guias/arquitectura/imprescindibles`).
2. **Inyección en la Aduana Universal (SLM) y Orquestador (Gemini):**  
   Un proveedor de taxonomías en memoria/caché (`TaxonomyRegistry`) expone las categorías activas (`isActive = true`) al contexto del modelo ligero. Si el usuario solicita inspiración ("¿Qué rutas tenéis sobre libros?"), el SLM asocia la intención al slug correspondiente y recupera el `GuideTemplate` curado.
3. **Alineación con la Internacionalización Reactiva ([`HU 12`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)):**  
   Los templates almacenados en estas tablas constituyen la versión maestra en Castellano (`es`). Cuando un usuario opere en otro idioma validado (ej. Francés `fr`), la capa de orquestación consultará la tabla satélite de traducción (`GuideTemplateTranslation` / `TemplateItemTranslation`) precableada en el esquema. Si existe (Cache Hit), la devuelve inmediatamente (0 tokens). Si no existe (Cache Miss), dispara la traducción reactiva y persiste el resultado en la tabla satélite sin alterar el registro maestro.
4. **Anclaje Geográfico y Distancias Peatonales:**  
   Al disponer de `coordinatesLat` y `coordinatesLng`, los nodos del template se integran de forma natural con el motor geográfico (`GeographicScopeVO`) y el propagador cronológico ([`chronological-propagator.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/chronological-propagator.ts)), permitiendo calcular tiempos de caminata fidedignos e inyectar afiliación de movilidad (Cabify) si la distancia acumulada supera el umbral de fatiga.

---

## 6. Topología Física del Código (Axioma I - Vertical Slicing)

En estricta observancia del principio DDD, los contratos y esquemas Zod se alojan en `domain/`:

```
src/features/guide-templates/
├── domain/
│   ├── guide-template.entity.ts
│   ├── template-category.entity.ts
│   ├── guide-template.schema.ts
│   ├── guide-template.schema.test.ts
│   └── value-objects/
│       ├── template-slug.vo.ts
│       └── template-slug.vo.test.ts
├── ports/
│   ├── guide-template-repository.port.ts
│   └── template-category-repository.port.ts
├── adapters/
│   ├── prisma-guide-template.repository.ts
│   └── prisma-guide-template.repository.test.ts
├── use-cases/
│   ├── get-published-template-by-slug.use-case.ts
│   ├── get-published-template-by-slug.use-case.test.ts
│   ├── list-active-categories.use-case.ts
│   └── list-active-categories.use-case.test.ts
└── index.ts
```

---

## 7. Criterios de Aceptación (Verificación Empírica - Gherkin S+ Grade)

### Escenario 1: Creación Dinámica de Taxonomía desde Panel de Administración (Fricción Cero)
- **Dado** un operador autenticado en el panel de administración de contenidos (`/Admin/Templates` o `/Admin/Catalog`).
- **Cuando** registra una nueva categoría temática con `name: "Rutas de Cine"`, `slug: "rutas-de-cine"` y `description: "Localizaciones emblemáticas de películas filmadas en Barcelona"`.
- **Entonces** Prisma inserta el registro en la tabla `template_categories` validando la unicidad del `slug`.
- **Y** la nueva categoría queda inmediatamente disponible para asociar guías sin requerir reinicios de servidor, migraciones DDL ni despliegues de código.

### Escenario 2: Unicidad Compuesta y Reutilización de Slugs entre Categorías
- **Dado** un `GuideTemplate` existente bajo la categoría `"literatura"` con `slug: "imprescindibles"`.
- **Cuando** un operador crea otro `GuideTemplate` bajo la categoría `"arquitectura"` utilizando el mismo `slug: "imprescindibles"`.
- **Entonces** Prisma valida e inserta el registro satisfactoriamente gracias a la restricción compuesta `@@unique([categoryId, slug])`.
- **Y** ambas rutas coexisten pacíficamente en `/guias/literatura/imprescindibles` y `/guias/arquitectura/imprescindibles` sin conflicto de colisión.

### Escenario 3: Bloqueo de Integridad ante Borrado Accidental de Categoría (`onDelete: Restrict`)
- **Dado** una categoría existente `"rutas-literarias"` que contiene 3 registros de `GuideTemplate` asociados.
- **Cuando** un operador intenta ejecutar una mutación de borrado (`DELETE`) sobre dicha categoría sin haber reubicado o archivado previamente sus guías hijas.
- **Entonces** el motor relacional MySQL rechaza la operación por violación de clave foránea (`PrismaClientKnownRequestError: P2003`).
- **Y** el caso de uso devuelve un sobre de error determinista `OperationEnvelope` (`success: false`, `feedback: "No es posible eliminar una categoría con guías asociadas"`), preservando intacta la base de conocimiento curada.

### Escenario 4: Borrado en Cascada Seguro de Nodos Huérfanos y Traducciones Satélite (`onDelete: Cascade`)
- **Dado** un `GuideTemplate` de prueba `"ruta-fantasma"` con 5 `TemplateItem` y 2 registros en `GuideTemplateTranslation`.
- **Cuando** se ejecuta la eliminación autorizada del `GuideTemplate`.
- **Entonces** la base de datos elimina atómicamente la cabecera, los 5 nodos vinculados y las traducciones satélite asociadas mediante la regla en cascada configurada en Prisma.
- **Y** no queda ningún registro huérfano en las tablas dependientes.

### Escenario 5: Resolución Determinista de Ruta por Slugs Jerárquicos
- **Dado** un usuario que navega hacia la URL `/guias/rutas-literarias/la-sombra-del-viento`.
- **Cuando** el servidor resuelve la petición mediante el caso de uso `GetPublishedTemplateBySlugUseCase`.
- **Entonces** se ejecuta una consulta optimizada que recupera la categoría por `slug: "rutas-literarias"` y a continuación el template por su clave compuesta `[categoryId, slug]` con `status: PUBLISHED`.
- **Y** recupera los ítems ordenados estrictamente por `orderIndex ASC`, junto a sus metadatos tácticos parseados por Zod desde `domain/guide-template.schema.ts`, retornando un `OperationEnvelope<GuideTemplateDetailDTO>` en tiempo $< 25\text{ ms}$.

### Escenario 6: Validación Zod de Sabiduría Hiperlocal y Escudo Anti-Trampas
- **Dado** un payload administrativo para crear un `TemplateItem` con `tacticalMetadata`.
- **Cuando** los datos incluyen `antiTrapShield.warnings` y `microLogistics.pickpocketAlertLevel: "EXTREME"`.
- **Entonces** `TacticalMetadataSchema.parse()` valida con éxito la estructura tipada en el dominio.
- **Y** si se introduce un nivel no contemplado (ej. `"CRITICAL"`), el validador Zod rechaza la carga útil en la aduana de entrada con un error descriptivo, impidiendo la corrupción del almacén relacional.

### Escenario 7: Sincronización con el Catálogo del Motor Híbrido y Traducción Reactiva Persistida (HU 12)
- **Dado** un usuario interactuando con el chat que formula: *"¿Tenéis alguna ruta sobre libros o novelas?"* en idioma Francés (`fr`).
- **Cuando** el SLM de triaje detecta afinidad temática hacia la categoría activa `"rutas-literarias"`.
- **Entonces** el motor busca en `GuideTemplateTranslation` la versión francesa del template identificado; si existe la sirve al instante, y si no existe (Cache Miss) delega a Gemini la traducción de los campos textuales persistiendo el resultado en la tabla satélite precableada.
- **Y** se preservan intactos los identificadores base y coordenadas espaciales del registro maestro, eliminando cualquier duplicación redundante en la base de datos relacional.

---

## 8. Trazabilidad de PBIs Certificados (Grado S+)

| PBI | Identificador | Módulo | Estatus | Certificación |
| :--- | :--- | :--- | :--- | :--- |
| **PBI 1** | [`PBI-ARCH-TMPL-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Forja%20del%20Esquema%20Relacional%20de%20Templates%20y%20Conectores%20i18n%20en%20Prisma%20%28P1%29.md) | `src/prisma/schema.prisma` | Completado | 🟢 `prisma generate`, `tsc`, `eslint`, `vitest` |
| **PBI 2** | [`PBI-ARCH-TMPL-002`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Fronteras%20Deterministas%20Zod,%20Value%20Objects%20y%20Entidades%20de%20Dominio%20de%20Templates%20%28P1%29.md) | `src/features/guide-templates/domain/` | Completado | 🟢 19 tests colocados, 0 `any` |
| **PBI 3** | [`PBI-ARCH-TMPL-003`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Puertos%20Hexagonales%20y%20Adaptadores%20Prisma%20para%20Cat%C3%A1logo%20de%20Templates%20%28P1%29.md) | `src/features/guide-templates/ports/` & `adapters/` | Completado | 🟢 8 tests de integración Prisma |
| **PBI 4** | [`PBI-ARCH-TMPL-004`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Casos%20de%20Uso%20del%20Vertical%20Slice%20de%20Templates%20y%20Fachada%20de%20Dominio%20%28P1%29.md) | `src/features/guide-templates/use-cases/` | Completado | 🟢 9 tests de casos de uso, `OperationEnvelope` |
| **PBI 5** | [`PBI-ARCH-TMPL-005`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Exposici%C3%B3n%20del%20Cat%C3%A1logo%20en%20API%20Route%20y%20Sincronizaci%C3%B3n%20con%20Motor%20H%C3%ADbrido%20%28P2%29.md) | `src/app/api/guides/` | Completado | 🟢 4 tests de Route Handlers, caché HTTP |

### Validación Global de la Santa Trinidad de Oráculos
- **Compilador TypeScript:** `npx tsc --noEmit` $\rightarrow$ **0 errores**
- **Linter AST:** `npm run lint` $\rightarrow$ **0 errores, 0 warnings**
- **Suite de Tests:** `npm test` $\rightarrow$ **424/424 tests pasados (100%)** en 81 suites

