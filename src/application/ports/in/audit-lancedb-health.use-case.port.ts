export type LanceDbHealthState = 'ok' | 'warn' | 'error';

export interface AuditLanceDbHealthResult {
  readonly state: LanceDbHealthState;
  readonly msg: string;
  readonly path: string;
  readonly latencyMs: number;
  readonly tableCount: number;
  readonly isHealthy: boolean;
}

export interface AuditLanceDbHealthUseCasePort {
  execute(): Promise<AuditLanceDbHealthResult>;
}
