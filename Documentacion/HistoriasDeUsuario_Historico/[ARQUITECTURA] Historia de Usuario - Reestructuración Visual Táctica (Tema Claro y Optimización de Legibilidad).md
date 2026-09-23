# [ARQUITECTURA] Historia de Usuario: Reestructuración Visual Táctica (Tema Claro y Optimización de Legibilidad)

**Estatus:** Refinado / Listo para Implementación  
**Fecha de Revisión:** 2026-09-22  
**Autor:** Operador Técnico / Arquitectura BarcelonaXplorer  
**Marco de Diseño:** Vía del Yunque / Clean Architecture / Tailwind CSS v4 / WCAG 2.1 AA/AAA / CVA  

---

## 1. Descripción General

**Como** Operador Técnico y Explorador de BarcelonaXplorer,  
**Quiero** transmutar la interfaz gráfica de usuario —abarcando el orquestador conversacional (`/orchestrator`), los componentes de interacción (`OrchestratorBlock`, `TacticalSpark`) y el panel de telemetría e infraestructura (`/Admin/System`, `DataTable`, tarjetas de sensores y modal forense)— desde el sustrato oscuro residual hacia un esquema táctico de alta luminosidad (Tema Claro de Alta Reflectancia), ampliando sistemáticamente la escala tipográfica base e instaurando una delimitación estructural rigurosa mediante bordes sólidos, sombras sutiles y diseño totalmente responsive,  
**Para** erradicar la fatiga visual en sesiones operativas prolongadas, maximizar la legibilidad y velocidad de asimilación de la información táctica, diferenciar con nitidez milimétrica los bloques de intervención biológica (usuario) frente a las deducciones del sistema (IA) y garantizar una experiencia fluida e impecable en cualquier factor de forma (móvil, tablet o escritorio), sin comprometer la tasa de refresco ni la gobernanza del DOM.

---

## 2. [ARQUITECTURA] Forja Visual S+ Grade: Escalabilidad y Gestión IA

Para escalar esta forja visual sin generar entropía en el repositorio y optimizar su orquestación mediante agentes IA, la arquitectura de estilos **abandona el hardcoding de utilidades crudas** (ej. `bg-zinc-50`, `bg-white`) a favor de un sistema de diseño ontológico y semántico basado en 4 pilares:

```
+---------------------------------------------------------------------------------------------------+
|                        PILARES DE LA FORJA VISUAL S+ GRADE (GESTIÓN IA)                           |
+---------------------------------------------------------------------------------------------------+
| 1. Inyección Semántica en el Genoma (@theme / Tailwind CSS)                                       |
|    Mapeo de utilidades a conceptos de dominio: surface-canvas, surface-container, surface-ai.    |
| 2. Blindaje de Componentes (Patrón CVA + Tailwind Merge)                                         |
|    class-variance-authority para unificar contratos y erradicar condicionales en className.       |
| 3. Simbiosis IA y Generative UI Determinista                                                      |
|    Frontera estricta: Backend IA devuelve JSON puro; Frontend Next.js renderiza componentes fijos.|
| 4. Prevención de Entropía CSS (Gobernanza Estática y Linter)                                       |
|    Prohibición de valores arbitrarios (bg-[#...]) y forzado de orden de clases con ESLint.        |
+---------------------------------------------------------------------------------------------------+
```

### 2.1. Inyección Semántica en el Genoma (Tailwind CSS `@theme`)
Las IA y los desarrolladores operan con mayor precisión cuando manejan conceptos semánticos en lugar de valores absolutos. Mapear los colores crudos a variables de dominio en la configuración de estilos (`src/app/globals.css` mediante la directiva `@theme` de Tailwind v4) previene alucinaciones de código generado y centraliza el mantenimiento:

