[OPERATIVO] Historia de Usuario: Panel de Observabilidad Cognitiva (Memoria LanceDB en Admin - Cognitive)

Estatus: Propuesta / En Refinamiento
Módulo: Administración, Observabilidad y Persistencia Vectorial (/Admin/Cognitive)
Estimación Táctica: Pendiente

Matriz de Indexación Tridimensional
Naturaleza: Observabilidad táctica y seguimiento funcional del motor RAG (LanceDB).

Entorno: Ecosistema de control /Admin/Cognitive (o subruta equivalente), Next.js App Router, Cliente React interactivo.

Entropía Asimilada: Superación de la ceguera espacial respecto a la asimilación del contexto de usuario. Se capitaliza la reciente forja del componente genérico DataTable<T> para proyectar los datos de las matrices hiper-densas (JSON) y los identificadores de sesión (UUID) en una interfaz gobernable, evitando consultas destructivas o manuales por CLI.

1. Descripción General (INVEST)
Como Operador Técnico y Centinela del Nodo 11,
Quiero disponer de un panel de observabilidad dedicado (/Admin/Cognitive) que extraiga y renderice los vectores y metadatos almacenados en LanceDB mediante la forja tabular interactiva (DataTable<T>),
Para realizar un seguimiento funcional de la evolución de las sesiones de los usuarios (asociadas a su Identidad Sombra/UUID), auditar la precisión de las matrices hiper-densas generadas por la Aduana Universal (SLM) y diagnosticar anomalías en la inyección de contexto RAG sin requerir acceso directo al contenedor.

2. Justificación Arquitectónica (La Vía del Yunque)
La implementación de esta interfaz no requiere fabricar nuevas herramientas de UI, sino coreografiar los órganos ya establecidos en la arquitectura:

Reutilización del Componente Genérico: La visualización se delegará estrictamente al componente DataTable<T>. Esto garantiza la gobernanza de la volumetría del DOM mediante su paginación táctica y el filtrado en cliente, protegiendo al navegador si la base de datos vectorial escala a miles de registros.

Aislamiento Hexagonal: La vista no consumirá a LanceDB de forma directa. Se forjará un caso de uso (GetCognitiveSessionsUseCase) que dialogará con el adaptador de persistencia vectorial (LanceDbVectorAdapter), retornando un DTO limpio y libre de any (CognitiveSessionItem) hacia la capa de presentación.

Trazabilidad de Identidad Sombra: Dado que el sistema no guarda transcripciones literales para proteger el consumo de tokens, la tabla expondrá el UUID inyectado por el Edge Middleware (middleware.ts) junto con el payload de las variables destiladas (ej. time_window, group_size, budget), permitiendo auditar la transición del estado de la sesión hasta alcanzar el umbral de supervivencia (100% de la Matriz de Densidad).

3. Propuesta de Topología Tabular (ColumnDef)
Para maximizar la observabilidad, las columnas de la DataTable se estructurarán en los siguientes vectores de información:

Identidad (UUID): El identificador perimetral de la sesión, truncado visualmente pero copiable.

Última Actividad (Timestamp): Fecha y hora de la última mutación del vector para evaluar la latencia de la sesión.

Estado de Maduración (Badge): Indicador visual calculado en caliente que evalúa si la matriz está en Fase Inerte o ha alcanzado el Desbloqueo S+ Grade (lista para generar ruta).

Matriz Hiper-Densa (Payload JSON): Renderizado de las variables destiladas por el SLM. (Puede implementarse como un componente expansible o un visualizador JSON compactado en la celda).

Distancia / Relevancia (Opcional): Si se añade una función de búsqueda semántica en la tabla para auditar el RAG, columna indicando el score de similitud vectorial.

4. Criterios de Aceptación (Verificación Empírica)
Escenario 1: Renderizado Seguro y Gobernanza de Volumetría

Dado un volumen de LanceDB con múltiples sesiones activas e históricas.

Cuando el operador accede a la ruta protegida /Admin/Cognitive.

Entonces el sistema recupera los registros a través del caso de uso correspondiente.

