# [OPERATIVO] PBI - Fusión Determinista de Presencia y Heurística

**Identificador:** PBI-ARCH-JEV-004
**Estatus:** Completado / Certificado S+ Grade
**Fecha de Culminación:** 2026-10-03
**Historia de Usuario:** [[ARQUITECTURA] Triaje Paramétrico Asíncrono (Centinela Jev) y Fricción Cero](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Triaje%20Param%C3%A9trico%20As%C3%ADncrono%20%28Centinela%20Jet%29%20y%20Fricci%C3%B3n%20Cero.md) · Escenario 2 (fusión)
**Acta:** [PBI-ARCH-JEV-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Acta%20del%20Centinela%20Jev%20y%20Fricci%C3%B3n%20Cero%20%28PBI-ARCH-JEV-001%29.md)
**Módulo:** `src/features/triage/`
**Prioridad:** P1
**Tamaño relativo:** 2 SP
**Depende de:** `PBI-ARCH-JEV-002`. Consume el payload que produce `extractMatrixVariables`.

---

## 1. Declaración (INVEST)

**Como** triaje que ya sabe detectar horas, grupo, vibra y restricciones por heurística,
**Quiero** conservar un valor heurístico solo cuando Jev confirma que esa variable está presente, y conservar el valor ya guardado en la sesión cuando Jev no ve nada nuevo,
**Para** llenar la Matriz de Densidad sin dejar que el motor invente cifras.

## 2. Alcance Realizado

Forjada la función pura `mergePresenceWithHeuristic` en `src/features/triage/merge-presence-with-heuristic.ts`.

Firma canónica:

```ts
mergePresenceWithHeuristic(input: {
  prior: Partial<DefaultDensityPayload>;
  heuristic: DefaultDensityPayload;
  probe: DensityPresenceProbe;
}): DefaultDensityPayload
```

Regla por variable:
- `time_window`: si la bandera es `true`, queda el valor heurístico si es cadena no vacía; si no, queda el `prior`. Si es `false`, queda el `prior`.
- `group_size`: si la bandera es `true`, queda el entero positivo heurístico; si no, queda el `prior`. Si es `false`, queda el `prior`.
- `vibe`: si la bandera es `true`, queda la cadena heurística no vacía; si no, queda el `prior`. Si es `false`, queda el `prior`.
- `constraints`: si la bandera es `true`, queda la lista heurística si tiene elementos; si no, queda el `prior`. Si es `false`, queda el `prior`.
- `districts`, `language` y `mood` se copian del heurístico del turno.

Validación estricta de salida mediante `DefaultDensityPayloadSchema`. Función pura sin efectos secundarios ni llamadas a la red.

## 3. Criterios de Aceptación Certificados

- [x] **CA-1:** Con sonda toda a `true` y heurística que trae `group_size: 4` más `time_window` no vacío, el payload fusionado conserva ambos y pasa `DefaultDensityPayloadSchema`.
- [x] **CA-2:** Con `has_group_size: false` y `prior.group_size === 2`, el resultado mantiene `2` aunque la heurística de este turno proponga otro entero.
- [x] **CA-3:** Con `has_vibe: true`, heurística sin vibra y `prior.vibe === 'cultural'`, el resultado mantiene `cultural`.
- [x] **CA-4:** El módulo no importa el cliente de Jev ni el adaptador de LanceDB.

## 4. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 advertencias** | 🟢 Aprobado |
| **Suite Colocalizada** | `npx vitest run features/triage/merge-presence-with-heuristic.test.ts` | **5/5 tests pasados (100%)** | 🟢 Aprobado |

## 5. Artefactos Forjados

- [`src/features/triage/merge-presence-with-heuristic.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/merge-presence-with-heuristic.ts)
- [`src/features/triage/merge-presence-with-heuristic.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/merge-presence-with-heuristic.test.ts)
- [`src/features/triage/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/index.ts)
