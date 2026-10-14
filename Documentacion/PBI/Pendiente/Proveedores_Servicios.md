# PBI base pediente de refinar

# Auditar interacción de usuario en PRO

# investigar el ciclo de comunicación con id log : cmv8056at001cpnv32fuskot8

# Puntos de fricción:

## Todos los puntos de itinerario generados (Waypoints) con posivilidad de reserva seleccionan al proveedor thefork, con url incorrecta (https://www.thefork.es/search?cityId=415144&query=Experiencia%20M%C3%A1gica%20en%20El%20Bosc%20de%20les%20Fades&tag=bcn_xplorer). Hay que generar una nueva historia de usuario para la gestión de los proveedores. Gestionando el listado, dando de alta la cuenta necesario, infiriendo sus servicios dentro de la ruta, etc.

## Todos los puntos del itinerario indican como tipo "gastronomico".

## Una vez solicitada la ruta y presentada, Al pulsar botón  "forjar la ruta de inmediato" no tiene afectaciones en telegram. el comportamiento esperado era recibir el link de la ruta en la cuenta si ya estaba configurada para el usuario, o configurarla con ella.
