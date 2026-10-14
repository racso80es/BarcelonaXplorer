# [ARQUITECTURA] PBI - Selector en el orquestador

**Identificador:** PBI-TMPL-007
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Motor Híbrido de Rutas Predefinidas](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Motor%20H%C3%ADbrido%20de%20Rutas%20Predefinidas%20%28%22Barcelona%20de%20libro%22%29%20e%20Inyecci%C3%B3n%20Contextual%20en%20Orquestador.md) (§4, escenario 2)
**Módulo:** `src/features/guide-templates/components/ThematicCategorySelector.tsx` · `src/features/guide-templates/components/RouteTemplatePickerCard.tsx` · `src/app/orchestrator/page.tsx`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-TMPL-003 (los dos slugs y `calculateMatrixDensity`) y PBI-TMPL-006 (`GET /api/guides/[categorySlug]`)
**Bloquea:** El escenario 2 de la HU

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** En `/orchestrator` el explorador elige una categoría y una plantilla publicada. El envío al triaje lleva los dos slugs junto al prompt. El medidor de verdad sigue siendo la respuesta del triaje.
- **Entorno:** El cuadro de prompt vive en `page.tsx` (`data-testid="orchestrator-prompt"`). El `POST /api/triage` de esa página manda hoy `{ prompt: userPrompt }`. `ThermalMeter` recibe el `TriageOutcomeDto` y no recalcula al pulsar una tarjeta.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* Los componentes leen HTTP. No importan `server.ts` ni el repositorio Prisma.
  - *Filtro B (Grano):* La previsualización usa `calculateMatrixDensity` con el mismo payload que se va a enviar. No hay una segunda fórmula en el cliente.
  - *Filtro C (Señal):* Con solo el ancla, el chip marca 45 y el umbral 60 no se cumple. Elegir la tarjeta no despacha.

---

## 0. Hecho vigente

`GET /api/guides/categories` ya lista categorías activas. Tras PBI-TMPL-006, `GET /api/guides/[categorySlug]` lista cabeceras `PUBLISHED`. La semilla nace en `DRAFT`, así que "Barcelona de libro" no pinta tarjetas hasta que una plantilla pase a `PUBLISHED`. El escenario 2 se prueba con un doble HTTP que devuelve una publicada, no con el YAML de borrador.

`calculateMatrixDensity` está en `src/features/planner/matrix.ts`. El cliente importa ese archivo, no un barrel que arrastre `server-only` (AUD-ARCH-BARREL-001). Los tipos de cabecera salen de `@/features/guide-templates` (`index.ts`), que ya reexporta el Zod de dominio.

45 puntos se muestran con el sufijo `%` que ya pinta el medidor. El chip de previsualización usa el mismo número.

---

## 1. Declaración de Intención (INVEST)

**Como** explorador,
**Quiero** elegir una ruta publicada de "Barcelona de libro" y seguir escribiendo mi contexto en el prompt,
**Para** que el triaje reciba la plantilla junto con lo que yo pedí, sin que la tarjeta sola dispare la ruta.

---

## 2. Archivos

1. `src/features/guide-templates/components/ThematicCategorySelector.tsx`
2. `src/features/guide-templates/components/RouteTemplatePickerCard.tsx`
3. `src/app/orchestrator/page.tsx`

El tercer archivo es el que ya posee el cuadro de prompt. No se extrae un volcado nuevo del formulario si el cambio cabe en el submit que ya existe.

El oráculo de UI va colocado junto a la tarjeta: `RouteTemplatePickerCard.test.tsx`. Es el test del componente que cambia, no un cuarto diseño. `page.tsx` solo cablea la selección al `fetch` existente.

Ambos componentes llevan `'use client'`.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Categorías):** `ThematicCategorySelector` lee `GET /api/guides/categories` y lista las activas, entre ellas el slug `barcelona-de-libro` cuando el doble lo devuelve. Al elegir una categoría pide `GET /api/guides/{categorySlug}` y pinta una `RouteTemplatePickerCard` por cabecera. Un `result: []` deja el selector sin tarjetas y el prompt sigue usable.

- [ ] **CA-2 (Envío):** Con una tarjeta elegida, el `POST /api/triage` que ya dispara el prompt incluye `selectedCategorySlug` y `selectedTemplateSlug` de esa cabecera, además de `prompt`. Sin tarjeta, el body sigue siendo el de hoy, sin esos campos. Con la tarjeta a medias (categoría sin plantilla) no se envía un slug suelto.

- [ ] **CA-3 (Chip):** La previsualización, calculada con `calculateMatrixDensity('default', payload)` y el mismo objeto que se enviaría, muestra 45 si no hay otras variables. El umbral pintado es 60. El número lleva el sufijo `%`. Pulsar la tarjeta no modifica el `score` que `ThermalMeter` recibió del último `TriageOutcomeDto`.

- [ ] **CA-4 (Barril):** Los dos componentes no importan `@/features/guide-templates/server` ni `server-only`. El test falla la compilación de cliente si aparece ese import. `npm run build` entra en el cierre por ser componente de cliente.

- [ ] **CA-5 (Borrador invisible):** El selector no tiene un atajo que lea `DRAFT`. Si el doble del listado omite `sombra-del-viento-itinerario`, la tarjeta no existe. El test del escenario 2 usa una cabecera `PUBLISHED` fabricada en el doble.

- [ ] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` sobre `RouteTemplatePickerCard.test.tsx` y `npm run build`. Cero `any`. El test no abre red: el `fetch` va sustituido.

---

## 4. Acción kaizen (no recaer)

La recaída es subir el `ThermalMeter` a 45 dentro del `onClick` de la tarjeta, con una suma escrita en el componente. El chip llama a `calculateMatrixDensity`. El medidor espera el DTO.

La otra recaída es mandar `anchored_template: true` desde el cliente. El body lleva slugs. El booleano lo escribe el servidor en PBI-TMPL-004.

---

## 5. Fuera de alcance

- Resolver la plantilla, sumar el bono en servidor o reinyectar anclas (PBI-TMPL-004 y PBI-TMPL-005).
- Publicar la semilla o comprobar coordenadas.
- Cambiar pesos, umbral o el copy del medidor más allá del chip de previsualización.
- Localizar las tarjetas a `ca` / `en`.