```
+---------------------------+-----------------------------------+-----------------------------------+
| Token Semántico Táctico   | Valor Físico / Sustrato Asignado   | Rol Operativo en la Interfaz      |
+---------------------------+-----------------------------------+-----------------------------------+
| --color-surface-canvas    | zinc-50 (#fafafa / oklch 0.98)    | Lienzo principal y fondo global   |
| --color-surface-container | white (#ffffff / oklch 1.0)       | Losa usuario, cards, modal        |
| --color-surface-ai        | emerald-50/70 (#f0fdf4)           | Losa de mando de respuesta IA     |
| --color-surface-subtle    | zinc-100/80 (#f4f4f5)             | Cabeceras thead, chips neutros    |
| --color-content-primary   | zinc-900 (#18181b)                | Lectura táctica de alto contraste |
| --color-content-secondary | zinc-700 (#3f3f46)                | Waypoints y párrafos secundarios  |
| --color-content-meta      | zinc-600 / zinc-500               | Timestamps, contadores, metadatos |
| --color-content-accent    | emerald-700 (#047857)             | Títulos IA y estados confirmados  |
| --color-layout-divider    | zinc-200 (#e4e4e7)                | Bordes y divisores estructurales  |
| --color-layout-divider-str| zinc-300 (#d4d4d8)                | Bordes de inputs y avatares       |
| --color-focus-tactical    | emerald-500/30 (rgba(...))        | Anillo de enfoque y accesibilidad |
+---------------------------+-----------------------------------+-----------------------------------+
```

**Ventaja Arquitectónica de Desacoplamiento:** Si en el futuro se requiere alterar la reflectancia o introducir un modo de alto contraste para entornos de luz diurna extrema, se calibra un único nodo en la raíz de estilos (`globals.css`), eliminando por completo la necesidad de que un agente IA o un desarrollador refactorice decenas de archivos `.tsx`.

### 2.2. Blindaje de Componentes (Patrón CVA + Tailwind Merge)
Para evitar colisiones de estilos y mantener la *Vía del Yunque*, todo componente que implemente los tokens estructurales debe utilizar `class-variance-authority` (`cva`) combinado con el helper `cn` (`tailwind-merge`).

