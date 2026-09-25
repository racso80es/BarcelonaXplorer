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
export * from './fast-insight.entity';
export * from './generate-fast-radar.use-case';
export * from './fast-interaction-ai.port';
export * from './ai-generator.port';
export * from './geographic-bounce-generator.port';
export * from './audit-jev-health.use-case.port';
export * from './fast-insight.schema';
