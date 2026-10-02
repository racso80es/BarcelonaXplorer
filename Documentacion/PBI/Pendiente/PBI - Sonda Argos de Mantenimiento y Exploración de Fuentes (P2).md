# [ARQUITECTURA] Documento Destilado: PBI - Sonda Argos de Mantenimiento y Exploración de Fuentes

**Identificador:** PBI-CTX-009
**Estatus:** Pendiente (bloqueado por PBI-CTX-002 y PBI-CTX-004)
**Fecha de Creación:** 2026-09-30
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §6 · Escenarios 3, 8
**Módulo:** `src/features/context-sources/` (`MaintainContextUseCase`), `src/app/api/context/maintain/route.ts`, `src/cron/crontab`
**Entorno:** Next.js Route Handler, IA Gateway `/llm` con `grounding: true`
**Prioridad:** Media (P2)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-CTX-002, PBI-CTX-004, PBI-CTX-003 (entrada de `crontab`)
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Proceso semanal que diagnostica fuentes `DEGRADED` y explora fuentes nuevas, registrando **solo propuestas** `PENDING_APPROVAL` para revisión humana.
- **Entorno:** Sondas deterministas primero; grounding de Gemini solo cuando las sondas no resuelven y para exploración.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Aduana de Aprobación Humana):* Argos nunca escribe `ACTIVE` ni modifica filas `ACTIVE`; URLs propuestas deben estar en `groundingSources`.
  - *Filtro B:* Transiciones vía la máquina de estados de PBI-CTX-004 con actor `ARGOS`.
  - *Filtro C:* LLM como último recurso; límite de propuestas por ejecución.

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico,
**Quiero** que un proceso semanal me proponga correcciones para fuentes caídas y fuentes nuevas,
**Para** mantener vivo el catálogo sin buscar a mano, conservando la decisión final.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Sondas deterministas):** Para cada `DEGRADED`: seguimiento de redirecciones 301/308, `HEAD` al endpoint y comprobación de `robots.txt`. Si hay nueva URL funcional, se propone sin LLM.
- [ ] **CA-2 (Hipótesis con grounding):** Solo si las sondas no resuelven, llamada `/llm` con `grounding: true`. Error `UNSUPPORTED_CAPABILITY` ⇒ se omite la hipótesis y se registra `WARN`, sin reintentar con otro proveedor.
- [ ] **CA-3 (Exploración):** Búsqueda con grounding de agendas y portales Open Data de Barcelona; se descartan candidatas cuyo endpoint ya exista en `context_sources`.
- [ ] **CA-4 (Registro de propuestas):** Toda propuesta se crea con `status: PENDING_APPROVAL`, `proposedBy: 'ARGOS'` y, si corrige una degradada, `supersedesSourceTag`. Test: la ingesta diaria ignora estas filas (Escenario 3).
- [ ] **CA-5 (Anti-alucinación):** Toda URL propuesta procedente del LLM está en `groundingSources` de la respuesta; si no, se descarta.
- [ ] **CA-6 (Límite):** Máximo configurable de propuestas por ejecución (valor inicial 5).
- [ ] **CA-7 (Route Handler):** `POST /api/context/maintain` con la misma protección `CRON_SECRET` (Escenario 8) y entrada semanal en `src/cron/crontab`.
- [ ] **CA-8 (Telemetría):** `TelemetryLog` por ejecución con `degradedChecked`, `proposalsCreated`, `groundingUnavailable`.
- [ ] **CA-9 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` y `npm run build` en verde.
