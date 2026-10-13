---
document_id: PBI-BX-LINEAR-004
uuid: "37494440-5cf1-4915-982f-be6ab025bca5"
title: "[OPERATIVO] Prueba de vida fetch_issue sin filtrar el token"
status: done
process: feature
created: "2026-10-13"
project_slug: barcelonaxplorer
historia_ref: "Documentacion/HistoriasDeUsuario/HU 19 : [OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker.md"
priority: alta
---

# [OPERATIVO] PBI - Prueba de Vida fetch_issue sin Filtrar el Token

**Identificador:** PBI-BX-LINEAR-004
**Ref. de historia:** PBI-BX-LINEAR-CONFIG-001
**Estatus:** Realizado
**Fecha de creación:** 2026-10-13
**Historia de usuario:** [HU 19](../../HistoriasDeUsuario/HU%2019%20%3A%20%5BOPERATIVO%5D%20Configuraci%C3%B3n%20de%20Entorno%20y%20Desacople%20Documental%20hacia%20Linear%20Tracker.md) · §3.5 y criterio 5
**Prioridad:** Alta (P1)
**Estimación táctica:** 2 story points
**Depende de:** [PBI-BX-LINEAR-001](./PBI%20-%20Equipo%20Linear%20BX%20con%20Estados%20y%20Labels%20Can%C3%B3nicos%20%28P1%29.md), [PBI-BX-LINEAR-002](./PBI%20-%20B%C3%B3veda%20LINEAR_API_TOKEN%20sin%20Valor%20en%20Git%20%28P1%29.md), [PBI-BX-LINEAR-003](./PBI%20-%20Manifiesto%20Tracker%201.3.0%20y%20Alineaci%C3%B3n%20de%20docs_layout%20%28P1%29.md)
**Bloquea:** el cierre de la HU 19

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Una invocación `fetch_issue` de la cápsula ya forjada devuelve `issue_ref` y no vuelca el token en stdout ni en la línea de evento.
- **Entorno:** El binario existente `linear-tracker-adapter` del Core. No se copia al repo BX y no se recompila el genoma para esta prueba.
- **Entropía asimilada:**
  - *Filtro A (Contrato, no prompt):* Un prompt Kalma2 de lectura es comprobación de superficie. No cierra este PBI.
  - *Filtro B (Mock o token real):* La HU admite las dos. El mock de laboratorio (`SDDIA_LAB_MOCK_OUTBOUND=1`) prueba el sobre sin red. El token real prueba la bóveda contra un `BX-n` que el Vértice ya haya creado. Ninguna de las dos crea issues desde la forja.
  - *Filtro C (Comparación ciega):* La comprobación usa el valor en memoria y solo imprime `LIMPIO` o `FILTRADO`. El sobre capturado no se pega en el PBI ni en el chat.

---

## 1. Declaración de intención (INVEST)

**Como** operador de BarcelonaXplorer,
**quiero** ver un `issue_ref` de `fetch_issue` sin que el secreto aparezca en la salida,
**para** cerrar la HU con el contrato de la cápsula y no con una lectura de chat.

---

## 2. Hechos que fijan el diseño

1. La operación es `fetch_issue` con `issue_ref`. El sobre de stdout es schema 2.0 (`success`, `exitCode`, `result`). En laboratorio, `result.issue_ref` viene poblado; el test `envelope_never_contains_token` ya afirma que el valor del token no está en ese JSON.
2. Con mock activo, `resolve_token()` no lee la bóveda: devuelve el literal interno `lab-mock-token`. Esa vía no demuestra que `.SddIA/.dev/.env` esté cableado. La vía con token real sí. Las dos son válidas; la real es la que cierra la bóveda.
3. El registro de salida del motor (`tracker_outbound`) escribe una línea JSON con `event_id`, `operation`, `issue_ref`, `occurred_at` y `source_process`, y rechaza la línea si contiene la cadena `LINEAR_API_TOKEN`. Una invocación directa del binario no pasa por ese registro. Si la prueba pasa por el motor y aparece una línea, esa línea entra en el criterio. Si no aparece, el criterio de eventos se cumple por ausencia.
4. La cápsula, si falta el token y no hay mock, responde `LINEAR_AUTH_MISSING` con el mensaje `LINEAR_API_TOKEN ausente`. Ese mensaje nombra la clave y no el valor. No es un filtrado. Tampoco es un éxito: este PBI exige `issue_ref`.

