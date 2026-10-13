# [KAIZEN] PBI - Ignición del Sidecar Cron y Alarma de Inanición de Ingesta

**Identificador:** PBI-CTX-030  
**Ref. de historia:** KAIZEN-CRON-CTX-02  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-13  
**Fecha de cierre:** 2026-10-13  
**Historia de usuario:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §5.1  
**Auditoría:** [AUD-OPS-CRON-001](../../Auditorias/Auditoria%20-%20Inanicion%20de%20la%20Ingesta%20de%20Contexto%20en%20Produccion%20por%20Sidecar%20Cron%20Inerte.md)  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 5 Story Points  
**Depende de:** [PBI-CTX-003](../Realizado/PBI%20-%20Sidecar%20Planificador%20Cron%20en%20Docker%20Compose%20%28P2%29.md), [PBI-CTX-029](../Realizado/PBI%20-%20Resiliencia%20del%20Cron%20de%20Ingesta%20y%20Activaci%C3%B3n%20Soberana%20de%20Fuentes%20Locales%20%28P1%29.md)  
**Bloquea:** el primer ciclo real de las cinco fuentes CKAN `ACTIVE` y la purga de las filas caducadas de `context_memory`  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Hacer que BusyBox `crond` cargue el crontab que Ansistrano deja con UID 1000, fallar el despliegue si el fichero efectivo no es de root, y mostrar en `/Admin/Context` que el ciclo lleva más de 26 h parado.
- **Entorno:** Servicio `cron` de `src/docker-compose.yml` (`alpine:3.20`), hook `ansible/hooks/after_symlink.yml`, vertical `src/features/context-sources/` y las dos tarjetas de `src/app/Admin/Context/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Soberanía):* La forja no llama a `POST /api/context/ingest` en producción, no ejecuta `DEACTIVATE` sobre `bcn-opendata-ckan` y no dispara la ingesta al arrancar el contenedor.
  - *Filtro B (Fail-Closed visible):* El descarte por UID de `load_crontab` no escribe log. Ver `crond started` no demuestra que el crontab se cargó. El despliegue aborta si `stat -c %u` no es `0`.
  - *Filtro C (Localidad):* Tres cortes. Cada uno cabe en el vertical que ya posee el comportamiento. El crontab versionado (`src/cron/crontab`) no cambia de calendario ni de cliente HTTP.

---

## 1. Declaración de Intención (INVEST)

**Como** operador del Nodo 11,  
**Quiero** que el sidecar ejecute la poda, la ingesta y Argos con el crontab de Git, y que el panel avise cuando ese ciclo lleve más de un día sin un éxito,  
**Para** que las fuentes ya `ACTIVE` dejen de quedarse en «Sin historial» y la memoria vectorial vuelva a purgar lo caducado.

---

## 2. Hechos que fijan el diseño

1. **El montaje `:ro` conserva el UID del release.** `src/docker-compose.yml` monta `./cron/crontab` sobre `/etc/crontabs/root`. Ansistrano despliega como UID 1000. BusyBox 1.36.1 (`load_crontab`) incorpora el fichero solo si `st_uid == 0`. Si no, cierra el parser y no emite mensaje. El modo `0644` no entra en la condición.
2. **`-l` no es `-d` ni `-L`.** El comando actual es `["crond", "-f", "-l", "2"]`. `-l` cambia el umbral y el destino sigue siendo syslog. El contenedor no tiene `syslogd`. `-L /dev/stdout` saca el arranque y los trabajos a `docker logs`. No saca el descarte por UID, porque ese camino no llama a `crondlog`.
3. **El nombre del fichero tiene que ser un usuario.** `getpwnam(fileName)` ignora cualquier nombre que no exista en `/etc/passwd`. El destino instalado sigue llamándose `root`.
4. **`CRON_SECRET` ya llega al hijo.** PBI-CTX-003 CA-4 lo midió. `set_env_vars` fija `LOGNAME`, `USER`, `HOME`, `SHELL` y `PATH` sin `clearenv()`. Este PBI no reabre esa prueba.
5. **La purga de caducados ya está en el caso de uso.** El paso 7 de `IngestContextUseCase.execute` llama a `delete { expiredBefore }`. Un ciclo que termine limpia las 21 filas vencidas. No se añade otro borrador.
6. **El RAG ya filtra `expiresAt`.** `LanceDbContextRetrievalAdapter.search` descarta caducados (`notExpired` por defecto). El panel es el que llama «vigentes» a una página de `query().limit(100)` y rotula `Total` con `entries.length`.
7. **La frescura del ciclo está en el catálogo.** `INGEST_OK` escribe `lastSuccessAt`. `APPROVE` no. El máximo `lastSuccessAt` de las filas `ACTIVE` es null o del 2026-10-02. Un aviso a las 26 h usa ese máximo y no abre una consulta nueva a `TelemetryLog`. El resumen `CONTEXT_INGESTION_SUMMARY` sigue siendo la corroboración del ciclo, escrita por el caso de uso que ya existe.
8. **`bcn-opendata-ckan` sigue `ACTIVE` en PRO con la semilla en `INACTIVE`.** PBI-CTX-012 dejó el apagado en un `DEACTIVATE` humano. Si el cron arranca antes de esa decisión, el ciclo volverá a extraer fichas de catálogo.

---

## 3. Cortes de forja

### Corte A — El crontab que `crond` sí carga

Archivos: [`src/docker-compose.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/src/docker-compose.yml), [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml), [`src/cron/cron-sidecar.contract.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/cron/cron-sidecar.contract.test.ts).

- El volumen pasa de `./cron/crontab:/etc/crontabs/root:ro` a `./cron/crontab:/etc/crontabs.src/root:ro`.
- El `command` del servicio `cron` queda en un solo `sh -c` que instala y sustituye al proceso:

```yaml
command:
  - sh
  - -c
  - install -o root -g root -m 0600 /etc/crontabs.src/root /etc/crontabs/root && exec crond -f -l 2 -L /dev/stdout
```

- Antes de dejar ese `install`, la forja comprueba el applet en `alpine:3.20` (`docker run --rm alpine:3.20 install -d /tmp/bx-install-probe && echo ok`). Si el applet no está, el mismo `sh -c` usa `cp`, `chown root:root` y `chmod 0600`, en ese orden, y el test de contrato afirma esa variante. No se añade paquete.
- El `sh -c` no contiene la URL de ingesta, de poda ni de Argos. El arranque no lanza un ciclo.
- Imagen `alpine:3.20`, `env_file: .env.cron`, `restart: unless-stopped`, sin `ports`. Los tres trabajos de `src/cron/crontab` se quedan como están, incluida la redirección `> /proc/1/fd/1 2>&1`.
- En `after_symlink.yml`, justo después de la convergencia `docker compose up -d`, una tarea con reintentos ejecuta:

```bash
uid="$(docker exec barcelonaxplorer_cron stat -c %u /etc/crontabs/root)"
test "$uid" = "0"
```

  `changed_when: false`. Si el contenedor aún no acepta `exec`, reintenta. Si el UID no es 0, el playbook falla y el release no se da por sano.

### Corte B — Alarma de inanición en la tarjeta de fuentes

Archivos: `src/features/context-sources/ingestion-freshness.ts`, `src/features/context-sources/ingestion-freshness.test.ts`, [`src/app/Admin/Context/ContextSourcesCard.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/Context/ContextSourcesCard.tsx).

