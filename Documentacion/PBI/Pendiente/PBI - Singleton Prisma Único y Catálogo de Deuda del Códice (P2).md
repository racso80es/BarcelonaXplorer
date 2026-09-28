# [OPERATIVO] Documento Destilado: PBI - Singleton Prisma Único y Catálogo de Deuda del Códice

**Identificador:** PBI-STEEL-010
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-08 (parte heredada)
**Módulo:** Persistencia — Prisma
**Entorno:** `src/features/planner/prisma-itinerary.repository.ts`, `src/features/auth/prisma-user-anchor.repository.ts`, `src/features/auth/prisma-magic-link-nonce.repository.ts`, `src/features/telemetry/prisma-telemetry.repository.ts`, `.SddIA/library/codexes/tech-master-nextjs-prisma.md`
**Prioridad:** Media (P2 — pools de conexión de más; la ruta de patrulla ya la cubre PBI-STEEL-001)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-STEEL-001 (retira el `PrismaClient` de la patrulla). Cada repositorio se migra en un cambio propio para no romper el Axioma I.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Cuatro repositorios anteriores al delta instancian `PrismaClient` aparte del singleton de `src/shared/persistence/prisma.ts`. El Códice prohíbe esa excepción y su tabla de deuda no los lista.
- **Entorno:** Repositorios Prisma de planner, auth y telemetría, y la tabla de deuda del Códice.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Un solo cliente Prisma por proceso.
  - *Filtro B:* La deuda que quede viva está escrita en el Códice; lo que se migra sale de esa tabla.
  - *Filtro C:* La ruta de patrulla no se toca aquí.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio del Códice,
**Quiero** que todos los repositorios usen el singleton de Prisma y que la tabla de deuda diga la verdad,
**Para** no abrir un pool de MySQL por módulo y no guiar a la siguiente forja con un inventario falso.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Itinerarios):** `prisma-itinerary.repository.ts` deja de ejecutar `new PrismaClient()`. Recibe el singleton por constructor, con el mismo valor por defecto que hoy usa el resto del proceso (`src/shared/persistence/prisma.ts`).
- [ ] **CA-2 (Anclajes):** igual para `prisma-user-anchor.repository.ts`.
- [ ] **CA-3 (Nonces):** igual para `prisma-magic-link-nonce.repository.ts`.
- [ ] **CA-4 (Telemetría):** igual para `prisma-telemetry.repository.ts`.
- [ ] **CA-5 (Inventario):** una búsqueda de `new PrismaClient(` en `src/` solo encuentra el singleton. Los `globalThis` propios de cada repositorio (`prismaItineraryClient`, `prismaUserAnchorClient`, `prismaNonceClient`, `prismaTelemetryClient`) desaparecen.
- [ ] **CA-6 (Códice):** la tabla de deuda heredada no gana estas cuatro filas, porque el código ya cumple TC-PRISMA-001. Si al forjar este PBI la patrulla todavía no ha pasado por PBI-STEEL-001, esa quinta fila se anota como temporal y se borra al cerrar el P0.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No es el P0.** `src/app/api/telegram/patrol/route.ts` tiene otro `PrismaClient` (`prismaPatrolClient`). Lo retira PBI-STEEL-001, junto con el acceso directo a `userAnchor` que se salta el puerto.
- **El Códice ya dice que no hay excepción.** Este PBI no añade una. Catalogar la deuda solo sería válido si un repositorio quedara sin migrar, y entonces la fila tiene que nombrar el fichero.
- **Más de tres ficheros en total, uno por cambio.** Cada CA-1 a CA-4 es una operación atómica. No se migran los cuatro en el mismo diff.

---

## 4. Evidencia de Certificación

Pendiente de forja.
