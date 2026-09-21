# [ARQUITECTURA] Cuaderno de Sistemas: Topología Visual de Componentes de Interacción

## Matriz de Indexación Tridimensional
- **Naturaleza:** Especificación de Componentes de Interfaz y Contratos TypeScript.
- **Entorno:** Proyecto BarcelonaXplorer (Front-End Next.js / Tailwind CSS).
- **Entropía Asimilada:** Ruptura con la hegemonía del diseño de "burbujas de chat" genéricas. Creación de una estética de "Orquestación Táctica" que refleje el procesamiento híbrido y elimine la percepción pasiva del tiempo de espera.

---

## 1. Componente Principal: `OrchestratorBlock` (Usuario y Respuesta Lenta)

Este componente abandona la clásica burbuja de mensajería para adoptar la forma de una **Losa de Mando**. Representa decisiones consolidadas, ya sea el input inmutable del usuario o la ruta milimétrica final de la IA.

### Innovación Visual (Diseño Asimétrico)
- **Geometría:** Una tarjeta de bordes afilados (*radius* mínimo) que ocupa gran parte del ancho, transmitiendo densidad de información.
- **El Avatar Desvinculado:** En lugar de estar dentro de la caja, el avatar (la imagen del usuario o el sello de BarcelonaXplorer) flota interceptando el borde superior izquierdo de la tarjeta, rompiendo la cuadrícula bidimensional.
- **Materialidad Condicionada:**
  - Si `role === 'user'`: La tarjeta asume un aspecto opaco, sólido y oscuro (ej. `slate-900`), simbolizando el "Yunque" inamovible de la petición.
  - Si `role === 'ai'`: La tarjeta adopta un efecto *glassmorphism* (fondo translúcido con desenfoque) y un levísimo borde luminoso animado que se detiene cuando la ruta termina de cargarse.

### Contrato de Datos (TypeScript)
```typescript
interface OrchestratorBlockProps {
  role: 'user' | 'ai';
  content: ReactNode | string; // Permite inyectar el JSON parseado a Tailwind
  avatarUrl: string;           // Foto del usuario o Logo BX
  timestamp: Date;
  status?: 'pending' | 'orchestrating' | 'completed'; // Exclusivo para 'ai'
}
```

---

## 2. Componente de Vía Rápida: `TacticalSpark` (Píldoras de Contexto)

Estos componentes operan como las "Chispas de Consciencia" del sistema. No son mensajes conversacionales, sino inyecciones de telemetría y micro-logística que brotan mientras el motor principal trabaja.

### Innovación Visual (Nodos Flotantes)
- **Minimalismo Funcional:** Ausencia total de avatares. Adoptan la forma de cápsulas estrechas e icónicas (tipo *pill* o *badges* extendidos).
- **Jerarquía Espacial:** Se apilan con un margen lateral izquierdo mayor, creando visualmente una "rama" o árbol de procesamiento que cuelga del `OrchestratorBlock` del usuario.
- **Codificación por Color e Icono:** Su diseño muta según la entropía que asimilan. Puede ser un icono de clima, un escudo de advertencia (Escudo Anti-Trampas) o un marcador de movilidad. Aparecen con una animación de desvanecimiento y desplazamiento ascendente (`fade-in-up`), simulando datos desencriptándose en tiempo real.

### Contrato de Datos (TypeScript)
```typescript
interface TacticalSparkProps {
  id: string;
  type: 'weather' | 'security' | 'logistics' | 'affiliation';
  insight: string;             // Ej: "Zonas de carteristas detectadas en el trayecto."
  icon: React.ElementType;     // Componente Lucide/Heroicon
  urgency: 'low' | 'medium' | 'high'; // Define si el borde es neutral, amarillo o rojo vibrante
}
```

---

## 3. Coreografía de la Fricción (Lógica de Montaje)

Para que esta interfaz cobre vida sin colapsar el DOM, el contenedor padre actuará bajo la siguiente coreografía de estados en React. 
**Requisitos de Layout Estructural:** El contenedor principal debe seguir un patrón `flex flex-col h-screen`. La zona de mensajes será `flex-1 overflow-y-auto`, mientras que el área del input permanecerá anclada a la parte inferior (`sticky bottom-0`).

