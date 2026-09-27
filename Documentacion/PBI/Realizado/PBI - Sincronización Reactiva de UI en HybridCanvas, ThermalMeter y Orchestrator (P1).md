# [OPERATIVO] Documento Destilado: PBI - Sincronización Reactiva de UI en HybridCanvas, ThermalMeter y Orchestrator

**Identificador:** PBI-I18N-UI-SYNC-004  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 12: Internacionalización Reactiva Persistida y Soberanía de Idioma (S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)  
**Módulo:** `src/app/orchestrator/`, `src/components/tactical/`, `src/features/triage/components/`  
**Entorno:** React 19 Client Components / Next.js 16 / Lucide Icons / Vitest  
**Prioridad:** Alta (P1 - Cero Disonancia en Experiencia de Usuario)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Sincronización en tiempo real del estado de idioma en el frontend, mutación reactiva de textos estáticos, badges de carteristas y botones CPA de afiliación con cero latencia ni recarga de página.
- **Entorno:** `src/app/orchestrator/page.tsx`, `src/components/tactical/hybrid-canvas.tsx`, `src/features/triage/components/thermal-meter.tsx` y colocated tests.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Cero Disonancia Cognitiva y Reactividad Pura):* `OrchestratorPage` captura `_sys_lang` desde ignición y `/api/triage`, muta `sysLang` y lo propaga a hijos sin recarga.
  - *Filtro B (Localización Declarativa de Afiliados y Advertencias Tácticas):* `HybridCanvas` consume `getUiDictionary(lang)` para CTAs, badges de carteristas, categorías y controles de tiempo.
  - *Filtro C (Medidor Térmico Localizado):* `ThermalMeter` renderiza saturación, umbral, variables faltantes y el botón de despacho desde el diccionario tipado.

---

## 1. Declaración de Intención (INVEST)

**Como** Explorador de BarcelonaXplorer,  
**Quiero** que al cambiar de idioma en la conversación, todos los botones, advertencias de seguridad y enlaces de reserva de la interfaz muten instantáneamente al mismo idioma,  
**Para** experimentar una inmersión completa sin disonancia cognitiva ni elementos en lenguas mezcladas.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1 (Estado Reactivo de Idioma en OrchestratorPage):** `OrchestratorPage` captura `_sys_lang` de ignición y `/api/triage`, lo normaliza con `SupportedLanguageVo` y lo propaga a `ThermalMeter` y `HybridCanvas`.
- [x] **CA-2 (Localización de HybridCanvas):** Controles (Modificar / Ajustar hora / Cerrar / Guardar), niveles de carteristas, categorías tácticas y CTAs de afiliados (TheFork, Civitatis, etc.) consumen `UI_DICTIONARY`.
- [x] **CA-3 (Localización de ThermalMeter):** Leyendas de umbral, saturación, variable faltante y botón de despacho se resuelven con `getUiDictionary(lang)`.
- [x] **CA-4 (Colocated Tests S+ Grade):** RTL + Vitest verifican la mutación instantánea `es → fr` en medidor, lienzo y orquestador.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (Cero errores de compilación)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   ./node_modules/.bin/eslint app/orchestrator/page.tsx \
     features/triage/components/thermal-meter.tsx \
     components/tactical/hybrid-canvas.tsx
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Oráculo de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/triage/components/thermal-meter.test.tsx \
     components/tactical/hybrid-canvas.test.tsx \
     app/orchestrator/__tests__/page.test.tsx
   # Test Files: 3 passed (3)
   # Tests: 17 passed (17)
   ```

---

## 4. Artefactos Modificados

- [`src/app/orchestrator/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/page.tsx)
- [`src/app/orchestrator/__tests__/page.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/__tests__/page.test.tsx)
- [`src/components/tactical/hybrid-canvas.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/tactical/hybrid-canvas.tsx)
- [`src/components/tactical/hybrid-canvas.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/tactical/hybrid-canvas.test.tsx)
- [`src/features/triage/components/thermal-meter.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.tsx)
- [`src/features/triage/components/thermal-meter.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.test.tsx)
- [`src/features/i18n/domain/ui-dictionary.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/domain/ui-dictionary.ts)
- [`src/features/i18n/domain/ui-dictionary.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/domain/ui-dictionary.test.ts)
