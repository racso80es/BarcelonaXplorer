# [OPERATIVO] Documento Destilado: PBI - Saneamiento Operativo del Corpus Vectorial en Producción y Sonda de Pureza

**Identificador:** PBI-MEM-004  
**Estatus:** Completado (S+ Grade)  
**Fecha de Creación:** 2026-09-30  
**Fecha de Certificación:** 2026-10-01  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 17: Reconexión de la Memoria Cognitiva a Largo Plazo y Pipeline de Indexación Vectorial (S+ Grade)](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2017%3A%20Reconexi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20a%20Largo%20Plazo%20y%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20%28S%2B%20Grade%29.md) · §3.5 · Escenario 4  
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/) F-02 · absorbe el criterio pendiente **CA-6** de [PBI-STEEL-002](../Realizado/PBI%20-%20Restauraci%C3%B3n%20del%20Motor%20de%20Embeddings%20y%20Purga%20de%20Vectores%20de%20Fallback%20en%20LanceDB%20%28P1%29.md)  
**Módulo:** `src/features/cognitive-memory/` (`purge-fallback-vectors.ts`, `audit-lancedb-health.use-case.ts`), `scripts/purge-lancedb-fallback-vectors.cjs`, `ansible/maintenance/purge-lancedb-fallback.yml`, `src/app/Admin/Cognitive/`  
**Entorno:** Nodo 11 (producción), volumen `{{ ansistrano_deploy_to }}/lancedb_data` (UID 1001)  
**Prioridad:** Media (P2)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** —  
**Bloquea:** PBI-MEM-005 (certificación del Escenario 4)  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Ejecutar en producción la purga ya implementada y dejar una sonda permanente que certifique "cero vectores `fallback`".
- **Estado real (2026-09-30):** `purgeFallbackVectors` (detección por recálculo del vector determinista, *dry-run* por defecto, idempotente y con test) y su CLI existen desde PBI-STEEL-002. Su CA-6 (backup, *dry-run* y *apply* en Nodo 11) **nunca se ejecutó**: los vectores falsos seguían en el corpus. Además, no había ninguna sonda que permitiera verificar el conteo cero sin ejecutar el script a mano.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Línea base del índice limpia antes de certificar la HU.
  - *Filtro B (Axioma III):* El procedimiento operativo es un playbook YAML canónico, no una secuencia de comandos manuales.
  - *Filtro C:* La sonda reutiliza el escaneo paginado existente (`PAGE_SIZE = 500`) en modo *dry-run*.

---

## 1. Declaración de Intención (INVEST)

**Como** operador de BarcelonaXplorer,  
**Quiero** purgar de forma segura los vectores falsos históricos y poder comprobar en cualquier momento que no quedan,  
**Para** que la búsqueda K-NN de todos los usuarios deje de devolver vecinos basura.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Ejecutabilidad en el artefacto):** Verificación completada: el artefacto standalone no incluye `scripts/` ni `tsx` en el runner final. Decisión arquitectónica: empaquetar `scripts/purge-lancedb-fallback-vectors.cjs` en formato CommonJS autónomo y ejecutarlo vía contenedor efímero Docker (`barcelonaxplorer-web:${BX_RELEASE_TAG}`) con el volumen `lancedb_data` montado, reutilizando las dependencias nativas de Node 20 y `@lancedb/lancedb` sin alterar la superficie de ataque del runner.
- [x] **CA-2 (Playbook canónico):** `ansible/maintenance/purge-lancedb-fallback.yml` forjado bajo `Estandar-Formato-Configuracion.yml`. Incluye: backup determinista con tar en contenedor Alpine para evitar problemas de permisos POSIX (UID 1001) → *dry-run* preliminar → pausa táctica de confirmación → parada de `barcelonaxplorer_web` para liberar locks de base de datos → ejecución `--apply` en contenedor efímero → arranque automático del contenedor web → *dry-run* de verificación final. Flag de seguridad obligatorio: `--apply` solo se activa con `-e purge_apply=true`.
- [x] **CA-3 (Ejecución en Nodo 11):** Playbook ejecutado exitosamente en producción contra Nodo 11 (`10.0.10.11`). Métricas registradas en §4.
- [x] **CA-4 (Sonda de pureza, Escenario 4):** `AuditLanceDbHealthUseCase` incorpora `fallbackVectorCount` en su resultado, conmuta a estado `warn` y emite `WARN` en telemetría de contexto `SYSTEM` si se detecta cualquier vector fallback. Test colocados en `audit-lancedb-health.test.ts` con tabla limpia (0 fallbacks) y contaminada (1 fallback).
- [x] **CA-5 (Visibilidad):** El conteo de pureza se proyecta en `/Admin/Cognitive` en la tarjeta sensorial `Salud LanceDB (Vector)`, exponiendo el conteo de tablas, latencia y cantidad de vectores fallback detectados.
- [x] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` (94 archivos, 528 tests) y `npm run build` en verde; `ansible-playbook --syntax-check` superado exitosamente.

---

## 3. Fuera de Alcance

- Marcar el origen del vector en los metadatos de cada fila: con PBI-MEM-001 no se escriben vectores `fallback`, así que la detección por recálculo es suficiente para el histórico.
- Purga de la tabla `context_memory` de HU-18 (nace ya fail-closed en PBI-CTX-005).

---

## 4. Evidencia de Ejecución (Nodo 11 - Producción)

- **Fecha de Ejecución:** 2026-10-01 19:34:33 CEST
- **Ruta de Backup:** `/home/racso/Despliegues/BarcelonaXplorer/backups/lancedb/lancedb_backup_20261001T193416.tar.gz`
- **Resultados de la Purga en Producción:**

| Tabla LanceDB | Registros Escaneados | Vectores Fallback Detectados | Vectores Purgados (`--apply`) | Estado Posterior (Verificación) |
|---|---|---|---|---|
| `cognitive_memories` | 5 | 5 | **5** | 0 restantes (Limpio) |
| `semantic_prompt_cache` | 8 | 8 | **8** | 0 restantes (Limpio) |
| **Total** | **13** | **13** | **13** | **0 restantes (100% Puro)** |

- **Reporte Final de Verificación:**
```json
{
  "dryRun": true,
  "uri": "/app/vector_storage",
  "tables": [
    {
      "tableName": "cognitive_memories",
      "scanned": 0,
      "matches": 0,
      "deleted": 0
    },
    {
      "tableName": "semantic_prompt_cache",
      "scanned": 0,
      "matches": 0,
      "deleted": 0
    }
  ]
}
```
Contenedor `barcelonaxplorer_web` reanudado y operativo al 100%.
