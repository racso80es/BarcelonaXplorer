# [ARQUITECTURA] PBI - Catálogo y entorno de afiliados

**Identificador:** PBI-AFF-001
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Ecosistema de Afiliación Asimétrica](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Ecosistema%20de%20Afiliaci%C3%B3n%20Asim%C3%A9trica.md) (HU-20, §4.1 y §8.1)
**Módulo:** `src/features/planner/affiliate/`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** HU-20. Las tareas VB-02 y VB-03 siguen siendo del operador: este corte deja las variables vacías.
**Bloquea:** PBI-AFF-002

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Una matriz declara cada proveedor, el nombre de su variable y el mapa `THE_FORK` → `THEFORK`. Sin valor en el entorno, el proveedor queda inactivo.
- **Entorno:** El enriquecedor vive en `src/features/planner/affiliate/`. Ansible ya copia `src/.env.web` a `shared/.env.web`. `.env.web` está en `.gitignore`.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* El código no inventa `tag`, `aid`, `marker` ni `cread.php`. La plantilla es el texto que el operador pegue desde el panel.
  - *Filtro B (Grano):* Pintar botones y sustituir `bcn_xplorer` en el enriquecedor es PBI-AFF-002. La ruta de clic es PBI-AFF-003.
  - *Filtro C (Señal):* Variable ausente, vacía o sin el hueco `{query}` significa proveedor inactivo. La generación de rutas no se aborta.

---

## 0. Hecho vigente

`AffiliateProviderSchema` del itinerario admite `THEFORK`, `CIVITATIS` y `NONE`. `AffiliateProviderEnum` de la plantilla admite `THE_FORK`, `CIVITATIS`, `TIQETS`, `CABIFY` y `FREE_NOW`. Nada traduce `THE_FORK` a `THEFORK`.

`src/.env.example` no declara ninguna variable `AFFILIATE_*`. `cityId=415144`, `tag=bcn_xplorer` y `aid=bcn_xplorer` están escritos en `affiliate-enricher.service.ts`. Este corte no los toca.

`GetYourGuide` no está en ninguno de los dos enums. `CABIFY` y `FREE_NOW` siguen solo en el enum de plantilla.

---

## 1. Declaración de Intención (INVEST)

**Como** operador que todavía no ha pegado la URL de ejemplo,
**Quiero** un catálogo que lea la plantilla del entorno y traduzca la clave de la ficha a la clave del itinerario,
**Para** que el resolutor siguiente pueda activar un proveedor solo cuando la credencial exista.

---

## 2. Archivos

1. `src/features/planner/affiliate/affiliate-provider-catalog.ts`
2. `src/features/planner/affiliate/affiliate-provider-catalog.test.ts`
3. `src/.env.example`

`src/.env.web` no se edita en el repositorio: lo rellena el operador en VB-04. `affiliate-enricher.service.ts` queda fuera. Si `tsc` falla por ese archivo, el corte se detiene y se reporta el hop.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Matriz):** El módulo exporta una matriz con tres filas: `THEFORK` (categoría `GASTRONOMY`, variable `AFFILIATE_THEFORK_SEARCH_TEMPLATE`), `CIVITATIS` (categoría `CULTURE`, variable `AFFILIATE_CIVITATIS_SEARCH_TEMPLATE`) y `TIQETS` (categoría `CULTURE`, variable `AFFILIATE_TIQETS_SEARCH_TEMPLATE`). `CABIFY`, `FREE_NOW` y `GetYourGuide` no tienen fila.

- [ ] **CA-2 (Entorno vacío):** `src/.env.example` declara esas tres variables con valor vacío y un comentario que dice que se rellenan con la URL de ejemplo del operador, sustituyendo el texto de búsqueda de muestra por el hueco `{query}`. No aparece `bcn_xplorer` ni un id de relleno.

- [ ] **CA-3 (Activo):** La lectura recibe el entorno por argumento (`Record<string, string | undefined>`), sin leer `process.env` por dentro. Una variable con una URL `https` que contiene exactamente un `{query}` deja el proveedor activo. Ausente, vacía, solo espacios, sin `{query}`, con más de un `{query}`, o que no sea `https`, lo deja inactivo.

- [ ] **CA-4 (Hueco):** Con la plantilla activa, rellenar el hueco con el título de la parada produce una URL donde `{query}` ya no está y el título va codificado con `encodeURIComponent`. El resto de la plantilla se conserva tal cual. El módulo no concatena otro parámetro.

- [ ] **CA-5 (Frontera de nombres):** `THE_FORK` se resuelve a `THEFORK`. `CIVITATIS` y `TIQETS` se resuelven a sí mismas. `CABIFY` y `FREE_NOW` no producen clave de itinerario. El JSON ya guardado de plantillas no se reescribe.

- [ ] **CA-6 (Enum del itinerario):** `AffiliateProviderSchema` (`THEFORK`, `CIVITATIS`, `NONE`) no gana valores en este corte. Tiqets puede estar activo en el catálogo y seguir fuera de ese enum hasta que el resolutor lo emita.

- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` sobre `affiliate-provider-catalog.test.ts`. Cero `any`.

---

## 4. Acción kaizen (no recaer)

La recaída es construir `https://www.thefork.es/search?...&tag=` o `aid=` dentro del módulo, o crear `AFFILIATE_THEFORK_ID` antes de que el ejemplo de Awin sea un único token. Si el seguimiento es una URL envuelta, la variable guarda esa plantilla.

La otra recaída es tratar la variable vacía como error de arranque. La ruta se genera igual.

---

## 5. Fuera de alcance

- Sustituir las plantillas de `affiliate-enricher.service.ts` y retirar `bcn_xplorer` del catálogo estático: PBI-AFF-002.
- Añadir `TIQETS` a `EnrichedRoute` y pintar el botón.
- Alta de cuentas (VB-01 a VB-04) y escribir secretos en `src/.env.web`.
- `GetYourGuide`, Cabify, Free Now y el CTA por lluvia.
