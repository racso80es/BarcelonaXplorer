# [OPERATIVO] PBI - Contrato Zod de la Sonda de Presencia Logística

**Identificador:** PBI-ARCH-JEV-002
**Estatus:** Completado / Certificado S+ Grade
**Fecha de Culminación:** 2026-10-03
**Historia de Usuario:** [[ARQUITECTURA] Triaje Paramétrico Asíncrono (Centinela Jev) y Fricción Cero](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Triaje%20Param%C3%A9trico%20As%C3%ADncrono%20%28Centinela%20Jet%29%20y%20Fricci%C3%B3n%20Cero.md) · Escenario 2 (forma)
**Acta:** [PBI-ARCH-JEV-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Acta%20del%20Centinela%20Jev%20y%20Fricci%C3%B3n%20Cero%20%28PBI-ARCH-JEV-001%29.md)
**Módulo:** `src/features/triage/`
**Prioridad:** P1
**Tamaño relativo:** 1 SP

---

## 1. Declaración (INVEST)

**Como** caso de uso que va a preguntar a Jev si un dato logístico está presente,
**Quiero** un esquema Zod cerrado con cuatro banderas booleanas,
**Para** rechazar en la frontera cualquier campo que no pertenezca a la Matriz de Densidad.

## 2. Alcance Realizado

Forjado `DensityPresenceProbeSchema` en `src/features/triage/density-presence-probe.schema.ts`.

| Campo | Tipo | Significado |
| :--- | :--- | :--- |
| `has_time_window` | `boolean` | El texto declara una ventana temporal |
| `has_group_size` | `boolean` | El texto declara el tamaño del grupo |
| `has_vibe` | `boolean` | El texto declara una vibra de la salida |
| `has_constraints` | `boolean` | El texto declara al menos una restricción |

El esquema es `.strict()`: una clave distinta (`budget`, `origin`, `nationality`, `time_minutes`) falla el parseo. El tipo exportado es `DensityPresenceProbe`.

## 3. Criterios de Aceptación Certificados

- [x] **CA-1:** Un objeto con las cuatro banderas booleanas pasa `DensityPresenceProbeSchema.parse`.
- [x] **CA-2:** Falta una bandera, un valor no booleano o una clave extra y el parseo lanza `ZodError`.
- [x] **CA-3:** El módulo no importa `IaGatewayClient`, LanceDB ni Prisma.
- [x] **CA-4:** El test colocado junto al esquema cubre CA-1 y CA-2 sin red.

## 4. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 advertencias** | 🟢 Aprobado |
| **Suite Colocalizada** | `npx vitest run features/triage/density-presence-probe.schema.test.ts` | **4/4 tests pasados (100%)** | 🟢 Aprobado |

## 5. Artefactos Forjados

- [`src/features/triage/density-presence-probe.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/density-presence-probe.schema.ts)
- [`src/features/triage/density-presence-probe.schema.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/density-presence-probe.schema.test.ts)
- [`src/features/triage/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/index.ts)
