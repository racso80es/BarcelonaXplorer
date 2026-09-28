"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { OrchestratorBlock } from '@/components/OrchestratorBlock';
import { TacticalSpark, TacticalSparkProps } from '@/components/TacticalSpark';
import { TelegramAnchorDrop } from '@/components/tactical/telegram-anchor-drop';
import { HybridCanvas } from '@/components/tactical/hybrid-canvas';
import { CloudRain, ShieldAlert, Navigation, Send, AlertTriangle, CheckCircle2, X, Compass } from 'lucide-react';

import {
  EnrichedRoute,
  ChronologicalPropagator,
  TacticalRouteZodSchema,
} from '@/features/planner';
import { TriageOutcomeSchema } from '@/features/triage/triage.schema';
import type { z } from 'zod';
import { ThermalMeter } from '@/features/triage/components/thermal-meter';
import {
  SupportedLanguage,
  SupportedLanguageVo,
  getUiDictionary,
} from '@/features/i18n';

type TacticalRoutePayload = z.infer<typeof TacticalRouteZodSchema>;

type TurnAiResponse =
  | { kind: 'message'; text: string }
  | { kind: 'route'; route: TacticalRoutePayload };

type Turn = {
  id: string;
  userPrompt: string;
  sparks: Omit<TacticalSparkProps, 'icon'>[];
  status: 'pending' | 'orchestrating' | 'completed';
  aiResponse?: TurnAiResponse;
  createdAt: Date;
  orchestratingAt?: Date;
  completedAt?: Date;
};

