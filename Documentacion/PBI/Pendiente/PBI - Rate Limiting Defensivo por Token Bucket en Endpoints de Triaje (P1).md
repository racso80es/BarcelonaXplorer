# [OPERATIVO] Documento Destilado: PBI - Rate Limiting Defensivo por Token Bucket en Endpoints de Triaje

**Identificador:** PBI-SEC-RATE-001  
**Estatus:** Pendiente / Listo para Forja (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Optimización Kaizen, Resiliencia Perimetral y Eficiencia Cognitiva v2.1.0](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Optimizaci%C3%B3n%20Kaizen,%20Resiliencia%20Perimetral%20y%20Eficiencia%20Cognitiva%20v2.1.0.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** `src/features/auth/`, `src/app/api/triage/`, `src/app/api/orchestrator/`  
**Entorno:** Next.js 16 (App Router / Edge Runtime), Web Crypto API, In-Memory Sliding Token Bucket  
**Prioridad:** Alta (P1 - Crítico para la Protección de Cuotas LLM y Prevención de DoS)  
**Estimación Táctica:** 2 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Implementación de un arnés de estrangulamiento y limitación de tasa (*Rate Limiting*) mediante el algoritmo de *Token Bucket* en memoria con ventanas deslizantes, protegiendo las rutas públicas de inferencia frente a ataques de fuerza bruta o agotamiento accidental de cuotas en Groq y Google Gemini.
- **Entorno:** `src/features/auth/` (puertos y entidades del limitador de tasa), middleware perimetral o guardias en Route Handlers `/api/triage` y `/api/orchestrator`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Erradicación de estados indeterminados. Ante exceso de tasa, se responde con código HTTP 429 y un sobre determinista `OperationEnvelope` informando con precisión milimétrica del tiempo de enfriamiento (`retryAfterSeconds`).
  - *Filtro B (Determinismo y Soberanía):* Sin dependencias de servicios externos opacos (ej. Upstash o Redis pesado) para el nodo autónomo; fallback a almacén en memoria con clave hash SHA-256 de la IP/cabecera de cliente.
  - *Filtro C (Eficiencia Operativa):* Consumo de CPU $\le 1\text{ ms}$ por comprobación; cero impacto en la latencia para peticiones legítimas.

---

## 1. Declaración de Intención (INVEST)

**Como** Guardián de Seguridad Perimetral y Custodio de Recursos (Vértice Biológico),  
**Quiero** blindar las rutas públicas de entrada al motor de triaje y orquestación con limitación de tasa por cubeta de fichas,  
**Para** evitar que agentes maliciosos o bucles descontrolados en cliente saturen la inferencia de Groq/Gemini, preservando la cuota operativa del sistema y la estabilidad del servidor.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Entidad y Algoritmo Token Bucket):** Modelado en `src/features/auth/` de un `TokenBucketRateLimiter` puro, inmutable y configurable (capacidad máxima: 10 fichas; recarga: 1 ficha cada 6 segundos; ventana de 1 minuto).
- [ ] **CA-2 (Guardia de Entrada en `/api/triage`):** Intercepción de cada petición determinando la clave cliente (IP anonimizada o token de sesión). Si los tokens se agotan, retorna `HTTP 429` encapsulado en `OperationEnvelope` con cabecera `Retry-After`.
- [ ] **CA-3 (Registro Sensorial de Seguridad):** Todo rechazo por exceso de peticiones genera un log de telemetría de nivel `WARN` en el contexto `SECURITY_PERIMETER` con la IP sanitizada y el recuento de bloqueos.
- [ ] **CA-4 (Cobertura de Pruebas Unitarias):** Tests colocados en `src/features/auth/token-bucket.test.ts` verificando el consumo de fichas, la recarga temporal y el comportamiento bajo ráfagas concurrentes.
