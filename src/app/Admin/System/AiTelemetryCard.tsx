import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { GeminiClient } from '@/infrastructure/ai/gemini-client';

/**
 * Extrae un mensaje de error legible para humanos, sin exponer
 * JSON crudo ni estructuras internas de la API en el frontend.
 */
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Detectar mensajes que son JSON embebido (ej: '{"error":{"message":"..."}}')
    const msg = error.message;
    if (msg.startsWith('{')) {
      try {
        const parsed = JSON.parse(msg);
        if (typeof parsed?.error?.message === 'string') {
          return parsed.error.message;
        }
      } catch {
        // No es JSON válido — usar fallback
      }
    }
    return msg;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
    const nested = err.error as Record<string, unknown> | undefined;
    if (typeof nested?.message === 'string') return nested.message as string;
  }

  return 'Error de invocación desconocido';
}

async function checkAiStatus() {
  const startTime = Date.now();
  const primaryModel = (process.env.GEMINI_MODELS || 'gemini-1.5-flash').split(',')[0].trim();
  
  try {
    const aiClient = new GeminiClient();
    await aiClient.generateText('ping');
    const latency = Date.now() - startTime;
    return {
      ok: true,
      msg: `Operativo (${latency} ms)`,
      model: primaryModel,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      msg: sanitizeErrorMessage(error),
      model: primaryModel,
    };
  }
}

export async function AiTelemetryCard() {
  const aiStatus = await checkAiStatus();

  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-content-meta">
          Motor IA ({aiStatus.model})
        </CardTitle>
        <Bot className="h-4 w-4 text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-start mt-2">
          <div
            className={`w-2.5 h-2.5 rounded-full mr-3 mt-1 shrink-0 ${
              aiStatus.ok ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span
            className={`font-mono text-sm flex-1 break-words ${
              aiStatus.ok ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'
            }`}
          >
            {aiStatus.msg}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AiTelemetryCardSkeleton() {
  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-content-meta">
          Motor IA (Evaluando...)
        </CardTitle>
        <Bot className="h-4 w-4 text-zinc-400 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div className="w-2.5 h-2.5 rounded-full mr-3 bg-amber-500 animate-ping" />
          <span className="font-mono text-sm text-zinc-500">
            Sondeando clúster Gemini...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