**Estructura de Variantes en `OrchestratorBlock`:** En lugar de concatenar cadenas dispersas o condicionales ternarios (`isAi ? 'bg-zinc-900/40' : 'bg-zinc-900'`), se define un diccionario estricto:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const orchestratorBlockVariants = cva(
  'relative w-full rounded-md transition-all duration-200 border shadow-sm p-4 sm:p-5',
  {
    variants: {
      role: {
        user: 'bg-surface-container border-layout-divider text-content-primary',
        ai: 'bg-surface-ai border-emerald-200 text-content-primary',
      },
      status: {
        idle: '',
        orchestrating: 'ring-1 ring-emerald-500/50 animate-pulse',
        completed: '',
      },
      spacing: {
        normal: 'mt-6 mb-6',
        compact: 'mt-3 mb-3',
      },
    },
    defaultVariants: {
      role: 'user',
      status: 'idle',
      spacing: 'normal',
    },
  }
);
```

**Estructura de Variantes en `TacticalSpark`:**
```typescript
export const tacticalSparkVariants = cva(
  'inline-flex items-center px-3 py-1.5 rounded-full border shadow-xs backdrop-blur-sm text-xs font-mono transition-colors duration-200',
  {
    variants: {
      urgency: {
        low: 'bg-zinc-100 border-layout-divider-strong text-zinc-700',
        medium: 'bg-amber-50 border-amber-300 text-amber-800',
        high: 'bg-red-50 border-red-300 text-red-800',
      },
    },
    defaultVariants: {
      urgency: 'low',
    },
  }
);
```

**Contrato Limpio:** El componente expone una API declarativa basada en props (`<OrchestratorBlock role="ai" status="orchestrating" />`). La IA generadora de código o de respuestas solo necesita especificar el rol y el estado; el componente inyecta automáticamente el token estructural (`bg-surface-ai`, `border-layout-divider`, `shadow-sm`).

### 2.3. Optimización para la Simbiosis IA (Generative UI & SddIA)
En el contexto de SddIA (*Software driven by AI*) y la inyección de componentes dinámicos:
- **Frontera de Responsabilidad Inviolable:** La IA en el backend (`gemini-client`, `groq-fast-ai`) debe limitarse a devolver la **matriz de datos estructurada** (JSON con entidades `TacticalRoute`, `FastInsight`, waypoints, horarios, recomendaciones). **Queda estrictamente prohibido que el LLM devuelva marcado HTML o clases de Tailwind**.
- **Renderizado Determinista:** El cliente Next.js asimila el JSON y lo cruza con el catálogo de componentes blindados. Esto garantiza que cualquier respuesta del modelo, por anómala o creativa que sea en contenido textual, siempre se renderizará cumpliendo el estándar visual táctico sin riesgo de inyecciones CSS o rupturas de layout.

### 2.4. Prevención de Entropía CSS (Gobernanza Estática y Linter)
Para proteger el repositorio contra la degradación visual con el paso del tiempo y prevenir regresiones térmicas:
- **Reglas de Linter:** Configurar `eslint-plugin-tailwindcss` en `eslint.config.mjs` para forzar un orden canónico y predecible de clases utilitarias.
- **Bloqueo Estático de Valores Arbitrarios:** Prohibir terminantemente el uso de valores arbitrarios ad-hoc (ej. `bg-[#f0fdf4]`, `text-[#123456]`) directamente en el código fuente de los componentes, forzando la canalización de todo color o espacio a través del diccionario ontológico de diseño (`globals.css` / `@theme`).

---

## 3. Matriz de Tokens y Escala Tipográfica Aumentada

```
+---------------------------------------------------------------------------------------------------+
|                        SISTEMA DE TOKENS TÁCTICOS - TEMA CLARO (ALTA REFLECTANCIA)                |
+---------------------------------------------------------------------------------------------------+
| Token Lógico                | Clase Semántica / Tailwind Utilizada| Función en la Interfaz        |
+-----------------------------+-----------------------------------+---------------------------------+
| Lienzo Base (Background)    | bg-surface-canvas (bg-zinc-50)    | Sustrato global de la pantalla  |
| Contenedores Primarios      | bg-surface-container (bg-white)   | Losa usuario, cards, modal      |
| Contenedor IA (Ruta)        | bg-surface-ai (bg-emerald-50/70)  | Diferenciación de respuesta IA  |
| Delimitación Estructural    | border-layout-divider (border-200)| Bordes sólidos anti-ambigüedad  |
| Elevación Táctica           | shadow-sm / shadow-md             | Separación de capas en el DOM   |
| Tipografía Primaria         | text-content-primary (zinc-900)   | Lectura principal de alta nitidez|
| Tipografía Secundaria / Meta| text-content-meta (zinc-600)      | Timestamps, etiquetas, badges   |
| Tipografía Acento / Estado  | text-content-accent (emerald-700) | Acciones y estados positivos    |
| Enfoque e Interactividad    | ring-focus-tactical (emerald-500) | Accesibilidad en inputs y foco  |
+-----------------------------+-----------------------------------+---------------------------------+
```

### 3.1. Escala Tipográfica Aumentada
- **Texto Base de Conversación:** Pasa de `text-sm` (14px) a `text-base` (16px) en el cuerpo del mensaje de usuario y descripción general del itinerario de la IA (`leading-relaxed`), previniendo el esfuerzo acomodativo ocular.
- **Detalle de Waypoints y Celdas Tabulares:** Estandarizado en `text-sm` (14px) con soporte monoespaciado en badges (`font-mono text-xs` / `text-sm`).
- **Títulos y Cabeceras:** `text-lg` a `text-xl` font-semibold con contraste `text-content-primary`.

### 3.2. Codificación Semántica de Badges sobre Sustrato Claro
Para evitar la pérdida de contraste de los badges cuando se sitúan sobre fondos blancos o grises tenues, se aplican combinaciones con fondo pastel saturado al 50-100, borde definido al 200-300 y texto al 700-800:

| Estado / Nivel | Fondo | Borde | Texto |
| :--- | :--- | :--- | :--- |
| **DEBUG** | `bg-purple-50` | `border-purple-200` | `text-purple-700` |
| **INFO** | `bg-emerald-50` | `border-emerald-200` | `text-emerald-700` |
| **WARN** | `bg-amber-50` | `border-amber-200` | `text-amber-800` |
| **ERROR** | `bg-red-50` | `border-red-200` | `text-red-700` |
| **LLM_ENGINE** | `bg-sky-50` | `border-sky-200` | `text-sky-800` |
| **SECURITY_PERIMETER** | `bg-rose-50` | `border-rose-200` | `text-rose-800` |
| **CLIENT_UI** | `bg-amber-50` | `border-amber-200` | `text-amber-800` |
| **SERVER_API** | `bg-zinc-100` | `border-zinc-200` | `text-zinc-800` |

---

## 4. Planimetría de Componentes Impactados

```
src/
├── app/
│   ├── globals.css                      <-- Genoma: inyección de tokens @theme semánticos
│   ├── orchestrator/
│   │   ├── page.tsx                     <-- Canvas claro, sticky bottom bar, chat wrapper responsive
│   │   └── __tests__/page.test.tsx      <-- Verificación de coreografía intacta
│   └── Admin/System/
│       ├── page.tsx                     <-- Canvas claro, grid responsive de métricas del núcleo
│       ├── AiTelemetryCard.tsx          <-- Sensor Gemini en card blanca con contraste
│       ├── GroqTelemetryCard.tsx        <-- Sensor Groq rápido en card blanca con contraste
│       ├── TelemetryRecentLogsCard.tsx  <-- Card contenedora blanca, chips de cabecera claros
│       └── TelemetryTableClient.tsx     <-- Badges adaptados y modal forense en tema claro
└── components/
    ├── OrchestratorBlock.tsx            <-- Refactor CVA: losa usuario vs losa IA, avatares
    ├── TacticalSpark.tsx                <-- Refactor CVA: píldoras contextuales blindadas
    ├── __tests__/
    │   ├── OrchestratorBlock.test.tsx   <-- Actualización de clases esperadas en Vitest
    │   └── TacticalSpark.test.tsx       <-- Actualización de clases esperadas en Vitest
    └── ui/
        └── data-table/
            ├── data-table.tsx           <-- Contenedor con borde layout-divider y sombra sutil
            ├── data-table-toolbar.tsx   <-- Input de búsqueda e inputs select con fondos claros
            ├── data-table-header.tsx    <-- Cabeceras thead bg-surface-subtle text-zinc-700
            ├── data-table-row.tsx       <-- Hover táctico suave hover:bg-zinc-50
            ├── data-table-cell.tsx      <-- Celdas text-zinc-800 text-sm
            └── data-table-pagination.tsx<-- Barra de navegación paginada adaptativa
```

---

## 5. Requisitos de Responsividad Móvil y Factores de Forma

El diseño debe garantizar adaptabilidad total en los puntos de quiebre definidos (`sm: 640px`, `md: 768px`, `lg: 1024px`):

```
+-------------------+-------------------------------------------------------------------------------+
| Dispositivo       | Comportamiento Orquestador                   | Comportamiento Panel /Admin     |
+-------------------+-------------------------------------------------------------------------------+
| Móvil (< 640px)   | - Margen izquierdo reducido (ml-2 a ml-3).   | - Tarjetas de métricas a 1 col. |
|                   | - Avatar desvinculado ajustado para evitar   | - Toolbar con controles en stack|
|                   |   desbordamiento fuera de pantalla.          | - Tabla con scroll-x fluido.    |
|                   | - Input con padding táctil (min 44px)        | - Paginador apilado vertical.   |
|                   |   y margen inferior apto para teclado móvil. | - Modal en w-[95vw] / max-h-90vh|
+-------------------+-------------------------------------------------------------------------------+
| Tablet (640-1024) | - Margen equilibrado ml-8.                   | - Grid métricas 2 columnas.     |
|                   | - Spacing regular en waypoints.              | - Toolbar wrap flexible.        |
+-------------------+-------------------------------------------------------------------------------+
| Desktop (> 1024px)| - Centrado táctico max-w-4xl.                | - Grid métricas 4 columnas.     |
|                   | - Avatar flotante completo (-top-4 -left-4). | - DataTable extendida limpia.   |
|                   | - Sangría de chispas ml-16.                  | - Modal centrado max-w-3xl.     |
+-------------------+-------------------------------------------------------------------------------+
```

---

## 6. Criterios de Aceptación (Verificación Empírica - Gherkin)

### Escenario 1: Legibilidad y Estructura del Orquestador de Chat
**Dado** el entorno de interacción principal (`/orchestrator`).  
**Cuando** el usuario introduce una consulta táctica y el motor LLM resuelve el itinerario.  
**Entonces** el mensaje del usuario se renderiza en una tarjeta blanca (`bg-surface-container`) con borde visible (`border-layout-divider`) y sombra suave (`shadow-sm`).  
**Y** la respuesta de la IA se renderiza con un contenedor distintivo de matiz esmeralda claro (`bg-surface-ai`), con los waypoints estructurados en submódulos blancos de alto contraste.  
**Y** las fuentes tipográficas base son de 16px (`text-base`) para el cuerpo de texto, permitiendo una lectura descansada y sin esfuerzo ocular.

### Escenario 2: Diferenciación de Chispas Contextuales (TacticalSparks)
**Dado** un flujo de streaming rápido con micro-insights emitidos por la Vía Rápida.  
**Cuando** se renderizan las píldoras `TacticalSpark`.  
**Entonces** cada píldora exhibe un fondo claro correspondiente a su nivel de urgencia (`urgency: 'low' | 'medium' | 'high'`) mediante variantes CVA, con bordes nítidos y texto oscuro saturado que cumple WCAG AA (> 4.5:1).  
**Y** mantienen la indentación espacial y la micro-animación de entrada sin colisiones visuales.

### Escenario 3: Monitorización en el Panel de Telemetría (`/Admin/System`)
**Dado** el panel de supervisión de infraestructura y telemetría.  
**Cuando** el operador técnico accede a la ruta protegida `/Admin/System`.  
**Entonces** el sustrato del lienzo es gris tenue (`bg-surface-canvas`) con encabezado contrastado `[ NÚCLEO ] Telemetría`.  
**Y** las 4 tarjetas de métricas (MySQL, Red, Gemini, Groq) se muestran con fondos blancos (`bg-surface-container`), bordes nítidos (`border-layout-divider`), sombras sutiles y textos en escala `text-zinc-800` / `text-zinc-900`.  
**Y** los puntos de pulso y textos de estado presentan contraste inmediato (esmeralda accesible sobre blanco).

### Escenario 4: Inspección Tabular Táctica (`DataTable`)
**Dado** el registro de logs polimórficos de telemetría.  
**Cuando** se visualiza la tabla de auditoría en `/Admin/System`.  
**Entonces** las cabeceras (`<th>`) adoptan un tono gris suave (`bg-surface-subtle`) con texto nítido `text-zinc-700`.  
**Y** las celdas (`<td>`) renderizan texto legible a 14px (`text-sm text-zinc-800`) con resaltado de fila interactivo (`hover:bg-zinc-50`).  
**Y** los badges de `Nivel` (`DEBUG`, `INFO`, `WARN`, `ERROR`) y `Contexto` utilizan la paleta clara sin sacrificar el código de color semántico.

### Escenario 5: Blindaje Arquitectónico CVA y Simbiosis IA
**Dado** el renderizado dinámico de itinerarios forjados por LLM.  
**Cuando** el cliente procesa el JSON emitido por el backend.  
**Entonces** los componentes UI se instancian a través de contratos de variantes tipadas (`cva`), sin condicionales de clase ad-hoc ni inyección de HTML o estilos arbitrarios desde el modelo.  
**Y** se garantiza renderizado determinista incluso ante variaciones en la longitud del prompt o de los waypoints.

### Escenario 6: Comportamiento Responsive y Experiencia Multidispositivo
**Dado** cualquier viewport entre 320px (smartphone) y 2560px (pantalla ultrapanorámica).  
**Cuando** el usuario interactúa con el orquestador o la tabla de administración.  
**Entonces** ningún contenedor genera desbordamiento horizontal indeseado (*horizontal overflow*) en el `body`.  
**Y** los elementos interactivos (botones, selectores, paginadores, input de chat) mantienen un área de toque (*touch target*) no inferior a 44x44px en pantallas móviles.  
**Y** la tabla de datos permite scroll horizontal interno dedicado preservando fijas las columnas críticas o adaptando sus anchos.

### Escenario 7: Preservación de Tasa Térmica y Cero Regresiones DOM
**Dado** el cambio a clases utilitarias semánticas de Tailwind CSS y CVA.  
**Cuando** se renderizan páginas tabulares con 25 o 50 registros o se reciben ráfagas de streaming en el chat.  
**Entonces** el pipeline de React preserva la tasa de 60 FPS sin bloqueos en el hilo principal de renderizado.  
**Y** la suite completa de pruebas unitarias y de integración (`vitest`) se ejecuta y finaliza con éxito rotundo (100% passing).

---

## 7. Plan de Verificación y Validación Empírica

1. **Compilación y Linteo Estricto:** Ejecutar comprobación de TypeScript y linteo con las reglas de gobierno de clases:
   ```bash
   npm run lint
   ```
2. **Suite de Pruebas Automatizadas:**
   ```bash
   npm test
   ```
   Validar que los 12 archivos de test (incluyendo `OrchestratorBlock.test.tsx`, `TacticalSpark.test.tsx`, `data-table.test.tsx` y `page.test.tsx`) completen en verde.
3. **Inspección Visual en Navegador (Subagente Browser / Playwright / Manual):**
   - Verificar contraste y renderizado en `/orchestrator` tras emitir un prompt.
   - Verificar visualización del panel `/Admin/System` y modal forense.
   - Simular viewport móvil (`375px`) y verificar legibilidad y ausencia de overflow.
