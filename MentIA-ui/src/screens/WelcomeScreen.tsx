/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { BrandLogo } from "../components/BrandLogo";

export const WelcomeScreen: React.FC = () => {
  const { setCurrentTab, setHasSeenOnboarding } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleStart = () => setCurrentTab("registro");
  const handleLogin = () => setCurrentTab("ingreso");

  return (
    <div className="flex flex-col w-full min-h-screen px-5 pb-10 pt-6 select-none bg-slate-50 dark:bg-[#0f131c] text-slate-800 dark:text-[#dfe2ee] transition-colors relative overflow-hidden">
      {/* Dynamic Ambient Glow & Sparks */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan-400/15 dark:bg-[#4cd7f6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-36 -right-10 w-52 h-52 bg-indigo-500/10 dark:bg-[#3131c0]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 flex flex-col items-center text-center pt-2">
        {/* Glow Ring Logo Container */}
        <div className="relative group cursor-pointer transition-transform duration-300 active:scale-95">
          <div className="absolute -inset-2 bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 rounded-full blur-md opacity-40 group-hover:opacity-75 transition-opacity" />
          <div className="relative w-24 h-24 rounded-full bg-white dark:bg-[#0a0e16] p-1 shadow-2xl flex items-center justify-center border border-white/20 dark:border-white/10">
            <BrandLogo size="lg" className="w-full h-full" />
          </div>
          {/* Pulse Status Node */}
          <span className="absolute bottom-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 dark:bg-[#4cd7f6] shadow-sm" />
          </span>
        </div>

        {/* App Name & Slogan */}
        <div className="mt-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-[#262a33] mb-2.5 shadow-sm">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-cyan-600 dark:text-[#4cd7f6] text-[15px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <span className="font-space text-[10px] text-cyan-700 dark:text-[#4cd7f6] tracking-wider uppercase font-bold">
              Gimnasio Cognitivo
            </span>
          </div>
          <h1 className="font-space font-bold text-3xl md:text-4xl text-slate-900 dark:text-[#dfe2ee] tracking-tight">
            MentIA
          </h1>
          <p className="font-dmsans text-[15px] text-slate-600 dark:text-[#bcc9cd] max-w-[280px] mt-1 font-medium leading-snug">
            Un entrenamiento para cada mente.
          </p>
        </div>
      </div>

      {/* Pillars Section */}
      <div className="mt-6 flex flex-col gap-3 z-10">
        <div className="flex items-center justify-between px-1">
          <span className="font-space text-[12px] font-semibold text-slate-500 dark:text-[#869397] tracking-wider uppercase">
            Pilares de Agilidad
          </span>
          <span className="font-space text-[11px] font-bold text-cyan-600 dark:text-[#4cd7f6] flex items-center gap-1">
            3 MODALIDADES
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[13px]"
            >
              auto_awesome
            </span>
          </span>
        </div>

        {/* Pillar 1: Memoria */}
        <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1c2028] p-4 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-[#262a33] active:scale-[0.99] shadow-sm border border-slate-200/60 dark:border-white/[0.04]">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#0a0e16] flex items-center justify-center text-cyan-600 dark:text-[#4cd7f6] shadow-inner">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[24px]"
              >
                psychology
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-space text-[18px] font-bold text-slate-900 dark:text-[#dfe2ee] tracking-tight truncate">
                  Memoria
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-[#0a0e16] font-space text-[10px] font-bold text-cyan-700 dark:text-[#4cd7f6] tracking-wide">
                  RETENCIÓN
                </span>
              </div>
              <p className="font-dmsans text-[13px] text-slate-600 dark:text-[#bcc9cd] mt-1 leading-snug">
                Ejercitá retención y recuerdo ágil de secuencias y patrones
                cotidianos.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Atención y concentración */}
        <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1c2028] p-4 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-[#262a33] active:scale-[0.99] shadow-sm border border-slate-200/60 dark:border-white/[0.04]">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#0a0e16] flex items-center justify-center text-amber-500 dark:text-[#ffb95f] shadow-inner">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[24px]"
              >
                center_focus_strong
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-space text-[18px] font-bold text-slate-900 dark:text-[#dfe2ee] tracking-tight truncate">
                  Atención &amp; Foco
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-[#0a0e16] font-space text-[10px] font-bold text-amber-700 dark:text-[#ffb95f] tracking-wide">
                  ENFOQUE
                </span>
              </div>
              <p className="font-dmsans text-[13px] text-slate-600 dark:text-[#bcc9cd] mt-1 leading-snug">
                Mantené el foco sin interrupciones en tus sesiones intensas de
                estudio o trabajo.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 3: Memoria de trabajo */}
        <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1c2028] p-4 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-[#262a33] active:scale-[0.99] shadow-sm border border-slate-200/60 dark:border-white/[0.04]">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#0a0e16] flex items-center justify-center text-indigo-500 dark:text-[#c0c1ff] shadow-inner">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[24px]"
              >
                instant_mix
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-space text-[18px] font-bold text-slate-900 dark:text-[#dfe2ee] tracking-tight truncate">
                  Memoria de Trabajo
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-[#0a0e16] font-space text-[10px] font-bold text-indigo-700 dark:text-[#c0c1ff] tracking-wide">
                  PROCESO
                </span>
              </div>
              <p className="font-dmsans text-[13px] text-slate-600 dark:text-[#bcc9cd] mt-1 leading-snug">
                Agilidad mental y velocidad de procesamiento inmediato en tiempo
                real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive Experience Highlight */}
      <div className="mt-4 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-[#181c24] border border-slate-200/50 dark:border-white/[0.03]">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-cyan-600 dark:text-[#4cd7f6] text-[20px] shrink-0"
        >
          tune
        </span>
        <p className="font-dmsans text-[13px] text-slate-600 dark:text-[#bcc9cd] leading-tight">
          Actividades breves que se adaptan progresivamente a tu desempeño
          diario.
        </p>
      </div>

      {/* Daily Metric Preview */}
      <div className="mt-4 p-3.5 rounded-2xl bg-white dark:bg-[#0a0e16] border border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-[#4cd7f6]">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[20px]"
            >
              timer
            </span>
          </div>
          <div>
            <div className="font-space text-[10px] text-slate-500 dark:text-[#869397] font-semibold uppercase tracking-wider">
              Tiempo promedio
            </div>
            <div className="font-space font-bold text-[14px] text-slate-900 dark:text-[#dfe2ee]">
              Duración configurable
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 font-space text-[10px] font-bold text-cyan-700 dark:text-[#4cd7f6] bg-cyan-100/70 dark:bg-[#262a33] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-[#4cd7f6] animate-pulse" />
            IA Adaptativa
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col gap-3 z-10">
        <button
          onClick={handleStart}
          className="group relative w-full h-14 rounded-xl bg-cyan-500 hover:bg-cyan-400 dark:bg-[#4cd7f6] dark:hover:bg-[#acedff] text-white dark:text-[#003640] font-space font-bold text-[16px] flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Comenzar</span>
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1"
          >
            arrow_forward
          </span>
        </button>

        <button
          onClick={handleLogin}
          className="w-full h-14 rounded-xl bg-white dark:bg-[#262a33] hover:bg-slate-100 dark:hover:bg-[#31353e] text-slate-800 dark:text-[#dfe2ee] font-space font-semibold text-[15px] flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/[0.04] transition-all active:scale-[0.98] cursor-pointer"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[20px] text-slate-500 dark:text-[#869397]"
          >
            login
          </span>
          <span>Ya tengo una cuenta</span>
        </button>
      </div>

      {/* Gamification Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] bg-slate-900/95 dark:bg-[#31353e]/95 backdrop-blur-md px-4 py-3 rounded-full flex items-center justify-between text-white shadow-2xl z-50 animate-bounce">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-cyan-400 text-[20px] animate-spin"
            >
              rocket_launch
            </span>
            <span className="font-dmsans text-[13px] font-medium">
              {toastMessage}
            </span>
          </div>
          <span className="font-space text-[11px] text-cyan-400 font-bold">
            100%
          </span>
        </div>
      )}
    </div>
  );
};
