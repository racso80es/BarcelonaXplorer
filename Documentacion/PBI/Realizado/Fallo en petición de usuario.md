# [OPERATIVO] Documento Destilado: PBI - Hora de ruta rechazada y frase de aduana en el orquestador

**Identificador:** PBI-ORCH-PRO-002
**Estatus:** Completado
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** ninguna. El ciclo es de PRO y el contrato ya está en el código.
**Módulo:** `src/features/ai-engine/ia-gateway/ia-gateway.client.ts` · `src/features/planner/generate-tactical-route.use-case.ts` · `ia-gateway/src/endpoints/llm/schemas-registry.ts`
**Entorno:** Producción. Ciclo señalado por el operador: telemetría `cmv7z8k5c0015pnv3xpm5k0rw`. La UI mostró «Respuesta de triaje inválida. La aduana rechazó el contrato de datos.»
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points, en dos forjas (3 + 2). Cada corte se entrega solo.
**Depende de:** el diccionario ya tiene `defaultClaudicationMessage` y el cliente ya pinta `DISPATCH_CLAUDICATION`.
**Bloqueo:** el cuerpo de `cmv7z8k5c0015pnv3xpm5k0rw` no está en el repo. El corte A empieza leyendo esa fila. Si la fila ya no está, el fixture es el del §0.3.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Una ruta que el gateway dio por buena muere al cruzar el Zod de la app, y el orquestador enseña la frase de aduana. El operador atribuye el rechazo a una hora que no cumple `HH:MM`. El código hace esa vía posible. La fila confirma el campo.
- **Entorno:** `POST /api/triage` tras un despacho (`score` ya en umbral) y el `safeParse` de `TriageOutcomeSchema` en `src/app/orchestrator/page.tsx`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Soberanía):* La frase visible sale del diccionario de `_sys_lang` o de una frase del puerto conversacional ya inyectado. Este corte no añade un endpoint de LLM.
  - *Filtro B (Grano):* Pedir otra vez la ventana horaria es PBI-ORCH-PRO-001. Este PBI no abre esa pregunta.
  - *Filtro C (Señal):* Un JSON de ruta con hora ilegible no llega al lienzo, y la respuesta HTTP de ese turno sigue siendo un `TriageOutcome`.

---

## 0. Hecho observado

### 0.1 La frase es el cajón de cualquier cuerpo que no es un triaje

`ui.orchestrator.invalidTriageResponse` vale, en castellano, «Respuesta de triaje inválida. La aduana rechazó el contrato de datos.» El orquestador la pinta en un solo sitio: cuando `TriageOutcomeSchema.safeParse` falla sobre el JSON de `POST /api/triage` (`page.tsx`). No mira el estado HTTP.

Dos cuerpos del propio `route.ts` fallan ese parse y caen en la misma frase:

- Un `ZodError` responde 400 con `createErrorEnvelope` (`success`, `exitCode`, `errors`, `feedback: 'Validación de triaje fallida'`).
- Cualquier otra excepción responde 500 con `{ error: 'Fallo interno en la Aduana Universal de Triaje.' }`.

`DISPATCH_CLAUDICATION` es otro camino. Si el cuerpo trae `status: 'DISPATCH_CLAUDICATION'`, el cliente enseña `claudicationMessage` o, en su defecto, `defaultClaudicationMessage` («El motor de rutas no está disponible temporalmente.»). La frase de aduana no sale de ese estado.

### 0.2 La hora estricta se exige después de que el gateway ya dijo que sí

En `ia-gateway/src/endpoints/llm/schemas-registry.ts`, el esquema `tactical-route` tipa `timeSpan.start` y `timeSpan.end` como `z.string()`. `10:00 AM`, `14h30` o `14:30:00` pasan. Si el JSON cumple ese esquema, el handler responde sobre de éxito y no rota de modelo: el `continue` del handler solo corre cuando `safeParse` falla.

En la app, `IaGatewayClient.generateTacticalRoute` hace `TacticalRouteZodSchema.parse` y luego `new TimeSpan`. El Zod de `tactical-route.schema.ts` exige `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/` en `start` y en `end`. El value object repite esa expresión y, además, rechaza un `start` posterior a `end` con `InvalidTimeSpanException`.

La instrucción de sistema, en `ia-gateway.client.ts` y en `gemini-client.ts`, pide `timeSpan: { start, end }` y no nombra la forma `HH:MM` de 24 h.

