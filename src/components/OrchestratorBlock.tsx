import React, { ReactNode } from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Bot, User } from 'lucide-react';

export const orchestratorBlockVariants = cva(
  'relative w-full rounded-lg transition-all duration-300 ease-in-out p-4 sm:p-5 border shadow-sm',
  {
    variants: {
      role: {
        user: 'bg-surface-container border-layout-divider text-content-primary',
        ai: 'bg-surface-ai border-emerald-200/80 text-content-primary',
      },
    },
    defaultVariants: {
      role: 'user',
    },
  }
);

export interface OrchestratorBlockProps extends VariantProps<typeof orchestratorBlockVariants> {
  role: 'user' | 'ai';
  content: ReactNode | string;
  avatarUrl?: string;
  timestamp: Date;
  status?: 'pending' | 'orchestrating' | 'completed';
  className?: string;
}

export function OrchestratorBlock({
  role,
  content,
  avatarUrl,
  timestamp,
  status,
  className,
}: OrchestratorBlockProps) {
  const isAi = role === 'ai';
  const isProcessing = isAi && status !== 'completed';

  return (
    <div className="relative w-full max-w-3xl mt-6 ml-0 sm:ml-6 mb-6 px-2 sm:px-0">
      {/* Contenedor Principal (Losa de Mando con CVA) */}
      <div className={cn(orchestratorBlockVariants({ role }), className)}>
        {/* Efecto de Borde Luminoso para IA procesando */}
        {isProcessing && (
          <div className="absolute inset-0 rounded-lg ring-1 ring-emerald-500/50 animate-pulse pointer-events-none" />
        )}

        {/* El Avatar Desvinculado */}
        <div
          className={cn(
            'absolute -top-3.5 -left-3.5 sm:-top-4 sm:-left-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden z-10 shadow-sm border transition-colors',
            isAi
              ? 'bg-surface-container border-emerald-300'
              : 'bg-zinc-100 border-layout-divider-strong'
          )}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${role} avatar`}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : isAi ? (
            <Bot className="w-5 h-5 text-emerald-600" />
          ) : (
            <User className="w-5 h-5 text-zinc-600" />
          )}
        </div>

        {/* Contenido Táctico Ampliado (Escala Base 16px) */}
        <div className="text-content-primary text-base leading-relaxed pl-1 sm:pl-2 pt-1">
          {content}
        </div>

        {/* Metadatos (Footer) */}
        <div className="mt-4 flex items-center justify-end space-x-2 text-content-meta">
          {isAi && status === 'pending' && (
            <span className="flex items-center text-xs font-mono text-zinc-500">
              <Loader2 className="w-3 h-3 mr-1 animate-spin text-emerald-600" />
              INICIANDO...
            </span>
          )}
          {isAi && status === 'orchestrating' && (
            <span className="flex items-center text-xs font-mono text-emerald-700 font-medium">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ORQUESTANDO RUTA...
            </span>
          )}
          {isAi && status === 'completed' && (
            <span className="flex items-center text-xs font-mono text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              COMPLETADO
            </span>
          )}
          <span className="text-xs font-mono text-zinc-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
