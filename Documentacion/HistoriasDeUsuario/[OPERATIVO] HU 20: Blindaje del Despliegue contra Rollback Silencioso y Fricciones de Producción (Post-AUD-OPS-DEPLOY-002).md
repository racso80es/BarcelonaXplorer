# [OPERATIVO] Historia de Usuario 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción (Post-AUD-OPS-DEPLOY-002)

**Identificador:** HU-OPS-DEPLOY-003
**Estatus:** Completada / Desplegable
**Fecha de Creación:** 2026-10-03
**Naturaleza:** Conversión de las lecciones de un incidente ya resuelto en mecanismos permanentes
**Auditoría Base Vinculada:** [`AUD-OPS-DEPLOY-002`](../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md)
**Historia Precedente:** [HU 18 — Motor de Contexto Autónomo](../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) (desplegada en la release `20261002184000Z`)
**Marco Normativo:** Protocolo de Acero — Grado S+ · [`CONSTITUTION.md`](../../CONSTITUTION.md) · [Axiomas de Forja S+](../../.SddIA/library/norms/) · [Códice `tech-master-nextjs-prisma`](../../.SddIA/library/codexes/tech-master-nextjs-prisma.md)
**Módulos Afectados:** `src/deploy.sh`, `ansible/hooks/after_symlink.yml`, `ansible/deploy.yml`, `src/Dockerfile`, `src/features/context-sources/`, `scripts/audit-anchor.sh`, `.SddIA/library/codexes/tech-master-nextjs-prisma.md`
**Prioridad:** Alta (P1)
**Estimación Global:** 10 Story Points (3+3+2+2)

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Cerrar la distancia entre «el incidente se corrigió a mano» y «el pipeline impide que se repita». El síntoma visible fue la ausencia de `/Admin/Context` en producción; la causa fue un rollback de Ansistrano que dejó activa una release anterior a la HU 18.
- **Entorno:** Nodo 11 (`10.0.10.11`), Ansistrano en `/home/racso/Despliegues/BarcelonaXplorer`, `src/deploy.sh`, imagen standalone de Next.js, `ia-gateway`.
- **Entropía Asimilada:** Las cuatro fricciones del 2026-10-02 quedaron corregidas en la release `20261002184000Z` (ver §2). Lo que permanece es estructural: la aduana de disco de `deploy.sh` aborta antes de que Ansible pueda purgar, el `rescue` no nombra la causa ni la release restaurada, y no existe un oráculo que impida repetir el conflicto Jinja2/Go ni la omisión de un fichero leído en runtime.

---

## 1. Descripción General (INVEST)

**Como** Operador Técnico de BarcelonaXplorer,
**Quiero** que un despliegue fallido deje dicho qué sonda falló y qué release quedó activa, que el propio lanzador libere disco antes de rendirse, y que el ancla de oráculos rechace un playbook con plantillas Go sin escapar o una imagen que olvida un fichero leído en runtime,
**Para** que una release nueva no vuelva a desaparecer de producción sin dejar rastro, y para no repetir la purga manual de 49.9 GB ni la caza del seed YAML.

---

## 2. Lo ya absorbido por el incidente (fuera de esta HU)

Estas correcciones están en `main` y no se reabren:

| Fricción | Commit / artefacto | Estado en código (2026-10-03) |
|---|---|---|
| Comillas literales de `--env-file` contra Zod | `b7c9066` | `parseAnchorString` y `parseModelList` recortan comillas; hay test en `fallback.test.ts` |
| Jinja2 interpreta `{{.State.Health.Status}}` | `0a9057f` | `after_symlink.yml:192` envuelto en `{% raw %}` |
| Disco al 98% por BuildKit | `PBI-OPS-CLEAN-BUILDCACHE-001` + purga manual de 49.9 GB | `ansible/deploy.yml` poda en `pre_tasks` y `post_tasks` |
| Seed YAML ausente del runner | `5cc2851`, `fe986d0` | `Dockerfile` copia `context-sources.seed.yml`; el repositorio siembra si MySQL está vacío |

---

## 3. Justificación Arquitectónica

1. **Axioma I — Localidad:** la purga de contingencia tiene que ocurrir en el primer guardián que mira el disco (`deploy.sh`), porque hoy ese guardián impide llegar al playbook que sí sabe purgar.
2. **Axioma II — Frontera determinista:** el mensaje de aborto nombra la sonda que falló, la release restaurada y su etiqueta `.bx_release_tag`. Un fallo del gateway no se informa como fallo de telemetría.
3. **Axioma III — Declarativo:** la lista de activos de runtime del standalone es un manifiesto; el Dockerfile y el código que hace `readFileSync` se contrastan contra él.
4. **Axioma IV — Oráculo:** dos comprobaciones baratas entran en `scripts/audit-anchor.sh` antes del linter: plantillas Go sin `{% raw %}` en `ansible/`, y activos de runtime no copiados al runner.
5. **Axioma V — Encapsulación:** el resultado del despliegue queda en un fichero de `shared/`, fuera de la rotación de releases, para que el operador lo lea sin abrir el log de Ansible.

---

## 4. Criterios de Aceptación (Verificación Empírica)

