[ARQUITECTURA] Historia de Usuario 11: Ecosistema Reactivo y Drops de Alivio (Fase de Ejecución en Tiempo Real - Visión Futura)
Estatus: Pendiente / Teórico (Horizonte Evolutivo)
Módulo: Motor Reactivo (EDA) y Bot de Telegram (Anclaje Táctico)

1. Descripción General
Como turista ejecutando activamente mi ruta S+ Grade en las calles de Barcelona,
Quiero que el sistema actúe como un compañero reactivo que detecte mi fatiga acumulada o cambios en el entorno (lluvia repentina),
Para recibir "drops" tácticos en mi teléfono que me ofrezcan soluciones inmediatas a mis problemas físicos o logísticos en tiempo real.

2. Justificación Arquitectónica (Táctica del Refugio y Vía de la Red)
Aquí es donde el sistema abandona el concepto de "Guía" y se convierte en "Ecosistema de Supervivencia". Utilizando la identidad anclada al smartphone (ej. el bot de Telegram de la Historia de Usuario 2.2), el servidor pasa de un modelo pasivo (esperar consultas) a un modelo proactivo basado en eventos (EDA). El sistema calcula el desgaste termodinámico del usuario (kilómetros caminados acumulados en el itinerario) y cruza esa variable con las condiciones atmosféricas en vivo. Si detecta fricción crítica, lanza un salvavidas comercializado (CPA).

3. Criterios de Aceptación (Verificación Empírica Futura)
Escenario 1: Drop de Alivio por Fatiga Geométrica

Dado un usuario que lleva ejecutando una ruta a pie continua calculada internamente en más de 5 kilómetros.

Cuando el reloj del sistema marca el inicio del siguiente nodo lejano.

Entonces el webhook del servidor dispara un evento asíncrono al Telegram del usuario.

Y el mensaje inyecta un enlace CPA de movilidad: "Llevas mucha tralla en las piernas. Si quieres saltarte la caminata hasta Montjuïc, aquí tienes un Cabify con descuento para el último tramo."

Escenario 2: Refugio Táctico por Entropía Ambiental (Clima)

Dado un usuario en medio de una ruta planificada mayoritariamente al aire libre.

Cuando el cronjob del Nodo 11 detecta una alerta de lluvia inminente en Barcelona mediante la API meteorológica.

Entonces el sistema reevalúa el itinerario actual del usuario en tiempo real.

Y le envía una notificación empujando el nodo interior más cercano (extraído de MySQL) con su respectivo enlace de afiliación: "Lluvia inminente en 15 minutos. Cancela el mirador y refúgiate en la Casa Batlló; saca el ticket rápido aquí."
