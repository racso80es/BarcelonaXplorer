# [ARQUITECTURA] PBI - Delta de persistencia y Zod de plantillas

**Identificador:** PBI-TMPL-001
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Motor Híbrido de Rutas Predefinidas](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Motor%20H%C3%ADbrido%20de%20Rutas%20Predefinidas%20%28%22Barcelona%20de%20libro%22%29%20e%20Inyecci%C3%B3n%20Contextual%20en%20Orquestador.md) (§3)
**Módulo:** `src/prisma/schema.prisma` · `src/features/guide-templates/domain/guide-template.schema.ts`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** HU-9 (tablas `TemplateCategory`, `GuideTemplate`, `TemplateItem`) y el Zod vigente en `guide-template.schema.ts`
**Bloquea:** PBI-TMPL-002, PBI-TMPL-005, PBI-TMPL-006

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Tres columnas nuevas en `GuideTemplate` y el Zod que las admite, incluida la ficha de semilla. `TemplateItem` no gana columnas.
- **Entorno:** MySQL/Prisma y el archivo de dominio que ya exporta `TacticalMetadataSchema` y `AffiliateRefSchema`. El barrel isomorfo sigue siendo `index.ts`. Este corte no toca `server.ts`.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* El maestro sigue en castellano. Este corte no escribe tablas `*Translation`.
  - *Filtro B (Grano):* La semilla YAML y el ingestor son PBI-TMPL-002. El peso del triaje es PBI-TMPL-003.
  - *Filtro C (Señal):* Una fila ya creada sigue siendo válida: `mode` nace con default `SELF_GUIDED_ITINERARY`.

---

## 0. Hecho vigente

`GuideTemplate` tiene `title`, `abstract`, `estimatedDuration`, `status` (`DRAFT` por defecto) y unicidad `@@unique([categoryId, slug])`. `TemplateItem.description` es el texto de la parada. `coordinatesLat` / `coordinatesLng` son anulables. `tacticalMetadata` y `affiliateRefs` viven en el ítem.

`CreateGuideTemplateInputSchema` exige `abstract` de al menos 10 caracteres y no conoce modalidad, URL de reserva ni ficha literaria. `GuideTemplateDTOSchema.parse` descarta claves que el esquema no declara: una columna nueva que no entre en el DTO no sale del repositorio.