1. **Fase 0 (Latencia):** Pantalla limpia. Solo el *input* de texto y el botón de enviar en el centro/abajo.
2. **Fase 1 (Ignición):** El usuario envía. El *input* se vacía y la caja de texto queda **bloqueada** para evitar concurrencia. Se monta el `OrchestratorBlock` (`role='user'`) desplazándose hacia la parte superior.
3. **Fase 2 (Asimilación):** El motor lento inicia. Paralelamente, un array de estado `sparks[]` comienza a poblarse. Cada vez que entra un dato rápido, se monta un componente `TacticalSpark` justo debajo del bloque del usuario.
4. **Fase 3 (Resolución):** La IA lenta termina. Se monta el `OrchestratorBlock` (`role='ai'`) definitivo debajo de la cascada de chispas. Las píldoras rápidas quedan como un rastro de auditoría de todo el contexto evaluado. Una vez renderizada la respuesta lenta, la caja de texto se **desbloquea**, permitiendo que la conversación prosiga.
5. **Ciclo Iterativo (Multi-Turn):** Cuando el usuario vuelve a interactuar con el *prompt* (después de la Fase 3), la coreografía se repite apilando los nuevos elementos en la parte inferior. Todo el contenido histórico (el bloque del usuario inicial, sus chispas y la respuesta lenta) es empujado hacia arriba (`overflow-y-auto`). El nuevo *prompt* del usuario quedará fijado siempre por debajo de la última respuesta lenta de la IA, creando un hilo cronológico ininterrumpido.

---

## [OPERATIVO] Reglas de Negocio y Coreografía de la Vía Rápida

### 1. Rechazo al Cronómetro Falso (Cadencia por Resolución)
Queda estrictamente prohibido programar la aparición de cajas mediante temporizadores artificiales (ej. `setTimeout` cada 3 segundos). La Vía Rápida debe operar bajo el paradigma de "Chispas de Consciencia"; cada componente `TacticalSpark` solo se renderiza cuando el sistema real resuelve una promesa asíncrona de extracción de datos.
- **Fase Inmediata (0 - 500ms):** Datos de latencia cero. El sistema cruza las palabras clave del usuario con el reloj del servidor y la API meteorológica. (Ej. Chispa de Clima: "Lluvia detectada en Barcelona. Priorizando nodos de interior en la ruta.")
- **Fase Intermedia (500ms - 1.5s):** Consultas a la base de datos relacional MySQL. Se buscan coincidencias geográficas para disparar el Escudo Anti-Trampas. (Ej. Chispa de Seguridad: "Aviso: Zona de Sagrada Familia identificada. Se evitarán restaurantes en la Avenida Gaudí por baja relación calidad-precio.")
- **Fase Lógica (1.5s - 3s):** Resolución de micro-prompts paralelos (explicados en el punto 2).

### 2. Estrategia de Micro-Prompts (El Enrutamiento Paralelo)
El prompt inicial del usuario no se envía de nuevo tal cual. La arquitectura debe aplicar un patrón Router/BFF. Cuando el usuario pulsa enviar, el servidor (Next.js) dispara dos flujos paralelos independientes:
- **Flujo Pesado (La Ruta):** El prompt original va al LLM principal (ej. Gemini 1.5 Pro) con las instrucciones completas para generar el JSON cronológico.
- **Flujo Táctico (La Vía Rápida):** El servidor inyecta el prompt del usuario en un LLM mucho más rápido y económico (ej. Gemini 1.5 Flash) utilizando Micro-Prompts predefinidos que exigen respuestas de un solo string.

*Ejemplos de Micro-Prompts inyectados al modelo rápido, concatenados con la petición del usuario:*
- **Prompt Logístico:** "Actúa como un conserje de Barcelona. El usuario pide: '{prompt_usuario}'. Dime en una sola frase corta una advertencia sobre transporte o distancias para este plan. No saludes. Ve al grano."
- **Prompt Cultural:** "El usuario pide: '{prompt_usuario}'. Dime en una sola frase corta un dato curioso o de protocolo local (ej. horarios comerciales, vestimenta, propinas) vital para esta petición."

### 3. Límite de Entropía Visual (Filtro C)
Para no saturar al usuario, se aplica el Filtro C (Descarte de ruido por irrelevancia) a la interfaz.
- **Tope Máximo:** La Vía Rápida nunca generará más de 3 cajas (`TacticalSparks`) por cada petición.
- **Silencio Táctico:** Si los micro-prompts paralelos tardan más de lo que tarda la respuesta principal en resolverse, se abortan automáticamente. La interfaz debe dar prioridad absoluta a renderizar el bloque de la ruta final; las chispas son acompañamiento, no bloqueadores.