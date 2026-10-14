# [ARQUITECTURA] PBI - Resolutor de afiliados

**Identificador:** PBI-AFF-002
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Ecosistema de Afiliación Asimétrica](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Ecosistema%20de%20Afiliaci%C3%B3n%20Asim%C3%A9trica.md) (HU-20, §4.2, escenarios 1, 2, 3 y 5)
**Módulo:** `src/features/planner/affiliate/`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-AFF-001. El corte A de [PBI-ORCH-PRO-001](../Realizado/Fricciones_interaccion_PRO_ruta_generada.md) ya está en el enriquecedor (`matchesKeyword` por palabra completa).
**Bloquea:** PBI-AFF-003 (el destino que la ruta de salida redirige)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El enriquecedor deja de escribir `bcn_xplorer`. Primero usa la URL curada; si no hay ficha y el proveedor de esa categoría está activo, rellena la plantilla del catálogo con el título.
- **Entorno:** `enrichRoute` sigue recibiendo la ruta y `operational` | `saturated`. Las fichas entran por un tercer argumento opcional. `triage-input.use-case.ts` hoy llama con dos argumentos.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* Una ficha se copia tal cual. No se le añade un segundo identificador.
  - *Filtro B (Grano):* La columna `primaryAffiliateBookingUrl` la añade PBI-TMPL-001. Este corte la lee si el llamador ya la trae.
  - *Filtro C (Señal):* Proveedor inactivo: el nodo conserva su categoría y sale sin `affiliateUrl`. No se cambia Tiqets por Civitatis.

---

## 0. Hecho vigente

`enrichWaypoint` clasifica con palabra completa. La rama gastronómica va antes que la cultural. Con gastronomía escribe TheFork; con cultura, Civitatis. Las dos plantillas llevan `bcn_xplorer`:

- `https://www.thefork.es/search?cityId=415144&query=<título>&tag=bcn_xplorer`
- `https://www.civitatis.com/es/barcelona/?query=<título>&aid=bcn_xplorer`

La segunda opción repite el mismo literal con el prefijo `tapas bar` o `tour guiado`. `priceEstimate` sale `25€ - 40€` o `18€ - 30€`, y `rating` sale `4.8` o `4.6`.

`STATIC_AFFILIATE_CATALOG` repite `bcn_xplorer` en El Xampanyet, Cervecería Catalana, Sagrada Família y Casa Batlló. Ningún servicio lo importa.

`TacticalWaypoint` no tiene `affiliateRefs`. `TemplateItem.affiliateRefs` ya guarda `provider`, `externalId`, `campaignUrl`, `ctaLabel` y `placementTrigger`. El enriquecedor no los lee. `GuideTemplate` todavía no tiene `primaryAffiliateBookingUrl`.

`placementTrigger` solo se escribe `HIGH_QUEUE_MONUMENT` cuando el estado es `saturated` y el conocimiento táctico marca cola alta. `MEAL_TIME` y `ROUTE_END` no se asignan. `enrichRoute` no recibe lluvia.

El test «La ciudad no es un restaurante» ya exige que «Barcelona» y «barrio» no arrastren `THEFORK`.

---

## 1. Declaración de Intención (INVEST)

**Como** explorador que recibe una parada ya clasificada,
**Quiero** que el botón use la ficha curada o una búsqueda firmada con la plantilla del entorno,
**Para** que una credencial ausente omita el enlace y el literal `bcn_xplorer` no vuelva a salir del servidor.

---

## 2. Archivos

1. `src/features/planner/affiliate/affiliate-enricher.service.ts`
2. `src/features/planner/affiliate/affiliate-enricher.service.test.ts`
3. `src/features/planner/affiliate/static-affiliate-catalog.ts`

El catálogo de PBI-AFF-001 se importa; no se rediseña. `triage-input.use-case.ts` mantiene la llamada de dos argumentos: el tercer argumento es opcional. Si `tsc` falla por el triaje, el corte se detiene y se reporta el hop.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Ficha curada):** Con Civitatis activo y un `affiliateRefs` de ese waypoint cuyo `provider` es `CIVITATIS` y cuyo `campaignUrl` es una URL `https`, `affiliateUrl` de la opción es esa URL, carácter a carácter. Lo mismo si el argumento trae `mode: 'BOOKABLE_TOUR'` y `primaryAffiliateBookingUrl`. Una ficha que ya incluye el seguimiento no recibe otro id.

