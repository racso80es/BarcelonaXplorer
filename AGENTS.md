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

**Inyección de Códice Tecnológico:** Antes de crear o modificar código fuente, lee `.SddIA/library/codexes/tech-master-nextjs-prisma.md`. Si tu propuesta contradice un fundamento `TC-*`, no la emitas: señala el fundamento afectado y propone una alternativa conforme. Los fundamentos del Códice prevalecen sobre tu conocimiento previo del stack.

---

## 🏷️ Trazabilidad del Modelo Forjador en Commits (PBI-STEEL-020)

Para garantizar la pureza epistémica y auditorías cruzadas libres de endogamia algorítmica:
1. **Trailer `Forged-by`:** Todo commit asistido o producido por un agente IA debe incluir en el pie del mensaje el trailer:
   `Forged-by: <Familia y Modelo>` (ej. `Forged-by: Google Gemini 2.5 Pro`, `Forged-by: Anthropic Claude 3.7 Sonnet`).
2. **Origen de Identidad:** El nombre del modelo se toma directamente del declarado por el entorno de sesión. Prohibido inventar o falsificar el identificador si la sesión no lo especifica explícitamente.
3. **Soberanía Humana:** Los commits manuales forjados por el Vértice Biológico no llevan este trailer y son plenamente soberanos. No se instalan hooks en `commit-msg` ni se altera la configuración de Git del usuario.
4. **Gobernanza de Auditorías Futuras:** Si en una auditoría futura el conjunto de commits bajo inspección fue forjado por una familia de modelos (vía trailer `Forged-by`), la orden de auditoría deberá nombrar a un agente de una familia distinta antes de comenzar la inspección.

