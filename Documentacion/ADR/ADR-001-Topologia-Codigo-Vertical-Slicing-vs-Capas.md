# [ADR-001] Adopción Canónica de Vertical Slicing y Localidad de Comportamiento frente a Fragmentación por Capas

- **Estatus:** ACEPTADO / RATIFICADO POR EL VÉRTICE BIOLÓGICO
- **Fecha de Decisión:** 2026-09-25
- **Autor / Evaluador:** Google Antigravity & Vértice Biológico (Racso)
- **Historia de Usuario Relacionada:** [Auditoría de Fricción Algorítmica (Evaluación Arquitectónica A vs B)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/Historia%20de%20Usuario:%20Auditor%C3%ADa%20de%20Fricci%C3%B3n%20Algor%C3%ADtmica%20%28Evaluaci%C3%B3n%20Arquitect%C3%B3nica%20A%20vs%20B%29.md)
- **PBI de Origen (Test Empírico):** [`PBI-ARCH-TEST-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Test%20de%20Fricci%C3%B3n%20Algor%C3%ADtmica%20-%20Evaluaci%C3%B3n%20Emp%C3%ADrica%20de%20Opciones%20Arquitect%C3%B3nicas%20%28A%20vs%20B%29.md)
- **PBI de Aplicación (Ejecución):** [`PBI-ARCH-APPLY-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Aplicaci%C3%B3n%20Definitiva%20de%20Modificaciones%20Arquitect%C3%B3nicas%20Post-Veredicto.md)

---

## 1. Contexto y Planteamiento del Problema

El ecosistema BarcelonaXplorer utilizaba históricamente una arquitectura hexagonal fragmentada horizontalmente por capas técnicas (`domain/`, `application/`, `infrastructure/`, `app/`, con una estructura espejo en `tests/`).

Bajo el **Axioma I de la Constitución (Ley de Economía Termodinámica)**, se prohíbe la dispersión entrópica del código para proteger la memoria de trabajo y la ventana de contexto de los agentes de IA (Google Antigravity). Un análisis estático preliminar reveló que alterar una funcionalidad atómica requería consultar y modificar entre 4 y 8 directorios dispersos (*context hops*), generando:
1. Saturación prematura de la ventana de contexto.
2. Desgaste espacial por navegación entre carpetas anidadas.
3. Desorientación sobre la ubicación de los archivos de prueba unitarios en la carpeta espejo `tests/`.

Para dilucidar empíricamente si la **Arquitectura Fragmentada por Capas (Status Quo)** o la arquitectura de **Vertical Slicing (Localidad de Comportamiento)** era superior, se formuló y ejecutó el **PBI-ARCH-TEST-001** en dos ramas de laboratorio huérfanas (`feat/test-arch-fragmentada` y `feat/test-arch-localidad`), bajo un protocolo de inyección ciega estandarizado y con descontaminación vectorial entre ejecuciones.

---

## 2. Telemetría Empírica Registrada (Evaluación de Argos)

Vector de prueba ejecutado: *"Inyección del campo autovalidado `mood` en el flujo de triaje, participación con peso 10 en la Matriz de Densidad y emisión en telemetría"*.

| Métrica de Fricción | Rama A (Capas Fragmentadas) | Rama B (Vertical Slicing) | Delta / Impacto | Ganador |
|---|:---:|:---:|:---:|:---:|
| **Carga de Contexto (Archivos)** | 7 archivos leídos | 3 archivos leídos | **-57.1%** | 🟢 **Rama B** |
| **Carga de Contexto (Líneas)** | ~1,450 líneas | ~550 líneas | **-62.1%** | 🟢 **Rama B** |
| **Context Hops (Saltos espaciales)** | 6 saltos no adyacentes | 2 saltos adyacentes | **-66.7%** (≤ 3 umbral Axioma I) | 🟢 **Rama B** |
| **Índice de Fricción (Iteraciones)** | 2 intentos (1 fallo TS) | 1 intento directo | **-50.0%** (Cero corrección) | 🟢 **Rama B** |
| **Tasa de Interceptación** | 1 error compile / 0 runtime | 0 errores compile / 0 runtime | Superior visibilidad en B | 🟢 **Rama B** |
| **Desgaste Espacial (Incidentes)** | 2 incidentes de path | 0 incidentes | **-100%** fricción espacial | 🟢 **Rama B** |
| **Tiempo Total de Forja** | ~6.0 minutos | ~2.5 minutos | **-58.3%** tiempo invertido | 🟢 **Rama B** |
| **Autonomía de Testing** | Parcial (búsqueda en `tests/`) | Absoluta (colocated en feature) | Tests viven junto al código | 🟢 **Rama B** |

---

## 3. Decisión

Se adopta **Vertical Slicing con Localidad de Comportamiento** como la **topología oficial y canónica** de organización de código para todo el repositorio BarcelonaXplorer.

A partir de la ejecución de [`PBI-ARCH-APPLY-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Aplicaci%C3%B3n%20Definitiva%20de%20Modificaciones%20Arquitect%C3%B3nicas%20Post-Veredicto.md):
1. El código de negocio se organizará modularmente bajo `src/features/<modulo>/` (ej. `triage`, `telemetry`, `routes`, `auth`).
2. Cada vertical funcional encapsulará sus esquemas Zod, Value Objects, casos de uso, interfaces/puertos y sus correspondientes tests unitarios (`<feature>.test.ts`).
3. Se mantiene intacto el aislamiento hexagonal de dominio y la Clean Architecture: los componentes UI y Server Components consumirán exclusivamente los puertos exportados por el barrel `index.ts` de cada vertical.
4. Las pruebas unitarias e integración de cada vertical residirán **colocadas** dentro del mismo directorio de la feature (`src/features/<modulo>/<modulo>.test.ts`), habilitando en `vitest.config.ts` la resolución nativa de `./**/*.test.{ts,tsx}`.

---

## 4. Consecuencias y Mitigación de Riesgos

### Positivas:
- **Cumplimiento estricto del Axioma I:** Toda operación atómica es comprensible en ≤ 3 archivos dentro del mismo directorio.
- **Reducción del 60%+ en consumo de tokens** en prompts dirigidos a agentes de desarrollo IA.
- **Eliminación del riesgo de desincronización** entre el código fuente y las suites de test reflejadas.
- **Cero alucinaciones estructurales** en Google Antigravity gracias a la proximidad semántica.

### Negativas / Riesgos Gestionados:
- **Deuda Técnica de Migración:** Mover ~135 archivos fuente existentes puede colapsar imports de la capa de presentación.
  - *Mitigación:* Se ejecutará obligatoriamente bajo el **Documento Oficial de Planificación de Refactorización** (`PBI-ARCH-APPLY-001`) con `git mv` mandatorio y fase de alias duales en `tsconfig.json`.
- **Preservación del Historial Git:**
  - *Mitigación:* Prohibición absoluta de `cp` + `rm`; uso de `git mv` para preservar `git blame` e integridad rúnica.

---

## 5. Enmiendas Constitucionales para [`CONSTITUTION.MD`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.MD)

En la ejecución de [`PBI-ARCH-APPLY-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Aplicaci%C3%B3n%20Definitiva%20de%20Modificaciones%20Arquitect%C3%B3nicas%20Post-Veredicto.md), se enmendará el **Capítulo II (El Dogma del Código Inmutable)** de [`CONSTITUTION.MD`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.MD) para sustituir la Cláusula de Evolución Temporal por la ratificación definitiva de Vertical Slicing como topología canónica.
