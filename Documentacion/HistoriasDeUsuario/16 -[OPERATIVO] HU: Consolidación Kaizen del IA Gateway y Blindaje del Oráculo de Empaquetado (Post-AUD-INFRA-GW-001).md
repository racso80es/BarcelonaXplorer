# [OPERATIVO] Historia de Usuario: Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado (Post-AUD-INFRA-GW-001)

**Identificador:** HU-KAIZEN-003
**Estatus:** En progreso (7/9 completados, 2/9 pendientes) — PBI-GW-010 a PBI-GW-016 completados; PBI-GW-017 y PBI-GW-018 pendientes
**Fecha de Creación:** 2026-09-29
**Última Actualización:** 2026-09-29 (PBI-GW-016 completado)
**Naturaleza:** Consolidación post‑migración, hardening de seguridad y configuración, ampliación del perímetro de oráculos y gobernanza documental
**Auditoría Base Vinculada:** [`AUD-INFRA-GW-001`](../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md)
**Historia Precedente:** [`HU-16 — Microservicio IA Gateway`](../HistoriasDeUsuario_Historico/Historia%20de%20Usuario%2016%3A%20Microservicio%20IA%20Gateway%20%28Aduana%20Universal%29%20y%20Enrutamiento%20Multi-Modal.md) (Completada)
**Marco Normativo:** Protocolo de Acero — Grado S+ · [`CONSTITUTION.md`](../../CONSTITUTION.md) · [Axiomas de Forja S+](../../.SddIA/library/norms/) · [Códice `tech-master-nextjs-prisma`](../../.SddIA/library/codexes/tech-master-nextjs-prisma.md)
**Módulos Afectados:** `ia-gateway/`, `src/docker-compose.yml`, `ansible/hooks/after_symlink.yml`, `scripts/`, `src/features/ai-engine/ia-gateway/`, `src/next.config.ts`, `.SddIA/library/codexes/`
**Prioridad:** Alta (P1) por la regresión F-08 y el punto ciego de oráculos F-13
**Estimación Global:** 15 Story Points (orientativa; 3+2+2+2+2+1+1+1+1)

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Cierre de la deuda abierta por la auditoría de aplicación de la HU-16 y conversión de sus lecciones en mecanismos permanentes (oráculos, normas del Códice, scripts versionados).
- **Entorno:** Repositorio (monolito `src/` y microservicio `ia-gateway/`), pipeline `scripts/audit-anchor.sh` y `.github/workflows/ci.yml`, Nodo de Producción 11 (Ansistrano + Docker Compose).
- **Entropía Asimilada:** La HU-16 se cerró con los tres oráculos estáticos en verde y la aplicación sin arrancar. La corrección inmediata ya está aplicada (AUD-INFRA-GW-001 §5); esta historia elimina las causas estructurales: un empaquetador sin oráculo propio, un microservicio fuera del perímetro de CI, una migración que perdió la degradación multi‑modelo y secretos con valores por defecto.

---

## 1. Descripción General (INVEST)

**Como** Operador Técnico y Arquitecto de BarcelonaXplorer,
**Quiero** consolidar el IA Gateway resolviendo la regresión de fallback multi‑modelo, endureciendo su configuración (secreto obligatorio, restricción de anclaje verificada, custodia de claves por servicio), incorporándolo al Oráculo de Salud post‑despliegue y al pipeline de oráculos, y elevando el empaquetado (`next build`) a oráculo de primer orden,
**Para** que ninguna futura modificación de IaaC o de configuración pueda volver a llegar a `main` con la aplicación inarrancable, y para que el gateway ofrezca al menos la resiliencia que tenían los adaptadores directos que sustituyó.

---

## 2. Justificación Arquitectónica (Los Cinco Axiomas S+ Grade)

