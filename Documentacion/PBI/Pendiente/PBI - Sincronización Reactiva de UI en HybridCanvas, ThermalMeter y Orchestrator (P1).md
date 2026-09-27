# [OPERATIVO] Documento Destilado: PBI - Sincronización Reactiva de UI en HybridCanvas, ThermalMeter y Orchestrator

**Identificador:** PBI-I18N-UI-SYNC-004  
**Estatus:** Pendiente de Implementación (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
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
  - *Filtro A (Cero Disonancia Cognitiva y Reactividad Pura):* Al recibir `_sys_lang` desde `/api/triage`, los componentes React actualizan su contexto/estado de idioma sin parpadeos ni recarga de página.
  - *Filtro B (Localización Declarativa de Afiliados y Advertencias Tácticas):* Los textos de acción rápida (TheFork, Cabify, Tiqets, Civitatis), niveles de carteristas (`ShieldAlert`) y controles del editor de tiempo consumen el diccionario tipado `UI_DICTIONARY`.
  - *Filtro C (Medidor Térmico Localizado):* `ThermalMeter` renderiza sus leyendas de saturación, umbral y variables faltantes adaptadas al idioma del usuario.

---

## 1. Declaración de Intención (INVEST)

**Como** Explorador de BarcelonaXplorer,  
**Quiero** que al cambiar de idioma en la conversación, todos los botones, advertencias de seguridad y enlaces de reserva de la interfaz muten instantáneamente al mismo idioma,  
**Para** experimentar una inmersión completa sin disonancia cognitiva ni elementos en lenguas mezcladas.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Estado Reactivo de Idioma en OrchestratorPage):** Conectar `OrchestratorPage` para capturar `_sys_lang` devuelto por `/api/triage` y propagarlo a los componentes hijos.
- [ ] **CA-2 (Localización de HybridCanvas):** Conectar `HybridCanvas` con `UI_DICTIONARY` para traducir:
  - Botones de acción ("Modificar", "Ajustar hora", "Cerrar", etc.).
  - Niveles de alerta de carteristas ("Carteristas: Alto / Extremo / Medio / Bajo").
  - Categorías tácticas ("CULTURAL", "GASTRONOMIC", etc.).
  - Botones y CTAs de afiliados ("Asegurar Entrada", "Reservar en TheFork", etc.).
- [ ] **CA-3 (Localización de ThermalMeter):** Conectar `ThermalMeter` con `UI_DICTIONARY` para traducir sus etiquetas de saturación, umbral de supervivencia y nombres de variables.
- [ ] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias de componentes con React Testing Library y Vitest verificando la mutación instantánea ante cambios de `lang`.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):** Exit code 0.
2. **Linter AST (`eslint`):** Exit code 0 (0 warnings, 0 errores).
3. **Oráculo de Pruebas Unitarias (`vitest`):** 100% tests en verde colocated.
