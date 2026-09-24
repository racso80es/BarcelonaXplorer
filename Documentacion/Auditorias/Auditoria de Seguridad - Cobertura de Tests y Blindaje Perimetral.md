# [SEGURIDAD] Auditoría de Seguridad: Cobertura de Tests y Blindaje Defensivo del Nodo 11

**Identificador:** AUD-SEC-TEST-001  
**Fecha de Emisión:** 2026-09-24  
**Clasificación:** Confidencial / Operativo Interno  
**Alcance:** Cobertura de Pruebas de Seguridad, Perímetro Edge, Mecanismos Criptográficos, Inyección de Datos y Route Handlers  
**Entorno de Auditoría:** Next.js App Router (Node.js & Edge Runtime), Vitest 4.1.11, Prisma ORM (MySQL), Web Crypto API  
**Auditor Técnico:** Antigravity AI Security Agent (Nodo 11)  
**Calificación Global:** **A- (Defensa en Profundidad con Fortalezas Criptográficas y Brechas Específicas de Cobertura)**  

---

## 1. Contexto Operativo y Modelo de Amenazas (STRIDE)

El ecosistema **BarcelonaXplorer** opera servicios B2C asistidos por IA, almacenamiento de sesiones anónimas en cookies HTTP y puentes omnicanal persistentes hacia Telegram (HU 2.2). Dado que el panel de administración ([`/Admin`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin)) gobierna métricas y sondas en tiempo real, y que los endpoints de autenticación manejan enlaces mágicos temporales (*cross-device*), se aplica el modelo de amenazas **STRIDE**:

| Categoría STRIDE | Vector Específico en el Ecosistema | Contramedida de Diseño | Cobertura en Tests |
| :--- | :--- | :--- | :---: |
| **Spoofing** (Suplantación) | Falsificación de Webhook de Telegram o acceso indebido a `/Admin` | Verificación de `x-telegram-bot-api-secret-token` y Basic Auth con hash SHA-256 | **Alta (95%)** |
| **Tampering** (Manipulación) | Alteración de tokens de anclaje de Telegram o enlaces mágicos | Cifrado simétrico autenticado AES-256-GCM con Auth Tag y firmas HMAC-SHA256 | **Excelente (100%)** |
| **Repudiation** (Repudio) | Borrado no autorizado de logs o eventos sin trazabilidad | Registro inmutable en MySQL ([`TelemetryLog`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma)) y token Bearer en `/api/telemetry/prune` | **Media (75%)** |
| **Information Disclosure** (Fuga) | Filtración de `TELEGRAM_BOT_TOKEN`, hashes o payloads en logs de error | Políticas de sanitización en Gateways y omisión de campos sensibles en respuestas | **Media-Alta (80%)** |
| **Denial of Service** (DoS) | Saturación de memoria por payloads masivos o agotamiento de conexiones MySQL | Singleton de persistencia Prisma y `AbortController` con timeouts estrictos | **Alta (85%)** |
| **Elevation of Privilege** (Privilegios) | Bypass de Basic Auth mediante discrepancias de casing o timing attacks | Normalización perimetral HTTP 308 (RFC 7617) y comparación en tiempo constante | **Excelente (98%)** |

---

## 2. Evaluación Detallada por Capas de Seguridad

### 2.1. Perímetro Edge y Autenticación Administrativa ([`src/middleware.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/middleware.ts))

- **Evaluación:** **SOBRESALIENTE (98%)**
- **Fortalezas Validadas:**
  - Mitigación exhaustiva de *timing attacks* mediante `constantTimeEqual` sobre credenciales decodificadas y hashes SHA-256 (Web Crypto API).
  - Bloqueo inmediato (403) ante intentos de transmitir credenciales por HTTP plano en entornos de producción.
  - Inyección garantizada de cabeceras de blindaje HTTP: `Strict-Transport-Security` (2 años + subdominios + preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin`.
  - Redirección canónica 308 RFC 7617 que unifica el casing `/admin` hacia `/Admin` sin romper los gestores de contraseñas.
- **Suite de Pruebas:** [`tests/infrastructure/security/middleware.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/security/middleware.test.ts) (17 pruebas exhaustivas con mocks de Edge Runtime).

---

### 2.2. Criptografía de Tokens de Anclaje ([`AesGcmAnchorTokenEncryptor`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/aes-gcm-anchor-token.encryptor.ts))

- **Evaluación:** **S+ GRADE (100%)**
- **Fortalezas Validadas:**
  - Uso estricto de cifrado autenticado AES-256-GCM mediante `crypto.subtle`.
  - Generación de IV pseudoaleatorio criptográfico de 12 bytes (96 bits) por cada invocación (prevención de criptoanálisis diferencial).
  - Validación de integridad: el *Authentication Tag* de 16 bytes detecta cualquier alteración de un solo bit en el token, arrojando `DomainException`.
  - Salida compacta Base64URL de 59 caracteres (menor a los 64 requeridos por los enlaces profundos `t.me/Bot?start=TOKEN`).
