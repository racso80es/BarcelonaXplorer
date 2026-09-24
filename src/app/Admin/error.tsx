'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminErrorBoundary] Fricción no controlada capturada:', error);
  }, [error]);

  return (
    <div className="p-6 sm:p-12 max-w-2xl mx-auto my-12 bg-surface-container border border-red-200 rounded-xl shadow-sm text-center space-y-4">
      <div className="inline-flex p-3 bg-red-50 text-red-600 rounded-full border border-red-100">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-content-primary font-mono">
        Fricción Térmica en la Sala de Control
      </h2>
      <p className="text-sm text-content-meta max-w-md mx-auto">
        Se ha detectado una interrupción en el enlace de datos o persistencia del Nodo 11. El perímetro permanece seguro.
      </p>
      {error.digest && (
        <span className="inline-block text-[11px] font-mono px-2 py-1 bg-zinc-100 text-zinc-600 rounded border border-layout-divider">
          Firma: {error.digest}
        </span>
      )}
      <div className="pt-2">
        <Button
          onClick={() => reset()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar Sonda Táctica
        </Button>
      </div>
    </div>
  );
}
