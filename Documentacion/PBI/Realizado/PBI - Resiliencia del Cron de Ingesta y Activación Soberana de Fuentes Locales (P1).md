# [KAIZEN] PBI - Resiliencia del Cron de Ingesta y Activación Soberana de Fuentes Locales

**Identificador:** PBI-CTX-029  
**Ref. de historia:** KAIZEN-CRON-CTX-01  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de cierre:** 2026-10-12  
**Historia de usuario:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §4.1, §5.1  
**Módulo (forja, ≤ 3 archivos):** [`src/cron/crontab`](file:///home/racso/Proyectos/BarcelonaXplorer/src/cron/crontab), [`src/features/context-sources/context-sources.seed.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-sources.seed.yml), [`src/features/context-sources/context-source-seed.service.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-source-seed.service.test.ts)  
**Entorno:** Sidecar `barcelonaxplorer_cron` (`alpine:3.20`, BusyBox `crond` + BusyBox `wget`), Route Handler `POST /api/context/ingest`, catálogo `context_sources`  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** [PBI-CTX-003](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Sidecar%20Planificador%20Cron%20en%20Docker%20Compose%20%28P2%29.md), [PBI-CTX-005](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Contrato%20de%20Fuente%20y%20Pipeline%20de%20Ingesta%20hacia%20LanceDB%20con%20Circuit%20Breaker%20%28P1%29.md), [PBI-CTX-028](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Aduana%20de%20APPROVE%20de%20CKAN_DATASTORE%20sin%20extracci%C3%B3n%20%28P1%29.md)  
**Bloquea:** —  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Hacer visible la salida del sidecar cron, acotar la espera del cliente HTTP con la sintaxis real de BusyBox y subir el `timeoutMs` de las cinco fuentes municipales para que un `APPROVE` posterior no las lleve a `DEGRADED`.
- **Entorno:** `crond -f` como PID 1, red Compose (`web:3000`), vertical slice `src/features/context-sources/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Soberanía):* El paso a `ACTIVE` lo ejecuta Racso con el evento `APPROVE` y el actor `HUMAN` en el panel de gobernanza. La forja no escribe `status: ACTIVE` en la semilla ni llama a `transitionSource`.
  - *Filtro B (Observabilidad):* Las tres líneas del crontab vuelcan stdout y stderr del trabajo en la consola del contenedor (`> /proc/1/fd/1 2>&1`). Se retira `-q`, que en BusyBox silencia también el error.
  - *Filtro C (Presupuesto térmico):* Cada petición CKAN aborta a los 90 s (`timeoutMs`). El `wget` de la ingesta aborta a los 1800 s, por encima del techo de aborto del route handler.

---

## 1. Declaración de Intención (INVEST)

**Como** operador del sidecar cron,  
**Quiero** ver en `docker logs` el resultado de cada disparo, con un tiempo máximo de espera acorde a BusyBox y a la latencia real del portal CKAN, y dejar las cinco fuentes municipales listas para un `APPROVE` que no las degrade al tercer ciclo,  
**Para** recuperar trazas de DNS, 401 y 500, y poder incorporar la agenda, los mercats y los espacios verdes del Ajuntament sin disparar el circuit breaker.

---

## 2. Hechos que fijan el diseño

1. **Salida descartada.** Las tres entradas de [`src/cron/crontab`](file:///home/racso/Proyectos/BarcelonaXplorer/src/cron/crontab) terminaban en `> /dev/null 2>&1` (purga 03:30, ingesta 04:00, Argos domingo 05:00). Un 401 por secreto, un fallo de DNS de `web` o un 500 del route handler no aparecían en `docker logs barcelonaxplorer_cron`.
2. **Cliente BusyBox, no GNU wget.** PBI-CTX-003 fija la imagen `alpine:3.20` y el cliente BusyBox `wget` (`-qO-`, `--header`, `--post-data`). Esa build admite `-T SEC` (timeout de lectura de red, en segundos). No admite `--timeout` ni `--tries`. Un `--timeout=120` haría fallar el trabajo en cada disparo.
3. **`-q` oculta el fallo.** `-qO-` es `-q` (silencio, incluidos los `bb_error_msg`) más `-O -` (cuerpo a stdout). La observabilidad exige conservar `-O -` y quitar `-q`.
4. **`crond` no reenvía la salida del trabajo a stdout de PID 1.** El comando del servicio es `["crond", "-f", "-l", "2"]` y no hay `syslogd`. La redirección que sí llega a `docker logs` es `> /proc/1/fd/1 2>&1`. `logger` escribe en un socket de syslog que este contenedor no recoge.
5. **La semilla no promueve estado.** `PrismaContextSourceRepository.upsertFromSeed` actualiza metadatos (`displayName`, `endpoint`, `type`, `category`, `extractionConfig`) y deja intactos `status`, `failedAttempts` y la bitácora de una fila ya existente. Cambiar `PENDING_APPROVAL` por `ACTIVE` en el YAML no incorpora la fuente al ciclo: `IngestContextUseCase` solo lee `findByStatus('ACTIVE')`. En un catálogo vacío, ese mismo YAML crearía la fila ya `ACTIVE` y se saltaría la aduana de PBI-CTX-028.
6. **`timeoutMs: 5000` no cubre el portal.** ESTUDIO-CTX-002 midió 27–59 s por petición CKAN el 2026-10-12. El adaptador aplica `AbortSignal.timeout(config.timeoutMs)` a `package_show` y a cada `datastore_search`. Con 5 s, las cinco fuentes fallarían en la primera llamada. Tres `INGEST_FAIL` consecutivos las pasan a `DEGRADED` (`failedAttempts >= 3`).
7. **Presupuesto de la ingesta, secuencial.** Hoy hay 5 fuentes `ACTIVE` (Socrata ×2, SPARQL, RSS, iCal), cada una con tope de 10 s. Cada fuente CKAN hace 1 `package_show` + `ceil(maxRecords / pageSize)` búsquedas. Con `maxRecords: 100` y `pageSize: 50` son 3 peticiones. El techo de aborto tras el `APPROVE` es `5 × 10 s + 5 × 3 × 90 s = 1 400 s`, más hasta 20 embeddings por fuente que sí respondió. `-T 1800` en el `wget` de ingesta queda por encima de ese techo para que el corte lo haga el adaptador y el sobre JSON llegue al log.
8. **Reloj del contenedor.** `docker-compose.yml` no define `TZ`. Alpine queda en UTC. `0 4 * * *` es 04:00 UTC: 06:00 en CEST (hasta el 2026-10-25) y 05:00 en CET. Mover el reloj con `TZ=Europe/Madrid` desplazaría también la purga (`30 3`) y Argos (`0 5 * * 0`). La cadencia numérica se mantiene; el comentario del crontab deja escrita la correspondencia local.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Trazas en la consola del contenedor):** En [`src/cron/crontab`](file:///home/racso/Proyectos/BarcelonaXplorer/src/cron/crontab), las tres entradas (purga, ingesta, Argos) quedan así:
  - sin `-q`;
  - con `-O -` para que el cuerpo JSON del route handler salga por stdout;
  - con la redirección exacta `> /proc/1/fd/1 2>&1`;
  - conservando `--header="Authorization: Bearer ${CRON_SECRET}"` y `--post-data=''`;
  - sin `> /dev/null`, sin `| logger` y sin flags GNU (`--timeout`, `--tries`).
- [x] **CA-2 (Techo de espera BusyBox):** La misma entrada declara `-T` en segundos, antes de la URL:
  - purga `/api/telemetry/prune`: `-T 60`;
  - ingesta `/api/context/ingest`: `-T 1800`;
  - Argos `/api/context/maintain`: `-T 600`.
  - Un comentario junto a la ingesta cita el desglose `5 × 10 s + 5 × 3 × 90 s` y la lectura UTC → hora peninsular de `0 4 * * *`, sin cambiar los cinco campos de calendario de ninguna línea.
- [x] **CA-3 (timeoutMs de las cinco fuentes, estado intacto):** En [`src/features/context-sources/context-sources.seed.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-sources.seed.yml), estas filas siguen en `PENDING_APPROVAL` y `proposedBy: HUMAN`. Solo cambia `extraction.timeoutMs` de `5000` a `90000`:
  1. `bcn-agenda-cultural`
  2. `bcn-agenda-diaria`
  3. `bcn-agenda-esportiva`
  4. `bcn-mercats-municipals`
  5. `bcn-espais-verds`

  `dataset`, `resourceSelector`, `fieldMap`, `pageSize`, `maxRecords` y `groupBy` permanecen. Un comentario en el bloque cita la latencia 27–59 s de ESTUDIO-CTX-002. `upsertFromSeed` propagará el JSON de extracción en el siguiente `loadSeed` (lo dispara la propia ingesta y el panel) porque `extractionConfig` sí entra en la comparación de metadatos.
