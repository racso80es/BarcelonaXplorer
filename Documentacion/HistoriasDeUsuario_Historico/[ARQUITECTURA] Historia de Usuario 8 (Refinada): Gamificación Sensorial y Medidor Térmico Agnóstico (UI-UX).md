# [ARQUITECTURA] Historia de Usuario 8 (Refinada): Gamificación Sensorial y Medidor Térmico Agnóstico (UI-UX)

- **Estatus:** Realizado (S+ Grade)
- **Fecha de Revisión:** 2026-09-26
- **Fecha de Culminación:** 2026-09-26
- **Autor:** Operador Técnico / Arquitectura BarcelonaXplorer

- **Módulo:** Interfaz de Usuario y Orquestación Táctica (`src/features/triage/components/`, `src/app/orchestrator/`)
- **Marco Normativo & Diseño:** [AGENTS.md (Protocolo de Acero S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/AGENTS.md) · [ADR-001 (Vertical Slicing)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [CONSTITUTION.md](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) · [Reestructuración Visual Táctica (Tema Claro)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%20-%20Reestructuraci%C3%B3n%20Visual%20T%C3%A1ctica%20%28Tema%20Claro%20y%20Optimizaci%C3%B3n%20de%20Legibilidad%29.md) · [Historia de Usuario 6 (Matriz de Densidad Polimórfica)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%206:%20Matriz%20de%20Densidad%20Polim%C3%B3rfica%20y%20Umbral%20Operativo%20%28El%20Peaje%20Termodin%C3%A1mico%29.md) · [Historia de Usuario 10 (Gamificación Logística)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2010:%20Gamificaci%C3%B3n%20Log%C3%ADstica%20y%20Escudo%20de%20Supervivencia%20%28Fase%20de%20Generaci%C3%B3n%29.md)

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Gamificación Sensorial Cognitiva (Efecto Zeigarnik y Gradiente de Meta), UI Declarativa Desacoplada, Sincronización Termodinámica con la Aduana Universal y Respeto Estricto al Principio Abierto/Cerrado (OCP).
- **Entorno:** Ecosistema Frontend BarcelonaXplorer (Next.js 16 App Router, React 19 Client Components, Tailwind CSS v4 con directiva `@theme`, `class-variance-authority`, Contratos Zod y Aduana Universal `/api/triage`).
- **Entropía Asimilada:**
  1. **Erradicación de la Paradoja de Bloqueo:** En borradores previos se asumía erróneamente que la inhabilitación del botón de acción en fase inerte impedía al usuario enviar prompts de clarificación. Se distingue con nitidez el canal conversacional continuo (input y envío de mensajes siempre disponibles) frente al disparador/indicador de despacho de itinerario ("Forjar Ruta Inmediata"), el cual permanece latente hasta alcanzar el umbral de supervivencia.
  2. **Alineación con el Tema Claro Táctico S+ Grade:** Se sustituyen las referencias residuales a utilidades del tema oscuro (`zinc-800`, `text-zinc-600`) por el sistema de diseño semántico definido en [`src/app/globals.css`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/globals.css) (`surface-container`, `border-layout-divider`, `content-primary`, `content-meta`, `content-accent`, `ring-focus-tactical`).
  3. **Tolerancia Cero a la Inferencia y Agnosticismo Puro (Axiomas II y III):** El componente de interfaz no calcula pesos ni conoce variables de dominio (`time_window`, `group_size`). Consume directamente el contrato estructurado `TriageOutcomeDto` devuelto por [`src/app/api/triage/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/route.ts) (`score`, `survivalThreshold`, `isThresholdSatisfied`, `missingVariable`, `status`), garantizando pureza de presentación y desacoplamiento absoluto de la lógica de negocio.

---

## 1. Descripción General

**Como** turista interactuando con el conserje y orquestador conversacional de BarcelonaXplorer,  
**Quiero** visualizar de forma sutil, orgánica y sensorial en la interfaz el nivel de preparación térmica y densidad de mi contexto de viaje mediante un Medidor Térmico Agnóstico reactivo,  
**Para** experimentar el impulso psicológico del Efecto Zeigarnik y el Gradiente de Meta sin sufrir la fatiga cognitiva de un formulario tradicional, reconociendo de un solo vistazo cuándo el sistema ha superado el peaje mínimo para forjar una ruta operativa (Fricción Cero) y cuándo ha alcanzado la saturación táctica completa (Modo Explorador S+ Grade con escudo anti-trampas y recomendaciones de alta fidelidad).

---

## 2. Justificación Arquitectónica y Principios de Forja

### 2.1. Psicodinámica de Fricción Cero: Efecto Zeigarnik y Gradiente de Meta
El diseño de la experiencia conversacional no debe forzar al usuario a rellenar campos estructurados rígidos antes de interactuar. Sin embargo, una conversación puramente etérea genera incertidumbre sobre cuánto contexto necesita el sistema para responder con precisión.  
Fundamentado en el **Efecto Zeigarnik** (la tendencia intrínseca a cerrar tareas o bucles cognitivos incompletos) y el **Gradiente de Meta** (el incremento del compromiso a medida que la meta se percibe más cercana), el medidor térmico ofrece un anclaje visual vivo:
- Convierte la recolección asimétrica de datos en un juego táctico sutil.
- Muestra el progreso sin entorpecer el flujo conversacional.
- Da visibilidad inmediata del beneficio incremental obtenido al responder a una repregunta del SLM.

### 2.2. Principio de Abierto/Cerrado (OCP) y Pureza de Presentación (Axiomas II y III)
Para cumplir rigurosamente el Principio de Abierto/Cerrado (OCP) y el [Axioma III (Diseño Declarativo)](file:///home/racso/Proyectos/BarcelonaXplorer/AGENTS.md):
- **Cero Lógica de Negocio en Frontend:** El componente visual de React (Client Component) es estrictamente un componente de presentación ("Dumb Component"). Desconoce por completo qué variables componen la matriz (`time_window`, `group_size`, `vibe`, `constraints`), cuáles son sus ponderaciones relativas o qué matriz temática está en uso (`"default"`, `"gastronomy"`).
- **Consumo de Contratos Deterministas:** Toda la matemática termodinámica se ejecuta en el backend mediante [`calculateMatrixDensity`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.ts#L98-L150) y se transporta de forma tipada en el payload de la Aduana Universal [`TriageOutcomeDto`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.schema.ts#L55-L75).
- **Adaptabilidad Polimórfica:** Si mañana se añade una matriz `"nightlife"` con un `survival_threshold: 80` y nuevas variables, el medidor térmico funcionará de forma inmediata e idéntica sin alterar una sola línea de código en la UI.

### 2.3. Desambiguación de la Paradoja de Bloqueo (Canal de Entrada vs. Despacho)
En análisis previos existía la incoherencia de marcar "el botón de acción en disabled durante la fase inerte". En una arquitectura conversacional de Fricción Cero:
1. **Canal de Aporte Conversacional (TextArea + Botón Enviar Prompt):** Permanece **siempre operativo y desbloqueado** para que el explorador aporte datos cuando lo desee, excepto durante la ventana transitoria en la que el orquestador está asimilando la petición (`status === 'orchestrating'`).
2. **Acción de Despacho de Ruta ("Forjar Ruta Inmediata" / Estado Operativo del Orquestador):** Permanece **bloqueada / latente** en fase inerte (`score < survivalThreshold`). Cuando el usuario alcanza el umbral de supervivencia, el orquestador valida la viabilidad física del itinerario, rompe la latencia y habilita la ejecución inmediata sin exigir la compleción del 100%.

### 2.4. Localidad de Comportamiento y Vertical Slicing (Axioma I & ADR-001)
Siguiendo las directrices del [ADR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) y el Axioma I:
- El componente `ThermalMeter` reside colocado en el dominio de la interacción táctica de triaje: [`src/features/triage/components/thermal-meter.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.tsx).
- Sus pruebas unitarias se colocalizan estrictamente en [`src/features/triage/components/thermal-meter.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.test.tsx), prohibiendo la dispersión de pruebas en árboles espejo.
- Su integración en el orquestador conversacional se realiza en [`src/app/orchestrator/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/page.tsx).

---

## 3. Coreografía Visual y Matriz de Estados Termodinámicos (CVA)

El componente adopta una máquina de tres estados termodinámicos universales, gobernada declarativamente mediante `class-variance-authority` (CVA) y los tokens semánticos del sistema de diseño en tema claro de alta luminosidad ([`src/app/globals.css`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/globals.css)):

```
+---------------------------------------------------------------------------------------------------+
|                                 COREOGRAFÍA TERMODINÁMICA DEL MEDIDOR                             |
+---------------------------------------------------------------------------------------------------+
| 1. FASE INERTE / CALENTAMIENTO (score < survivalThreshold)                                        |
|    - Anillo/borde perimetral: border-layout-divider-strong (zinc-300)                             |
|    - Micro-indicador: Barra o arco en zinc-400 con texto secundario en text-content-meta (zinc-500)|
|    - Feedback contextual: Chip indicando variable prioritaria faltante (highestMissingVariable)   |
|    - Estado de Despacho: Inactivo / En espera de datos mínimos de supervivencia                   |
+---------------------------------------------------------------------------------------------------+
| 2. DESBLOQUEO DE SUPERVIVENCIA (survivalThreshold <= score < 100%)                                |
|    - Anillo/borde perimetral: border-emerald-500 con halo suave ring-2 ring-emerald-500/20        |
|    - Micro-indicador: Barra activa en emerald-600 con micro-pulso transitorio (animate-pulse)     |
|    - Feedback contextual: Mensaje táctico "Umbral de Supervivencia alcanzado (ej. 60%)"           |
|    - Estado de Despacho: Habilitado (Fricción Cero activa, ruta lista para forjarse)             |
+---------------------------------------------------------------------------------------------------+
| 3. SATURACIÓN TÁCTICA / MODO S+ GRADE (score === 100%)                                            |
|    - Anillo/borde perimetral: border-emerald-600 ring-2 ring-emerald-500/40                       |
|    - Micro-indicador: Arco o barra completa en emerald-600/700 con micro-recompensa visual       |
|    - Feedback contextual: Distintivo táctico "Modo Explorador S+ Grade Desbloqueado"             |
|    - Beneficio asociado: Activación del Escudo Anti-Trampas y Drops Preventivos de Fidelidad      |
+---------------------------------------------------------------------------------------------------+
```

### 3.1. Variantes CVA Declarativas (`thermalMeterVariants`)
```typescript
import { cva } from 'class-variance-authority';

export const thermalMeterVariants = cva(
  'transition-all duration-300 ease-in-out flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono border',
  {
    variants: {
      state: {
        inert: 'bg-surface-subtle border-layout-divider-strong text-content-meta shadow-2xs',
        operational: 'bg-emerald-50/70 border-emerald-300 text-content-accent shadow-xs ring-1 ring-emerald-500/20',
        saturated: 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-semibold shadow-sm ring-2 ring-emerald-500/30',
      },
    },
    defaultVariants: {
      state: 'inert',
    },
  },
);
```

---

## 4. Contratos de Datos y Esquemas de Frontera (Axioma II)

### 4.1. Esquema Zod de Props del Componente (`ThermalMeterPropsSchema`)
```typescript
import { z } from 'zod';

export const ThermalMeterPropsSchema = z.object({
  score: z.number().min(0).max(100),
  survivalThreshold: z.number().min(0).max(100),
  isThresholdSatisfied: z.boolean(),
  missingVariable: z.string().optional().nullable(),
  matrixId: z.string().default('default'),
  onForceDispatch: z.function().args().returns(z.void()).optional(),
  isDispatching: z.boolean().default(false),
  className: z.string().optional(),
});

export type ThermalMeterProps = z.infer<typeof ThermalMeterPropsSchema>;
```

### 4.2. Sincronización con la Aduana Universal (`TriageOutcomeDto`)
Cuando el usuario envía una interacción a `/api/triage`, la respuesta HTTP contiene:
```typescript
{
  status: 'INCOMPLETE_REPROMPT' | 'DISPATCH_READY' | 'CASUAL_DIALOGUE' | 'REBOUND_OUT_OF_SCOPE',
  score: number,              // ej. 30 o 60
  survivalThreshold: number,  // ej. 60 o 70
  isThresholdSatisfied: boolean,
  missingVariable?: string,   // ej. 'time_window'
  matrixId: string            // ej. 'default'
}
```
El estado del medidor térmico en la página del orquestador se actualiza de forma idempotente con estos valores sin requerir que el cliente mantenga una réplica del algoritmo de pesos.

---

## 5. Criterios de Aceptación (Verificación Empírica Gherkin S+ Grade)

### Escenario 1: Componente Agnóstico en Fase Inerte con Input Conversacional Activo
- **Dado** el medidor térmico montado en [`src/app/orchestrator/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/page.tsx) operando bajo la matriz `"gastronomy"` (`survival_threshold: 70`).
- **Cuando** el usuario acumula un payload parcial con un `score: 40`.
- **Entonces** el componente evalúa `40 < 70` (`isThresholdSatisfied: false`) y adopta la variante CVA `'inert'`.
- **Y** el componente renderiza el borde con `border-layout-divider-strong` y el texto de estado en `text-content-meta`.
- **Y** muestra un indicador sutil con el porcentaje actual y la variable crítica requerida (ej. `40% / Meta: 70% · Falta: group_size`).
- **Y** el disparador de ruta inmediata permanece inhabilitado, pero el formulario de chat y el botón de enviar mensajes permanecen **completamente habilitados** para que el usuario pueda responder libremente.

### Escenario 2: Activación Sensorial Dinámica al Superar el Peaje de Supervivencia (Fricción Cero)
- **Dado** el mismo explorador que aporta el dato faltante elevando el `score` al `75%` (`75 >= 70`).
- **Cuando** el cliente procesa la respuesta tipada `TriageOutcomeDto`.
- **Entonces** el medidor térmico transiciona instantáneamente a la variante CVA `'operational'`.
- **Y** el borde muta a `border-emerald-300`, el fondo adopta `bg-emerald-50/70` y se activa un pulso reactivo en el anillo perimetral (`ring-1 ring-emerald-500/20`).
- **Y** el botón/acción de "Forjar Ruta Inmediata" se desbloquea de inmediato, confirmando al usuario que la ruta mínima física ya es viable sin necesidad de saturar todos los parámetros opcionales.

### Escenario 3: Saturación Táctica Absoluta y Recompensa S+ Grade
- **Dado** un explorador que responde a los parámetros adicionales alcanzando un `score: 100`.
- **Cuando** el componente recibe el estado de densidad máxima.
- **Entonces** transiciona a la variante CVA `'saturated'` (`bg-emerald-100/80`, `border-emerald-400`, `ring-2 ring-emerald-500/30`).
- **Y** la interfaz proyecta el badge de recompensa `"Modo Explorador S+ Grade Desbloqueado"`.
- **Y** comunica de forma no intrusiva que el itinerario contará con el Escudo Anti-Trampas y recomendaciones hiperlocales curadas de alta densidad.

### Escenario 4: Cumplimiento Normativo del Peaje del Oráculo (Axiomas I, II y IV)
- **Dado** el componente implementado en [`src/features/triage/components/thermal-meter.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.tsx) y su suite colocada [`src/features/triage/components/thermal-meter.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.test.tsx).
- **Cuando** se somete al Peaje del Oráculo (`tsc --noEmit`, `eslint`, `vitest run`).
- **Entonces** el compilador TypeScript concluye con código de salida 0 sin el uso de `any`, `as any` o aserciones ciegas (`!`).
- **Y** el linter AST valida la pureza de las clases semánticas de Tailwind v4 y la ausencia de valores arbitrarios o clases del tema oscuro obsoletas.
- **Y** los tests unitarios con `@testing-library/react` validan los 3 estados termodinámicos, el cálculo de variante y la accesibilidad semántica (ARIA roles y etiquetas para lectores de pantalla).