`TemplateSlugVO` usa `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, longitud 2–96. El slug de categoría en Prisma es `VarChar(64)`.

---

## 1. Declaración de Intención (INVEST)

**Como** forjador del catálogo,
**Quiero** persistir la modalidad de la ruta, la URL de reserva de la cabecera y la ficha de la obra, y validar la semilla con el mismo Zod,
**Para** que una plantilla publicada pueda anclarse al orquestador sin inventar columnas en el ítem ni un segundo esquema paralelo.

---

## 2. Archivos

1. `src/prisma/schema.prisma`
2. `src/features/guide-templates/domain/guide-template.schema.ts`
3. `src/features/guide-templates/domain/guide-template.schema.test.ts`

La migración SQL que emita Prisma pertenece a `schema.prisma`. No se abre un cuarto diseño. `guide-template.entity.ts` queda fuera: si `tsc` falla por ese archivo, el corte se detiene y se reporta el hop, sin ampliar el diff por iniciativa.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Prisma):** `GuideTemplate` gana `mode` (`TemplateMode`: `SELF_GUIDED_ITINERARY`, `BOOKABLE_TOUR`, default `SELF_GUIDED_ITINERARY`), `primaryAffiliateBookingUrl` (`String?`, `@map("primary_affiliate_booking_url")`, `@db.VarChar(512)`) y `literaryMetadata` (`Json?`, `@map("literary_metadata")`). Ninguna columna existente se renombra. `TemplateItem` no cambia.

- [ ] **CA-2 (DTO):** `GuideTemplateDTOSchema`, `CreateGuideTemplateInputSchema` y el detalle que los extiende aceptan `mode`, `literaryMetadata` y `primaryAffiliateBookingUrl`. Un `parse` del DTO conserva esas claves. Los registros viejos, sin las claves, siguen parseando por el default de `mode`.

- [ ] **CA-3 (Ficha y semilla):** En el mismo archivo de dominio entran `TemplateModeEnum`, `LiteraryWorkMetadataSchema`, `TemplateWaypointItemSeedSchema` y `GuideTemplateSeedItemSchema`, con los límites del §3.3 de la HU. El regex de slug es el de `TemplateSlugVO`. `categorySlug` corta en 64. El esquema del ítem mapea `description`, `coordinates.lat` / `lng` y `approxDurationMin` a los campos que ya persiste `CreateTemplateItemInputSchema`. `locationName` alimenta la geocerca y no crea columna.

- [ ] **CA-4 (Tour publicado):** Un `BOOKABLE_TOUR` con `status: PUBLISHED` sin `primaryAffiliateBookingUrl` falla en `primaryAffiliateBookingUrl`. Un `BOOKABLE_TOUR` exige al menos dos ítems, con `orderIndex` 0 y `orderIndex` 1. Esos dos `approxDurationMin` son espera en el punto; la duración del bloque es `estimatedDuration` de la cabecera y este corte no la reparte sobre el nodo 1.

- [ ] **CA-5 (Decisión de desglose, borrador sin URL):** El YAML del §6 trae `sombra-del-viento-tour` en `DRAFT` y sin URL, porque la ficha `es` de Civitatis no está cerrada. El refine del §3.3, aplicado tal cual, rechazaría ese archivo entero. La regla que cierra este corte es: la URL es obligatoria al publicar; en `DRAFT` puede faltar. Un `BOOKABLE_TOUR` en `DRAFT` sin URL pasa el esquema. El caso de error del escenario 1 se prueba con un fixture `PUBLISHED` sin URL, no con el YAML canónico.

- [ ] **CA-6 (Geocerca):** El parse de la semilla falla si falta una coordenada, si el punto cae fuera de `GeographicScope.BOUNDING_BOX` (`lat` 41.317–41.468, `lng` 2.052–2.235), o si el topónimo (`locationName` y `title`) solo encaja con `PERIURBAN_EXCEPTIONS`. El texto tiene que resolver un distrito de `CANONICAL_DISTRICTS` o una clave de `CANONICAL_NEIGHBORHOODS`. Estar dentro de la caja no basta: el aeropuerto entra en la caja y sale por este criterio.

- [ ] **CA-7 (Idiomas y slug):** Una clave `ca` o `en` en el YAML falla en frontera. Un slug con guion doble, guion de borde o mayúsculas sin normalizar falla con la misma regla que `TemplateSlugVO`.

- [ ] **CA-8 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` sobre `guide-template.schema.test.ts`. Cero `any`. Los tests de `TacticalMetadataSchema` y `AffiliateRefSchema` siguen en verde.

---

## 4. Acción kaizen (no recaer)

La recaída es un `literaryContext` en el ítem, o reutilizar el `tacticalMetadata` de la parada para la ficha de la obra. La ficha va en `literary_metadata` de la cabecera.

La otra recaída es exigir la URL también en `DRAFT` y dejar el YAML del §6 imposible de ingestar. El rechazo sin URL pertenece al estado `PUBLISHED`.

---

## 5. Fuera de alcance

- Ingestar el YAML, upsert y abortar el lote: PBI-TMPL-002.
- Pesos de la matriz, slugs del triaje y reinyección de anclas.
- Añadir `GetYourGuide` o `CABIFY` a `EnrichedRoute`. `CABIFY` ya está en `AffiliateProviderEnum` de la plantilla y no entra en este corte.
- Rellenar `ca` / `en`. Eso sigue siendo el cache miss de HU-12.
- Pasar de `DRAFT` a `PUBLISHED`. Lo hace una revisión humana del callejero y, en el tour, de la ficha `es`.
