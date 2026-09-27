# [OPERATIVO] Documento Destilado: PBI - Esquemas Deterministas, Value Objects y Diccionario Declarativo de UI

**Identificador:** PBI-I18N-CONTRACTS-001  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 12: Internacionalización Reactiva Persistida y Soberanía de Idioma (S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)  
**Módulo:** Vertical Slice i18n (`src/features/i18n/`)  
**Entorno:** TypeScript 5.8+, Zod 4+, Vitest  
**Prioridad:** Alta (P1 - Fundamento de Contratos y Dominio i18n)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Modelado de Value Objects inmutables con validación en constructor, esquemas deterministas Zod para internacionalización y diccionario declarativo estático de UI para componentes tácticos.
- **Entorno:** `src/features/i18n/domain/supported-language.vo.ts`, `src/features/i18n/domain/i18n.schema.ts`, `src/features/i18n/domain/ui-dictionary.ts`, tests colocated y exportación canónica en `src/features/i18n/index.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tolerancia Cero a la Inferencia y Defensa en Profundidad - Axioma II):* Erradicación de strings primitivos no validados. Creación de `SupportedLanguageVo` con Whitelist inmutable (`['es', 'en', 'fr', 'de', 'it', 'ca']`), fallback determinista a `es`, y mapa de alias canónicos (ej. `"english"`, `"en-US"`, `"anglais"` $\to$ `"en"`) para garantizar que la soberanía biológica del usuario jamás sea ignorada por variaciones de formato.
  - *Filtro B (Localidad de Comportamiento y Economía Termodinámica - Axioma I):* Toda la lógica de tipos, contratos y diccionarios estáticos se forja bajo el nuevo vertical slice `src/features/i18n/` en $\le 3$ archivos adyacentes.
  - *Filtro C (Cero Disonancia en UI sin Consultas a BD):* Diccionario declarativo tipado `UI_DICTIONARY` que desacopla la renderización del cliente de MySQL, permitiendo que el medidor térmico, las alertas de carteristas y los enlaces CPA muten en milisegundos con 0 coste de tokens.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto de Dominio y Desarrollador Frontend/Backend de BarcelonaXplorer,  
**Quiero** forjar el Value Object inmutable `SupportedLanguageVo`, los esquemas Zod canónicos de i18n y el diccionario estático declarativo `UI_DICTIONARY`,  
**Para** proveer al sistema de un núcleo tipado estricto, normalización a prueba de fallos y soporte multilingüe instantáneo sin latencia ni dependencias dispersas.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1 (Value Object Inmutable `SupportedLanguageVo`):** Creado el VO con Whitelist estricta (`es`, `en`, `fr`, `de`, `it', 'ca`), fallback determinista a `es` y normalización de alias para tags BCP 47 y nombres naturales de idiomas.
- [x] **CA-2 (Esquemas Deterministas Zod):** Creados `SupportedLanguageSchema` y `LocalizedTemplateTranslationSchema` para traducción estructurada.
- [x] **CA-3 (Diccionario Declarativo de UI):** Creado `UI_DICTIONARY` fuertemente tipado con traducciones completas para los 6 idiomas soportados de:
  - Estados del Medidor Térmico (`ThermalMeter`).
  - Badges de alerta de carteristas (`LOW`, `MEDIUM`, `HIGH`, `EXTREME`).
  - Botones y controles de `HybridCanvas` ("Modificar", "Ajustar hora", "Cerrar", etc.).
  - Etiquetas CTA de afiliados (TheFork, Cabify, Civitatis, Tiqets).
- [x] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias colocadas verificando el VO, la normalización de alias, la inmutabilidad y la cobertura completa del diccionario UI al 100% (8 tests pasados).

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (Cero errores de compilación)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npm run lint
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Oráculo de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/i18n
   # Test Files: 2 passed (2)
   # Tests: 8 passed (8)
   # Duration: 162ms
   ```

---

## 4. Artefactos Modificados

- [`src/features/i18n/domain/supported-language.vo.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/domain/supported-language.vo.ts)
- [`src/features/i18n/domain/supported-language.vo.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/domain/supported-language.vo.test.ts)
- [`src/features/i18n/domain/i18n.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/domain/i18n.schema.ts)
- [`src/features/i18n/domain/ui-dictionary.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/domain/ui-dictionary.ts)
- [`src/features/i18n/domain/ui-dictionary.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/domain/ui-dictionary.test.ts)
- [`src/features/i18n/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/index.ts)
