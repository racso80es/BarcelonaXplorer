# [OPERATIVO] Documento Destilado: PBI - Manifiesto y Oráculo de Activos de Runtime del Standalone

**Identificador:** PBI-OPS-028
**Estatus:** Reabierto / Refinado — Listo para Implementación (auditoría cruzada 2026-10-03)
**Fecha de Creación:** 2026-10-03
**Fecha de Refinamiento:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenarios 4 y 5
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · Fricción 4
**Módulo:** `src/docker-runtime-assets.yml`, `src/Dockerfile`, `src/features/context-sources/context-source-seed.service.ts`, `src/features/governance/runtime-assets.oracle.ts` (nuevo), `src/features/governance/runtime-assets.oracle.test.ts` (nuevo), `scripts/check-standalone-runtime-assets.ts`, `scripts/audit-anchor.sh`, `src/vitest.config.mts`, `.SddIA/library/codexes/tech-master-nextjs-prisma.md`
**Entorno:** Imagen `runner` de Next.js `standalone` (`output: 'standalone'`), `process.cwd()` = `/app`
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points (forjados: 1 · restantes: 2 — el oráculo se rehace)
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El modo `standalone` no garantiza que viaje un fichero que el código abre con `fs.readFileSync` y no importa como módulo. El siguiente YAML leído en runtime volvería a nacer fuera de la imagen.
- **Estado verificado (auditoría cruzada 2026-10-03, commit `7781ee3`):**
  - **Hecho:** manifiesto `src/docker-runtime-assets.yml` con la entrada del seed; `Dockerfile` con un solo `COPY`; `ContextSourceSeedService` con una sola ruta; test del servicio actualizado y en verde.
  - **Defecto 1 — el oráculo no ve el caso real.** Solo examina líneas que contienen a la vez `readFileSync` y un literal `.yml`. El propio seed service construye la ruta con `path.join(process.cwd(), '…seed.yml')` en otra línea, así que el oráculo nunca lo inspecciona. Un seed nuevo escrito igual pasaría sin declararse.
  - **Defecto 2 — frontera no determinista.** El manifiesto se lee con una regex sobre `destination:`; no hay parseo YAML ni esquema Zod (Axioma II, Estándar YAML: parseo seguro obligatorio). Una entrada sin comillas se ignora en silencio.
  - **Defecto 3 — comprobación del `Dockerfile` por subcadena.** `dockerfileContent.includes(dest)` da verde si la ruta aparece en un comentario o en otro stage.
  - **Defecto 4 — compara por basename.** Dos seeds con el mismo nombre en features distintas se confunden.
  - **Defecto 5 — sin test del oráculo** (CA-6 original incumplido).
  - **Observación:** tras un `npm run build` local, `vitest run` descubre tests copiados en `src/.next/standalone/` y falla `library-codex.contract.test.ts` por ruta relativa. Rompe CA-7 en cualquier máquina que haya construido.
- **Entropía Asimilada:**
  - *Filtro A:* Una sola ruta canónica. La imagen y el servicio coinciden.
  - *Filtro B:* El manifiesto es YAML comentado según el estándar del repositorio; el oráculo lo parsea con `yaml` + Zod y compara rutas completas, sin inferir globs.
  - *Filtro C:* El oráculo lee texto; no construye la imagen Docker.
  - *Localidad (Axioma I):* la lógica vive en `src/features/governance/` junto a su test (que es donde `vitest` lo encuentra) y `scripts/check-standalone-runtime-assets.ts` queda como CLI fina que la invoca y traduce el `OperationEnvelope` a código de salida.

---

## 1. Declaración de Intención (INVEST)

