Historia de Usuario 1: Anclaje Geográfico Absoluto y Fricción Cero (Contexto Base Barcelona)
Estatus: Refinado / Listo para Implementación
Módulo: Aduana Universal (Capa de Clarificación / SLM)

1. Descripción General
Como turista o usuario de BarcelonaXplorer,
Quiero que el sistema asuma de forma automática e invisible que mi intención de viaje y exploración se circunscribe única y exclusivamente a la ciudad de Barcelona,
Para no tener que teclear información redundante en mi prompt inicial (eliminando la fricción de entrada) y recibir resultados precisos que se alimenten directamente de la base de datos estática hiperlocal curada por el sistema.

2. Justificación Arquitectónica y Restricción de Dominio
Para garantizar la precisión milimétrica de los Templates estáticos almacenados en MySQL y de la memoria vectorial local (LanceDB), el sistema carece de contexto externo. Permitir que el motor procese peticiones sobre otras zonas geográficas generaría alucinaciones, consultas inútiles a APIs de terceros y un gasto termodinámico injustificado en el orquestador pesado.
El anclaje a Barcelona ciudad no es solo una comodidad para el usuario; es un perímetro de seguridad ontológica para el sistema.

3. Coreografía de la Aduana Universal (SLM)
El LLM ligero, actuando como primera línea de defensa, implementa dos directrices de intercepción sobre el prompt crudo:

Inyección Silenciosa (Enriquecimiento de Contexto): Si el usuario teclea "quiero visitar monumentos góticos", el agente ligero no le pregunta dónde. Automáticamente, inyecta en el payload interno el contexto geográfico: [Geo: Barcelona Ciudad | Zonas implícitas: Barrio Gótico, Ciutat Vella].

Rebote Táctico (Bloqueo Out-of-Scope): Si el agente detecta explícitamente una entidad geográfica fuera del dominio (ej. "Qué hacer este finde en Madrid" o "Ruta por Sitges"), detiene el flujo hacia el motor principal. Se activa el Filtro de Eficiencia y el agente responde reconduciendo la conversación de forma conversacional y gamificada.

4. Criterios de Aceptación (Verificación Empírica)
Escenario 1: Prompt implícito (Fricción Cero)

Dado un usuario que introduce "Tengo 3 horas libres esta tarde, quiero comer paella y ver algo histórico".

Cuando el agente ligero (SLM) procesa la entrada.

Entonces el sistema inyecta "Barcelona" en la matriz de datos de forma invisible.

Y continúa la charla para extraer los datos restantes (si faltan) o lanza el orquestador principal sin preguntar jamás por la ciudad.

Escenario 2: Prompt fuera de dominio (Filtro de Eficiencia)

Dado un usuario que introduce "Recomiéndame una ruta para ver museos en Valencia".

Cuando el agente ligero (SLM) detecta la desviación geográfica.

Entonces la petición se bloquea antes de llegar al LLM principal.

Y el conserje responde: "Mi radar táctico está calibrado exclusivamente para el asfalto de Barcelona. Si tienes planeado pasarte por la capital catalana, avísame y forjamos una ruta a medida."

Escenario 3: Prompt explícito redundante

Dado un usuario que introduce "Quiero pasear por Barcelona con mi pareja".

Cuando el agente ligero procesa la entrada.

Entonces el sistema valida la ubicación, marca el requerimiento geográfico como cumplido y avanza en el cálculo de la matriz de densidad sin duplicar el parámetro en la base de datos vectorial.
