/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useJourney } from "../context/JourneyContext";
import { AppTheme } from "../types";

export const ProfileScreen: React.FC = () => {
  const { logout, minutes } = useJourney();
  const { userStats, setCurrentTab } = useApp();
  const { theme, setTheme, isDark } = useTheme();

  const { goals } = useJourney();
  const priorities = goals.map(
    (code) =>
      ({
        MEMORIA: "Memoria",
        ATENCION: "Atención",
        MEMORIA_TRABAJO: "Memoria de trabajo",
      })[code] || code,
  );
  return (
    <div className="flex flex-col w-full min-h-screen px-4 pt-2 pb-28 select-none bg-slate-50 dark:bg-[#0f131c] text-slate-800 dark:text-[#dfe2ee] transition-colors">
      {/* User Card Header */}
      <section className="bg-white dark:bg-[#1c2028] rounded-3xl p-5 shadow-sm border border-slate-200/70 dark:border-white/[0.04] mb-4 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-sky-600 to-indigo-600 flex items-center justify-center shadow-md text-white font-space font-bold text-2xl">
              {userStats.name.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1c2028]">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-white text-[12px]"
              >
                bolt
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h2 className="font-space text-[20px] font-bold text-slate-900 dark:text-[#dfe2ee] truncate">
                {userStats.name}
              </h2>
              <span className="bg-cyan-50 dark:bg-[#262a33] text-cyan-700 dark:text-[#4cd7f6] font-space text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Nivel {userStats.level}
              </span>
            </div>
            <p className="font-dmsans text-[13px] text-slate-500 dark:text-[#bcc9cd] truncate">
              {userStats.username}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-space text-[12px] font-semibold text-cyan-600 dark:text-[#4cd7f6]">
                {userStats.title}
              </span>
              <span className="text-slate-300 dark:text-white/20 text-[10px]">
                •
              </span>
              <div className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-amber-500 text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  stars
                </span>
                <span className="font-space text-[12px] font-bold text-slate-800 dark:text-white">
                  {userStats.xp} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Mental Stat Bar */}
        <div className="mt-4 pt-3 bg-slate-50 dark:bg-[#0a0e16] rounded-2xl p-3 flex items-center justify-around text-center border border-slate-200/60 dark:border-white/[0.03]">
          <div>
            <span className="font-space text-[18px] font-bold text-slate-900 dark:text-white block leading-none">
              {userStats.streakDays}
            </span>
            <span className="font-space text-[10px] text-slate-500 dark:text-slate-300 uppercase mt-0.5 block">
              Días racha
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
          <div>
            <span className="font-space text-[18px] font-bold text-slate-900 dark:text-white block leading-none">
              {userStats.accuracy}%
            </span>
            <span className="font-space text-[10px] text-slate-500 dark:text-slate-300 uppercase mt-0.5 block">
              Precisión
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
          <div>
            <span className="font-space text-[18px] font-bold text-cyan-600 dark:text-[#4cd7f6] block leading-none">
              {userStats.completedActivities}
            </span>
            <span className="font-space text-[10px] text-slate-500 dark:text-slate-300 uppercase mt-0.5 block">
              Actividades
            </span>
          </div>
        </div>
      </section>

      {/* APARIENCIA Y TEMA (FEATURED HERO SECTION) */}
      <section className="bg-white dark:bg-[#1c2028] rounded-3xl p-5 shadow-sm border border-slate-200/70 dark:border-white/[0.04] mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-[#4cd7f6]">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px]"
              >
                palette
              </span>
            </div>
            <h3 className="font-space text-[16px] font-bold text-slate-900 dark:text-[#dfe2ee]">
              Apariencia y tema
            </h3>
          </div>
          <span className="font-space text-[10px] bg-cyan-100/70 dark:bg-[#262a33] text-cyan-800 dark:text-[#4cd7f6] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Activo:{" "}
            {theme === "light"
              ? "Claro"
              : theme === "dark"
                ? "Oscuro"
                : "Sistema"}
          </span>
        </div>

        <p className="font-dmsans text-[13px] text-slate-500 dark:text-[#bcc9cd] mb-3.5 leading-snug">
          Ajustá la interfaz para máxima comodidad de lectura y menor fatiga
          visual según tu entorno cognitivo.
        </p>

        {/* Visual Interactive Theme Selector (3 Cards) */}
        <div className="grid grid-cols-3 gap-2.5 mb-3.5">
          {/* Option 1: Claro */}
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all cursor-pointer text-left border ${
              theme === "light"
                ? "bg-sky-50/60 dark:bg-white/10 ring-2 ring-cyan-500 border-cyan-400 shadow-md"
                : "bg-slate-50 dark:bg-[#0a0e16] border-slate-200 dark:border-white/5 hover:border-slate-300"
            }`}
          >
            <div className="w-full h-16 rounded-xl bg-white border border-slate-200 p-1.5 flex flex-col justify-between mb-2 shadow-inner overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-4 h-1.5 rounded-full bg-cyan-500" />
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-amber-500 text-[13px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  light_mode
                </span>
              </div>
              <div className="space-y-1">
                <div className="w-8 h-1 rounded-full bg-slate-200" />
                <div className="w-12 h-1.5 rounded-full bg-cyan-100" />
              </div>
            </div>
            <div className="w-full flex items-center justify-between px-0.5">
              <span className="font-space text-[12px] font-bold text-slate-900 dark:text-white">
                Claro
              </span>
              {theme === "light" && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-cyan-600 dark:text-[#4cd7f6] text-[15px]"
                >
                  check_circle
                </span>
              )}
            </div>
            <span className="font-space text-[10px] text-slate-500 dark:text-slate-300 leading-tight mt-0.5 w-full">
              Paper White
            </span>
          </button>

          {/* Option 2: Oscuro */}
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all cursor-pointer text-left border ${
              theme === "dark"
                ? "bg-sky-50/60 dark:bg-cyan-950/40 ring-2 ring-cyan-500 border-cyan-400 shadow-md"
                : "bg-slate-50 dark:bg-[#0a0e16] border-slate-200 dark:border-white/5 hover:border-slate-300"
            }`}
          >
            <div className="w-full h-16 rounded-xl bg-[#0b1120] border border-slate-800 p-1.5 flex flex-col justify-between mb-2 shadow-inner overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-4 h-1.5 rounded-full bg-indigo-500" />
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-cyan-400 text-[13px]"
                >
                  dark_mode
                </span>
              </div>
              <div className="space-y-1">
                <div className="w-8 h-1 rounded-full bg-slate-700" />
                <div className="w-12 h-1.5 rounded-full bg-cyan-900/60" />
              </div>
            </div>
            <div className="w-full flex items-center justify-between px-0.5">
              <span className="font-space text-[12px] font-bold text-slate-900 dark:text-white">
                Oscuro
              </span>
              {theme === "dark" && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-cyan-600 dark:text-[#4cd7f6] text-[15px]"
                >
                  check_circle
                </span>
              )}
            </div>
            <span className="font-space text-[10px] text-slate-500 dark:text-slate-300 leading-tight mt-0.5 w-full">
              Modo noche
            </span>
          </button>

          {/* Option 3: Sistema */}
          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all cursor-pointer text-left border ${
              theme === "system"
                ? "bg-sky-50/60 dark:bg-cyan-950/40 ring-2 ring-cyan-500 border-cyan-400 shadow-md"
                : "bg-slate-50 dark:bg-[#0a0e16] border-slate-200 dark:border-white/5 hover:border-slate-300"
            }`}
          >
            <div className="w-full h-16 rounded-xl bg-gradient-to-r from-white via-slate-400 to-[#0b1120] border border-slate-300 dark:border-slate-700 p-1.5 flex flex-col justify-between mb-2 shadow-inner overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-4 h-1.5 rounded-full bg-purple-500" />
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-slate-800 text-[13px]"
                >
                  brightness_auto
                </span>
              </div>
              <div className="space-y-1">
                <div className="w-10 h-1 rounded-full bg-white/70" />
                <div className="w-6 h-1.5 rounded-full bg-cyan-600/70" />
              </div>
            </div>
            <div className="w-full flex items-center justify-between px-0.5">
              <span className="font-space text-[12px] font-bold text-slate-900 dark:text-white">
                Sistema
              </span>
              {theme === "system" && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-cyan-600 dark:text-[#4cd7f6] text-[15px]"
                >
                  check_circle
                </span>
              )}
            </div>
            <span className="font-space text-[10px] text-slate-500 dark:text-slate-300 leading-tight mt-0.5 w-full">
              Auto sincronía
            </span>
          </button>
        </div>

        {/* Footnote banner */}
        <div className="bg-slate-50 dark:bg-[#0a0e16] rounded-2xl p-3 flex items-center gap-2.5 border border-slate-200/60 dark:border-white/[0.04]">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-cyan-600 dark:text-[#4cd7f6] text-[18px] shrink-0"
          >
            wb_incandescent
          </span>
          <p className="font-dmsans text-[12px] text-slate-600 dark:text-[#bcc9cd] leading-tight">
            {isDark
              ? "El modo oscuro usa una superficie de fondo #0F131C."
              : "El modo claro usa superficies claras y texto oscuro."}
          </p>
        </div>
      </section>

      {/* PREFERENCIAS DE ENTRENAMIENTO */}
      <section className="bg-white dark:bg-[#1c2028] rounded-3xl p-5 shadow-sm border border-slate-200/70 dark:border-white/[0.04] mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-[#3131c0]/30 flex items-center justify-center text-indigo-600 dark:text-[#c0c1ff]">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px]"
            >
              tune
            </span>
          </div>
          <div>
            <h3 className="font-space text-[16px] font-bold text-slate-900 dark:text-[#dfe2ee]">
              Preferencias de entrenamiento
            </h3>
            <p className="font-dmsans text-[12px] text-slate-500 dark:text-[#bcc9cd]">
              Tus preferencias para las próximas sesiones.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 mt-3">
          {/* Frecuencia */}
          <div className="bg-slate-50 dark:bg-[#0a0e16] rounded-2xl p-3 flex items-center justify-between border border-slate-200/60 dark:border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white dark:bg-[#262a33] flex items-center justify-center text-cyan-600 dark:text-[#4cd7f6] shadow-xs">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[18px]"
                >
                  timer
                </span>
              </div>
              <div>
                <span className="font-space text-[12px] text-slate-900 dark:text-[#dfe2ee] font-bold block">
                  Duración elegida
                </span>
                <span className="font-dmsans text-[11px] text-slate-500 dark:text-[#869397]">
                  Micro-sesiones de enfoque
                </span>
              </div>
            </div>
            <span className="bg-indigo-50 dark:bg-[#262a33] text-indigo-700 dark:text-[#c0c1ff] font-space text-[10px] font-bold px-3 py-1 rounded-full">
              {minutes} min / sesión
            </span>
          </div>

          {/* Capacidades Priorizadas */}
          <div className="bg-slate-50 dark:bg-[#0a0e16] rounded-2xl p-3 border border-slate-200/60 dark:border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-space text-[12px] font-bold text-slate-900 dark:text-[#dfe2ee]">
                Capacidades priorizadas
              </span>
              <span className="font-space text-[10px] text-slate-500 dark:text-[#869397]">
                {priorities.length} activas
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {priorities.map((item, idx) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 bg-white dark:bg-[#262a33] px-3 py-1 rounded-full shadow-xs text-slate-800 dark:text-[#dfe2ee] font-space text-[11px] border border-slate-200/80 dark:border-white/5"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      idx === 0 ? "bg-cyan-500" : "bg-indigo-500"
                    }`}
                  />
                  <span>{item}</span>
                </div>
              ))}

              <button
                onClick={() => setCurrentTab("configuracion")}
                className="flex items-center gap-1 text-cyan-600 dark:text-[#4cd7f6] hover:underline font-space text-[11px] font-bold px-2 py-1 cursor-pointer"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[15px]"
                >
                  edit
                </span>
                <span>Editar</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="flow-card mb-4">
        <h3 className="font-space font-bold mb-3">Preferencias y acceso</h3>
        <p className="text-sm mb-3">Duración preferida: {minutes} minutos.</p>
        <button
          className="flow-link"
          onClick={() => setCurrentTab("configuracion")}
        >
          Configurar entrenamiento
        </button>
        <p className="text-sm mt-4">
          El acceso definitivo usará alias y contraseña. El código de
          recuperación se mostrará una sola vez al generarlo. Esta demo no
          almacena contraseñas ni crea cuentas.
        </p>
      </section>

      {/* Logout & App Version */}
      <div className="flex flex-col items-center gap-2.5 mt-1">
        <button
          onClick={logout}
          className="w-full h-12 rounded-full bg-white dark:bg-[#262a33] hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-space text-[13px] font-bold flex items-center justify-center gap-2 border border-rose-200/60 dark:border-rose-900/30 shadow-xs transition-transform active:scale-98 cursor-pointer"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[18px]"
          >
            logout
          </span>
          <span>Cerrar sesión en este dispositivo</span>
        </button>

        <p className="font-space text-[11px] text-slate-400 dark:text-[#869397] text-center">
          MentIA · Prototipo MVP
        </p>
      </div>
    </div>
  );
};
