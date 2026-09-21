import React, { ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Bot, User } from 'lucide-react';

export interface OrchestratorBlockProps {
  role: 'user' | 'ai';
  content: ReactNode | string;
  avatarUrl?: string; // Hacemos opcional para poder inyectar iconos si no hay foto
  timestamp: Date;
  status?: 'pending' | 'orchestrating' | 'completed';
}

export function OrchestratorBlock({
  role,
  content,
  avatarUrl,
  timestamp,
  status,
}: OrchestratorBlockProps) {
  const isAi = role === 'ai';
  const isProcessing = isAi && status !== 'completed';

  return (
    <div className="relative w-full max-w-3xl mt-6 ml-6 mb-6">
      {/* Contenedor Principal (Losa de Mando) */}
      <div
        className={cn(
          'relative w-full p-5 rounded-md shadow-lg', // Bordes afilados y espaciado
          'transition-all duration-300 ease-in-out',
          isAi
            ? 'bg-zinc-900/40 backdrop-blur-md border border-zinc-700/50' // Glassmorphism IA
            : 'bg-zinc-900 border border-zinc-800' // Opaco y sólido Usuario
        )}
      >
        {/* Efecto de Borde Luminoso para IA procesando */}
        {isProcessing && (
          <div className="absolute inset-0 rounded-md ring-1 ring-emerald-500/50 animate-pulse pointer-events-none" />
        )}

        {/* El Avatar Desvinculado */}
        <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-zinc-800 shadow-xl border border-zinc-700 flex items-center justify-center overflow-hidden z-10">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${role} avatar`}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : isAi ? (
            <Bot className="w-5 h-5 text-emerald-400" />
          ) : (
            <User className="w-5 h-5 text-zinc-300" />
          )}
        </div>

        {/* Contenido */}
        <div className="text-zinc-200 text-sm md:text-base leading-relaxed pl-2 pt-1">
          {content}
        </div>

        {/* Metadatos (Footer) */}
        <div className="mt-4 flex items-center justify-end space-x-2">
          {isAi && status === 'pending' && (
            <span className="flex items-center text-xs text-zinc-500 font-mono">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              INICIANDO...
            </span>
          )}
          {isAi && status === 'orchestrating' && (
            <span className="flex items-center text-xs text-emerald-500/80 font-mono">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ORQUESTANDO RUTA...
            </span>
          )}
          {isAi && status === 'completed' && (
            <span className="flex items-center text-xs text-zinc-500 font-mono">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              COMPLETADO
            </span>
          )}
          <span className="text-xs text-zinc-600 font-mono">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
