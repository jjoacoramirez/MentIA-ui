/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { useJourney } from "../context/JourneyContext";
import { useTheme } from "../context/ThemeContext";
import type { ScreenTab } from "../types";
import { BrandLogo } from "./BrandLogo";

/** Nombre de cada pantalla en el header; las de la navegación usan la misma etiqueta que la navegación. */
const sections: Partial<Record<ScreenTab, string>> = {
  inicio: "Inicio",
  entrenar: "Entrenar",
  biblioteca: "Juegos",
  progreso: "Progreso",
  historial: "Progreso",
  logros: "Progreso",
  perfil: "Perfil",
  resultado: "Resultado",
  configuracion: "Preferencias",
  evaluacion: "Evaluación inicial",
  admin: "Panel admin",
};

const themeLabels = { light: "claro", dark: "oscuro", system: "del sistema" } as const;

/**
 * Header único de las pantallas con sesión iniciada: marca y sección a la izquierda; tema, panel admin (solo
 * admins) y perfil a la derecha, siempre en el mismo lugar. Las acciones propias de una pantalla van en la pantalla.
 */
export const Header: React.FC = () => {
  const { currentTab, setCurrentTab, userStats } = useApp();
  const { isAdmin } = useJourney();
  const { theme, toggleTheme } = useTheme();
  const section = sections[currentTab];
  const iconButton = "w-9 h-9 flex items-center justify-center rounded-full text-slate-600 dark:text-[#dfe2ee] hover:bg-black/5 dark:hover:bg-white/10 transition-colors";

  return (
    <header className="sticky top-0 w-full z-40 bg-white/90 dark:bg-[#0f131c]/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/[0.06] transition-colors">
      <div className="h-16 px-4 flex items-center justify-between w-full mx-auto">
        <button
          onClick={() => setCurrentTab("inicio")}
          aria-label="Ir al inicio"
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <BrandLogo size="sm" />
          <span className="flex flex-col items-start">
            <span className="font-space font-bold text-[18px] text-accent leading-none tracking-tight">MentIA</span>
            {section && (
              <span className="font-space text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#869397] font-semibold leading-none mt-0.5">
                {section}
              </span>
            )}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button onClick={toggleTheme} aria-label={`Cambiar tema (ahora: ${themeLabels[theme]})`} title="Cambiar tema" className={iconButton}>
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              {theme === "dark" ? "dark_mode" : theme === "light" ? "light_mode" : "brightness_auto"}
            </span>
          </button>
          {isAdmin && (
            <button onClick={() => setCurrentTab("admin")} aria-label="Panel admin" title="Panel admin"
              aria-current={currentTab === "admin" ? "page" : undefined}
              className={`${iconButton} ${currentTab === "admin" ? "bg-brand/15 text-accent!" : ""}`}>
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">insights</span>
            </button>
          )}
          <button
            onClick={() => setCurrentTab("perfil")}
            aria-label="Ir a mi perfil"
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand to-indigo-600 dark:from-brand dark:to-brand flex items-center justify-center text-brand-ink shadow-sm ml-1 hover:ring-2 hover:ring-brand transition-all active:scale-95"
            title={userStats.username}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};
