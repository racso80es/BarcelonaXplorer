# [OPERATIVO] Documento Destilado: PBI - Blindaje Perimetral y Endurecimiento de Tests de Seguridad

**Identificador:** PBI-SEC-PERIM-003  
**Estatus:** Completado / Certificado en Producción (S+ Grade)  
**Fecha de Certificación:** 2026-09-24  
**Historia de Usuario Relacionada:** [HU 2.2: Anclaje Táctico y Persistencia de Larga Duración (Telegram Bridge)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/Historia%20de%20Usuario%202.2:%20Anclaje%20T%C3%A1ctico%20y%20Persistencia%20de%20Larga%20Duraci%C3%B3n%20%28Telegram%20Bridge%29.md)  
**Documento de Auditoría Base:** [AUD-SEC-TEST-001: Auditoría de Seguridad: Cobertura de Tests y Blindaje Defensivo](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20de%20Seguridad%20-%20Cobertura%20de%20Tests%20y%20Blindaje%20Perimetral.md)  
**Módulo:** Perímetro de Seguridad, Criptografía, Autenticación y Route Handlers ([`src/app/api/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api), [`src/infrastructure/security/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security))  
**Entorno:** Next.js App Router (Node.js & Edge Runtime), Vitest 4.1.11, Web Crypto API / Nodo de Producción 11  
**Prioridad:** Alta (P1 - Ciberseguridad Defensiva y Blindaje de Producción)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Endurecimiento Criptográfico Defensivo, Mitigación de Canales Laterales (*Timing Attacks*) con Pre-hashing SHA-256, Verificación Estricta de Banderas de Cookies de Sesión (`HttpOnly`, `SameSite=Lax`, `Secure`), Contención de DoS en Ingesta de Telemetría mediante validaciones Zod defensivas y Cero Fuga Criptográfica en pasarelas externas.
- **Entorno:** Route Handlers de Next.js ([`src/app/api/auth/magic-link`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/auth/magic-link), [`src/app/api/telemetry/prune`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune), [`src/app/api/telegram/anchor-link`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/anchor-link), [`src/app/api/telemetry/log`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/log)), Gateway de Telegram Bot API ([`src/infrastructure/gateways/telegram-bot-api.gateway.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/gateways/telegram-bot-api.gateway.ts)), Nodo de Producción 11.
- **Entropía Asimilada (Filtros A, B y C):** 
  - *Filtro A (Rigor Técnico y Cero Alucinación):* Erradicación de las 5 brechas identificadas en la auditoría [`AUD-SEC-TEST-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20de%20Seguridad%20-%20Cobertura%20de%20Tests%20y%20Blindaje%20Perimetral.md). Blindaje contra ataques de temporización sustituyendo operadores `!==` por una función centralizada de comparación en tiempo constante (`constantTimeEqual`) en [`src/infrastructure/security/crypto.utils.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/crypto.utils.ts) empleando pre-hashing SHA-256.
  - *Filtro C (Eficiencia Operativa / Cero Ruido):* Imposición de límites superiores a los payloads de telemetría con salvaguarda `try/catch` para prevenir ataques de denegación de servicio por agotamiento de almacenamiento en MySQL o errores no capturados por serialización.
  - *Filtro B (Soberanía y Esencia Operativa):* Asegurar que la sesión del explorador civil (`bx_session_id`) jamás sea accesible por scripts en el navegador ni pueda ser interceptada mediante canales HTTP inseguros en producción, verificándolo mediante mocks aislados de entorno en la suite de pruebas.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico y Centinela de Seguridad del Nodo 11 (Racso),  
**Quiero** subsanar las 5 brechas de seguridad perimetral detectadas en la auditoría técnica y blindar la suite de pruebas unitarias y de integración de los Route Handlers,  
**Para** garantizar que la restauración de sesiones por enlace mágico imponga cookies impenetrables contra XSS y CSRF con verificación aislada en producción, que los endpoints de mantenimiento estén blindados contra ataques de canal lateral de tiempo mediante pre-hashing criptográfico, que las manipulaciones de sesión reciban respuestas defensivas 400 Bad Request, que el token de Telegram jamás se filtre en bitácoras ante fallos de red y que la ingesta de telemetría no pueda ser saturada por payloads desproporcionados o no serializables.

---

## 2. Justificación Arquitectónica (La Vía del Yunque y Principios Fundacionales)

1. **Defensa en Tiempo Constante contra Ataques por Canal Lateral con Pre-hashing SHA-256 (CWE-208 / CWE-385):**  
   Cualquier comparación de cadenas que involucre secretos criptográficos o tokens de mantenimiento (como `CRON_SECRET` en [`/api/telemetry/prune`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts)) no debe utilizar el operador de igualdad estándar `!==`, el cual se interrumpe en el primer carácter discrepante y permite inferir secretos midiendo tiempos de CPU. Para evitar además cualquier fuga colateral derivada de la discrepancia de longitud de las cadenas, se declara una utilidad criptográfica centralizada ([`src/infrastructure/security/crypto.utils.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/crypto.utils.ts)) que pre-hashea ambas entradas con SHA-256 mediante Web Crypto API (`crypto.subtle`) y compara los digestos resultantes de 32 bytes byte a byte mediante XOR acumulativo.

