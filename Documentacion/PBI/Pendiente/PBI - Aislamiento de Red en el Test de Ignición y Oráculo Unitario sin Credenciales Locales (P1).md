# [OPERATIVO] Documento Destilado: PBI - Aislamiento de Red en el Test de Ignición y Oráculo Unitario sin Credenciales Locales

**Identificador:** PBI-STEEL-009
**Estatus:** Pendiente (Backlog Inmediato — Clúster de Nivel 1, orden 9)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · T-02
**Módulo:** QA — Determinismo del oráculo Vitest
**Entorno:** `src/app/api/triage/ignition/route.test.ts`, `src/vitest.config.ts`, `src/package.json` (scripts `test:live` y `test:integration`)
**Prioridad:** Alta (P1 — oráculo no determinista y divergente entre local y CI)
**Estimación Táctica:** 1 Story Point
**Depende de:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El test de la ruta de ignición no aísla `OpenMeteoWeatherAdapter` y hace una petición real a `api.open-meteo.com` con un timeout de 200 ms. Además, `vitest.config.ts` carga `.env.local`: en local los tests corren con claves reales y en CI sin ellas.
- **Entorno:** Test de route handler y configuración de Vitest.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Ningún test unitario sale a la red.
  - *Filtro B:* El oráculo unitario ve el mismo entorno en local y en CI.
  - *Filtro C:* Los tests en vivo conservan su propio comando y su propia carga de credenciales.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio del Peaje del Oráculo,
**Quiero** que `vitest run` sea determinista y no dependa de la red ni de las credenciales de mi máquina,
**Para** que un verde en local signifique lo mismo que un verde en CI.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Test de ignición aislado):** `route.test.ts` sustituye el adaptador meteorológico por un doble (inyección o `vi.mock`) y cubre dos casos: clima adverso (aparece la chispa meteorológica) y fallo del sensor (Fail-Soft sin chispa).
- [ ] **CA-2 (Red prohibida en el oráculo):** un `setupFiles` de Vitest sustituye `fetch` global por una función que lanza `Error('Red prohibida en tests unitarios')` salvo que el test lo sobrescriba. La suite completa sigue en verde.
- [ ] **CA-3 (Sin `.env.local` en el oráculo):** `vitest.config.ts` deja de cargar `.env.local` para `npm test`. Los scripts `test:live` y `test:integration` cargan las credenciales explícitamente (p. ej. `node --env-file=.env.local` o una config de Vitest propia).
- [ ] **CA-4 (Verificación cruzada):** `npm test` se ejecuta en local con `.env.local` presente y con él renombrado temporalmente; ambos resultados son idénticos (mismo número de ficheros y tests, todos en verde). Evidencia en la sección 4.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Evidencia:** `route.test.ts` mockea Groq, `@/features/cognitive-memory` y `@/features/telemetry`, pero no `@/features/triage`. `OpenMeteoWeatherAdapter` usa `fetch` global por defecto (`open-meteo-weather.adapter.ts:47`) y la ruta lo instancia con `timeoutMs: 200`. El test pasa haya o no red porque el adaptador es Fail-Soft: no prueba ninguno de los dos caminos de forma determinista.
- **CA-2 puede destapar más casos:** si otros tests dependían de red real sin saberlo, fallarán al activar el bloqueo. Se corrigen dentro de este PBI; si son muchos, se listan y se abre un PBI P2 aparte.
- **Relación con T-08:** los tests de `tests/e2e/` y `tests/integration/` siguen fuera del oráculo por diseño; su colocalización y ejecución periódica son un PBI P2 aparte.

---

## 4. Evidencia de Certificación

Pendiente de forja.
