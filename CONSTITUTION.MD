# 📜 [NÚCLEO] Constitución Arquitectónica y Operativa: BarcelonaXplorer v1.0

### Matriz de Indexación Tridimensional (Protocolo de Acero)
- **Naturaleza:** Constitución del Sistema, Dogmas de Ingeniería y Gobernanza Simbiótica.
- **Entorno:** Proyecto BarcelonaXplorer (PWA / Nodo de Producción 10.0.10.11 / Next.js 16 / TypeScript 5 / LanceDB / MySQL).
- **Entropía Asimilada:** Elevación del documento técnico a rango constitucional. Fusión inquebrantable entre la Táctica del Refugio, la ingeniería defensiva, la soberanía técnica, la monetización desatendida y la gobernanza estricta de agentes de IA bajo los Axiomas de Forja Grado S+.

---

## I. Declaración de Soberanía y Propósito (La Vía del Fuego)

BarcelonaXplorer no es un prototipo efímero ni un directorio estático. Se instanciará como un **Orquestador de Experiencias Híbrido**, diseñado para aniquilar la fricción de decisión del usuario final mediante inteligencia contextual y memoria vectorial.

Todo el código base es una manifestación directa de la **Táctica del Refugio**: un mecanismo de soberanía financiera (Ingeniería de Ingresos Pasivos) que debe operar con absoluta independencia, cero mantenimiento reactivo y máxima resistencia estructural ante fallos de proveedores externos o fluctuaciones de red.

---

## II. El Dogma del Código Inmutable (La Vía del Yunque)

El monolito (Next.js App Router) se rige por una disciplina arquitectónica donde la entropía y el acoplamiento no tienen cabida. Se imponen los principios **S.O.L.I.D.** y la **Clean Architecture** (Patrón Hexagonal / BFF) como barrera inmunológica:

1. **Aislamiento del Dominio:**
   Las dependencias fluyen estrictamente desde el exterior (frameworks, LLMs, MySQL, LanceDB) hacia el interior. El núcleo de negocio jamás conocerá los detalles de su propia infraestructura.
2. **Sustitución de Entropía:**
   Reemplazar un proveedor de IA (ej. Google Gemini por otro motor) o migrar el motor de base de datos vectorial (LanceDB) no alterará un solo token de la lógica de negocio ni de las entidades de dominio.
3. **Prohibición de Primitivos (Value Objects):**
   Se erradica la obsesión por los tipos primitivos. Todo concepto (ej. Presupuesto, Coordenadas, TiempoDisponible, RadioBúsqueda) debe encapsularse en **Objetos de Valor inmutables** que autovaliden sus invariantes en el constructor. El estado inválido es físicamente imposible de instanciar en la memoria del sistema.
