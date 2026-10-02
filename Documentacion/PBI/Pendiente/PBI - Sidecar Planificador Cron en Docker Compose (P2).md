# [OPERATIVO] Documento Destilado: PBI - Sidecar Planificador Cron en Docker Compose

**Identificador:** PBI-CTX-003
**Estatus:** Pendiente (ejecutable en paralelo a PBI-CTX-001)
**Fecha de Creación:** 2026-09-30
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §5.1 · Escenario 11
**Módulo:** `src/docker-compose.yml`, `src/cron/crontab`, `src/deploy.sh`, `src/.env.example`, `ansible/` (si hace falta sincronizar `.env.cron`)
**Entorno:** Docker Compose, BusyBox `crond` (Alpine con versión fijada), Nodo 11 vía Ansistrano
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** —
**Bloquea:** Programación de PBI-CTX-005 y PBI-CTX-009 (sus entradas de `crontab` se añaden en esos PBIs)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Nuevo servicio `cron` que dispara por HTTP interno los Route Handlers de mantenimiento protegidos con `CRON_SECRET`. Primer uso: `/api/telemetry/prune`, que hoy existe pero no tiene planificador.
- **Entorno:** Red por defecto de Compose (no existe red con nombre), DNS interno `web:3000`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Inmutabilidad):* Imagen Alpine con versión fijada (no `latest`), `crontab` versionado en Git y montado `ro`.
  - *Filtro B (Custodia de Secretos):* `CRON_SECRET` en `.env.cron` segregado; el `crontab` nunca contiene el secreto; no se reutiliza `.env.web` (tiene credenciales de MySQL).
  - *Filtro C (Aislamiento):* Sin puertos publicados, sin volúmenes de datos, sin acceso a `db`. Su caída no afecta a `web`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador de Infraestructura,
**Quiero** un planificador declarado en Docker Compose y desplegado con cada release,
**Para** automatizar las tareas de mantenimiento sin tocar el `crontab` ni `systemd` del Nodo 11.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Servicio):** `cron` en `src/docker-compose.yml` con `container_name: barcelonaxplorer_cron`, `restart: unless-stopped`, `depends_on: [web]`, imagen Alpine con versión fijada y comando `crond -f -l 2`. Sin `ports`, sin volúmenes salvo el `crontab`.
- [ ] **CA-2 (Crontab versionado):** `src/cron/crontab` montado en `/etc/crontabs/root:ro`, con comentarios semánticos. Contenido inicial: solo la purga de telemetría (`POST http://web:3000/api/telemetry/prune`). Las entradas `/api/context/*` **no** se añaden aquí.
- [ ] **CA-3 (Cliente HTTP):** BusyBox `wget` con `--header="Authorization: Bearer ${CRON_SECRET}"` y `--post-data=''`. No se instala `curl` en arranque; si se prefiere `curl`, `Dockerfile` mínimo versionado en `src/cron/`.
- [ ] **CA-4 (Propagación de entorno):** Verificado empíricamente que BusyBox `crond` pasa `CRON_SECRET` del `env_file` a los trabajos. Si no, script envoltorio que cargue el entorno. Evidencia en el PBI.
- [ ] **CA-5 (Secreto):** `env_file: .env.cron` con solo `CRON_SECRET`. `src/deploy.sh` aborta si falta `.env.cron` o si su `CRON_SECRET` difiere del de `.env.web` (mismo patrón que `IA_GATEWAY_SECRET`). Documentado en `src/.env.example`.
- [ ] **CA-6 (Despliegue):** Ansible/Ansistrano deja `.env.cron` disponible en el nodo igual que los demás ficheros `.env.*`.
- [ ] **CA-7 (Verificación):** `docker compose config --quiet` sin errores; en local, un trabajo de prueba a cada minuto provoca `HTTP 200` en `/api/telemetry/prune` y un `401` si el secreto es inválido.

---

## 3. Fuera de Alcance

- Los Route Handlers `/api/context/ingest` y `/api/context/maintain` (PBI-CTX-005 y PBI-CTX-009).
