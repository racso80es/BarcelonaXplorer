[OPERATIVO] Historia de Usuario: Panel de Observabilidad Cognitiva (Memoria LanceDB en Admin - Cognitive)

Estatus: Propuesta / En Refinamiento (Alineada con Red Teaming PBI-COG-MEM-005)
Módulo: Administración, Observabilidad y Persistencia Vectorial (/Admin/Cognitive)
Estimación Táctica: 5 Story Points

Matriz de Indexación Tridimensional
Naturaleza: Observabilidad táctica y seguimiento funcional del motor RAG (LanceDB) con blindaje analítico Anti-OOM.

Entorno: Ecosistema de control /Admin/Cognitive (o subruta equivalente), Next.js App Router, Cliente React interactivo, MySQL para agregaciones y LanceDB para recuperación acotada.

Entropía Asimilada: Superación de la ceguera espacial respecto a la asimilación del contexto de usuario. Se capitaliza la forja del componente genérico DataTable<T> para proyectar los datos de las matrices hiper-densas (JSON) y los identificadores de sesión (UUID) en una interfaz gobernable. Bajo el ataque de Red Teaming, se erradica la vulnerabilidad de colapso por OOM segregando las agregaciones analíticas hacia MySQL y aplicando consultas acotadas defensivas (limit: 100) sobre LanceDB.

1. Descripción General (INVEST)
Como Operador Técnico y Centinela del Nodo 11,
Quiero disponer de un panel de observabilidad dedicado (/Admin/Cognitive) que extraiga y renderice los vectores y metadatos recientes almacenados en LanceDB mediante la forja tabular interactiva (DataTable<T>) y compute métricas de maduración sobre MySQL,
Para realizar un seguimiento funcional de la evolución de las sesiones de los usuarios (asociadas a su Identidad Sombra/UUID), auditar la precisión de las matrices hiper-densas generadas por la Aduana Universal (SLM) y diagnosticar anomalías en la inyección de contexto RAG sin provocar asfixia térmica por OOM ni degradación del navegador.

2. Justificación Arquitectónica (La Vía del Yunque y Red Teaming)
La implementación de esta interfaz coreografía los órganos ya establecidos en la arquitectura bajo principios de resiliencia estricta:

Reutilización del Componente Genérico con Ingesta Acotada (Bounded Query): La visualización se delega al componente DataTable<T>. Si bien la tabla pagina en cliente (.slice()), el caso de uso (GetCognitiveSessionsUseCase) impone un límite estricto en la extracción de persistencia (limit: 100 ordenado por timestamp descendente). Esto previene que una ingesta masiva de miles de registros colapse la serialización JSON, la red o la memoria de JavaScript.

Aislamiento Hexagonal y Segregación Analítica (MySQL vs LanceDB): 
- LanceDB: Se destina exclusivamente a la recuperación vectorial RAG y al listado acotado de las 100 memorias cognitivas más recientes. Queda terminantemente prohibido ejecutar Array.reduce() o escaneos masivos en Node.js sobre LanceDB.
- MySQL (Prisma): Asume el cómputo de métricas analíticas agregadas (Zeigarnik Score, Entropía de Ingestión, Anclaje en Telegram), resolviendo promedios y conteos en milisegundos mediante índices B-Tree relacionales sin consumir RAM de la aplicación web.

Trazabilidad de Identidad Sombra: Dado que el sistema no guarda transcripciones literales para proteger el consumo de tokens, la tabla expone el UUID inyectado por la API perimetral (/api/triage) junto con el payload de las variables destiladas (ej. time_window, group_size, vibe, districts), permitiendo auditar la transición del estado de la sesión hasta alcanzar el umbral de supervivencia (100% de la Matriz de Densidad).

3. Propuesta de Topología Tabular (ColumnDef)
Para maximizar la observabilidad, las columnas de la DataTable se estructurarán en los siguientes vectores de información:

Identidad (UUID): El identificador perimetral de la sesión, truncado visualmente pero copiable.

Última Actividad (Timestamp): Fecha y hora de la última mutación del vector para evaluar la latencia de la sesión.

Estado de Maduración (Badge): Indicador visual calculado que evalúa si la matriz está en Fase Inerte o ha alcanzado el Desbloqueo S+ Grade (lista para generar ruta).

Matriz Hiper-Densa (Payload JSON): Renderizado de las variables destiladas por el SLM en formato denso compacto.

Distancia / Relevancia (Opcional): Si se añade una función de búsqueda semántica en la tabla para auditar el RAG, columna indicando el score de similitud vectorial.

