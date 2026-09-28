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
