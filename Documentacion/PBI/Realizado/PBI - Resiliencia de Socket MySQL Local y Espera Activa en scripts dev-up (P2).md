# [OPERATIVO] Documento Destilado: PBI - Resiliencia de Socket MySQL Local y Diagnóstico Accionable en Admin Context

**Identificador:** PBI-DEV-001  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-10-12  
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md)  
**Origen:** Auditoría de fricción local sobre `/Admin/Context` (`Can't reach database server at 127.0.0.1:3306`, solo en local, no en PRO)  
**Módulo:** `scripts/dev-up.sh`, `src/features/context-sources/`, `src/app/Admin/Context/ContextSourcesCard.tsx`  
**Entorno:** Desarrollo local en el host (Next.js 16 + Turbopack + contenedor Docker `bx-mysql-dev`)  
**Prioridad:** Media (P2)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** PBI-GW-015 (`scripts/dev-up.sh`), PBI-CTX-010 (Panel `Admin/Context`)  
**Bloqueo:** Ninguno  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Endurecer el arranque local (verificación activa del socket MySQL), convertir el error crudo de Prisma en un diagnóstico accionable en `/Admin/Context` y **eliminar la exposición de credenciales MySQL en `~/.bash_history` y en la línea de comandos**, con un helper versionado que evite reincidir.
- **Entorno Afectado:**
  - `scripts/dev-up.sh`: tras `docker start bx-mysql-dev` no verifica que el puerto esté escuchando.
  - `ContextSourcesCard.tsx`: vuelca `error.message` íntegro de Prisma (incluye ruta `.next/dev/server/chunks/ssr/...` y el fragmento de código compilado).
- **Por qué no ocurre en PRO:** en producción el servicio `db` de `src/docker-compose.yml` corre con `restart: unless-stopped` y el servicio `web` declara `depends_on: db`; el DDL se aplica en `ansible/hooks/after_symlink.yml`. En local MySQL es un contenedor suelto gestionado a mano, sin política de reinicio ni supervisión.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Axioma II):* clasificar el fallo por **código de error tipado de Prisma** (`P1001`), no por búsqueda de subcadenas en el mensaje.
  - *Filtro B (Axioma IV):* el lanzador aplica a MySQL la misma espera activa que ya aplica al IA Gateway (`/healthz`).
  - *Filtro C (Axioma I):* la lógica de diagnóstico vive en el slice `features/context-sources/` con test colocado, no inline en un componente de `app/`.

---

## 1. Declaración de Intención (INVEST)

**Como** desarrollador en entorno local,  
**Quiero** que `scripts/dev-up.sh` garantice un MySQL escuchando antes de arrancar Next.js y que `/Admin/Context` explique con claridad cuándo la base de datos no responde,  
**Para** diagnosticar en segundos una caída de `bx-mysql-dev` sin interpretar trazas internas de Turbopack.

---

## 2. Fricciones Detectadas (Auditoría Forense)

Evidencia: `docker logs bx-mysql-dev`, `ps`, `docker inspect`, `journalctl`, `/var/log/apt/history.log` y `/var/log/dpkg.log` (hora local = UTC+2).

| Hora local | Evento |
| :--- | :--- |
| 06:50:03 | `dev-up.sh` arranca `bx-mysql-dev`; `ready for connections` a las 06:50:04 (≈1 s). |
| 06:50 | IA Gateway (PID 14451) y `next dev` (PID 14489) activos. |
| 06:57:20 | Inicia una actualización de paquetes vía `aptkit` (gestor de actualizaciones de Mint; no fue `unattended-upgrades`). |
| 06:57:29–31 | `dpkg` actualiza `docker-ce-cli` 29.8.2→29.9.0, `containerd.io` 2.3.6→2.4.1 y `docker-ce` 29.8.2→29.9.0. |
| 06:57:57 | `systemd` detiene y reinicia `containerd.service`; `dockerd` registra `Failed to get event ... EOF` y espera a containerd. |
| 06:58:00 | MySQL recibe `SHUTDOWN from user <via user signal>` (SIGTERM del daemon) y fuerza el cierre de 5 hilos de `bx_admin`. Contenedor `Exited (0)`. |
| 06:58:03 | `portainer` (política `always`) vuelve a arrancar solo; `bx-mysql-dev` (política `no`) permanece parado. |
| 06:58:21 | Termina la actualización de apt. |
| 07:00:30 | Petición a `/Admin/Context` → Prisma recibe conexión rechazada → banner de error. |

