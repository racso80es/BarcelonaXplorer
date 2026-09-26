# [OPERATIVO] Documento Destilado: PBI - Saneamiento Integral de Linter AST y Erradicación de Any

**Identificador:** PBI-OPS-LINT-001  
**Estatus:** Completado / Certificado en Producción (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Certificación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Estabilización Evolutiva y Saneamiento Post-Anclaje v2.0.1](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Estabilizaci%C3%B3n%20Evolutiva%20y%20Saneamiento%20Post-Anclaje%20v2.0.1.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** Calidad de Código, Seguridad Estática, Fixtures de Tests y Pureza React  
**Entorno:** TypeScript 5.x, ESLint 9 / Next Core Web Vitals, Vitest 4.x, Node.js 20+  
**Prioridad:** Alta (P1 - Cumplimiento del Axioma II y Axioma IV)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Saneamiento exhaustivo de deuda técnica preexistente (Vector P1), erradicación total de aserciones `any` en fixtures y mocks de pruebas unitarias/integración, corrección de pureza y límites de error en páginas de administración y orquestación, y supresión de imports huérfanos.
- **Entorno:** `src/features/planner/`, `src/features/ai-engine/`, `src/features/cognitive-memory/`, `src/features/telemetry/`, `src/features/auth/`, `src/app/Admin/`, `src/app/orchestrator/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico y Cero Alucinación):* Tipado estricto de mocks de pruebas unitarias (`MockAiPort`, `MockTelemetryRepo`) utilizando la firma exacta `Mock<F>` de Vitest y las entidades y Value Objects de dominio en lugar de `as any`.
  - *Filtro B (Determinismo y Soberanía):* En `src/app/Admin/page.tsx`, extracción de consultas asíncronas de base de datos fuera del cuerpo del componente hacia `getDashboardMetrics` y erradicación de JSX dentro de `try/catch`. En `src/app/orchestrator/page.tsx`, inicialización perezosa de estado (`useState(() => ...)`) para eliminar efectos secundarios de montaje.
  - *Filtro C (Eficiencia Operativa / Cero Ruido):* Limpieza de directivas `eslint-disable` obsoletas e imports no referenciados (`DomainException`, `ReactNode`, `Database`, `Layers`, `React`).

---

## 1. Declaración de Intención (INVEST)

**Como** Ingeniero de Calidad y Centinela de Código (Vértice Biológico),  
**Quiero** sustituir todas las aserciones `any` en los mocks de pruebas, corregir las violaciones de pureza y renderizado en cliente y eliminar los imports no referenciados en todo el árbol de trabajo,  
**Para** satisfacer de manera estricta el Axioma II (Tolerancia Cero a la Inferencia) y lograr que la Santa Trinidad de Oráculos pase en verde impoluto con **0 errores y 0 advertencias**.

---

## 2. Mapa Forense de Modificaciones y Erradicación de Deuda

| Fichero Afectado | Incidencias Iniciales | Regla Corregida | Solución S+ Grade Aplicada |
| :--- | :---: | :--- | :--- |
| `src/app/Admin/page.tsx` | 37 errores | `react-hooks/error-boundaries`, `react-hooks/purity` | Extracción de `getDashboardMetrics` fuera del componente, cierre del `try/catch` antes del renderizado de JSX y cálculo puro de tiempo. |
| `src/features/planner/generate-tactical-route.test.ts` | 20 errores | `@typescript-eslint/no-explicit-any` | Declaración de `MockAiPort` y `MockTelemetryRepo` con `Mock<F>` de Vitest y tipado de `payload` como `Record<string, unknown>`. |
| `src/features/ai-engine/groq-tests/groq-conversational-slm.test.ts` | 3 errores | `@typescript-eslint/no-explicit-any` | Tipado de cliente Groq como `as unknown as Groq` con import de tipo estricto. |
| `src/features/ai-engine/groq-tests/groq-geographic-bounce-generator.test.ts` | 3 errores | `@typescript-eslint/no-explicit-any` | Interfaz `MockTelemetryRepo` tipada con `Mock<F>` y eliminación de `as any` en llamadas mock. |
| `src/features/ai-engine/gemini-client.test.ts` | 2 errores | `@typescript-eslint/no-explicit-any` | Interfaz `MockTelemetryRepo` tipada y `createMockAiClient` tipado con `GoogleGenAI`. |
| `src/features/ai-engine/jev-tests/jev-client.test.ts` | 2 errores | `@typescript-eslint/no-explicit-any` | Tipado de mock con `MockTelemetryRepo` y eliminación de `as any`. |
| `src/app/orchestrator/__tests__/page.test.tsx` | 2 errores | `@typescript-eslint/no-explicit-any` | Mocks de `fetch` tipados como `as unknown as Response`. |
| `src/app/orchestrator/page.tsx` | 2 errores, 1 warning | `react-hooks/set-state-in-effect`, `react-hooks/exhaustive-deps`, `no-explicit-any` | Inicialización perezosa de `notification` en `useState`, dependencias de `useEffect` ajustadas a `[currentTurn]` y `type={spark.type}` sin `any`. |
| `src/features/cognitive-memory/lancedb-cognitive-memory.adapter.ts` | 1 error | `@typescript-eslint/no-explicit-any` | Tipado de filas de consulta como `Record<string, unknown>` y casteo seguro de metadatos. |
| `src/features/telemetry/telemetry.test.ts` | 1 error | `@typescript-eslint/no-explicit-any` | Tipado explícito de `mockPrisma` con métodos mockeados. |
| `src/features/ai-engine/groq-tests/groq-fast-ai.adapter.test.ts` | 1 warning | `Unused eslint-disable` | Eliminación de directiva de linter redundante. |
| `src/features/auth/hmac-magic-link-signer.test.ts` | 1 warning | `@typescript-eslint/no-unused-vars` | Supresión de import huérfano `DomainException`. |
| `src/features/auth/restore-session-from-magic-link.test.ts` | 1 warning | `@typescript-eslint/no-unused-vars` | Supresión de import huérfano `DomainException`. |
| `src/app/Admin/Cognitive/CognitiveKpiCards.tsx` | 1 warning | `@typescript-eslint/no-unused-vars` | Supresión de import huérfano `ReactNode`. |
| `src/app/Admin/Cognitive/CognitiveSessionsCard.tsx` | 1 warning | `@typescript-eslint/no-unused-vars` | Supresión de import huérfano `Database`. |
| `src/app/Admin/Cognitive/CognitiveTableClient.tsx` | 1 warning | `@typescript-eslint/no-unused-vars` | Supresión de import huérfano `Layers`. |
| `src/app/Admin/__tests__/page.test.tsx` | 1 warning | `@typescript-eslint/no-unused-vars` | Supresión de import huérfano `React`. |

---

## 3. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1 (Cero Any):** No existe ninguna aserción `@typescript-eslint/no-explicit-any` activa en los tests ni en adaptadores de dominio.
- [x] **CA-2 (Higiene de Imports):** Ningún archivo de test o componente contiene imports no referenciados ni directivas `eslint-disable` huérfanas.
- [x] **CA-3 (Peaje del Oráculo Linter AST):** `npm run lint` finaliza con código `0` (**0 errores, 0 advertencias**).
- [x] **CA-4 (Peaje del Oráculo Compilador):** `npx tsc --noEmit` finaliza con código `0` (**0 errores**).
- [x] **CA-5 (Peaje del Oráculo Pruebas):** `npm test` ejecuta los **302 tests pasados (100%)** en las **61 suites**.
- [x] **CA-6 (Script Canónico Automatizado):** [`scripts/audit-anchor.sh`](file:///home/racso/Proyectos/BarcelonaXplorer/scripts/audit-anchor.sh) certifica la Santa Trinidad al 100% en verde.

---

## 4. Certificación del Peaje del Oráculo (Santa Trinidad)

```text
⚖️  Consultando la Santa Trinidad de Oráculos...
1/3 Compilador TypeScript (tsc --noEmit)...
✅ Compilador: 0 errores.
2/3 Suite de Pruebas (vitest run)...
 Test Files  61 passed (61)
      Tests  302 passed (302)
✅ Suite de Pruebas: 100% verde.
3/3 Linter AST (eslint)...
✅ Linter: 0 problemas.
🎉 Protocolo de Extracción de Delta completado con éxito.
```
