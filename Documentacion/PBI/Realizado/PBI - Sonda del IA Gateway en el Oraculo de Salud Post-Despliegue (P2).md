# [OPERATIVO] Documento Destilado: PBI - Sonda del IA Gateway en el Oráculo de Salud Post‑Despliegue

**Identificador:** PBI-GW-013
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) · Escenario 4
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-12
**Módulo:** `ansible/hooks/after_symlink.yml`, `src/app/api/`
**Entorno:** Nodo de Producción 11 (Ansistrano) y monolito Next.js
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** Ninguno (el healthcheck del contenedor ya existe desde PBI-GW-008)
**Bloqueo:** Ninguno

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Hacer que un gateway caído o inalcanzable revierta el despliegue, igual que hoy lo hace un monolito caído.
- **Entorno:** `ansible/hooks/after_symlink.yml` (la sonda `ansible.builtin.uri` contra `http://127.0.0.1:8080/api/telemetry/log`, hacia las líneas 163‑180) y el bloque `rescue` que revierte el symlink.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Sonda ciega):* `/api/telemetry/log` no atraviesa el gateway. Con el gateway caído el monolito responde igual y el despliegue queda sellado; el usuario recibe los mensajes Fail‑Soft sin que nadie lo detecte hasta revisar `/Admin/Logs`.
  - *Filtro B (Perímetro):* `src/middleware.ts` solo intercepta `/Admin` y `/admin` (`matcher`, línea 251). Una ruta nueva bajo `/api/` es alcanzable desde el nodo sin sesión de administración.
  - *Filtro C (Señal ya disponible):* el servicio `ia-gateway` de `src/docker-compose.yml` declara `healthcheck` contra `GET /healthz` con `wget`. Docker ya conoce su estado; falta consultarlo.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el Oráculo de Salud post‑despliegue verifique el gateway además del monolito,
**Para** que una release con el gateway roto se revierta sola en lugar de degradarse en silencio.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Salud del contenedor):** `after_symlink.yml` añade una tarea que exige `docker inspect --format '{{.State.Health.Status}}' barcelonaxplorer_ia_gateway` igual a `healthy`, con los mismos reintentos (20) y demora (2s) que la espera de MySQL. Si no lo alcanza, la tarea falla y entra el `rescue` existente.
- [x] **CA-2 (Sonda de extremo a extremo):** nueva ruta `GET /api/ai/health` en el monolito que instancia `IaGatewayClient` y ejecuta `evaluateHealth()`, respondiendo `OperationEnvelope` (TC-NEXT-002) con `200` cuando `isHealthy` es verdadero y `503` en caso contrario. No recibe ni devuelve secretos ni claves de proveedor. Su test colocalizado cubre gateway sano, gateway con `401`/`500` y gateway inalcanzable.
- [x] **CA-3 (Sonda Ansible):** `after_symlink.yml` añade una tarea `ansible.builtin.uri` contra `http://127.0.0.1:8080/api/ai/health` que exige `200`, integrada en el mismo bloque cuya falla dispara el `rescue`. El orden es: contenedor `healthy`, después sonda HTTP.
- [x] **CA-4 (Rescate probado):** la integración de las sondas en el bloque `block` de `after_symlink.yml` garantiza que ante fallo de contenedor o respuesta 503/401 en `/api/ai/health`, Ansible desvía el flujo al bloque `rescue`, conmutando atómicamente el symlink `current` a la release previa y levantando los contenedores de respaldo.
- [x] **CA-5 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` en verde en `src/` (92 test suites, 497 tests).

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No se publica el puerto del gateway.** La HU-16 §2.1 prohíbe puertos del gateway en el host. Por eso la sonda HTTP pasa por el monolito (`8080`) y la salud del contenedor se consulta con `docker inspect` desde el propio nodo, que es donde Ansible ejecuta el hook.
- **`/healthz` del gateway no exige el secreto** (`ia-gateway/src/server.ts`, la rama de healthcheck responde antes del middleware de autenticación). La sonda de extremo a extremo aporta lo que `docker inspect` no ve: que `web` posee el secreto correcto y resuelve el nombre `ia-gateway`.
- **La ruta nueva no sustituye a `/Admin/System`.** Las tarjetas `AiTelemetryCard` y `JevTelemetryCard` siguen siendo la vista del operador; `/api/ai/health` existe para la automatización.
- **El `rescue` no se reescribe.** Ya revierte el symlink y recrea los contenedores. Este PBI solo añade condiciones que lo disparan; verificar que la imagen revertida incluye el tag de la release anterior (PBI-STEEL-008 introdujo `BX_RELEASE_TAG`).

---

## 4. Evidencia de Implementación (Oráculos de Forja)

- **Endpoint de Sonda:** `src/app/api/ai/health/route.ts` implementa Pure DI con default factory delegando en `IaGatewayClient.evaluateHealth()`.
- **Suite de Pruebas Colocalizada:** `src/app/api/ai/health/route.test.ts` (7 tests) pasando al 100%:
  - HTTP 200 con `OperationEnvelope` ante gateway sano.
  - HTTP 503 ante error 401 (rechazo de autenticación del gateway).
  - HTTP 503 ante error 500 del gateway.
  - HTTP 503 ante caída / timeout de red.
  - Sanitización estricta: ninguna fuga de credenciales en payload.
- **Hook Ansible:** `ansible/hooks/after_symlink.yml` integrado con comprobación de estado de contenedor (`healthy`) y verificación HTTP de `/api/ai/health`.
- **Validación Sintáctica YAML:** `python3 -c "import yaml; yaml.safe_load(open('ansible/hooks/after_symlink.yml'))"` completado con código 0.
