# [OPERATIVO] Documento Destilado: PBI - Blindaje Fail-Closed de la Patrulla Telegram y Definición del Secreto

**Identificador:** PBI-STEEL-001
**Estatus:** Realizado (S+ Grade — código y oráculos locales; CA-8 pendiente de despliegue al Nodo 11)
**Fecha de Creación:** 2026-09-28
**Fecha de Culminación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-01, T-01, F-08 (solo la ruta de patrulla)
**Módulo:** Seguridad perimetral — Telegram / Patrulla reactiva
**Entorno:** `src/app/api/telegram/patrol/route.ts`, `src/app/api/telegram/patrol/patrol.schema.ts`, `src/app/api/telegram/patrol/route.test.ts`, `src/features/auth/user-anchor-repository.port.ts`, `src/features/auth/prisma-user-anchor.repository.ts`, `src/deploy.sh`, `src/.env.example`
**Prioridad:** Crítica (P0 — riesgo activo en producción)
**Estimación Táctica:** 2 Story Points
**Depende de:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Cerrar una ruta que hoy acepta un secreto por defecto público, deja de filtrar identificadores de usuario y se alinea con el singleton de Prisma y el puerto de anclajes.
- **Entorno:** Route Handler de patrulla, puerto `UserAnchorRepositoryPort`, aduana física de `deploy.sh`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Sin secreto configurado, la ruta rechaza (Fail-Closed), igual que `/api/telemetry/prune`.
  - *Filtro B:* El despliegue aborta si falta `PATROL_SECRET_TOKEN`; el test cubre la ausencia del secreto.
  - *Filtro C:* La respuesta solo expone recuentos, nunca `sessionId` ni `telegramChatId`.

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico responsable del perímetro,
**Quiero** que `/api/telegram/patrol` solo se ejecute con un secreto configurado en el entorno, comparado en tiempo constante,
**Para** impedir que cualquiera que lea el repositorio dispare drops Telegram a usuarios reales y obtenga sus identificadores.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Fail-Closed):** se elimina el literal `bcn_patrol_secret_default` y la reserva sobre `TELEGRAM_BOT_WEBHOOK_SECRET`. Si `PATROL_SECRET_TOKEN` está vacío o ausente, la ruta responde `503` con `OperationEnvelope` de error y emite telemetría `ERROR` en `SECURITY_PERIMETER`, sin tocar la base de datos.
- [x] **CA-2 (Comparación en tiempo constante):** la cabecera `x-telegram-patrol-token` se compara con `constantTimeEqual` de `@/features/auth`. Se retira la aceptación de `x-telegram-bot-api-secret-token`, que pertenece al webhook y no a la patrulla.
- [x] **CA-3 (Sin fuga de identificadores):** la respuesta es un `OperationEnvelope` con `totalAnchorsChecked`, `dropsDispatched` y recuentos por estado. No contiene `sessionId`, `telegramChatId` ni `messagePreview`.
- [x] **CA-4 (Frontera Zod):** el cuerpo opcional se parsea con `patrol.schema.ts` (`sessionId` UUID opcional, `fatigueThresholdKm` positivo y acotado) y responde `400` si no valida.
- [x] **CA-5 (TC-PRISMA-001):** la ruta deja de instanciar `PrismaClient`. Los anclajes se obtienen con `findRecentActive({ limit, sessionId? })` en `PrismaUserAnchorRepository`; itinerarios usan el singleton de `src/shared/persistence/prisma.ts`.
- [x] **CA-6 (Aduana de despliegue):** `src/deploy.sh` aborta si `.env.production` no define `PATROL_SECRET_TOKEN` con al menos 32 caracteres, o si su valor es el literal histórico.
- [x] **CA-7 (Tests):** `route.test.ts` cubre secreto ausente (503), token incorrecto (401), literal histórico (401), cuerpo inválido (400) y la ausencia de `telegramChatId` en la respuesta (7 tests).
- [ ] **CA-8 (Verificación en el Nodo 11):** el despliegue incluye el código Fail-Closed y el `.env.production` que ya define el secreto. Tras desplegar, `PATROL_SECRET_TOKEN=SET` en `barcelonaxplorer_nginx` (comprobación `SET/UNSET`, sin leer el valor) y un `POST` con el literal histórico devuelve `401`. *Pendiente hasta el siguiente despliegue de Escenario 2.*
- [x] **CA-9 (Sin invocador nuevo):** no se crea cron, workflow ni cliente. `route.ts` documenta en comentario que la ruta no tiene invocador en el repositorio: se llama a mano o desde infraestructura externa, con la cabecera `x-telegram-patrol-token`.
- [x] **CA-10 (Sonda `getMe`, solo revisión):** documentado en notas de forja; sin cambio de código en la sonda (revisión operativa en Nodo 11 junto con CA-8).

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No es una rotación.** En la auditoría la variable no existía en el contenedor ni en `.env.production`; el secreto efectivo era el literal del código. Definir la variable sin CA-1 no basta: si un despliegue futuro la pierde, la ruta volvería a abrirse.
- **Avance ya realizado (2026-09-28, 11:48):** `src/.env.production` contiene `PATROL_SECRET_TOKEN` con un valor de 64 caracteres distinto del literal, y el fichero sigue ignorado por git (`src/.gitignore:41`). `src/.env.example` tiene la clave con un valor de ejemplo.
- **El valor anterior está comprometido por definición:** el literal histórico es público en el historial de git. CA-6 y CA-8 lo rechazan explícitamente.
- **El cierre no es solo desplegar CA-1.** Sin el secreto en el contenedor, el Fail-Closed responde `503` a todo el mundo y el agujero queda cerrado, pero la ruta no es utilizable. El `.env.production` ya tiene el valor; el despliegue tiene que llevar ese fichero (Ansistrano lo copia a `shared/`). CA-8 exige las dos cosas.
- **No hay invocador y no se construye uno.** No existe cron en `ansible/`, ni workflow, ni script que llame a `/api/telegram/patrol`. No es un Cron de Vercel: el despliegue es Docker + Ansistrano en el Nodo 11.
- **CA-10 no mezcla la patrulla con el webhook.** La ruta `/api/telegram/webhook` existe. El 404 de entrega de Telegram es PBI-STEEL-024.

---

## 4. Evidencia de Certificación

Ejecutado en `src/` el 2026-09-28:

| Oráculo | Resultado |
|---|---|
| `npx tsc --noEmit` | OK |
| `npm run lint` (eslint) | OK |
| `vitest run` | 88 ficheros, 474 tests OK |

**Commit de cierre:** forja STEEL-001 (patrulla Fail-Closed, puerto `findRecentActive`, aduana `deploy.sh`).