2. **Blindaje de Sesión Omnicanal contra XSS y CSRF (CWE-1004 / CWE-1275):**  
   Al restaurar una sesión mediante Enlace Mágico ([`src/app/api/auth/magic-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/auth/magic-link/route.ts)), la cookie `bx_session_id` debe recibir estrictamente las directivas:
   - `httpOnly: true`: Evita la lectura de la cookie mediante `document.cookie` ante cualquier hipotético fallo de inyección en cliente.
   - `sameSite: 'lax'`: Bloquea el envío de la cookie en peticiones cruzadas originadas por sitios externos.
   - `secure: true`: Obligatorio en entornos productivos para impedir la fuga del identificador por redes Wi-Fi públicas o enlaces no cifrados.
   La suite de pruebas debe aislar el entorno mediante mock (`NODE_ENV = 'production'`) para certificar contractualmente la activación de la bandera `Secure`.

3. **Manejo Defensivo de Entradas Malformadas (Fail-Fast / 400 Bad Request):**  
   En [`src/app/api/telegram/anchor-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/anchor-link/route.ts), si un cliente inyecta una cookie `bx_session_id` con formato no-UUID, el sistema arroja una `DomainException`. En lugar de propagar una respuesta HTTP 500 (que genera ruido térmico y alertas de error en la telemetría), el servidor debe capturar específicamente las violaciones de dominio y responder con HTTP 400 Bad Request.

4. **Higiene Criptográfica y Redacción Activa de Secretos en Errores de Red (CWE-532):**  
   Los tokens de autenticación de servicios externos (`TELEGRAM_BOT_TOKEN`, claves de API de LLM) jamás deben constar en trazas de error, mensajes de excepción ni en la base de datos de telemetría. Dado que errores de red de `fetch` pueden reflejar la URL de destino (`https://api.telegram.org/bot<TOKEN>/...`), el gateway de Telegram ([`src/infrastructure/gateways/telegram-bot-api.gateway.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/gateways/telegram-bot-api.gateway.ts)) debe implementar una expresión regular de redacción que sustituya proactivamente cualquier segmento de token antes de registrar en consola.

5. **Mitigación de DoS y Robustez ante Payloads No Serializables en Telemetría (CWE-400):**  
   El endpoint `/api/telemetry/log` es accesible perimetralmente para recolectar métricas del cliente y del servidor. El esquema Zod debe acotar el tamaño del mensaje a un máximo estricto (512 caracteres, conforme a la columna `message` en `schema.prisma`) y limitar el volumen del objeto `payload` JSON con salvaguardas `try/catch` para evitar caídas no controladas provocadas por referencias circulares o datos anómalos.

---

## 3. Especificación Técnica de Contratos y Código Defensivo

### 3.1. Módulo Criptográfico Centralizado ([`src/infrastructure/security/crypto.utils.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/crypto.utils.ts))

Módulo reutilizable compatible con Edge Runtime y Node.js que realiza pre-hashing SHA-256 para neutralizar ataques basados en longitud:

```typescript
/**
 * Comparación en tiempo constante de dos cadenas secretas.
 * Emplea pre-hashing SHA-256 mediante Web Crypto API (crypto.subtle)
 * para normalizar la longitud de ambos operandos a 32 bytes fijos,
 * eliminando fugas de canal lateral tanto por contenido como por longitud.
 */
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);

  const bytesA = new Uint8Array(hashA);
  const bytesB = new Uint8Array(hashB);

  let mismatch = 0;
  for (let i = 0; i < bytesA.length; i++) {
    mismatch |= bytesA[i] ^ bytesB[i];
  }

  return mismatch === 0;
}

export function constantTimeEqualSync(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
```

---

### 3.2. Blindaje en [`src/app/api/telemetry/prune/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts)

Incorporación del módulo centralizado de tiempo constante y validación *Fail-Closed* estricta:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaTelemetryRepository } from '@/infrastructure/repositories/prisma-telemetry.repository';
import { PruneTelemetryUseCase } from '@/application/use-cases/prune-telemetry.use-case';
import { constantTimeEqual } from '@/infrastructure/security/crypto.utils';