1. **Axioma I — Localidad de Comportamiento:** el lanzador local se versiona en `scripts/` (hoy vive en `~/Aplicaciones`, F-17). Toda exclusión de IaaC bajo `src/` debe declarar a todos sus lectores (tsc, Vitest, Tailwind, contexto Docker).
2. **Axioma II — Tolerancia Cero a la Inferencia:** el gateway rechaza arrancar sin `IA_GATEWAY_SECRET` válido (F-10); la restricción de anclaje se verifica, no se avisa (F-09); `evaluateChoice` valida en runtime que la elección pertenece al conjunto ofrecido en lugar de castear (F-18).
3. **Axioma III — Diseño Declarativo:** las cadenas de degradación por proveedor se modelan como matrices declarativas (`GEMINI_MODELS`, `GROQ_MODELS`) en lugar de un modelo único por adaptador (F-08). Los ficheros de entorno se segregan por servicio (F-11).
4. **Axioma IV — El Peaje del Oráculo:** `npx next build` y los oráculos del gateway entran en `audit-anchor.sh` y en CI (F-13). El Oráculo de Salud de Ansible sondea el gateway antes de sellar la release (F-12).
5. **Axioma V — Ejecución Encapsulada:** la imagen del gateway solo contiene código de producción (F-14); `web` solo recibe las variables que consume (F-11).

---

## 3. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Degradación multi‑modelo dentro del mismo proveedor (F-08)
- **Dado** `GEMINI_MODELS="gemini-3.5-flash,gemini-3-flash-preview"` y una petición `REASONING_LLM`.
- **Cuando** `gemini-3.5-flash` responde `404`/`503`.
- **Entonces** el gateway reintenta con `gemini-3-flash-preview` **antes** de conmutar a Groq, y la telemetría registra `modelId` efectivo y `attemptedProviders` sin duplicar el proveedor.
- **Y** si toda la lista de un proveedor falla, la conmutación a la matriz de proveedores y al anclaje base sigue el comportamiento vigente de la HU-16 §2.4.

### Escenario 2: Arranque Fail‑Closed del gateway (F-10, F-09)
- **Dado** un arranque de `ia-gateway` sin `IA_GATEWAY_SECRET` o con menos de 32 caracteres.
- **Entonces** el proceso termina con código distinto de cero y un mensaje determinista; no existe ningún literal de secreto en el código.
- **Y dado** `DEFAULT_FAST_LLM` con el mismo proveedor que el principal de su matriz, el arranque falla del mismo modo (o `/healthz` expone `configStatus: 'DEGRADED'` si el Vértice opta por la variante no bloqueante).
- **Y** existe un test que cubre ambos casos.

### Escenario 3: Custodia de secretos por servicio (F-11)
- **Cuando** se ejecuta `docker compose --env-file .env.production config`.
- **Entonces** el servicio `web` no recibe `GROQ_API_KEY` ni `JEV_API_KEY`; recibe `GEMINI_API_KEY` únicamente mientras los embeddings permanezcan en el monolito (HU-16 §2.5), y así consta en la HU-16 §2.1 actualizada.

### Escenario 4: Oráculo de Salud post‑despliegue con gateway (F-12)
- **Dado** un despliegue Ansistrano en el Nodo 11.
- **Cuando** el contenedor `barcelonaxplorer_ia_gateway` no alcanza `healthy` o la sonda del monolito hacia el gateway falla.
- **Entonces** el bloque `rescue` revierte la release igual que hoy ante un fallo de `/api/telemetry/log`.

### Escenario 5: Empaquetado como oráculo de primer orden (F-13)
- **Dado** el symlink `src/ia-gateway` y una `globals.css` sin las exclusiones de AUD-INFRA-GW-001 (reproducción del incidente).
- **Cuando** se ejecuta `scripts/audit-anchor.sh`.
- **Entonces** el script falla en un paso explícito de empaquetado (`npx next build`) antes de llegar al E2E, y CI ejecuta además `tsc --noEmit` y `vitest run` de `ia-gateway/`.
- **Y** el `webServer` de Playwright no reutiliza servidores previos cuando se invoca desde el script de auditoría.

### Escenario 6: Lanzador local versionado (F-17)
- **Cuando** un desarrollador ejecuta `scripts/dev-up.sh` en un clon limpio con `.env.local` válido.
- **Entonces** arranca MySQL de desarrollo, compila y levanta el gateway, espera `/healthz`, y arranca `next dev`; el fichero de `~/Aplicaciones` es un envoltorio de una línea.

