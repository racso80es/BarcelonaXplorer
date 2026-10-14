# [OPERATIVO] Documento Destilado: PBI - Fricciones de interacción en PRO tras una ruta generada

**Identificador:** PBI-ORCH-PRO-001
**Estatus:** Completado
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Ecosistema de Afiliación Asimétrica](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Ecosistema%20de%20Afiliaci%C3%B3n%20Asim%C3%A9trica.md) (HU-20, solo el corte A) · anclaje Telegram ya forjado · matriz `default` del triaje
**Módulo:** `src/features/planner/affiliate/affiliate-enricher.service.ts` · `src/app/orchestrator/page.tsx` · `src/features/triage/triage-input.use-case.ts`
**Entorno:** Producción. Ciclo señalado por el operador: telemetría `cmv8056at001cpnv32fuskot8` y `cmv80sfzo002bpnv307kjj369`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 8 Story Points, en tres forjas (2 + 3 + 3). Cada corte se entrega solo.
**Depende de:** HU-20 existe y no se reescribe aquí. El corte A no espera a las cuentas de afiliado.
**Bloqueo:** El cuerpo del prompt de `cmv80sfzo002bpnv307kjj369` no está en el repo. El corte C empieza leyendo esa fila. Si la fila ya no está, se usa el caso del §0.3.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Tres fricciones vistas en la misma sesión de PRO. No comparten causa. El lienzo marca paradas como gastronómicas y les pone un buscador de TheFork. El botón «Forjar Ruta Inmediata» abre otro turno de triaje y no escribe en Telegram. Un prompt que ya fijaba el día (un domingo) volvió como matriz al 15 % pidiendo horas.
- **Entorno:** UI del orquestador, enriquecedor de afiliados y heurística de `time_window`. Los textos citados están en el diccionario y en el fallback del SLM, así que el estado de cada turno se lee sin abrir la fila.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Soberanía):* No se da de alta ninguna cuenta de afiliado ni se inventa un `AFFILIATE_THEFORK_ID`. Eso es la tarea VB-03 de HU-20.
  - *Filtro B (Grano):* El catálogo de proveedores, la plantilla firmada y la telemetría de clic son PBI-AFF-001, PBI-AFF-002 y PBI-AFF-003. Este PBI no los adelanta.
  - *Filtro C (Señal):* Una parada sin término gastronómico de palabra completa no lleva proveedor `THEFORK`. Un día ya dicho no se repregunta como si no existiera.

---

## 0. Hecho observado

### 0.1 Todas las paradas salen «Gastronómico» y, si hay reserva, el enlace es un buscador de TheFork

URL vista en PRO:

`https://www.thefork.es/search?cityId=415144&query=Experiencia%20M%C3%A1gica%20en%20El%20Bosc%20de%20les%20Fades&tag=bcn_xplorer`

Esa URL es la plantilla de `AffiliateEnricherService`, no una ficha del local. `cityId=415144` y `tag=bcn_xplorer` van escritos en el fuente. `tag` no lee ninguna variable de entorno.

La categoría y el proveedor salen del mismo método. Sobre `título + descripción` en minúsculas se hace `includes` de una lista. La rama gastronómica va antes que la cultural. La lista contiene la subcadena `bar` y la subcadena `cafe`.

`bar` aparece dentro de `Barcelona` y de `barrio`. Una parada cuyo texto menciona la ciudad o un barrio entra en `GASTRONOMY`, recibe `affiliateProvider: 'THEFORK'` y la plantilla de búsqueda con el título en `query`. El lienzo traduce `GASTRONOMY` a la etiqueta «Gastronómico» (`CATEGORY_DICTIONARY_KEY` en `hybrid-canvas.tsx`). Por eso el operador ve el mismo tipo en todas las paradas.

Una parada cultural (Sagrada Família, museo, Park Güell) no llega a `CIVITATIS` si el texto ya cazó `bar`. El test del enriquecedor cubre un restaurante y la Sagrada Família, y no afirma la categoría cuando el texto dice «Barcelona» o «barrio».

El Bosc de les Fades puede ser un local de verdad. Clasificarlo como gastro no arregla el enlace: sigue siendo una búsqueda con un `tag` de relleno. Firmar ese enlace es PBI-AFF-002, cuando exista `AFFILIATE_THEFORK_ID`.

### 0.2 «Forjar Ruta Inmediata» no llega a Telegram