export const runtime = 'nodejs';

const telemetryRepository = new PrismaTelemetryRepository();
const pruneUseCase = new PruneTelemetryUseCase(telemetryRepository);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const authHeader = request.headers.get('authorization');
    const cronSecretHeader = request.headers.get('x-cron-secret');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const providedSecret = bearerToken || cronSecretHeader;

    if (!providedSecret || !(await constantTimeEqual(providedSecret, expectedSecret))) {
      return NextResponse.json(
        { error: 'No autorizado: Token de mantenimiento inválido o ausente.' },
        { status: 401 },
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seguridad Fail-Closed: CRON_SECRET no está configurada en producción.' },
      { status: 401 },
    );
  }
  // ... procesamiento de poda ontológica
}
```

---

### 3.3. Captura Defensiva en [`src/app/api/telegram/anchor-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/anchor-link/route.ts)

Captura de `DomainException` ante identificadores de sesión malformados respondiendo con 400:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AesGcmAnchorTokenEncryptor } from '@/infrastructure/security/aes-gcm-anchor-token.encryptor';
import { DomainException } from '@/domain/exceptions/domain.exception';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionCookie = request.cookies.get('bx_session_id')?.value;

  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'No active session found' },
      { status: 400 }
    );
  }

  const encryptor = new AesGcmAnchorTokenEncryptor();
  try {
    const token = await encryptor.encryptSessionId(sessionCookie);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'BXplorerBot';
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return NextResponse.json({
      deepLink,
      token,
    });
  } catch (error) {
    if (error instanceof DomainException) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 } // Error de entrada del cliente, no fallo interno 500
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generating anchor link' },
      { status: 500 }
    );
  }
}
```

---

### 3.4. Restricción de Tamaño y Validación Zod Defensiva en [`src/infrastructure/ai/schemas/telemetry.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/ai/schemas/telemetry.schema.ts)

Límites de longitud y bloque `try/catch` defensivo en el `.refine()` para manejar de forma segura payloads con estructuras no serializables:

```typescript
export const TelemetryLogInputSchema = z.object({
  level: TelemetryLevelEnum.default('INFO'),
  context: TelemetryContextEnum,
  message: z.string().min(1, 'El mensaje es obligatorio').max(512, 'El mensaje excede los 512 caracteres'),
  payload: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (val === undefined || val === null) {
          return true;
        }
        try {
          return JSON.stringify(val).length <= 65536;
        } catch {
          return false;
        }
      },
      'El payload excede el límite máximo de 64KB o no es serializable'
    ),
  statusCode: z.number().int().optional().nullable(),
  durationMs: z.number().int().nonnegative().optional().nullable(),
  environment: z.string().max(32).optional().default('production'),
});
```

---

### 3.5. Redacción Activa de Tokens en [`src/infrastructure/gateways/telegram-bot-api.gateway.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/gateways/telegram-bot-api.gateway.ts)