Función pura, sin reloj oculto. El llamador pasa `now`.

```ts
export const INGESTION_STALE_AFTER_MS = 26 * 60 * 60 * 1000;

export interface IngestionFreshness {
  readonly stale: boolean;
  readonly newestSuccessAt: Date | null;
  readonly activeCount: number;
  readonly activeWithoutSuccess: number;
}
```

Entrada: lectura de `status` y `lastSuccessAt` (`Date | null`). Solo cuentan las filas `ACTIVE`.

| Entrada | `stale` |
| :--- | :---: |
| Ninguna `ACTIVE` | falso |
| Alguna `ACTIVE` y todas con `lastSuccessAt` null | verdadero |
| El máximo `lastSuccessAt` es anterior a `now - 26 h` | verdadero |
| El máximo `lastSuccessAt` cae dentro de las 26 h | falso |

`activeWithoutSuccess` cuenta las `ACTIVE` cuyo `lastSuccessAt` es null. La tarjeta, debajo del título, muestra un aviso cuando `stale` es verdadero: el ciclo no tiene un éxito en las últimas 26 h, con la fecha del máximo si existe y el número de activas sin bitácora. Cuando `stale` es falso, ese aviso no se pinta. No se añade telemetría nueva ni se consulta `TelemetryLog` desde el panel.

### Corte C — Total real y marca de caducidad