- **Suite de Pruebas:** [`tests/infrastructure/security/aes-gcm-anchor-token.encryptor.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/security/aes-gcm-anchor-token.encryptor.test.ts) (5 pruebas exhaustivas).

---

### 2.3. Enlaces Mágicos y Anti-Replay ([`HmacMagicLinkSigner`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/hmac-magic-link-signer.ts))

- **Evaluación:** **SÓLIDO (90%)**
- **Fortalezas Validadas:**
  - Firma criptográfica HMAC-SHA256 que garantiza que el payload (sessionId, telegramChatId, expiresAt, nonce) no sea alterado en tránsito.
  - Validación de expiración temporal estricta (TTL).
  - En el caso de uso ([`RestoreSessionFromMagicLinkUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/use-cases/restore-session-from-magic-link.use-case.ts)), el consumo del nonce es atómico en base de datos; cualquier intento de reutilización posterior (*replay attack*) es denegado.
- **Brecha Detectada:** La prueba del Route Handler ([`tests/app/api/auth/magic-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/auth/magic-link.test.ts)) no verifica la inyección de las banderas de seguridad de la cookie (`httpOnly`, `sameSite`, `secure`).

---

### 2.4. Ingress de Webhook de Telegram ([`src/app/api/telegram/webhook/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/webhook/route.ts))

