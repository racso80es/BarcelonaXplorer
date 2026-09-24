import { ReactNode } from 'react';

export interface AdminPageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly badge?: ReactNode;
  readonly action?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  icon,
  badge,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-layout-divider gap-4 mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-content-meta font-mono">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
