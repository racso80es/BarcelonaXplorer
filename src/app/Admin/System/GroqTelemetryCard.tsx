import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { IaGatewayClient } from '@/features/ai-engine/server';

export interface GroqTelemetryCardProps {
  client?: IaGatewayClient;
}

export interface GroqTelemetryState {
  ok: boolean;
  msg: string;
  model: string;
}

export async function checkGroqGatewayStatus(
  client?: IaGatewayClient
): Promise<GroqTelemetryState> {
  const aiClient = client ?? new IaGatewayClient();
  const health = await aiClient.evaluateProviderHealth('GROQ');

  const model = health.configuredModel || 'desconocido';

  // 1. Gateway inalcanzable
  if (!health.isReachable) {
    return {
      ok: false,
      msg: 'Fallo de alcance al IA Gateway',
      model,
    };
  }

  // 2. Clave ausente en el gateway
  if (health.hasCredential === false) {
    return {
      ok: false,
      msg: 'GROQ_API_KEY no configurada en el gateway',
      model,
    };
  }

  // 3. Proveedor degradado o circuito abierto
  if (health.circuitState === 'OPEN') {
    return {
      ok: false,
      msg: `Circuito abierto (${health.latencyMs}ms)`,
      model,
    };
  }

  if (health.operationalStatus !== 'HEALTHY' || !health.isHealthy) {
    return {
      ok: false,
      msg: `Proveedor degradado (${health.latencyMs}ms)`,
      model,
    };
  }

  // 4. Operativo
  return {
    ok: true,
    msg: `Operativo - Latencia: ${health.latencyMs}ms`,
    model,
  };
}

export async function GroqTelemetryCard({ client }: GroqTelemetryCardProps = {}) {
  const status = await checkGroqGatewayStatus(client);

  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-content-meta">
          Motor Rápido ({status.model})
        </CardTitle>
        <Zap className="h-4 w-4 text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-start mt-2">
          <div
            className={`w-2.5 h-2.5 rounded-full mr-3 mt-1 shrink-0 ${
              status.ok ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span
            className={`font-mono text-sm flex-1 break-words ${
              status.ok ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'
            }`}
          >
            {status.msg}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function GroqTelemetryCardSkeleton() {
  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-content-meta">
          Motor Rápido (Evaluando...)
        </CardTitle>
        <Zap className="h-4 w-4 text-zinc-400 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div className="w-2.5 h-2.5 rounded-full mr-3 bg-amber-500 animate-ping" />
          <span className="font-mono text-sm text-zinc-500">
            Sondeando motor Groq vía Gateway...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
