# [ARQUITECTURA] PBI - Peso y DTO de triaje

**Identificador:** PBI-TMPL-003
**Estatus:** Pendiente
**Fecha de Creación:** 2026-10-14
**Historia de Usuario Relacionada:** [Motor Híbrido de Rutas Predefinidas](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Motor%20H%C3%ADbrido%20de%20Rutas%20Predefinidas%20%28%22Barcelona%20de%20libro%22%29%20e%20Inyecci%C3%B3n%20Contextual%20en%20Orquestador.md) (§4)
**Módulo:** `src/features/planner/matrix.ts` · `src/features/triage/triage.schema.ts`
**Prioridad:** Alta (P1)
**Estimación Táctica:** 2 Story Points
**Depende de:** La matriz `default` vigente (umbral 60, `time_window` 60, `group_size` 15)
**Bloquea:** PBI-TMPL-004 y PBI-TMPL-007

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** La clave `anchored_template` pesa 45 puntos en la matriz `default`. El cliente podrá nombrar la plantilla con dos slugs. El booleano que suma esos puntos lo escribe el servidor en el corte siguiente.
- **Entorno:** `calculateMatrixDensity` ya suma pesos, tope 100, y `mood` aporta 10 si llega y la matriz no lo tiene en `weights`. `ThermalMeter` pinta el score con sufijo `%`. 45 puntos se leen `45%`.
- **Entropía Asimilada:**
  - *Filtro A (Soberanía):* Este corte no resuelve plantillas ni llama a `GetPublishedTemplateBySlugUseCase`.
  - *Filtro B (Grano):* La matriz `gastronomy` no gana esta clave. Mencionar una cena no cambia de matriz.
  - *Filtro C (Señal):* Un booleano presente en el body HTTP no suma 45. `TriageInputSchema` no lo declara, y el objeto Zod lo descarta.

---

## 0. Hecho vigente

`DefaultDensityPayloadSchema` admite `time_window`, `group_size`, `vibe`, `mood`, `constraints`, `districts` y `language`. `TriageInputSchema` admite `sessionId`, `prompt`, `matrixId`, `userLocation`, `mood` y `clientLanguage`.

`time_window` sola ya cruza el umbral 60 de `default`. La matriz `gastronomy` tiene umbral 70 y solo entra si el cliente envía `matrixId: 'gastronomy'`.

`calculateMatrixDensity` trata como presente cualquier valor distinto de `undefined`, `null`, `''` o array vacío. Un booleano `true` cuenta. Por eso el booleano no puede viajar en el DTO de entrada.

---

## 1. Declaración de Intención (INVEST)

**Como** explorador que todavía no ha completado el resto del prompt,
**Quiero** que elegir una ruta publicada sume 45 puntos y deje el medidor por debajo de 60,
**Para** que la tarjeta no despache sola y el umbral siga pidiendo hora, compañía o el resto del contexto.

---

## 2. Archivos

1. `src/features/planner/matrix.ts` (`anchored_template: 45` en `default.rules.weights` y el campo en `DefaultDensityPayloadSchema`)
2. `src/features/triage/triage.schema.ts` (`selectedCategorySlug` y `selectedTemplateSlug`, opcionales)
3. `src/features/planner/matrix.test.ts`

`triage-input.use-case.ts` no se modifica. Sin el corte PBI-TMPL-004, ningún camino del servidor escribe `anchored_template: true`.

---

## 3. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Peso):** `DENSITY_MATRIX_REGISTRY.default.rules.weights.anchored_template` es 45. `gastronomy.rules.weights` no tiene esa clave. Umbral `default` sigue en 60. El resto de pesos no cambia.

- [ ] **CA-2 (Aritmética):** `calculateMatrixDensity('default', { anchored_template: true })` devuelve score 45, `isThresholdSatisfied: false`, umbral 60. Con `group_size` además, score 60 y umbral cumplido. Con `time_window` además, score 100. `anchored_template: false`, ausente o `null` no suma. En `gastronomy`, el mismo `true` no suma 45.

- [ ] **CA-3 (Entrada):** `TriageInputSchema` acepta `selectedCategorySlug` y `selectedTemplateSlug` como strings opcionales, juntos o por separado. El resto del DTO se mantiene. Un body que incluya `anchored_template: true` lo pierde en el parse: el resultado no contiene esa clave. Mandar un solo slug es entrada válida; la decisión de no anclar con uno solo es de PBI-TMPL-004.

- [ ] **CA-4 (Payload):** `DefaultDensityPayloadSchema` acepta `anchored_template` booleano opcional, porque es el payload que el servidor evaluará después de resolver la plantilla.

- [ ] **CA-5 (Oráculos):** `tsc --noEmit`, `eslint` y `vitest run` sobre `matrix.test.ts` y los tests de `TriageInputSchema` que ya viven en `src/features/triage/triage.test.ts` si el CA-3 se afirma ahí. Ese archivo de triaje solo gana aserciones de esquema; el caso de uso no se toca. Cero `any`.

---

## 4. Acción kaizen (no recaer)

La recaída es tratar 45 como un incremento relativo que deja la interacción al borde del despacho. 45 queda bajo 60. `time_window` sola sigue valiendo 60 y se topa en 100 al sumarse con el ancla.

La otra recaída es aceptar `anchored_template` en `TriageInputSchema` para que el cliente adelante el bono. El cliente nombra slugs. El booleano lo escribe PBI-TMPL-004 después de un `success` de la plantilla publicada.

---

## 5. Fuera de alcance

- Resolver la plantilla, consultar MySQL o ignorar `DRAFT`. Eso es PBI-TMPL-004.
- Mover el `ThermalMeter` al pulsar la tarjeta. El medidor sigue el `TriageOutcomeDto`. La previsualización del chip es PBI-TMPL-007 y usa esta misma función.
- Cambiar el umbral 60, los pesos distintos de `anchored_template`, o la matriz `gastronomy`.
