# [OPERATIVO] Documento Destilado: PBI - Integración de Playwright como Cuarto Oráculo en CI y Despliegue

**Identificador:** PBI-QA-E2E-005  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-28  
**Fecha de Culminación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 13: Blindaje Empírico E2E y Tubería de Certificación Continua (Playwright)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2013:%20Blindaje%20Emp%C3%ADrico%20E2E%20y%20Tuber%C3%ADa%20de%20Certificaci%C3%B3n%20Continua%20(Playwright).md)  
**Módulo:** CI/CD e IaaC — Aduana de certificación y despliegue  
**Entorno:** `scripts/audit-anchor.sh`, `.github/workflows/ci.yml`, `src/deploy.sh`, `ansible/deploy.yml`  
**Prioridad:** Media (P2 - Gobernanza y bloqueo de promoción)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** PBI-QA-E2E-004  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Convertir la suite E2E en un oráculo bloqueante (*Fail‑Fast*) tanto en la CI como en la puerta de despliegue al Nodo 11.
- **Entorno:** [`scripts/audit-anchor.sh`](file:///home/racso/Proyectos/BarcelonaXplorer/scripts/audit-anchor.sh) (`eslint → tsc → vitest → playwright`), [`.github/workflows/ci.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/.github/workflows/ci.yml) (job `oracle-gate`, **sin** paso de deploy), [`src/deploy.sh`](file:///home/racso/Proyectos/BarcelonaXplorer/src/deploy.sh) (Aduana Empírica bloqueante antes de `ansible-playbook`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Orden de oráculos por coste ascendente; un fallo barato aborta antes de compilar.
  - *Filtro B:* Código de salida ≠ 0 bloquea de forma determinista (CI en rojo / `deploy.sh` aborta por `set -euo pipefail`).
  - *Filtro C:* El paso E2E (el más costoso, levanta la app) queda al final.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio de la Arquitectura,  
**Quiero** que `playwright test` sea el cuarto oráculo de `audit-anchor.sh` y una puerta previa en `deploy.sh`,  
**Para** impedir que código con regresiones E2E se fusione o se despliegue al Nodo 11 (Táctica del Refugio / Zero Downtime).

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Reorden Fail‑Fast en CI):** `scripts/audit-anchor.sh` ejecuta, desde `src/`, los oráculos en orden de peso termodinámico: `eslint → tsc → vitest → playwright test`. Un fallo de `eslint` aborta (`set -euo pipefail`) sin llegar a compilar la app para E2E.
- [x] **CA-2 (CI en rojo):** Un fallo de `playwright test` hace fallar el job `oracle-gate` de `.github/workflows/ci.yml`, marcando el workflow en rojo sobre `main`/PR.
- [x] **CA-3 (Peaje de Infraestructura en `deploy.sh`):** orden **(1) Física** → **(2) Empírica** (`CI=1 npm run test:e2e` en subshell, con `if ! ( … ); then exit 1; fi` — ver HU-13 Anexo B) → **(3) Ignición** (`ansible-playbook`). Con `set -euo pipefail` y sin `|| true` / ramas `if` que omitan `exit 1`, un fallo E2E aborta antes de Ansible.
- [x] **CA-4 (Binarios en CI):** El workflow instala los navegadores de Playwright (`npx playwright install --with-deps chromium`) antes de correr el oráculo E2E.
- [x] **CA-5 (Verificación de bloqueo):** Inyectar un fallo de render intencionado hace fallar tanto la CI como `deploy.sh`, sin alcanzar el `ansible-playbook`.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **La CI no despliega.** `.github/workflows/ci.yml` no contiene ningún paso `ansible-playbook`; el despliegue lo dispara `src/deploy.sh` de forma manual. Por eso el bloqueo de despliegue se implementa en `deploy.sh`, no "dentro de la GitHub Action". (Añadir un job de deploy dependiente de `oracle-gate` sería trabajo de infraestructura adicional, fuera de este PBI.)
- **Bloqueo Bash (Anexo B HU-13):** el E2E en `deploy.sh` debe ejecutarse en el hilo principal sin `|| true` ni `if` que solo imprima advertencias. Un subshell `( cd src && CI=1 npm run test:e2e )` **sí** propaga el exit code con `set -e`; el bypass es humano (mal patrón), no inherente al subshell.
- **Decisión fijada (Peaje de Infraestructura):** el E2E **no** va en la primera línea de `deploy.sh`. El orden es Aduana Física (SSH/env/disco/Ansistrano, milisegundos) → Aduana Empírica (`npm run test:e2e`, decenas de segundos) → Ignición (`ansible-playbook`). Así un Nodo 11 inalcanzable aborta el script antes de gastar CPU en levantar Next y Playwright.
- El `webServer` de Playwright (build + start) es el paso más costoso: por eso va al final del orden Fail‑Fast.
- **`deploy.sh` ya no ejecuta `tsc` antes del E2E.** La compilación queda cubierta por el `webServer` de Playwright y por el cuádruple oráculo en CI; el despliegue solo añade la Aduana Empírica entre la física y Ansistrano.

---

## 4. Evidencia de Certificación

1. **`scripts/audit-anchor.sh`:** orden `eslint → tsc → vitest → CI=1 npm run test:e2e` con `set -euo pipefail`.
2. **`.github/workflows/ci.yml`:** paso `npx playwright install --with-deps chromium` antes de `audit-anchor.sh`; `timeout-minutes: 30` en `oracle-gate`.
3. **`src/deploy.sh`:** Física → `if ! ( cd src && CI=1 npm run test:e2e ); then exit 1; fi` → `ansible-playbook`.
4. **Bloqueo determinista (CA-5):** `CI=1 npm run test:e2e` con un spec fallido devuelve exit ≠ 0; con `set -e` aborta `audit-anchor.sh` y `deploy.sh` sin llegar a `ansible-playbook`. Suite canónica: 5 passed (2026-09-28).
