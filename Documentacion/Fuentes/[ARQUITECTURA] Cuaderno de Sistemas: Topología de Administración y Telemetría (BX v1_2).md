[ARQUITECTURA] Cuaderno de Sistemas: Topología de Administración y Telemetría (BX v1.2)
Estatus: Consolidado en el Repositorio

Matriz de Indexación Tridimensional:
Naturaleza: Enrutamiento, Monitorización y Seguridad Perimetral.
Entorno: Next.js (App Router) / Nodo de Producción (10.0.10.11).
Entropía Asimilada: Refactorización preventiva del panel de control hacia una estructura jerárquica modular (/Admin/), eliminando rutas planas (/SystemAdmin) para optimizar la futura inyección de reglas de seguridad (Middleware VPN) y la escalabilidad del proyecto.

1. El Nodo Padre: Arquitectura del Directorio /Admin
La Vía del Yunque establece que la estructura de carpetas de la aplicación debe reflejar su estructura de seguridad. El enrutamiento de Next.js se ha reconfigurado para agrupar todas las herramientas de gestión interna bajo el nodo raíz /Admin.

Modularidad (Preparación para Templates): Este diseño permite que futuras herramientas (ej. /Admin/Templates, /Admin/Metricas, /Admin/Afiliados) se integren sin fricción estructural, heredando automáticamente las directivas del nodo padre.

Eficiencia de Blindaje: Al concentrar la gestión en una única rama del árbol de rutas, facilitamos la futura implementación de un middleware.ts en la raíz de Next.js que intercepte y evalúe masivamente cualquier petición dirigida a /Admin/:path*.

2. Módulo de Telemetría: /Admin/System
Actúa como la sala de máquinas y el escáner de primer nivel para la salud térmica de la infraestructura en el Nodo 11. Se basa en la ejecución exclusiva del lado del servidor (Server Components).

Directriz de Inmutabilidad Temporal: La página implementa la directiva export const dynamic = 'force-dynamic';. Esto prohíbe explícitamente a Next.js cachear el resultado en el momento de la compilación de Docker, garantizando que los sensores devuelvan información en tiempo real con cada recarga del navegador.

Sensor A (Persistencia Híbrida): Evalúa la integridad del puente de red interno de Docker hacia la base de datos estática ejecutando una consulta primaria (SELECT 1) mediante Prisma ORM. Confirma que el target linux-musl-openssl-3.0.x está operando con éxito en el contenedor Alpine.

Sensor B (Aduana / Red Externa): Evalúa la capacidad de salida del Nodo 11 hacia internet mediante un fetch sin caché al DNS 1.1.1.1. Confirma indirectamente que la topología de red (Nodo 11 -> MikroTik -> Raspberry Pi -> Cloudflare) no presenta bloqueos de cortafuegos.

3. Táctica del Refugio: Hoja de Ruta de Seguridad
La arquitectura actual se encuentra expuesta públicamente (aunque no contiene datos sensibles, solo estados binarios de los servicios). El siguiente hito de seguridad consistirá en la Restricción por Rango (VPN).

Se forjará un archivo interceptor (middleware.ts) que leerá la cabecera x-forwarded-for o la IP de origen de la petición.

Si la ruta solicitada incluye /Admin y la IP no pertenece al rango asignado a tu túnel VPN privado, el servidor cortará la conexión en milisegundos (devolviendo un 404 o un 403), invisibilizando por completo el panel de control ante escáneres del Leviatán o bots entrópicos en internet.