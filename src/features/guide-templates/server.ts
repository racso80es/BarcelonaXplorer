/**
 * VERTICAL SLICE: GUIDE TEMPLATES & DYNAMIC TAXONOMY (SERVER RUNTIME)
 * Delimitación Hexagonal y Enclave de Servidor (Axioma I y II)
 */
import 'server-only';

// Adapters
export * from './adapters/prisma-template-category.repository';
export * from './adapters/prisma-guide-template.repository';
export * from './adapters/gemini-template-translation.adapter';

// Use Cases
export * from './use-cases/get-published-template-by-slug.use-case';
export * from './use-cases/list-active-categories.use-case';
export * from './use-cases/create-template-category.use-case';