- [ ] **CA-2 (Búsqueda firmada):** Con TheFork activo, sin `campaignUrl`, y una parada `GASTRONOMY` por una palabra completa de la lista gastronómica, la URL de destino es la plantilla del catálogo con el título en `{query}`. `tag=bcn_xplorer` y `aid=bcn_xplorer` no aparecen. La segunda opción no recibe una URL fabricada con `tapas bar` ni con `tour guiado`.

- [ ] **CA-3 (Proveedor inactivo):** Con la variable de Tiqets vacía y la de Civitatis vacía, una parada cultural sale sin `affiliateUrl` y con `affiliateProvider: 'NONE'`. La categoría sigue siendo `CULTURE`. No aparece un botón Civitatis de sustitución. Si esa misma parada trae su propia ficha Civitatis y Civitatis está activo, se usa esa ficha.

- [ ] **CA-4 (Un proveedor de búsqueda por categoría):** Sin ficha, `GASTRONOMY` usa la fila TheFork si está activa. `CULTURE` usa la primera fila cultural activa de la matriz (`CIVITATIS`, después `TIQETS`). Si Tiqets está activo y Civitatis no, la búsqueda cultural usa la plantilla de Tiqets y el enum del itinerario admite `TIQETS` en ese momento. Si Tiqets está inactivo, el enum no necesita emitirlo.

- [ ] **CA-5 (Precios de relleno):** `priceEstimate` y `rating` salen omitidos. La ficha vigente (`campaignUrl`, `ctaLabel`, `placementTrigger`) no trae precio ni valoración, y este corte no los inventa.

- [ ] **CA-6 (Disparadores):** Con TheFork activo, la opción gastronómica que lleva URL queda con `placementTrigger: 'MEAL_TIME'`. `HIGH_QUEUE_MONUMENT` y el copy de acceso prioritario se conservan cuando el conocimiento marca cola alta, el estado es `saturated` y el proveedor cultural está activo. Sin ese proveedor, el copy puede quedar y la URL no. `ROUTE_END` no se asigna. Los `warnings` del escudo siguen saliendo aunque no haya afiliado.

- [ ] **CA-7 (Ciudad):** El test de «Barcelona» y «barrio» sigue en verde: esa parada no lleva `THEFORK`. Una parada con la palabra completa `bar` o `restaurante`, y TheFork activo, sí entra en la búsqueda firmada.

- [ ] **CA-8 (Catálogo estático):** Las cuatro `affiliateUrl` de `static-affiliate-catalog.ts` que contienen `bcn_xplorer` se retiran. El archivo deja de contener el literal. Sigue sin ser importado por el enriquecedor.

- [ ] **CA-9 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` sobre `affiliate-enricher.service.test.ts`. Los tests existentes de refugio, Ramblas y acceso prioritario siguen en verde, con las URL y los precios ajustados a estas reglas. Cero `any`.

---

## 4. Acción kaizen (no recaer)

La recaída es dejar `tag=bcn_xplorer` como valor por defecto cuando la variable viene vacía, o clasificar otra vez con `includes` de la subcadena `bar`.

La otra recaída es rellenar la segunda opción con una búsqueda inventada. Sin segunda ficha, esa opción no lleva URL.

---

## 5. Fuera de alcance

- Pasar las fichas desde `triage-input.use-case.ts` o desde `GuideTemplate`. El argumento opcional queda listo para ese llamador.
- Crear la columna `primaryAffiliateBookingUrl`. Eso es PBI-TMPL-001.
- La ruta interna de clic y el `href` del lienzo: PBI-AFF-003.
- El literal `bcn_xplorer` que aún está en `src/features/telegram/reactive/indoor-tactical-shelters.ts`. La patrulla no es el CTA del itinerario y esta historia no la modifica.
- Cabify, Free Now, lluvia y `GetYourGuide`.
