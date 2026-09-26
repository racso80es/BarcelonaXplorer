# [OPERATIVO] Documento Destilado: PBI - Saneamiento Integral de Linter AST y Erradicación de Any

**Identificador:** PBI-OPS-LINT-001  
**Estatus:** Pendiente / Listo para Forja (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Estabilización Evolutiva y Saneamiento Post-Anclaje v2.0.1](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Estabilizaci%C3%B3n%20Evolutiva%20y%20Saneamiento%20Post-Anclaje%20v2.0.1.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** Calidad de Código, Seguridad Estática y Fixtures de Pruebas Unitarias  
**Entorno:** TypeScript 5.x, ESLint 9 / Next Core Web Vitals, Vitest 4.x, Node.js 20+  
**Prioridad:** Alta (P1 - Crítico para Cumplimiento de Axioma II y Axioma IV)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Saneamiento de deuda técnica preexistente (Vector P1), erradicación sistemática de aserciones `any` en suites de pruebas unitarias/integración y supresión de variables/directivas no utilizadas.
- **Entorno:** `src/features/ai-engine/`, `src/features/planner/`, `src/features/cognitive-memory/`, `src/features/auth/`, `src/features/telemetry/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico y Cero Alucinación):* Sustitución de `any` en los mocks de llamadas a Gemini, Groq, Jev AI y adaptadores de LanceDB por tipos estrictos derivados de los esquemas Zod o contratos de interfaces formales.
  - *Filtro B (Determinismo y Soberanía):* Ejecución sin excepciones de `npm run lint` en `src/`, pasando de 85 problemas a 0 advertencias y 0 errores.
  - *Filtro C (Eficiencia Operativa / Cero Ruido):* Limpieza de directivas `eslint-disable` obsoletas y eliminación de imports no utilizados (`DomainException`, etc.).

---

## 1. Declaración de Intención (INVEST)

**Como** Ingeniero de Calidad y Centinela de Código (Vértice Biológico),  
**Quiero** sustituir todas las aserciones `any` en los mocks de pruebas y resolver las 10 advertencias de imports y directivas huérfanas en el código fuente,  
**Para** satisfacer de manera estricta el Axioma II (Tolerancia Cero a la Inferencia) y lograr que el oráculo del Linter AST (`eslint`) pase en verde impoluto (0 errores, 0 warnings).

---

## 2. Mapa Forense de Archivos Afectados (75 Errores + 10 Advertencias)

| Fichero Afectado | Tipo de Incidencia | Regla Violada | Solución Canónica |
| :--- | :---: | :--- | :--- |
| `src/features/ai-engine/gemini-client.test.ts` | 2 errores | `@typescript-eslint/no-explicit-any` | Tipar el mock de respuesta de `GoogleGenerativeAI` mediante interfaz local `MockGenerativeModel`. |
| `src/features/ai-engine/groq-tests/groq-conversational-slm.test.ts` | 3 errores | `@typescript-eslint/no-explicit-any` | Reemplazar `any` por `unknown` validado o tipos de completion de Groq SDK. |
| `src/features/ai-engine/groq-tests/groq-geographic-bounce-generator.test.ts` | 3 errores | `@typescript-eslint/no-explicit-any` | Modelar el mock de chat completion con tipos de retorno explícitos. |
| `src/features/ai-engine/jev-tests/jev-client.test.ts` | 2 errores | `@typescript-eslint/no-explicit-any` | Tipar los mocks del cliente HTTP fetch/Jev con `Response` tipado. |
| `src/features/planner/generate-tactical-route.test.ts` | 20 errores | `@typescript-eslint/no-explicit-any` | Definir interfaces y fixtures tipados para nodos de ruta, mocks de repositorios y geolocalizaciones. |
| `src/features/cognitive-memory/lancedb-cognitive-memory.adapter.ts` | 1 error | `@typescript-eslint/no-explicit-any` | Tipar el retorno de consulta vectorial o usar `Record<string, unknown>` con validación Zod. |
| `src/features/telemetry/telemetry.test.ts` | 1 error | `@typescript-eslint/no-explicit-any` | Tipar el payload de telemetría usando `TelemetryEventPayload`. |
| `src/features/auth/hmac-magic-link-signer.test.ts` | 1 warning | `@typescript-eslint/no-unused-vars` | Remover import no utilizado `DomainException`. |
| `src/features/auth/restore-session-from-magic-link.test.ts` | 1 warning | `@typescript-eslint/no-unused-vars` | Remover import no utilizado `DomainException`. |
| `src/features/ai-engine/groq-tests/groq-fast-ai.adapter.test.ts` | 1 warning | `Unused eslint-disable` | Eliminar directiva `eslint-disable` redundante. |

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Cero Any):** No existe ninguna aserción `@typescript-eslint/no-explicit-any` activa en los tests de `src/features/`.
- [ ] **CA-2 (Higiene de Imports):** Ningún archivo de test o adaptador contiene imports no referenciados ni directivas `eslint-disable` huérfanas.
- [ ] **CA-3 (Peaje del Oráculo):** La ejecución de `npm run lint` en `src/` (excluyendo temporalmente los 2 errores de React de DataTable si se abordan en paralelo) reduce los problemas a exactamente los derivados de UI o cero.
- [ ] **CA-4 (Cero Regresiones):** `npm test` continúa ejecutando los 302 tests en verde (100% de éxito).
