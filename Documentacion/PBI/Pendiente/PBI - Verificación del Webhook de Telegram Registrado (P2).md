# [OPERATIVO] Documento Destilado: PBI - Verificación del Webhook de Telegram Registrado

**Identificador:** PBI-STEEL-024
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · sección 7, no es un hallazgo F-
**Módulo:** Telegram — webhook
**Entorno:** `src/app/api/telegram/webhook/route.ts`, `src/features/telegram/audit-telegram-bot-health.use-case.ts`
**Prioridad:** Media (P2 — 8 avisos, último el 2026-09-24, anterior al tag)
**Estimación Táctica:** 1 Story Point
**Depende de:** PBI-STEEL-001 en lo que toca a no imprimir secretos. El token del bot no se rota aquí.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Ocho eventos `WARN` con el texto `Wrong response from the webhook: 404 Not Found`. Ese texto es `last_error_message` de `getWebhookInfo`: Telegram intentó entregar un update y recibió un 404. El último es del 2026-09-24, antes del tag.
- **Entorno:** Ruta que ya existe y sonda de salud que ya compara la URL.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Primero se lee la URL que Telegram tiene registrada ahora.
  - *Filtro B:* Solo se llama a `setWebhook` si esa URL no es la esperada.
  - *Filtro C:* Un 404 viejo, ya clasificado por la propia sonda como residual, no se "arregla" re-registrando.

---

## 1. Declaración de Intención (INVEST)

**Como** operador del bot,
**Quiero** saber si Telegram sigue apuntando a una URL que responde 404,
**Para** no volver a registrar un webhook que el repositorio ya expone.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (La ruta existe):** `src/app/api/telegram/webhook/route.ts` responde a `POST`. La URL que la sonda espera por defecto es `https://barcelonaxplorer.com/api/telegram/webhook` (`TELEGRAM_WEBHOOK_URL` o ese literal). No se crea otra ruta.
- [ ] **CA-2 (Lectura, no escritura):** con `TELEGRAM_BOT_TOKEN` presente, `getWebhookInfo` se consulta en el Nodo 11 o contra la API, y se anota si `url` coincide y si `last_error_message` sigue siendo un 404. No se imprime el token.
- [ ] **CA-3 (Registro solo si difiere):** si la URL registrada es otra, se actualiza a la esperada y se vuelve a leer. Si coincide y el 404 tiene más de 15 minutos, el PBI se cierra sin `setWebhook`: la propia sonda ya trata ese error como residual y no degrada el semáforo (`audit-telegram-bot-health.test.ts`, escenario 7).
- [ ] **CA-4 (Otras causas de 404):** si la URL coincide y el 404 es reciente, se anota la causa observada (despliegue caído, túnel, middleware). No se atribuye a BotFather sin esa lectura.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No es el token.** El mensaje de token inválido es `getMe` y lo mira PBI-STEEL-001, CA-10. Aquí el 404 es la entrega del update.
- **El test ya fija el texto.** El escenario 7 del caso de uso usa exactamente `Wrong response from the webhook: 404 Not Found` como error viejo que no debe abrir telemetría. Los ocho eventos del log pueden ser la ventana en que ese error aún era reciente.

---

## 4. Evidencia de Certificación

Pendiente de forja.
