# [OPERATIVO] Documento Destilado: PBI - Imagen del IA Gateway sin Tests y Recarga Real en Desarrollo

**Identificador:** PBI-GW-016
**Estatus:** Pendiente
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

- [ ] **CA-1 (Configuración de emisión):** existe `ia-gateway/tsconfig.build.json` que extiende el `tsconfig.json` vigente y excluye `src/**/*.test.ts`. `npm run build` usa `tsc -p tsconfig.build.json`. `npm run typecheck` sigue siendo `tsc --noEmit` con el `tsconfig.json` que incluye los tests.
- [ ] **CA-2 (Artefacto limpio):** tras `npm run build`, `dist/` no contiene ningún `*.test.js`. `npx vitest run` sigue reportando exactamente 8 ficheros y 34 tests (la red de seguridad de `ia-gateway/vitest.config.ts`, que excluye `dist/`, se mantiene).
- [ ] **CA-3 (Recarga real):** `npm run dev` compila y queda observando `src/`: al modificar un fichero `.ts` se recompila y el proceso de Node se reinicia. Implementación de referencia: `tsc -p tsconfig.build.json --watch` en segundo plano y `node --watch dist/index.js`, terminando ambos al salir.
- [ ] **CA-4 (Imagen):** `docker build` de `ia-gateway/Dockerfile` termina con éxito y la imagen resultante no contiene `dist/**/*.test.js` (comprobable con `docker run --entrypoint sh <imagen> -c 'ls dist'`).
- [ ] **CA-5 (Oráculos):** `tsc --noEmit` y `vitest run` en verde en `ia-gateway/`.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **F-04 ya está corregido.** El script `dev` actual funciona; este PBI lo mejora. No se reintroduce `ts-node`, que no está instalado y fue la causa del hallazgo original.
- **El `tsconfig.json` base no se vacía de tests.** Si se excluyen ahí, `typecheck` dejaría de compilar los tests y el oráculo perdería cobertura sin avisar.
- **`--watch` de tsc emite a `dist/` igual que una compilación normal**, así que `node --watch` ve el cambio. El primer arranque de Node debe esperar a que exista `dist/index.js` (un bucle de espera corto) para evitar la carrera del primer ciclo.
