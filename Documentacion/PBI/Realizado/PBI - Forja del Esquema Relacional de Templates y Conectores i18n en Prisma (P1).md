# [OPERATIVO] Documento Destilado: PBI - Forja del Esquema Relacional de Templates y Conectores i18n en Prisma (P1)

**Identificador:** PBI-ARCH-TMPL-001  
**Estatus:** Completado / Certificado S+ Grade  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 9 (Refinada S+ Grade): Arquitectura Relacional de Templates Temáticos y Taxonomía Dinámica](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%209%20%28Refinada%29:%20Arquitectura%20Relacional%20de%20Templates%20Tem%C3%A1ticos%20y%20Taxonom%C3%ADa%20Din%C3%A1mica.md)  
**Módulo:** [`src/prisma/schema.prisma`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma)  
**Entorno:** Next.js 16 / TypeScript 5 / MySQL 8.0 / Prisma ORM 5.22  
**Prioridad:** Alta (P1 - Fundamento de Persistencia Relacional)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Modelado relacional normalizado, DDL Prisma, integridad referencial determinista y preparación de modelos satélite para internacionalización reactiva.
- **Entorno:** `src/prisma/schema.prisma` y cliente generado `@prisma/client`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Unicidad compuesta `@@unique([categoryId, slug])` en `GuideTemplate` para evitar colisiones globales permitiendo slugs contextualizados por categoría. Coordenadas espaciales `coordinatesLat` y `coordinatesLng` en `TemplateItem`.
  - *Filtro B (Determinismo y Soberanía):* Políticas de integridad referencial: `onDelete: Restrict` en `TemplateCategory -> GuideTemplate` y `onDelete: Cascade` en `GuideTemplate -> TemplateItem`. Mapeos canónicos de tabla y columna (`@@map`, `@map`).
  - *Filtro C (Eficiencia Termodinámica):* Declaración bidireccional de los conectores satélite para localización reactiva (`TemplateCategoryTranslation`, `GuideTemplateTranslation`, `TemplateItemTranslation`) alineados con la HU 12 para evitar bloqueos y deuda en `prisma migrate dev`.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto de Base de Datos y Desarrollador de BarcelonaXplorer,  
**Quiero** incorporar los modelos `TemplateCategory`, `GuideTemplate`, `TemplateItem` y sus satélites de traducción en `src/prisma/schema.prisma`,  
**Para** soportar la persistencia del catálogo de templates y sincronizar el cliente `@prisma/client` con tipos fuertemente tipados.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1:** Modelo `TemplateCategory` con `id`, `slug` (`@unique`), `name`, `description`, `icon`, `displayOrder`, `isActive`, timestamps y relación con `GuideTemplate` y `TemplateCategoryTranslation`.
- [x] **CA-2:** Modelo `GuideTemplate` con `categoryId`, `slug`, `title`, `abstract`, `estimatedDuration`, `status` (`TemplateStatus` enum), `isFeatured`, timestamps, restricción `@@unique([categoryId, slug])` y relaciones.
- [x] **CA-3:** Modelo `TemplateItem` con `templateId`, `orderIndex`, `title`, `description`, `coordinatesLat`, `coordinatesLng`, `approxDurationMin`, `tacticalMetadata`, `affiliateRefs`, restricción `@@unique([templateId, orderIndex])` y `onDelete: Cascade`.
- [x] **CA-4:** Modelos satélite de traducción de HU 12 (`TemplateCategoryTranslation`, `GuideTemplateTranslation`, `TemplateItemTranslation`) debidamente declarados con claves compuestas por idioma y `onDelete: Cascade`.
- [x] **CA-5:** Generación limpia de cliente Prisma (`npx prisma generate`) sin errores de esquema.

---

## 3. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Generador Prisma** | `npx prisma generate` | **Client v5.22.0 generado en 458ms** | 🟢 Aprobado |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 warnings** | 🟢 Aprobado |
| **Suite de Tests** | `npm test` | **384/384 tests pasados (100%)** en 74 suites | 🟢 Aprobado |

---

## 4. Artefactos Modificados

- [`src/prisma/schema.prisma`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma): Incorporación de los modelos `TemplateCategory`, `GuideTemplate`, `TemplateItem`, `TemplateStatus`, y satélites `TemplateCategoryTranslation`, `GuideTemplateTranslation`, `TemplateItemTranslation`.
