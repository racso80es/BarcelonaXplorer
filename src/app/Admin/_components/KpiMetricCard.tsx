import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type KpiTrend = 'positive' | 'negative' | 'neutral' | 'warning';

export interface KpiMetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly trend?: KpiTrend;
  readonly trendLabel?: string;
}

export function KpiMetricCard({
  title,
  value,
  description,
  icon,
  trend = 'neutral',
  trendLabel,
}: KpiMetricCardProps) {
  const trendClasses: Record<KpiTrend, string> = {
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    negative: 'text-red-700 bg-red-50 border-red-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    neutral: 'text-zinc-600 bg-zinc-50 border-zinc-200',
  };

  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm hover:border-layout-divider-strong transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-content-meta">
          {title}
        </CardTitle>
        {icon && <div className="text-zinc-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-content-primary">
          {value}
        </div>
        {(description || trendLabel) && (
          <div className="flex items-center gap-2 mt-2">
            {trendLabel && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium border ${trendClasses[trend]}`}>
                {trendLabel}
              </span>
            )}
            {description && (
              <p className="text-xs text-content-meta truncate">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
