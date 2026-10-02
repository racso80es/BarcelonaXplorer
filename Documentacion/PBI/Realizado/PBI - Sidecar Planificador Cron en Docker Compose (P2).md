# [OPERATIVO] Documento Destilado: PBI - Sidecar Planificador Cron en Docker Compose

**Identificador:** PBI-CTX-003  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-30  
**Fecha de Finalización:** 2026-10-02  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §5.1 · Escenario 11  
**Módulo:** `src/docker-compose.yml`, `src/cron/crontab`, `src/deploy.sh`, `src/.env.example`, `src/.env.cron`, `ansible/deploy.yml`  
**Entorno:** Docker Compose, BusyBox `crond` (Alpine 3.20 con versión fijada), Nodo 11 vía Ansistrano  
**Prioridad:** Media (P2)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** —  
**Bloquea:** Programación de PBI-CTX-005 y PBI-CTX-009 (sus entradas de `crontab` se añaden en esos PBIs)  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Nuevo servicio `cron` que dispara por HTTP interno los Route Handlers de mantenimiento protegidos con `CRON_SECRET`. Primer uso: `/api/telemetry/prune`, que hoy existe pero no tenía planificador continuo.
- **Entorno:** Red por defecto de Compose (DNS interno `web:3000`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Inmutabilidad):* Imagen `alpine:3.20` con versión fijada (no `latest`), `crontab` versionado en Git y montado en solo lectura (`ro`).
  - *Filtro B (Custodia de Secretos):* `CRON_SECRET` en `.env.cron` segregado (0600); el `crontab` nunca contiene el secreto; no se reutiliza `.env.web` para aislar credenciales de MySQL.
  - *Filtro C (Aislamiento):* Sin puertos publicados, sin volúmenes de datos mutables, sin acceso a `db`. Su caída no degrada la disponibilidad de `web`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador de Infraestructura,  
**Quiero** un planificador declarado en Docker Compose y desplegado con cada release,  
**Para** automatizar las tareas de mantenimiento sin tocar el `crontab` ni `systemd` del Nodo 11.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Servicio):** `cron` en `src/docker-compose.yml` con `container_name: barcelonaxplorer_cron`, `restart: unless-stopped`, `depends_on: [web]`, imagen Alpine con versión fijada (`alpine:3.20`) y comando `["crond", "-f", "-l", "2"]`. Sin `ports`, sin volúmenes salvo el `crontab`.
- [x] **CA-2 (Crontab versionado):** `src/cron/crontab` montado en `/etc/crontabs/root:ro`, con comentarios semánticos. Contenido inicial: solo la purga de telemetría (`POST http://web:3000/api/telemetry/prune`). Las entradas `/api/context/*` no se añaden aquí (se reservan para PBI-CTX-005 y PBI-CTX-009).
- [x] **CA-3 (Cliente HTTP):** BusyBox `wget` con `--header="Authorization: Bearer ${CRON_SECRET}"` y `--post-data=''`. Sin dependencias externas ni instalación en arranque.
- [x] **CA-4 (Propagación de entorno):** Verificado empíricamente que BusyBox `crond` en `alpine:3.20` propaga `CRON_SECRET` desde el entorno a los trabajos (evidencia: ejecución de prueba con variable propagada exitosamente).
- [x] **CA-5 (Secreto):** `env_file: .env.cron` con solo `CRON_SECRET`. `src/deploy.sh` valida la existencia de `.env.cron` y aborta ante discrepancia con `CRON_SECRET` de `.env.web`. Documentado en `src/.env.example`.
- [x] **CA-6 (Despliegue):** `ansible/deploy.yml` añade `.env.cron` a `ansistrano_shared_files` y lo transfiere a `shared` con permisos `0600`.
- [x] **CA-7 (Verificación):** `docker compose config --quiet` verificado con exit code 0; tests de endpoint `/api/telemetry/prune` confirman `HTTP 200` con Bearer token válido y `401` ante secreto inválido o ausente.

---

## 3. Evidencia de Cumplimiento

1. **Servicio Declarado (`src/docker-compose.yml`):**
   ```yaml
   cron:
     image: alpine:3.20
     container_name: barcelonaxplorer_cron
     restart: unless-stopped
     depends_on:
       - web
     env_file: .env.cron
     volumes:
       - ./cron/crontab:/etc/crontabs/root:ro
     command: ["crond", "-f", "-l", "2"]
   ```
2. **Crontab Canónico (`src/cron/crontab`):**
   Disparo diario a las 03:30 AM con `wget` y cabecera de autenticación Bearer protegida.
3. **Verificación Empírica de Propagación de Entorno (CA-4):**
   Ejecución en contenedor Docker aislado con BusyBox `crond` confirmando que las tareas hijas heredan variables de entorno directamente (`VAR=super-secret-123`).
4. **Blindaje de Despliegue (`src/deploy.sh` y `ansible/deploy.yml`):**
   Aduana estricta que exige `.env.cron` con `CRON_SECRET` idéntico a `.env.web`.
5. **Oráculos:**
   - `docker compose config --quiet`: 0 errores.
   - `app/api/telemetry/prune/route.test.ts`: 4/4 tests pasados en verde (200 OK y 401 Unauthorized).
