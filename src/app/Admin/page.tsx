import Link from 'next/link';
import { prisma } from '@/shared/persistence/prisma';
import {
  Users,
  UserPlus,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Terminal,
  ArrowRight,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader } from './_components/AdminPageHeader';
import { KpiMetricCard } from './_components/KpiMetricCard';

export const dynamic = 'force-dynamic';

async function safeCount(queryFn: () => Promise<number>, metricName: string): Promise<number> {
  try {
    return await queryFn();
  } catch (err: unknown) {
    console.warn(`[AdminDashboardPage] Resiliencia activa: No se pudo obtener métrica '${metricName}':`, err instanceof Error ? err.message : String(err));
    return 0;
  }
}

export default async function AdminDashboardPage() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const [
      totalUsers,
      recentUsers,
      frictionAlerts,
      totalTelemetry24h,
      errorLogsCount,
    ] = await Promise.all([
      // 1. Fuerza Operativa Total (Usuarios Registrados en Telegram)
      safeCount(() => prisma.userAnchor.count(), 'totalUsers'),

      // 2. Tracción de Umbral (Nuevos Anclajes registrados en las últimas 24h)
      safeCount(
        () => prisma.userAnchor.count({ where: { createdAt: { gte: last24h } } }),
        'recentUsers'
      ),

      // 3. Densidad de Fricción (Alertas WARN o ERROR en 24h)
      safeCount(
        () =>
          prisma.telemetryLog.count({
            where: {
              level: { in: ['ERROR', 'WARN'] },
              createdAt: { gte: last24h },
            },
          }),
        'frictionAlerts'
      ),

      // 4. Actividad Sensorial Global (Total de Logs de Telemetría en 24h)
      safeCount(
        () => prisma.telemetryLog.count({ where: { createdAt: { gte: last24h } } }),
        'totalTelemetry24h'
      ),

      // 5. Total acumulado de Errores Críticos
      safeCount(
        () => prisma.telemetryLog.count({ where: { level: 'ERROR' } }),
        'errorLogsCount'
      ),
    ]);

    const frictionRate =
      totalTelemetry24h > 0
        ? ((frictionAlerts / totalTelemetry24h) * 100).toFixed(1)
        : '0.0';

    return (
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        <AdminPageHeader
          title="Sala de Control: Dashboard Táctico"
          description="Métricas de retención B2C, anclajes omnicanal y fricción sensorial del sistema"
          icon={<Gauge className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />}
          badge={
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Simbiosis Activa
            </span>
          }
        />

        {/* Rejilla de Métricas Tácticas (KPIs con Conteo Escalar Homogéneo) */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <KpiMetricCard
            title="Fuerza Operativa Total"
            value={totalUsers}
            description="Exploradores con anclaje activo en Telegram"
            icon={<Users className="w-4 h-4" />}
            trend="positive"
            trendLabel="HU 2.2"
          />

          <KpiMetricCard
            title="Tracción de Umbral (24h)"
            value={recentUsers}
            description="Nuevos anclajes en las últimas 24 horas"
            icon={<UserPlus className="w-4 h-4" />}
            trend={recentUsers > 0 ? 'positive' : 'neutral'}
            trendLabel={recentUsers > 0 ? `+${recentUsers}` : 'Estable'}
          />

          <KpiMetricCard
            title="Densidad de Fricción (24h)"
            value={frictionAlerts}
            description={`${frictionRate}% del tráfico sensorial (${totalTelemetry24h} logs)`}
            icon={<AlertTriangle className="w-4 h-4" />}
            trend={frictionAlerts > 0 ? 'warning' : 'positive'}
            trendLabel={frictionAlerts > 0 ? `${frictionRate}% Fricción` : 'Óptimo'}
          />

          <KpiMetricCard
            title="Incidentes Críticos"
            value={errorLogsCount}
            description="Errores acumulados en la bitácora"
            icon={<ShieldCheck className="w-4 h-4" />}
            trend={errorLogsCount === 0 ? 'positive' : 'negative'}
            trendLabel={errorLogsCount === 0 ? '0 Fallos (S+)' : 'Revisar Bitácora'}
          />
        </div>

        {/* Módulos de Acceso Táctico Rápido */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 pt-2">
          <Card className="bg-surface-container border-layout-divider shadow-sm hover:border-layout-divider-strong transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base font-bold text-content-primary">
                  Sondas y Sensores del Sistema
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                6 Sensores
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-content-meta">
                Auditoría en tiempo real de MySQL, salida perimetral DNS, motores LLM (Gemini, Groq, Jev AI) y el Gateway de Telegram Bot sin penalización de renderizado.
              </p>
              <Link
                href="/Admin/System"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <span>Inspeccionar Sondas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-surface-container border-layout-divider shadow-sm hover:border-layout-divider-strong transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base font-bold text-content-primary">
                  Bitácora Sensorial de Telemetría
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-layout-divider">
                Forense
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-content-meta">
                Exploración detallada de eventos con tabla interactiva DataTable, filtros por severidad, paginación y modal forense para inspección de payloads JSON.
              </p>
              <Link
                href="/Admin/Logs"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <span>Abrir Bitácora de Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('[CRITICAL] Error de extracción en AdminDashboardPage:', error);
    throw error; // Delegación al Error Boundary src/app/Admin/error.tsx
  }
}
