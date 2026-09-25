// ═══════════════════════════════════════════════════════════════
// Vertical Slice: AI-Engine (Inferencia LLM / SLM, JEV, Groq, Gemini)
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

export * from './ITypedDecisionEngine';
export * from './conversational-slm.port';
export * from './embedding.port';
export * from './gemini-client';
export * from './gemini-embedding.adapter';
export * from './audit-jev-health.use-case';
export * from './jev/jevClient';
export * from './jev/types';
export * from './jev/config';
export * from './groq/groq-fast-ai.adapter';
export * from './groq/groq-conversational-slm.adapter';
export * from './groq/groq-geographic-bounce-generator';
