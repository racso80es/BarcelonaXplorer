# [OPERATIVO] Documento Destilado: PBI - Oráculo de Empaquetado y del IA Gateway en audit-anchor y CI

**Identificador:** PBI-GW-011
**Estatus:** Pendiente
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) · Escenario 5
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-13
**Módulo:** `scripts/audit-anchor.sh`, `.github/workflows/ci.yml`, `src/playwright.config.ts`
**Entorno:** Pipeline local de oráculos y CI de GitHub
**Prioridad:** Alta (P1)
**Estimación Táctica:** 2 Story Points
**Depende de:** Ninguno
**Bloqueo:** Ninguno

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Cerrar el punto ciego por el que F-01 de AUD-INFRA-GW-001 llegó a `main` con los tres oráculos en verde: ni `audit-anchor.sh` ni CI ejecutan el empaquetador ni los oráculos del microservicio.
- **Entorno:** `scripts/audit-anchor.sh` (5 pasos, todos dentro de `src/`), `.github/workflows/ci.yml` (`working-directory: src`), `src/playwright.config.ts` (`reuseExistingServer: !process.env.CI`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Empaquetado explícito):* `npx next build` pasa a ser un paso propio del script, anterior al E2E. Hoy solo ocurre de forma implícita dentro del `webServer` de Playwright.
  - *Filtro B (Reutilización engañosa):* en local `reuseExistingServer: true` puede reutilizar un `next dev` previo y no compilar nada; el script de auditoría debe forzar compilación fresca.
  - *Filtro C (Segundo paquete):* `ia-gateway/` tiene su propio `tsc --noEmit` y `vitest run`, hoy fuera de todo pipeline.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el script de auditoría y la CI fallen cuando el empaquetado o el microservicio estén rotos,
**Para** que un fallo como el del symlink `src/ia-gateway` no pueda volver a mergearse con "oráculos en verde".

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Paso de empaquetado):** `scripts/audit-anchor.sh` incorpora un paso `npx next build` ejecutado en `src/`, anterior al paso de Playwright, que aborta el script con código distinto de cero si el build falla. Verificación: revertir temporalmente `src/app/globals.css` al estado anterior a AUD-INFRA-GW-001 reproduce el panic `leaves the filesystem root` y el script termina en rojo (la reversión no se commitea).
- [ ] **CA-2 (Sin reutilización en auditoría):** el `webServer` de Playwright no reutiliza servidores previos cuando lo invoca `audit-anchor.sh`. Mecanismo propuesto: variable de entorno leída por `playwright.config.ts` (p. ej. `BX_AUDIT=1`) que fuerce `reuseExistingServer: false`, exportada por el script. El comportamiento por defecto para el desarrollador no cambia.
- [ ] **CA-3 (Oráculos del gateway):** el script añade pasos que ejecutan en `ia-gateway/` `npx tsc --noEmit` y `npx vitest run`, abortando ante cualquier fallo.
- [ ] **CA-4 (CI):** `.github/workflows/ci.yml` ejecuta los mismos pasos nuevos (empaquetado y oráculos del gateway) además de los actuales. El job instala dependencias de `ia-gateway/` (`npm ci`) antes de sus oráculos.
- [ ] **CA-5 (Tiempo acotado):** el paso de empaquetado no duplica trabajo con el E2E. Si Playwright vuelve a construir porque su `webServer` ejecuta `npm run build`, se acepta la duplicación solo si se documenta en el script; la alternativa preferida es que el E2E reutilice el artefacto del paso anterior cuando `BX_AUDIT=1`.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El build de producción ya se verificó en verde** tras la corrección de F-01 (AUD-INFRA-GW-001 §2): 22 rutas generadas. El paso nuevo no debe exigir variables de entorno de producción; `next build` funciona sin `.env.production`.
- **No se relaja el E2E.** `deploy.sh` seguirá ejecutando `CI=1 npm run test:e2e` como aduana previa al despliegue. Este PBI añade un fallo más temprano y legible, no sustituye esa aduana.
- **`ia-gateway` no tiene `eslint` propio.** No se inventa un lint del gateway en este PBI; sus oráculos son `tsc` y `vitest`, que son los que su `package.json` declara (`typecheck`, `test`).