Archivos: [`src/features/context-sources/context-admin.service.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-admin.service.ts), su test colocalizado, [`ContextMemoryCard.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/Context/ContextMemoryCard.tsx) y [`ContextMemoryTableClient.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/Context/ContextMemoryTableClient.tsx).

El test vive junto al servicio. La tarjeta y la tabla ya son la misma vista partida en servidor y cliente; la marca de caducidad tiene que verse en la celda, y el total en la cabecera. Son cuatro rutas porque el puerto de lectura y las dos piezas de UI no están en el mismo archivo. No se abre un segundo PBI para no dejar el total corregido con filas caducadas sin marca.

- `listMemoryEntries` sigue devolviendo como máximo 100 filas y añade `totalRows: number`.
- `totalRows` sale de `countRows()` de la tabla `context_memory` en `@lancedb/lancedb` 0.37. Si la tabla no existe, `totalRows` es 0 y `entries` es `[]`, con `isAvailable: true`, como ahora.
- La cabecera muestra `Total: {totalRows}`. El subtítulo deja de decir que la página son «registros vigentes». Un contador aparte dice cuántas filas de la página tienen `expiresAt` anterior a `now`.
- La celda de expiración de una fila con `expiresAt < now` se distingue (texto «Caducada» y estilo de alerta). La fila sigue en la tabla: ocultarla haría mentir al total de la página.
- No se pagina el corpus entero en la petición para contar caducadas fuera de las 100. El total real cubre el censo; la marca cubre lo que el operador está viendo.

---

## 4. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Montaje y arranque):** `src/docker-compose.yml` monta el crontab en `/etc/crontabs.src/root:ro` y el `command` instala ese fichero como UID 0 y modo `0600` antes de `exec crond -f -l 2 -L /dev/stdout`. No queda ningún volumen hacia `/etc/crontabs/root`. El `sh -c` no llama a `wget` ni nombra `/api/context/ingest`.
- [x] **CA-2 (Oráculo de despliegue):** `ansible/hooks/after_symlink.yml` ejecuta `stat -c %u /etc/crontabs/root` dentro de `barcelonaxplorer_cron` después del `up` y falla el playbook si la salida no es `0`.
- [x] **CA-3 (Contrato estático):** `src/cron/cron-sidecar.contract.test.ts` parsea con `yaml` el compose y el hook, y afirma CA-1 y CA-2 sobre el texto versionado. También afirma que `src/cron/crontab` conserva las tres URLs (`/api/telemetry/prune`, `/api/context/ingest`, `/api/context/maintain`), los campos `30 3 * * *`, `0 4 * * *` y `0 5 * * 0`, y la redirección `/proc/1/fd/1`.
- [x] **CA-4 (Frescura):** `ingestion-freshness.test.ts` cubre las cuatro filas de la matriz del corte B, con un `now` fijo. `ContextSourcesCard` pinta el aviso solo cuando `assessIngestionFreshness` devuelve `stale: true`.
- [x] **CA-5 (Memoria):** `listMemoryEntries` expone `totalRows` desde `countRows()`. La cabecera usa ese número. La tabla marca cada fila de la página con `expiresAt` ya vencido. El test del servicio cubre tabla ausente (`totalRows === 0`) y tabla presente (el mock de `countRows` se refleja en el resultado).
- [x] **CA-6 (Oráculos de la forja):** Desde `src/`:
  - `npx tsc --noEmit` con salida 0;
  - `npm run lint` con 0 errores y 0 warnings;
  - `npx vitest run cron/cron-sidecar.contract.test.ts features/context-sources/ingestion-freshness.test.ts features/context-sources/context-admin.service.test.ts` con salida 0 (18/18 tests en verde).
- [ ] **CA-7 (Cierre en el Nodo 11, fuera del diff):** Tras el despliegue, `docker exec barcelonaxplorer_cron stat -c %u /etc/crontabs/root` imprime `0` y `docker logs barcelonaxplorer_cron` contiene `crond started`. La forja no marca este criterio.
- [ ] **CA-8 (Recuperación del corpus, acto soberano):** Racso lanza un ciclo (`POST /api/context/ingest` con `CRON_SECRET`, o deja el nodo encendido a las 04:00 UTC). Al terminar, las fuentes `ACTIVE` que sigan en el ciclo tienen `lastSuccessAt` posterior al despliegue, hay un `CONTEXT_INGESTION_SUMMARY` nuevo y las filas con `expiresAt` ya vencido han pasado por el `delete` del caso de uso. La forja no invoca el endpoint ni edita LanceDB.
- [ ] **CA-9 (Catálogo genérico, acto soberano):** Racso decide si `bcn-opendata-ckan` sigue `ACTIVE` o pasa a `INACTIVE` con `DEACTIVATE` en el panel. Si la apaga, la purga de sus fichas es la de `purge-ckan-corpus.ts` en modo apply. La forja no llama a `transitionSource` ni cambia el `status` de la semilla.

---

## 5. Fuera de Alcance

- Cambiar la imagen `alpine:3.20`, instalar GNU cron, `anacron` o `syslogd`, o añadir paquetes en el arranque.
- Lanzar la ingesta, la poda o Argos desde el `command` del contenedor. Un arranque por despliegue repetiría un ciclo de hasta 1800 s en horario diurno.
- Mover los campos de calendario del crontab o añadir `TZ`.
- Subir `MAX_NEW_ENTRIES_PER_SOURCE`. El tope de 20 vuelve a acumular cuando haya un ciclo al día.
- Hacer que `upsertFromSeed` pise `status`.
- Consultar `TelemetryLog` desde `/Admin/Context` para la alarma. La señal es `lastSuccessAt`.
- Reescribir el filtro de caducidad del RAG ni ampliar el margen `limit * 3`.
- Decidir el régimen nocturno del Nodo 11. Si el equipo duerme a las 03:30–04:00 UTC de forma habitual, la recuperación de disparos perdidos será otro PBI, después de que el Vértice lo confirme.

---

## 6. Orden de ejecución

1. Corte A, con el applet `install` comprobado en `alpine:3.20` antes de fijar el `sh -c`.
2. Corte B y corte C, en cualquier orden entre sí. No dependen del sidecar para quedar en verde en Vitest.
3. Despliegue. CA-7 lo cierra el hook; si el hook falla, no hay CA-8.
4. CA-8 y CA-9, en ese orden si la decisión de CA-9 es apagar `bcn-opendata-ckan` antes de que el ciclo la vuelva a extraer. Si la decisión es mantenerla `ACTIVE`, CA-8 puede ir primero.

---

## 7. Resolución y Evidencias Técnicas

1. **Corte A — Ignición de Crontab y Oráculo de Despliegue (CA-1, CA-2 y CA-3):**
   - Comprobada empíricamente la disponibilidad del applet nativo `install` en `alpine:3.20`.
   - Actualizado [`src/docker-compose.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/src/docker-compose.yml) trasladando el montaje del volumen a la ruta de staging `./cron/crontab:/etc/crontabs.src/root:ro` y redefiniendo `command` con `install -o root -g root -m 0600 /etc/crontabs.src/root /etc/crontabs/root && exec crond -f -l 2 -L /dev/stdout`.
   - Modificado [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) incorporando la tarea oráculo con sondeo y reintentos que ejecuta `uid="$(docker exec barcelonaxplorer_cron stat -c %u /etc/crontabs/root)"` y aserción estricta `test "$uid" = "0"`.
   - Creado test de contrato estático [`src/cron/cron-sidecar.contract.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/cron/cron-sidecar.contract.test.ts) validando que los tres archivos canónicos versionados cumplen el contrato de infraestructura.
2. **Corte B — Alarma de Inanición en Gobernanza de Fuentes (CA-4):**
   - Forjada la función pura y tipada [`src/features/context-sources/ingestion-freshness.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/ingestion-freshness.ts) (`assessIngestionFreshness`, `INGESTION_STALE_AFTER_MS = 26 * 60 * 60 * 1000`).
   - Creada suite unitaria [`src/features/context-sources/ingestion-freshness.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/ingestion-freshness.test.ts) cubriendo las 4 casuísticas de la matriz con fecha `now` determinista (4/4 en verde).
   - Integrada la alerta visual de inanición en [`src/app/Admin/Context/ContextSourcesCard.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/Context/ContextSourcesCard.tsx) cuando `freshness.stale === true`.