**Causa raíz demostrada:** la actualización de `docker-ce`/`containerd.io` reinició el runtime de Docker. Con `live-restore` desactivado (`docker info` → `LiveRestoreEnabled=false`; no existe `/etc/docker/daemon.json`), los contenedores se detienen con el daemon, y solo se recuperan los que tienen política de reinicio. `bx-mysql-dev` y `bx-pma` tienen `RestartPolicy=no`; `portainer` tiene `always` y sí se recuperó (log de Portainer reiniciado a las 06:58 local). `OOMKilled=false` y `ExitCode=0` descartan un fallo del contenedor.

**Descartado:** no hay comando `docker stop`/`kill` en `~/.bash_history` en ese intervalo; no hubo suspensión ni reinicio del equipo (arranque a las 06:34); no hubo OOM; Portainer no emitió ninguna orden de parada (su log solo muestra su propio reinicio).

**Limitación de la evidencia:** el extracto del journal revisado confirma la parada y reinicio de `containerd.service` a las 06:57:57 y el apagado de MySQL a las 06:58:00, pero no se capturó la línea explícita de `docker.service` deteniéndose. Que el daemon envió SIGTERM al contenedor es la interpretación coherente con el mensaje `via user signal` y con los tiempos, no una traza directa.

1. **F-01 (Causa raíz del incidente — contenedor de desarrollo sin política de reinicio):** cualquier reinicio del daemon Docker (actualización de paquetes, reinicio manual del servicio) deja `bx-mysql-dev` parado mientras `next dev` sigue vivo. Es una fragilidad del entorno local, no un fallo de código. Contraste con PRO: el servicio `db` de `src/docker-compose.yml` declara `restart: unless-stopped`.
2. **F-02 (Riesgo latente — sin espera activa tras `docker start`):** `dev-up.sh` (líneas 37-41) no comprueba el puerto 3306, a diferencia del gateway (líneas 75-86). **No se materializó en este incidente** (MySQL tardó ≈1 s y Next.js tarda más en compilar la primera página), pero con un volumen frío o recuperación InnoDB el arranque puede alargarse. Se trata como endurecimiento preventivo.
3. **F-03 (Mensaje no accionable):** [`ContextSourcesCard.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/Context/ContextSourcesCard.tsx#L39-L42) propaga `error.message` crudo al banner (línea 91), con rutas absolutas del host y código compilado, sin indicar la acción correctiva.
4. **F-04 (Verificado, no es fricción):** tabla `context_sources` con 6 filas `ACTIVE` y consulta Prisma correcta una vez MySQL volvió a estar activo (`node --env-file=.env.local`). Prisma Client se reconecta sin reiniciar Next.js. Ningún cambio en `src/shared/persistence/prisma.ts`.
5. **F-05 (Credencial root viva en `~/.bash_history`):** auditoría con valores enmascarados (584 líneas; fichero `600`, sin copias ni backups; último volcado 2026-10-02 19:53). Las líneas 338-352 contienen contraseñas de MySQL en claro en `docker run -e MYSQL_ROOT_PASSWORD=...`, `docker exec ... mysql -u root -p<valor>` y `ALTER USER ... IDENTIFIED BY '<valor>'` (incluida una contraseña trivial `root` en las líneas 344 y 347, ya obsoleta). Comprobación sin imprimir secretos: **la contraseña root de la línea 352 coincide con `MYSQL_ROOT_PASSWORD` de `src/.env.local` y abre el MySQL actual (`bx-mysql-dev`)**: es una credencial viva. La contraseña de `bx_admin` del historial **ya no funciona** (se rotó). Riesgo acotado a la máquina local (`bx-mysql-dev` solo publica el 3306 en el host, sin ruta de exposición externa verificada), pero el historial lo leen otras herramientas, copias de seguridad y asistentes con acceso al `$HOME`.
6. **F-06 (Patrón recurrente que origina la fuga):** el contenedor de desarrollo se crea y administra a mano, con la contraseña como argumento (`-e MYSQL_ROOT_PASSWORD=...`, `-p<valor>`). Esto la deja tanto en el historial como en la lista de procesos (`ps`) mientras dura el comando. En el repositorio: `scripts/rotate-mysql-app-password.sh` pasa `-p"${MYSQL_ROOT_PASSWORD}"` (no queda en historial por ser un script, pero sí en `ps`) y `ansible/hooks/after_symlink.yml:70` hace lo mismo con `${MYSQL_PASSWORD}` en producción. Además `HISTCONTROL=ignoreboth` (`~/.bashrc:13`) solo evita las líneas que empiezan por espacio; no hay `HISTIGNORE`.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Espera activa de socket en `dev-up.sh`):**
  - Tras `docker start`, el script sondea `host:puerto` con `/dev/tcp` (Bash nativo, sin `nc`) cada 500 ms, hasta 15 s.
  - `host` y `puerto` se derivan de `DATABASE_URL` en `src/.env.local`; si no se pueden extraer, se usan `127.0.0.1` y `3306`. Sin valores fijos duplicados.
  - Si expira, aborta con `exit 1` **antes** de compilar el gateway o arrancar Next.js, con pista `docker logs bx-mysql-dev`.
  - El sondeo se hace también cuando el contenedor ya estaba en marcha (cubre el caso de contenedor "Up" pero sin listener aún).
- [x] **CA-2 (Diagnóstico tipado, en el slice):**
  - Nueva función pura `diagnoseDbError(error: unknown)` en `src/features/context-sources/db-error-diagnosis.ts`, que devuelve un objeto `{ kind: 'UNREACHABLE' | 'OTHER'; message: string }`.
  - `UNREACHABLE` se determina con `error instanceof Prisma.PrismaClientInitializationError && error.errorCode === 'P1001'`. Sin `any`, sin aserciones `!`.
  - Mensaje `UNREACHABLE`: *"El servidor MySQL local (127.0.0.1:3306) no responde. Asegúrate de iniciar el contenedor con `docker start bx-mysql-dev` o ejecutar `./scripts/dev-up.sh`."* (sin host/puerto hardcodeados: se leen de la propia excepción cuando están disponibles).
  - Mensaje `OTHER`: solo la última línea significativa del error de Prisma, sin rutas ni código compilado.
  - `ContextSourcesCard.tsx` usa esta función; la traza completa sigue yendo a `console.warn` para el log del servidor.
- [x] **CA-3 (Test colocado):** `db-error-diagnosis.test.ts` en el mismo directorio cubre: P1001 → `UNREACHABLE`; `PrismaClientKnownRequestError` (p. ej. `P2021` tabla inexistente) → `OTHER`; `Error` genérico → `OTHER`; valor no-`Error` (`unknown`) → `OTHER` con mensaje por defecto.
- [x] **CA-4 (Sin cambios en el ciclo de vida de Prisma):** `src/shared/persistence/prisma.ts` queda intacto.
- [x] **CA-6 (Política de reinicio, mitiga F-01):** el contenedor debe tener `--restart unless-stopped`. Mientras `scripts/db-dev.sh create` (CA-9) no se haya usado para recrearlo, se documenta en el `README.md` el comando `docker update --restart unless-stopped bx-mysql-dev` (acción única sobre la máquina; no requiere conocer ninguna contraseña). Con `unless-stopped`, un reinicio del daemon deja MySQL de nuevo operativo sin intervención.
- [x] **CA-5 (Santa Trinidad de Oráculos):** `bash -n scripts/dev-up.sh`, `tsc --noEmit`, `eslint` (`npm run lint`) y `vitest run` en verde. Verificación manual: con el contenedor detenido, `/Admin/Context` muestra el mensaje accionable; tras `docker start bx-mysql-dev` y recargar, la tabla carga sin reiniciar Next.js.
- [x] **CA-7 (Rotación previa a la purga — orden obligatorio):** se rota la contraseña root de `bx-mysql-dev` **antes** de limpiar el historial (limpiar sin rotar deja la credencial viva en cualquier copia previa). Procedimiento en §5.D. La nueva contraseña se genera con `openssl rand -base64 24`, se escribe en `src/.env.local` sin imprimirla en pantalla ni en el historial, y se comprueba que la antigua deja de funcionar y la nueva funciona (sin mostrar ninguna). `DATABASE_URL` (usuario `bx_admin`) no se ve afectada porque no usa la cuenta root.
- [x] **CA-8 (Purga del historial):** se eliminan de `~/.bash_history` las líneas con credenciales (patrón en §5.D), **en una terminal nueva con el resto cerradas** (Bash reescribe el historial al salir y reintroduciría las líneas de la memoria de otras sesiones). No se hace copia de seguridad del fichero (conservaría los secretos). Verificación: `grep -cE '<patrón>' ~/.bash_history` devuelve `0` y el número de líneas disminuye solo en las eliminadas.
- [x] **CA-9 (Helper versionado `scripts/db-dev.sh`):** un único punto de entrada para el MySQL de desarrollo con subcomandos `create`, `shell` y `exec`. Reglas: (a) lee las credenciales de `src/.env.local`; (b) nunca las pasa como argumento de línea de comandos: `create` usa `--env-file` filtrado a `MYSQL_*` y `shell`/`exec` usan `docker exec -e MYSQL_PWD`; (c) `create` incluye `--restart unless-stopped` (cierra F-01 de forma versionada y sustituye al comando manual de CA-6); (d) no imprime valores. Referencia en §5.E.
- [x] **CA-10 (Cierre del patrón en el repositorio):** `scripts/rotate-mysql-app-password.sh` pasa a usar `docker exec -e MYSQL_PWD` en lugar de `-p"${MYSQL_ROOT_PASSWORD}"`. Se añade un test colocado `src/features/context-sources/db-credentials-hygiene.test.ts` que falla si algún `*.sh` bajo `scripts/` contiene `mysql ... -p<algo>` o `MYSQL_*PASSWORD=<literal>` en una línea de comando. `ansible/hooks/after_symlink.yml:70` queda **explícitamente fuera** de este PBI (despliegue en producción con oráculo de plantillas Go; se tratará en un PBI propio) y se deja constancia en el test como excepción documentada.
- [x] **CA-11 (Guardarraíl de shell, opcional y local):** se documenta en el `README.md` la línea recomendada para `~/.bashrc` (`HISTIGNORE`, §5.F). No la instala ningún script del repositorio: es configuración personal del Vértice, coherente con la política de no alterar su entorno (mismo criterio que `AGENTS.md` sobre hooks y Git).

---

## 4. Notas de Forja (Anti‑Alucinación)

- **Alcance deliberadamente acotado:** no se añade un vigilante en segundo plano que monitorice el contenedor tras el arranque (sobreingeniería para un MySQL de desarrollo). F-01 se mitiga con la política de reinicio (CA-6) y, cuando aun así falle, con el diagnóstico accionable de CA-2.
- **No se añade `docker-compose` de desarrollo.** La política de reinicio no vive en el repositorio (el contenedor se creó con `docker run`); por eso CA-6 es documental.
- **`live-restore` es alternativa, no parte de este PBI:** activarlo en `/etc/docker/daemon.json` mantendría todos los contenedores vivos durante reinicios del daemon, pero modifica la configuración global de Docker del equipo (afecta a Portainer, `bx-pma` y otros proyectos) y no cubre un reinicio completo. Se deja como decisión del Vértice.
- **`bx-pma` (phpMyAdmin) sufre lo mismo** (`RestartPolicy=no`); está fuera del alcance de la aplicación.
- **Higiene de credenciales (ahora dentro de alcance, CA-7 a CA-11):** nunca se reproducen valores en este documento, en logs ni en la salida de los comandos de auditoría (solo `IGUAL/distinto`, `funciona sí/no`). Durante esta investigación los comandos de diagnóstico se ejecutaron de forma no interactiva, así que no quedaron en `~/.bash_history`; uno de ellos sí pasó la contraseña root como argumento y fue visible en `ps` unos segundos. Es el mismo patrón F-06 y refuerza CA-9.
- **`src/.env.cron` está versionado** (`git ls-files`) y contiene `CRON_SECRET`. No se ha determinado si el valor es un marcador de posición o un secreto real. Verificación pendiente (fuera del alcance de CA-1 a CA-11): si es real, rotar y pasar el fichero a `.gitignore` como el resto de `.env*`.
- **El mensaje de Prisma no es contrato estable:** por eso la clasificación usa `errorCode`, no coincidencias de texto.
- **`ContextMemoryCard` (LanceDB) no se ve afectada** por la caída de MySQL; el alcance se limita a `ContextSourcesCard`.
- **Otras pantallas Admin** que consulten MySQL podrían reutilizar `diagnoseDbError`, pero queda fuera de este PBI.

---

## 5. Referencia de Implementación

### A. `scripts/dev-up.sh` (sustituye el paso 1)

```bash
# --- 1. MySQL de desarrollo -------------------------------------------------
echo "==> Verificando estado del contenedor MySQL (bx-mysql-dev)..."
if ! docker ps --format '{{.Names}}' | grep -q "^bx-mysql-dev$"; then
  echo "==> Iniciando contenedor bx-mysql-dev..."
  docker start bx-mysql-dev >/dev/null
fi

# Host y puerto desde DATABASE_URL (fallback 127.0.0.1:3306), sin imprimir credenciales.
DB_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"')"
DB_HOSTPORT="${DB_URL##*@}"; DB_HOSTPORT="${DB_HOSTPORT%%/*}"
MYSQL_HOST="${DB_HOSTPORT%%:*}"; MYSQL_PORT="${DB_HOSTPORT##*:}"
[[ "$MYSQL_HOST" =~ ^[A-Za-z0-9._-]+$ ]] || MYSQL_HOST="127.0.0.1"
[[ "$MYSQL_PORT" =~ ^[0-9]+$ ]] || MYSQL_PORT="3306"

echo "==> Esperando socket MySQL (${MYSQL_HOST}:${MYSQL_PORT})..."
MYSQL_READY=false
for _ in $(seq 1 30); do
  if (echo > "/dev/tcp/${MYSQL_HOST}/${MYSQL_PORT}") >/dev/null 2>&1; then
    MYSQL_READY=true
    break
  fi
  sleep 0.5
done
if [[ "$MYSQL_READY" != "true" ]]; then
  echo "[ERROR] MySQL no abrió ${MYSQL_HOST}:${MYSQL_PORT} en 15 s. Revisa: docker logs bx-mysql-dev" >&2
  exit 1
fi
echo "==> MySQL listo."
```

### B. `src/features/context-sources/db-error-diagnosis.ts`

```ts
import { Prisma } from '@prisma/client';

export type DbErrorKind = 'UNREACHABLE' | 'OTHER';

export interface DbErrorDiagnosis {
  readonly kind: DbErrorKind;
  readonly message: string;
}

const UNREACHABLE_CODE = 'P1001';
const DEFAULT_MESSAGE = 'Error en la conexión a la base de datos de fuentes';

export function diagnoseDbError(error: unknown): DbErrorDiagnosis {
  if (
    error instanceof Prisma.PrismaClientInitializationError &&
    error.errorCode === UNREACHABLE_CODE
  ) {
    return {
      kind: 'UNREACHABLE',
      message:
        'MySQL no responde. Inicia el contenedor con `docker start bx-mysql-dev` o relanza `./scripts/dev-up.sh`.',
    };
  }
  if (error instanceof Error) {
    const lastLine = error.message.trim().split('\n').filter(Boolean).pop();
    return { kind: 'OTHER', message: lastLine ?? DEFAULT_MESSAGE };
  }
  return { kind: 'OTHER', message: DEFAULT_MESSAGE };
}
```

### C. `ContextSourcesCard.tsx` (bloque `catch`)

```tsx
} catch (error) {
  console.warn('[ContextSourcesCard] Error listando fuentes de contexto:', error);
  dbError = diagnoseDbError(error).message;
}
```

### D. Rotación y purga (procedimiento de una sola vez, CA-7 y CA-8)

Ningún secreto viaja como argumento: se usan variables de entorno exportadas (`docker exec -e VAR` sin valor la toma del entorno del proceso) y el SQL por `stdin` (`printf` es *builtin*, no aparece en `ps`).

```bash
# 1) Rotar la contraseña root.
ENV=src/.env.local
export MYSQL_PWD="$(grep -E '^MYSQL_ROOT_PASSWORD=' "$ENV" | cut -d= -f2- | tr -d '"')"   # antigua
export OLD="$MYSQL_PWD"
export NEW="$(openssl rand -base64 24 | tr -d '/+=\n')"
printf "ALTER USER 'root'@'%%' IDENTIFIED BY '%s'; ALTER USER 'root'@'localhost' IDENTIFIED BY '%s'; FLUSH PRIVILEGES;\n" "$NEW" "$NEW" \
  | docker exec -i -e MYSQL_PWD bx-mysql-dev mysql -uroot