El botón del medidor es `ui.thermalMeter.forgeRoute`: «Forjar Ruta Inmediata». Solo se pinta si el umbral ya se cumplió. Al pulsarlo, `handleForceDispatch` añade un turno cuyo texto es «Por favor, forja la ruta táctica inmediata con el contexto actual.» y lo manda a `POST /api/triage`. No busca `UserAnchor`, no llama a `sendMessage` y no abre el deep link.

Telegram, hoy, va por otro sitio. `TelegramAnchorDrop` pide `GET /api/telegram/anchor-link` y muestra «Asegurar Ruta en Telegram» (`https://t.me/...?start=`). `GenerateMagicLinkUseCase` manda un enlace al chat, y solo cuando el mensaje nace en el bot. La patrulla manda lluvia o Cabify, no la ruta que está en pantalla.

Lo que el operador esperaba: si la sesión ya tiene anclaje, el chat recibe el enlace de esa ruta; si no lo tiene, esa pulsación inicia el anclaje. La pulsación actual no hace ninguna de las dos cosas.

### 0.3 El domingo ya estaba en el prompt y la UI pidió horas

Petición `cmv80sfzo002bpnv307kjj369`. El operador leyó el prompt: el día ya era un domingo. La UI mostró:

- «Matriz incompleta (15%). Variable crítica: time_window»
- «¡Suena genial! Para calibrar el ritmo exacto de la ruta, ¿cuántas horas o qué parte del día tienes disponible?»

Esas dos cadenas son literales. La primera la arma el orquestador cuando `status === 'INCOMPLETE_REPROMPT'`. La segunda es el fallback de `generateRepromptMessage` para `time_window`. En la matriz `default`, 15 es el peso de `vibe` y nada más. `time_window` (peso 60) no estaba en el payload que puntuó ese turno. Con ella sola el umbral de 60 ya se cruza y el turno despacha.

La heurística copia el prompt entero a `time_window` si ve el token `domingo`, `sábado`, una duración (`3 horas`) o un tramo (`por la tarde`). Un token `domingo` no puede convivir con un 15 % en ese mismo scoring. La sonda de presencia no explica este 15 %: se lanza en segundo plano después de decidir el repregunta y no reescribe la respuesta ya devuelta.

El prompt de esa fila hay que leerlo. Lo que el operador resume como «un domingo» puede ser el token, una fecha de calendario o un día de la semana en otro idioma. El contrato no depende de cuál sea: un día ya dicho no se contesta con la pregunta de horas.

La interacción que faltó es pedir la fecha concreta de ese domingo para afinar la ruta, no volver a preguntar la parte del día.

---

## 1. Declaración de Intención (INVEST)

**Como** operador que revisa una ruta ya generada en PRO,
**Quiero** que cada parada lleve su tipo real, que «Forjar Ruta Inmediata» entregue la ruta en Telegram o abra el anclaje, y que un día ya dicho se continúe pidiendo la fecha,
**Para** que el lienzo deje de ofrecer reservas falsas y el diálogo no pida un dato que el prompt ya traía.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

Tres forjas. Un corte en verde no exige los otros dos.

### Corte A — Categoría y proveedor (2 SP)

- [x] **CA-1 (La ciudad no es un restaurante):** En `enrichWaypoint`, `bar` no clasifica un texto que solo contiene `Barcelona` o `barrio`. `cafe` no clasifica por ir incrustado en otra palabra. La comparación es por palabra completa, con los términos que ya están en `gastronomyKeywords` y `culturalKeywords`. Un waypoint de prueba con título o descripción que diga «Barcelona» y «barrio», y ningún término gastronómico de palabra completa, queda en `CULTURE` si también nombra un monumento de la lista cultural, y en `ACTIVITY` con `affiliateProvider: 'NONE'` y sin `affiliateUrl` si no nombra ninguno. No lleva `THEFORK` ni `thefork.es`.
- [x] **CA-2 (El restaurante sigue siendo TheFork):** El test del restaurante («Restaurante Cerveseria Catalana», «Tapas clásicas…») sigue en `GASTRONOMY` y `THEFORK`. La plantilla `cityId=415144&tag=bcn_xplorer` puede seguir en ese caso hasta PBI-AFF-002. Este corte no la sustituye ni lee `AFFILIATE_THEFORK_ID`.
- [x] **CA-3 (La cultura deja de ser comida):** La Sagrada Família del test existente, si su texto no tiene un término gastronómico de palabra completa, queda en `CULTURE`. El escudo anti-trampas de esa entrada no cambia.

