# [OPERATIVO] Documento Destilado: PBI - Casos de Uso del Vertical Slice de Templates y Fachada de Dominio (P1)

**Identificador:** PBI-ARCH-TMPL-004  
**Estatus:** Completado / Certificado S+ Grade  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 9 (Refinada S+ Grade): Arquitectura Relacional de Templates Temáticos y Taxonomía Dinámica](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%209%20%28Refinada%29:%20Arquitectura%20Relacional%20de%20Templates%20Tem%C3%A1ticos%20y%20Taxonom%C3%ADa%20Din%C3%A1mica.md)  
**Módulo:** [`src/features/guide-templates/use-cases/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/) y [`src/features/guide-templates/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/index.ts)  
**Entorno:** TypeScript 5 / Clean Architecture (Application Layer) / OperationEnvelope  
**Prioridad:** Alta (P1 - Lógica de Aplicación y Fachada Vertical)  
**Estimación Táctica:** 5 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Casos de uso de aplicación, sobre determinista tipado `OperationEnvelope<T>`, orquestación de negocio y colocated testing.
- **Entorno:** `src/features/guide-templates/use-cases/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Retorno obligatorio del sobre determinista `OperationEnvelope<T>` (`success`, `exitCode`, `result`, `feedback`, `errors`). Manejo higiénico de errores de validación (400), unicidad (409) y no-encontrado (404).
  - *Filtro B (Determinismo y Soberanía):* Inyección explícita por constructor (*Pure DI*) de los puertos de repositorio. Validación previa de parámetros de entrada con `TemplateSlugVO` y esquemas Zod.
  - *Filtro C (Eficiencia Termodinámica):* Encapsulación en `src/features/guide-templates/index.ts` para que el resto del monolito consuma el módulo sin acoplarse a su infraestructura interna. Pruebas colocadas al 100% de cobertura.

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador de Aplicación de BarcelonaXplorer,  
**Quiero** forjar los casos de uso `GetPublishedTemplateBySlugUseCase`, `ListActiveCategoriesUseCase` y `CreateTemplateCategoryUseCase`,  
**Para** encapsular los flujos de lectura y administración de templates retornando un sobre determinista `OperationEnvelope<T>`.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1:** Caso de uso `GetPublishedTemplateBySlugUseCase`:
  - Recibe `categorySlug` y `templateSlug`.
  - Valida invariantes mediante `TemplateSlugVO`.
  - Devuelve `OperationEnvelope<GuideTemplateDetailDTO>` con los nodos secuenciales ordenados y los metadatos tácticos parseados.
  - Tests colocados en `get-published-template-by-slug.use-case.test.ts`.
- [x] **CA-2:** Caso de uso `ListActiveCategoriesUseCase`:
  - Recupera las categorías con `isActive: true` ordenadas por `displayOrder ASC`.
  - Devuelve `OperationEnvelope<TemplateCategoryDTO[]>`.
  - Tests colocados en `list-active-categories.use-case.test.ts`.
- [x] **CA-3:** Caso de uso `CreateTemplateCategoryUseCase`:
  - Valida unicidad de slug y reglas de negocio.
  - Devuelve `OperationEnvelope<TemplateCategoryDTO>`.
  - Tests colocados en `create-template-category.use-case.test.ts`.
- [x] **CA-4:** Exportación limpia en [`src/features/guide-templates/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/index.ts).

---

## 3. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 warnings** | 🟢 Aprobado |
| **Suite de Tests** | `npm test` | **420/420 tests pasados (100%)** en 80 suites | 🟢 Aprobado |

---

## 4. Artefactos Forjados

- [`src/features/guide-templates/use-cases/get-published-template-by-slug.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/get-published-template-by-slug.use-case.ts): Caso de uso para recuperar template por slugs compuestos.
- [`src/features/guide-templates/use-cases/get-published-template-by-slug.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/get-published-template-by-slug.use-case.test.ts): Tests colocados para `GetPublishedTemplateBySlugUseCase` (4 tests).
- [`src/features/guide-templates/use-cases/list-active-categories.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/list-active-categories.use-case.ts): Caso de uso para listar categorías activas.
- [`src/features/guide-templates/use-cases/list-active-categories.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/list-active-categories.use-case.test.ts): Tests colocados para `ListActiveCategoriesUseCase` (2 tests).
- [`src/features/guide-templates/use-cases/create-template-category.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/create-template-category.use-case.ts): Caso de uso para registrar categorías desde administración.
- [`src/features/guide-templates/use-cases/create-template-category.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/create-template-category.use-case.test.ts): Tests colocados para `CreateTemplateCategoryUseCase` (3 tests).
- [`src/features/guide-templates/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/index.ts): Fachada pública del módulo `guide-templates`.