4. Criterios de Aceptación (Verificación Empírica)
Escenario 1: Renderizado Seguro y Extracción Acotada (Anti-OOM)
Dado un volumen de LanceDB con miles de sesiones históricas.
Cuando el operador accede a la ruta protegida /Admin/Cognitive.
Entonces el caso de uso GetCognitiveSessionsUseCase extrae como máximo los 100 registros cognitivos más recientes desde LanceDB (limit: 100).
Y los inyecta en el componente <DataTable columns="{cognitiveColumns}" data="{sessions}" pageSize="{25}"/>.
Y el DOM de React renderiza fluidamente a 60 FPS sin saturación de memoria en cliente ni sobrecarga en SSR.

Escenario 2: Filtrado Multidimensional por Identidad o Estado
Dado el panel de observabilidad cargado con la información vectorial reciente.
Cuando el operador introduce un UUID específico en la barra de herramientas superior, o selecciona un estado de matriz (ej. "Saturación Alcanzada") en el filtro de columna.
Entonces el pipeline reactivo aísla y muestra de forma inmediata la trazabilidad exacta de ese usuario o grupo de usuarios.

Escenario 3: Estricto Blindaje Perimetral
Dado un intento de acceso a /Admin/Cognitive.
Cuando la petición cruza el Edge Runtime del Nodo 11.
Entonces el middleware.ts exige autenticación Basic Auth (RFC 7617), denegando fulminantemente la exposición de la memoria cognitiva a escáneres o entidades no autorizadas mediante un error 401/403.

5. Tarjetas de Telemetría Cognitiva (El Dashboard Superior - Vía MySQL)
Bajo la directriz de la Vía del Yunque, el dashboard no ejecuta agregaciones sobre LanceDB, sino que delega el cálculo a MySQL para blindar al servidor contra asfixia térmica:

Métrica 1: Tasa de Saturación (Zeigarnik Score):
Definición: Porcentaje de sesiones activas que han logrado superar el survival_threshold de su matriz de densidad, desbloqueando el "Modo Explorador S+ Grade".
Motor de Cálculo: MySQL (Prisma), evaluando registros de triaje y estados consolidados.
Valor Operativo: Evalúa si la Gamificación Sensorial (Efecto Zeigarnik) está funcionando o si los usuarios se frustran antes de completar el contexto necesario.

Métrica 2: Entropía de Ingestión (Latencia Conversacional):
Definición: Promedio de interacciones (prompts) requeridas por la Aduana Universal (SLM) para lograr destilar una variable válida e inyectarla en LanceDB.
Motor de Cálculo: MySQL (Prisma), calculando AVG(turns) desde la bitácora de telemetría.
Valor Operativo: Mide la eficiencia del modelo SLM. Si el promedio de turnos es excesivamente alto, el SLM está fallando en su rebote conversacional o el usuario está inyectando demasiado ruido.

Métrica 3: Tasa de Anclaje Táctico:
Definición: Porcentaje de sesiones efímeras (UUID) que han ejecutado el deep link hacia el Telegram Bridge, consolidando su identidad en MySQL.
Motor de Cálculo: MySQL (Prisma), mediante JOIN / COUNT relacional sobre UserAnchor.
Valor Operativo: Mide el éxito de la Táctica del Refugio. Confirma si la utilidad de las rutas generadas justifica que el usuario ceda el control de su canal de notificaciones.

Métrica 4: Densidad Vectorial (Volumetría LanceDB):
Definición: Conteo de tablas registradas y tamaño del volumen físico (/app/vector_storage) en megabytes obtenido de la sonda de disco.
Motor de Cálculo: LanceDbVectorAdapter.ping().
Valor Operativo: Actúa como un sensor temprano de saturación de disco, indicando cuándo será necesario activar el Protocolo de Poda Ontológica.

6. Criterios de Aceptación Adicionales (Verificación Empírica)
Escenario 4: Renderizado de Métricas Reactivas (Suspense Boundaries)
Dado el acceso a /Admin/Cognitive.
Cuando la página inicia su carga.
Entonces las tarjetas de telemetría (KPIs de MySQL) y la DataTable de LanceDB se renderizan de forma independiente mediante Streaming (<Suspense>).
Y las tarjetas de métricas muestran skeletons pulsantes mientras MySQL computa los promedios, sin bloquear la interactividad de la barra de búsqueda tabular.

Escenario 5: Cero Asfixia Térmica por Agregaciones
Dado un volumen con 10.000 sesiones históricas.
Cuando se solicitan las métricas del Zeigarnik Score y Entropía de Ingestión.
Entonces el backend no carga vectores ni metadatos a la memoria RAM de Node.js.
Y la respuesta analítica se genera en menos de 50 ms directamente desde la base de datos relacional.