### Corte B — El botón y Telegram (3 SP)

- [x] **CA-4 (Con anclaje, un mensaje):** Con la ruta ya en pantalla y un `UserAnchor` para la `sessionId` de la cookie, pulsar «Forjar Ruta Inmediata» envía un solo `sendMessage` a ese `telegramChatId`. El texto incluye un enlace que reabre esa sesión (el mismo mecanismo de magic link ya existente, no una ruta pública nueva). No se añade el turno «Por favor, forja la ruta táctica inmediata con el contexto actual.» y no se llama a `POST /api/triage` por esa pulsación. Un test con el gateway sustituido comprueba el destinatario y que el cuerpo no contiene el token del bot.
- [x] **CA-5 (Sin anclaje, el anclaje que ya existe):** Si `findBySessionId` no devuelve fila, la pulsación muestra el deep link de `GET /api/telegram/anchor-link` (el mismo contrato que «Asegurar Ruta en Telegram»). No crea otro onboarding, no manda un mensaje a un chat inventado y no lanza un turno de triaje.
- [x] **CA-6 (El botón no se adelanta al umbral):** Por debajo del umbral el botón sigue deshabilitado, como ahora. Este corte no cambia el peaje de la matriz.

### Corte C — Día ya dicho (3 SP)

- [x] **CA-7 (Leer la fila antes de tocar la heurística):** Se inspeccionó la tabla de telemetría y la fila `cmv80sfzo002bpnv307kjj369` no estaba presente en la base de datos local (purgada). De acuerdo con la norma de contingencia de este criterio, se adoptó y validó la formulación: «Quiero hacer una ruta cultural el domingo» (y combinaciones equivalentes de día sin tramo horario).
- [x] **CA-8 (No repetir la pregunta de horas):** Un prompt que ya nombra el día (el caso del CA-7) no responde `INCOMPLETE_REPROMPT` con `missingVariable: 'time_window'` ni con el fallback «¿cuántas horas o qué parte del día tienes disponible?». La respuesta nombra el día entendido y pide la fecha concreta. No despacha la ruta solo con el nombre del día.
- [x] **CA-9 (La duración sigue valiendo):** Un prompt con duración o tramo que hoy llena `time_window` (`3 horas`, `por la tarde`, `4 horas por la tarde`) sigue alcanzando el peso 60 y no entra por el CA-8. Los tests `TC-TRIAGE-01` y el de «Tengo 3 horas…» permanecen en verde sin relajar el umbral.

- [x] **CA-10 (Oráculos, cada corte):** `tsc --noEmit`, `eslint` y `vitest run` en verde sobre los tests del corte tocado. Cero `any`. Ningún test abre red ni usa la clave de un proveedor o el token del bot.

---

## 3. Acción kaizen (no recaer)

La recaída del corte A es un `includes('bar')` que da por bueno el test del restaurante y no mira un texto con «Barcelona». Un test que solo fija `thefork.es` en un waypoint que ya dice «Restaurante» no ve el falso positivo.

La recaída del corte B es tratar el botón como otro prompt. El texto «forja la ruta táctica inmediata» no es una entrega a Telegram: vuelve a entrar en el triaje y puede salir otra vez por repregunta.

La recaída del corte C es dar el token `domingo` por equivalente a cualquier forma de decir ese día, o contestar con el fallback de horas en cuanto `time_window` falta. El 15 % de esa fila se decidió con el payload de la heurística, antes de la sonda. Tocar la sonda no cambia la respuesta que el operador vio.

---

## 4. Fuera de alcance

- Alta de cuentas (Civitatis, Awin, TheFork) y custodia de `AFFILIATE_*`. Tareas VB-01 a VB-04 de HU-20.
- Catálogo declarativo, enlace firmado y telemetría de clic: PBI-AFF-001, PBI-AFF-002, PBI-AFF-003. Hasta entonces la plantilla con `tag=bcn_xplorer` sigue solo en paradas que el CA-2 deja en `GASTRONOMY`.
- Cambiar los pesos de la matriz `default` o el umbral 60.
- Hacer que la sonda de presencia reescriba el turno ya respondido.
- La patrulla meteorológica y los drops de Cabify.
- Crear una URL pública nueva de itinerario. El enlace del CA-4 reabre la sesión que ya existe.
