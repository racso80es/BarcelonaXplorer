[ARQUITECTURA] Cuaderno de Sistemas: Topología de Persistencia Híbrida (Next.js + MySQL)

Matriz de Indexación Tridimensional:
Naturaleza: Infraestructura Backend y Motor de Base de Datos.
Entorno: Nodo de Producción Headless (PC 11 @ 10.0.10.11).
Entropía Asimilada: Consolidación del modelo de base de datos relacional (MySQL) para el almacenamiento de Templates estáticos, manteniendo la integridad del monolito Next.js sin fragmentación de repositorios.

1. Modelo de Despliegue Consolidado (Vía del Yunque)
Se descarta la separación física entre Frontend (React) y Backend (API externa). La arquitectura se fundamenta en el patrón BFF (Backend For Frontend) utilizando las capacidades nativas de Next.js (App Router).

Código Único: Las interfaces de usuario (Client Components), la lógica de servidor (Server Components) y los endpoints de datos (Route Handlers /api/) conviven en el mismo repositorio y se compilan en un único contenedor de producción ligero (Standalone).

Eficiencia Logística: Se evita la duplicación de pipelines de Ansible, configuración de CORS y mantenimiento de múltiples Dockerfiles.

2. Inyección del Motor Relacional (MySQL)
La base de datos estática para los Templates operará como un servicio paralelo dentro de la misma orquestación Docker en el Nodo 11.

Aislamiento de Red: El contenedor de MySQL no expondrá su puerto (3306) a la red externa ni a la DMZ. Se comunicará exclusivamente a través de la red interna de Docker con el contenedor de Next.js.

Volúmenes Persistentes: Se forjará un volumen local en el Nodo 11 (/home/racso/Despliegues/BarcelonaXplorer/mysql_data) vinculado al contenedor de MySQL. Esto blinda los datos contra reinicios o actualizaciones orquestadas por Ansistrano.

Sincronización Híbrida: Next.js se conectará a MySQL para extraer los ítems relacionales (Libros, Restaurantes, Rutas) mediante un ORM (como Prisma o Drizzle) que garantice el tipado estricto con TypeScript.