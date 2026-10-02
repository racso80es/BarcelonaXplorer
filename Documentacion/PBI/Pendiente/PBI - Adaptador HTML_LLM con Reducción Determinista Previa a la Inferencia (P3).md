# [ARQUITECTURA] Documento Destilado: PBI - Adaptador HTML_LLM con Reducción Determinista Previa a la Inferencia

**Identificador:** PBI-CTX-008
**Estatus:** Pendiente (condicional: se cancela si PBI-CTX-001 CA-8 concluye que ninguna fuente viable requiere `HTML_LLM`)
**Fecha de Creación:** 2026-09-30
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §4.3 · Escenario 10
**Módulo:** `src/features/context-sources/adapters/html-llm.adapter.ts` + test; `ia-gateway/src/endpoints/llm/schemas-registry.ts` (esquema `context-entries`)
**Entorno:** Parser HTML de PBI-CTX-007, IA Gateway `/llm` (System Two)
**Prioridad:** Baja (P3)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-CTX-001 (CA-7, CA-8), PBI-CTX-005, PBI-CTX-007
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Extracción asistida por LLM para páginas sin datos estructurados, precedida de una cascada determinista que reduce el HTML a texto semántico acotado.
- **Entorno:** `engineType: 'REASONING_LLM'`, `responseFormat: 'json'`, `schemaId: 'context-entries'`, `temperature: 0`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Respuesta del LLM validada con `ContextEntrySchema`; entradas inválidas descartadas una a una.
  - *Filtro B:* Cascada fija: atajo JSON-LD → purga → normalización y tope → inferencia.
  - *Filtro C:* Nunca se envía DOM crudo; tope inicial 12 000 caracteres configurable.

---

## 1. Declaración de Intención (INVEST)

**Como** pipeline de ingesta,
**Quiero** extraer eventos de páginas HTML sin datos estructurados enviando al LLM solo el texto útil,
**Para** cubrir fuentes valiosas sin disparar el coste de tokens.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Atajo JSON-LD):** Si el extractor de PBI-CTX-007 encuentra `Event`/`LocalBusiness`, se usan esas entradas y se hacen 0 llamadas a `/llm` (Escenario 10).
- [ ] **CA-2 (Purga):** Se eliminan `<script>`, `<style>`, `<noscript>`, `<svg>`, `<iframe>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, comentarios y atributos; raíz preferente `<main>`/`<article>`.
- [ ] **CA-3 (Tope):** Espacios colapsados, líneas deduplicadas, truncado al tope configurable; por encima, fragmentación por bloques con límite de lotes por fuente. Test: el texto enviado no contiene las etiquetas purgadas y no supera el tope (Escenario 10).
- [ ] **CA-4 (Esquema en el gateway):** `context-entries` registrado en `schemas-registry.ts` con test en `ia-gateway`.
- [ ] **CA-5 (Frontera):** Respuesta validada con `ContextEntrySchema`; descarte por entrada.
- [ ] **CA-6 (Telemetría):** `rawBytes`, `purgedChars`, `promptTokens`, `entriesValid`, `entriesRejected` por fuente.
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` en verde en `src/` e `ia-gateway/`.
