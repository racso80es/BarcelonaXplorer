# [OPERATIVO] Documento Destilado: PBI - Fronteras Deterministas Zod, Value Objects y Entidades de Dominio de Templates (P1)

**Identificador:** PBI-ARCH-TMPL-002  
**Estatus:** Pendiente de Implementación  
**Fecha de Creación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 9 (Refinada S+ Grade): Arquitectura Relacional de Templates Temáticos y Taxonomía Dinámica](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%209%20%28Refinada%29:%20Arquitectura%20Relacional%20de%20Templates%20Tem%C3%A1ticos%20y%20Taxonom%C3%ADa%20Din%C3%A1mica.md)  
**Módulo:** `src/features/guide-templates/domain/`  
**Entorno:** TypeScript 5 / Zod 4 / Clean Architecture (Domain Layer)  
**Prioridad:** Alta (P1 - Reglas de Negocio e Invariantes)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** DDD, Value Objects inmutables, contratos Zod de frontera, tipado estricto y colocated testing.
- **Entorno:** `src/features/guide-templates/domain/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tolerancia Cero a la Inferencia):* Parseo estricto de metadatos tácticos (`TacticalMetadataSchema`), referencias CPA de afiliados (`AffiliateRefsSchema`) y DTOs de templates. Proscripción de `any`.
  - *Filtro B (Determinismo y Soberanía):* `TemplateSlugVO` como Objeto de Valor inmutable con validación regex en constructor (lowercase, guiones, sin caracteres especiales ni dobles guiones).
  - *Filtro C (Eficiencia Termodinámica):* Pruebas unitarias colocadas adyacentes (`.test.ts`) con 100% de cobertura en invariantes de dominio.

---

## 1. Declaración de Intención (INVEST)

**Como** Ingeniero de Dominio de BarcelonaXplorer,  
**Quiero** modelar los esquemas Zod, Value Objects y entidades puras en `src/features/guide-templates/domain/`,  
**Para** garantizar que ninguna entidad o payload inválido pueda existir en memoria o persistirse en la base de datos relacional.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1:** Creación de `src/features/guide-templates/domain/guide-template.schema.ts` con esquemas estrictos: `TacticalMetadataSchema`, `AffiliateRefSchema`, `GuideTemplateSchema`, `TemplateCategorySchema`, `TemplateItemSchema`.
- [ ] **CA-2:** Cobertura de tests unitarios colocados en `guide-template.schema.test.ts` validando parseos exitosos y rechazos defensivos ante campos anómalos.
- [ ] **CA-3:** Creación del Value Object `TemplateSlugVO` en `src/features/guide-templates/domain/value-objects/template-slug.vo.ts` y sus pruebas colocadas en `template-slug.vo.test.ts`.
- [ ] **CA-4:** Entidades de dominio puras: `TemplateCategoryEntity`, `GuideTemplateEntity`, `TemplateItemEntity` con métodos factoría e inmutabilidad.

---

## 3. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | Pendiente | ⏳ |
| **Linter AST** | `npm run lint` | Pendiente | ⏳ |
| **Suite de Tests** | `npm test` | Pendiente | ⏳ |
