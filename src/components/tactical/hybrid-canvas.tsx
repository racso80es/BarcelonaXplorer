'use client';

import React, { memo, useState } from 'react';
import {
  Clock,
  ExternalLink,
  CheckCircle2,
  Utensils,
  Landmark,
  Compass,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { EnrichedRoute, EnrichedWaypoint } from '@/features/planner';
import {
  SupportedLanguage,
  getUiDictionary,
  type UiDictionary,
} from '@/features/i18n';

interface HybridCanvasProps {
  itinerary: EnrichedRoute;
  onSelectOption: (nodeId: string, optionId: string) => void;
  onTimeShift: (nodeId: string, newStartTime: string, newEndTime?: string) => void;
  onClose?: () => void;
  thermalState?: 'operational' | 'saturated';
  lang?: SupportedLanguage;
}

const CATEGORY_DICTIONARY_KEY: Readonly<
  Record<string, keyof UiDictionary['categories']>
> = {
  GASTRONOMY: 'GASTRONOMIC',
  CULTURE: 'CULTURAL',
  ACTIVITY: 'GENERAL',
  TRANSIT: 'LOGISTICS',
  GENERAL: 'GENERAL',
};

function localizePickpocketLevel(
  level: string,
  dict: UiDictionary,
): string {
  if (
    level === 'LOW' ||
    level === 'MEDIUM' ||
    level === 'HIGH' ||
    level === 'EXTREME'
  ) {
    return dict.pickpocket.levels[level];
  }
  return level;
}

function resolveAffiliateCta(
  provider: string | undefined,
  isPriorityAccess: boolean,
  dict: UiDictionary,
): string {
  if (isPriorityAccess) return dict.hybridCanvas.secureEntrance;
  if (provider === 'THEFORK') return dict.affiliates.theForkDefaultCta;
  if (provider === 'CABIFY') return dict.affiliates.cabifyDefaultCta;
  if (provider === 'FREENOW') return dict.affiliates.freeNowDefaultCta;
  if (provider === 'TIQETS') return dict.affiliates.tiqetsDefaultCta;
  if (provider === 'CIVITATIS') return dict.affiliates.civitatisDefaultCta;
  return dict.hybridCanvas.selectOption;
}

function HybridCanvasComponent({
  itinerary,
  onSelectOption,
  onTimeShift,
  onClose,
  thermalState,
  lang = 'es',
}: HybridCanvasProps) {
  const ui = getUiDictionary(lang);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(
    itinerary.waypoints[0]?.id ?? null,
  );

  const currentThermalState = thermalState ?? itinerary.thermalState ?? 'operational';
  const isSaturated = currentThermalState === 'saturated';

  const handleStartEditTime = (wp: EnrichedWaypoint) => {
    setEditingNodeId(wp.id);
    setNewStartTime(wp.timeSpan?.start ?? '10:00');
    setNewEndTime(wp.timeSpan?.end ?? '11:00');
  };

  const handleSaveTime = (nodeId: string) => {
    if (newStartTime) {
      onTimeShift(nodeId, newStartTime, newEndTime || undefined);
    }
    setEditingNodeId(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GASTRONOMY':
        return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'CULTURE':
        return <Landmark className="w-4 h-4 text-indigo-400" />;
      default:
        return <Compass className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'GASTRONOMY':
        return 'bg-amber-950/40 text-amber-300 border-amber-500/30';
      case 'CULTURE':
        return 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';
    }
  };

  const getPickpocketBadgeClass = (level: string) => {
    switch (level) {
      case 'EXTREME':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/60 animate-pulse';
      case 'HIGH':
        return 'bg-orange-950/70 text-orange-300 border-orange-500/60';
      case 'MEDIUM':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/50';
      default:
        return 'bg-zinc-800/60 text-zinc-300 border-zinc-700/50';
    }
  };

  return (
    <aside
      id="hybrid-orchestration-canvas"
      className="w-full lg:w-[460px] xl:w-[500px] h-full bg-zinc-900/95 border-l border-zinc-800 text-zinc-100 flex flex-col shadow-2xl backdrop-blur-md transition-all z-20"
      aria-label={ui.hybridCanvas.itineraryTitle}
      data-lang={lang}
    >
      {/* HEADER DEL LIENZO */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              {ui.hybridCanvas.itineraryTitle}
              <span className="text-[10px] font-mono uppercase bg-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/40">
                {isSaturated ? 'S+ Grade' : 'Base'}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 line-clamp-1">{itinerary.summary}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label={ui.hybridCanvas.close}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* BANNER DIDÁCTICO DE RUTA OPERATIVA SEGURA (BASE) O S+ GRADE */}
      {!isSaturated ? (
        <div
          data-testid="canvas-safety-banner"
          className="mx-4 mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 shadow-xs"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            Ruta Operativa Segura. Completa tu perfil para desbloquear alternativas gastronómicas hiperlocales y pases de acceso prioritario.
          </span>
        </div>
      ) : (
        <div
          data-testid="canvas-s-grade-banner"
          className="mx-4 mt-3 p-2.5 rounded-lg bg-emerald-900/30 border border-emerald-400/40 text-emerald-300 text-xs flex items-center gap-2 shadow-xs font-medium"
        >
          <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
          <span>Modo S+ Grade: Escudo de Supervivencia & Curaduría Hiperlocal Activos</span>
        </div>
      )}

      {/* LISTA DE NODOS / PARCELAS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {itinerary.waypoints.map((wp, index) => {
          const isExpanded = expandedNodeId === wp.id;
          const isEditingTime = editingNodeId === wp.id;
          const pickpocketLevel = wp.tacticalMetadata?.microLogistics?.pickpocketAlertLevel;
          const warnings = wp.tacticalMetadata?.antiTrapShield?.warnings ?? [];
          const alternatives = wp.tacticalMetadata?.antiTrapShield?.recommendedAlternatives ?? [];
          const transitTips = wp.tacticalMetadata?.microLogistics?.transitTips;

          return (
            <div
              key={wp.id}
              id={`node-${wp.id}`}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/70 overflow-hidden hover:border-zinc-700 transition-all shadow-xs"
            >
              {/* CABECERA DEL NODO */}
              <div className="p-3 bg-zinc-950/40 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-mono font-semibold shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-200">
                        {wp.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${getCategoryBadgeClass(
                          wp.category,
                        )}`}
                      >
                        {getCategoryIcon(wp.category)}
                        {ui.categories[
                          CATEGORY_DICTIONARY_KEY[wp.category] ?? 'GENERAL'
                        ]}
                      </span>

                      {/* INSIGNIA DE ALERTA DE CARTERISTAS */}
                      {pickpocketLevel && (
                        <span
                          data-testid={`pickpocket-badge-${wp.id}`}
                          className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-mono font-semibold ${getPickpocketBadgeClass(
                            pickpocketLevel,
                          )}`}
                          title={transitTips}
                        >
                          <ShieldAlert className="w-3 h-3" />
                          {ui.pickpocket.badgePrefix}:{' '}
                          {localizePickpocketLevel(pickpocketLevel, ui)}
                        </span>
                      )}
                    </div>

                    {/* HORARIO Y PROPAGACIÓN */}
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        {wp.timeSpan?.start ?? '10:00'}
                        {wp.timeSpan?.end ? ` - ${wp.timeSpan.end}` : ''}
                      </span>
                      <button
                        onClick={() => handleStartEditTime(wp)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-1 cursor-pointer"
                        aria-label={`Editar horario de ${wp.title}`}
                      >
                        {ui.hybridCanvas.modifyTime}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setExpandedNodeId(isExpanded ? null : wp.id)
                  }
                  className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
                  aria-label={isExpanded ? 'Colapsar opciones' : 'Expandir opciones'}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* EDITOR DE TIEMPO ATÓMICO (PROPAGACIÓN CRONOLÓGICA) */}
              {isEditingTime && (
                <div className="p-3 bg-zinc-950/80 border-t border-b border-emerald-900/40 text-xs">
                  <p className="text-zinc-300 font-medium mb-2">
                    {ui.hybridCanvas.adjustTimeNotice}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-center text-white text-xs font-mono focus:border-emerald-500 outline-hidden"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-center text-white text-xs font-mono focus:border-emerald-500 outline-hidden"
                    />
                    <button
                      onClick={() => handleSaveTime(wp.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                    >
                      {ui.hybridCanvas.save}
                    </button>
                    <button
                      onClick={() => setEditingNodeId(null)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs cursor-pointer"
                    >
                      {ui.hybridCanvas.cancel}
                    </button>
                  </div>
                </div>
              )}

              {/* ESCUDO ANTI-TRAMPAS (WARNINGS VITALES - TÁCTICA DEL REFUGIO) */}
              {warnings.length > 0 && (
                <div
                  data-testid={`anti-trap-warnings-${wp.id}`}
                  className="p-2.5 mx-3 my-2 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {warnings.map((w, wi) => (
                      <p key={wi} className="leading-snug">{w}</p>
                    ))}
                    {transitTips && (
                      <p className="text-[11px] text-amber-300/80 font-mono mt-1">
                        💡 Tip de tránsito: {transitTips}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ALTERNATIVAS LOCALES RECOMENDADAS (EXCLUSIVO MODO S+ GRADE) */}
              {isSaturated && alternatives.length > 0 && (
                <div
                  data-testid={`recommended-alternatives-${wp.id}`}
                  className="p-2.5 mx-3 mb-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs"
                >
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Alternativas Locales Recomendadas (Sin Trampas):
                  </div>
                  <ul className="space-y-1 text-zinc-300 text-xs">
                    {alternatives.map((alt, ai) => (
                      <li key={ai} className="flex items-center gap-1.5">
                        <span className="text-emerald-500">✓</span> {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* OPCIONES DEL NODO (CONSOLIDACIÓN POR SELECCIÓN & AFILIADOS) */}
              {isExpanded && wp.options.length > 0 && (
                <div className="p-3 space-y-2 border-t border-zinc-800/60 bg-zinc-900/40">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Opciones Disponibles:
                  </div>

                  {wp.options.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => onSelectOption(wp.id, opt.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        opt.isSelected
                          ? opt.isPriorityAccess
                            ? 'border-amber-500/80 bg-amber-950/20 shadow-xs'
                            : 'border-emerald-500/70 bg-emerald-950/20'
                          : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                      }`}
                    >
                      {/* BADGE DE ACCESO PRIORITARIO EN S+ GRADE */}
                      {opt.isPriorityAccess && (
                        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 w-fit">
                          <Zap className="w-3 h-3 fill-amber-400" />
                          {ui.hybridCanvas.priorityAccessNotice}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {opt.isSelected ? (
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 ${
                                  opt.isPriorityAccess ? 'text-amber-400' : 'text-emerald-400'
                                }`}
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-100">
                              {opt.title}
                            </div>
                            <div className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
                              {opt.description}
                            </div>
                          </div>
                        </div>

                        {opt.priceEstimate && (
                          <span className="text-[11px] font-mono text-zinc-300 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/50 shrink-0">
                            {opt.priceEstimate}
                          </span>
                        )}
                      </div>

                      {/* ENLACE DE AFILIACIÓN (THEFORK / CIVITATIS / DROPS CPA) */}
                      {opt.affiliateUrl && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Verificado vía{' '}
                            <span className="text-zinc-200 font-semibold">
                              {opt.provider === 'THEFORK'
                                ? 'TheFork'
                                : opt.provider === 'CIVITATIS'
                                ? 'Civitatis'
                                : 'Proveedor'}
                            </span>
                          </span>
                          <a
                            href={opt.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              opt.isPriorityAccess
                                ? 'text-amber-300 hover:text-amber-200 bg-amber-950/70 px-2.5 py-1 rounded border border-amber-500/50 shadow-xs'
                                : 'text-emerald-400 hover:text-emerald-300'
                            }`}
                          >
                            <span>
                              {resolveAffiliateCta(
                                opt.provider,
                                Boolean(opt.isPriorityAccess),
                                ui,
                              )}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </aside>
  );
}

export const HybridCanvas = memo(HybridCanvasComponent);