### Escenario 1 — La aduana de disco purga antes de abortar
- **Dado** el Nodo 11 con menos del 10% libre en `/` y caché de BuildKit recuperable.
- **Cuando** se ejecuta `./src/deploy.sh`.
- **Entonces** el script lanza en el nodo `docker builder prune -a -f`, vuelve a medir y solo aborta si tras la purga sigue por debajo del 10%.
- **Y** con el disco ya holgado no ejecuta la purga agresiva (`-a`).

### Escenario 2 — El rollback se oye
- **Dado** un oráculo de salud que falla (gateway en `Restarting`, o telemetría distinta de 200/202, o `/api/ai/health` distinto de 200).
- **Cuando** el bloque `rescue` restaura la release anterior.
- **Entonces** el `fail` nombra la tarea que falló, el estado de salud del contenedor si llegó a registrarse, la ruta de la release restaurada y su `BX_RELEASE_TAG`.
- **Y** queda escrito `shared/last-deploy-outcome.yml` con `outcome: rolled_back`. `deploy.sh` imprime ese fichero al terminar, en éxito y en fallo.

### Escenario 3 — Oráculo Jinja2 / Go
- **Dado** una tarea Ansible nueva con `docker inspect --format '{{.State.Status}}'` fuera de `{% raw %}`.
- **Cuando** se ejecuta `scripts/audit-anchor.sh`.
- **Entonces** el paso previo al linter falla e indica fichero y línea.
- **Y** el `after_symlink.yml` actual, con el `{% raw %}` ya puesto, pasa.

### Escenario 4 — Oráculo de activos de runtime
- **Dado** un `readFileSync` nuevo hacia un `.yml` bajo `src/features/` que no está en el manifiesto de activos del runner.
- **Cuando** se ejecuta el oráculo.
- **Entonces** falla, y nombra el literal y la ausencia de `COPY` en `src/Dockerfile`.
- **Y** `context-sources.seed.yml` se resuelve por una sola ruta canónica dentro de la imagen.

### Escenario 5 — Códice
- **Cuando** se lee `tech-master-nextjs-prisma.md`.
- **Entonces** existen tres fundamentos: de-quoting de `--env-file` antes de Zod, `{% raw %}` obligatorio para plantillas Go en Ansible, y manifiesto de activos de runtime del standalone. Cada uno cita `AUD-OPS-DEPLOY-002`.

---

## 5. Desglose en PBIs

| Prioridad | Identificador | Título | Escenarios | SP |
| :---: | :--- | :--- | :---: | :---: |
| **P1** | `PBI-OPS-025` | [Aduana de disco que purga BuildKit antes de abortar](../PBI/Pendiente/PBI%20-%20Aduana%20de%20Disco%20que%20Purga%20BuildKit%20antes%20de%20Abortar%20%28P1%29.md) | 1 | 3 |
| **P1** | `PBI-OPS-026` | [Rollback audible: causa, release restaurada y acta en shared](../PBI/Pendiente/PBI%20-%20Rollback%20Audible%20Causa%20Release%20Restaurada%20y%20Acta%20en%20Shared%20%28P1%29.md) | 2 | 3 |
| **P2** | `PBI-OPS-027` | [Oráculo de plantillas Go escapadas en Ansible](../PBI/Pendiente/PBI%20-%20Oraculo%20de%20Plantillas%20Go%20Escapadas%20en%20Ansible%20%28P2%29.md) | 3, 5 | 2 |
| **P2** | `PBI-OPS-028` | [Manifiesto y oráculo de activos de runtime del standalone](../PBI/Pendiente/PBI%20-%20Manifiesto%20y%20Oraculo%20de%20Activos%20de%20Runtime%20del%20Standalone%20%28P2%29.md) | 4, 5 | 2 |

`PBI-OPS-025` y `PBI-OPS-026` pueden forjarse en paralelo. `PBI-OPS-027` y `PBI-OPS-028` también. El orden de cierre en `audit-anchor.sh` es indiferente: cada uno añade su paso.

---

## 6. Fuera de Alcance

- Reescribir la sanitización de comillas: ya está en `parseAnchorString` y `parseModelList`, con test. El fundamento del Códice (Escenario 5, parte de `PBI-OPS-027`) la fija para el siguiente parser.
- Cambiar el umbral del 10% de `deploy.sh` o los 3 GB / 2 GB de `ansible/deploy.yml`.
- Sustituir Ansistrano o eliminar el rollback automático. El rollback se conserva; se vuelve observable.
- Tocar la lógica de negocio de la HU 18 (ingesta, Admin Context, fuentes).

---

## 7. Definición de Hecho

- [x] PBI-OPS-025 a PBI-OPS-028 en verde con `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` cuando toquen TypeScript, y `ansible-playbook --syntax-check` cuando toquen YAML.
- [x] Escenarios 1 a 5 verificados y anotados en la sección de evidencia de cada PBI.
- [x] `scripts/audit-anchor.sh` ejecuta los dos oráculos nuevos antes del linter.
- [x] Un despliegue real al Nodo 11 deja `shared/last-deploy-outcome.yml` con `outcome: succeeded` y la release `current`.
