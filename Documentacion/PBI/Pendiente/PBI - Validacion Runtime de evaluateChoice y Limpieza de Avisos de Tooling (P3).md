# [OPERATIVO] Documento Destilado: PBI - Validación Runtime de `evaluateChoice` y Limpieza de Avisos de Tooling

**Identificador:** PBI-GW-017
**Estatus:** Pendiente
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md)
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-18, F-15, F-19
**Módulo:** `src/features/ai-engine/ia-gateway/`, `src/next.config.ts`, `src/vitest.config.ts`
**Entorno:** Monolito Next.js
**Prioridad:** Baja (P3)
**Estimación Táctica:** 1 Story Point
**Depende de:** Ninguno
**Bloqueo:** Ninguno

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Tres piezas de higiene agrupadas por ser pequeñas y del mismo paquete: un cast que el compilador no puede verificar, dos ficheros generados que compiten con la gobernanza del repositorio y un aviso de Vite en cada ejecución de tests.
- **Entorno:** `src/features/ai-engine/ia-gateway/ia-gateway.client.ts:235-237`, `src/next.config.ts`, `src/vitest.config.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Cast inevitable para el compilador):* el esquema Zod de la respuesta de `choice` no conoce el genérico `T` de `evaluateChoice`, así que `selectedChoice as T` y `probabilities as Record<T, number>` no son verificables en compilación. La verificación posible es de runtime: la elección devuelta pertenece al conjunto `choices` enviado.
  - *Filtro B (Ficheros generados):* cada `next dev` imprime `Generated AGENTS.md and CLAUDE.md for AI agents` y crea `src/AGENTS.md` y `src/CLAUDE.md`, que aparecen sin trackear y conviven con los canónicos de la raíz del repositorio.
  - *Filtro C (Aviso ruidoso):* Vitest advierte en cada `vitest run` que `src/vitest.config.ts` usa sintaxis ESM cargada como CommonJS (`configLoader: 'native'`). El `package.json` de `src/` no declara `"type": "module"`.

---

## 1. Declaración de Intención (INVEST)

**Como** desarrollador del monolito,
**Quiero** que `evaluateChoice` rechace respuestas incoherentes con lo pedido y que los avisos de tooling dejen de aparecer,
**Para** que un fallo del proveedor no se disfrace de resultado tipado y la salida de los oráculos solo contenga información relevante.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Pertenencia verificada):** `evaluateChoice` comprueba, después del parseo Zod y antes de devolver, que `selectedChoice` es uno de los `choices` enviados y que toda clave de `probabilities` pertenece a ese conjunto. Si no, lanza un error que nombra el valor recibido y las opciones válidas, y registra telemetría de nivel `ERROR` por la vía `recordTelemetry` ya existente. Los casts `as T` y `as Record<T, number>` se sustituyen por una función que devuelve el tipo narrowed a partir de esa comprobación.
- [ ] **CA-2 (Tests):** el test colocalizado cubre una respuesta con `selectedChoice` fuera del conjunto (error) y una respuesta coherente (el tipo devuelto conserva el literal del conjunto). Los tests actuales del cliente siguen pasando.
- [ ] **CA-3 (Ficheros generados):** `src/next.config.ts` declara `agentRules: false`. `src/AGENTS.md` y `src/CLAUDE.md` se eliminan y no reaparecen al ejecutar `next dev`. Los `AGENTS.md` y `CLAUDE.md` de la raíz del repositorio no se modifican.
- [ ] **CA-4 (Aviso de Vite):** `vitest run` en `src/` no emite el aviso de `configLoader: 'native'`. Vía propuesta: renombrar `src/vitest.config.ts` a `src/vitest.config.mts`, verificando que los alias y el `setupFiles` siguen resolviendo.
- [ ] **CA-5 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` en verde en `src/`, y `next dev` arranca sin la línea `Generated AGENTS.md`.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No se puede expresar `T` en el esquema Zod.** `T extends string` depende del argumento de la llamada; forzarlo con `z.enum` exigiría construir el esquema dentro del método a partir de `choices`, lo cual es válido y es precisamente la vía para eliminar el cast. Si se opta por ella, el esquema de respuesta del módulo (`ia-gateway-decision.schema.ts`) permanece como contrato laxo y la verificación estricta ocurre en el método.
- **`agentRules` es configuración de Next 16**, no un fundamento del Códice. TC-NEXT-004 no dice nada de estos ficheros; desactivarlos no contradice ninguna norma. La prohibición de `src/proxy.ts` del Códice no se toca aquí (ver PBI-GW-018).
- **El renombrado a `.mts` no cambia el comportamiento de los tests.** Si al renombrar Vitest dejara de cargar la configuración (síntoma: los tests de `playwright-e2e` entrarían en la suite), se revierte y se documenta el bloqueo en lugar de silenciar el aviso con `VITE_CONFIG_NATIVE_IGNORE_WARNING`.
