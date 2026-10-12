# [ARQUITECTURA] Historia de Usuario: Escalado Tipográfico Sistémico, Layout Fluido en Escritorio y Adecuación Móvil del Nodo /Admin (HU-17)

**Estatus:** Borrador Propuesto / Pendiente de Refinamiento a PBI  
**Fecha de Emisión:** 2026-10-12  
**Autor:** Vértice Biológico (Racso) & Nodo de Control (Tormentosa)  
**Marco Normativo:** Protocolo de Acero S+ Grade · ADR-001 (Vertical Slicing) · Cuarteto de Oráculos

---

## Matriz de Indexación Tridimensional

* **Naturaleza:** Evolución de Interfaz de Usuario (UI/UX), Arquitectura de Estilos con Tailwind CSS 4.x, Diseño Responsivo Mobile-First y Optimización de Densidad Visual.
* **Entorno:** Ecosistema `/Admin` de BarcelonaXplorer (`/Admin/Logs`, `/Admin/System`, `/Admin/Cognitive`) y componente transversal `src/components/ui/data-table/`.
* **Entropía Asimilada:**
  1. **Erradicación de Micro-Tipografía Dispersa:** Sustitución de clases utilitarias diminutas (`text-xs`, `text-[11px]`) por una jerarquía tipográfica escalable gobernada desde el contenedor raíz administrativo y tokens semánticos.
  2. **Aprovechamiento Integral del Viewport Horizontal (Desktop):** Eliminación de cuellos de botella de anchura (como `max-w-md` en celdas de mensajes y contenedores estrechos) para maximizar la legibilidad en monitores panorámicos.
  3. **Resiliencia en Dispositivos Móviles:** Adaptación de barras de herramientas, selectores facetados, tarjetas de KPIs y tablas de datos para operar sin roturas de layout ni solapamientos en pantallas verticales.

---

## 1. Descripción General

**Como** Operador Técnico y Administrador de BarcelonaXplorer,  
**Quiero** actualizar la capa de presentación del nodo `/Admin` y de sus componentes tabulares y de diagnóstico mediante una ampliación eficiente y centralizada del tamaño tipográfico, una estructura adaptable a dispositivos móviles y un layout fluido de anchura completa en escritorio,  
**Para** inspeccionar registros de telemetría, sondas de salud del sistema y métricas de memoria cognitiva con máxima legibilidad, aprovechando el 100% del lienzo útil en pantallas grandes y garantizando una operatividad táctil sin fricción desde terminales móviles.

---

## 2. Pilares de Diseño y Arquitectura de Estilos (La Forja Visual)

### 2.1. Ampliación Tipográfica Eficiente (Gobernanza por Cascada y Tokens)

En lugar de reemplazar manualmente clases de utilidad vista por vista, la ampliación de texto se ejecuta de forma sistémica en dos niveles:

1. **Cascada Base en Layout Administrativo (`src/app/Admin/layout.tsx`):**
   * Se define un contenedor maestro para toda la rama `/Admin/:path*` que establece la escala tipográfica base en `text-sm md:text-base` (14px en móvil, 16px en escritorio) y un interlineado relajado (`leading-relaxed`), heredable por todos los módulos hijos (`/Admin/Logs`, `/Admin/System`, `/Admin/Cognitive`).
2. **Normalización de Tokens en `DataTable<T>` (`src/components/ui/data-table/`):**
   * **Prohibición de `text-[11px]`:** Se eliminan los tamaños arbitrarios inferiores a 12px en insignias de estado HTTP, marcas temporales y metadatos.
   * **Matriz de Escalado Tabular:**

| Elemento UI | Token Anterior | Nuevo Token S+ Grade | Tamaño Equivalente (Móvil -> Web) |
| :--- | :--- | :--- | :--- |
| Contenedor Raíz `/Admin` | Sin base unificada | `text-sm md:text-base leading-relaxed` | `14px` -> `16px` |
| Cabeceras de Tabla (`<th>`) | `text-xs uppercase` | `text-xs md:text-sm font-semibold uppercase tracking-wide` | `12px` -> `14px` |
| Celdas de Datos (`<td>`) | `text-xs` | `text-sm md:text-[15px] leading-snug` | `14px` -> `15px` |
| Badges / Timestamps | `text-[11px]` | `text-xs md:text-sm` | `12px` -> `14px` |
| Toolbar y Paginación | `text-xs` | `text-sm` | `14px` constante |

