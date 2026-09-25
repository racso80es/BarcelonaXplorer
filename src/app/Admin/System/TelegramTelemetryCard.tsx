import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import {
  AuditTelegramBotHealthUseCasePort,
  AuditTelegramBotHealthResult,
} from '@/application/ports/in/audit-telegram-bot-health.use-case.port';
import { AuditTelegramBotHealthUseCase } from '@/features/telegram';
import { TelegramBotApiGateway } from '@/features/telegram';
import { PrismaTelemetryRepository } from '@/features/telemetry';

export interface TelegramTelemetryCardProps {
  useCase?: AuditTelegramBotHealthUseCasePort;
}

function createDefaultUseCase(): AuditTelegramBotHealthUseCasePort {
  const gateway = new TelegramBotApiGateway();
  const telemetryRepo = new PrismaTelemetryRepository();
  return new AuditTelegramBotHealthUseCase(gateway, telemetryRepo);
}

/**
 * Sensor C (Gateway Telegram Bot) para el panel táctico de administración.
 *
 * Principio DIP (La Vía del Yunque):
 * Componente estrictamente visual (Server Component). No ejecuta peticiones HTTP directas
 * ni interactúa con la capa de persistencia; delega la auditoría y telemetría reactiva
 * al caso de uso AuditTelegramBotHealthUseCase.
 */
export async function TelegramTelemetryCard({ useCase }: TelegramTelemetryCardProps = {}) {
  const auditUseCase = useCase ?? createDefaultUseCase();
  const status: AuditTelegramBotHealthResult = await auditUseCase.execute();

  const dotColor =
    status.state === 'ok'
      ? 'bg-emerald-500'
      : status.state === 'disabled'
        ? 'bg-sky-400'
        : status.state === 'warn'
          ? 'bg-amber-500'
          : 'bg-red-500';

  const textColor =
    status.state === 'ok'
      ? 'text-emerald-700 font-medium'
      : status.state === 'disabled'
        ? 'text-sky-700 font-medium'
        : status.state === 'warn'
          ? 'text-amber-700 font-medium'
          : 'text-red-700 font-medium';

  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-content-meta">
          Telegram Bot
        </CardTitle>
        <Send className="h-4 w-4 text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div className={`w-2.5 h-2.5 rounded-full mr-3 shrink-0 ${dotColor}`} />
          <span className={`font-mono text-sm truncate ${textColor}`}>
            {status.msg}
          </span>
        </div>
        <p className="text-xs text-content-subtle font-mono mt-2 truncate">
          {status.state === 'disabled'
            ? 'Modo Simulado / Standby'
            : status.botUsername
              ? `Pendientes: ${status.pendingUpdates}`
              : 'Canal B2C Inactivo'}
        </p>
      </CardContent>
    </Card>
  );
}

export function TelegramTelemetryCardSkeleton() {
  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />
        <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div className="w-2.5 h-2.5 rounded-full mr-3 bg-zinc-300 dark:bg-zinc-700" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-36" />
        </div>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mt-2" />
      </CardContent>
    </Card>
  );
}
