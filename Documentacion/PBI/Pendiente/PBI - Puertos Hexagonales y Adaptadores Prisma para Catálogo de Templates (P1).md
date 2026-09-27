# [OPERATIVO] Documento Destilado: PBI - Puertos Hexagonales y Adaptadores Prisma para Catálogo de Templates (P1)

**Identificador:** PBI-ARCH-TMPL-003  
**Estatus:** Pendiente de Implementación  
**Fecha de Creación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 9 (Refinada S+ Grade): Arquitectura Relacional de Templates Temáticos y Taxonomía Dinámica](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%209%20%28Refinada%29:%20Arquitectura%20Relacional%20de%20Templates%20Tem%C3%A1ticos%20y%20Taxonom%C3%ADa%20Din%C3%A1mica.md)  
**Módulo:** `src/features/guide-templates/ports/` y `src/features/guide-templates/adapters/`  
**Entorno:** TypeScript 5 / Prisma ORM / Clean Architecture (Infrastructure Layer)  
**Prioridad:** Alta (P1 - Conexión de Persistencia Hexagonal)  
**Estimación Táctica:** 5 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Arquitectura Hexagonal (Puertos y Adaptadores), Inversión de Dependencias (Pure DI), integración Prisma y colocated testing con dobles tipados.
- **Entorno:** `src/features/guide-templates/ports/` y `src/features/guide-templates/adapters/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Adaptadores que transforman modelos de base de datos a entidades de dominio mediante esquemas Zod. Aislamiento estricto de excepciones Prisma traduciéndolas a errores de dominio.
  - *Filtro B (Determinismo y Soberanía):* Inyección explícita de `PrismaClient` por constructor. Cero acoplamiento de infraestructura en los puertos.
  - *Filtro C (Eficiencia Termodinámica):* Consultas optimizadas con `include` jerárquico ordenado (`orderIndex: 'asc'`) y tests unitarios colocados sin necesidad de base de datos activa mediante mocks deterministas.

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador Backend de BarcelonaXplorer,  
**Quiero** implementar los puertos de repositorio y los adaptadores Prisma para `GuideTemplate` y `TemplateCategory`,  
**Para** permitir la lectura, creación y consulta de plantillas y categorías de forma desacoplada y fuertemente tipada.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1:** Creación de los puertos hexagonales:
  - `src/features/guide-templates/ports/template-category-repository.port.ts`
  - `src/features/guide-templates/ports/guide-template-repository.port.ts`
- [ ] **CA-2:** Implementación del adaptador Prisma:
  - `src/features/guide-templates/adapters/prisma-guide-template.repository.ts`
  - Soporte de búsqueda compuesta por categoría y slug (`findPublishedByCategoryAndSlug`), listado de categorías activas (`findActiveCategories`), y creación atómica de categorías y plantillas.
- [ ] **CA-3:** Tests unitarios colocados en `prisma-guide-template.repository.test.ts` con cobertura exhaustiva de casos de éxito y de entidades no encontradas (`null`).

---

## 3. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | Pendiente | ⏳ |
| **Linter AST** | `npm run lint` | Pendiente | ⏳ |
| **Suite de Tests** | `npm test` | Pendiente | ⏳ |
