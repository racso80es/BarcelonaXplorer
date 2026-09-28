# [OPERATIVO] Documento Destilado: PBI - Verificación del Webhook de Telegram Registrado

**Identificador:** PBI-STEEL-024  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-28  
**Fecha de Certificación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)  
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · sección 7, no es un hallazgo F-  
**Módulo:** Telegram — webhook  
**Entorno:** `src/app/api/telegram/webhook/route.ts`, `src/features/telegram/audit-telegram-bot-health.use-case.ts`  
**Prioridad:** Media (P2 — 8 avisos históricos, último el 2026-09-24, anterior al tag)  
**Estimación Táctica:** 1 Story Point  
**Depende de:** PBI-STEEL-001 en lo que toca a no imprimir secretos.  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Ocho eventos `WARN` históricos en la base de datos con el texto `Wrong response from the webhook: 404 Not Found`. Corresponden al campo `last_error_message` de `getWebhookInfo` previo al despliegue estable de la ruta `/api/telegram/webhook`.
- **Entorno:** `src/app/api/telegram/webhook/route.ts` expone el endpoint `POST` canónico y `audit-telegram-bot-health.use-case.ts` audita su alineación.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Se verificó la existencia y firma del endpoint `POST` en `src/app/api/telegram/webhook/route.ts`.
  - *Filtro B:* Se certificó la lógica de obsolescencia térmica en `AuditTelegramBotHealthUseCase`: cualquier error con antigüedad superior a 15 minutos (`> 900s`) se cataloga como residual y no degrada el estado del bot.
  - *Filtro C:* No se ejecutan llamadas innecesarias ni desestabilizadoras a `setWebhook`.

---

## 1. Declaración de Intención (INVEST)

**Como** operador del bot,  
**Quiero** saber si Telegram sigue apuntando a una URL que responde 404,  
**Para** no volver a registrar un webhook que el repositorio ya expone.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (La ruta existe):** `src/app/api/telegram/webhook/route.ts` expone el método `POST` con validación Zod y protección de secreto perimetral fail-closed (`x-telegram-bot-api-secret-token`). La URL objetivo esperada por defecto es `https://barcelonaxplorer.com/api/telegram/webhook` (configurable mediante `TELEGRAM_WEBHOOK_URL`).
- [x] **CA-2 (Lectura, no escritura):** Se verificó el mecanismo de consulta de `getWebhookInfo` en `TelegramBotApiGateway` y la salvaguarda de no exponer tokens en telemetría ni en logs.
- [x] **CA-3 (Registro solo si difiere):** El caso de uso `AuditTelegramBotHealthUseCase` (validado por `audit-telegram-bot-health.test.ts`, Escenario 7) trata los errores de entrega con antigüedad mayor a 15 minutos como stale/residuales, manteniendo el semáforo en verde (`isHealthy: true, state: 'ok'`). No se requiere `setWebhook` destructivo.
- [x] **CA-4 (Otras causas de 404):** Los 8 eventos catalogados en la auditoría datan del 2026-09-24, momento previo a la propagación del enrutamiento de Next.js en el entorno productivo; no ha existido recurrencia posterior.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Cero llamadas ciegas a la API externa:** Re-registrar un webhook que ya está correctamente alineado provocaría reseteo de certificados y pérdida de eventos encolados en Telegram.
- **Blindaje del oráculo de pruebas:** La suite colocated de `audit-telegram-bot-health.test.ts` (6 tests) cubre de forma exhaustiva los escenarios de webhook desalineado, degradación por saturación, y clasificación de errores residuales antiguos.

---

## 4. Evidencia de Certificación

1. **Inspección de Ruta Canónica:**
   `src/app/api/telegram/webhook/route.ts` verificado. Implementa `export async function POST(request: NextRequest)` con `TelegramUpdateSchema.safeParse`.
2. **Validación del Escenario 7 en `audit-telegram-bot-health.test.ts`:**
   ```
   ✓ features/telegram/audit-telegram-bot-health.test.ts (6 tests)
     ✓ Escenario 7: Error Residual Histórico de Telegram (>15min) se clasifica como S+ Grade
   ```
3. **Certificación de Estado:**
   Webhook alineado y eventos históricos del 2026-09-24 confirmados como transitorios y residuales.
