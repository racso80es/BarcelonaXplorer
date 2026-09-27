"use client";

import React from 'react';
import { cva } from 'class-variance-authority';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Flame, CheckCircle, ShieldAlert, Zap, Loader2 } from 'lucide-react';
import { SupportedLanguageSchema, getUiDictionary } from '@/features/i18n';


export const ThermalMeterPropsSchema = z.object({
  score: z.number().min(0).max(100),
  survivalThreshold: z.number().min(0).max(100),
  isThresholdSatisfied: z.boolean(),
  missingVariable: z.string().optional().nullable(),
  matrixId: z.string().optional().default('default'),
  onForceDispatch: z.custom<() => void>().optional(),

  isDispatching: z.boolean().optional().default(false),
  lang: SupportedLanguageSchema.optional(),
  className: z.string().optional(),
});

export type ThermalMeterProps = z.input<typeof ThermalMeterPropsSchema>;


export const thermalMeterVariants = cva(
  'transition-all duration-300 ease-in-out flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 sm:px-4 sm:py-2.5 text-xs font-mono border',
  {
    variants: {
      state: {
        inert: 'bg-surface-subtle border-layout-divider-strong text-content-meta shadow-2xs',
        operational: 'bg-emerald-50/70 border-emerald-300 text-content-accent shadow-xs ring-1 ring-emerald-500/20',
        saturated: 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-semibold shadow-sm ring-2 ring-emerald-500/30',
      },
    },
    defaultVariants: {
      state: 'inert',
    },
  },
);

export function deriveThermalState(
  score: number,
  survivalThreshold: number,
  isThresholdSatisfied: boolean,
): 'inert' | 'operational' | 'saturated' {
  if (score >= 100) return 'saturated';
  if (isThresholdSatisfied || score >= survivalThreshold) return 'operational';
  return 'inert';
}

export function ThermalMeter({
  score,
  survivalThreshold,
  isThresholdSatisfied,
  missingVariable,
  matrixId = 'default',
  onForceDispatch,
  isDispatching = false,
  lang = 'es',
  className,
}: ThermalMeterProps) {
  const state = deriveThermalState(score, survivalThreshold, isThresholdSatisfied);
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const ui = getUiDictionary(lang);

  return (
    <div
      className={cn(thermalMeterVariants({ state }), className)}
      data-testid="thermal-meter"
      data-thermal-state={state}
      data-matrix-id={matrixId}
      data-lang={lang}
    >

      {/* Sección Izquierda: Estado e Indicador de Progreso */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 shrink-0">
          {state === 'inert' && <Flame className="w-4 h-4 text-zinc-400" />}
          {state === 'operational' && <CheckCircle className="w-4 h-4 text-emerald-600 animate-pulse" />}
          {state === 'saturated' && <ShieldAlert className="w-4 h-4 text-emerald-700" />}
          <span className="font-bold tracking-tight text-xs sm:text-sm">
            {normalizedScore}%
          </span>
        </div>

        {/* Barra de Progreso Accesible */}
        <div
          role="progressbar"
          aria-valuenow={normalizedScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${ui.thermalMeter.title}: ${normalizedScore}%`}
          className="h-2 w-20 sm:w-28 bg-zinc-200 rounded-full overflow-hidden shrink-0 relative"
        >
          {/* Marcador del Umbral de Supervivencia */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-zinc-400 z-10"
            style={{ left: `${Math.min(100, Math.max(0, survivalThreshold))}%` }}
            title={`Umbral operativo: ${survivalThreshold}%`}
          />
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out rounded-full',
              state === 'inert' && 'bg-zinc-400',
              state === 'operational' && 'bg-emerald-500',
              state === 'saturated' && 'bg-emerald-600',
            )}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>

        {/* Mensaje Táctico Contextual */}
        <div className="truncate text-xs">
          {state === 'inert' && (
            <span>
              {ui.thermalMeter.thresholdNeeded} {survivalThreshold}%
              {missingVariable && (
                <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700 font-sans text-xs">
                  {ui.thermalMeter.missingVariablePrefix}: {missingVariable}
                </span>
              )}
            </span>
          )}
          {state === 'operational' && (
            <span className="text-emerald-800 font-sans font-medium">
              {ui.thermalMeter.operational} · {ui.thermalMeter.thresholdMet} ({survivalThreshold}%)
            </span>
          )}
          {state === 'saturated' && (
            <span className="text-emerald-950 font-sans font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
              {ui.thermalMeter.saturated}
            </span>
          )}
        </div>
      </div>

      {/* Sección Derecha: Acción de Despacho Inmediato Opcional */}
      {onForceDispatch && (
        <button
          type="button"
          onClick={onForceDispatch}
          disabled={!isThresholdSatisfied || isDispatching}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-sans font-semibold transition-all flex items-center gap-1.5 shrink-0',
            isThresholdSatisfied
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-300/50',
          )}
        >
          {isDispatching ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{ui.thermalMeter.forging}</span>
            </>
          ) : (
            <span>{ui.thermalMeter.forgeRoute}</span>
          )}
        </button>
      )}
    </div>
  );
}
