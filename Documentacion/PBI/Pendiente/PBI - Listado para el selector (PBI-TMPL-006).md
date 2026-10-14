# [ARQUITECTURA] PBI - Listado para el selector

**Identificador:** PBI-TMPL-006
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Motor Híbrido de Rutas Predefinidas](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Motor%20H%C3%ADbrido%20de%20Rutas%20Predefinidas%20%28%22Barcelona%20de%20libro%22%29%20e%20Inyecci%C3%B3n%20Contextual%20en%20Orquestador.md) (§8.6, escenario 2)
**Módulo:** `src/features/guide-templates/use-cases/list-published-templates.use-case.ts` · `src/app/api/guides/[categorySlug]/route.ts`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** El puerto `listPublishedByCategory` ya existe. Los campos de cabecera que el selector necesita llegan con PBI-TMPL-001.
**Bloquea:** PBI-TMPL-007

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Falta la ruta HTTP que liste las plantillas publicadas de una categoría. El detalle de una plantilla y el listado de categorías ya tienen ruta.
- **Entorno:** `GET /api/guides/categories` y `GET /api/guides/[categorySlug]/[templateSlug]` devuelven `OperationEnvelope` e inyectan el repositorio en la ruta. `listPublishedByCategory` filtra `status: PUBLISHED` y categoría activa; si no hay categoría, devuelve `[]`.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* El listado no traduce. El maestro es `es`. El `GET` de detalle sigue sin recibir `language`.
  - *Filtro B (Grano):* No se crea `findPublishedBySlug`.
  - *Filtro C (Señal):* Una plantilla `DRAFT` no aparece. La semilla de PBI-TMPL-002 permanece invisible para este endpoint.

---

## 0. Hecho vigente

`IGuideTemplateRepositoryPort.listPublishedByCategory(categorySlug)` devuelve `GuideTemplateDTO[]`. No hay caso de uso ni `src/app/api/guides/[categorySlug]/route.ts`. El test de rutas vive en `src/app/api/guides/__tests__/guides-routes.test.ts` y ya sustituye Prisma.

`GuideTemplateDTOSchema`, tras PBI-TMPL-001, es el que deja salir `mode`, `literaryMetadata`, `primaryAffiliateBookingUrl`, `abstract` y `estimatedDuration`. Este corte no redefine ese esquema: lo devuelve.

---

## 1. Declaración de Intención (INVEST)

**Como** explorador en el orquestador,
**Quiero** pedir las rutas publicadas de una categoría,
**Para** elegir una sin ver borradores ni abrir el detalle de cada slug.

---

## 2. Archivos

1. `src/features/guide-templates/use-cases/list-published-templates.use-case.ts`
2. `src/app/api/guides/[categorySlug]/route.ts`
3. `src/app/api/guides/__tests__/guides-routes.test.ts`

La ruta importa el caso de uso desde su archivo y el repositorio desde `@/features/guide-templates/server`, igual que las rutas hermanas. Si `server.ts` necesita una línea de export del caso de uso para seguir ese patrón, esa línea entra en el mismo corte y `index.ts` no la replica. Los componentes de cliente no importan `server.ts`.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Caso de uso):** `ListPublishedTemplatesUseCase` recibe `IGuideTemplateRepositoryPort` por constructor y `execute(categorySlug)` devuelve `OperationEnvelope<GuideTemplateDTO[]>`. Delega en `listPublishedByCategory`. Un slug inválido para `TemplateSlugVO` devuelve sobre de error 400 y no llama al repositorio.

- [ ] **CA-2 (Ruta):** `GET /api/guides/[categorySlug]` responde 200 con el sobre de éxito y el array del caso de uso. Categoría desconocida o inactiva: 200 y `result: []`, que es lo que el puerto ya hace. `Cache-Control` sigue el de `GET /api/guides/categories` (`public, s-maxage=3600, stale-while-revalidate=86400`).

- [ ] **CA-3 (Solo publicadas):** El test monta una fila `PUBLISHED` y comprueba que la respuesta la incluye con `slug`, `title`, `abstract`, `estimatedDuration` y `mode`. Una fila `DRAFT` de la misma categoría no está en el resultado. El filtro lo sigue haciendo el puerto; el test afirma el contrato HTTP, no reimplementa el `where`.

- [ ] **CA-4 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` sobre `guides-routes.test.ts`. Prisma va sustituido, como en los casos vecinos. Cero `any`. `npm run build` se añade porque el corte toca el barrel de servidor `server.ts` si esa línea de export entra.

---

## 4. Acción kaizen (no recaer)

La recaída es un `GET` que lea también `DRAFT` para que la semilla se vea en el selector antes de la revisión humana. El escenario 2 dice que el catálogo del §6 no aparece hasta el cambio de estado.

La otra recaída es resolver el listado con `findPublishedBySlug` o devolver el detalle completo de cada parada. El selector lista cabeceras. El detalle publicado ya tiene su ruta.

---

## 5. Fuera de alcance

- Pintar tarjetas, enviar slugs al triaje o previsualizar el medidor. Eso es PBI-TMPL-007.
- Pasar la cookie `bx_lang` al detalle o al listado.
- Cambiar `listPublishedByCategory` para que acepte `DRAFT`.
- Publicar la semilla.
