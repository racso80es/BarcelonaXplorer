# [ARQUITECTURA] PBI - Reinyección de anclas

**Identificador:** PBI-TMPL-005
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Motor Híbrido de Rutas Predefinidas](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Motor%20H%C3%ADbrido%20de%20Rutas%20Predefinidas%20%28%22Barcelona%20de%20libro%22%29%20e%20Inyecci%C3%B3n%20Contextual%20en%20Orquestador.md) (§5, escenarios 3 y 4)
**Módulo:** `src/features/planner/generate-tactical-route.use-case.ts` · `src/features/triage/triage-input.use-case.ts`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-TMPL-001 (forma de la plantilla) y PBI-TMPL-004 (plantilla ya resuelta en el triaje)
**Bloquea:** El escenario 3 y el escenario 4 de la HU

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Después de parsear la ruta del modelo, el caso de uso vuelve a colocar cada `TemplateItem` en su `orderIndex`, con su `description`, sus coordenadas y su `tacticalMetadata`. El modelo puede rellenar huecos. No puede borrar un ancla ni cambiarle el orden.
- **Entorno:** `GenerateTacticalRouteUseCase.execute` pide como máximo 5 entradas vigentes de `context_memory`, sin radio, y llama a `aiPort.generateTacticalRoute(effectivePrompt)`. El `systemInstruction` fijo de ese método no se edita. `ia-gateway.client.ts` no se edita.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* Las anclas viajan en el prompt de usuario y en el objeto que el triaje ya resolvió.
  - *Filtro B (Grano):* El RAG no es el inventario de la ruta. Un hueco gastronómico sigue saliendo del enriquecedor como URL de búsqueda `THEFORK`, construida con el título.
  - *Filtro C (Señal):* `EnrichedRoute` no promete Cabify. El tramo bloqueado de un `BOOKABLE_TOUR` dura `estimatedDuration` de la cabecera, del orden 0 al orden 1.

---

## 0. Hecho vigente

`GenerateTacticalRouteInput` es `{ prompt, environment? }`. El triaje, al despachar, llama `routeUseCase.execute` con un prompt enriquecido de idioma, geo y matriz. No hay anclas estructuradas.

`TacticalWaypointZodSchema` tiene `id`, `title`, `description`, `coordinates`, `timeSpan` y `recommendations`. No tiene `orderIndex` ni `tacticalMetadata`. `TimeSpanZodSchema` exige `start` (y `end` opcional) con `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`.

`AffiliateEnricherService.enrichWaypoint` calcula `tacticalMetadata` desde su base interna y no lee un escudo que ya trajera el waypoint. `EnrichedRouteSchema` no tiene `mode`, `literaryMetadata` ni `primaryAffiliateBookingUrl`. Un campo colgado en la ruta táctica desaparece en `EnrichedRouteSchema.parse`.

Ese es el sitio donde el escenario 3 se quedaría en el caso de uso y no llegaría al itinerario que ve el explorador. El cierre de este corte incluye ese paso, nombrado abajo, porque el escenario habla del itinerario.

---

## 1. Declaración de Intención (INVEST)

**Como** explorador con una plantilla publicada ya anclada,
**Quiero** que el itinerario conserve el orden, el texto y las coordenadas de esas paradas, y deje hueco a lo que pedí en el prompt,
**Para** que una frase del modelo que reordene las paradas no sea la única garantía.

---

## 2. Archivos

1. `src/features/planner/generate-tactical-route.use-case.ts`
2. `src/features/planner/generate-tactical-route.test.ts`
3. `src/features/triage/triage-input.use-case.ts` (pasar las anclas ya resueltas en la llamada `execute` que ya existe)

No se edita `ia-gateway.client.ts`.

Para que el parse no borre el ancla, este corte también escribe los opcionales en los dos esquemas que el flujo ya parsea. Son el contrato de la ruta, no un diseño paralelo:

- `src/features/planner/tactical-route.schema.ts`: el waypoint admite `orderIndex` y `tacticalMetadata` opcionales; la ruta admite `mode`, `literaryMetadata`, `primaryAffiliateBookingUrl` y `estimatedDuration` opcionales.
- `src/features/planner/affiliate/affiliate-enricher.schema.ts` y `affiliate-enricher.service.ts`: la cabecera se copia al `EnrichedRoute`; si el waypoint ya trae `tacticalMetadata`, ese valor se conserva y el sintético solo se construye cuando falta.

