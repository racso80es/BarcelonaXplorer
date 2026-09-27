# [OPERATIVO] Documento Destilado: PBI - Puertos Hexagonales y Adaptadores Prisma para Catálogo de Templates (P1)

**Identificador:** PBI-ARCH-TMPL-003  
**Estatus:** Completado / Certificado S+ Grade  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 9 (Refinada S+ Grade): Arquitectura Relacional de Templates Temáticos y Taxonomía Dinámica](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%209%20%28Refinada%29:%20Arquitectura%20Relacional%20de%20Templates%20Tem%C3%A1ticos%20y%20Taxonom%C3%ADa%20Din%C3%A1mica.md)  
**Módulo:** [`src/features/guide-templates/ports/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/ports/) y [`src/features/guide-templates/adapters/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/)  
**Entorno:** TypeScript 5 / Prisma ORM / Clean Architecture (Infrastructure Layer)  
**Prioridad:** Alta (P1 - Conexión de Persistencia Hexagonal)  
**Estimación Táctica:** 5 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Arquitectura Hexagonal (Puertos y Adaptadores), Inversión de Dependencias (Pure DI), integración Prisma y colocated testing con dobles tipados.
- **Entorno:** `src/features/guide-templates/ports/` y `src/features/guide-templates/adapters/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Adaptadores que transforman modelos de base de datos a entidades y DTOs de dominio mediante esquemas Zod (`GuideTemplateDetailDTOSchema`). Aislamiento estricto de excepciones.
  - *Filtro B (Determinismo y Soberanía):* Inyección explícita de `PrismaClient` por constructor (*Pure DI*). Cero acoplamiento de infraestructura en los puertos.
  - *Filtro C (Eficiencia Termodinámica):* Consultas optimizadas con `include` jerárquico ordenado (`orderIndex: 'asc'`) y tests unitarios colocados sin necesidad de base de datos activa mediante mocks deterministas (8 tests de integración simulada).

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador Backend de BarcelonaXplorer,  
**Quiero** implementar los puertos de repositorio y los adaptadores Prisma para `GuideTemplate` y `TemplateCategory`,  
**Para** permitir la lectura, creación y consulta de plantillas y categorías de forma desacoplada y fuertemente tipada.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1:** Creación de los puertos hexagonales:
  - [`src/features/guide-templates/ports/template-category-repository.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/ports/template-category-repository.port.ts)
  - [`src/features/guide-templates/ports/guide-template-repository.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/ports/guide-template-repository.port.ts)
- [x] **CA-2:** Implementación de adaptadores Prisma:
  - [`src/features/guide-templates/adapters/prisma-template-category.repository.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/prisma-template-category.repository.ts)
  - [`src/features/guide-templates/adapters/prisma-guide-template.repository.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/prisma-guide-template.repository.ts)
  - Soporte de búsqueda compuesta por categoría y slug (`findPublishedByCategoryAndSlug`), listado de categorías activas (`findActiveCategories`), y creación atómica de categorías y plantillas.
- [x] **CA-3:** Tests unitarios colocados en `prisma-guide-template.repository.test.ts` con cobertura exhaustiva de casos de éxito y de entidades no encontradas (`null`).

---

## 3. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 warnings** | 🟢 Aprobado |
| **Suite de Tests** | `npm test` | **411/411 tests pasados (100%)** en 77 suites | 🟢 Aprobado |

---

## 4. Artefactos Forjados

- [`src/features/guide-templates/ports/template-category-repository.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/ports/template-category-repository.port.ts): Contrato de repositorio para categorías.
- [`src/features/guide-templates/ports/guide-template-repository.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/ports/guide-template-repository.port.ts): Contrato de repositorio para plantillas e ítems.
- [`src/features/guide-templates/adapters/prisma-template-category.repository.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/prisma-template-category.repository.ts): Adaptador Prisma para categorías.
- [`src/features/guide-templates/adapters/prisma-guide-template.repository.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/prisma-guide-template.repository.ts): Adaptador Prisma para plantillas de guía.
- [`src/features/guide-templates/adapters/prisma-guide-template.repository.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/prisma-guide-template.repository.test.ts): Tests colocados para adaptadores Prisma (8 tests).
