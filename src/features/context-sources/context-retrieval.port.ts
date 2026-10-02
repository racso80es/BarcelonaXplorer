import { OperationEnvelope } from '@/shared/operation-envelope';
import { ContextEntry } from './context-entry.schema';

export interface ContextRetrievalOptions {
  limit?: number;
  category?: string;
  notExpired?: boolean;
  now?: Date;
}

export interface IContextRetrievalPort {
  search(
    queryVector: number[],
    options?: ContextRetrievalOptions
  ): Promise<OperationEnvelope<ContextEntry[]>>;
}
