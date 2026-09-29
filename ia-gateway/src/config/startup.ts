import { resolveFallbackConfig } from '../endpoints/llm/fallback.config.js';
import { resolveProviderModels } from '../endpoints/llm/models.config.js';

export interface StartupConfig {
  port: number;
  gatewaySecret: string;
}

export function assertStartupConfig(
  env: Record<string, string | undefined> = process.env
): StartupConfig {
  const secret = env['IA_GATEWAY_SECRET'];
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[IA Gateway Error] IA_GATEWAY_SECRET no está definida o tiene menos de 32 caracteres. Es obligatorio configurar un secreto compartido seguro para iniciar el microservicio.'
    );
  }

  // Verifica anclajes base (Fail-fast según CA-3 y D-1)
  resolveFallbackConfig(env);

  // Verifica matrices declarativas de modelos
  resolveProviderModels(env);

  const port = parseInt(env['PORT'] ?? '3001', 10);

  return {
    port,
    gatewaySecret: secret.trim(),
  };
}
