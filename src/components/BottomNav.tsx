/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { ScreenTab } from "../types";

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab } = useApp();

  // If on landing screen, bottom nav is hidden
  if (
    ![
      "inicio",
      "entrenar",
      "progreso",
      "perfil",
      "historial",
      "logros",
      "resultado",
    ].includes(currentTab)
  )
    return null;

  const navItems: { tab: ScreenTab; label: string; icon: string }[] = [
    { tab: "inicio", label: "Inicio", icon: "space_dashboard" },
    { tab: "entrenar", label: "Entrenar", icon: "bolt" },
    { tab: "progreso", label: "Progreso", icon: "monitoring" },
    { tab: "perfil", label: "Perfil", icon: "person" },
  ];

  return (
    <nav className="shrink-0 z-40 pb-[env(safe-area-inset-bottom,0px)] pointer-events-none">
      <div className="max-w-[420px] mx-auto px-4 pb-2.5">
        <div className="pointer-events-auto h-16 bg-white/90 dark:bg-[#0a0e16]/85 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.45)] border border-slate-200/60 dark:border-white/[0.08] flex items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.tab || (item.tab === "progreso" && ["historial", "logros", "resultado"].includes(currentTab));
            return (
              <button
                key={item.tab}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setCurrentTab(item.tab)}
                className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 relative ${
                  isActive
                    ? "text-cyan-600 dark:text-[#4cd7f6] font-bold scale-105"
                    : "text-slate-500 dark:text-[#869397] hover:text-slate-800 dark:hover:text-[#dfe2ee]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[23px] transition-transform"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span className="font-space text-[11px] leading-tight mt-0.5 tracking-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-cyan-600 dark:bg-[#4cd7f6] shadow-sm animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
