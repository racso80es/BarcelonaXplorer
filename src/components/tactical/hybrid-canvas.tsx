'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { EnrichedRoute, EnrichedWaypoint } from '@/features/planner';

interface HybridCanvasProps {
  itinerary: EnrichedRoute;
  onSelectOption: (nodeId: string, optionId: string) => void;
  onTimeShift: (nodeId: string, newStartTime: string, newEndTime?: string) => void;
  onClose?: () => void;
}

export function HybridCanvas({
  itinerary,
  onSelectOption,
  onTimeShift,
  onClose,
}: HybridCanvasProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(
    itinerary.waypoints[0]?.id ?? null,
  );

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

  return (
    <aside
      id="hybrid-orchestration-canvas"
      className="w-full lg:w-[460px] xl:w-[500px] h-full bg-zinc-900/95 border-l border-zinc-800 text-zinc-100 flex flex-col shadow-2xl backdrop-blur-md transition-all z-20"
      aria-label="Lienzo de Orquestación Híbrida"
    >
      {/* HEADER DEL LIENZO */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Lienzo de Orquestación Híbrida
              <span className="text-[10px] font-mono uppercase bg-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/40">
                S+ Grade
              </span>
            </h2>
            <p className="text-xs text-zinc-400 line-clamp-1">{itinerary.summary}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar lienzo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* LISTA DE NODOS / PARCELAS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {itinerary.waypoints.map((wp, index) => {
          const isExpanded = expandedNodeId === wp.id;
          const isEditingTime = editingNodeId === wp.id;

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
                        {wp.category}
                      </span>
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
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-1"
                        aria-label={`Editar horario de ${wp.title}`}
                      >
                        Modificar
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setExpandedNodeId(isExpanded ? null : wp.id)
                  }
                  className="p-1 rounded text-zinc-400 hover:text-white"
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
                    Ajustar hora (se recalcularán los eventos posteriores):
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
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={() => setEditingNodeId(null)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
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
                          ? 'border-emerald-500/70 bg-emerald-950/20'
                          : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {opt.isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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

                      {/* ENLACE DE AFILIACIÓN (THEFORK / CIVITATIS) */}
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
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            <span>Reservar</span>
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
