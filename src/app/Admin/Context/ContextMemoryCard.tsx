import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, ShieldCheck, Database } from 'lucide-react';
import { ContextAdminService } from '@/features/context-sources/context-admin.service';
import { ContextMemoryTableClient } from './ContextMemoryTableClient';

export interface ContextMemoryCardProps {
  readonly service?: ContextAdminService;
}

export function ContextMemoryCardSkeleton() {
  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm animate-pulse">
      <CardHeader className="pb-4 border-b border-layout-divider">
        <div className="h-6 w-64 bg-zinc-200 rounded" />
      </CardHeader>
      <CardContent className="pt-6 h-64 flex items-center justify-center">
        <div className="text-xs text-content-meta font-mono">Cargando memoria contextual...</div>
      </CardContent>
    </Card>
  );
}

export async function ContextMemoryCard({
  service = new ContextAdminService(),
}: ContextMemoryCardProps = {}) {
  let entries: import('@/features/context-sources/context-admin.service').ContextMemoryEntryItem[] = [];
  let isAvailable = true;

  try {
    const res = await service.listMemoryEntries(100);
    entries = res.entries;
    isAvailable = res.isAvailable;
  } catch (error) {
    console.warn('[ContextMemoryCard] Error listando memoria contextual:', error);
    isAvailable = false;
  }

  const eventCount = entries.filter((e) => e.category === 'EVENT').length;
  const venueCount = entries.filter((e) => e.category === 'VENUE' || e.category === 'POI').length;

  return (
    <Card className="bg-surface-container border-layout-divider text-content-primary shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-layout-divider gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-content-primary">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Memoria Vectorial Hiperlocal (LanceDB: context_memory)</span>
          </CardTitle>
          <p className="text-xs text-content-meta">
            Registros vigentes indexados con Gemini Embeddings y deduplicación térmica SHA-256
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Tope de Lectura: 100
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
            Eventos: {eventCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            Locales/POI: {venueCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-layout-divider">
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            Total: {entries.length}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <ContextMemoryTableClient entries={entries} isLanceDbAvailable={isAvailable} />
      </CardContent>
    </Card>
  );
}
