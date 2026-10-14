# [ARQUITECTURA] PBI - Resolución de la plantilla en el triaje

**Identificador:** PBI-TMPL-004
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Motor Híbrido de Rutas Predefinidas](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Motor%20H%C3%ADbrido%20de%20Rutas%20Predefinidas%20%28%22Barcelona%20de%20libro%22%29%20e%20Inyecci%C3%B3n%20Contextual%20en%20Orquestador.md) (§4, diagrama §5)
**Módulo:** `src/features/triage/triage-input.use-case.ts` · `src/app/api/triage/route.ts`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-TMPL-003. El caso de uso `GetPublishedTemplateBySlugUseCase` ya existe y ya devuelve `OperationEnvelope`.
**Bloquea:** PBI-TMPL-005 (las anclas que este corte deja resueltas)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Antes de `calculateMatrixDensity`, el triaje resuelve la plantilla publicada y solo entonces escribe `anchored_template: true` en el payload que ya puntúa.
- **Entorno:** `POST /api/triage` construye `TriageInputUseCase` por constructor. `GET /api/guides/[categorySlug]/[templateSlug]` hoy llama al mismo caso de uso sin `language`. La cookie de idioma es `bx_lang`.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* La resolución de este corte pide idioma `es`. Un `ca` / `en` de la cookie no dispara el cache miss de HU-12 dentro del triaje.
  - *Filtro B (Grano):* No se crea `findPublishedBySlug`. La unicidad es `(categorySlug, templateSlug)`.
  - *Filtro C (Señal):* Slug desconocido, plantilla ausente o `DRAFT` (el caso de uso publicado no la devuelve) dejan el prompt en su curso, con score sin los 45.

---

## 0. Hecho vigente

`TriageInputUseCase.execute` fusiona el payload heurístico y llama a `calculateMatrixDensity` en el paso 5, antes del despacho. `route.ts` no instancia `GetPublishedTemplateBySlugUseCase`.

Ese caso de uso, con `language` distinto de `es` y sin traducción persistida, entra en cache miss y puede llamar a Gemini si recibe `translationService`. Con `language: 'es'` devuelve el maestro en el cache hit y no traduce.

Un fallo de búsqueda es `success: false` y `exitCode: 404`, no una excepción. `DRAFT` no sale de `findPublishedByCategoryAndSlugLocalized`.

El constructor del triaje ya tiene muchos argumentos opcionales al final. El nuevo colaborador entra por ese constructor, inyectado en `route.ts`, no como singleton oculto dentro del caso de uso.

`server.ts` de guide-templates lleva `import 'server-only'`. El caso de uso de plantilla se importa desde su archivo (`use-cases/get-published-template-by-slug.use-case.ts`). El adaptador Prisma se instancia en la ruta, que ya es servidor. El barrel isomorfo `index.ts` no gana exports de servidor.

---

## 1. Declaración de Intención (INVEST)

**Como** explorador que eligió una ruta publicada y escribió el resto del prompt,
**Quiero** que el triaje sume 45 puntos solo si esa pareja de slugs existe y está publicada,
**Para** que un slug inventado o un borrador no acerquen el medidor al despacho.

---

## 2. Archivos

1. `src/features/triage/triage-input.use-case.ts`
2. `src/app/api/triage/route.ts`
3. `src/features/triage/triage.test.ts`

La reinyección de anclas dentro de `GenerateTacticalRouteUseCase` es PBI-TMPL-005. Este corte puede dejar la plantilla resuelta en una variable local del triaje, lista para pasarla en la llamada `execute` que el corte siguiente ampliará. Hasta entonces esa llamada sigue recibiendo `prompt` y `environment` como ahora.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Los dos slugs):** Si el body trae `selectedCategorySlug` y `selectedTemplateSlug`, el triaje llama a `GetPublishedTemplateBySlugUseCase.execute` con esos dos valores y `language: 'es'` antes de la primera evaluación de densidad del turno. Con uno solo, o con ninguno, no hay llamada y el payload no lleva `anchored_template`.

- [ ] **CA-2 (Solo un success suma):** Con `success: true`, el payload que entra en `calculateMatrixDensity` tiene `anchored_template: true`. El score de un payload que no traiga otra variable es 45 y `isThresholdSatisfied` es falso. Con `group_size` ya presente, el umbral 60 se cumple por 45 + 15.

- [ ] **CA-3 (Ausente o borrador):** Con `success: false` (404 u otro sobre de error) el payload no lleva `anchored_template`, el prompt sigue el flujo que ya tenía y el turno no responde 500 por la plantilla. Un doble que devuelva null no se trata como publicada.

- [ ] **CA-4 (Inyección):** `route.ts` construye el caso de uso de plantilla con `PrismaGuideTemplateRepository` y lo pasa al constructor de `TriageInputUseCase`. Los tests que no pasan ese colaborador conservan el comportamiento actual: ningún bono. El caso de uso de plantilla se construye sin `translationService`.

- [ ] **CA-5 (Idioma maestro):** Aunque la cookie `bx_lang` sea `ca` o `en`, esta resolución pide `es`. El test afirma que la llamada lleva `language: 'es'`. La ficha localizada del `GET` de guías sigue fuera de este corte.

- [ ] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` sobre `triage.test.ts`. El test sustituye el caso de uso de plantilla y no abre MySQL, red ni el gateway. Cero `any`.

---

## 4. Acción kaizen (no recaer)

La recaída es puntuar primero y consultar la plantilla después, o fiarse de un booleano que venga en el body. El orden de este corte es: parse de entrada, resolución, y solo entonces `calculateMatrixDensity`.

La otra recaída es pedir la plantilla en el idioma de la cookie y abrir una traducción Gemini en medio del triaje. La ancla se resuelve en castellano.

---

## 5. Fuera de alcance

- Reescribir el `systemInstruction` de `generateTacticalRoute` o editar `ia-gateway.client.ts`.
- Colocar los ítems en su `orderIndex` después del parse de la ruta. Eso es PBI-TMPL-005.
- Listar plantillas para el selector (PBI-TMPL-006) y pintar la tarjeta (PBI-TMPL-007).
- Pasar `language` al `GET /api/guides/[categorySlug]/[templateSlug]`.