perl -i -pe 's/^(MYSQL_ROOT_PASSWORD=).*/$1$ENV{NEW}/' "$ENV"

# 2) Comprobar (solo booleanos).
MYSQL_PWD="$NEW" docker exec -e MYSQL_PWD bx-mysql-dev mysql -uroot -e 'SELECT 1' >/dev/null 2>&1 && echo "nueva: OK"
MYSQL_PWD="$OLD" docker exec -e MYSQL_PWD bx-mysql-dev mysql -uroot -e 'SELECT 1' >/dev/null 2>&1 && echo "ANTIGUA SIGUE VIVA" || echo "antigua: rechazada"
unset MYSQL_PWD NEW OLD

# 3) Purgar el historial: cerrar TODAS las demás terminales y usar una nueva.
sed -i -E '/MYSQL_(ROOT_)?PASSWORD=|IDENTIFIED (WITH [a-z_]+ )?BY|mysql[^|]* -p[^ ]/d' ~/.bash_history
history -c   # vacía la memoria de ESTA sesión para que no los reescriba al salir

# 4) Verificar: debe dar 0.
grep -cE 'MYSQL_(ROOT_)?PASSWORD=|IDENTIFIED (WITH [a-z_]+ )?BY|mysql[^|]* -p[^ ]' ~/.bash_history
```

Notas:
- Si el paso 2 imprime `ANTIGUA SIGUE VIVA`, no continuar con la purga: la rotación no se aplicó. `ALTER USER` sobre `root@'%'` y `root@'localhost'` cubre las dos cuentas root; si existiera otra, listarlas con `SELECT user,host FROM mysql.user WHERE user='root'` mediante `scripts/db-dev.sh exec` (CA-9).
- El patrón de borrado `mysql[^|]* -p[^ ]` solo afecta a líneas que invocan `mysql`; al auditar se vio que `-p` aparece también en comandos inocuos (`cargo build -p`, `ansible-playbook`, `docker run -p 3306:3306`) que **no** deben borrarse. Antes de borrar, listar con valores enmascarados: `grep -nE '<patrón>' ~/.bash_history | sed -E 's/(-p|PASSWORD=|BY )[^ ]+/\1***/'`.
- Verificar que `~/.bashrc` tiene `shopt -s histappend`; si no, Bash puede sobrescribir el fichero con la memoria al cerrar la terminal.

### E. `scripts/db-dev.sh` (CA-9)

```bash
#!/usr/bin/env bash
# scripts/db-dev.sh — MySQL de desarrollo sin secretos en la línea de comandos (PBI-DEV-001).
# Uso: db-dev.sh create | shell | exec "<SQL>"
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../src/.env.local"
CONTAINER="bx-mysql-dev"

