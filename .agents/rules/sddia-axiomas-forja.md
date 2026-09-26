# Axiomas Constitucionales de Forja S+ Grade (Optimización para IA)

**Biblioteca Canónica:** [`/.SddIA/library/norms/`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/)  
**Constitución Superior:** [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) (Capítulo VI)

Toda Entidad Productiva Digital en Antigravity debe cumplir de forma estricta los siguientes axiomas:

1. **Economía Termodinámica (Localidad):** Vertical Slicing (`src/features/<modulo>/`), colocalización de tests (`<modulo>.test.ts`) y un umbral máximo de ≤ 3 archivos por cambio atómico.
2. **Tolerancia Cero a la Inferencia:** Prohibido `any` y `as any`. Parseo perimetral estricto con Zod. Modelado con Value Objects inmutables.
3. **Diseño Declarativo:** Matrices de ponderación y configuraciones declarativas sobre pipelines imperativos. YAML canónico comentado según [`Estandar-Formato-Configuracion.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/Estandar-Formato-Configuracion.yml).
4. **Peaje del Oráculo:** Cero auto-aprobación. Pase limpio en `tsc --noEmit`, `eslint` y `vitest run`. Bucle Kaizen ante cualquier error.
5. **Ejecución Encapsulada:** Prohibida metaprogramación opaca y DI mágica. Sobres deterministas tipados (`OperationEnvelope<T>`).

Documentos canónicos vinculantes:
- [Axiomas Detallados S+](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/%5BARQUITECTURA%5D%20Anexo%20Constitucional:%20Axiomas%20de%20Forja%20S+%20Grade%20%28Optimizaci%C3%B3n%20para%20IA%29.md)
- [Estándar de Gobernanza YAML](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/Estandar-Formato-Configuracion.yml)
