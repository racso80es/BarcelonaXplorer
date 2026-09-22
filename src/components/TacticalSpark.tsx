import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const tacticalSparkVariants = cva(
  'inline-flex items-center px-3 py-1.5 rounded-full border shadow-xs backdrop-blur-sm text-xs font-mono transition-colors duration-200',
  {
    variants: {
      urgency: {
        low: 'bg-zinc-100 border-layout-divider-strong text-zinc-700',
        medium: 'bg-amber-50 border-amber-300 text-amber-800',
        high: 'bg-red-50 border-red-300 text-red-800',
      },
    },
    defaultVariants: {
      urgency: 'low',
    },
  }
);

export interface TacticalSparkProps extends VariantProps<typeof tacticalSparkVariants> {
  id: string;
  type: 'weather' | 'security' | 'logistics' | 'affiliation';
  insight: string;
  icon: React.ElementType;
  urgency: 'low' | 'medium' | 'high';
  className?: string;
}

export function TacticalSpark({
  insight,
  icon: Icon,
  urgency = 'low',
  className,
}: TacticalSparkProps) {
  return (
    <div className="relative w-full max-w-3xl ml-4 sm:ml-16 mb-2 sm:mb-3 animate-fade-in-up">
      {/* Vínculo visual sutil hacia el bloque principal adaptado al sustrato claro */}
      <div className="hidden sm:block absolute -left-6 top-1/2 w-4 h-px bg-zinc-300 -translate-y-1/2" />

      <div className={cn(tacticalSparkVariants({ urgency }), className)}>
        <Icon className="w-3.5 h-3.5 mr-2 shrink-0" />
        <span className="leading-tight font-medium">{insight}</span>
      </div>
    </div>
  );
}
