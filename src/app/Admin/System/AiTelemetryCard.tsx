import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { GeminiClient } from '@/infrastructure/ai/gemini-client';

async function checkAiStatus() {
  const startTime = Date.now();
  try {
    const aiClient = new GeminiClient();
    await aiClient.generateText('ping');
    const latency = Date.now() - startTime;
    return {
      ok: true,
      msg: `Operativo (${latency} ms)`,
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    };
  } catch (error: any) {
    return {
      ok: false,
      msg: `Fallo: ${error.message || 'Error de invocación'}`,
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    };
  }
}

export async function AiTelemetryCard() {
  const aiStatus = await checkAiStatus();

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Motor IA ({aiStatus.model})
        </CardTitle>
        <Bot className="h-4 w-4 text-zinc-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div
            className={`w-2.5 h-2.5 rounded-full mr-3 ${
              aiStatus.ok ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span
            className={`font-mono text-sm truncate ${
              aiStatus.ok ? 'text-emerald-400' : 'text-red-400'
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
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Motor IA (Evaluando...)
        </CardTitle>
        <Bot className="h-4 w-4 text-zinc-500 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div className="w-2.5 h-2.5 rounded-full mr-3 bg-amber-500 animate-ping" />
          <span className="font-mono text-sm text-zinc-400">
            Sondeando clúster Gemini...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
