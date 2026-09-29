import { createDecisionHandler } from './endpoints/decision/decision.handler.js';
import { JevAdapter } from './endpoints/decision/jev.adapter.js';
import { GeminiAdapter } from './endpoints/llm/gemini.adapter.js';
import { GroqAdapter } from './endpoints/llm/groq.adapter.js';
import { createLlmHandler } from './endpoints/llm/llm.handler.js';
import { HealthSensor } from './health/health-sensor.js';
import { resolveFallbackConfig } from './endpoints/llm/fallback.config.js';
import { resolveProviderModels } from './endpoints/llm/models.config.js';
import { createGatewayServer, sendJson } from './server.js';
import { createSuccessEnvelope } from './shared/envelope.js';

import { assertStartupConfig } from './config/startup.js';
import type { StartupConfig } from './config/startup.js';

let startupConfig: StartupConfig;
try {
  startupConfig = assertStartupConfig(process.env);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const { port: PORT, gatewaySecret: IA_GATEWAY_SECRET } = startupConfig;

const healthSensor = new HealthSensor({
  jevBaseUrl: process.env.JEV_BASE_URL ?? 'https://jev-ai.pro/api',
  jevApiKey: process.env.JEV_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
});
healthSensor.startPeriodicProbes(60000);

const jevAdapter = new JevAdapter({
  baseUrl: process.env.JEV_BASE_URL ?? 'https://jev-ai.pro/api',
  apiKey: process.env.JEV_API_KEY ?? '',
  model: process.env.JEV_MODEL ?? 'jev-latest',
  timeoutMs: parseInt(process.env.JEV_TIMEOUT_MS ?? '10000', 10),
});

const geminiAdapter = new GeminiAdapter({
  apiKey: process.env.GEMINI_API_KEY,
  defaultModel: process.env.GEMINI_REASONING_MODEL ?? 'gemini-2.5-flash',
});

const groqAdapter = new GroqAdapter({
  apiKey: process.env.GROQ_API_KEY,
  defaultModel: process.env.GROQ_FAST_MODEL ?? 'llama-3.3-70b-versatile',
});

const fallbackConfig = resolveFallbackConfig();
const providerModels = resolveProviderModels();

const server = createGatewayServer({
  port: PORT,
  gatewaySecret: IA_GATEWAY_SECRET,
  decisionHandler: createDecisionHandler(jevAdapter),
  llmHandler: createLlmHandler(geminiAdapter, groqAdapter, healthSensor, fallbackConfig, providerModels),
  healthHandler: async (_req, res) => {
    sendJson(
      res,
      200,
      createSuccessEnvelope({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        providers: healthSensor.getAllHealth(),
      })
    );
  },
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[IA Gateway] Microservicio iniciado escuchando en 0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[IA Gateway] Recibida señal SIGTERM, apagando servidor...');
  server.close(() => {
    process.exit(0);
  });
});
