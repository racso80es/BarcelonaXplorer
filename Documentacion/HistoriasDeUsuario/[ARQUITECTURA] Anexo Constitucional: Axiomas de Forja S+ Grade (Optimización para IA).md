# [ARQUITECTURA] Anexo Constitucional: Axiomas de Forja S+ Grade (Optimización para IA)

**Estatus:** Canónico / Jurisdicción Constitucional Vigente  
**Fecha de Ratificación:** 2026-09-25  
**Autor:** Vértice Biológico / Nodo de Control  

**Mandato de Ejecución:**  
Toda IA obrera, agente o entidad que modifique, forje o audite código en este ecosistema queda sometida a la siguiente jurisdicción técnica. La violación de cualquiera de estos axiomas resultará en el rechazo fulminante del artefacto en la Aduana de Fricción.

---

### I. Ley de Economía Termodinámica (Localidad de Comportamiento)
- **Directriz:** Se prohíbe la dispersión entrópica del código. Para minimizar los saltos espaciales (*context hops*) y proteger la memoria de trabajo del modelo, la lógica de validación, la mutación de estado y el contrato de entrada/salida deben agruparse funcionalmente (*Vertical Slicing*) siempre que no se viole la pureza del dominio.
- **Restricción:** Todo diseño que obligue a una IA a procesar más de tres archivos distribuidos para comprender o alterar una operación atómica será considerado ineficiente y deberá ser refactorizado para centralizar su contexto.

---

### II. Tolerancia Cero a la Inferencia (Fronteras Deterministas)
- **Directriz:** Queda proscrito el uso del tipo `any` y el tipado dinámico. Todo payload o flujo de datos de entrada debe ser interceptado y parseado mediante esquemas estrictos de autovalidación (ej. Zod) en la frontera de la infraestructura.
- **Directriz:** Para erradicar la "obsesión por los primitivos", los conceptos de negocio deben forjarse invariablemente como Objetos de Valor (*Value Objects*) inmutables que validen su integridad en el constructor. La IA no tiene permiso para deducir o inferir el formato válido de los datos.

---

### III. Diseño Declarativo sobre Lógica Imperativa
- **Directriz:** Antes de inyectar lógica condicional imperativa para gobernar el flujo del sistema, la IA tiene el mandato de evaluar si el comportamiento puede transmutarse en configuraciones declarativas (matrices de densidad, esquemas JSON o diccionarios YAML).
- **Directriz:** Alterar una configuración estática autovalidada es termodinámicamente superior a reescribir pipelines de componentes.

---

### IV. El Peaje del Oráculo (Aduana de Fricción)
- **Directriz:** La IA de ejecución carece de soberanía para dar por válido su propio código. El artefacto solo adquiere estado ejecutable si cruza en verde el Linter de Arquitectura (*AST Enforcement*) y la suite de pruebas automatizadas.
- **Directriz:** Ante un bloqueo en la aduana, la IA está obligada a utilizar el volcado de error determinista del compilador o de las pruebas como única fuente de verdad para aplicar el desarrollo Kaizen iterativo sobre el código fallido.

---

### V. Ejecución Encapsulada y Transparencia Estructural
- **Directriz:** Se prohíbe taxativamente la metaprogramación opaca, la inyección de dependencias implícita en tiempo de ejecución o cualquier técnica de reflexión profunda que ciegue el análisis estático. El árbol sintáctico debe ser 100% predecible en una ventana de contexto plana.
- **Directriz:** Toda comunicación con cápsulas operativas debe someterse al contrato inmutable de entrada y salida JSON por stdin/stdout. El sobre de respuesta siempre respetará la estructura predecible (`success`, `exitCode`, `result`, `feedback`), garantizando que la orquestación reconozca el estatus del proceso sin necesidad de parsear texto libre.
