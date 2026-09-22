"use client";

import React, { useState, useEffect, useRef } from 'react';
import { OrchestratorBlock } from '@/components/OrchestratorBlock';
import { TacticalSpark, TacticalSparkProps } from '@/components/TacticalSpark';
import { CloudRain, ShieldAlert, Navigation, Send } from 'lucide-react';

import { TacticalRoute } from '@/domain/entities/tactical-route.entity';

type Turn = {
  id: string;
  userPrompt: string;
  sparks: Omit<TacticalSparkProps, 'icon'>[];
  status: 'pending' | 'orchestrating' | 'completed';
  aiResponse?: TacticalRoute | string; // Permitimos string para errores
};

export default function OrchestratorPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
        // 1. Streaming Vía Rápida (NDJSON - FastInsight Domain DTO)
        const fastRes = await fetch('/api/orchestrator/fast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userPrompt }),
        });

        if (fastRes.body) {
          const reader = fastRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // El último fragmento puede estar incompleto

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const fastInsight = JSON.parse(line);
                
                // Mapeo de Frontera: Capa Dominio (FastInsight) -> Capa Presentación (TacticalSparkProps)
                const mappedType = fastInsight.category === 'environmental' ? 'weather' : 
                                   fastInsight.category === 'security' ? 'security' : 'logistics';
                
                const mappedUrgency = fastInsight.severityLevel === 3 ? 'high' : 
                                      fastInsight.severityLevel === 2 ? 'medium' : 'low';

                const newSpark: Omit<TacticalSparkProps, 'icon'> = {
                  id: `${turnId}-ts-${Date.now()}-${Math.random()}`,
                  type: mappedType,
                  insight: fastInsight.observation || 'Insight decodificado',
                  urgency: mappedUrgency
                };
                
                if (isSubscribed) {
                  setTurns(prev => prev.map(t => t.id === turnId ? { ...t, sparks: [...t.sparks, newSpark] } : t));
                }
              } catch (e) {
                console.warn('Error parsing JSON line:', line);
              }
            }
          }
        }

        // 2. Resolución Vía Lenta (TacticalRoute Domain Entity)
        const slowRes = await fetch('/api/orchestrator/slow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            context: {
              localTime: new Date().toISOString(),
            },
          }),
        });

        const slowData = await slowRes.json();
        
        if (isSubscribed) {
          setTurns(prev => prev.map(t => t.id === turnId ? { 
            ...t, 
            status: 'completed',
            aiResponse: slowData.response
          } : t));
        }

      } catch (error) {
        console.error('Orchestration Error:', error);
        if (isSubscribed) {
          setTurns(prev => prev.map(t => t.id === turnId ? { 
            ...t, 
            status: 'completed',
            aiResponse: 'Error de comunicación táctica. Proceda con precaución manual.'
          } : t));
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
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      
      {/* ZONA DE CONVERSACIÓN (Scroll iterativo) */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-y-16">
          
          {turns.length === 0 && (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh] text-zinc-500 opacity-50 font-mono text-sm">
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
                <div className="w-full max-w-3xl flex flex-col mt-2">
                  {turn.sparks.map(spark => (
                    <TacticalSpark
                      key={spark.id} // Garantizado único (idTurno + idChispa)
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
                 <div className="w-full mt-8">
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
                 <div className="w-full mt-8">
                   <OrchestratorBlock
                     role="ai"
                     status="completed"
                     content={
                       typeof turn.aiResponse === 'string' ? (
                         <div className="text-red-400">{turn.aiResponse}</div>
                       ) : turn.aiResponse ? (
                         <div className="flex flex-col gap-4">
                           <div className="border-b border-zinc-800 pb-2">
                             <h3 className="text-lg font-semibold text-emerald-400 mb-1">{(turn.aiResponse as TacticalRoute).summary}</h3>
                           </div>
                           <div className="flex flex-col gap-3">
                             {(turn.aiResponse as TacticalRoute).waypoints.map((wp, idx) => (
                               <div key={wp.id} className="flex gap-4 p-3 bg-zinc-900/50 rounded border border-zinc-800">
                                 <div className="flex flex-col items-center justify-start mt-1">
                                   <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-xs font-mono text-emerald-400">
                                     {idx + 1}
                                   </div>
                                   {idx < (turn.aiResponse as TacticalRoute).waypoints.length - 1 && (
                                     <div className="w-[1px] h-full min-h-[20px] bg-zinc-800 mt-2" />
                                   )}
                                 </div>
                                 <div className="flex-1 pb-1">
                                   <div className="flex items-center gap-2 mb-1">
                                     <span className="font-semibold text-zinc-200">{wp.title}</span>
                                     {wp.timeSpan && (
                                       <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                                         {wp.timeSpan.start} {wp.timeSpan.end ? `- ${wp.timeSpan.end}` : ''}
                                       </span>
                                     )}
                                   </div>
                                   <p className="text-sm text-zinc-400 leading-relaxed">{wp.description}</p>
                                   
                                   {wp.recommendations && wp.recommendations.length > 0 && (
                                     <ul className="mt-2 text-xs text-zinc-500 space-y-1">
                                       {wp.recommendations.map((rec, i) => (
                                         <li key={i} className="flex items-start gap-1">
                                           <span className="text-emerald-500/70 mt-[1px]">›</span> {rec}
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
                 </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ZONA DE INPUT (Sticky Bottom) */}
      <div className="sticky bottom-0 w-full p-4 md:p-6 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-md py-4 pl-4 pr-16 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner disabled:opacity-50"
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
              className="absolute right-3 p-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
