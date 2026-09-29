# [OPERATIVO] Documento Destilado: PBI - Arranque Fail‑Closed del IA Gateway: Secreto Obligatorio y Anclaje Verificado

**Identificador:** PBI-GW-012
**Estatus:** Completado
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) · Escenario 2
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-10, F-09
**Módulo:** `ia-gateway/src/index.ts`, `ia-gateway/src/endpoints/llm/fallback.config.ts`, `ia-gateway/src/config/startup.ts`
**Entorno:** Arranque del microservicio IA Gateway
**Prioridad:** Alta (P1)
**Estimación Táctica:** 2 Story Points
**Depende de:** Ninguno
**Decisión de diseño (D-1, confirmada 2026-09-29):** [RESUELTO] Fail‑fast en el arranque del gateway ante anclaje mal configurado (mismo proveedor que el principal de la matriz). El proceso termina con código distinto de cero; no se expone estado `DEGRADED` en `/healthz` como alternativa. Ver HU-KAIZEN-003 §7.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Eliminar los dos puntos donde el gateway arranca en un estado que contradice sus propias reglas: un secreto con literal por defecto y una restricción de anclaje que solo avisa.
- **Entorno:** `ia-gateway/src/index.ts:12` (`IA_GATEWAY_SECRET ?? 'development-secret-key-change-in-prod'`) y `ia-gateway/src/endpoints/llm/fallback.config.ts:41-54` (`console.warn`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Patrón conocido):* el literal por defecto es el mismo patrón Fail‑Open que el F-01 de AUD-OPS-STEEL-001 (patrulla Telegram con `bcn_patrol_secret_default`). Cualquiera que lea el repositorio conoce el secreto efectivo de un contenedor arrancado sin la variable.
  - *Filtro B (Mitigación actual, insuficiente):* `deploy.sh` exige `IA_GATEWAY_SECRET` de al menos 32 caracteres y Compose lo inyecta. Un arranque fuera de ese pipeline (pruebas manuales, `docker run` directo) no hereda esa protección.
  - *Filtro C (Restricción ya escrita):* la HU-16 §2.4 declara que el anclaje debe pertenecer a un proveedor distinto del principal de su matriz. El código la conoce y se limita a advertir.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el gateway se niegue a arrancar con un secreto ausente o con un anclaje que anula su propia redundancia,
**Para** que una configuración insegura o incoherente falle en el despliegue y no en silencio en producción.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Secreto obligatorio):** si `IA_GATEWAY_SECRET` no está definida o tiene menos de 32 caracteres, el proceso termina con código distinto de cero y un mensaje que nombra la variable y el requisito. No existe ningún literal de secreto en `ia-gateway/src/`. El umbral de 32 coincide con el que ya aplica `src/deploy.sh`.
- [x] **CA-2 (Autenticación intacta):** `validateGatewayAuth` (`ia-gateway/src/shared/auth.ts`) no cambia: sigue rechazando secreto vacío y comparando con `timingSafeEqual` sobre hashes de longitud fija.
- [x] **CA-3 (Anclaje verificado):** `resolveFallbackConfig` lanza un error (y el arranque termina) cuando `DEFAULT_FAST_LLM` usa proveedor `GROQ` o `DEFAULT_REASONING_LLM` usa proveedor `GOOGLE`, con un mensaje que cita la matriz afectada y la restricción. El `console.warn` actual desaparece.
- [x] **CA-4 (Tests):** test de arranque sin `IA_GATEWAY_SECRET`, con secreto de 31 caracteres y con secreto válido; test de `resolveFallbackConfig` con anclaje del mismo proveedor (error) y con anclaje correcto (configuración devuelta). Los tests existentes de fallback se actualizan para no depender del warning.
- [x] **CA-5 (Oráculos):** `tsc --noEmit` y `vitest run` en verde en `ia-gateway/`. Cero `any`.
- [x] **CA-6 (Entorno real):** `.env.local` y `.env.production` actuales cumplen ambas reglas (secreto de 64 hex y anclajes `google:` para `FAST_LLM` y `groq:` para `REASONING_LLM`), de modo que el arranque local y el despliegue no se rompen al aplicar el PBI. Se verifica ejecutando el arranque, no solo leyendo los ficheros.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Los tests del gateway arrancan el servidor con secreto inyectado** (`server.test.ts`, `auth.test.ts`). La validación nueva vive en `src/index.ts`, no en `createGatewayServer`, para no romper esa suite: se extrae una función pura `assertStartupConfig(env)` testeable sin levantar sockets.
- **No se añaden dependencias.** La validación del secreto es una comprobación de presencia y longitud; la del anclaje reutiliza `parseAnchorString`, que ya existe.
- **Precedente de la casa:** la corrección del F-01 de AUD-OPS-STEEL-001 eliminó el literal y pasó a Fail‑Closed. Este PBI aplica el mismo criterio, no inventa uno nuevo.

---

## 4. Evidencia de Implementación y Oráculos

- **Módulo `ia-gateway/src/config/startup.ts`:**
  - Función pura `assertStartupConfig(env)` que valida presencia y longitud mínima (>= 32 caracteres) de `IA_GATEWAY_SECRET`.
  - Invocación de `resolveFallbackConfig(env)` asegurando Fail-Fast temprano ante redundancia nula en anclajes.
- **Microservicio `ia-gateway/src/index.ts`:**
  - Erradicación total de literales por defecto para `IA_GATEWAY_SECRET`. Salida con código 1 ante configuración inválida.
- **Oráculos y Verificación Empírica:**
  - `ia-gateway/src/config/startup.test.ts`: 6/6 tests aprobados (secreto ausente, 31 chars, 32 chars, 64 hex chars, colisión en FAST y REASONING).
  - `ia-gateway/src/endpoints/llm/fallback.test.ts`: Actualizado para verificar error determinista en lugar de warning.
  - Verificación en entorno real contra `src/.env.local` y `src/.env.production`: ambos validados con longitud 64 y anclajes ortogonales conformes.
  - Oráculos: `tsc --noEmit` y `vitest run` (10 suites, 47 tests) en verde.