3. **Corte C — Conteo Real y Distinción de Entradas Caducadas (CA-5):**
   - Enriquecido [`src/features/context-sources/context-admin.service.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-admin.service.ts) para computar y exponer `totalRows` directamente desde `table.countRows()`.
   - Actualizado [`src/features/context-sources/context-admin.service.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-admin.service.test.ts) certificando que `totalRows` refleja el recuento de filas o 0 ante error/ausencia (11/11 en verde).
   - Actualizado [`src/app/Admin/Context/ContextMemoryCard.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/Context/ContextMemoryCard.tsx) ajustando el subtítulo sin la palabra «vigentes», mostrando el `Total: {totalRows}` real y añadiendo el contador de caducadas en página.
   - Actualizado [`src/app/Admin/Context/ContextMemoryTableClient.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/Context/ContextMemoryTableClient.tsx) para distinguir en la columna `expiresAt` las filas con `expiresAt < now` mediante la etiqueta «Caducada» con estilo de advertencia.
4. **Validación de la Santa Trinidad de Oráculos (CA-6):**
   - **Compilador TypeScript:** `npx tsc --noEmit` completado con salida 0 (0 errores).
   - **Linter AST:** `npm run lint` completado con salida 0 (0 errores, 0 warnings).
   - **Suite de Pruebas Unitarias del PBI:** `npx vitest run cron/cron-sidecar.contract.test.ts features/context-sources/ingestion-freshness.test.ts features/context-sources/context-admin.service.test.ts` con 3/3 archivos y 18/18 pruebas superadas al 100%.
   - **Suite Global de Regresión:** 126 archivos y 731 pruebas unitarias superadas al 100% sin regresiones.

