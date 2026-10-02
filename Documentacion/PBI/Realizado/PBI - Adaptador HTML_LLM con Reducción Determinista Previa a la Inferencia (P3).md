# [ARQUITECTURA] Documento Destilado: PBI - Adaptador HTML_LLM con Reducción Determinista Previa a la Inferencia

**Identificador:** PBI-CTX-008
**Estatus:** Cancelado (Axioma I - Cero código innecesario / Veredicto Empírico PBI-CTX-001 CA-8 y HU 18 §5.1)
**Fecha de Creación:** 2026-09-30
**Fecha de Cancelación Formal:** 2026-10-02
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §4.3 · Escenario 10, §5.1
**Módulo:** `src/features/context-sources/adapters/html-llm.adapter.ts` (No requerido)
**Prioridad:** Baja (P3)
**Estimación Táctica:** 3 Story Points (Ahorrados)
**Depende de:** PBI-CTX-001 (CA-7, CA-8), PBI-CTX-005, PBI-CTX-007

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Cancelación justificada de complejidad accidental (Axioma I). El 100% del ecosistema de eventos y contexto hiperlocal de Barcelona dispone de feeds estructurados oficiales (Socrata Open Data BCN, SPARQL Wikidata, RSS Betevé, iCal, API REST TMB) o datos semánticos JSON-LD Schema.org embebidos en el DOM.
- **Entorno:** Se evita la degradación por consumo innecesario de tokens y fragilidad no determinista de scraping LLM en runtime.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Seguridad jurídica):* El scraping visual vía LLM presenta mayor riesgo de fricción con términos de servicio que las APIs abiertas y JSON-LD.
  - *Filtro B (Localidad):* Se preserva el footprint mínimo de código del módulo `context-sources`.
  - *Filtro C (Eficiencia de tokens):* Cero gasto recurrente de tokens en ingesta de fondo.

---

## 1. Declaración de Veredicto de Cancelación (HU 18 §5.1)

En cumplimiento de la cláusula condicional de creación de este PBI:
> *"condicional: se cancela si PBI-CTX-001 CA-8 concluye que ninguna fuente viable requiere `HTML_LLM`"*

Y tras el estudio empírico ejecutado en **PBI-CTX-001**:
1. Las fuentes prioritarias de la ciudad (Ayuntamiento de Barcelona Socrata, Wikidata SPARQL, Betevé RSS, TMB iCal/REST, Time Out JSON-LD) cubren el 100% de los casos de uso definidos en la HU 18 sin recurrir a inferencia LLM en la fase de extracción.
2. La arquitectura implementada en **PBI-CTX-006** y **PBI-CTX-007** satisface plenamente la ingesta multimodal de alta fidelidad con 0 tokens consumidos en el pipeline de recolección.
3. Se cancela formalmente la implementación de `src/features/context-sources/adapters/html-llm.adapter.ts` y del esquema auxiliar en `ia-gateway`, cerrando el PBI como **Cancelado** y moviéndolo al registro histórico de realizados/resueltos.

---

## 2. Trazabilidad de Criterios

- [-] **CA-1 (Atajo JSON-LD):** Resuelto nativamente por `JsonLdContextAdapter` (PBI-CTX-007).
- [-] **CA-2 (Purga):** No requerido al no existir scraping ciego.
- [-] **CA-3 (Tope):** No requerido.
- [-] **CA-4 (Esquema en el gateway):** No requerido (la extracción es 100% determinista sin LLM).
- [-] **CA-5 (Frontera):** Implementado en `ContextEntrySchema` a nivel de todos los adaptadores estructurados.
- [-] **CA-6 (Telemetría):** Implementado en `IngestContextUseCase` (PBI-CTX-005).
- [x] **CA-7 (Oráculos):** El sistema mantiene la Santa Trinidad de Oráculos en verde al 100%.
