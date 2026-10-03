# [OPERATIVO] PBI - Centinela de Presencia Jev en Paralelo

**Identificador:** PBI-ARCH-JEV-003
**Estatus:** Completado / Certificado S+ Grade
**Fecha de Culminación:** 2026-10-03
**Historia de Usuario:** [[ARQUITECTURA] Triaje Paramétrico Asíncrono (Centinela Jev) y Fricción Cero](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Triaje%20Param%C3%A9trico%20As%C3%ADncrono%20%28Centinela%20Jet%29%20y%20Fricci%C3%B3n%20Cero.md) · Escenario 2 (sonda)
**Acta:** [PBI-ARCH-JEV-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Acta%20del%20Centinela%20Jev%20y%20Fricci%C3%B3n%20Cero%20%28PBI-ARCH-JEV-001%29.md)
**Módulo:** `src/features/triage/`
**Prioridad:** P1
**Tamaño relativo:** 2 SP
**Depende de:** `PBI-ARCH-JEV-002`

---

## 1. Declaración (INVEST)

**Como** triaje que necesita saber qué datos logísticos trae el mensaje,
**Quiero** que Jev responda cuatro preguntas cerradas en paralelo,
**Para** obtener una sonda de presencia sin texto libre y sin acoplar todavía esa espera a la respuesta HTTP.

## 2. Alcance Realizado

Forjado `DensityPresenceSentinel` en `src/features/triage/density-presence-sentinel.use-case.ts`.

El constructor recibe `ITypedDecisionEngine` (Pure DI). El método `probe(prompt: string)` devuelve `Promise<OperationEnvelope<DensityPresenceProbe>>`.

La matriz declarativa de sondas:

| Bandera | Instrucción de `evaluateNoul` | Umbral |
| :--- | :--- | ---: |
| `has_time_window` | ¿El usuario indica expresamente una ventana de tiempo, número de horas, día o momento para realizar el plan? | 0.5 |
| `has_group_size` | ¿El usuario indica expresamente cuántas personas viajan o un tamaño de grupo? | 0.5 |
| `has_vibe` | ¿El usuario indica expresamente el tipo de ambiente o vibra que busca en la salida? | 0.5 |
| `has_constraints` | ¿El usuario indica expresamente una restricción práctica de la salida (ritmo, presupuesto relativo, accesibilidad)? | 0.5 |

Las cuatro llamadas se disparan concurrentemente con `Promise.all`. Toda sonda fallida se degrada a `false` (fail-soft). Si las cuatro fallan, el sobre es de éxito con las cuatro en `false`.

## 3. Criterios de Aceptación Certificados

- [x] **CA-1:** Con un motor doble que responde afirmativo a las cuatro instrucciones, la sonda trae las cuatro banderas a `true` y el sobre tiene `success: true`.
- [x] **CA-2:** Las cuatro llamadas ocurren en paralelo: el doble registra los cuatro `evaluateNoul` antes de resolver ninguna.
- [x] **CA-3:** Si una llamada rechaza y las otras tres afirman, esa bandera queda en `false` y el sobre sigue en éxito.
- [x] **CA-4:** El resultado que sale del caso de uso pasa `DensityPresenceProbeSchema`. El doble no recibe petición de texto libre ni de `evaluateChoice`.

## 4. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 advertencias** | 🟢 Aprobado |
| **Suite Colocalizada** | `npx vitest run features/triage/density-presence-sentinel.use-case.test.ts` | **5/5 tests pasados (100%)** | 🟢 Aprobado |

## 5. Artefactos Forjados

- [`src/features/triage/density-presence-sentinel.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/density-presence-sentinel.use-case.ts)
- [`src/features/triage/density-presence-sentinel.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/density-presence-sentinel.use-case.test.ts)
- [`src/features/triage/server.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/server.ts)
