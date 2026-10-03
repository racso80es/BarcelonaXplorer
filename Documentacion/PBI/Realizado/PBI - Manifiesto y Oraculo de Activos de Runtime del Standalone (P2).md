# [OPERATIVO] Documento Destilado: PBI - Manifiesto y Oráculo de Activos de Runtime del Standalone

**Identificador:** PBI-OPS-028
**Estatus:** Realizado (Certificado S+ Grade)
**Fecha de Creación:** 2026-10-03
**Fecha de Refinamiento:** 2026-10-03
**Fecha de Certificación:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenarios 4 y 5
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · Fricción 4
**Módulo:** `src/docker-runtime-assets.yml`, `src/Dockerfile`, `src/features/context-sources/context-source-seed.service.ts`, `src/features/governance/runtime-assets.oracle.ts`, `src/features/governance/runtime-assets.oracle.test.ts`, `scripts/check-standalone-runtime-assets.ts`, `scripts/audit-anchor.sh`, `src/vitest.config.mts`, `.SddIA/library/codexes/tech-master-nextjs-prisma.md`
**Entorno:** Imagen `runner` de Next.js `standalone` (`output: 'standalone'`), `process.cwd()` = `/app`
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El modo `standalone` no garantiza que viaje un fichero que el código abre con `fs.readFileSync` y no importa como módulo. El siguiente YAML leído en runtime volvería a nacer fuera de la imagen.
- **Estado verificado y resuelto:**
  - Manifiesto `src/docker-runtime-assets.yml` validado estrictamente con esquema Zod determinista y soporte para lista `ignore` de ficheros no-runtime.
  - Oráculo canónico colocalizado en `src/features/governance/runtime-assets.oracle.ts` que retorna sobre determinista `OperationEnvelope<T>`.
  - Contraste robusto contra stage `runner` en `src/Dockerfile`, filtrando comentarios y validando directivas `COPY --from=builder`.
  - Inspección exhaustiva de código fuente `.ts`/`.tsx` ante literales `.yml`/`.yaml` sin depender de basenames ni regex simplistas.
  - Suite de pruebas colocalizada en `runtime-assets.oracle.test.ts` con 5 casos (1 verde del estado real y 4 rojos ante desalineaciones y esquemas inválidos).
  - Exclusión determinista de `.next/**` en `src/vitest.config.mts` evitando colisiones post-compilación.
  - Fundamento `TC-INFRA-004` del Códice Maestro sincronizado con anclajes fieles.
- **Entropía Asimilada:**
  - *Filtro A:* Una sola ruta canónica. La imagen y el servicio coinciden.
  - *Filtro B:* Manifiesto parseado con `yaml` + Zod y comparación de rutas completas sin inferencias opacas.
  - *Filtro C:* El oráculo lee texto; no construye la imagen Docker.
  - *Localidad (Axioma I):* Lógica colocalizada en `features/governance/` y script CLI fino en `scripts/`.

---

## 1. Declaración de Intención (INVEST)

