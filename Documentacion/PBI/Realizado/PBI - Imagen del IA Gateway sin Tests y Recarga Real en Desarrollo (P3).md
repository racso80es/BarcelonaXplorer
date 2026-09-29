# [OPERATIVO] Documento Destilado: PBI - Imagen del IA Gateway sin Tests y Recarga Real en Desarrollo

**Identificador:** PBI-GW-016
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md)
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-14, F-04
**Módulo:** `ia-gateway/`
**Entorno:** Imagen Docker del gateway y ciclo de desarrollo local
**Prioridad:** Baja (P3)
**Estimación Táctica:** 1 Story Point
**Depende de:** Ninguno
**Bloqueo:** Ninguno

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Que el artefacto de producción contenga solo código de producción y que el modo desarrollo recompile al editar.
- **Entorno:** `ia-gateway/tsconfig.json` incluye `src/**/*` sin excluir tests; `ia-gateway/Dockerfile` copia `dist/` completo (8 ficheros `*.test.js` compilados). El script `dev` quedó en `tsc && node --watch dist/index.js` (corrección F-04, 2026-09-29): compila una vez y observa el JavaScript emitido, así que editar un `.ts` no recompila ni reinicia.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Verificación separada de emisión):* `npm run typecheck` (`tsc --noEmit`) debe seguir cubriendo los tests; la exclusión solo aplica a la emisión de `npm run build`.
  - *Filtro B (Imagen):* el Dockerfile invoca `npm run build`, así que corregir el script corrige la imagen sin tocar el Dockerfile.
  - *Filtro C (Sin dependencias nuevas):* la recarga se resuelve con `tsc --watch` y `node --watch`, ambos disponibles; no se añade `tsx` ni `ts-node`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que la imagen del gateway no incluya tests y que al desarrollar un cambio en TypeScript se recompile solo,
**Para** reducir la superficie desplegada y acortar el ciclo de edición.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Configuración de emisión):** existe `ia-gateway/tsconfig.build.json` que extiende `tsconfig.json` vigente y excluye `src/**/*.test.ts`. `npm run build` usa `tsc -p tsconfig.build.json`. `npm run typecheck` sigue siendo `tsc --noEmit` con el `tsconfig.json` que incluye los tests.
- [x] **CA-2 (Artefacto limpio):** tras `npm run build`, `dist/` no contiene ningún `*.test.js`. `vitest.config.ts` excluye `dist/`, reportando las 10 suites limpiamente (47 tests).
- [x] **CA-3 (Recarga real):** `npm run dev` configurado con compilación inicial, observador `tsc -p tsconfig.build.json --watch` y `node --watch dist/index.js` coordinados con `trap 'kill 0' INT TERM EXIT`.
- [x] **CA-4 (Imagen):** `docker build` de `ia-gateway/Dockerfile` verificado exitosamente; la imagen final no contiene ningún archivo `*.test.js` en `dist/` (comprobado vía `docker run`).
- [x] **CA-5 (Oráculos):** `tsc --noEmit` y `vitest run` en verde en `ia-gateway/` (10 suites, 47 tests).

---

## 3. Notas de Forja (Anti‑Alucinación)

- **F-04 ya está corregido.** El script `dev` actual funciona; este PBI lo mejora. No se reintroduce `ts-node`, que no está instalado y fue la causa del hallazgo original.
- **El `tsconfig.json` base no se vacía de tests.** Si se excluyen ahí, `typecheck` dejaría de compilar los tests y el oráculo perdería cobertura sin avisar.
- **`--watch` de tsc emite a `dist/` igual que una compilación normal**, así que `node --watch` ve el cambio. El primer arranque de Node debe esperar a que exista `dist/index.js` (un bucle de espera corto) para evitar la carrera del primer ciclo.

---

## 4. Evidencia de Implementación (Oráculos de Forja)

- **Configuración de Emisión Limpia:** Creado `ia-gateway/tsconfig.build.json` extendiendo `tsconfig.json` y excluyendo `src/**/*.test.ts`.
- **Scripts de Ciclo de Vida:** `ia-gateway/package.json` actualizado con:
  - `"build": "tsc -p tsconfig.build.json"`
  - `"dev": "tsc -p tsconfig.build.json && (trap 'kill 0' INT TERM EXIT; tsc -p tsconfig.build.json --watch --preserveWatchOutput & node --watch dist/index.js)"`
  - `"typecheck": "tsc --noEmit"`
- **Blindaje Dockerfile:** Actualizado `ia-gateway/Dockerfile` para copiar `tsconfig*.json` en la etapa builder.
- **Verificación de Imagen Docker:** `docker build` ejecutado y validado con `docker run --rm --entrypoint sh ia-gateway-test:latest -c "find dist -name '*.test.js'"` retornando 0 coincidencias.
- **Verificación de Oráculos:** `npm run typecheck` en verde y `npm run test` con 10/10 suites pasadas (47 tests).
