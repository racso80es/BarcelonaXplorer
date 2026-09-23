[ARQUITECTURA] Documento Destilado: Especificación Funcional S+ Grade - Ecosistema BarcelonaXplorer
Este documento consolida la arquitectura funcional, lógica de negocio y directrices operativas del proyecto BarcelonaXplorer, organizadas en módulos lógicos para su posterior implementación en la tubería de desarrollo.

Módulo 1: Perímetro de Seguridad, Identidad y Anclaje (Fricción Cero)
1.1. Identidad Sombra (Edge Middleware)
Funcionalidad: Asignación de identidad temporal e invisible al dispositivo del usuario desde el primer milisegundo, eliminando formularios de registro (Fricción Cero).

Mecánica: El interceptor perimetral (src/middleware.ts) audita cada petición. Si no halla la cookie bx_session_id, genera un UUID v4 y lo inyecta como cookie criptográfica (HttpOnly, Secure, SameSite=Lax).

Impacto: Toda entropía y contexto asimilado por la IA se etiqueta y vincula a este UUID en el motor vectorial.

1.2. Anclaje Táctico (Telegram Bridge)
Funcionalidad: Mecanismo voluntario de persistencia de larga duración (Táctica del Refugio).

Mecánica: Al finalizar una ruta S+ Grade, la UI despliega un botón para recibir alertas tácticas. Este botón ejecuta un deep link paramétrico (t.me/BXplorerBot?start=<UUID>). El webhook del backend extrae el UUID y el chat_id de Telegram, consolidando la relación en la base de datos MySQL relacional. Esto permite recuperar la sesión sin cookies en cualquier dispositivo.

1.3. Anclaje Geográfico Absoluto
Funcionalidad: Limitación estricta del contexto a Barcelona ciudad para proteger el motor de alucinaciones (Filtro A) y evitar peticiones fuera de la base de datos curada.

Mecánica: El modelo ligero (SLM) inyecta silenciosamente "Barcelona" en la petición de búsqueda. Si el usuario intenta forzar otras ciudades, el SLM intercepta y bloquea el flujo con un rebote conversacional, protegiendo el consumo del orquestador pesado.

Módulo 2: Infraestructura y Órganos Sensoriales
2.1. Persistencia Vectorial Embebida (LanceDB)
Funcionalidad: Almacenamiento vectorial sin latencia de red para la memoria cognitiva de los usuarios.

Mecánica: LanceDB opera como motor embebido dentro del proceso Node.js/Next.js (Cero contenedores paralelos). La persistencia se asegura mediante un mapeo de volumen local (Bind Mount) en el sistema anfitrión del servidor (Nodo 11), garantizando que el historial sobreviva a los ciclos automáticos de despliegue de Ansistrano.

2.2. Sensor Termodinámico Vectorial (/Admin/System)
Funcionalidad: Auditoría en tiempo real de la salud del motor LanceDB y sus permisos de sistema de archivos.

Mecánica: La ruta de administración ejecuta una sonda de lectura/escritura (force-dynamic) sobre el directorio local de LanceDB. Si falla por permisos o corrupción, el semáforo cambia a Rojo/Ámbar y el error se vuelca en una DataTable interactiva bajo el nivel ERROR del contexto SYSTEM.

Módulo 3: Motor Cognitivo y Orquestación (SLM + RAG)
3.1. Aduana Universal y Triaje Entrópico (SLM)
Funcionalidad: Primera línea defensiva operada por un LLM ligero para descartar ruido y procesar la entrada asimétrica.

Mecánica: El SLM extrae variables de forma orgánica (solo una por turno) sin formato de interrogatorio. Transmuta la conversación en un objeto JSON estricto tolerante a cero alucinaciones (Tipado Zod) y lo delega al motor principal. Aplica el Filtro C para neutralizar interacciones inútiles.

3.2. Ignición Contextual (Saludo Dinámico)
Funcionalidad: Saludo de apertura proactivo en la carga inicial de la aplicación.

