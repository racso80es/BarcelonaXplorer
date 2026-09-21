import { Suspense } from 'react';
import { PrismaClient } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Globe, Activity } from 'lucide-react';
import { AiTelemetryCard, AiTelemetryCardSkeleton } from './AiTelemetryCard';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function SystemAdmin() {
  let dbStatus = { ok: false, msg: 'Desconectado' };
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = { ok: true, msg: 'Conexión S+ Grade Establecida' };
  } catch (error: any) {
    dbStatus = { ok: false, msg: `Fallo: ${error.message || 'Desconocido'}` };
  }

  let netStatus = { ok: false, msg: 'Desconectada' };
  try {
    const res = await fetch('https://1.1.1.1', { cache: 'no-store' });
    if (res.ok) netStatus = { ok: true, msg: 'Ruta de salida abierta' };
  } catch (error) {
    netStatus = { ok: false, msg: 'Sin salida a internet' };
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center space-x-3 border-b border-zinc-800 pb-4">
          <Activity className="text-emerald-400 w-8 h-8" />
          <h1 className="text-3xl font-bold tracking-tight">[ NÚCLEO ] Telemetría</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {/* Tarjeta MySQL */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Persistencia Híbrida (MySQL)
              </CardTitle>
              <Database className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center mt-2">
                <div className={`w-2.5 h-2.5 rounded-full mr-3 ${dbStatus.ok ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className={`font-mono text-sm ${dbStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {dbStatus.msg}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Red */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Aduana / Red Externa
              </CardTitle>
              <Globe className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center mt-2">
                <div className={`w-2.5 h-2.5 rounded-full mr-3 ${netStatus.ok ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className={`font-mono text-sm ${netStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netStatus.msg}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Motor IA (Asíncrona vía Suspense) */}
          <Suspense fallback={<AiTelemetryCardSkeleton />}>
            <AiTelemetryCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