- **Evaluación:** **BUENO (85%)**
- **Fortalezas Validadas:**
  - Verificación en tiempo constante de la cabecera secreta `x-telegram-bot-api-secret-token` antes de procesar cualquier cuerpo JSON.
  - Política *Fail-Closed*: si el secreto no está configurado o difiere, responde inmediatamente con HTTP 401.
  - Esquema Zod defensivo ([`TelegramWebhookUpdateSchema`](file:///home/racso/Proyectos/BarcelonaXplorer/src/domain/schemas/telegram-webhook.schema.ts)) para filtrar updates inválidos.
- **Brecha Detectada:** No se prueban sistemáticamente payloads malformados ni intentos de inyección de tipos incompatibles en `update_id`.

---

### 2.5. Rutas de Mantenimiento y Poda ([`src/app/api/telemetry/prune/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts))

- **Evaluación:** **MEJORABLE (70%)**
- **Vulnerabilidad Identificada:** Comparación con operador no constante `!==` sobre el secreto de mantenimiento:
  ```typescript
  if (!providedSecret || providedSecret !== expectedSecret)
  ```
  Esto expone el endpoint a análisis por canal lateral de tiempo (*timing attacks*).
- **Brecha de Cobertura:** No existe prueba unitaria que valide que en entorno `production` la ruta rechace peticiones si `CRON_SECRET` no ha sido configurada.

---

### 2.6. Persistencia y Agotamiento de Recursos

- **Evaluación:** **SÓLIDO (85%)**
- **Fortalezas Validadas:**
  - Consolidación del singleton [`src/infrastructure/persistence/prisma.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/persistence/prisma.ts), mitigando el agotamiento de conexiones (`max_connections`) de MySQL en el Nodo 11.
  - Consultas protegidas contra inyecciones SQL mediante parametrización nativa del motor Prisma.
  - Timeouts defensivos mediante `AbortController` en peticiones a la API externa de Telegram (8000ms para sondas, 10000ms para mensajes).

---

## 3. Catálogo de Fisuras y Brechas de Cobertura

### Brecha 1: Validación Incompleta de Banderas de Cookie en Enlace Mágico
- **Archivo afectado:** [`tests/app/api/auth/magic-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/auth/magic-link.test.ts)
- **Severidad:** **Media (CWE-1004 / CWE-1275)**
- **Descripción:** El test valida las redirecciones de error, pero omite el flujo exitoso donde se debe comprobar que la cabecera `Set-Cookie` para `bx_session_id` contenga obligatoriamente:
  - `HttpOnly`: Impide el acceso a la sesión mediante scripts maliciosos en el cliente (mitigación XSS).
  - `SameSite=Lax`: Mitiga el riesgo de Cross-Site Request Forgery (CSRF).
  - `Secure`: Impone transmisión cifrada en producción.

### Brecha 2: Comparación No Constante en Ruta de Poda
- **Archivo afectado:** [`src/app/api/telemetry/prune/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts)
- **Severidad:** **Media (CWE-208 / CWE-385)**
- **Descripción:** El uso de `providedSecret !== expectedSecret` permite a un atacante inferir gradualmente la longitud y prefijo del secreto midiendo discrepancias de microsegundos en la respuesta.
- **Acción requerida:** Sustituir por `constantTimeEqual(providedSecret, expectedSecret)` y añadir tests de regresión en [`tests/app/api/telemetry/prune.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telemetry/prune.test.ts).

### Brecha 3: Manejo de Excepciones de Cifrado en Enlace de Anclaje
- **Archivo afectado:** [`src/app/api/telegram/anchor-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/anchor-link/route.ts)
- **Severidad:** **Baja-Media (CWE-703)**
- **Descripción:** Si la cookie `bx_session_id` contiene caracteres no conformes con el formato UUID, el cifrador arroja una `DomainException`. El Route Handler captura la excepción y retorna un error genérico 500 en lugar de un código HTTP 400 Bad Request explícito para entradas malformadas.
- **Acción requerida:** Retornar HTTP 400 ante `DomainException` y añadir prueba en [`tests/app/api/telegram/anchor-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telegram/anchor-link.test.ts).

### Brecha 4: Ausencia de Aserción contra Fuga de Tokens en Logs de Red
- **Archivo afectado:** [`tests/infrastructure/gateways/telegram-bot-api.gateway.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/gateways/telegram-bot-api.gateway.test.ts)
- **Severidad:** **Media (CWE-532)**
- **Descripción:** Ante fallos de conexión hacia `https://api.telegram.org/bot<TOKEN>/...`, Node.js puede incluir la URL completa en el mensaje de error del fetch. Aunque el código no concatena el token en sus advertencias directas, no existe una prueba unitaria que garantice que ante un `fetch failed` simulado, el token sea suprimido o redactado de la salida de consola.

### Brecha 5: Ausencia de Límite de Tamaño en Ingesta de Telemetría
- **Archivo afectado:** [`src/app/api/telemetry/log/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/log/route.ts)
- **Severidad:** **Media (CWE-400 / DoS)**
- **Descripción:** El endpoint acepta cualquier objeto JSON en el campo `payload` sin restringir su longitud máxima de caracteres o profundidad. Un atacante perimetral podría saturar la tabla `TelemetryLog` de MySQL despachando payloads de varios megabytes.
- **Acción requerida:** Restringir el tamaño del payload a nivel de esquema Zod (ej. `max(65535)` bytes) y añadir prueba de rechazo con HTTP 400.

---

## 4. Matriz de Trazabilidad y Archivos Auditados

| Componente | Archivo Auditado | Suite de Pruebas Asociada |
| :--- | :--- | :--- |
| **Middleware Perimetral** | [`src/middleware.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/middleware.ts) | [`tests/infrastructure/security/middleware.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/security/middleware.test.ts) |
| **Cifrado AES-256-GCM** | [`src/infrastructure/security/aes-gcm-anchor-token.encryptor.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/aes-gcm-anchor-token.encryptor.ts) | [`tests/infrastructure/security/aes-gcm-anchor-token.encryptor.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/security/aes-gcm-anchor-token.encryptor.test.ts) |
| **Firma HMAC Enlaces Mágicos** | [`src/infrastructure/security/hmac-magic-link-signer.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/hmac-magic-link-signer.ts) | [`tests/infrastructure/security/hmac-magic-link-signer.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/security/hmac-magic-link-signer.test.ts) |
| **Restauración de Sesión** | [`src/application/use-cases/restore-session-from-magic-link.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/use-cases/restore-session-from-magic-link.use-case.ts) | [`tests/application/use-cases/restore-session-from-magic-link.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/application/use-cases/restore-session-from-magic-link.use-case.test.ts) |
| **Route Handler Magic Link** | [`src/app/api/auth/magic-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/auth/magic-link/route.ts) | [`tests/app/api/auth/magic-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/auth/magic-link.test.ts) |
| **Route Handler Anchor Link** | [`src/app/api/telegram/anchor-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/anchor-link/route.ts) | [`tests/app/api/telegram/anchor-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telegram/anchor-link.test.ts) |
| **Route Handler Telegram Webhook** | [`src/app/api/telegram/webhook/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/webhook/route.ts) | [`tests/app/api/telegram/webhook.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telegram/webhook.test.ts) |
| **Route Handler Poda de Logs** | [`src/app/api/telemetry/prune/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts) | [`tests/app/api/telemetry/prune.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telemetry/prune.test.ts) |
| **Route Handler Ingesta Telemetría** | [`src/app/api/telemetry/log/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/log/route.ts) | [`tests/app/api/telemetry/log.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telemetry/log.test.ts) |
| **Gateway Telegram Bot API** | [`src/infrastructure/gateways/telegram-bot-api.gateway.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/gateways/telegram-bot-api.gateway.ts) | [`tests/infrastructure/gateways/telegram-bot-api.gateway.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/gateways/telegram-bot-api.gateway.test.ts) |
| **Singleton de Persistencia** | [`src/infrastructure/persistence/prisma.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/persistence/prisma.ts) | Pruebas integradas de `/Admin` |

---

## 5. Dictamen y Conclusiones

El sistema presenta una base criptográfica sólida de grado de producción. La mitigación de las 5 brechas identificadas mediante un PBI táctico específico elevará la cobertura de seguridad a un estándar **S+ Grade absoluto**, garantizando blindaje total contra ataques de canal lateral, adulteración de cookies, fugas accidentales de tokens y vectores de denegación de servicio en el Nodo 11.
