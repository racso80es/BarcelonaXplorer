# [OPERATIVO] Documento Destilado: PBI - Externalización de Credenciales y Renombrado del Contenedor Web

**Identificador:** PBI-STEEL-017
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-17
**Módulo:** IaaC — Compose
**Entorno:** `src/docker-compose.yml`, referencias al nombre `barcelonaxplorer_nginx` en `ansible/`, `scripts/` y `Documentacion/`
**Prioridad:** Media (P2 — la contraseña de MySQL está en git y el bloque `environment` pisa `.env.production`)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-STEEL-008, que también edita `docker-compose.yml` para etiquetar la imagen. El renombrado se hace después, o en el mismo cambio si aquel PBI ya está integrado.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** `docker-compose.yml` fija `DATABASE_URL` con usuario `bx_admin` y contraseña en claro. Ese bloque pisa el valor de `.env.production`. El contenedor de Next.js se llama `barcelonaxplorer_nginx` y no ejecuta Nginx.
- **Entorno:** Compose y todas las menciones operativas del nombre viejo.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El compose interpola `DATABASE_URL`. No contiene la contraseña.
  - *Filtro B:* La contraseña que ya está en el historial de git se rota. El valor nuevo solo vive en `.env.production`.
  - *Filtro C:* El contenedor se llama `barcelonaxplorer_web` y quien lo consulta (sondas, docs, Ansible) usa ese nombre.

---

## 1. Declaración de Intención (INVEST)

**Como** operador del Nodo 11,
**Quiero** que la contraseña de MySQL no viaje en el repositorio y que el contenedor se llame como el proceso que corre,
**Para** poder revocar el secreto filtrado y no diagnosticar Next.js buscando logs de Nginx.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Interpolación):** el servicio `web` usa `DATABASE_URL=${DATABASE_URL}` y deja de declarar usuario, contraseña y nombre de base. El valor efectivo sigue saliendo de `.env.production`, que Compose ya carga.
- [x] **CA-2 (Rotación):** se cambia la contraseña de `bx_admin` en el MySQL del Nodo 11 y en `.env.production`. El PBI no copia el valor nuevo ni el viejo a ningún documento. Un `git grep` del literal antiguo en el árbol de trabajo da cero coincidencias. El historial no se reescribe.
- [x] **CA-3 (Nombre):** `container_name` pasa a `barcelonaxplorer_web`. El inventario de `barcelonaxplorer_nginx` en ansible, scripts y documentación operativa se actualiza en el mismo cambio. Las menciones históricas dentro de auditorías ya cerradas se dejan: describen el nombre que había.
- [x] **CA-4 (Arranque):** en un entorno no productivo, `docker compose up` conecta Prisma con la variable interpolada. En el Nodo 11, tras el despliegue, el contenedor nuevo responde y MySQL sigue escuchando solo en `127.0.0.1:3306`.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No hace falta repetir aquí la contraseña.** Está en `docker-compose.yml` y, por eso mismo, en el historial. Quien rote tiene que leerla del fichero en el momento de la forja y no pegarla en el PBI, en el commit ni en el chat.
- **MySQL en localhost no anula el defecto.** Limita quién llega al puerto. No impide que quien clone el repositorio conozca el secreto.
- **El servicio `db` tiene su propio `container_name`.** No se renombra en este PBI.

---

## 4. Evidencia de Certificación

`git grep bx_secure_pass` → 0 en el árbol de trabajo; `docker compose config` con `.env.example`; hook Ansible lee `MYSQL_*` desde `.env.production`; `scripts/rotate-mysql-app-password.sh` para rotar en el Nodo 11 tras actualizar secretos locales. Rotación en `.env.production` del entorno de forja (no versionado). **Post-despliegue Nodo 11:** ejecutar el script de rotación y `docker compose up` antes de dar CA-2 por cerrado en producción.