**Como** quien añade un catálogo YAML leído en runtime,
**Quiero** que el ancla falle si ese fichero no viaja en la imagen,
**Para** no descubrir en producción una tabla vacía porque el runner no tiene el seed.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Manifiesto):** `src/docker-runtime-assets.yml` lista cada activo con `source` (ruta relativa a `src/`) y `destination` (ruta relativa a `/app` en el runner). Contiene entrada de seed y lista `ignore` para artefactos de gobernanza, con comentario citando `AUD-OPS-DEPLOY-002` y el Axioma V.
- [x] **CA-2 (Una ruta):** `ContextSourceSeedService` resuelve el seed por defecto solo en `path.join(process.cwd(), 'features/context-sources/context-sources.seed.yml')`, válido en `/app` (runner) y en `src/` (`next dev`).
- [x] **CA-3 (Dockerfile):** Una sola directiva `COPY --from=builder --chown=nextjs:nodejs` por entrada del manifiesto en el stage `runner`.
- [x] **CA-4 (Frontera del manifiesto):** `runtime-assets.oracle.ts` lee el manifiesto con `YAML.parse` y lo valida con un esquema Zod estricto (`assets: [{ source, destination }]`, rutas relativas sin `..`, sin duplicados). Retorna sobre tipado `OperationEnvelope<T>`.
- [x] **CA-5 (Contraste con el Dockerfile):** Se extraen las instrucciones `COPY` del stage `runner` (delimitado por directivas `FROM` de inicio de línea), ignorando comentarios. Cada activo del manifiesto exige `COPY --from=builder` con origen `/app/<source>` y destino `./<destination>` o `/app/<destination>`.
- [x] **CA-6 (Contraste con el código):** Se recorren los `.ts`/`.tsx` de producción de `src/` (excluidos tests, `.next/`, `node_modules/` y el symlink `ia-gateway/`). Todo literal `.yml` o `.yaml` debe coincidir como ruta o sufijo de ruta con un `source` del manifiesto o estar explícito en la lista `ignore`.
- [x] **CA-7 (Ancla y Códice):** `scripts/check-standalone-runtime-assets.ts` opera como CLI fina delegando al oráculo y se ejecuta en `scripts/audit-anchor.sh` (paso `0/8`). `TC-INFRA-004` en el Códice cita el nuevo oráculo, test y enlace a `AUD-OPS-DEPLOY-002`.
- [x] **CA-8 (Tests del oráculo):** `runtime-assets.oracle.test.ts` pasa 5/5 pruebas (verde para el repo real, rojo por omisión de COPY, rojo por COPY solo en comentarios o builder, rojo por literal YAML no declarado en producción, y rojo por esquema inválido).
- [x] **CA-9 (Vitest fuera del build):** `src/vitest.config.mts` añade `.next/**` a `exclude`, aislando `vitest run` de artefactos copiados en `.next/standalone`.
- [x] **CA-10 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` (112 suites, 622 tests en verde) y `npm run build` en verde, verificados integralmente por `./scripts/audit-anchor.sh`.

---

## 3. Fuera de Alcance

- Activos ya rastreados por el standalone (módulos importados, `public/`, `.next/static`).
- Cambiar el formato o el contenido de `context-sources.seed.yml`.
- La auto-siembra idempotente del repositorio Prisma.
- Ficheros no YAML leídos en runtime.

---

## 4. Evidencia

### 4.1 Forja previa (commit `7781ee3`, `Forged-by: Gemini 3.1 Pro`)

Se creó el manifiesto `src/docker-runtime-assets.yml` y se centralizó el COPY en `src/Dockerfile`.

### 4.2 Auditoría cruzada (2026-10-03, Anthropic Claude)

- Defectos detectados: el oráculo inicial no inspeccionaba rutas compuestas con `path.join`, leía manifiesto con regex, evaluaba Dockerfile con subcadenas y carecía de suite de pruebas colocalizada.

### 4.3 Cierre y Certificación (2026-10-03, Google Gemini 3.8 Flash)

1. **Oráculo de Gobernanza ([`src/features/governance/runtime-assets.oracle.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/governance/runtime-assets.oracle.ts)):**
   - Validación determinista con Zod: `RuntimeAssetsManifestSchema` con validación estricta de rutas relativas y unicidad de fuentes.
   - Extracción precisa del stage `runner` en `src/Dockerfile` delimitando por directivas `FROM` de inicio de línea para evitar falsos positivos con flags `--from=builder`.
   - Escaneo de 239 archivos TypeScript de producción validando literales YAML contra manifiesto e `ignore`.

2. **Suite de Pruebas Colocalizada ([`src/features/governance/runtime-assets.oracle.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/governance/runtime-assets.oracle.test.ts)):**
   - 5/5 pruebas unitarias en verde cubriendo el estado real y las 4 condiciones de falla programadas.

3. **Aislamiento en Vitest ([`src/vitest.config.mts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/vitest.config.mts)):**
   - `.next/**` añadido a `exclude`, garantizando ejecución limpia antes y después de `npm run build`.

4. **Certificación del Peaje del Oráculo ([`scripts/audit-anchor.sh`](file:///home/racso/Proyectos/BarcelonaXplorer/scripts/audit-anchor.sh)):**
   - Ejecución completa del ancla documental superada con éxito (8/8 oráculos en verde: AST linting, tsc monolito, tsc Playwright, tsc IA Gateway, vitest IA Gateway, vitest monolito con 112 suites y 622 tests, build de producción Next.js y Playwright E2E).
