import { createDecisionHandler } from './endpoints/decision/decision.handler.js';
import { JevAdapter } from './endpoints/decision/jev.adapter.js';
import { HealthSensor } from './health/health-sensor.js';
import { createGatewayServer, sendJson } from './server.js';
import { createSuccessEnvelope } from './shared/envelope.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const IA_GATEWAY_SECRET = process.env.IA_GATEWAY_SECRET ?? 'development-secret-key-change-in-prod';

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

const server = createGatewayServer({
  port: PORT,
  gatewaySecret: IA_GATEWAY_SECRET,
  decisionHandler: createDecisionHandler(jevAdapter),
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
