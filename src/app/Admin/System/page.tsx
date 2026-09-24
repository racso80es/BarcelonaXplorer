import { Suspense } from 'react';
import { prisma } from '@/infrastructure/persistence/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Globe, Activity } from 'lucide-react';
import { AdminPageHeader } from '../_components/AdminPageHeader';
import { AiTelemetryCard, AiTelemetryCardSkeleton } from './AiTelemetryCard';
import { GroqTelemetryCard, GroqTelemetryCardSkeleton } from './GroqTelemetryCard';
import { JevTelemetryCard, JevTelemetryCardSkeleton } from './JevTelemetryCard';
import {
  TelegramTelemetryCard,
  TelegramTelemetryCardSkeleton,
} from './TelegramTelemetryCard';

export const dynamic = 'force-dynamic';

export default async function SystemAdmin() {
  let dbStatus = { ok: false, msg: 'Desconectado' };
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = { ok: true, msg: 'Conexión S+ Grade Establecida' };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Desconocido';
    dbStatus = { ok: false, msg: `Fallo: ${errMessage}` };
  }

  let netStatus = { ok: false, msg: 'Desconectada' };
  try {
    const res = await fetch('https://1.1.1.1', { cache: 'no-store' });
    if (res.ok) netStatus = { ok: true, msg: 'Ruta de salida abierta' };
  } catch {
    netStatus = { ok: false, msg: 'Sin salida a internet' };
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Sensores del Sistema"
        description="Monitoreo síncrono de motores, persistencia y gateways del Nodo 11"
        icon={<Activity className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />}
        badge={
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            6 Sondas Activas
          </span>
        }
      />

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
        {/* Tarjeta MySQL */}
        <Card className="bg-surface-container border-layout-divider shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-content-meta">
              Persistencia Híbrida (MySQL)
            </CardTitle>
            <Database className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center mt-2">
              <div
                className={`w-2.5 h-2.5 rounded-full mr-3 ${
                  dbStatus.ok ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span
                className={`font-mono text-sm ${
                  dbStatus.ok
                    ? 'text-emerald-700 font-medium'
                    : 'text-red-700 font-medium'
                }`}
              >
                {dbStatus.msg}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta Red */}
        <Card className="bg-surface-container border-layout-divider shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-content-meta">
              Aduana / Red Externa
            </CardTitle>
            <Globe className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center mt-2">
              <div
                className={`w-2.5 h-2.5 rounded-full mr-3 ${
                  netStatus.ok ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span
                className={`font-mono text-sm ${
                  netStatus.ok
                    ? 'text-emerald-700 font-medium'
                    : 'text-red-700 font-medium'
                }`}
              >
                {netStatus.msg}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta Motor IA Gemini */}
        <Suspense fallback={<AiTelemetryCardSkeleton />}>
          <AiTelemetryCard />
        </Suspense>

        {/* Tarjeta Motor Rápido Groq */}
        <Suspense fallback={<GroqTelemetryCardSkeleton />}>
          <GroqTelemetryCard />
        </Suspense>

        {/* Tarjeta Motor Decisión Jev AI (System One) */}
        <Suspense fallback={<JevTelemetryCardSkeleton />}>
          <JevTelemetryCard />
        </Suspense>

        {/* Tarjeta Gateway Telegram Bot */}
        <Suspense fallback={<TelegramTelemetryCardSkeleton />}>
          <TelegramTelemetryCard />
        </Suspense>
      </div>
    </div>
  );
}
