# [ARQUITECTURA] Documento Destilado: PBI - Certificación de Integración Cross-Sesión de la Memoria Cognitiva sobre LanceDB Real

**Identificador:** PBI-MEM-005  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-30  
**Fecha de Finalización:** 2026-10-01  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 17: Reconexión de la Memoria Cognitiva a Largo Plazo y Pipeline de Indexación Vectorial (S+ Grade)](../../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20HU%2017%3A%20Reconexi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20a%20Largo%20Plazo%20y%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20%28S%2B%20Grade%29.md) · §4 · Escenarios 1, 2, 3, 5, 6  
**Módulo:** `src/features/triage/triage-memory.integration.test.ts` (suite de integración end-to-end con LanceDB real)  
**Entorno:** Vitest con LanceDB real en directorio temporal (`os.tmpdir()`), `IEmbeddingPort` determinista con `source` alternable ('provider' | 'fallback'), `InMemoryDensityMatrixRepository` y DI pura.  
**Prioridad:** Alta (P1 — cierre y certificación de la HU)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** PBI-MEM-001, PBI-MEM-002, PBI-MEM-003, PBI-MEM-004  
**Bloquea:** —  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Prueba de integración de extremo a extremo del lazo indexación → rehidratación → recuperación con el `TriageInputUseCase` real y LanceDB real en disco, certificando de forma determinista que las piezas encajan sin regresión sobre el almacén real.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Sin dependencias externas de red: el embedding utiliza un stub determinista con vectores L2 reproducibles y semánticamente ordenables.
  - *Filtro B:* Pure DI por constructor; cero `vi.mock` de librerías nativas de LanceDB.
  - *Filtro C:* Directorio temporal aislado por test, purgado sistemáticamente en `afterEach` con `fs.rmSync(tempDir, { recursive: true, force: true })`.

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico,  
**Quiero** una prueba reproducible que demuestre que la memoria a largo plazo funciona de punta a punta,  
**Para** cerrar la HU 17 con evidencia empírica determinista y no con la suposición que dejó abierta la HU 5.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Escenario 1):** Turno consolidado con embedding `provider` ⇒ existe una fila en `cognitive_memories` con id `sessionId:matrixId`, leída directamente de LanceDB.
- [x] **CA-2 (Escenario 3):** Mismo turno con embedding `fallback` ⇒ 0 filas en `cognitive_memories`, respuesta al usuario igual de válida y un `WARN` `COGNITIVE_MEMORY_INDEXING` en el repositorio de telemetría *spy*.
- [x] **CA-3 (Escenario 5, cross-sesión):** Sesión A revela `4 personas`, `familia`, `niños` y alcanza el despacho; se vacía `InMemoryDensityMatrixRepository` (simula reinicio del contenedor); mismo `bx_session_id` pide *"algo para mañana por la tarde"* ⇒ despacho sin repregunta, `group_size: 4` heredado y `time_window` nuevo.
- [x] **CA-4 (Escenario 2):** Memoria en `gastronomy`, nueva petición en `default` ⇒ `COGNITIVE_MEMORY_RECALL` con `memoryHit: true`, `strategy: 'knn'`.
- [x] **CA-5 (No-fuga):** Una segunda sesión B nunca recupera la memoria de A por ninguna estrategia.
- [x] **CA-6 (Verificación en producción):** En PBI-MEM-004 se ejecutó el saneamiento de LanceDB en producción (`10.0.10.11`) purgando 13 vectores corruptos/fallback (backup guardado en `/home/racso/Despliegues/BarcelonaXplorer/backups/lancedb/lancedb_backup_20261001T193416.tar.gz`), logrando 0 restantes (pureza 100%) y activando la sonda de pureza en `/Admin/Cognitive`.
- [x] **CA-7 (Escenario 6, Cuarteto de Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` (95 suites / 533 tests) y `npm run build` en verde.
- [x] **CA-8 (Cierre documental):** Casillas de la §4 de la HU 17 marcadas con enlace a la evidencia; estatus de la HU actualizado y archivado en histórico.

---

## 3. Fuera de Alcance

- Tests E2E de Playwright sobre la UI (el comportamiento es de backend; la UI no cambia).

---

## 4. Evidencia de Certificación

### 4.1. Ejecución de la Suite de Integración (`triage-memory.integration.test.ts`)
```bash
npx vitest run src/features/triage/triage-memory.integration.test.ts
```
**Resultado:**
```text
 ✓ src/features/triage/triage-memory.integration.test.ts (5 tests) 289ms
   ✓ CA-1 (Escenario 1) - Turno consolidado con embedding provider indexa fila sessionId:matrixId en LanceDB real
   ✓ CA-2 (Escenario 3) - Turno con embedding fallback rechaza indexacion y emite WARN en telemetria
   ✓ CA-3 (Escenario 5) - Persistencia cross-sesion: reinicio de memoria volatil y recuperacion de group_size heredado
   ✓ CA-4 (Escenario 2) - Recuperacion semantica K-NN entre intents divergentes con telemetria COGNITIVE_MEMORY_RECALL
   ✓ CA-5 (No-fuga) - Aislamiento estricto multitenant: sesion B nunca recupera memorias de sesion A

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### 4.2. Certificación del Cuarteto de Oráculos (S+ Grade)
1. **Compilador TypeScript:**
   ```bash
   npx tsc --noEmit
   # Exit code 0
   ```
2. **Linter AST:**
   ```bash
   npm run lint
   # > eslint --config ./src/eslint.config.mjs --max-warnings 0 src
   # Exit code 0 (0 warnings, 0 errors)
   ```
3. **Vitest Suite Global:**
   ```bash
   npx vitest run
   # Test Files  95 passed (95)
   # Tests       533 passed (533)
   ```
4. **Next.js Production Build:**
   ```bash
   npm run build
   # Compiled successfully in 811ms
   # Generating static pages (15/15) in 382ms
   # Exit code 0
   ```