### Escenario 7: Gobernanza del Códice (F-20)
- **Cuando** se lee `tech-master-nextjs-prisma.md`.
- **Entonces** existe un fundamento que fija las fuentes de Tailwind como declaración explícita (`source(none)` + `@source`) y prohíbe enlaces simbólicos bajo `src/` salvo exclusión declarada en todos sus lectores, con referencia a AUD-INFRA-GW-001.

---

## 4. Desglose Operativo en Ítems del Backlog (PBIs Propuestos)

| Prioridad | Identificador | Título del PBI | Hallazgos | SP |
| :---: | :--- | :--- | :--- | :---: |
| **P1** | `PBI-GW-010` | [Matriz declarativa de modelos por proveedor y degradación intra‑proveedor](../PBI/Realizado/PBI%20-%20Matriz%20Declarativa%20de%20Modelos%20por%20Proveedor%20y%20Degradacion%20Intra-Proveedor%20en%20IA%20Gateway%20%28P1%29.md) | F-08 | 3 |
| **P1** | `PBI-GW-011` | [Oráculo de empaquetado y del gateway en `audit-anchor.sh` y CI](../PBI/Realizado/PBI%20-%20Oraculo%20de%20Empaquetado%20y%20del%20IA%20Gateway%20en%20audit-anchor%20y%20CI%20%28P1%29.md) | F-13 | 2 |
| **P1** | `PBI-GW-012` | [Arranque Fail‑Closed: secreto obligatorio y anclaje verificado](../PBI/Realizado/PBI%20-%20Arranque%20Fail-Closed%20del%20IA%20Gateway%20Secreto%20Obligatorio%20y%20Anclaje%20Verificado%20%28P1%29.md) | F-10, F-09 | 2 |
| **P2** | `PBI-GW-013` | [Sonda del IA Gateway en el Oráculo de Salud post‑despliegue](../PBI/Realizado/PBI%20-%20Sonda%20del%20IA%20Gateway%20en%20el%20Oraculo%20de%20Salud%20Post-Despliegue%20%28P2%29.md) | F-12 | 2 |
| **P2** | `PBI-GW-014` | [Segregación de ficheros de entorno por servicio en Compose](../PBI/Realizado/PBI%20-%20Segregacion%20de%20Ficheros%20de%20Entorno%20por%20Servicio%20en%20Docker%20Compose%20%28P2%29.md) | F-11 | 2 |
| **P2** | `PBI-GW-015` | [Lanzador local versionado `scripts/dev-up.sh`](../PBI/Realizado/PBI%20-%20Lanzador%20Local%20Versionado%20scripts%20dev-up%20%28P2%29.md) | F-17 | 1 |
| **P3** | `PBI-GW-016` | [Imagen del gateway sin tests y `dev` con recarga real](../PBI/Realizado/PBI%20-%20Imagen%20del%20IA%20Gateway%20sin%20Tests%20y%20Recarga%20Real%20en%20Desarrollo%20%28P3%29.md) | F-14, F-04 | 1 |
| **P3** | `PBI-GW-017` | [Validación runtime de `evaluateChoice` y limpieza de avisos de tooling](../PBI/Pendiente/PBI%20-%20Validacion%20Runtime%20de%20evaluateChoice%20y%20Limpieza%20de%20Avisos%20de%20Tooling%20%28P3%29.md) | F-18, F-15, F-19 | 1 |
| **P3** | `PBI-GW-018` | [Enmienda del Códice y anotación de AUD-INFRA-GW-001](../PBI/Pendiente/PBI%20-%20Enmienda%20del%20Codice%20sobre%20Fuentes%20Tailwind%20y%20Symlinks%20y%20Anotacion%20de%20AUD-INFRA-GW-001%20%28P3%29.md) | F-20, F-16 | 1 |

F-16 (convención `middleware` → `proxy`) se registra en PBI-GW-018 solo como nota: TC-NEXT-004 la declara historia futura y no se aborda aquí.

---

## 5. Mejoras Kaizen Derivadas de la Auditoría

Directivas de mantenimiento continuo que exceden un PBI concreto y que esta historia formaliza:

