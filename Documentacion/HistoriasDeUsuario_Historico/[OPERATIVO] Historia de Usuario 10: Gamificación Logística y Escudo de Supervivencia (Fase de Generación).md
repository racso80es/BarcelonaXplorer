[OPERATIVO] Historia de Usuario 10: Gamificación Logística y Escudo de Supervivencia (Fase de Generación)
Estatus: Refinado / Listo para Implementación (Fase 1)
Módulo: Motor Híbrido y Orquestador de Itinerarios

1. Descripción General
Como turista en fase de planificación interactuando con el orquestador,
Quiero visualizar claramente si estoy obteniendo un "Itinerario Estándar" o desbloqueando una "Ruta S+ Grade", y que el resultado integre advertencias de honestidad radical sobre trampas turísticas y enlaces para cerrar mis reservas al instante,
Para sentir que mi esfuerzo al aportar datos tiene una recompensa de alto valor y resolver mi ansiedad de planificación en un solo lugar.

2. Justificación Arquitectónica (Honestidad Radical y CPA Preventivo)
En la fase de generación, la gamificación no se basa en el movimiento físico, sino en la revelación de información privilegiada.
Si el usuario cruza el umbral bloqueante (60%), el orquestador escupe la Ruta Estándar. Si el usuario satura la Matriz de Densidad (100%), el sistema desbloquea la Ruta S+ Grade.
El valor diferencial de esta ruta avanzada radica en inyectar la "Sabiduría Táctica Hiperlocal":

Escudo Anti-Trampas: El Motor Híbrido extrae los tactical_metadata de la base de datos para incrustar alertas sobre restaurantes trampa o zonas de carteristas junto al monumento.

Drops Preventivos (Monetización): Se inyectan enlaces CPA (Civitatis, TheFork) en el punto exacto de fricción de la planificación (ej. "Para este museo, reserva ahora o harás 2 horas de cola").

3. Criterios de Aceptación (Verificación Empírica)
Escenario 1: Ejecución Estándar (Recompensa Base)

Dado un usuario que ejecuta la ruta con el 60% de la Matriz (solo aportando la Ventana Temporal).

Cuando el orquestador principal forja el itinerario.

Entonces la UI renderiza una ruta funcional con los horarios y distancias calculadas correctamente.

Y muestra marcadores visuales opacos (ej. candados) sugiriendo que la "Capa de Sabiduría Local" y las recomendaciones gastronómicas exactas están bloqueadas por falta de datos.

Escenario 2: Desbloqueo S+ Grade y Escudo Anti-Trampas

Dado un usuario que completó la Matriz al 100% y forja su ruta.

Cuando el motor recupera la información de la Sagrada Familia.

Entonces el nodo del itinerario inyecta el tactical_metadata almacenado en MySQL.

Y el usuario visualiza una alerta explícita en la UI: "⚠️ Zona Roja: Evita comer en la Avenida Gaudí, los precios están inflados artificialmente."

Escenario 3: Drop CPA de Previsión

Dado el mismo itinerario S+ Grade que incluye un museo de alta demanda.

Cuando se renderiza la parada del museo.

Entonces el sistema inyecta un enlace de afiliación preventivo extraído de los affiliate_refs.

Y la descripción indica: "Aforo crítico. Asegura tu entrada aquí antes de viajar para evitar el colapso en taquilla."
