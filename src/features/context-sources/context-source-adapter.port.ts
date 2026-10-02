import { OperationEnvelope } from '@/shared/operation-envelope';
import { ContextEntry } from './context-entry.schema';
import { ContextSourceSnapshot, ContextSourceType } from './context-source.types';

/**
 * Puerto Hexagonal para adaptadores de extracción y normalización de fuentes de contexto.
 * Axioma V (Pure DI): cada adaptador se especializa en un ContextSourceType.
 */
export interface IContextSourceAdapter {
  readonly type: ContextSourceType;
  fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>>;
}

export type ContextAdapterRegistry = Partial<Record<ContextSourceType, IContextSourceAdapter>>;
