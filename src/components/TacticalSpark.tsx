import React from 'react';
import { cn } from '@/lib/utils';

export interface TacticalSparkProps {
  id: string;
  type: 'weather' | 'security' | 'logistics' | 'affiliation';
  insight: string;
  icon: React.ElementType;
  urgency: 'low' | 'medium' | 'high';
}

export function TacticalSpark({
  insight,
  icon: Icon,
  urgency,
}: TacticalSparkProps) {
  
  // Codificación por Urgencia (Colores)
  const urgencyClasses = {
    low: 'bg-zinc-900 border-zinc-700 text-zinc-400',
    medium: 'bg-amber-950/40 border-amber-800 text-amber-500',
    high: 'bg-red-950/40 border-red-800 text-red-400',
  };

  return (
    <div className="relative w-full max-w-3xl ml-16 mb-3 animate-fade-in-up">
      {/* Vínculo visual sutil hacia el bloque principal (opcional, para enfatizar la rama) */}
      <div className="absolute -left-6 top-1/2 w-4 h-px bg-zinc-800 -translate-y-1/2" />
      
      <div
        className={cn(
          'inline-flex items-center px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-sm',
          'text-xs font-mono transition-colors duration-200',
          urgencyClasses[urgency]
        )}
      >
        <Icon className="w-3.5 h-3.5 mr-2 shrink-0" />
        <span className="leading-tight">{insight}</span>
      </div>
    </div>
  );
}
