import { OperationEnvelope } from '@/shared/operation-envelope';
import {
  ContextSourceSnapshot,
  ContextSourceStatus,
  ContextSourceType,
} from './context-source.types';

export interface SeedSourceInput {
  sourceTag: string;
  displayName: string;
  endpoint: string;
  type: ContextSourceType;
  category: string;
  status: ContextSourceStatus;
  proposedBy?: string;
  supersedesSourceTag?: string | null;
}

export interface SeedUpsertResult {
  created: number;
  updated: number;
  untouched: number;
}

export interface IContextSourceRepository {
  findByStatus(status: ContextSourceStatus): Promise<ContextSourceSnapshot[]>;
  findByTag(sourceTag: string): Promise<ContextSourceSnapshot | null>;
  findAll(): Promise<ContextSourceSnapshot[]>;
  save(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextSourceSnapshot>>;
  create(source: Omit<ContextSourceSnapshot, 'id'>): Promise<OperationEnvelope<ContextSourceSnapshot>>;
  upsertFromSeed(entries: SeedSourceInput[]): Promise<OperationEnvelope<SeedUpsertResult>>;
}
