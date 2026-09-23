Historia de Usuario 2.1: Identidad Sombra y Fricción Cero (Edge Middleware)
Identificador: HU-PERIM-ID-001
Estatus: Refinado / Especificación Consolidada S+ Grade
Módulo: Módulo 1: Perímetro de Seguridad, Identidad y Anclaje (Fricción Cero)
Entorno: Next.js App Router (Edge Runtime) / Nodo de Producción 11
Entropía Asimilada: Desacople absoluto del registro manual, sincronización de la identidad a través de todos los órganos sensoriales (Gemini, LanceDB y Jev AI) y blindaje de la privacidad en dispositivos compartidos mediante efimeridad por defecto y purga táctica.

1. Descripción General (INVEST)
Como turista y explorador urbano interactuando con BarcelonaXplorer,
Quiero que el sistema asigne una identidad temporal a mi dispositivo de forma invisible desde el primer milisegundo de conexión,
Para interactuar con la IA y generar itinerarios hiper-personalizados sin teclear formularios de registro, manteniendo mi privacidad intacta si decido abandonar la sesión o utilizar un dispositivo compartido.

2. Justificación Arquitectónica (La Vía del Yunque)
Para cumplir con el dogma de Fricción Cero en la adquisición de usuarios, se erradican los flujos tradicionales de autenticación. El sistema delega la responsabilidad de la identificación inicial a la capa de infraestructura perimetral (Edge Runtime), garantizando que la lógica de aplicación reciba un usuario ya etiquetado sin consumir ciclos de renderizado. La sesión nace estrictamente efímera para mitigar riesgos de privacidad, y la retención prolongada de datos se transfiere a jurisdicciones seguras (Telegram) solo cuando el usuario percibe el valor de la ruta generada.

3. Coreografía de la Identidad Sombra
Intercepción Perimetral y Efimeridad por Defecto: El interceptor src/middleware.ts evalúa toda petición entrante al dominio. Si la cabecera HTTP carece de la cookie bx_session_id, genera un UUID v4. Esta cookie se forja estrictamente como una cookie de sesión (sin directivas Expires o Max-Age prolongadas, asegurando su destrucción al cerrar el navegador), con atributos HttpOnly, Secure y SameSite=Lax para blindaje contra XSS.

Vectorización Vinculada (LanceDB / Gemini): Las interacciones, preferencias y parámetros espaciales destilados por la Aduana Universal se etiquetan con este UUID antes de inyectarse en el almacén vectorial embebido, orquestando la memoria cognitiva de la sesión.

Inyección en el Motor Determinista (System One - Jev AI): El UUID extraído por el middleware se transmite obligatoriamente como contexto inmutable (variable state) en cada invocación al contrato ITypedDecisionEngine. Esto erradica la amnesia termodinámica en Jev AI, permitiendo que sus evaluaciones probabilísticas mantengan coherencia estructural durante la sesión.

La Bifurcación del Refugio (Post-Generación): Una vez renderizada la ruta S+ Grade en la UI, el sistema despliega un componente táctico con un flujo binario para la gestión de la privacidad:

Persistencia Segura (Anclaje Táctico): Exportación de la consciencia de la sesión hacia la soberanía del usuario mediante un deep link paramétrico (t.me/BXplorerBot?start=<UUID>).

Amnesia Táctica (Destrucción de Huella): Un disparador ("Borrar mi rastro") que invoca un endpoint del middleware para invalidar inmediatamente la cookie (forzando Max-Age=0) y emite un evento asíncrono que purga los vectores asociados en LanceDB, dejando el dispositivo inerte y seguro para el siguiente usuario.

4. Criterios de Aceptación (Verificación Empírica - Gherkin S+ Grade)
Escenario 1: Generación Inercial de Identidad Efímera (Primera Visita)

Gherkin
Dado un usuario que accede al dominio raíz de BarcelonaXplorer por primera vez
Cuando el componente middleware.ts procesa la petición en el borde
Entonces inyecta la cookie de sesión bx_session_id con el nuevo UUID generado al vuelo
Y el entorno de la aplicación recibe la identidad sombra, permitiendo iniciar la recolección paramétrica sin fricción.
Escenario 2: Continuidad de Sesión y Coherencia Determinista (Jev AI)

Gherkin
Dado un usuario con una sesión efímera activa en su navegador
Cuando la petición entra con la cookie bx_session_id válida
Entonces el orquestador recupera el contexto asociado a ese UUID desde LanceDB
Y el adaptador de Jev AI (ITypedDecisionEngine) recibe el identificador en su estado para mantener la coherencia en sus evaluaciones probabilísticas
Y el sistema mantiene el hilo conversacional sin solicitar de nuevo las variables ya asimiladas.
Escenario 3: Amnesia Termodinámica Pasiva (Cierre del Navegador)

Gherkin
Dado un usuario que opera con una identidad sombra generada por el sistema
Cuando el usuario cierra la aplicación del navegador por completo
Entonces el sistema operativo destruye la cookie de sesión bx_session_id
Y al reabrir la PWA, el middleware forja un UUID completamente nuevo, garantizando privacidad pasiva.
Escenario 4: Bifurcación de Privacidad y Destrucción Activa de Huella (Dispositivo Compartido)

Gherkin
Dado un usuario operando bajo una identidad sombra en un dispositivo compartido
Y que el sistema acaba de renderizar su itinerario hiper-personalizado S+ Grade
Cuando la UI le presenta la Bifurcación del Refugio
Y el usuario acciona el comando táctico de "Borrar mi rastro"
Entonces el endpoint del servidor sobrescribe la cookie bx_session_id forzando su expiración (Max-Age=0)
Y el sistema dispara una orden de purga en LanceDB eliminando todos los embeddings asociados a ese UUID
Y la aplicación devuelve la interfaz a su estado virgen inicial (Fricción Cero), confirmando la aniquilación de la huella.