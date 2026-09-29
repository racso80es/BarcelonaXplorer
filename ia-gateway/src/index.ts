import { createGatewayServer } from './server.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const IA_GATEWAY_SECRET = process.env.IA_GATEWAY_SECRET ?? 'development-secret-key-change-in-prod';

const server = createGatewayServer({
  port: PORT,
  gatewaySecret: IA_GATEWAY_SECRET,
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