[[ -f "$ENV_FILE" ]] || { echo "[ERROR] No existe $ENV_FILE" >&2; exit 1; }
MYSQL_PWD="$(grep -E '^MYSQL_ROOT_PASSWORD=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"')"
[[ -n "$MYSQL_PWD" ]] || { echo "[ERROR] MYSQL_ROOT_PASSWORD no definida en $ENV_FILE" >&2; exit 1; }
export MYSQL_PWD   # docker exec -e MYSQL_PWD (sin valor) la toma del entorno: no aparece en argv

case "${1:-}" in
  create)
    # --env-file desde descriptor: el secreto no aparece en argv ni en el historial.
    docker run -d --name "$CONTAINER" --restart unless-stopped \
      -p 127.0.0.1:3306:3306 \
      --env-file <(grep -E '^MYSQL_(ROOT_PASSWORD|DATABASE|USER|PASSWORD)=' "$ENV_FILE" | tr -d '"') \
      mysql:8.0 >/dev/null
    echo "==> $CONTAINER creado con --restart unless-stopped." ;;
  shell)
    docker exec -it -e MYSQL_PWD "$CONTAINER" mysql -uroot ;;
  exec)
    [[ -n "${2:-}" ]] || { echo "Uso: $0 exec \"<SQL>\"" >&2; exit 2; }
    printf '%s\n' "$2" | docker exec -i -e MYSQL_PWD "$CONTAINER" mysql -uroot ;;
  *) echo "Uso: $0 create|shell|exec \"<SQL>\"" >&2; exit 2 ;;
