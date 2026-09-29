# [OPERATIVO] Documento Destilado: PBI - Enmienda del Códice sobre Fuentes Tailwind y Symlinks, y Anotación de AUD-INFRA-GW-001

**Identificador:** PBI-GW-018
**Estatus:** Pendiente
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) · Escenario 7
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-20, F-16
**Módulo:** `.SddIA/library/codexes/tech-master-nextjs-prisma.md`, `Documentacion/`
**Entorno:** Gobernanza documental
**Prioridad:** Baja (P3)
**Estimación Táctica:** 1 Story Point (solo documentación; no hay código de producción)
**Depende de:** Ninguno
**Bloqueo:** Ninguno

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Convertir las dos lecciones estructurales de la auditoría en norma permanente y dejar constancia del incidente en los documentos que certificaron el estado anterior.
- **Entorno:** el Códice `tech-master-nextjs-prisma` (TC-UI-001 fija el uso de Tailwind 4 y prohíbe `tailwind.config.*`, pero no dice nada de cómo se declaran las fuentes ni de enlaces simbólicos), la HU-16 y el PBI-GW-008.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (El oráculo no lo ve):* F-01 pasó `tsc`, `eslint` y `vitest` porque ninguno ejecuta el pipeline CSS. La norma nueva debe nombrar el oráculo que sí lo detecta (`next build`), que PBI-GW-011 incorpora al pipeline.
  - *Filtro B (Cuatro lectores):* el autor de PBI-GW-008 excluyó el symlink de `tsconfig.json` y de `vitest.config.ts`, y olvidó el escáner de Tailwind y el contexto de `docker build`. La norma enumera los cuatro.
  - *Filtro C (F-16 no es trabajo de este PBI):* el aviso `middleware` → `proxy` de Next 16 queda registrado y diferido, porque TC-NEXT-004 fija `src/middleware.ts` como perímetro canónico y declara esa migración como otra historia.

---

## 1. Declaración de Intención (INVEST)

**Como** responsable de la gobernanza del repositorio,
**Quiero** que el Códice prohíba la combinación que rompió el arranque y que la HU-16 y el PBI-GW-008 apunten a la auditoría,
**Para** que el próximo agente que toque esa zona lea la restricción antes de repetir el fallo.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Fundamento nuevo):** el Códice incorpora un fundamento `TC-UI-002` inmediatamente después de `TC-UI-001`, con esta sentencia: las fuentes de Tailwind se declaran de forma explícita (`@import "tailwindcss" source(none)` más directivas `@source` relativas a la hoja de estilos); se prohíbe la autodetección de fuentes mientras exista bajo `src/` cualquier ruta que salga del proyecto. Y un fundamento `TC-INFRA-001`: un enlace simbólico bajo `src/` solo se admite si declara su exclusión en los cuatro lectores — `tsconfig.json` (`exclude`), `vitest.config.ts` (`exclude`), las fuentes Tailwind (no aparece en ningún `@source`) y `src/.dockerignore` — y el PBI que lo introduce incluye la salida de `npx next build` entre sus evidencias.
- [ ] **CA-2 (Anclaje real):** ambos fundamentos citan como anclaje el estado vigente (`src/app/globals.css` con `source(none)`, `src/ia-gateway` como symlink, `src/.dockerignore`) y referencian AUD-INFRA-GW-001 como el incidente que los origina.
- [ ] **CA-3 (Anotación de la HU-16):** la sección de Definición de Hecho de la HU-16 gana una nota fechada que remite a AUD-INFRA-GW-001, aclara que los tres oráculos en verde no cubrían el empaquetado y apunta a HU-KAIZEN-003 como continuación. No se reescribe el cuerpo histórico de la HU.
- [ ] **CA-4 (Anotación del PBI-GW-008):** su sección de evidencia de oráculos incorpora una nota que indica que `docker compose config` y `tsc` no detectan el fallo del symlink, con enlace a la auditoría. El estatus del PBI sigue siendo Completado: la nota registra el límite de su verificación, no reabre el trabajo.
- [ ] **CA-5 (F-16 registrado y diferido):** este PBI menciona en sus notas que la migración de `middleware` a `proxy` queda fuera por TC-NEXT-004, de modo que la decisión quede escrita y no se reabra en cada sesión.
- [ ] **CA-6 (Contrato del Códice):** si existe un test de contrato que enumera los fundamentos `TC-*` (la auditoría AUD-OPS-STEEL-001 menciona `library-codex.contract.test.ts`), se actualiza para incluir `TC-UI-002` y `TC-INFRA-001` y queda en verde.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El Códice prevalece sobre el conocimiento del modelo**, según la propia norma de inyección. Este PBI lo modifica, así que el cambio es exactamente el texto de CA-1 y nada más: no se reordenan fundamentos ni se reformulan los existentes.
- **No se mueve el symlink.** `src/ia-gateway -> ../ia-gateway` sigue siendo la solución vigente (F-01 se resolvió por la vía de las fuentes explícitas). La norma regula las condiciones para mantenerlo, no obliga a retirarlo.
- **La migración a `proxy` no se inicia aquí.** TC-NEXT-004 dice textualmente que `src/middleware.ts` es el perímetro y que la migración a la convención `proxy` de Next 16 es otra historia. Abrirla dentro de este PBI contradiría el Códice que se está enmendando.
