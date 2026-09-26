export type TelemetryLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type TelemetryContext =
  | 'CLIENT_UI'
  | 'SERVER_API'
  | 'LLM_ENGINE'
  | 'SYSTEM'
  | 'SECURITY_PERIMETER';

export interface TelemetryPayload {
  [key: string]: unknown;
}

export interface TelemetryFilter {
  level?: TelemetryLevel;
  context?: TelemetryContext;
  since?: Date;
  limit?: number;
}

export interface RetentionRules {
  debugInfoMaxAgeDays?: number;
  warnErrorMaxAgeDays?: number;
}

/**
 * Entidad Pura de Dominio que modela un evento de telemetría y trazabilidad.
 * Totalmente agnóstica a la base de datos (Prisma/MySQL) y al framework (Next.js).
 */
export class TelemetryEntry {
  constructor(
    public readonly level: TelemetryLevel,
    public readonly context: TelemetryContext,
    public readonly message: string,
    public readonly payload?: TelemetryPayload | null,
    public readonly statusCode?: number | null,
    public readonly durationMs?: number | null,
    public readonly environment: string = 'production',
    public readonly id?: string,
    public readonly createdAt?: Date,
  ) {
    if (!message || message.trim().length === 0) {
      throw new Error('El mensaje de telemetría no puede estar vacío.');
    }
  }

  /**
   * Sanitiza un payload eliminando claves sensibles como contraseñas o tokens.
   */
  static sanitizePayload(payload: unknown): TelemetryPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const forbiddenSubstrings = [
      'password',
      'authorization',
      'cookie',
      'secret',
      'api_key',
      'apikey',
      'admin_password_hash',
    ];

    const copy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

    const isSensitiveKey = (key: string): boolean => {
      const lower = key.toLowerCase();
      if (forbiddenSubstrings.some((f) => lower.includes(f))) {
        return true;
      }
      const isLlmMetric =
        lower.includes('tokenssaved') ||
        lower.includes('tokens_saved') ||
        lower.includes('tokencount') ||
        lower.includes('tokenscount') ||
        lower.includes('prompttokens') ||
        lower.includes('completiontokens');
      if (
        !isLlmMetric &&
        (lower === 'token' ||
          lower.includes('auth_token') ||
          lower.includes('access_token') ||
          lower.includes('refresh_token') ||
          lower.includes('session_token') ||
          lower.includes('authtoken') ||
          lower.includes('accesstoken') ||
          lower.endsWith('_token') ||
          lower.endsWith('token'))
      ) {
        return true;
      }
      return false;
    };

    const recursiveSanitize = (obj: Record<string, unknown>) => {
      for (const key of Object.keys(obj)) {
        if (isSensitiveKey(key)) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          recursiveSanitize(obj[key] as Record<string, unknown>);
        }
      }
    };

    recursiveSanitize(copy);
    return copy;
  }
}
