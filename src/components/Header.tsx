/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { BrandLogo } from "./BrandLogo";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
}) => {
  const {
    currentTab,
    setCurrentTab,
    userStats,
    isCustomizingLayout,
    setIsCustomizingLayout,
  } = useApp();
  const { isDark, theme, toggleTheme } = useTheme();

  const getSubtext = () => {
    if (subtitle) return subtitle;
    switch (currentTab) {
      case "inicio":
        return "Inicio";
      case "biblioteca": return "Biblioteca de juegos";
      case "entrenar":
        return "Entrenar";
      case "progreso":
        return "Progreso";
      case "perfil":
        return "Perfil";
      case "historial": return "Historial";
      case "logros": return "Logros";
      case "resultado": return "Resultados";
      case "configuracion": return "Preferencias";
      case "evaluacion": return "Evaluación inicial";
      default:
        return "";
    }
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-white/90 dark:bg-[#0f131c]/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/[0.06] transition-colors">
      <div className="h-16 px-4 flex items-center justify-between w-full mx-auto">
        {/* Left: Back button or Logo + Title */}
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <button
              onClick={onBack || (() => setCurrentTab("inicio"))}
              aria-label="Volver"
              className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-slate-700 dark:text-[#dfe2ee] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[22px]"
              >
                arrow_back
              </span>
            </button>
          ) : null}

          <button
            onClick={() => setCurrentTab("inicio")}
            aria-label="Ir al inicio"
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <BrandLogo size="sm" />
            <div className="flex flex-col">
              <span className="font-space font-bold text-[18px] text-cyan-600 dark:text-[#4cd7f6] leading-none tracking-tight">
                {title || "MentIA"}
              </span>
              {getSubtext() && (
                <span className="font-space text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#869397] font-semibold leading-none mt-0.5">
                  {getSubtext()}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {currentTab === "inicio" && <button onClick={() => setCurrentTab("historial")} aria-label="Historial" title="Historial" className="session-icon"><span aria-hidden="true" className="material-symbols-outlined">history</span></button>}
          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            title={`Tema actual: ${theme}. Clic para cambiar.`}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 dark:text-[#dfe2ee] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[20px]"
            >
              {theme === "dark"
                ? "dark_mode"
                : theme === "light"
                  ? "light_mode"
                  : "brightness_auto"}
            </span>
          </button>

          {/* If on home screen, show Layout Edit toggle button */}
          {currentTab === "inicio" && (
            <button
              onClick={() => setIsCustomizingLayout(!isCustomizingLayout)}
              title="Organizar y personalizar widgets del dashboard"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                isCustomizingLayout
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                  : "text-slate-600 dark:text-[#dfe2ee] hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[19px]"
              >
                {isCustomizingLayout ? "done" : "dashboard_customize"}
              </span>
            </button>
          )}

          {/* User profile avatar */}
          <button
            onClick={() => setCurrentTab("perfil")}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 dark:from-[#4cd7f6] dark:to-[#06b6d4] flex items-center justify-center text-white dark:text-[#003640] shadow-sm ml-1 hover:ring-2 hover:ring-cyan-400 transition-all active:scale-95"
            title={`${userStats.name} (${userStats.username})`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px]"
            >
              person
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
