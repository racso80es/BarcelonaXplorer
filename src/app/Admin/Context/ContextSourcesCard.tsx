import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import { ContextAdminService } from '@/features/context-sources/context-admin.service';
import type { ContextSourceSnapshot } from '@/features/context-sources/context-source.types';
import { ContextSourcesTableClient } from './ContextSourcesTableClient';

export interface ContextSourcesCardProps {
  readonly service?: ContextAdminService;
}

export function ContextSourcesCardSkeleton() {
  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm animate-pulse">
      <CardHeader className="pb-4 border-b border-layout-divider">
        <div className="h-6 w-64 bg-zinc-200 rounded" />
      </CardHeader>
      <CardContent className="pt-6 h-64 flex items-center justify-center">
        <div className="text-xs text-content-meta font-mono">Cargando catálogo de fuentes...</div>
      </CardContent>
    </Card>
  );
}

export async function ContextSourcesCard({
  service = new ContextAdminService(),
}: ContextSourcesCardProps = {}) {
  let sources: ContextSourceSnapshot[] = [];
  let dbError: string | null = null;

  try {
    sources = await service.listSources();
    if (sources.length === 0) {
      const { PrismaContextSourceRepository } = await import('@/features/context-sources/prisma-context-source.repository');
      const { ContextSourceSeedService } = await import('@/features/context-sources/context-source-seed.service');
      const seedService = new ContextSourceSeedService(new PrismaContextSourceRepository());
      await seedService.loadSeed();
      sources = await service.listSources();
    }
  } catch (error) {
    console.warn('[ContextSourcesCard] Error listando fuentes de contexto:', error);
    dbError = error instanceof Error ? error.message : 'Error en la conexión a la base de datos de fuentes';
  }

  const activeCount = sources.filter((s) => s.status === 'ACTIVE').length;
  const degradedCount = sources.filter((s) => s.status === 'DEGRADED').length;
  const pendingCount = sources.filter((s) => s.status === 'PENDING_APPROVAL').length;

  return (
    <Card className="bg-surface-container border-layout-divider text-content-primary shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-layout-divider gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-content-primary">
            <Globe2 className="w-5 h-5 text-emerald-600" />
            <span>Gobernanza Relacional de Fuentes (context_sources)</span>
          </CardTitle>
          <p className="text-xs text-content-meta">
            Máquina de estados finitos determinista y soberanía del Vértice Biológico
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Activas: {activeCount}
          </span>
          {degradedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Degradadas: {degradedCount}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Por Aprobar: {pendingCount}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-layout-divider">
            Total Fuentes: {sources.length}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {dbError ? (
          <div className="p-4 rounded-lg bg-rose-50/60 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Aviso de Persistencia Relacional</p>
              <p className="text-xs text-rose-700 mt-1">
                No se pudo consultar la tabla <code>context_sources</code> en MySQL: {dbError}
              </p>
            </div>
          </div>
        ) : (
          <ContextSourcesTableClient sources={sources} />
        )}
      </CardContent>
    </Card>
  );
}