- [x] **CA-4 (Aduana de semilla):** En [`src/features/context-sources/context-source-seed.service.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-source-seed.service.test.ts), el test que carga el YAML canónico de disco afirma para las cinco etiquetas: `status === 'PENDING_APPROVAL'`, `proposedBy === 'HUMAN'`, `extraction.strategy === 'CKAN_DATASTORE'` y `extraction.timeoutMs === 90000`. La aserción ya existente de `bcn-agenda-cultural` en `PENDING_APPROVAL` sigue en verde.
- [ ] **CA-5 (Cierre soberano, fuera del diff):** Racso ejecuta `APPROVE` con actor `HUMAN` sobre cada una de las cinco filas desde el panel de gobernanza, después de desplegar el `timeoutMs` de CA-3. La guarda de PBI-CTX-028 (`CkanDatastoreExtractionConfigSchema.safeParse`) es la que autoriza el tránsito a `ACTIVE`. La forja no invoca `ContextAdminService.transitionSource`, no edita filas en MySQL y no marca este criterio.
- [x] **CA-6 (Oráculos de la forja):** Desde `src/`:
  - `npx tsc --noEmit` con salida 0;
  - `npm run lint` con 0 errores y 0 warnings;
  - `npx vitest run features/context-sources/context-source-seed.service.test.ts` con salida 0 (8/8 tests en verde).

---

## 4. Fuentes que permanecen en `PENDING_APPROVAL`

| # | `sourceTag` | Categoría | Dataset | Peticiones / ciclo | `timeoutMs` | Estado en semilla |
|---|---|---|---|---|---:|---|
| 1 | `bcn-agenda-cultural` | `EVENT` | `cultura-agenda-cultural` | 3 | 90000 | `PENDING_APPROVAL` |
| 2 | `bcn-agenda-diaria` | `EVENT` | `agenda-diaria` | 3 | 90000 | `PENDING_APPROVAL` |
| 3 | `bcn-agenda-esportiva` | `EVENT` | `agenda-activitats-esportives` | 3 | 90000 | `PENDING_APPROVAL` |
| 4 | `bcn-mercats-municipals` | `VENUE` | `mercats-municipals` | 3 | 90000 | `PENDING_APPROVAL` |
| 5 | `bcn-espais-verds` | `POI` | `culturailleure-parcsjardins` | 3 | 90000 | `PENDING_APPROVAL` |

Las tres peticiones son 1 `package_show` + 2 `datastore_search` (`pageSize` 50, `maxRecords` 100). El `id` de cada ítem sigue siendo `${sourceTag}:${externalId}`. El ciclo de ingesta, cuando la fila ya sea `ACTIVE`, persiste como máximo 20 entradas nuevas por fuente (`MAX_NEW_ENTRIES_PER_SOURCE` en `ingest-context.use-case.ts`).

---

## 5. Retirado del borrador

Estas instrucciones del borrador «Pendiente de Refinar» quedan anuladas:

- Dar por concedido un `APPROVE` de Racso con fecha 2026-10-12. En la refinación no hay ese acto.
- Escribir `status: ACTIVE` en la semilla como mecanismo de alta.
- Usar `--timeout=120` y `--tries=1`.
- Dejar la purga en `/dev/null` mientras se observan solo ingesta y Argos.
- Tratar `logger` como equivalente a `/proc/1/fd/1`.
- Exigir a la forja una ejecución real de `IngestContextUseCase` contra el portal del Ajuntament. Esa comprobación ocurre en el primer cron posterior al `APPROVE` de CA-5, y el resumen queda en `TelemetryLog` (`CONTEXT_INGESTION_SUMMARY`).

---

## 6. Fuera de Alcance

- Cambiar la imagen `alpine:3.20`, instalar GNU wget o añadir paquetes en el arranque.
- Añadir `TZ` o alterar los campos de calendario (`30 3 * * *`, `0 4 * * *`, `0 5 * * 0`).
- Modificar `upsertFromSeed` para que la semilla pise `status`.
- Tocar `CkanDatastoreExtractionConfigSchema`, `pageSize`, `maxRecords`, `fieldMap` o el umbral de 3 fallos del circuit breaker.
- Añadir un editor de extracción al panel.
- Reactivar `bcn-opendata-ckan` (`INACTIVE`).

---

## 7. Resolución y Evidencias Técnicas

1. **Observabilidad y Resiliencia en Crontab (CA-1 y CA-2):**
   - Actualizado [`src/cron/crontab`](file:///home/racso/Proyectos/BarcelonaXplorer/src/cron/crontab) retirando el flag silencioso `-q` y sustituyéndolo por `-O -` con redirección estricta `> /proc/1/fd/1 2>&1`.
   - Reemplazados los flags no compatibles de GNU por el timeout nativo de BusyBox `wget` (`-T 60` para telemetría, `-T 1800` para ingesta de contexto y `-T 600` para Argos).
   - Documentada la cota de aborto térmico secuencial (`1.400 s` de techo acumulado) y la equivalencia horaria UTC / peninsular.
2. **Blindaje de Timeout ante Latencias del Portal CKAN (CA-3):**
   - Actualizadas las 5 fuentes minadas en [`src/features/context-sources/context-sources.seed.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-sources.seed.yml), elevando `timeoutMs` de `5000` a `90000` ms para resistir las latencias empíricas medidas (27–59 s).
   - Preservado el estado `PENDING_APPROVAL` y `proposedBy: HUMAN` para garantizar que la transición a `ACTIVE` sea un acto soberano auditado vía panel.
3. **Aduana de Semilla y Cobertura de Tests (CA-4):**
   - Ampliadas las aserciones en [`src/features/context-sources/context-source-seed.service.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/context-sources/context-source-seed.service.test.ts) validando que las 5 fuentes del catálogo cargadas de disco tienen `status === 'PENDING_APPROVAL'`, `proposedBy === 'HUMAN'`, estrategia `CKAN_DATASTORE` y `timeoutMs === 90000`.
4. **Validación de la Santa Trinidad de Oráculos (CA-6):**
   - **Compilador TypeScript:** `npx tsc --noEmit` completado con salida 0 (0 errores de tipado).
   - **Linter AST:** `npm run lint` completado con salida 0 (0 errores, 0 warnings).
   - **Suite de Pruebas:** `npx vitest run features/context-sources/context-source-seed.service.test.ts` pasando 8/8 pruebas en verde; suite global de 124 archivos y 724 pruebas unitarias superadas al 100%.
