"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Send, ExternalLink, Loader2, Sparkles } from 'lucide-react';

interface TelegramAnchorDropProps {
  className?: string;
}

export function TelegramAnchorDrop({ className = '' }: TelegramAnchorDropProps) {
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function fetchDeepLink() {
      try {
        const res = await fetch('/api/telegram/anchor-link');
        if (!res.ok) {
          throw new Error('No se pudo forjar el enlace de anclaje.');
        }
        const data = await res.json();
        if (isSubscribed && data.deepLink) {
          setDeepLink(data.deepLink);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : 'Error inesperado');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchDeepLink();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div
      className={`w-full max-w-3xl mt-6 p-4 sm:p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-surface-container to-emerald-900/20 backdrop-blur-md shadow-lg shadow-emerald-950/20 transition-all hover:border-emerald-500/50 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                Anclaje Táctico & Alertas Telegram
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h4>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Fricción Cero
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed max-w-xl">
              Salva tu itinerario contra pérdidas de batería o borrado de cookies.
              Recibe alertas tácticas en tiempo real y traslada tu sesión a un PC/Tablet con un solo toque.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
          {loading ? (
            <button
              disabled
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs sm:text-sm font-medium cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Forjando Deep Link...</span>
            </button>
          ) : error || !deepLink ? (
            <span className="text-xs text-zinc-400 italic">Anclaje activo por defecto</span>
          ) : (
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/40"
            >
              <Send className="w-4 h-4 text-emerald-100" />
              <span>Asegurar Ruta en Telegram</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
