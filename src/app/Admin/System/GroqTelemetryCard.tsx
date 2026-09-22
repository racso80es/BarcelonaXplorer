import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

/**
 * Prueba de vida cruda contra la API de Groq.
 *
 * Usa fetch directo (no el adaptador de negocio) con payload quirúrgico
 * de 1 token para medir TTFT (Time To First Token) real sin gasto
 * termodinámico.
 */
async function checkGroqStatus() {
  const model = process.env.GROQ_FAST_MODEL || 'qwen/qwen3.8-27b';
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      msg: 'GROQ_API_KEY no configurada',
      model,
    };
  }

  const t0 = performance.now();

  try {
    const res = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      },
    );

    const latency = Math.round(performance.now() - t0);

    if (res.ok) {
      return {
        ok: true,
        msg: `Operativo - Latencia: ${latency}ms`,
        model,
      };
    }

    // Intentar extraer mensaje legible del cuerpo de error de la API
    let errorDetail = '';
    try {
      const body = await res.json();
      if (typeof body?.error?.message === 'string') {
        errorDetail = body.error.message;
      }
    } catch {
      // Body no parseable — usar fallback por status code
    }

    if (!errorDetail) {
      const statusLabels: Record<number, string> = {
        401: 'Fallo de autenticación',
        403: 'Acceso denegado',
        429: 'Límite de cuota excedido',
        500: 'Error interno del servidor',
        503: 'Servicio no disponible',
      };
      errorDetail = statusLabels[res.status] || `HTTP ${res.status}`;
    }

    return {
      ok: false,
      msg: `${errorDetail} (${latency}ms)`,
      model,
    };
  } catch {
    return {
      ok: false,
      msg: 'Fallo de Inferencia',
      model,
    };
  }
}

export async function GroqTelemetryCard() {
  const status = await checkGroqStatus();

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
            Sondeando motor Groq...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