**Como** quien añade un catálogo YAML leído en runtime,
**Quiero** que el ancla falle si ese fichero no viaja en la imagen,
**Para** no descubrir en producción una tabla vacía porque el runner no tiene el seed.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Manifiesto):** `src/docker-runtime-assets.yml` lista cada activo con `source` (ruta relativa a `src/`) y `destination` (ruta relativa a `/app` en el runner). Contiene una sola entrada: `features/context-sources/context-sources.seed.yml` → `features/context-sources/context-sources.seed.yml`, con comentario de gobernanza citando `AUD-OPS-DEPLOY-002` y el Axioma V. *(Verificado.)*
- [x] **CA-2 (Una ruta):** `ContextSourceSeedService` resuelve el seed por defecto solo en `path.join(process.cwd(), 'features/context-sources/context-sources.seed.yml')`, válido en `/app` (runner) y en `src/` (`next dev`). *(Verificado; `context-source-seed.service.test.ts` 4/4.)*
- [x] **CA-3 (Dockerfile):** Una sola directiva `COPY --from=builder --chown=nextjs:nodejs` por entrada del manifiesto. Desapareció el `COPY` duplicado a `./src/features/...`. *(Verificado.)*
- [ ] **CA-4 (Frontera del manifiesto — nuevo):** `runtime-assets.oracle.ts` lee el manifiesto con `YAML.parse` y lo valida con un esquema Zod estricto (`assets: [{ source, destination }]`, rutas relativas sin `..`, sin duplicados). Un manifiesto inválido devuelve un `OperationEnvelope` con `success: false` y el error de Zod; el CLI sale ≠ 0.
- [ ] **CA-5 (Contraste con el Dockerfile, refinado):** Se extraen las instrucciones `COPY` del stage `runner` (desde `FROM … AS runner` hasta el siguiente `FROM` o el final), ignorando comentarios. Cada entrada del manifiesto exige un `COPY --from=builder` cuyo origen sea `/app/<source>` y cuyo destino sea `./<destination>` o `/app/<destination>`. Mensaje con la entrada que falta.
- [ ] **CA-6 (Contraste con el código, refinado):** Se recorren los `.ts`/`.tsx` de producción de `src/` (excluidos `*.test.ts(x)`, `.next/`, `node_modules/` y el enlace `ia-gateway/`). Todo literal de cadena que termine en `.yml` o `.yaml` debe coincidir, como ruta completa o como sufijo de ruta completa, con un `source` del manifiesto. Así entra el seed actual aunque `readFileSync` y el literal estén en líneas distintas. Mensaje con fichero, línea y literal. Un literal que no sea una ruta de fichero leída en runtime se resuelve añadiéndolo al manifiesto o con una lista `ignore` explícita en el propio YAML; no con excepciones en el código.
- [ ] **CA-7 (Ancla y Códice):** `scripts/check-standalone-runtime-assets.ts` (CLI fina, sin lógica propia) se ejecuta en `scripts/audit-anchor.sh` junto al oráculo de `PBI-OPS-027`, antes del linter (ya integrado). `TC-INFRA-004` ya existe; se actualiza su **Cumplimiento** para nombrar `runtime-assets.oracle.ts` y su **Anclaje** con el enlace a `AUD-OPS-DEPLOY-002`.
- [ ] **CA-8 (Tests del oráculo):** `runtime-assets.oracle.test.ts` cubre, con manifiesto, `Dockerfile` y fuentes en memoria o en un directorio temporal:
  - verde con el estado real del repositorio;
  - rojo si el manifiesto omite una entrada cuyo `COPY` falta;
  - rojo si el `COPY` solo aparece en un comentario o en el stage `builder`;
  - rojo si un fichero de producción contiene `path.join(cwd, 'features/x/nuevo.seed.yml')` sin declarar;
  - rojo con un manifiesto que no cumple el esquema.
- [ ] **CA-9 (Vitest fuera del build — nuevo):** `src/vitest.config.mts` añade `.next/**` a `exclude`, de modo que `vitest run` da el mismo resultado antes y después de `npm run build`.
- [ ] **CA-10 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` en verde, en ese orden y sobre el mismo árbol.

---

## 3. Fuera de Alcance

- Activos ya rastreados por el standalone (módulos importados, `public/`, `.next/static`).
- Cambiar el formato o el contenido de `context-sources.seed.yml`.
- La auto-siembra idempotente del repositorio Prisma (commit `fe986d0`): se queda como está.
- Ficheros no YAML leídos en runtime (JSON, Markdown). Si aparecen, se amplía la extensión en CA-6 en otro PBI.

---

## 4. Evidencia

### 4.1 Forja previa (commit `7781ee3`, `Forged-by: Gemini 3.1 Pro`)

Se creó el manifiesto `src/docker-runtime-assets.yml` y se centralizó el COPY en `src/Dockerfile`.
Se implementó `scripts/check-standalone-runtime-assets.ts` el cual verifica directivas COPY en el Dockerfile contra el manifiesto y lecturas de ficheros YAML con `readFileSync`. Se añadió la regla `TC-INFRA-004` al Códice Tecnológico, y el test automatizado en `context-source-seed.service.test.ts` utiliza la ruta predeterminada validada exitosamente mediante Vitest. Se verificó con un fixture que el oráculo de revisión falla en caso de ausencia de copia. El oráculo se integró como parte de `scripts/audit-anchor.sh`.

### 4.2 Auditoría cruzada (2026-10-03, Anthropic Claude)

- `npx tsx ../scripts/check-standalone-runtime-assets.ts` desde `src/`: `[OK]`, salida 0, pero por el Defecto 1 no llega a inspeccionar `context-source-seed.service.ts`.
- `vitest run features/context-sources/context-source-seed.service.test.ts`: 4/4 en verde.
- `vitest run features/governance` con `src/.next/standalone/` presente: 1 suite fallida (copia en `.next`), origen de CA-9.
- La sesión previa solo ejecutó el test del seed; no consta `tsc`, `eslint` ni `npm run build`.

### 4.3 Cierre

*(Pendiente.)*
