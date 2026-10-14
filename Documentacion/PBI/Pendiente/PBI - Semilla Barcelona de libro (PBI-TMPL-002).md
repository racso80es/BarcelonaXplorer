# [ARQUITECTURA] PBI - Semilla Barcelona de libro

**Identificador:** PBI-TMPL-002
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Motor Híbrido de Rutas Predefinidas](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Motor%20H%C3%ADbrido%20de%20Rutas%20Predefinidas%20%28%22Barcelona%20de%20libro%22%29%20e%20Inyecci%C3%B3n%20Contextual%20en%20Orquestador.md) (§6, escenario 1)
**Módulo:** `src/features/guide-templates/guide-templates.seed.yml` · `src/features/guide-templates/use-cases/guide-template-seed.service.ts`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-TMPL-001 (el Zod de semilla y las columnas)
**Bloquea:** Ningún corte de código. El catálogo permanece invisible mientras `status` sea `DRAFT` (`findPublished*` ya filtra).

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Carga idempotente de la categoría `barcelona-de-libro` y de cuatro plantillas en castellano. El archivo es el YAML del §6 de la HU, comentarios de coordenada provisional incluidos.
- **Entorno:** El patrón de ingesta ya existe en `ContextSourceSeedService`: `YAML.parse`, Zod en frontera, `OperationEnvelope`. El puerto de plantillas hoy tiene `create` y `createItem`, y no tiene upsert por `(categorySlug, slug)` que alcance filas `DRAFT`.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* No se copian la URL inglesa de Civitatis, prosa de guías ni fichas de touroperador. `primaryAffiliateBookingUrl` del tour queda ausente.
  - *Filtro B (Grano):* CKAN y Wikidata no rellenan esta semilla. `context_memory` no recibe la ruta.
  - *Filtro C (Señal):* Un fallo de geocerca o un `BOOKABLE_TOUR` publicado sin URL no escribe un subconjunto del lote.

---

## 0. Hecho vigente

`listPublishedByCategory` y `findPublishedByCategoryAndSlug` ignoran `DRAFT`. `create` inserta; una segunda pasada con el mismo `(categoryId, slug)` choca con la unicidad. No hay lectura de borrador por slug compuesto, así que la idempotencia no sale de encadenar `create`.

Las coordenadas del §6 son aproximaciones de trabajo. Los hechos literarios que el YAML puede afirmar están listados en ese apartado (Zafón 2001, Falcones 2006, Rodoreda 1962, y el perímetro público del tour de pago). La librería Sempere, el Fossar de les Moreres y la plaça de la Virreina no son ítems.

---

## 1. Declaración de Intención (INVEST)

**Como** operador del catálogo,
**Quiero** cargar y recargar la semilla de "Barcelona de libro" en castellano y en `DRAFT`,
**Para** tener el material listo para una revisión humana del callejero sin publicar rutas ni traducirlas.

---

## 2. Archivos

1. `src/features/guide-templates/guide-templates.seed.yml`
2. `src/features/guide-templates/use-cases/guide-template-seed.service.ts`
3. `src/features/guide-templates/use-cases/guide-template-seed.service.test.ts`

El servicio declara en su mismo archivo el puerto `GuideTemplateSeedPort` con un único método de lote, `upsertBatch`. El test inyecta un doble. El cuerpo Prisma que cumple ese puerto vive en `adapters/prisma-guide-template.repository.ts`: es la persistencia del escenario 1, no un diseño nuevo, y este corte no abre un archivo de puerto distinto. `schema.prisma` no se vuelve a tocar.

El YAML lleva comentarios semánticos (Axioma III): maestro `es`, estado `DRAFT`, coordenadas provisionales, URL `es` pendiente.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (El archivo canónico entra):** `guide-templates.seed.yml` es el documento del §6. Categoría `barcelona-de-libro` (`BookOpen`, `isActive: true`). Plantillas: `sombra-del-viento-itinerario`, `sombra-del-viento-tour`, `catedral-del-mar-itinerario`, `placa-del-diamant-gracia`. Todas en `DRAFT`. El tour es `BOOKABLE_TOUR` con `estimatedDuration: 120`, órdenes 0 y 1, y sin `primaryAffiliateBookingUrl`. La URL `https://www.civitatis.com/en/barcelona/shadow-of-the-wind-tour/` no se copia al campo.

- [ ] **CA-2 (Upsert en castellano):** Con el YAML canónico, el servicio valida con el Zod de PBI-TMPL-001 y llama `upsertBatch` una vez con la categoría, las cuatro cabeceras y sus ítems. El payload lleva `abstract`, `estimatedDuration`, `status: DRAFT`, `mode` y `literaryMetadata`. Cada ítem llega como `CreateTemplateItemInput` (`description`, las dos coordenadas, `approxDurationMin`, `orderIndex`, `title`). El tipo del lote no tiene colecciones de traducción. Una segunda ejecución pide el mismo upsert por `(categorySlug, slug)` y por `(template, orderIndex)`, sin otro método de inserción ciega.

- [ ] **CA-3 (Nada de satélites):** El doble no recibe escrituras hacia `TemplateCategoryTranslation`, `GuideTemplateTranslation` ni `TemplateItemTranslation`. Un YAML de prueba que añada `ca` o `en` devuelve `OperationEnvelope` de error (`success: false`) y el doble registra cero llamadas.

- [ ] **CA-4 (Lote atómico):** Un fixture con una coordenada fuera de `GeographicScope.BOUNDING_BOX`, un topónimo que solo nombra `PERIURBAN_EXCEPTIONS`, o un `BOOKABLE_TOUR` con `status: PUBLISHED` y sin URL, devuelve sobre de error y no llama a `upsertBatch`. El resto de plantillas de ese fixture tampoco se persiste. El YAML canónico, con el tour en `DRAFT` sin URL, sí llama al upsert (decisión CA-5 de PBI-TMPL-001).

- [ ] **CA-5 (Frontera):** El parse usa `YAML.parse`. El servicio no importa `server.ts` desde un componente. El adaptador Prisma, al implementar el puerto, hace la escritura en una transacción: categoría por `slug`, plantilla por `(categoryId, slug)`, ítem por `(templateId, orderIndex)`.

- [ ] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` sobre `guide-template-seed.service.test.ts`. El test no abre MySQL ni red. Cero `any`.

---

## 4. Acción kaizen (no recaer)

La recaída es dar por buena la semilla porque el primer `create` funciona y no volver a ejecutarla. El oráculo es la segunda pasada, con la misma clave compuesta.

La otra recaída es publicar las filas para que el selector las vea. `PUBLISHED` espera la comprobación del callejero y, en el tour, la ficha en castellano. Hasta entonces `findPublished*` las ignora.

---

## 5. Fuera de alcance

- Verificar coordenadas contra el callejero municipal y cambiar el estado a `PUBLISHED`.
- Confirmar la URL `es` y el `externalId` de Civitatis.
- Hidratar `ca` / `en` (HU-12, bajo demanda, en `GetPublishedTemplateBySlugUseCase`).
- Ingestar la ruta en `context_memory`.
- El selector y el listado HTTP. Con `DRAFT`, el escenario 2 sigue vacío aunque este corte esté en verde.