Si el forjador llega a un quinto archivo de comportamiento distinto de estos, se detiene. El test del enriquecedor que ya existe afirma el caso nuevo junto al servicio, sin relajar el del restaurante ni el de la Sagrada Família.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Entrada):** `GenerateTacticalRouteInput` acepta un opcional con la plantilla ya resuelta: `mode`, `estimatedDuration`, `literaryMetadata`, `primaryAffiliateBookingUrl` y los ítems (`orderIndex`, `title`, `description`, coordenadas, `approxDurationMin`, `tacticalMetadata`). Sin ese opcional, `execute` se comporta como ahora. El triaje solo lo pasa cuando PBI-TMPL-004 obtuvo `success`.

- [ ] **CA-2 (Prompt de usuario):** El texto que llega a `aiPort.generateTacticalRoute` incluye las anclas en orden (título, descripción, coordenadas, `orderIndex`). El test espía ese argumento. El system prompt global no forma parte del diff.

- [ ] **CA-3 (`SELF_GUIDED_ITINERARY`):** Dado un modelo que omite un ítem, intercambia dos y mete un waypoint de comida entre medias, la ruta devuelta contiene cada ítem de la plantilla en su `orderIndex` relativo, con la `description`, las coordenadas y el `tacticalMetadata` de la plantilla (no los que haya reescrito el modelo). El waypoint de comida sigue en el hueco. Los `timeSpan` presentes cumplen `TimeSpanZodSchema`.

- [ ] **CA-4 (Hueco gastronómico):** Un hueco cuyo texto el enriquecedor clasifica como gastronomía sale con `affiliateProvider: 'THEFORK'` y una URL de búsqueda construida con el título. El itinerario no afirma un restaurante a menos de diez minutos. El RAG del caso de uso sigue limitado a 5 entradas no caducadas, sin filtro por radio.

- [ ] **CA-5 (`BOOKABLE_TOUR`):** Los ítems 0 y 1 quedan como encuentro y cierre. El tramo entre ambos dura `estimatedDuration` minutos de la cabecera (los `approxDurationMin` de esos dos nodos siguen siendo la espera). La ruta enriquecida muestra `primaryAffiliateBookingUrl`, `mode` y `literaryMetadata`. Los huecos posteriores al nodo 1 siguen el CA-3 y el CA-4. El copy de la semilla no llama free tour al producto de pago; este corte no inventa otro copy.

- [ ] **CA-6 (El escudo sobrevive):** `enrichWaypoint` conserva el `tacticalMetadata` del ancla. Un waypoint sin ese campo sigue recibiendo el metadato sintético que el enriquecedor ya construye. `EnrichedRouteSchema.parse` no elimina la cabecera del CA-5.

- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` sobre `generate-tactical-route.test.ts` y el test del enriquecedor tocado en el CA-6. El puerto de IA y el de contexto son dobles. Cero `any`. Ningún test llama a `ia-gateway`.

---

## 4. Acción kaizen (no recaer)

La recaída es añadir al prompt una frase que prohíba reordenar y dar el escenario por cerrado. El oráculo reordena a propósito la respuesta del doble y comprueba el `orderIndex` después del parse.

La otra recaída es cambiar el `systemInstruction` de `generateTacticalRoute`. Ese texto vale para las rutas sin plantilla. Las anclas van en el prompt de usuario y en el objeto resuelto.

---

## 5. Fuera de alcance

- Editar `ia-gateway.client.ts` o el system prompt global.
- Añadir `CABIFY` o `GetYourGuide` a `AffiliateProviderSchema` del enriquecedor.
- Sustituir la URL de búsqueda de TheFork por una ficha firmada. Eso pertenece a la línea de afiliación (PBI-AFF-002 cuando exista `AFFILIATE_THEFORK_ID`).
- Hacer que el RAG filtre por radio o devuelva restaurantes geocodificados.
- Publicar la semilla o construir el selector.
