# [OPERATIVO] Documento Destilado: PBI - Hook Pre-commit Determinista Local y Purga Programada de Telemetría

**Identificador:** PBI-OPS-HOOK-001  
**Estatus:** Realizado / Certificado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Realización:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Optimización Kaizen, Resiliencia Perimetral y Eficiencia Cognitiva v2.1.0](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Optimizaci%C3%B3n%20Kaizen,%20Resiliencia%20Perimetral%20y%20Eficiencia%20Cognitiva%20v2.1.0.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** Gobernanza Git (`.githooks/`), Tubería de Mantenimiento y `src/features/telemetry/`  
**Entorno:** Git 2.x, Bash Shell, Linux Cron / Next.js Route Handler, Prisma ORM / MySQL  
**Prioridad:** Media (P2 - Higiene Operativa, Gobernanza y Prevención de Degradación de Disco)  
**Estimación Táctica:** 1 Story Point  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Instalación de una aduana local `pre-commit` mediante Git Hooks puros (`core.hooksPath = .githooks`), e implementación de una tarea de mantenimiento programada para ejecutar automáticamente la purga de logs antiguos de MySQL mediante `PruneTelemetryUseCase` y `/api/telemetry/prune`.
- **Entorno:** `.githooks/pre-commit`, `scripts/setup-hooks.sh`, `src/features/telemetry/prune-telemetry.use-case.ts`, `src/app/api/telemetry/prune/route.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* El hook `pre-commit` ejecuta la comprobación estricta de tipos (`tsc --noEmit`) y el linter AST (`eslint`) antes de permitir cualquier confirmación local.
  - *Filtro B (Determinismo y Soberanía):* La purga de telemetría descarta registros con más de 7 días (para DEBUG/INFO) y más de 30 días (para WARN/ERROR), manteniendo la base de datos MySQL en un tamaño acotado e inmune a problemas de agotamiento de espacio en disco en el Nodo 11.
  - *Filtro C (Eficiencia Operativa):* Automatización desatendida; cero esfuerzo manual para el operador.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio de la Calidad y Operador de Infraestructura (Vértice Biológico),  
**Quiero** disponer de un hook pre-commit local que impida commits con errores y una purga programada de la tabla de telemetría,  
**Para** interceptar regresiones en la máquina del desarrollador antes de llegar a CI y garantizar que el almacenamiento en MySQL se mantenga limpio y optimizado a perpetuidad.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Hook Pre-commit Local):** Creación del directorio `.githooks/` conteniendo `pre-commit` ejecutable que valida `tsc --noEmit` y `npm run lint` sobre el código antes de permitir el commit.
- [x] **CA-2 (Script de Inicialización de Hooks):** Script `scripts/setup-hooks.sh` que configura automáticamente `git config core.hooksPath .githooks` y asigna permisos de ejecución `chmod +x`.
- [x] **CA-3 (Endpoint o Tarea Programada de Purga):** Exposición de la ruta protegida interna `/api/telemetry/prune` que ejecuta `PruneTelemetryUseCase` bajo verificación Fail-Closed con `CRON_SECRET` y comparación en tiempo constante (`constantTimeEqual`).
- [x] **CA-4 (Verificación de Oráculos):** Pruebas unitarias colocadas en `src/features/telemetry/prune-telemetry.test.ts` verificando que la purga automática aplica las reglas por defecto (7d DEBUG/INFO, 30d WARN/ERROR), admite reglas personalizadas, maneja estados limpios (0 borrados) y propaga errores.

---

## 3. Evidencias de Certificación Grado S+

1. **Ejecución del Hook Pre-commit:** Verificado con éxito (`./.githooks/pre-commit` retorna exit 0, comprobando `tsc` y `eslint`).
2. **Configuración de Hooks:** `scripts/setup-hooks.sh` ejecutado, `git config core.hooksPath` verificado como `.githooks`.
3. **Tests de Co-ubicación:**
   - `src/features/telemetry/prune-telemetry.test.ts`: 4/4 pruebas aprobadas.
