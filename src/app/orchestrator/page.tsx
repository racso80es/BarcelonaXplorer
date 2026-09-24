"use client";

import React, { useState, useEffect, useRef } from 'react';
import { OrchestratorBlock } from '@/components/OrchestratorBlock';
import { TacticalSpark, TacticalSparkProps } from '@/components/TacticalSpark';
import { TelegramAnchorDrop } from '@/components/tactical/telegram-anchor-drop';
import { CloudRain, ShieldAlert, Navigation, Send, AlertTriangle, CheckCircle2, X } from 'lucide-react';

import { TacticalRoute } from '@/domain/entities/tactical-route.entity';

type Turn = {
  id: string;
  userPrompt: string;
  sparks: Omit<TacticalSparkProps, 'icon'>[];
  status: 'pending' | 'orchestrating' | 'completed';
  aiResponse?: TacticalRoute | string;
};

export default function OrchestratorPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session_restored') === 'true') {
        setNotification({
          type: 'success',
          message: '🛡️ ¡Sesión restaurada con éxito desde Telegram! Tu itinerario ha sido recuperado.',
        });
      } else if (params.get('auth_error')) {
        setNotification({
          type: 'error',
          message: '⚠️ El enlace de acceso no es válido o ha expirado. Solicita uno nuevo en Telegram.',
        });
      }
    }
  }, []);

  // Derivamos si la UI está bloqueada en base al último turno
  const currentTurn = turns[turns.length - 1];
  const isLocked = currentTurn ? (currentTurn.status === 'pending' || currentTurn.status === 'orchestrating') : false;

  // Auto-scroll al final del contenedor cuando cambian los turnos o sus componentes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [turns]);

  // Manejo del Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLocked) return;

    const newTurnId = `turn-${Date.now()}`;
    const newTurn: Turn = {
      id: newTurnId,
      userPrompt: inputValue,
      sparks: [],
      status: 'pending' // Equivalente a Fase 1
    };

    setTurns(prev => [...prev, newTurn]);
    setInputValue('');

    // Transición a Asimilación (Fase 2) tras un breve delay
    setTimeout(() => {
      setTurns(prev => prev.map(t => t.id === newTurnId ? { ...t, status: 'orchestrating' } : t));
    }, 400);
  };

  // Efecto de Orquestación (Vía Rápida y Lenta)
  useEffect(() => {
    let isSubscribed = true;

    const runOrchestration = async () => {
      if (!currentTurn || currentTurn.status !== 'orchestrating') return;
      const turnId = currentTurn.id;
      const userPrompt = currentTurn.userPrompt;

      try {
        // Laudo 1: Endpoint Único /api/triage (Aduana Universal + Despacho Interno)
        const triageRes = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userPrompt }),
        });

        const triageData = await triageRes.json().catch(() => ({}));

        // Chispa táctica de diagnóstico de aduana
        const triageSpark: Omit<TacticalSparkProps, 'icon'> = {
          id: `${turnId}-ts-${Date.now()}`,
          type: triageData.status === 'DISPATCH_READY' ? 'logistics' : 'weather',
          insight:
            triageData.status === 'DISPATCH_READY'
              ? 'Matriz saturada (>= 60%). Itinerario forjado internamente.'
              : triageData.status === 'INCOMPLETE_REPROMPT'
                ? `Matriz incompleta (${triageData.score}%). Variable crítica: ${triageData.missingVariable}`
                : 'Petición fuera de perímetro geográfico.',
          urgency: triageData.status === 'REBOUND_OUT_OF_SCOPE' ? 'high' : 'medium',
        };

        if (isSubscribed) {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId ? { ...t, sparks: [...t.sparks, triageSpark] } : t,
            ),
          );
        }

        // Manejo determinista de estados
        if (triageRes.status === 422 || triageData.status === 'REBOUND_OUT_OF_SCOPE') {
          const bounceMsg =
            triageData.bounceMessage ||
            triageData.error ||
            'Destino fuera del perímetro de Barcelona.';
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      aiResponse: bounceMsg,
                    }
                  : t,
              ),
            );
          }
          return;
        }

        if (triageData.status === 'INCOMPLETE_REPROMPT') {
          const repromptMsg =
            triageData.repromptMessage ||
            '¿Podrías especificar los horarios o tiempo disponible?';
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      aiResponse: repromptMsg,
                    }
                  : t,
              ),
            );
          }
          return;
        }

        // DISPATCH_READY: Ruta táctica completa
        const routeData =
          triageData.route ||
          triageData.payload ||
          'Ruta táctica forjada con éxito.';

        if (isSubscribed) {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId
                ? {
                    ...t,
                    status: 'completed',
                    aiResponse: routeData,
                  }
                : t,
            ),
          );
        }
      } catch (error) {
        console.error('Orchestration Error:', error);
        if (isSubscribed) {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId
                ? {
                    ...t,
                    status: 'completed',
                    aiResponse:
                      'Error de comunicación táctica. Proceda con precaución manual.',
                  }
                : t,
            ),
          );
        }
      }
    };

    runOrchestration();

    return () => {
      isSubscribed = false;
    };
  }, [currentTurn?.status, currentTurn?.id, currentTurn?.userPrompt]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'weather': return CloudRain;
      case 'security': return ShieldAlert;
      case 'logistics': return Navigation;
      default: return Navigation;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface-canvas text-content-primary">
      
      {/* ZONA DE CONVERSACIÓN (Scroll iterativo) */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 pb-32 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-y-12 sm:gap-y-16">
          
          {notification && (
            <div
              className={`w-full p-4 rounded-xl border flex items-center justify-between gap-3 text-sm shadow-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {turns.length === 0 && (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh] text-zinc-400 font-mono text-xs sm:text-sm">
              [ SISTEMA EN ESPERA DE INPUT TÁCTICO ]
            </div>
          )}

          {turns.map((turn) => (
            <div key={turn.id} className="w-full flex flex-col items-center relative">
              {/* Bloque de Usuario (Fase 1+) */}
              <OrchestratorBlock
                role="user"
                content={turn.userPrompt}
                timestamp={new Date()}
              />

              {/* Chispas de este turno (Fase 2+) */}
              {turn.sparks.length > 0 && (
                <div className="w-full max-w-3xl flex flex-col mt-1 sm:mt-2">
                  {turn.sparks.map(spark => (
                    <TacticalSpark
                      key={spark.id}
                      id={spark.id}
                      type={spark.type as any}
                      insight={spark.insight}
                      urgency={spark.urgency}
                      icon={getIconForType(spark.type)}
                    />
                  ))}
                </div>
              )}

              {/* IA Procesando (Fase 2) */}
              {turn.status === 'orchestrating' && (
                 <div className="w-full mt-6 sm:mt-8">
                   <OrchestratorBlock
                     role="ai"
                     status="orchestrating"
                     content="Asimilando entropía y trazando ruta..."
                     timestamp={new Date()}
                   />
                 </div>
              )}

              {/* Resolución Final (Fase 3) */}
              {turn.status === 'completed' && (
                 <div className="w-full mt-6 sm:mt-8">
                   <OrchestratorBlock
                     role="ai"
                     status="completed"
                     content={
                       typeof turn.aiResponse === 'string' ? (
                         <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 font-medium text-sm flex items-start gap-2 shadow-xs">
                           <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                           <span className="leading-relaxed">{turn.aiResponse}</span>
                         </div>
                       ) : turn.aiResponse ? (
                         <div className="flex flex-col gap-4">
                           <div className="border-b border-emerald-200/80 pb-2">
                             <h3 className="text-lg font-bold text-content-accent mb-1">{(turn.aiResponse as TacticalRoute).summary}</h3>
                           </div>
                           <div className="flex flex-col gap-3">
                             {(turn.aiResponse as TacticalRoute).waypoints.map((wp, idx) => (
                               <div key={wp.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-surface-container rounded-lg border border-emerald-100 shadow-xs">
                                 <div className="flex flex-col items-center justify-start mt-0.5">
                                   <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs font-mono font-bold text-emerald-800 shrink-0">
                                     {idx + 1}
                                   </div>
                                   {idx < (turn.aiResponse as TacticalRoute).waypoints.length - 1 && (
                                     <div className="w-[1px] h-full min-h-[20px] bg-emerald-200 mt-2" />
                                   )}
                                 </div>
                                 <div className="flex-1 pb-1">
                                   <div className="flex flex-wrap items-center gap-2 mb-1">
                                     <span className="font-semibold text-content-primary">{wp.title}</span>
                                     {wp.timeSpan && (
                                       <span className="text-xs font-mono text-zinc-600 bg-surface-subtle px-2 py-0.5 rounded border border-layout-divider">
                                         {wp.timeSpan.start} {wp.timeSpan.end ? `- ${wp.timeSpan.end}` : ''}
                                       </span>
                                     )}
                                   </div>
                                   <p className="text-sm text-content-secondary leading-relaxed">{wp.description}</p>
                                   
                                   {wp.recommendations && wp.recommendations.length > 0 && (
                                     <ul className="mt-2 text-xs text-zinc-600 space-y-1">
                                       {wp.recommendations.map((rec, i) => (
                                         <li key={i} className="flex items-start gap-1">
                                           <span className="text-emerald-600 mt-[1px]">›</span> {rec}
                                         </li>
                                       ))}
                                     </ul>
                                   )}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       ) : (
                         <div className="text-zinc-500 italic">No se pudo forjar la ruta.</div>
                       )
                     }
                     timestamp={new Date()}
                   />

                   {/* Drop de Anclaje Táctico y Alertas en Telegram tras completar ruta */}
                   {typeof turn.aiResponse !== 'string' && turn.aiResponse && (
                     <TelegramAnchorDrop />
                   )}
                 </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ZONA DE INPUT (Sticky Bottom) */}
      <div className="sticky bottom-0 w-full p-3 sm:p-6 bg-surface-container/90 backdrop-blur-md border-t border-layout-divider shadow-sm">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <textarea
              className="w-full bg-white border border-layout-divider-strong text-content-primary placeholder:text-zinc-400 rounded-lg py-3 pl-4 pr-14 resize-none focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-focus-tactical transition-all shadow-xs disabled:opacity-50 text-sm sm:text-base leading-normal"
              rows={2}
              placeholder="¿Qué experiencia táctica deseas orquestar en Barcelona?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLocked}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLocked}
              className="absolute right-2.5 sm:right-3 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