Mecánica: El sistema inyecta metadatos (hora del servidor, dispositivo, clima vía API) y la memoria previa del usuario recuperada de LanceDB en el SLM. El agente forja un saludo Zero-Shot ("Llueve, ¿buscamos un museo?"), eliminando el síndrome de la caja vacía.

3.3. Memoria Cognitiva Vectorial Optimizada (RAG)
Funcionalidad: Continuidad semántica de la sesión sin Amnesia Termodinámica ni sobrecarga del contexto del LLM pesado.

Mecánica: La Aduana Universal no vectoriza transcripciones literales. Destila las interacciones en matrices JSON hiper-densas (ej. [Grupo: 2, Presupuesto: Bajo]) y las almacena en LanceDB. Ante una nueva petición, el motor RAG ensambla un payload oculto con estas variables y se lo inyecta al orquestador principal, minimizando el gasto de tokens.

Módulo 4: Reglas de Negocio y Estructura de Datos (El Peaje Termodinámico)
4.1. Catálogo Polimórfico de Matrices de Densidad
Funcionalidad: Estructuración de los datos de entrada según el tipo de ruta deseada (Exploración, Ocio Nocturno, Gastronomía), dictando las leyes de supervivencia de cada caso.

Mecánica: Uso del Patrón Envelope (Envoltorio) y el Patrón Registry definido en src/domain/schemas/matrix.ts con Zod. Cada matriz incluye:

matrix_id y description (Metadatos).

rules: Motor de reglas incrustado con el survival_threshold (Umbral operativo) y los weights (pesos porcentuales de cada variable).

payload: Variables tipadas (ej. time_window, group_size).

4.2. Taxonomía Dinámica y Templates Estáticos (Motor Híbrido)
Funcionalidad: Base de datos relacional para forjar rutas de autor hiper-curadas (ej. literatura, arquitectura) que previenen la alucinación de la IA.

Mecánica (MySQL/Prisma): Estructura jerárquica con tres entidades base:

TemplateCategory: Taxonomía dinámica inyectable desde administración (ej. "Rutas Literarias").

GuideTemplate: Cabecera de la ruta.

TemplateItem: Nodos secuenciales de la ruta que incluyen tactical_metadata (Escudo Anti-Trampas) y affiliate_refs (Botones CPA preventivos).

Módulo 5: Experiencia de Usuario y Gamificación (UI/UX)
5.1. Gamificación Sensorial (Medidor Térmico Agnóstico)
Funcionalidad: Incentivo visual para completar datos de la matriz sin requerir formularios duros, basado en el Efecto Zeigarnik.

Mecánica: Un componente UI reactivo e independiente de la lógica de negocio evalúa la fórmula suma_pesos >= rules.survival_threshold.

Fase Inerte: Tonos oscuros, botón bloqueado.

Desbloqueo (Umbral superado): El anillo perimetral muta (ej. emerald-400 pulsante) indicando que la ruta ya es calculable.

Saturación (100%): Desbloqueo visual del "Modo Explorador S+ Grade".

5.2. Escudo de Supervivencia y Recompensas Logísticas (Fase de Generación)
Funcionalidad: Recompensa de alto valor inyectada en la planificación por haber alcanzado el 100% de la Matriz de Densidad.

Mecánica: Si el usuario satura la matriz, el orquestador libera los tactical_metadata de los nodos: advertencias de honestidad radical sobre la zona, alertas de carteristas y drops preventivos con enlaces de afiliación para asegurar reservas (ej. TheFork, Tiqets) justo en el momento de la planificación.

Módulo 6: Horizonte Evolutivo (Pendiente / Teórico)
6.1. Ecosistema Reactivo y Drops de Alivio (Fase de Ejecución)
Visión a futuro: Convertir el sistema de un orquestador pasivo a un ecosistema reactivo basado en eventos (EDA). Utilizando la Identidad Anclada de Telegram, el motor evaluará en tiempo real la fatiga geométrica (kilómetros acumulados) o eventos climáticos. Disparará drops de alivio táctico (ej. enlaces a Cabify tras 5km caminando o redirección a interiores si la API reporta lluvia inminente).