Y los inyecta en el componente <DataTable columns="{cognitiveColumns}" data="{sessions}" pageSize="{25}"/>.

Y el DOM de React renderiza únicamente los 25 primeros registros, garantizando la fluidez a 60 FPS sin fugas de memoria.

Escenario 2: Filtrado Multidimensional por Identidad o Estado

Dado el panel de observabilidad cargado con la información vectorial.

Cuando el operador introduce un UUID específico en la barra de herramientas superior, o selecciona un estado de matriz (ej. "Saturación Alcanzada") en el filtro de columna.

Entonces el pipeline reactivo aísla y muestra de forma inmediata la trazabilidad exacta de ese usuario o grupo de usuarios.

Escenario 3: Estricto Blindaje Perimetral

Dado un intento de acceso a /Admin/Cognitive.

Cuando la petición cruza el Edge Runtime del Nodo 11.

Entonces el middleware.ts exige autenticación Basic Auth (RFC 7617), denegando fulminantemente la exposición de la memoria cognitiva a escáneres o entidades no autorizadas mediante un error 401/403.

5. Tarjetas de Telemetría Cognitiva (El Dashboard Superior)
Bajo la directriz de la Vía del Yunque, el dashboard no mostrará "métricas de vanidad" (visitas o clics ciegos), sino indicadores estrictamente relacionados con el rendimiento de la memoria RAG y la termodinámica de la interacción:

Métrica 1: Tasa de Saturación (Zeigarnik Score):

Definición: Porcentaje de sesiones activas que han logrado superar el survival_threshold de su matriz de densidad, desbloqueando el "Modo Explorador S+ Grade".

Valor Operativo: Evalúa si la Gamificación Sensorial (Efecto Zeigarnik) está funcionando o si los usuarios se frustran antes de completar el contexto necesario.

Métrica 2: Entropía de Ingestión (Latencia Conversacional):

Definición: Promedio de interacciones (prompts) requeridas por la Aduana Universal (SLM) para lograr destilar una variable válida e inyectarla en LanceDB.

Valor Operativo: Mide la eficiencia del modelo SLM. Si el promedio de turnos es excesivamente alto, el SLM está fallando en su rebote conversacional o el usuario está inyectando demasiado ruido (requiriendo ajuste en el system prompt defensivo).

Métrica 3: Tasa de Anclaje Táctico:

Definición: Porcentaje de sesiones efímeras (UUID en Edge Middleware) que han ejecutado el deep link hacia el Telegram Bridge, consolidando su identidad en MySQL.

Valor Operativo: Mide el éxito de la Táctica del Refugio. Confirma si la utilidad de las rutas generadas justifica que el usuario ceda el control de su canal de notificaciones.

Métrica 4: Densidad Vectorial (Volumetría LanceDB):

Definición: Conteo absoluto de identidades sombra (UUIDs) y tamaño del volumen físico (/app/vector_storage) en megabytes.

Valor Operativo: Actúa como un sensor temprano de Amnesia Termodinámica o saturación de disco, indicando cuándo será necesario activar el Protocolo de Poda Ontológica.

6. Criterios de Aceptación Adicionales (Verificación Empírica)
Escenario 4: Renderizado de Métricas Reactivas (Suspense Boundaries)

Dado el acceso a /Admin/Cognitive.

Cuando la página inicia su carga.

Entonces las tarjetas de telemetría (KPIs) y la DataTable se renderizan de forma independiente mediante Streaming (<Suspense>).

Y las tarjetas de métricas muestran skeletons pulsantes mientras se computan los promedios, sin bloquear la interactividad de la barra de búsqueda tabular.

Escenario 5: Alerta de Fatiga de Abandono (Fase Inerte)

Dado un cálculo del Zeigarnik Score.

Cuando la Tasa de Saturación cae por debajo del 30% (demasiadas sesiones abandonadas en Fase Inerte).

Entonces el indicador visual de la tarjeta muta a estado Ámbar (Advertencia Térmica).

Y emite una alerta visual sugiriendo la revisión del catálogo polimórfico de matrices.