### 2.2. Eficiencia de Anchura en Formato Web (Desktop Full-Width Táctico)

Para eliminar márgenes desaprovechados en monitores de escritorio (Full HD, QHD, Ultrawide):

1. **Contenedor Elástico de Alta Capacidad:**
   * Las vistas de `/Admin` sustituyen cualquier restricción estrecha (`max-w-4xl`, `max-w-6xl`) por un contenedor fluido `w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12`.
2. **Redistribución de Columnas en `DataTable`:**
   * **Columnas de Metadatos Acotados** (`level`, `statusCode`, `durationMs`, `createdAt`): Mantienen `whitespace-nowrap` con anchos ajustados al contenido real sin desperdiciar espacio.
   * **Columnas de Carga Semántica** (ej. `message` en `/Admin/Logs`): Se erradica la restricción `max-w-md` (`28rem`). La celda pasa a ocupar todo el ancho remanente disponible (`w-full min-w-[280px] max-w-none`), permitiendo visualizar trazas largas en una o dos líneas (`line-clamp-2 hover:line-clamp-none` o rotura controlada `break-words`) sin truncado prematuro.
3. **Rejillas Multi-Columna en Paneles de Observabilidad (`/Admin/System` y `/Admin/Cognitive`):**
   * Uso de CSS Grid adaptativo (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6`) para desplegar tarjetas de KPIs, estado de LanceDB y sondas de red en paralelo cuando exista anchura suficiente.

### 2.3. Adecuación y Ergonomía en Formato Móvil (Responsive Táctico)

Para garantizar la inspección del sistema en pantallas `< 768px`:

1. **Barra de Herramientas (`data-table-toolbar.tsx`) Apilable:**
   * El contenedor pasa a `flex flex-col gap-3 md:flex-row md:items-center md:justify-between`.
   * El buscador global ocupa el 100% del ancho en móvil (`w-full md:w-80 lg:w-96`), y los selectores de filtro por columna (`level`, `context`) se disponen en una rejilla de 2 columnas (`grid grid-cols-2 gap-2 sm:flex sm:flex-wrap`) con altura táctil mínima de `min-h-10` (40px–44px).
2. **Paginación (`data-table-pagination.tsx`) Compacta en Móvil:**
   * Cambia de `flex items-center justify-between` a `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`, centrando los botones de navegación en pantallas pequeñas y evitando el desbordamiento horizontal de los contadores de página.
3. **Desplazamiento Horizontal Contenido en Tablas (`overflow-x-auto`):**
   * El envoltorio de `<table>` incorpora `w-full overflow-x-auto overscroll-x-contain`, permitiendo deslizar horizontalmente la tabla en móvil sin deformar el layout general de la página ni generar barra de scroll en el `<body>`.
   * Soporte mediante clases utilitarias (`hidden sm:table-cell`) o configuración en `ColumnDef<T>` para ocultar columnas de baja prioridad en viewports críticos cuando la vista lo requiera.

---

## 3. Matriz de Artefactos Impactados y Peso Termodinámico

| Artefacto / Ruta | Tipo de Modificación | Context Hops | Impacto Arquitectónico |
| :--- | :--- | :--- | :--- |
| `src/app/Admin/layout.tsx` | Creación / Refactorización | 1 | **Alto:** Contenedor maestro fluido (`max-w-[1920px]`) y escala tipográfica heredable. |
| `src/components/ui/data-table/data-table.tsx` | Evolución UI | 1 | **Alto:** Envoltorio `overflow-x-auto` y estructura `w-full` sin desbordamiento. |
| `src/components/ui/data-table/data-table-toolbar.tsx` | Evolución UI | 1 | **Medio:** Layout apilable `flex-col md:flex-row` y controles táctiles al 100% en móvil. |
| `src/components/ui/data-table/data-table-header.tsx` | Ajuste de Estilos | 1 | **Medio:** Escalado tipográfico de `<th>` (`text-xs md:text-sm`). |
| `src/components/ui/data-table/data-table-cell.tsx` | Ajuste de Estilos | 1 | **Medio:** Escalado tipográfico de `<td>` (`text-sm md:text-[15px]`). |
| `src/components/ui/data-table/data-table-pagination.tsx` | Evolución UI | 1 | **Medio:** Apilamiento responsivo de controles de paginación y selector de densidad. |
| `src/app/Admin/Logs/` | Ajuste de Presentación | 1 | **Medio:** Eliminación de `max-w-md` y `text-[11px]` en definición de columnas de telemetría. |
| `src/app/Admin/System/` y `src/app/Admin/Cognitive/` | Ajuste de Presentación | 1 | **Medio:** Rejillas responsivas para KPIs y adaptación al layout fluido. |
| `src/app/globals.css` | Verificación | 1 | **Bajo:** Validación de directivas `@source` explícitas para Tailwind CSS 4.x. |

---

## 4. Normativas Arquitectónicas (Certificación Yunque S+)

1. **Compatibilidad Estricta con Tailwind CSS 4.x:** Cualquier nuevo archivo de layout o componente bajo `src/app/Admin/` debe estar cubierto por las directivas `@source` explícitas en `globals.css` (respetando la directiva `source(none)` activa en el proyecto).
2. **Desacoplamiento de Dominio Intacto:** Las mejoras responsivas y tipográficas en `src/components/ui/data-table/` se mantienen 100% agnósticas del dominio, operando exclusivamente mediante props y clases CSS.
3. **Tolerancia Cero a `any`:** Si se extiende `ColumnDef<T>` en `types.ts`, se mantendrá el tipado estricto sin emplear `any`.
4. **Superación del Cuarteto de Oráculos:** Ningún cambio se dará por válido sin superar `npx tsc --noEmit`, `npm run lint` (`--max-warnings 0`), `npm test` y `npm run build`.

---

## 5. Criterios de Aceptación (Verificación Empírica)

### Escenario 1: Escalado Tipográfico Global y Erradicación de Micro-Textos
* **Dado** que el operador accede a `/Admin/Logs`, `/Admin/System` o `/Admin/Cognitive`.
* **Cuando** se renderizan las tablas, tarjetas de estado y barras de herramientas.
* **Entonces** el tamaño base de lectura de celdas y textos operativos es de al menos `14px` (`text-sm`) en móvil y `15px–16px` (`text-[15px]` / `text-base`) en escritorio.
* **Y** no existen ocurrencias de `text-[11px]` que dificulten la lectura de estados HTTP o marcas temporales.

### Escenario 2: Aprovechamiento de Anchura en Escritorio (Desktop Full-Width)
* **Dado** un navegador en resolución de escritorio (`>= 1280px` / `1920px`).
* **Cuando** el operador visualiza `/Admin/Logs` o `/Admin/Cognitive`.
* **Entonces** el contenedor administrativo se expande de forma fluida hasta `max-w-[1920px]` aprovechando el ancho de la pantalla.
* **Y** la columna de mensaje de diagnóstico en la tabla de telemetría se expande dinámicamente sin truncarse a los `448px` (`max-w-md`).

### Escenario 3: Adaptación Móvil sin Desbordamiento de Página
* **Dado** un dispositivo móvil o viewport reducido (`375px` de ancho).
* **Cuando** el operador navega por cualquiera de las vistas de `/Admin`.
* **Entonces** el `<body>` de la página no presenta scroll horizontal indeseado (`document.documentElement.scrollWidth <= window.innerWidth`).
* **Y** la barra de herramientas (`DataTableToolbar`) apila verticalmente el buscador global y los selectores de filtro con controles al 100% del ancho disponible, mientras que la tabla permite desplazamiento horizontal aislado dentro de su propio contenedor.

### Escenario 4: Certificación del Cuarteto de Oráculos y Tests Existentes
* **Dado** el conjunto de modificaciones de estilos y estructura en `/Admin` y `DataTable`.
* **Cuando** se ejecutan los oráculos de verificación del repositorio.
* **Entonces** `npx tsc --noEmit`, `npm run lint`, `npm test` y `npm run build` finalizan con 0 errores y 0 advertencias.