Sanitización sistemática de cadenas de error emitidas ante fallos de red o excepciones arrojadas por `fetch`:

```typescript
const TELEGRAM_TOKEN_URL_REGEX = /\/bot[^\/\s?]+/gi;

function redactSensitiveData(message: string, botToken?: string): string {
  let redacted = message.replace(TELEGRAM_TOKEN_URL_REGEX, '/bot[REDACTED_TOKEN]');
  if (botToken && botToken.trim().length > 0) {
    redacted = redacted.replaceAll(botToken, '[REDACTED_TOKEN]');
  }
  return redacted;
}
```

---

## 4. Criterios de Aceptación (Verificación Empírica - Gherkin)

### Escenario 1: Verificación de Banderas de Seguridad en Cookie de Sesión Restaurada con Mock de Entorno
```gherkin
Dado un enlace mágico válido generado para la sesión "550e8400-e29b-41d4-a716-446655440000"
Y el entorno de ejecución configurado explícitamente mediante mock con NODE_ENV = "production"
Cuando el cliente realiza una petición GET a "/api/auth/magic-link?token=TOKEN_VALIDO"
Entonces el servidor responde con un código HTTP 307 de redirección hacia "/orchestrator?session_restored=true"
Y la cabecera "Set-Cookie" incluye la cookie "bx_session_id" con el valor de la sesión
Y la cookie tiene la directiva "HttpOnly" activa
Y la cookie tiene la directiva "SameSite=Lax"
Y la cookie incluye estrictamente la directiva "Secure" al haberse evaluado bajo el mock de "production"
```

### Escenario 2: Protección contra Timing Attacks y Fail-Closed en Ruta de Poda
```gherkin
Dado que el servidor tiene configurado CRON_SECRET="token-de-mantenimiento-super-seguro"
Cuando un atacante envía una petición POST a "/api/telemetry/prune" con "Bearer token-de-mantenimiento-falso"
Entonces la verificación se ejecuta en tiempo constante mediante pre-hashing SHA-256
Y el servidor responde con HTTP 401 Unauthorized
Y dado un entorno donde NODE_ENV="production" pero CRON_SECRET no está definida
Cuando cualquier cliente invoca POST a "/api/telemetry/prune"
Entonces el servidor responde inmediatamente con HTTP 401 Unauthorized bajo política Fail-Closed
```

### Escenario 3: Rechazo Defensivo (400) ante Manipulación de Cookie de Sesión en Enlace de Anclaje
```gherkin
Dado que un cliente manipula maliciosamente la cookie "bx_session_id" con el valor "payload-no-uuid-corrupto"
Cuando invoca el endpoint GET "/api/telegram/anchor-link"
Entonces el cifrador AES-GCM detecta que no cumple con el formato UUID canónico
Y el endpoint captura la DomainException y responde con HTTP 400 Bad Request
Y no se genera un error HTTP 500 no controlado en el servidor
```

### Escenario 4: Certificación de No-Fuga de Token en Logs de Error del Gateway de Telegram
```gherkin
Dado que TELEGRAM_BOT_TOKEN está configurado con el valor secreto "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
Cuando la API de Telegram falla o la petición fetch arroja un error de red que incluye la URL invocada
Y se captura la salida de advertencia en consola
Entonces ninguna línea de log de error contiene la subcadena "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
Y el segmento del token ha sido reemplazado por la etiqueta de redacción "[REDACTED_TOKEN]"
```

### Escenario 5: Rechazo de Payloads Desproporcionados o No Serializables en Telemetría (Mitigación DoS)
```gherkin
Dado un cliente que intenta saturar el almacenamiento enviando un payload de 100KB, un mensaje de más de 512 caracteres o un objeto con referencias circulares a "/api/telemetry/log"
Cuando despacha la petición POST
Entonces el validador Zod rechaza la solicitud de forma controlada mediante el bloque defensivo
Y el servidor responde con HTTP 400 Bad Request y un mensaje descriptivo de violación de límite o invalidez
Y no se persiste ningún registro masivo ni se produce una excepción no capturada en MySQL
```

---

## 5. Plan de Implementación Táctico (Desglose de Tareas)

