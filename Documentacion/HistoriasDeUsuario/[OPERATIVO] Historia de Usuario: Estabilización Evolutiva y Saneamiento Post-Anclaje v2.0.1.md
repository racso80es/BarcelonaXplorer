# [OPERATIVO] Historia de Usuario: Estabilización Evolutiva, Saneamiento de Deuda Técnica y Proyección Táctica Post-Anclaje v2.0.1

**Identificador:** HU-OPS-EVOL-002  
**Estatus:** En Progreso (3/5 PBIs Certificados — 10/13 SP — Protocolo de Acero S+)  
**Fecha de Creación:** 2026-09-26  
**Última Actualización:** 2026-09-26  
**Naturaleza:** Protocolo de Estabilización, Refactorización de Calidad y Evolución Funcional  
**Auditoría de Ciclo Vinculada:** [AUD-OPS-ANCHOR-001 (Delta v2.0.0-arch-definitive a c82b741)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Marco Normativo:** Protocolo de Acero — Grado S+ · [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) · [Anexo Constitucional: Axiomas de Forja S+ Grade](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/%5BARQUITECTURA%5D%20Anexo%20Constitucional:%20Axiomas%20de%20Forja%20S+%20Grade%20%28Optimizaci%C3%B3n%20para%20IA%29.md)  
**Módulos Afectados:** `src/components/ui/data-table/`, `src/features/ai-engine/`, `src/features/planner/`, `src/features/cognitive-memory/`, `src/features/telemetry/`, `src/features/triage/`, `scripts/`  
**Prioridad:** Alta (P1)  
**Estimación Global:** 13 Story Points (desglosados en 5 PBIs)

---

## 1. Descripción General (INVEST)

**Como** Operador Técnico y Arquitecto del Sistema (Vértice Biológico),  
**Quiero** ejecutar el saneamiento integral de la deuda técnica catalogada en el linter AST (85 incidencias), refactorizar el componente de tablas tácticas (`DataTable`) eliminando anti-patrones de re-renderizado en React, desgranar e implementar la orquestación híbrida y triaje semántico con persistencia en MySQL, y extender la cobertura de telemetría sensorial en tiempo real,  
**Para** restituir la Santa Trinidad de Oráculos al 100% verde (cero errores y cero advertencias), erradicar cualquier violación al Axioma II (Tolerancia Cero a la Inferencia / erradicación de `any`), blindar la estabilidad del renderizado en cliente y habilitar de manera limpia la siguiente frontera funcional de BarcelonaXplorer.

---

## 2. Justificación Arquitectónica (Los Cinco Axiomas S+ Grade)

1. **Axioma I — Ley de Economía Termodinámica (Localidad de Comportamiento):**  
   Toda corrección y feature se forja respetando la encapsulación por dominio en `src/features/` y `src/components/ui/`, garantizando que las modificaciones mantengan un radio de afección de $\le 3$ archivos adyacentes (*context hops*) con pruebas co-localizadas (`*.test.ts`).

2. **Axioma II — Tolerancia Cero a la Inferencia (Fronteras Deterministas):**  
   La erradicación de los 75 errores de `@typescript-eslint/no-explicit-any` en fixtures y mocks de `ai-engine`, `planner`, `cognitive-memory` y `telemetry` es mandatoria. Cada contrato de prueba debe tiparse explícitamente mediante tipos de dominio o esquemas Zod inferidos determinísticamente.

3. **Axioma III — Diseño Declarativo sobre Lógica Imperativa:**  
   En `DataTable`, la sincronización de tamaño de página y el restablecimiento de página ante filtros deben gobernarse declarativamente mediante estado derivado y callbacks de control, eliminando los efectos imperativos con `setState` en cascada. En orquestación híbrida, el triaje semántico se rige por un autómata de estados discriminado por Zod.

4. **Axioma IV — El Peaje del Oráculo (Santa Trinidad 100% Verde):**  
   Ningún cambio es aceptable sin validar el paso limpio por:
   - Compilador: `npx tsc --noEmit` (0 errores)
   - Linter AST: `npm run lint` (0 errores, 0 advertencias)
   - Tests: `npm test` (302+ tests pasados, 100% verde)

5. **Axioma V — Ejecución Encapsulada y Transparencia Estructural:**  
   Toda respuesta de enrutamiento semántico, cruce con proveedores externos y registro telemétrico debe encapsularse bajo el sobre determinista `OperationEnvelope<T>`, asegurando trazabilidad y aislamiento de fallos.

---

## 3. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Saneamiento del Linter AST y Erradicación de `any` (Axioma II & IV)
- **Dado** el código fuente bajo `src/features/` y `src/components/`.
- **Cuando** se ejecuta `npm run lint` desde el directorio `src/`.
- **Entonces** el oráculo AST finaliza con código de salida `0`, reportando exactamente **0 errores** y **0 advertencias**, habiéndose sustituido todos los tipos `any` en tests por interfaces estrictas, tipos genéricos o mocks tipados con `vitest`.

### Escenario 2: Refactorización Reactiva de `DataTable` sin Re-renders en Cascada
- **Dado** el componente `DataTable` en `src/components/ui/data-table/data-table.tsx`.
- **Cuando** un usuario altera los filtros de búsqueda (`debouncedSearchTerm`) o cambia la prop `pageSize`.
- **Entonces** la tabla ajusta su paginación y filtrado de forma reactiva sin ejecutar llamadas síncronas a `setState` dentro del cuerpo de un `useEffect`, eliminando la regla `react-hooks/set-state-in-effect` del linter y previniendo bucles de renderizado.

### Escenario 3: Triaje Semántico y Orquestación Híbrida (Jev AI & SLM)
- **Dado** un flujo conversacional donde el usuario emite una frase dialógica o emocional (ej. "Estoy muy cansado").
- **Cuando** el clasificador de intención de Jev AI procesa el vector de entrada.
- **Entonces** se suspende la recolección forzosa de la Matriz de Densidad, respondiendo con empatía situacional mediante el SLM; y cuando la intención evoluciona a logística turística y el umbral supera el 60%, se deriva fluidamente al generador de itinerarios pesados con persistencia en MySQL.

### Escenario 4: Cobertura Sensorial y Observabilidad Telemétrica Centralizada
- **Dado** el flujo de triaje semántico y enrutamiento a proveedores (TheFork, Civitatis).
- **Cuando** se procesa cada salto de intención o consulta de enriquecimiento.
- **Entonces** se emite un evento estructurado a la tabla de telemetría en MySQL registrando latencia, tokens y ruta elegida, visualizándose en tiempo real en la Sala de Control Táctica (`src/app/Admin/System/` y `src/app/Admin/Cognitive/`).

### Escenario 5: Aduana CI/CD y Sellado Canónico del Tag `v2.0.1-doc-anchor`
- **Dado** el script [`scripts/audit-anchor.sh`](file:///home/racso/Proyectos/BarcelonaXplorer/scripts/audit-anchor.sh).
- **When** se ejecuta el protocolo de anclaje tras completar los saneamientos.
- **Then** valida la Santa Trinidad al 100% en verde, se sella el tag canónico `v2.0.1-doc-anchor` en Git y se actualiza el espejo canónico [`README.md`](file:///home/racso/Proyectos/BarcelonaXplorer/README.md) con las métricas certificadas.

---

## 4. Desglose Operativo en Ítems del Backlog (PBIs Vinculados)

| Prioridad | Identificador | Título del PBI | Módulos Principales | Estimación | Estatus |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **P1** | `PBI-FEAT-UI-001` | [[OPERATIVO] Refactorización Táctica de DataTable y Prevención de Renders en Cascada](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Refactorizaci%C3%B3n%20T%C3%A1ctica%20de%20DataTable%20y%20Prevenci%C3%B3n%20de%20Renders%20en%20Cascada.md) | `src/components/ui/data-table/` | 2 SP | ✅ **Certificado** (S+ Grade) |
| **P1** | `PBI-OPS-LINT-001` | [[OPERATIVO] Saneamiento Integral de Linter AST y Erradicación de Any](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Saneamiento%20Integral%20de%20Linter%20AST%20y%20Erradicaci%C3%B3n%20de%20Any.md) | `src/features/ai-engine/`, `src/features/planner/`, `src/features/cognitive-memory/`, `src/features/telemetry/` | 3 SP | ✅ **Certificado** (S+ Grade) |
| **P1** | `PBI-ARCH-ORCH-001` | [[OPERATIVO] Orquestación Híbrida y Triaje Semántico con Persistencia MySQL](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico%20con%20Persistencia%20MySQL.md) | `src/features/triage/`, `src/features/planner/`, `src/features/ai-engine/`, `src/components/tactical/`, `src/prisma/` | 5 SP | ✅ **Certificado** (S+ Grade) |
| **P2** | `PBI-OPS-TELEM-002` | [[OPERATIVO] Ampliación Sensorial de Telemetría en Orquestación Híbrida](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Ampliaci%C3%B3n%20Sensorial%20de%20Telemetr%C3%ADa%20en%20Orquestaci%C3%B3n%20H%C3%ADbrida%20%28P2%29.md) | `src/features/telemetry/`, `src/app/Admin/System/`, `src/app/Admin/Cognitive/` | 2 SP | ✅ **Certificado** (S+ Grade) |
| **P2** | `PBI-OPS-CI-001` | [[OPERATIVO] Automatización de la Aduana CI-CD y Sellado de Tag v2.0.1-doc-anchor](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Automatizaci%C3%B3n%20de%20Aduana%20CI-CD%20y%20Sellado%20de%20Tag%20v2.0.1-doc-anchor%20%28P2%29.md) | `scripts/audit-anchor.sh`, `.github/workflows/`, `README.md` | 1 SP | ⏳ Pendiente |
