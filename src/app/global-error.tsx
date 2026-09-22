'use client';

import { useEffect } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    const payload = {
      level: 'ERROR',
      context: 'CLIENT_UI',
      message: error.message || 'Colapso total de renderizado en Root Layout',
      statusCode: 500,
      payload: {
        name: error.name,
        stack: error.stack,
        digest: error.digest,
        scope: 'global-error',
        url: typeof window !== 'undefined' ? window.location.href : '',
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
      // Silencioso
    }
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6 font-sans antialiased">
        <div className="max-w-md w-full bg-zinc-900 border border-red-800/60 rounded-xl p-8 shadow-2xl space-y-6 text-center">
          <div className="inline-flex p-3 rounded-full bg-red-950 border border-red-700/60 text-red-500">
            <AlertOctagon className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              [ SISTEMA ] Colapso de Núcleo
            </h1>
            <p className="text-sm text-zinc-400">
              Se ha detectado una interrupción en el árbol raíz de la aplicación. Se ha despachado
              un reporte automático al subsistema de telemetría.
            </p>
          </div>

          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold rounded-lg transition-colors cursor-pointer text-sm shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar Inicialización</span>
          </button>
        </div>
      </body>
    </html>
  );
}
