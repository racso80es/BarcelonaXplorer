'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Transmisión asíncrona de telemetría perimetral de cliente (Fire-and-Forget)
    const payload = {
      level: 'ERROR',
      context: 'CLIENT_UI',
      message: error.message || 'Error no controlado en la interfaz del cliente',
      statusCode: 500,
      payload: {
        name: error.name,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry/log', blob);
      } else {
        fetch('/api/telemetry/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Falla silenciosa en cliente para no bloquear el renderizado defensivo
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-zinc-950 text-zinc-100 font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-red-900/40 rounded-xl p-8 shadow-2xl space-y-6 text-center">
        <div className="inline-flex p-3 rounded-full bg-red-950/60 border border-red-800/50 text-red-400">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">
            [ ANOMALÍA ] Disrupción en la Interfaz
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Se ha producido una falla inesperada en el renderizado táctico. La incidencia ha sido
            registrada en la telemetría central del sistema.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-zinc-500 pt-1">
              Código de rastreo: {error.digest}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => reset()}
          className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold rounded-lg transition-colors duration-200 cursor-pointer text-sm shadow-lg shadow-emerald-950/50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Restablecer Interfaz</span>
        </button>
      </div>
    </div>
  );
}
