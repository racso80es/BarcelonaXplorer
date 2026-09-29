# [OPERATIVO] Documento Destilado: PBI - IaaC Docker Compose y Despliegue Ansistrano del IA Gateway

**Identificador:** PBI-GW-008
**Estatus:** Pendiente (bloqueado por D-1)
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `src/docker-compose.yml`, `ansible/`, `src/.env.example`, `src/deploy.sh`
**Entorno:** Nodo de Producción 11 (`10.0.10.11`), Docker Compose, Ansible/Ansistrano
**Prioridad:** Alta (P1)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-GW-001
**Bloqueo:** Decisión D-1 (stack y ubicación del gateway en el repositorio)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Declaración del servicio `ia-gateway` en Docker Compose junto a `web` y `db`. Custodia de secretos de proveedores de IA en el nuevo servicio. Adaptación de Ansistrano/Ansible.
- **Entorno:** Nodo de Producción 11 (`10.0.10.11`), Docker Compose, Ansible.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Aislamiento de Red):* Sin publicación de puertos en el host; solo alcanzable por la red interna de Compose (`http://ia-gateway:<puerto>`).
  - *Filtro B (Custodia de Secretos):* `GEMINI_API_KEY`, `GROQ_API_KEY` y `JEV_API_KEY` pasan al servicio `ia-gateway`; `web` solo necesita `IA_GATEWAY_SECRET`.
  - *Filtro C (Aduana de Despliegue):* `IA_GATEWAY_SECRET` generado con al menos 64 caracteres; `deploy.sh` valida presencia y longitud mínima.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el servicio `ia-gateway` esté declarado en Docker Compose con aislamiento de red y custodia correcta de secretos,
**Para** desplegarlo en producción junto a `web` y `db` sin exposición de puertos ni fugas de credenciales.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Servicio Compose):** `ia-gateway` declarado en [`src/docker-compose.yml`](../../src/docker-compose.yml) sin `ports` publicados. Red interna compartida con `web`.
- [ ] **CA-2 (Variables):** `GEMINI_API_KEY`, `GROQ_API_KEY`, `JEV_API_KEY`, `DEFAULT_FAST_LLM`, `DEFAULT_REASONING_LLM` en el servicio `ia-gateway`. `IA_GATEWAY_SECRET` en ambos servicios (`web` e `ia-gateway`).
- [ ] **CA-3 (env.example):** Todas las variables nuevas documentadas en `src/.env.example` con valores de ejemplo y comentarios semánticos.
- [ ] **CA-4 (Aduana de Despliegue):** `src/deploy.sh` aborta si `IA_GATEWAY_SECRET` no está definido o tiene menos de 32 caracteres en `.env.production`.
- [ ] **CA-5 (Ansible):** [`ansible/deploy.yml`](../../ansible/deploy.yml) copia `.env.production` a `shared/` y el servicio `ia-gateway` lo consume vía `env_file` (o mecanismo equivalente). Sin inyección directa de variables por Ansistrano.
- [ ] **CA-6 (Healthcheck Compose):** Healthcheck del servicio `ia-gateway` contra `GET /healthz`.