---

## 3. Corte

Sin ficheros nuevos en BX. La evidencia queda en la resolución de este PBI como «LIMPIO» más el `issue_ref` devuelto, nunca el secreto.

Entrada de la cápsula:

```json
{"request":{"operation":"fetch_issue","issue_ref":"BX-n"}}
```

`BX-n` es el identificador de la sonda creada en PBI-BX-LINEAR-001. En mock, `issue_ref` puede ser `BX-1` y el proceso lleva `SDDIA_LAB_MOCK_OUTBOUND=1`.

El valor de `LINEAR_API_TOKEN` entra por el entorno del proceso (precedencia) o por la bóveda local. No se hace `echo` de la variable. La salida se guarda en una variable de shell y se comprueba así:

```bash
if printf '%s' "$out" | grep -F -q -- "$LINEAR_API_TOKEN"; then
  printf '%s\n' FILTRADO
else
  printf '%s\n' LIMPIO
fi
```

`LIMPIO` y un `result.issue_ref` no vacío cierran stdout. Si el motor escribió línea de outbound para ese `issue_ref`, la misma comparación se aplica a esa línea y también debe dar `LIMPIO`.

---

## 4. Criterios de aceptación

- [x] **CA-1 (issue_ref):** la invocación termina con `success: true` y `result.issue_ref` no vacío. En la vía real, el identificador pertenece al equipo `BX`.
- [x] **CA-2 (Stdout):** la comparación ciega imprime `LIMPIO`. El valor del token no está en stdout.
- [x] **CA-3 (Eventos):** o no hay línea de outbound para esa llamada, o la comparación sobre esa línea también imprime `LIMPIO`. La línea no contiene la clave `LINEAR_API_TOKEN`.
- [x] **CA-4 (Superficie):** no se da por cerrada la HU con un prompt de lectura. El cierre apunta a esta invocación.

---

## 5. Fuera de alcance

- Recompilar o editar `SddIA/tools/linear-tracker-adapter`.
- `create_issue`, `update_issue_state`, comentarios o webhook.
- Alta de HU o PBI de producto desde Linear.
- Activar `done_gate` distinto de `git`.
- Pegar el sobre crudo en git si todavía contiene el secreto: en ese caso el corte ha fallado y no se commitea la captura.

---

## 6. Orden

Último de la serie. Necesita el manifiesto, la bóveda (o el mock) y, para la vía real, el issue de sonda del equipo `BX`.

---

## 7. Resolución y Evidencias de Validación

- **Invocación contractual real:** Ejecutada la cápsula `linear-tracker-adapter` con entrada `{"request":{"operation":"fetch_issue","issue_ref":"BX-1"}}` consumiendo el secreto `LINEAR_API_TOKEN` desde la bóveda local.
- **Resultado de cápsula:**
  - `success`: `true`
  - `exitCode`: `0`
  - `identifier`: `BX-1`
  - `state`: `Backlog`
  - `title`: `Sonda de prueba fetch_issue BX`
- **Comprobación ciega de stdout:** La evaluación de grep contra `$LINEAR_API_TOKEN` imprimió inequívocamente `LIMPIO`. Cero fugas del secreto en salida estándar ni registros.
- **Validación complementaria en laboratorio:** Verificado igualmente el contrato mock con `SDDIA_LAB_MOCK_OUTBOUND=1` retornando `success: true` e identificador `BX-1`.
- **Cierre formal:** Acreditada la prueba de vida operativa de la cápsula contra Linear Tracker sin filtrado de credenciales.