4. **Cláusula de Evolución Topológica Empírica:**
   La organización física de directorios (Clean Architecture por Capas vs. Vertical Slicing por Features) está supeditada al **Filtro Empírico** mediante tests controlados de fricción algorítmica ([`PBI-ARCH-TEST-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Test%20de%20Fricci%C3%B3n%20Algor%C3%ADtmica%20-%20Evaluaci%C3%B3n%20Emp%C3%ADrica%20de%20Opciones%20Arquitect%C3%B3nicas%20%28A%20vs%20B%29.md)). La estructura definitiva será consolidada irreversiblemente en [`PBI-ARCH-APPLY-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Aplicaci%C3%B3n%20Definitiva%20de%20Modificaciones%20Arquitect%C3%B3nicas%20Post-Veredicto.md) sin vulnerar jamás el aislamiento de puertos y adaptadores.

---

## III. Gobernanza de IA y Autopoiesis Crítica (Agent-Guarded Architecture)

Reconociendo que la forja del código es ejecutada masivamente por entidades digitales y agentes de IA (Google Antigravity), se instaura un protocolo de blindaje contra la deriva sintáctica y el sesgo algorítmico:

1. **Linter de Arquitectura (El Espejo Rúnico):**
   El pipeline de compilación ejecuta análisis AST. Si una capa de dominio intenta importar una capa de infraestructura o un framework externo, la compilación será aniquilada de forma sumarísima.
2. **Tolerancia Cero a la Indefinición:**
   El uso del tipo `any` queda proscrito en todo el repositorio. Toda entropía entrante, especialmente los payloads JSON generados por modelos de lenguaje (LLMs), será sometida a un **Triaje Entrópico inflexible** mediante esquemas de validación Zod en la aduana de la infraestructura antes de interactuar con el dominio.
3. **Auto-Reparación de Contratos:**
   Toda entidad (humana o digital) que modifique un Puerto de Salida asume la **Responsabilidad Ciega** de actualizar inmediatamente los mocks, stubs y tests unitarios/integración asociados.

---

## IV. Protocolo de Trazabilidad y Materialización (Filtro Empírico)

El código teórico es ruido; solo el código desplegado y testado es vitalidad. El ciclo de vida del software exige validación empírica absoluta:

1. **Pruebas de Aislamiento (Dominio):**
   Vitest auditará la lógica de negocio pura aislando la infraestructura mediante dobles de prueba (stubs/mocks de puertos).
2. **Pruebas de Contacto (Integración):**
   Validación determinista en entornos controlados de los adaptadores de MySQL, el cliente LanceDB y los clientes LLM.
3. **Filtro de Materialización (CI/CD):**
   El despliegue inmutable mediante Ansible y Ansistrano hacia el Nodo de Producción 11 (`10.0.10.11`) estará supeditado a la superación completa del linter, el chequeo de tipos estático y la suite de tests. Se garantiza operativamente la inyección de enlaces de monetización en los puntos de máxima fricción logística, sin penalizar el rendimiento ni la experiencia de usuario.

---

## V. Consolidación Declarativa y Gobernanza de Formatos (Emanación PBI-ARCH-YAML-001)

Ratificado en el estándar canónico [`Documentacion/Gobernanza/Estandar-Formato-Configuracion.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Gobernanza/Estandar-Formato-Configuracion.yml), se decreta la disciplina formal de configuración:

1. **Supremacía Declarativa YAML:**
   Toda configuración de infraestructura, despliegue y orquestación adopta YAML como estándar preferente sobre JSON, maximizando la legibilidad, la economía de tokens para modelos de IA (~30% de reducción frente a JSON) y permitiendo comentarios explicativos contextuales.
2. **Política JSONC (JSON con Comentarios):**
   Los archivos de configuración que por especificación externa conserven la extensión `.json` pero cuyos procesadores soporten comentarios sintácticos (`tsconfig.json`, `components.json`), deben incluir comentarios semánticos (`//`) detallando el propósito y justificación constitucional de sus directivas.
3. **Blindaje de JSON Puro de Empaquetado:**
   Archivos de control estricto de gestores de paquetes (`package.json`, `package-lock.json`) quedan clasificados como JSON Puro Blindado. Queda terminantemente prohibido inyectar comentarios en ellos para prevenir el colapso del tooling de npm.
4. **Blindaje P0 contra Deserialización Insegura:**
   Queda terminantemente proscrito el uso de métodos de deserialización insegura (`yaml.load()` sin esquema de seguridad) en cualquier runtime o script. Toda carga de estructuras YAML debe emplear estrictamente métodos seguros (`yaml.safe_load()` o esquemas deterministas) para erradicar cualquier vector de Remote Code Execution (RCE).
5. **Directriz Futura:**
   Cualquier nueva herramienta o servicio incorporado al ecosistema que soporte formatos duales (JSON/YAML) adoptará de forma obligatoria la variante YAML.

---

## VI. Axiomas Constitucionales de Forja S+ Grade (Optimización para IA)

Para gobernar la simbiosis con agentes autónomos de desarrollo (Google Antigravity), rigen los **Cinco Axiomas de Forja Grado S+**, detallados en el [Anexo Constitucional](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Anexo%20Constitucional:%20Axiomas%20de%20Forja%20S+%20Grade%20%28Optimizaci%C3%B3n%20para%20IA%29.md):

- **Axioma I — Ley de Economía Termodinámica (Localidad de Comportamiento):**
  Se prohíbe la dispersión entrópica del código. Todo diseño que obligue a la IA a procesar más de tres archivos distribuidos para comprender o alterar una operación atómica debe refactorizarse para maximizar la localidad funcional (*Vertical Slicing*), protegiendo la ventana de contexto y previniendo alucinaciones estructurales.
- **Axioma II — Tolerancia Cero a la Inferencia (Fronteras Deterministas):**
  Tipado estricto sin excepciones. Proscripción de `any`. Intercepción de payloads mediante esquemas de autovalidación deterministas (Zod) y modelado de negocio mediante Value Objects inmutables.
- **Axioma III — Diseño Declarativo sobre Lógica Imperativa:**
  Priorizar configuraciones declarativas estructuradas (matrices de densidad, diccionarios YAML) frente a bifurcaciones imperativas complejas. Alterar una configuración declarativa es termodinámicamente superior a reescribir pipelines de código.
- **Axioma IV — El Peaje del Oráculo (Aduana de Fricción):**
  Ningún código es válido por auto-aprobación del agente. La suite de tests automatizados y el linter AST son los únicos oráculos con potestad para conceder estado ejecutable.
- **Axioma V — Ejecución Encapsulada y Transparencia Estructural:**
  Prohibición de metaprogramación opaca o reflexión que ciegue el análisis estático. Todo protocolo de comunicación inter-cápsula responderá a sobres deterministas de entrada/salida tipados (`success`, `exitCode`, `result`, `feedback`).