`GenerateTacticalRouteUseCase` traga la excepción solo si el mensaje contiene «No se pudo forjar la ruta.». Un `ZodError` de hora no lleva ese texto: se registra como `[LLM ERROR] Excepción de infraestructura` y se relanza. `triage-input.use-case.ts` no envuelve `routeUseCase.execute`. El `catch` de `/api/triage` ve el `ZodError` y contesta el sobre 400. El cliente no lo puede leer y pinta la frase de aduana.

`InvalidTimeSpanException` (hora bien formada, `start` > `end`) no es un `ZodError`. Cae en el 500 y en la misma frase.

Hay un segundo desajuste del mismo cruce: en el gateway `description` es opcional; en `TacticalWaypointZodSchema` es `z.string()` obligatorio. Una parada sin descripción sigue el mismo camino hasta la frase de aduana. La fila dice cuál de los dos campos fue.

### 0.3 Lo que la fila tiene que fijar

El id `cmv7z8k5c0015pnv3xpm5k0rw` es un `TelemetryLog`. El repo no guarda su `message` ni su `payload`. El operador resume el fallo como hora fuera de `HH:MM`. Eso encaja con el §0.2 si el payload trae un issue Zod en `waypoints.*.timeSpan.start` o `timeSpan.end`, o una `InvalidTimeSpanException`.

Si la fila ya no está, el fixture del corte A es una ruta que el esquema `tactical-route` del gateway acepta y `TacticalRouteZodSchema` rechaza, con `timeSpan.start` igual a `10:00 AM` en la primera parada. El PBI deja escrito que se usó ese fixture.

> **Resolución CA-1 (Ejecución):** Se consultó la tabla `TelemetryLog` en persistencia buscando la fila con id `cmv7z8k5c0015pnv3xpm5k0rw` y el resultado fue `null` (fila no presente en el entorno). En estricto cumplimiento del §0.3 y CA-1, se utiliza el fixture canónico de fallback con `timeSpan.start` igual a `10:00 AM` en la primera parada.


### 0.4 La repregunta de horas no recupera este turno

El despacho solo llega a `generateTacticalRoute` con el umbral ya cumplido. En la matriz `default`, `time_window` pesa 60. El turno que murió en la aduana ya traía ventana, o llegó por el botón de forja inmediata. Volver a pedir «a qué hora exacta prefieres iniciar y cuál es tu límite» repite el dato y es la recaída que cierra PBI-ORCH-PRO-001.

La recuperación de este ciclo es cerrar la ruta en el mismo request. Un reintento, con la forma `HH:MM` escrita en la corrección. Si el segundo JSON sigue sin pasar el Zod de la app, el turno responde `DISPATCH_CLAUDICATION` y el usuario puede reenviar. La frase no nombra Zod, aduana ni contrato.

---

## 1. Declaración de Intención (INVEST)

**Como** operador que pide una guía en PRO y el modelo devuelve una hora que el contrato no admite,
**Quiero** que el sistema reintente una vez con la forma `HH:MM` y, si sigue fallando, me conteste con una frase de claudicación en el idioma de la sesión,
**Para** que el lienzo no se quede en «La aduana rechazó el contrato de datos.» y la ruta salga cuando el segundo JSON ya es válido.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

Dos forjas. Un corte en verde no exige el otro.

### Corte A — El turno sigue siendo un triaje (3 SP)

