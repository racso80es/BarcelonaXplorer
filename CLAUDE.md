# CLAUDE.md - Directrices de Desarrollo para BarcelonaXplorer

Toda interacción de Claude Code o agentes CLI en este repositorio está sometida al **Protocolo de Acero (Grado S+)** y a la Constitución del proyecto ([`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md)).

## Biblioteca Canónica de Normas
La autoridad técnica y los estándares de desarrollo residen centralizados de forma inmutable en:
[`/.SddIA/library/norms/`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/)

## Axiomas Clave a Cumplir
1. **Vertical Slicing:** Código de negocio bajo `src/features/<modulo>/`. Tests unitarios e integración colocalizados en la feature (`<modulo>.test.ts`). Máximo 3 archivos adyacentes por tarea.
2. **Tipado Hermético:** Prohibido `any`. Parseo con Zod en bordes. Value Objects inmutables.
3. **YAML Canónico:** Todo archivo de configuración e IaaC debe usar YAML comentado según [`Estandar-Formato-Configuracion.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/Estandar-Formato-Configuracion.yml).
4. **Verificación Estricta:** Validar siempre con `npm run test` (Vitest), `npx tsc --noEmit` y `npx eslint`. Cero auto-aprobación.
5. **Sobres Deterministas:** Contrato `OperationEnvelope<T>` en APIs y herramientas.
