[ARQUITECTURA] Historia de Usuario 9 (Refinada): Arquitectura Relacional de Templates Temáticos y Taxonomía Dinámica
Estatus: Refinado / Listo para Implementación
Módulo: Persistencia Relacional (MySQL / Prisma) y Motor Híbrido

1. Descripción General
Como Arquitecto de Software y Gestor de Contenidos,
Quiero establecer una estructura de base de datos relacional para el Catálogo de "Templates de Guías" que incluya una tabla independiente para la taxonomía de Categorías, vinculada a las cabeceras de ruta y sus matrices de ítems secuenciales,
Para poder crear y clasificar nuevas temáticas (ej. Literatura, Cine, Arquitectura) dinámicamente desde un panel de administración, sin necesidad de ejecutar migraciones de código, y nutrir al Motor Híbrido con paquetes de información hiper-curada.

2. Justificación Arquitectónica (Normalización y Principio OCP)
Aplicar la Vía del Yunque sobre el modelo de datos exige anticipar la entropía del crecimiento. Restringir las categorías a una enumeración (Enum) estática en el código base forzaría un ciclo de despliegue completo y una migración de base de datos por cada nueva temática que el proyecto decida explorar.
Al extraer la taxonomía hacia una entidad independiente (TemplateCategory), se respeta el Principio de Abierto/Cerrado (OCP). El núcleo de datos queda abierto a la expansión infinita de temáticas, pero cerrado a la modificación estructural de las tablas principales, otorgando soberanía absoluta al Gestor de Contenidos desde el Nodo 11.

3. Forja del Esquema Relacional (Prisma ORM)
La estructura muta hacia un modelo jerárquico de tres niveles (1:N -> 1:N) definido en el contrato schema.prisma:

A. Entidad: TemplateCategory (La Taxonomía Base)
Gobierna la naturaleza del catálogo. Permite la inyección dinámica de temáticas.

id: Identificador único (UUID o CUID).

slug: Cadena normalizada para URLs amigables (ej. "rutas-literarias").

name: Nombre legible de la categoría (ej. "Literatura y Ficción").

description: Contexto semántico para calibrar al orquestador principal sobre cómo debe interpretar las rutas que cuelguen de esta categoría.

B. Entidad: GuideTemplate (La Cabecera de Ruta)
Define la identidad de la ruta temática específica.

id: Identificador único.

category_id: Clave foránea (FK) apuntando a TemplateCategory.

title: Nombre de la guía (ej. "La Barcelona de La Sombra del Viento").

abstract: Descripción de alto nivel y gancho narrativo.

estimated_duration: Eje cronológico base (en minutos) para el cálculo logístico del motor.

C. Entidad: TemplateItem (Los Nodos / Paradas)
Desglosa los puntos físicos o conceptuales de la guía.

id: Identificador único.

template_id: Clave foránea (FK) apuntando a GuideTemplate.

order_index: Entero que fuerza la secuencialidad innegociable de la ruta.

title: Nombre del nodo (ej. "Librería Sempere e Hijos").

description: Extracto narrativo.

tactical_metadata: Objeto JSON tipado para inyectar la sabiduría hiperlocal (Escudo Anti-Trampas, micro-logística y advertencias de seguridad).

affiliate_refs: Claves foráneas o IDs externos para la inyección de botones CPA (TheFork, Civitatis) contextualizados en el nodo.

4. Coreografía de Integración Híbrida
Enrutamiento Dinámico de Interfaz: La UI de Next.js PWA utilizará el slug de la categoría para generar páginas de índice de forma automática (ej. /guias/rutas-literarias/la-sombra-del-viento).

Aislamiento Vectorial: Cuando el orquestador asimile un GuideTemplate mediante RAG para adaptarlo a un usuario específico, extraerá la description de la TemplateCategory padre para ajustar su tono (ej. adoptando un estilo narrativo para rutas literarias, o un tono puramente histórico para arquitectura romana).

5. Criterios de Aceptación (Verificación Empírica)
Escenario 1: Inyección Dinámica de Taxonomía (Fricción Cero en Admin)

Dado el panel de administración /Admin/System conectado a MySQL.

Cuando el operador decide crear una nueva vertical de negocio para "Rutas de Cine".

Entonces el operador inserta un nuevo registro en la tabla TemplateCategory sin necesidad de alterar el archivo schema.prisma.

Y el monolito expone inmediatamente la nueva categoría en el frontend y en el contexto del LLM ligero.

Escenario 2: Integridad Estructural del Modelo Híbrido

Dado el esquema relacional con claves foráneas estrictas.

Cuando se intenta eliminar una TemplateCategory (ej. "Misterio") que contiene GuideTemplates asociados.

Entonces el motor relacional bloquea la operación (o ejecuta un borrado en cascada según se defina la política de integridad), garantizando que el sistema nunca apunte a categorías fantasma y protegiendo el Filtro Lógico (Filtro A).

Escenario 3: Generación del Árbol Jerárquico en Consultas

Dado un usuario que solicita al conserje: "Muéstrame todas las opciones que tenéis sobre literatura".

Cuando el sistema procesa la intención.

Entonces Prisma ejecuta una consulta con include para recuperar la categoría "Literatura" junto a todos sus GuideTemplates anidados.

Y la interfaz renderiza el catálogo agrupado sin penalizar el rendimiento del servidor.