- [x] **CA-1 (Leer la fila antes de fijar el fixture):** Se lee `cmv7z8k5c0015pnv3xpm5k0rw`. El test usa el `timeSpan` (o el campo Zod que la fila nombre) tal como vino. Si la fila ya no está, el caso es el del §0.3 (`10:00 AM`) y el PBI deja escrito que se usó ese fixture.
- [x] **CA-2 (Un reintento dentro del mismo request):** Ante un `ZodError` de `TacticalRouteZodSchema` cuyo path cae en `timeSpan.start` o `timeSpan.end`, `generateTacticalRoute` llama al motor de razonamiento una segunda vez. La corrección que se añade al prompt nombra los dos campos y la forma `HH:MM` de 24 h, con el ejemplo `14:30`. Si el segundo JSON pasa `TacticalRouteZodSchema` y `TimeSpan`, el caso de uso devuelve la `TacticalRoute` y el triaje sigue en `DISPATCH_READY`. No hay tercera llamada.
- [x] **CA-3 (La frase de aduana no sale de este fallo):** Si el segundo JSON sigue fallando el mismo Zod, o si salta `InvalidTimeSpanException`, el caso de uso no relanza. El `POST /api/triage` responde 200 con `status: 'DISPATCH_CLAUDICATION'`. El cuerpo pasa `TriageOutcomeSchema`. El cliente pinta `claudicationMessage` o `defaultClaudicationMessage` del `_sys_lang`. El texto visible no contiene «aduana», «Zod» ni «contrato de datos». El turno no responde 400 con `createErrorEnvelope` ni 500 con «Fallo interno en la Aduana Universal de Triaje.» por este fallo. La telemetría de error conserva el path Zod o el mensaje de `InvalidTimeSpanException`.
- [x] **CA-4 (El puerto conversacional, si está, solo redacta la claudicación):** Con el puerto ya inyectado en el triaje, la frase de CA-3 puede salir de una llamada a ese puerto, en el idioma de la sesión, diciendo que el horario de la ruta no se pudo cerrar y que se puede reenviar la petición. Si el puerto falta o lanza, queda `defaultClaudicationMessage`. El test sustituye el puerto y no abre red. La frase no pide de nuevo la ventana horaria ni nombra `time_window`.
- [x] **CA-5 (El resto de fallos no cambia de carril):** Una excepción de cuota o de red que hoy se relanza sigue fuera de este corte. El string «No se pudo forjar la ruta.» sigue entrando por la claudicación que ya existe. Un `ZodError` de `TriageInputSchema` (prompt vacío, `sessionId` vacío) sigue en el 400 de `route.ts`.

### Corte B — El gateway aplica la misma hora (2 SP)

- [x] **CA-6 (El esquema `tactical-route`):** `timeSpan.start` y `timeSpan.end` del registry usan la misma expresión que `TimeSpanZodSchema`. Un JSON con `start: '10:00 AM'` no sale del handler como sobre de éxito: el `continue` que ya existe rota de modelo o agota el intento. `09:30` y `14:30` siguen pasando. `description` no se toca en este corte.
- [x] **CA-7 (La instrucción nombra la forma):** La instrucción de sistema de `IaGatewayClient.generateTacticalRoute` dice que `start` y `end` van en `HH:MM` de 24 h (ejemplo `14:30`). El mismo texto entra en la instrucción de `gemini-client.ts`, que hoy es una copia.
- [x] **CA-8 (Oráculos, cada corte):** `tsc --noEmit`, `eslint` y `vitest run` en verde sobre los tests del corte tocado. Cero `any`. Ningún test abre red ni usa la clave de un proveedor.

---

## 3. Acción kaizen (no recaer)

La recaída del corte A es ensanchar `TimeSpanZodSchema` a `z.string()` para que el `safeParse` del cliente pase. La hora ilegible llegaría al lienzo y el fallo quedaría escondido.

La otra recaída es devolver la frase de aduana, o un 500, cuando el modelo ya contestó y el único fallo es el contrato de la ruta. Ese fallo tiene estado propio: `DISPATCH_CLAUDICATION`.

La recaída del reintento es un bucle. La segunda llamada es el techo. Un tercer `generate` en el mismo request vuelve a abrir el ciclo.

La recaída del corte B es dejar `z.string()` en el gateway y fiar el formato al prompt. El handler solo rota de modelo cuando el esquema falla; con `z.string()` la hora mala sale como éxito.

---

## 4. Fuera de alcance

- Unificar el regex de `update-itinerary-node.use-case.ts` (`/^([01]\d|2[0-3]):[0-5]\d$/`, siempre dos dígitos) con el de `TimeSpan`, que admite `9:30`. `9:30` hoy pasa la app.
- Hacer obligatoria `description` en el esquema del gateway. Si la fila `cmv7z8k5c0015pnv3xpm5k0rw` nombra ese campo, el CA-1 usa ese fixture en el corte A y el corte B se reescribe en una línea antes de tocar código. Hasta esa lectura, el corte B es la hora.
- Cambiar los pesos de la matriz `default`, el umbral 60, o el fallback de `time_window`.
- Reescribir `invalidTriageResponse` para el resto de cuerpos ilegibles (sobre 400 de entrada, 500 de infraestructura, JSON roto). Esa frase sigue siendo el cajón de un cuerpo que no es un `TriageOutcome`.
- Alta de proveedores, afiliados y el botón «Forjar Ruta Inmediata». Eso es PBI-ORCH-PRO-001.