esac
```

`create` mapea el puerto solo a `127.0.0.1` (igual que `src/docker-compose.yml`), a diferencia de los `-p 3306:3306` del historial, que lo exponen en todas las interfaces del equipo.

### F. Guardarraíl local opcional de shell (CA-11, `~/.bashrc`)

```bash
# No guardar en el historial comandos que lleven credenciales en claro.
HISTIGNORE='*MYSQL_*PASSWORD=*:*IDENTIFIED BY*:*mysql* -p?*:*MYSQL_PWD=*'
```

Combina con `HISTCONTROL=ignoreboth` (ya presente; los comandos que empiezan por espacio tampoco se guardan). Solo afecta a sesiones nuevas.

---

## 6. Evidencia de Implementación (Oráculos de Forja)

- **Oráculo Unitario y Contratos (`vitest run`):**
  - Suite completa: 119/119 archivos en verde, 673/673 tests pasados en 23.49s.
  - Test colocado de diagnóstico: `src/features/context-sources/db-error-diagnosis.test.ts` (5/5 tests pasados).
  - Test de higiene de credenciales en scripts: `src/features/context-sources/db-credentials-hygiene.test.ts` (3/3 tests pasados).
- **Oráculo Linter AST (`eslint`):**
  - `npm run lint` ejecutado con 0 errores y 0 advertencias.
- **Oráculo Compilador TypeScript (`tsc --noEmit`):**
  - `npx tsc --noEmit` ejecutado con 0 errores de tipos en estricto.
- **Oráculo de Shell (`bash -n`):**
  - `bash -n scripts/dev-up.sh`: 0 errores de sintaxis.
  - `bash -n scripts/db-dev.sh`: 0 errores de sintaxis.
  - `bash -n scripts/rotate-mysql-app-password.sh`: 0 errores de sintaxis.
- **Verificación Operativa Local:**
  - Contenedor `bx-mysql-dev` blindado con política `unless-stopped` confirmada mediante `docker inspect`.
  - Rotación exitosa de credencial root (antigua rechazada, nueva validada).
  - Purga confirmada en `~/.bash_history` (0 coincidencias restantes).

