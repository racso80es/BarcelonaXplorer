[ARQUITECTURA] Historia de Usuario: Internacionalización Reactiva Persistida y Soberanía de Idioma (S+ Grade)
Estatus: Refinado / Listo para Implementación
Fecha de Revisión: 2026-09-26
Autor: Operador Técnico / Arquitectura BarcelonaXplorer

Matriz de Indexación Tridimensional
Naturaleza: Internacionalización (i18n), Modelado Relacional, Orquestación LLM y Mutación de Contexto.

Entorno: Ecosistema BarcelonaXplorer (Next.js Middleware, Prisma MySQL, Orquestador Gemini AI, LanceDB).

Entropía Asimilada: Consolidación de la Traducción Reactiva Persistida (Filtro C) y habilitación de la Soberanía Biológica. El idioma maestro y fallback universal es el Castellano (es). El usuario retiene el derecho inalienable de alterar el idioma de la interfaz y la narrativa mediante comandos en lenguaje natural, sobreescribiendo la detección técnica del navegador.

1. Descripción General
Como Operador Técnico y Desarrollador de BarcelonaXplorer,
Quiero implementar un sistema de internacionalización reactiva donde el middleware detecte el idioma inicial del navegador, pero permita al usuario alterarlo dinámicamente mediante interacción natural (conversación con la IA) dentro de un espectro de idiomas soportados,
Para garantizar una experiencia de Fricción Cero desde el primer milisegundo, sin costes termodinámicos por traducciones preventivas, asegurando que la voluntad explícita del usuario siempre prevalece sobre la configuración estática de su hardware.

2. Componentes Arquitectónicos y Contratos (La Forja del Motor Híbrido)
2.1. Topología Relacional (Base de Datos)
El esquema Prisma disocia los datos universales de los localizados:

Núcleo Agnóstico (GuideTemplate / TemplateItem): Variables inmutables (id, coordinates, price, affiliate_refs).

Capa de Localización (GuideTemplateTranslation / TemplateItemTranslation): Tablas satélite por idioma que albergan title, description y advertencias tácticas.

2.2. Aduana Universal y Escudo de Entropía Lingüística (Middleware)
Whitelist Termodinámica: Array estricto de idiomas admitidos (ej. ['es', 'en', 'fr', 'de', 'it', 'ca']).

Fallback Innegociable: Si el idioma detectado (o solicitado) no figura en la Whitelist, el sistema asigna forzosamente es (Castellano).

Estado Inicial: El archivo src/middleware.ts intercepta Accept-Language y lo establece como el valor temporal de la sesión.

2.3. Soberanía Biológica y Mutación de Contexto (SLM + LanceDB)
Triaje Orgánico: El Modelo Ligero (SLM) evalúa cada prompt entrante. Si detecta una intención explícita de cambio de idioma o un switch orgánico en la lengua del usuario, extrae el nuevo código de idioma.

Sobreescritura de Sesión: El SLM actualiza la matriz de contexto del usuario (bx_session_id) en LanceDB con la nueva variable de idioma.

Sincronización UI/UX: El JSON estructurado devuelto por el orquestador principal incluye una bandera de metadatos (ej. _sys_lang: 'fr'). Al recibirla, la PWA muta instantáneamente los textos de la interfaz (botones, placeholders) al nuevo idioma para mantener la coherencia.

2.4. Coreografía de Traducción Reactiva (El Flujo Persistido)
Cache Hit: Se busca la traducción solicitada en MySQL. Si existe, se sirve instantáneamente (0 tokens).

Cache Miss (Paciente Cero): Si no existe, se extrae la versión maestra (es) y se delega a Gemini la traducción estructural. La UI enmascara la latencia con Skeleton Loaders. Prisma asimila permanentemente el resultado (INSERT).

3. Criterios de Aceptación (Verificación Empírica)
Escenario 1: Asignación de Fallback Maestro (Castellano)
Dado un usuario cuyo navegador solicita un idioma fuera de la Whitelist (ej. Ruso ru-RU).

Cuando la petición cruza el perímetro de seguridad (middleware.ts).

Entonces la Aduana Universal inyecta es como contexto lingüístico, bloqueando el consumo del LLM y sirviendo la información maestra.

Escenario 2: Traducción Reactiva Persistida (Paciente Cero)
Dado un usuario cuyo navegador solicita Alemán (de-DE).

Y la traducción de un Template no existe en la base de datos (Cache Miss).

Cuando el motor de orquestación procesa la ruta.

Entonces se ejecuta una llamada estructurada a Gemini para traducir exclusivamente los campos de texto desde la matriz en Castellano.

Y el resultado se persiste en GuideTemplateTranslation para el próximo usuario.

Escenario 3: Mutación de Idioma por Interacción Natural (Soberanía Biológica)
Dado un usuario que inició la sesión en Inglés (detectado vía navegador).

Cuando el usuario introduce el prompt: "A partir de ahora, prefiero que me hables en francés".

Entonces el SLM intercepta la intención y verifica si el Francés (fr) pertenece a la Whitelist.

Y el sistema actualiza el vector de sesión en LanceDB para fijar el nuevo idioma.

Y el orquestador devuelve el siguiente itinerario y las claves de metadatos de la UI en Francés, sobreescribiendo permanentemente la detección inicial del navegador.

Escenario 4: Consistencia Absoluta de Interfaz (Sin Fracturas)
Dado un cambio de idioma orgánico consolidado por el orquestador.

Cuando el cliente Next.js recibe la carga útil (JSON).

Entonces todos los textos de afiliación (ej. "Reservar en TheFork", "Ver en Cabify"), botones del medidor térmico y placeholders mutan automáticamente al idioma dictado por la inteligencia artificial, eliminando cualquier disonancia cognitiva en el usuario.
