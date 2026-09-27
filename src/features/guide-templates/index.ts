/**
 * ============================================================================
 * VERTICAL SLICE: GUIDE TEMPLATES & DYNAMIC TAXONOMY (HU 9 / HU 12 S+ GRADE)
 * ============================================================================
 */

// Domain (Value Objects, Entities, Schemas)
export * from './domain/value-objects/template-slug.vo';
export * from './domain/guide-template.schema';
export * from './domain/template-category.entity';
export * from './domain/guide-template.entity';

// Ports
export * from './ports/template-category-repository.port';
export * from './ports/guide-template-repository.port';
export * from './ports/template-translation-service.port';

// Adapters
export * from './adapters/prisma-template-category.repository';
export * from './adapters/prisma-guide-template.repository';
export * from './adapters/gemini-template-translation.adapter';

// Use Cases
export * from './use-cases/get-published-template-by-slug.use-case';
export * from './use-cases/list-active-categories.use-case';
export * from './use-cases/create-template-category.use-case';
