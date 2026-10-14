# [ARQUITECTURA] PBI - Salida y clic de afiliados

**Identificador:** PBI-AFF-003
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Ecosistema de Afiliación Asimétrica](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Ecosistema%20de%20Afiliaci%C3%B3n%20Asim%C3%A9trica.md) (HU-20, §4.4 y escenario 4)
**Módulo:** `src/app/api/affiliate/exit/` · `src/components/tactical/hybrid-canvas.tsx`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-AFF-002, que deja el destino `https` en la opción persistida. El itinerario ya se guarda con `PrismaItineraryRepository.saveItinerary` y se recupera con `getItineraryBySessionId`.
**Bloquea:** ninguno de esta historia

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El ancla del lienzo abre una ruta interna. Esa ruta escribe un `TelemetryLog` de clic y responde con redirección al destino guardado en la opción de esa sesión.
- **Entorno:** El ancla está en `HybridCanvas` (`target="_blank"`, `rel="noopener noreferrer"`). La cookie de sesión es `bx_session_id`. `/Admin/Logs` ya lista `TelemetryLog`.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* El destino sale de la opción persistida de la sesión, no de un parámetro que el navegador pueda cambiar.
  - *Filtro B (Grano):* `PROVIDER_AFFILIATE_FETCH` sigue significando «la ruta se enriqueció». El clic lleva otro `eventType`.
  - *Filtro C (Señal):* Sin cookie, sin la parada en el itinerario de esa sesión, o sin URL `https`, no hay redirección.

---

## 0. Hecho vigente

El enlace del lienzo es `<a href={opt.affiliateUrl} target="_blank" rel="noopener noreferrer">`. No llama a telemetría. No existe ruta de salida.

`PROVIDER_AFFILIATE_FETCH` se escribe en el triaje al enriquecer, con un solo `provider`, el `sessionId` y el recuento de opciones. Su esquema está en `telemetry.schema.ts` y entra en `HybridOrchestrationEventSchema`.

`ItineraryPersistencePort` puede guardar el itinerario, leer el activo de una sesión y actualizar la opción elegida. No hay un método de lectura por id de nodo suelto. Tras el guardado, el triaje devuelve los waypoints persistidos, con el id de base de datos.

`EnrichedRoute` no tiene id de plantilla. `TacticalItinerary` tampoco. `OrchestratorBlock` no pinta el CTA.

---

## 1. Declaración de Intención (INVEST)

**Como** explorador que pulsa el botón de una parada,
**Quiero** salir al proveedor en otra pestaña y dejar el clic en `TelemetryLog`,
**Para** que el enlace visible no sea el destino en crudo y el evento de enriquecimiento no se reutilice como si fuera un clic.

---

## 2. Archivos

1. `src/app/api/affiliate/exit/route.ts`
2. `src/app/api/affiliate/exit/route.test.ts`
3. `src/components/tactical/hybrid-canvas.tsx`

La aserción de render del ancla pertenece a `hybrid-canvas.test.tsx`, que ya está junto al componente. No se abre otro módulo. `telemetry.schema.ts` no gana un miembro de la unión: el payload del clic se valida con un Zod en la ruta y se persiste con `PrismaTelemetryRepository`. Si `tsc` exige tocar la unión, el corte se detiene y se reporta el hop.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Ancla):** Si la opción tiene `affiliateUrl`, el `href` visible es `/api/affiliate/exit` con `waypointId` y `optionId` de esa opción. Conserva `target="_blank"` y `rel="noopener noreferrer"`. Sin `affiliateUrl`, el botón no se pinta. `OrchestratorBlock` no gana un CTA.

- [ ] **CA-2 (Resolución):** La ruta lee la cookie `bx_session_id`, carga el itinerario activo de esa sesión y busca la opción. El destino es el `affiliateUrl` `https` guardado en esa opción. Una query con otra URL no cambia el destino.

- [ ] **CA-3 (Clic):** Antes de redirigir, persiste un `TelemetryLog` cuyo payload tiene `eventType: 'AFFILIATE_OUTBOUND_CLICK'`, `sessionId` igual a la cookie, `provider` con la clave del itinerario y `waypointId`. El `eventType` no es `PROVIDER_AFFILIATE_FETCH`. La respuesta es una redirección al destino.

- [ ] **CA-4 (Sin sesión o sin destino):** Sin cookie, con un `waypointId` que no está en el itinerario de esa sesión, o con la opción sin URL `https`, la respuesta es 404 y no hay redirección. No se fabrica un `sessionId`.

- [ ] **CA-5 (Fallo de telemetría):** Si el repositorio de telemetría rechaza la escritura, la redirección al destino ya resuelto se mantiene. El fallo de MySQL no corta la salida.

- [ ] **CA-6 (Plantilla):** El payload admite `templateId` opcional. Este corte no lo rellena: ni el itinerario ni la ruta enriquecida guardan ese id. Un `templateId` enviado en la query no se copia al log.

- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` sobre `route.test.ts` y `hybrid-canvas.test.tsx`, y `npm run build` porque el lienzo es un componente de cliente. El test de la ruta sustituye el repositorio de itinerarios y el de telemetría: no abre MySQL. Cero `any`.

---

## 4. Acción kaizen (no recaer)

La recaída es poner la URL del proveedor en el `href`, o aceptar el destino como parámetro de la query. El ancla solo identifica la parada y la opción; el destino lo lee el servidor en el itinerario de la cookie.

La otra recaída es escribir el clic con `eventType: 'PROVIDER_AFFILIATE_FETCH'`. Ese nombre queda para el enriquecimiento.

---

## 5. Fuera de alcance

- Un panel de conversión. `/Admin/Logs` ya muestra la fila.
- Ocultar `affiliateUrl` dentro del JSON que viaja al cliente. El `href` visible es la ruta interna; sustituir el campo en la respuesta del triaje sería otro archivo.
- Añadir `templateId` a `TacticalItinerary`.
- Enum de movilidad en `EnrichedRoute`, CTA por lluvia y alta de `GetYourGuide`.
