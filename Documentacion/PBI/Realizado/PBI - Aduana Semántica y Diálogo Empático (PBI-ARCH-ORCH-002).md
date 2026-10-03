# [OPERATIVO] PBI - Aduana Semántica y Diálogo Empático

**Identificador:** PBI-ARCH-ORCH-002  
**Estatus:** Certificado dentro del lote [PBI-ARCH-ORCH-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico%20con%20Persistencia%20MySQL.md)  
**Historia de Usuario:** [[ARQUITECTURA] Lienzo de Orquestación Híbrida y Triaje Semántico](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Lienzo%20de%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico.md) · Escenario 1  
**Módulo:** `src/features/triage/`, `src/features/ai-engine/`  
**Prioridad:** P1  
**Tamaño relativo:** 2 SP  

---

## 1. Declaración (INVEST)

**Como** viajero que a veces solo comenta cómo se siente,  
**Quiero** que el asistente reconozca una charla casual y responda con empatía,  
**Para** seguir la conversación sin que el sistema me exija datos de ruta.

## 2. Alcance

Intercepta el mensaje en `TriageInputUseCase`. Si la intención es casual, el resultado es `TriageOutcome` con estado `CASUAL_DIALOGUE` y un `dialogueMessage` producido por `generateEmpatheticDialogue` (Groq, con fallback determinista).

La Matriz de Densidad no se muta en este camino. El caso de uso no eleva el turno a error ni emite `INCOMPLETE_REPROMPT`.

## 3. Fuera de este corte

La extracción de `time_window`, `group_size`, `vibe` y `constraints`, el peaje del 60 % y la ignición del LLM pertenecen a `PBI-ARCH-ORCH-003`. La detección de idioma y la cookie `bx_lang` pertenecen a `PBI-I18N-TRIAGE-SOVEREIGNTY-003`.

## 4. Criterios de aceptación

- [x] **CA-1:** Un mensaje emocional o de estado físico (ejemplo: «Uf, estoy agotado del viaje, qué calor hace») clasifica `CASUAL_DIALOGUE`.
- [x] **CA-2:** La respuesta la genera el SLM conversacional. Si el proveedor no responde, el adaptador entrega el fallback determinista.
- [x] **CA-3:** El payload de densidad de la sesión permanece igual al que había antes del turno casual.
- [x] **CA-4:** El contrato Zod de triaje admite `CASUAL_DIALOGUE` y `dialogueMessage`.

## 5. Evidencia colocada

- `src/features/triage/triage-input.use-case.ts` (`isCasualDialogueIntent`, rama `CASUAL_DIALOGUE`)
- `src/features/triage/triage-outcome.vo.ts` (`createCasualDialogue`)
- `src/features/triage/triage.schema.ts`
- `src/features/ai-engine/conversational-slm.port.ts`
- `src/features/ai-engine/groq/groq-conversational-slm.adapter.ts`
- `src/features/triage/triage.test.ts`

La Santa Trinidad del lote padre (2026-09-26): `tsc --noEmit` limpio, `eslint` limpio, `vitest` 318/318.
