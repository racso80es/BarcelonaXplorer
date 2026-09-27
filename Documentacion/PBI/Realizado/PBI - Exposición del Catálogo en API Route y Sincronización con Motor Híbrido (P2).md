# [OPERATIVO] Documento Destilado: PBI - Exposición del Catálogo en API Route y Sincronización con Motor Híbrido (P2)

**Identificador:** PBI-ARCH-TMPL-005  
**Estatus:** Completado / Certificado S+ Grade  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 9 (Refinada S+ Grade): Arquitectura Relacional de Templates Temáticos y Taxonomía Dinámica](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%209%20%28Refinada%29:%20Arquitectura%20Relacional%20de%20Templates%20Tem%C3%A1ticos%20y%20Taxonom%C3%ADa%20Din%C3%A1mica.md)  
**Módulo:** [`src/app/api/guides/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/guides/) y [`src/features/guide-templates/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/)  
**Entorno:** Next.js 16 (Route Handlers) / Node.js Runtime / OperationEnvelope  
**Prioridad:** Media (P2 - Exposición HTTP y Cruce de Consumo)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Interfaz HTTP pública (REST / App Router), enrutamiento dinámico `/api/guides/`, serialización tipada y blindaje defensivo.
- **Entorno:** `src/app/api/guides/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Verificación de parámetros de ruta dinámicos con `TemplateSlugVO` (`categorySlug`, `templateSlug`). Códigos HTTP deterministas (200, 400, 404, 500) encapsulados en `OperationEnvelope`.
  - *Filtro B (Determinismo y Soberanía):* Consumo exclusivo de los casos de uso del Vertical Slice `src/features/guide-templates/`, preservando la separación estricta BFF / Clean Architecture.
  - *Filtro C (Eficiencia Termodinámica):* Headers HTTP de control de caché (`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`) para consultas de catálogo estático, aliviando la carga del servidor y base de datos MySQL.

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador Frontend y Motor de Consumo de BarcelonaXplorer,  
**Quiero** exponer endpoints HTTP en Next.js para consultar categorías activas y obtener el detalle completo de un template por sus slugs compuestos,  
**Para** permitir el renderizado de guías curadas en la PWA y su asimilación por el orquestador conversacional.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1:** Endpoint `GET /api/guides/categories` que lista las categorías activas en formato JSON con `OperationEnvelope`.
- [x] **CA-2:** Endpoint `GET /api/guides/[categorySlug]/[templateSlug]` que recupera el template publicado con sus paradas y metadatos tácticos. Devuelve 404 estructurado si no existe y 400 ante slugs mal formados.
- [x] **CA-3:** Pruebas unitarias/integración de los endpoints HTTP con Vitest asegurando respuesta exitosa y manejo de errores.

---

## 3. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 warnings** | 🟢 Aprobado |
| **Suite de Tests** | `npm test` | **424/424 tests pasados (100%)** en 81 suites | 🟢 Aprobado |

---

## 4. Artefactos Forjados

- [`src/app/api/guides/categories/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/guides/categories/route.ts): Route Handler para listar categorías activas.
- [`src/app/api/guides/[categorySlug]/[templateSlug]/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/guides/%5BcategorySlug%5D/%5BtemplateSlug%5D/route.ts): Route Handler para recuperar el detalle de un template por slugs compuestos.
- [`src/app/api/guides/__tests__/guides-routes.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/guides/__tests__/guides-routes.test.ts): Tests de integración de Route Handlers (4 tests).
