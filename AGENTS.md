# JURISDICCIÓN DE FORJA PARA AGENTES IA (PROTOCOLO DE ACERO - GRADO S+)

**Ámbito:** Raíz de Proyecto BarcelonaXplorer  
**Autoridad Suprema:** Vértice Biológico (Racso) · [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md)  
**Biblioteca Canónica de Normas:** [`/.SddIA/library/norms/`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/)  

Toda Entidad Productiva Digital (Google Antigravity, subagentes y workers autónomos) que opere en este workspace está sometida **incondicionalmente** a los Cinco Axiomas de Forja S+ Grade y al Estándar de Configuración YAML.

---

## ⚡ Los Cinco Axiomas de Forja S+ Grade (Resumen Operativo)

1. **Axioma I — Ley de Economía Termodinámica (Localidad de Comportamiento):**
   - **Regla:** Se prohíbe la dispersión de código. Toda feature se forja bajo `src/features/<modulo>/` (*Vertical Slicing*).
   - **Umbral:** Toda operación atómica debe comprenderse y modificarse en **≤ 3 archivos adyacentes** (*context hops*).
   - **Colocated Testing:** Los tests (`<modulo>.test.ts`) residen obligatoriamente junto al código dentro del directorio de la feature. Prohibido crear árboles espejo en `tests/`.

2. **Axioma II — Tolerancia Cero a la Inferencia (Fronteras Deterministas):**
   - **Regla:** Prohibido el uso de `any`, `as any` y aserciones ciegas (`!`).
   - **Parse, don't validate:** Todo dato entrante (`unknown`) se valida en la frontera mediante esquemas deterministas **Zod**.
   - **Value Objects:** Erradicar la obsesión por primitivos. Conceptos de negocio modelados como *Value Objects* inmutables con validación en constructor.

3. **Axioma III — Diseño Declarativo sobre Lógica Imperativa:**
   - **Regla:** Priorizar matrices de datos, máquinas de estado y esquemas frente a bifurcaciones imperativas (`if/else` anidados).
   - **Estándar YAML:** Toda configuración, orquestación (Docker Compose) e infraestructura (Ansible) debe ser **YAML canónico** con comentarios semánticos referenciando los axiomas aplicados ([`Estandar-Formato-Configuracion.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/Estandar-Formato-Configuracion.yml)). Parseo seguro obligatorio (`yaml.safe_load()`, `YAML.parse()`).

4. **Axioma IV — El Peaje del Oráculo (Aduana de Fricción):**
   - **Regla:** Cero soberanía de auto-aprobación para la IA. Ningún cambio es válido hasta cruzar en verde la Santa Trinidad de Oráculos:
     1. Compilador: `tsc --noEmit`
     2. Linter AST: `eslint`
     3. Tests: `vitest run`
   - **Bucle Kaizen:** Ante fallos, el volcado determinista del compilador es la única guía; prohibido parchear a ciegas o relajar aserciones.

5. **Axioma V — Ejecución Encapsulada y Transparencia Estructural:**
   - **Regla:** Prohibida la metaprogramación opaca, reflexión mágica o inyección de dependencias implícita en runtime. Inyección explícita por constructor (*Pure DI*).
   - **Sobre Determinista:** Toda comunicación inter-cápsula y de herramientas debe retornar un sobre tipado `OperationEnvelope<T>` (`success`, `exitCode`, `result`, `feedback`, `errors`).

---

## 📚 Consulta Mandatoria de Normas Canónicas

Ante cualquier tarea de diseño, refactorización, formateo o forja, el agente debe consultar los documentos normativos completos antes de ejecutar código:
- 📜 **Axiomas Detallados:** [`.SddIA/library/norms/[ARQUITECTURA] Anexo Constitucional: Axiomas de Forja S+ Grade (Optimización para IA).md`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/%5BARQUITECTURA%5D%20Anexo%20Constitucional:%20Axiomas%20de%20Forja%20S+%20Grade%20%28Optimizaci%C3%B3n%20para%20IA%29.md)
- ⚙️ **Gobernanza YAML:** [`.SddIA/library/norms/Estandar-Formato-Configuracion.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/Estandar-Formato-Configuracion.yml)
- ⚖️ **Veredicto Arquitectónico:** [`ADR-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) y [`AUD-ARCH-FRIC-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Friccion%20Algoritmica%20y%20Evaluacion%20Arquitectonica%20A%20vs%20B.md)