1. **Cuarto oráculo permanente: el empaquetador.** Por segunda vez (AUD-ARCH-BARREL-001 y AUD-INFRA-GW-001) la Santa Trinidad estuvo en verde con la aplicación inarrancable. `npx next build` pasa a ser paso obligatorio de `audit-anchor.sh` y del cierre de todo PBI que toque `src/app/globals.css`, `next.config.ts`, `postcss.config.mjs`, `Dockerfile`, `.dockerignore` o cualquier entrada de `src/` de tipo symlink.
2. **Checklist de lectores para exclusiones de IaaC.** Toda ruta añadida bajo `src/` que no sea código del monolito debe declararse (o excluirse) en los cuatro lectores: `tsconfig.json`, `vitest.config.ts`, fuentes Tailwind en `globals.css` y `.dockerignore`. El checklist se incorpora a la plantilla de PBI de infraestructura.
3. **Verificación del entorno real en migraciones Big‑Bang.** La DoD de cualquier migración que introduzca variables nuevas exige comprobar su presencia en `.env.local` y `.env.production` (no solo en `.env.example`), mediante la aduana de `deploy.sh` y una aduana equivalente en `scripts/dev-up.sh`.
4. **Prohibición de literales por defecto en secretos.** Regla ESLint (`no-restricted-syntax`) o test de contrato que rechace `process.env.X_SECRET ?? '<literal>'` en `src/` e `ia-gateway/`. Cierra el patrón repetido en AUD-OPS-STEEL-001 F-01 y AUD-INFRA-GW-001 F-10.
5. **Paridad de resiliencia en sustituciones de adaptador.** Antes de retirar un adaptador directo, inventariar sus mecanismos de degradación (listas de modelos, timeouts, mensajes Fail‑Soft) y exigir su equivalente en el sustituto. F-08 es la consecuencia de no haberlo hecho.
6. **Auditoría cruzada de familia de modelo.** Esta auditoría la ejecutó una familia distinta a la forjadora de PBI-GW-008; el mecanismo `Forged-by` de PBI-STEEL-020 funcionó y debe mantenerse como requisito de toda auditoría de cierre de HU.

---

## 6. Definición de Hecho (DoD)

- [x] PBI-GW-010 a PBI-GW-018 materializados en `Documentacion/PBI/Pendiente/` (2026-09-29).
- [x] Decisiones D-1 a D-3 confirmadas por el Vértice Biológico (2026-09-29).
- [ ] PBIs priorizados para ejecución por el Vértice Biológico.
- [ ] Escenarios 1 a 7 verificados empíricamente y documentados en cada PBI.
- [ ] `scripts/audit-anchor.sh` incluye empaquetado y oráculos del gateway; CI en verde con el nuevo perímetro.
- [ ] Oráculo de Salud post‑despliegue con sonda del gateway probado en el Nodo 11 (incluido un rescate provocado en ventana controlada).
- [ ] Códice enmendado y HU-16 / PBI-GW-008 anotados con referencia a AUD-INFRA-GW-001.
- [ ] Commits con trailer `Forged-by` y auditoría de cierre por una familia de modelo distinta.

---

## 7. Decisiones Resueltas (Vértice Biológico)

Confirmadas el **2026-09-29** según las recomendaciones documentadas en esta historia. Los PBIs `PBI-GW-010`, `PBI-GW-012` y `PBI-GW-014` se forjan conforme a estas resoluciones; no requieren reescritura previa.

- **D-1 — F-09 (restricción de anclaje):** [RESUELTO] **Fail‑fast en el arranque.** Si `DEFAULT_FAST_LLM` o `DEFAULT_REASONING_LLM` comparten proveedor con el principal de su matriz, el proceso del gateway termina con código distinto de cero y un mensaje determinista. No se adopta la variante `DEGRADED` en `/healthz` (Axioma II; coherente con la aduana de `deploy.sh` antes del nodo).
- **D-2 — F-11 (custodia de secretos por servicio):** [RESUELTO] **Ficheros de entorno separados por servicio**, copiados por Ansible a `shared/` y enlazados por Ansistrano: `src/.env.web` (monolito) y `src/.env.ia-gateway` (microservicio). No se mantiene un único `.env.production` con listas `environment` explícitas en Compose como mecanismo principal.
- **D-3 — F-08 (matriz de modelos):** [RESUELTO] **Variables de entorno** `GEMINI_MODELS` y `GROQ_MODELS` (listas separadas por comas, validadas al arranque). No se introduce YAML canónico en `ia-gateway/config/` en el ámbito de esta historia.
