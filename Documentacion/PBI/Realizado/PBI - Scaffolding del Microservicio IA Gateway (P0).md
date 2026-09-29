# [OPERATIVO] Documento Destilado: PBI - Scaffolding del Microservicio IA Gateway

**Identificador:** PBI-GW-001  
**Estatus:** Completado  
**Fecha de Creación:** 2026-09-29  
**Fecha de Culminación:** 2026-09-29  
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)  
**Módulo:** `ia-gateway/`  
**Entorno:** Node.js / TypeScript, Zod 4, Vitest  
**Prioridad:** Crítica (P0 — Fundacional)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** —  
**Bloqueo:** Ninguno (Decisión D-1 resuelta: microservicio en `ia-gateway/`)  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Creación del esqueleto del microservicio: estructura de directorios, configuración de TypeScript, esquemas Zod de entrada/salida para ambos endpoints, sobre `OperationEnvelope<T>` propio del gateway, middleware de autenticación por secreto compartido y servidor HTTP.
- **Entorno:** `ia-gateway/` en raíz de repositorio. Node.js nativo / TypeScript estricto.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Localidad):* Estructura interna modular con tests colocalizados para sobre, auth, esquemas y servidor.
  - *Filtro B (Determinismo):* Sobre `OperationEnvelope<T>` replica la forma canónica de [`operation-envelope.ts`](../../../src/shared/operation-envelope.ts) con soporte para esquemas Zod.
  - *Filtro C (Seguridad):* Autenticación por `x-ia-gateway-secret` mediante `timingSafeCompare` (SHA-256 en tiempo constante) y rechazo `401` estructurado.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,  
**Quiero** disponer de un microservicio TypeScript con estructura limpia, autenticación interna y contratos Zod definidos,  
**Para** que los PBIs posteriores implementen la lógica de cada endpoint sobre una base sólida y tipada.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Estructura):** Directorio `ia-gateway/` con `tsconfig.json` estricto (`strict: true`, `noUncheckedIndexedAccess: true`), `package.json` con dependencias (Zod 4, `@google/genai`, `groq-sdk`) y scripts `dev`, `build`, `test`, `typecheck`.
- [x] **CA-2 (Sobre Tipado):** `OperationEnvelope<T>` definido con Zod para serialización y validación, misma forma que el canónico del monolito (`success`, `exitCode`, `result`, `feedback`, `errors`).
- [x] **CA-3 (Esquemas de Entrada):** Esquemas Zod para los payloads de `/v1/llm/generate` y `/v1/decision/evaluate` según la tabla de la HU-16 §2.2, con discriminador de tipo de primitiva (`noul` | `choice`) y validaciones estrictas.
- [x] **CA-4 (Middleware Auth):** Toda petición sin cabecera `x-ia-gateway-secret` válida recibe `401` con `OperationEnvelope` de error. Comparación en tiempo constante. `GET /healthz` exento de autenticación.
- [x] **CA-5 (Servidor HTTP):** Servidor HTTP nativo en `server.ts` que arranca, responde `200` en `GET /healthz` y rechaza rutas no registradas con `404`.
- [x] **CA-6 (Oráculos):** `tsc --noEmit` y tests unitarios del middleware, esquemas, sobre y servidor pasan en verde. Cero `any`.

---

## 3. Evidencia de Certificación de Oráculos

1. **Vitest en IA Gateway:**
   - 4 archivos de test ejecutados: `envelope.test.ts`, `auth.test.ts`, `schemas.test.ts`, `server.test.ts`.
   - 17 tests superados (100% verde).
2. **TypeScript en IA Gateway (`tsc --noEmit`):**
   - 0 errores de compilación con `strict: true` y `noUncheckedIndexedAccess: true`.
3. **Oráculos del Monolito (`src/`):**
   - Tests: 90 archivos pasados (478 tests verdes).
   - Tipado: `tsc --noEmit` sin errores.
   - Linter: `eslint` con cero advertencias y cero errores.