export default function OrchestratorPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [activeItinerary, setActiveItinerary] = useState<EnrichedRoute | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [ignitionState, setIgnitionState] = useState<{
    greeting: string;
    sparks: Omit<TacticalSparkProps, 'icon'>[];
    status: 'idle' | 'igniting' | 'ignited';
  }>({
    greeting: '',
    sparks: [],
    status: 'idle',
  });
  const [thermalState, setThermalState] = useState<{
    score: number;
    survivalThreshold: number;
    isThresholdSatisfied: boolean;
    missingVariable?: string | null;
    matrixId: string;
  }>({
    score: 0,
    survivalThreshold: 60,
    isThresholdSatisfied: false,
    missingVariable: null,
    matrixId: 'default',
  });
  const [sysLang, setSysLang] = useState<SupportedLanguage>('es');
  const [ignitionGreetingAt, setIgnitionGreetingAt] = useState<Date | null>(null);
  const ui = getUiDictionary(sysLang);
  const scrollRef = useRef<HTMLDivElement>(null);
  const promptFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const restored = params.get('session_restored') === 'true';
    const authError = params.get('auth_error');
    if (!restored && !authError) {
      return;
    }
    queueMicrotask(() => {
      if (restored) {
        setNotification({
          type: 'success',
          message:
            '🛡️ ¡Sesión restaurada con éxito desde Telegram! Tu itinerario ha sido recuperado.',
        });
      } else {
        setNotification({
          type: 'error',
          message:
            '⚠️ El enlace de acceso no es válido o ha expirado. Solicita uno nuevo en Telegram.',
        });
      }
    });
  }, []);

  // Ignición Contextual proactiva al montar la página (PBI-TRIAGE-IGN-003)
  useEffect(() => {
    let isSubscribed = true;
    const triggerIgnition = async () => {
      try {
        setIgnitionState((prev) => ({ ...prev, status: 'igniting' }));
        const res = await fetch('/api/triage/ignition');
        if (!res.ok) return;
        const envelope = await res.json().catch(() => ({}));
        if (isSubscribed && envelope?.success && envelope?.result) {
          const outcome = envelope.result;
          if (typeof outcome._sys_lang === 'string') {
            setSysLang(SupportedLanguageVo.from(outcome._sys_lang).value);
          }
          setIgnitionGreetingAt(new Date());
          setIgnitionState({
            greeting: outcome.greeting,
            sparks: (outcome.sparks || []).map(
              (s: {
                id: string;
                type: 'weather' | 'logistics' | 'system';
                insight: string;
                urgency?: 'low' | 'medium' | 'high';
              }) => ({
                id: s.id,
                type: s.type,
                insight: s.insight,
                urgency: s.urgency || 'medium',
              }),
            ),
            status: 'ignited',
          });
        }
      } catch {
        // Fail-soft: no rompe la interfaz si hay problemas de red
      }
    };

    void triggerIgnition();

    return () => {
      isSubscribed = false;
    };
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

  const dispatchPromptFromForm = useCallback((form: HTMLFormElement) => {
    const promptField = form.elements.namedItem('prompt');
    const formPrompt =
      promptField instanceof HTMLTextAreaElement
        ? promptField.value.trim()
        : '';
    if (!formPrompt) return;

    const newTurnId = `turn-${Date.now()}`;
    const createdAt = new Date();
    const newTurn: Turn = {
      id: newTurnId,
      userPrompt: formPrompt,
      sparks: [],
      status: 'pending',
      createdAt,
    };

    setTurns((prev) => [...prev, newTurn]);
    form.reset();

    setTimeout(() => {
      const orchestratingAt = new Date();
      setTurns((prev) =>
        prev.map((t) =>
          t.id === newTurnId
            ? { ...t, status: 'orchestrating', orchestratingAt }
            : t,
        ),
      );
    }, 400);
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_E2E_DISPATCH_HOOK !== '1') {
      return;
    }
    const win = window as Window & { __bxDispatchPrompt?: () => void };
    win.__bxDispatchPrompt = () => {
      if (promptFormRef.current) {
        dispatchPromptFromForm(promptFormRef.current);
      }
    };
    return () => {
      delete win.__bxDispatchPrompt;
    };
  }, [dispatchPromptFromForm]);

  // Manejo del Submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatchPromptFromForm(e.currentTarget);
  };

  // Efecto de Orquestación (Vía Rápida y Lenta)
  useEffect(() => {
    let isSubscribed = true;
    const abortController = new AbortController();

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
          signal: abortController.signal,
        });

        const rawOutcome = await triageRes.json().catch(() => ({}));
        const parsedOutcome = TriageOutcomeSchema.safeParse(rawOutcome);

        if (!parsedOutcome.success) {
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      completedAt: new Date(),
                      aiResponse: {
                        kind: 'message',
                        text:
                          ui.orchestrator.invalidTriageResponse,
                      },
                    }
                  : t,
              ),
            );
          }
          return;
        }

        const triageData = parsedOutcome.data;

        if (isSubscribed) {
          setSysLang(SupportedLanguageVo.from(triageData._sys_lang).value);
        }

        // Sincronización Termodinámica con el Medidor de Densidad (PBI-TRIAGE-THM-002)
        if (isSubscribed) {
          setThermalState({
            score: triageData.score,
            survivalThreshold: triageData.survivalThreshold,
            isThresholdSatisfied: triageData.isThresholdSatisfied,
            missingVariable: triageData.missingVariable ?? null,
            matrixId: triageData.matrixId,
          });
        }

        // Chispa táctica de diagnóstico de aduana
        const triageSpark: Omit<TacticalSparkProps, 'icon'> = {
          id: `${turnId}-ts-${Date.now()}`,
          type: triageData.status === 'DISPATCH_READY' ? 'logistics' : 'weather',
          insight:
            triageData.status === 'DISPATCH_READY'
              ? ui.orchestrator.sparkMatrixSaturated
              : triageData.status === 'CASUAL_DIALOGUE'
                ? ui.orchestrator.sparkCasualDialogue
                : triageData.status === 'INCOMPLETE_REPROMPT'
                  ? `${ui.orchestrator.sparkIncompleteMatrixPrefix} (${triageData.score}%). ${ui.orchestrator.sparkCriticalVariablePrefix}: ${triageData.missingVariable}`
                  : ui.orchestrator.sparkOutOfScope,
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
            ui.orchestrator.defaultBounceMessage;
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      completedAt: new Date(),
                      aiResponse: { kind: 'message', text: bounceMsg },
                    }
                  : t,
              ),
            );
          }
          return;
        }

        if (triageData.status === 'CASUAL_DIALOGUE') {
          const dialogueMsg =
            triageData.dialogueMessage ||
            ui.orchestrator.defaultDialogueMessage;
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      completedAt: new Date(),
                      aiResponse: { kind: 'message', text: dialogueMsg },
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
            ui.orchestrator.defaultRepromptMessage;
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      completedAt: new Date(),
                      aiResponse: { kind: 'message', text: repromptMsg },
                    }
                  : t,
              ),
            );
          }
          return;
        }

        if (triageData.status === 'DISPATCH_CLAUDICATION') {
          const claudicationMsg =
            triageData.claudicationMessage ||
            ui.orchestrator.defaultClaudicationMessage;
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      completedAt: new Date(),
                      aiResponse: { kind: 'message', text: claudicationMsg },
                    }
                  : t,
              ),
            );
          }
          return;
        }

        if (triageData.itinerary) {
          setActiveItinerary(triageData.itinerary);
        }

        if (triageData.status === 'DISPATCH_READY' && triageData.itinerary) {
          const summary =
            triageData.itinerary.summary || ui.orchestrator.routeForgedSuccess;
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      completedAt: new Date(),
                      aiResponse: { kind: 'message', text: summary },
                    }
                  : t,
              ),
            );
          }
          return;
        }

        if (
          triageData.status === 'DISPATCH_READY' &&
          triageData.route &&
          !triageData.itinerary
        ) {
          const routePayload = triageData.route;
          if (isSubscribed) {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      status: 'completed',
                      completedAt: new Date(),
                      aiResponse: { kind: 'route', route: routePayload },
                    }
                  : t,
              ),
            );
          }
          return;
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('Orchestration Error:', error);
        if (isSubscribed) {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId
                ? {
                    ...t,
                    status: 'completed',
                    completedAt: new Date(),
                    aiResponse: {
                      kind: 'message',
                      text:
                        ui.orchestrator.communicationError,
                    },
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
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id/status bastan; el objeto aborta el fetch al mutar sparks
  }, [currentTurn?.id, currentTurn?.status]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'weather': return CloudRain;
      case 'security': return ShieldAlert;
      case 'logistics': return Navigation;
      default: return Navigation;
    }
  };

  const handleSelectOption = useCallback((nodeId: string, optionId: string) => {
    setActiveItinerary((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        waypoints: prev.waypoints.map((wp) => {
          if (wp.id !== nodeId) return wp;
          return {
            ...wp,
            options: wp.options.map((opt) => ({
              ...opt,
              isSelected: opt.id === optionId,
            })),
          };
        }),
      };
    });
  }, []);

  const handleTimeShift = useCallback(
    (nodeId: string, newStartTime: string, newEndTime?: string) => {
      let notificationPayload: {
        type: 'success' | 'error';
        message: string;
      } | null = null;

      flushSync(() => {
        setActiveItinerary((prev) => {
          if (!prev) {
            return null;
          }
          try {
            const recalculated = ChronologicalPropagator.propagate(
              prev.waypoints,
              nodeId,
              newStartTime,
              newEndTime,
            );
            notificationPayload = {
              type: 'success',
              message:
                ui.orchestrator.timeUpdatedNotice,
            };
            return {
              ...prev,
              waypoints: recalculated,
            };
          } catch (err) {
            notificationPayload = {
              type: 'error',
              message:
                err instanceof Error
                  ? err.message
                  : ui.orchestrator.timeUpdateError,
            };
            return prev;
          }
        });
      });

      if (notificationPayload) {
        setNotification(notificationPayload);
      }
    },
    [ui.orchestrator.timeUpdateError, ui.orchestrator.timeUpdatedNotice],
  );

  const handleCloseItinerary = useCallback(() => {
    setActiveItinerary(null);
  }, []);

  const canvasThermalState =
    thermalState.score >= 100 ? 'saturated' : 'operational';

  const handleForceDispatch = () => {
    if (!thermalState.isThresholdSatisfied || isLocked) return;
    const newTurnId = `turn-${Date.now()}`;
    const createdAt = new Date();
    const newTurn: Turn = {
      id: newTurnId,
      userPrompt: ui.orchestrator.defaultForceDispatchPrompt,
      sparks: [],
      status: 'pending',
      createdAt,
    };
    setTurns((prev) => [...prev, newTurn]);
    setTimeout(() => {
      const orchestratingAt = new Date();
      setTurns((prev) =>
        prev.map((t) =>
          t.id === newTurnId
            ? { ...t, status: 'orchestrating', orchestratingAt }
            : t,
        ),
      );
    }, 400);
  };

  return (

    <div
      className="flex flex-col lg:flex-row h-screen bg-surface-canvas text-content-primary overflow-hidden"
      data-sys-lang={sysLang}
    >
      
      {/* ZONA DE CONVERSACIÓN (Scroll iterativo) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
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
                aria-label={ui.orchestrator.closeNotification}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {turns.length === 0 && ignitionState.status === 'ignited' && (
            <div className="w-full flex flex-col items-center relative animate-fade-in my-auto py-8">
              {ignitionState.sparks.length > 0 && (
                <div className="w-full max-w-3xl flex flex-col mb-4">
                  {ignitionState.sparks.map((spark) => (
                    <TacticalSpark
                      key={spark.id}
                      id={spark.id}
                      type={spark.type}
                      insight={spark.insight}
                      urgency={spark.urgency}
                      icon={getIconForType(spark.type)}
                    />
                  ))}
                </div>
              )}
              <div className="w-full max-w-3xl">
                <OrchestratorBlock
                  role="ai"
                  status="completed"
                  content={
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-950 font-sans text-base leading-relaxed shadow-xs flex items-start gap-3">
                      <Compass className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{ignitionState.greeting}</span>
                    </div>
                  }
                  timestamp={ignitionGreetingAt ?? new Date(0)}
                />
              </div>
            </div>
          )}

          {turns.length === 0 && ignitionState.status !== 'ignited' && (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh] text-zinc-400 font-mono text-xs sm:text-sm">
              {ui.orchestrator.awaitingInput}
            </div>
          )}

          {turns.map((turn) => (
            <div key={turn.id} className="w-full flex flex-col items-center relative">
              {/* Bloque de Usuario (Fase 1+) */}
              <OrchestratorBlock
                role="user"
                content={turn.userPrompt}
                timestamp={turn.createdAt}
              />

              {/* Chispas de este turno (Fase 2+) */}
              {turn.sparks.length > 0 && (
                <div className="w-full max-w-3xl flex flex-col mt-1 sm:mt-2">
                  {turn.sparks.map(spark => (
                    <TacticalSpark
                      key={spark.id}
                      id={spark.id}
                      type={spark.type}
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
                     content={ui.orchestrator.orchestratingStatus}
                     timestamp={turn.orchestratingAt ?? turn.createdAt}
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
                       turn.aiResponse?.kind === 'message' ? (
                         <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 font-medium text-sm flex items-start gap-2 shadow-xs">
                           <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                           <span className="leading-relaxed">{turn.aiResponse.text}</span>
                         </div>
                       ) : turn.aiResponse?.kind === 'route' ? (
                         (() => {
                           const routeView = turn.aiResponse.route;
                           return (
                         <div className="flex flex-col gap-4">
                           <div className="border-b border-emerald-200/80 pb-2">
                             <h3 className="text-lg font-bold text-content-accent mb-1">{routeView.summary}</h3>
                           </div>
                           <div className="flex flex-col gap-3">
                             {routeView.waypoints.map((wp, idx) => (
                               <div key={wp.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-surface-container rounded-lg border border-emerald-100 shadow-xs">
                                 <div className="flex flex-col items-center justify-start mt-0.5">
                                   <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs font-mono font-bold text-emerald-800 shrink-0">
                                     {idx + 1}
                                   </div>
                                   {idx < routeView.waypoints.length - 1 && (
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
                           );
                         })()
                       ) : (
                         <div className="text-zinc-500 italic">{ui.orchestrator.cannotForgeRoute}</div>
                       )
                     }
                     timestamp={turn.completedAt ?? turn.orchestratingAt ?? turn.createdAt}
                   />

                   {/* Drop de Anclaje Táctico y Alertas en Telegram tras completar ruta */}
                   {turn.aiResponse?.kind === 'route' && (
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
        <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
          <ThermalMeter
            score={thermalState.score}
            survivalThreshold={thermalState.survivalThreshold}
            isThresholdSatisfied={thermalState.isThresholdSatisfied}
            missingVariable={thermalState.missingVariable}
            matrixId={thermalState.matrixId}
            lang={sysLang}
            onForceDispatch={thermalState.isThresholdSatisfied ? handleForceDispatch : undefined}
            isDispatching={isLocked}
          />
          <form
            ref={promptFormRef}
            onSubmit={handleSubmit}
            className="relative flex items-center"
          >
            <textarea
              name="prompt"
              data-testid="orchestrator-prompt"
              className="w-full bg-white border border-layout-divider-strong text-content-primary placeholder:text-zinc-400 rounded-lg py-3 pl-4 pr-14 resize-none focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-focus-tactical transition-all shadow-xs disabled:opacity-50 text-sm sm:text-base leading-normal"
              rows={2}
              placeholder={ui.chat.inputPlaceholder}
              defaultValue=""
              disabled={isLocked}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (promptFormRef.current) {
                    dispatchPromptFromForm(promptFormRef.current);
                  }
                }
              }}
            />
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                if (promptFormRef.current) {
                  dispatchPromptFromForm(promptFormRef.current);
                }
              }}
              className="absolute right-2.5 sm:right-3 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              aria-label={ui.chat.sendButton}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

    </div>

    {/* LIENZO DE ORQUESTACIÓN HÍBRIDA LATERAL */}
    {activeItinerary && (
      <HybridCanvas
        itinerary={activeItinerary}
        onSelectOption={handleSelectOption}
        onTimeShift={handleTimeShift}
        onClose={handleCloseItinerary}
        thermalState={canvasThermalState}
        lang={sysLang}
      />
    )}


  </div>
  );
}
