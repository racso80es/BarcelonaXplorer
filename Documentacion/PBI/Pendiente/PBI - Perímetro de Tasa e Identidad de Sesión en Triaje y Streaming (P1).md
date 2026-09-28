# [OPERATIVO] Documento Destilado: PBI - Perímetro de Tasa e Identidad de Sesión en Triaje y Streaming

**Identificador:** PBI-STEEL-004
**Estatus:** Pendiente (Backlog Inmediato — Clúster de Nivel 1, orden 4)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-04, F-18, T-04 (parcial)
**Módulo:** Seguridad perimetral — Rate Limiting y sesión sombra
**Entorno:** `src/app/api/triage/route.ts`, `src/app/api/triage/ignition/route.ts`, `src/features/auth/token-bucket-rate-limiter.ts`
**Prioridad:** Alta (P1 — amplificación de coste de inferencia)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-STEEL-005 retira `/api/orchestrator/stream`. Por eso CA-3 no aplica. El resto de este PBI sigue vigente.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El limitador se elude cambiando la cookie o la cabecera de IP. No hay logs que demuestren que `cf-connecting-ip` llega intacta, y el puerto `8080` puede recibirla escrita por el cliente. La defensa de este PBI es un solo cubo para las rutas públicas que llaman a un LLM.
- **Entorno:** Route Handlers de triaje e ignición, y `TokenBucketRateLimiter`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* La clave del cubo no contiene nada que mande el cliente.
  - *Filtro B:* Las dos rutas públicas de inferencia comparten un cubo. Agotado, todas reciben 429.
  - *Filtro C:* La sesión solo nace de una cookie emitida por el servidor. Esa cookie no es la clave del cubo.

---

## 1. Declaración de Intención (INVEST)

**Como** responsable del coste de inferencia y de la cuota Gemini,
**Quiero** que ningún cliente pueda saltarse el límite de tasa ni suplantar una sesión,
**Para** que la cuota compartida (ya saturada con 503 *high demand*) no se agote por abuso.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Un solo cubo):** la clave de `TokenBucketRateLimiter` en `/api/triage` y `/api/triage/ignition` es una constante. No lee `cf-connecting-ip`, `x-forwarded-for`, la IP del socket ni `bx_session_id`. Si la cuota se agota, todas las peticiones reciben `429` con `Retry-After`.
- [ ] **CA-2 (Alcance):** el cubo cubre solo esas dos rutas, que son las que disparan inferencia desde el cliente. No envuelve llamadas internas (traducción de plantillas, sondas). No hay un cubo por endpoint.
- [x] **CA-3 (Streaming limitado):** no aplica. PBI-STEEL-005 elimina `/api/orchestrator/stream`. No queda ruta que limitar.
- [ ] **CA-4 (Identidad solo por cookie):** `/api/triage` y `/api/triage/ignition` dejan de aceptar `x-session-id` y `body.sessionId`. Sin cookie, el servidor genera un UUID y lo emite como cookie `httpOnly`, `secure` en producción y `sameSite=lax`.
- [ ] **CA-5 (Errores sin fuga):** las respuestas 500 dejan de devolver `details` con el mensaje interno; el detalle va a la telemetría.
- [ ] **CA-6 (Tests de route handler):** test propio de `/api/triage` que demuestre que N peticiones agotan el cubo aunque cambien la cookie, `x-forwarded-for` y `cf-connecting-ip`, que `x-session-id` se ignora para la identidad y que el 429 incluye `Retry-After`. No hay test de la ruta de streaming: PBI-STEEL-005 la elimina.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **`cf-connecting-ip` no se usa.** No hay Nginx en el contenedor y los logs del 2026-09-28 no demuestran que la cabecera llegue sin poder falsificarse. Un PBI futuro de topología de red podrá sustituir el cubo único por una IP de confianza. No se redacta ahora.
- **La identidad de sesión no es la clave del cubo.** CA-4 sigue exigiendo la cookie `httpOnly` para saber quién es el usuario. El cubo no la mira. Firmar la cookie con HMAC sigue fuera de este PBI.
- **Memoria del limitador:** es un `Map` en memoria por proceso con limpieza cada 10 minutos. Vale mientras haya un único contenedor web. Si se escala, el cubo deja de ser global y hará falta almacenamiento compartido. Eso queda fuera.

---

## 4. Evidencia de Certificación

Pendiente de forja.
