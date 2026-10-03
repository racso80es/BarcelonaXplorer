# [OPERATIVO] Documento Destilado: PBI - Manifiesto y Oráculo de Activos de Runtime del Standalone

**Identificador:** PBI-OPS-028
**Estatus:** Realizado
**Fecha de Creación:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenarios 4 y 5
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · Fricción 4
**Módulo:** `src/docker-runtime-assets.yml` (nuevo), `src/Dockerfile`, `src/features/context-sources/context-source-seed.service.ts`, `scripts/check-standalone-runtime-assets.ts` (nuevo), `scripts/audit-anchor.sh`, `.SddIA/library/codexes/tech-master-nextjs-prisma.md`
**Entorno:** Imagen `runner` de Next.js `standalone` (`output: 'standalone'`), `process.cwd()` = `/app`
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El modo `standalone` no empaqueta un fichero que el código abre con `fs.readFileSync` y no importa como módulo. `context-sources.seed.yml` ya se copia (commit `5cc2851`), pero el `Dockerfile` lo duplica en `./features/...` y `./src/features/...`, y `ContextSourceSeedService` prueba las dos rutas. El siguiente YAML leído en runtime volvería a nacer fuera de la imagen.
- **Entropía Asimilada:**
  - *Filtro A:* Una sola ruta canónica. La imagen y el servicio coinciden.
  - *Filtro B:* El manifiesto es YAML comentado según el estándar del repositorio; el oráculo lo parsea y compara, sin inferir globs.
  - *Filtro C:* El oráculo lee texto; no construye la imagen Docker.

---

## 1. Declaración de Intención (INVEST)

**Como** quien añade un catálogo YAML leído en runtime,
**Quiero** que el ancla falle si ese fichero no viaja en la imagen,
**Para** no descubrir en producción una tabla vacía porque el runner no tiene el seed.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Manifiesto):** `src/docker-runtime-assets.yml` lista cada activo con `source` (ruta en el contexto de build, relativa a `src/`) y `destination` (ruta relativa a `/app` en el runner). Hoy contiene una sola entrada: `features/context-sources/context-sources.seed.yml` → `features/context-sources/context-sources.seed.yml`. Comentarios de gobernanza citando `AUD-OPS-DEPLOY-002` y el Axioma V.
- [ ] **CA-2 (Una ruta):** `ContextSourceSeedService` resuelve el seed por defecto solo en `path.join(process.cwd(), 'features/context-sources/context-sources.seed.yml')`. Se elimina la sonda a `src/features/...`. Esa ruta relativa vale en los dos cwd reales: `/app` en el runner (el `COPY` de CA-3) y `src/` cuando `next dev` arranca desde el `package.json` del monolito.
- [ ] **CA-3 (Dockerfile):** Una sola directiva `COPY --from=builder` por entrada del manifiesto, con `--chown=nextjs:nodejs`. Desaparece el `COPY` duplicado a `./src/features/...`.
- [ ] **CA-4 (Oráculo de copia):** `scripts/check-standalone-runtime-assets.ts` falla si alguna `destination` del manifiesto no aparece como destino de un `COPY` en `src/Dockerfile`, o si algún literal `readFileSync` / `fs.readFileSync` de `src/**/*.ts` apunta a un `.yml` o `.yaml` cuyo basename no está en el manifiesto. Mensaje con fichero y línea.
- [ ] **CA-5 (Ancla y Códice):** El script se ejecuta en `scripts/audit-anchor.sh` junto al oráculo de `PBI-OPS-027`, antes del linter. Nuevo fundamento `TC-INFRA-004`: todo fichero leído por filesystem en el monolito y no importado como módulo se declara en `docker-runtime-assets.yml` y se copia al stage `runner`. Cita la Fricción 4.
- [ ] **CA-6 (Tests):** Test colocalizado del servicio de seed con el fichero real (el existente en `context-source-seed.service.test.ts` se actualiza a la ruta única) y test del oráculo con un manifiesto fixture que omite un `COPY`.
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` en verde.

---

## 3. Fuera de Alcance

- Activos ya rastreados por el standalone (módulos importados, `public/`, `.next/static`).
- Cambiar el formato o el contenido de `context-sources.seed.yml`.
- La auto-siembra idempotente del repositorio Prisma (commit `fe986d0`): se queda como está.

---

## 4. Evidencia

Se creó el manifiesto `src/docker-runtime-assets.yml` y se centralizó el COPY en `src/Dockerfile`.
Se implementó `scripts/check-standalone-runtime-assets.ts` el cual verifica directivas COPY en el Dockerfile contra el manifiesto y lecturas de ficheros YAML con `readFileSync`. Se añadió la regla `TC-INFRA-004` al Códice Tecnológico, y el test automatizado en `context-source-seed.service.test.ts` utiliza la ruta predeterminada validada exitosamente mediante Vitest. Se verificó con un fixture que el oráculo de revisión falla en caso de ausencia de copia. El oráculo se integró como parte de `scripts/audit-anchor.sh`.
