# [OPERATIVO] Documento Destilado: PBI - Lanzador Local Versionado `scripts/dev-up.sh`

**Identificador:** PBI-GW-015
**Estatus:** Pendiente
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) · Escenario 6
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-17
**Módulo:** `scripts/dev-up.sh`, `README.md`
**Entorno:** Desarrollo local en el host (fuera de Docker Compose)
**Prioridad:** Media (P2)
**Estimación Táctica:** 1 Story Point
**Depende de:** Ninguno
**Bloqueo:** Ninguno

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Traer al repositorio el conocimiento operativo de arranque local, que hoy vive en un fichero fuera de git.
- **Entorno:** `~/Aplicaciones/BarcelonaXplorer/BX-Arranque Local.sh`, reescrito el 2026-09-29 durante AUD-INFRA-GW-001 (F-03) para compilar y arrancar el gateway, esperar `/healthz`, cerrar instancias `next dev` previas y limpiar al salir.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Axioma I):* la lógica que mantiene el entorno local funcionando no puede depender de un fichero que un clon nuevo del repositorio no contiene.
  - *Filtro B (Un solo MySQL de desarrollo):* el contenedor `bx-mysql-dev` se gestiona con `docker start` y es independiente del servicio `db` de `docker-compose.yml`. El script no debe intentar levantar el Compose de producción en local.
  - *Filtro C (Aduana de entorno):* el script actual aborta si `.env.local` no define `IA_GATEWAY_URL` e `IA_GATEWAY_SECRET`. Esa aduana es el equivalente local de la de `deploy.sh` y se conserva.

---

## 1. Declaración de Intención (INVEST)

**Como** desarrollador del proyecto,
**Quiero** arrancar monolito, gateway y MySQL con un script versionado,
**Para** que cualquier clon del repositorio pueda reproducir el entorno local sin depender de ficheros personales.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Script versionado):** `scripts/dev-up.sh` contiene la lógica completa del lanzador actual: comprobación de `.env.local`, `docker start bx-mysql-dev` si no está en marcha, cierre de instancias `next dev` previas del mismo directorio, `npm ci` condicional y `npm run build` en `ia-gateway/`, arranque con `node --env-file=src/.env.local`, espera activa de `GET /healthz` con fallo explícito si no responde, `npm run dev` en primer plano y `trap` que detiene el gateway al salir.
- [ ] **CA-2 (Rutas robustas):** el script resuelve el directorio del repositorio a partir de su propia ubicación (`BASH_SOURCE`), no de `$HOME/Proyectos/...`, de modo que funciona en otro clon.
- [ ] **CA-3 (Envoltorio):** `~/Aplicaciones/BarcelonaXplorer/BX-Arranque Local.sh` queda reducido a invocar `scripts/dev-up.sh` y a propagar su código de salida. El atajo personal sigue funcionando.
- [ ] **CA-4 (Documentación):** `README.md` de la raíz describe el arranque local con `scripts/dev-up.sh`, los prerrequisitos (Docker con el contenedor `bx-mysql-dev`, `src/.env.local` a partir de `src/.env.example`) y el puerto del gateway (`3001`).
- [ ] **CA-5 (Verificación):** en una ejecución real el script deja `GET /` en `200` y `GET http://127.0.0.1:3001/healthz` con `success: true`, y al interrumpirlo con `Ctrl+C` el proceso del gateway no queda huérfano (`pgrep` no lo encuentra).

---

## 3. Notas de Forja (Anti‑Alucinación)

- **La fuente es el lanzador ya corregido**, no el original de una línea. Reescribirlo desde cero perdería la espera de `/healthz` y la limpieza, que son las dos piezas que evitan arrancar el monolito contra un gateway caído.
- **No se añade un `docker-compose` de desarrollo.** El Vértice trabaja con MySQL en contenedor y Node en el host; este PBI no introduce un segundo modelo de entorno.
- **El script no imprime secretos.** `.env.local` se pasa a Node con `--env-file`; ninguna línea del script vuelca su contenido.