### Fase 1: Endurecimiento Criptográfico, Route Handlers y Gateways
- [x] **Tarea 1.1:** Declarar y crear el módulo centralizado [`src/infrastructure/security/crypto.utils.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/crypto.utils.ts) implementando `constantTimeEqual` con pre-hashing SHA-256 (`crypto.subtle`).
- [x] **Tarea 1.2:** Refactorizar [`src/app/api/telemetry/prune/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts) importando `constantTimeEqual` de `crypto.utils.ts` para validar `providedSecret` y blindar el caso de producción sin secreto (*Fail-Closed*).
- [x] **Tarea 1.3:** Refactorizar [`src/app/api/telegram/anchor-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/anchor-link/route.ts) para capturar `DomainException` y responder con HTTP 400 Bad Request.
- [x] **Tarea 1.4:** Refactorizar [`src/infrastructure/gateways/telegram-bot-api.gateway.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/gateways/telegram-bot-api.gateway.ts) incorporando una expresión regular de redacción de tokens (`/\/bot[^\/\s?]+/gi`) en la captura de excepciones de red y timeouts para erradicar cualquier fuga de secretos en bitácoras.
- [x] **Tarea 1.5:** Ajustar la validación Zod en [`src/infrastructure/ai/schemas/telemetry.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/ai/schemas/telemetry.schema.ts) limitando `message` a 512 caracteres y robusteciendo el `.refine()` de `payload` con un bloque `try/catch` defensivo (límite 64KB).

### Fase 2: Forja de Nuevas Pruebas de Seguridad en Vitest
- [x] **Tarea 2.1:** Ampliar [`tests/app/api/auth/magic-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/auth/magic-link.test.ts) simulando un flujo exitoso con mock explícito del entorno (`vi.stubEnv('NODE_ENV', 'production')`) para certificar de forma aislada que la cabecera `Set-Cookie` contenga `HttpOnly`, `SameSite=lax` y la bandera `Secure`.
- [x] **Tarea 2.2:** Crear [`tests/infrastructure/security/crypto.utils.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/security/crypto.utils.test.ts) y ampliar [`tests/app/api/telemetry/prune.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telemetry/prune.test.ts) probando el rechazo en tiempo constante con pre-hashing SHA-256 y el bloqueo Fail-Closed cuando `CRON_SECRET` no está configurada en producción.
- [x] **Tarea 2.3:** Ampliar [`tests/app/api/telegram/anchor-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telegram/anchor-link.test.ts) probando el rechazo con HTTP 400 ante cookies de sesión no conformes a UUID.
- [x] **Tarea 2.4:** Ampliar [`tests/infrastructure/gateways/telegram-bot-api.gateway.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/gateways/telegram-bot-api.gateway.test.ts) agregando pruebas con espías de consola que simulen fallos de red (`fetch failed` con URL) y verifiquen que el `TELEGRAM_BOT_TOKEN` es redactado inequívocamente.
- [x] **Tarea 2.5:** Ampliar [`tests/app/api/telemetry/log.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telemetry/log.test.ts) validando el rechazo 400 ante mensajes mayores a 512 caracteres, payloads superiores a 64KB o payloads no serializables (referencias circulares).

### Fase 3: Validación Completa de la Suite y Certificación
- [x] **Tarea 3.1:** Ejecutar `npx tsc --noEmit` garantizando cero errores de compilación.
- [x] **Tarea 3.2:** Ejecutar la suite completa de pruebas unitarias y de integración (`npm test`) certificando el 100% de aprobación.

---

## 6. Definición de Hecho (DoD - Definition of Done)

- [x] **Cero Timing Attacks:** Todas las verificaciones de secretos en Route Handlers administrativos se ejecutan mediante `constantTimeEqual` centralizada con pre-hashing SHA-256.
- [x] **Cookies Inmunes a XSS/CSRF:** Las pruebas automatizadas afirman explícitamente los atributos `HttpOnly`, `SameSite=lax` y `Secure` en las cookies de sesión mediante mock de entorno productivo.
- [x] **Fail-Fast en Entradas Corruptas:** Las violaciones de formato UUID en cookies devuelven HTTP 400 en lugar de excepciones 500 no controladas.
- [x] **Cero Fuga Criptográfica Demostrada:** Se comprueba empíricamente mediante pruebas automatizadas que el token de Telegram es sanitizado mediante regex y no se imprime en los logs de consola ni en la telemetría.
- [x] **Contención de DoS y Resiliencia en Serialización:** Las entradas de telemetría perimetral están delimitadas en longitud y cuentan con manejo defensivo `try/catch` ante objetos no serializables.
- [x] **100% Tests Pasando:** Las nuevas pruebas de seguridad se ejecutan y aprueban sin regresiones en la suite global (262 tests superados).

---

## 7. Matriz de Trazabilidad y Archivos Clave

| Rol Arquitectónico | Ruta del Archivo en el Repositorio |
| :--- | :--- |
| **Documento de Auditoría Origen** | [`Documentacion/Auditorias/Auditoria de Seguridad - Cobertura de Tests y Blindaje Perimetral.md`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20de%20Seguridad%20-%20Cobertura%20de%20Tests%20y%20Blindaje%20Perimetral.md) |
| **PBI Certificado** | [`Documentacion/PBI/Realizado/PBI - Blindaje Perimetral y Endurecimiento de Tests de Seguridad.md`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Blindaje%20Perimetral%20y%20Endurecimiento%20de%20Tests%20de%20Seguridad.md) |
| **Utilidad Criptográfica Centralizada** | [`src/infrastructure/security/crypto.utils.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/security/crypto.utils.ts) |
| **Route Handler Magic Link** | [`src/app/api/auth/magic-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/auth/magic-link/route.ts) |
| **Route Handler Anchor Link** | [`src/app/api/telegram/anchor-link/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telegram/anchor-link/route.ts) |
| **Route Handler Poda de Logs** | [`src/app/api/telemetry/prune/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/prune/route.ts) |
| **Route Handler Ingesta Telemetría** | [`src/app/api/telemetry/log/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/telemetry/log/route.ts) |
| **Esquema Zod Telemetría** | [`src/infrastructure/ai/schemas/telemetry.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/ai/schemas/telemetry.schema.ts) |
| **Gateway Telegram Bot API** | [`src/infrastructure/gateways/telegram-bot-api.gateway.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/gateways/telegram-bot-api.gateway.ts) |
| **Suite de Pruebas Utilidades Criptográficas** | [`tests/infrastructure/security/crypto.utils.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/security/crypto.utils.test.ts) |
| **Suite de Pruebas Magic Link** | [`tests/app/api/auth/magic-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/auth/magic-link.test.ts) |
| **Suite de Pruebas Anchor Link** | [`tests/app/api/telegram/anchor-link.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telegram/anchor-link.test.ts) |
| **Suite de Pruebas Poda** | [`tests/app/api/telemetry/prune.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telemetry/prune.test.ts) |
| **Suite de Pruebas Telemetría** | [`tests/app/api/telemetry/log.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/app/api/telemetry/log.test.ts) |
| **Suite de Pruebas Telegram Gateway** | [`tests/infrastructure/gateways/telegram-bot-api.gateway.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/tests/infrastructure/gateways/telegram-bot-api.gateway.test.ts) |

---

## 8. Registro de Ejecución y Métricas de Certificación S+ Grade

- **Verificación Estática de Tipos:**
  - Comando: `npx tsc --noEmit`
  - Resultado: **0 errores de compilación**. Integridad de tipos 100% preservada.
- **Suite Automatizada de Pruebas (Vitest):**
  - Comando: `npm test`
  - Archivos de Test Ejecutados: **50 pasados (100%)**
  - Pruebas Totales Evaluadas: **262 pasadas (100%)**
  - Pruebas Nuevas / Robustecidas de Seguridad: **36 pruebas específicas en 6 archivos**
  - Regresiones Detectadas: **0**.
- **Dictamen Final:** **S+ Grade Certificado**. El perímetro de seguridad, el manejo de secretos en pasarelas externas y la gestión defensiva de cookies y telemetría cumplen con el máximo estándar de resiliencia del Nodo 11.
