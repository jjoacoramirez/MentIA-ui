import { useScreenNavigation } from "./useScreenNavigation";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useState } from "react";
import { ScreenTab, UserStats, DashboardWidget, WidgetId } from "../types";

interface AppContextType {
  currentTab: ScreenTab;
  setCurrentTab: (tab: ScreenTab) => void;
  /** Resumen para Inicio y Perfil; lo completa JourneyContext con datos del servidor. */
  userStats: UserStats;
  updateUser: (stats: Partial<UserStats>) => void;
  widgets: DashboardWidget[];
  reorderWidgets: (startIndex: number, endIndex: number) => void;
  toggleWidget: (id: WidgetId) => void;
  resetWidgets: () => void;
  isCustomizingLayout: boolean;
  setIsCustomizingLayout: (active: boolean) => void;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: "next_training",
    title: "Próximo entrenamiento",
    enabled: true,
    order: 0,
  },
  {
    id: "focus_metrics",
    title: "Métricas de enfoque",
    enabled: true,
    order: 1,
  },
  {
    id: "evolution_chart",
    title: "Tu evolución (7 días)",
    enabled: true,
    order: 2,
  },
  { id: "agility_tip", title: "Consejo de agilidad", enabled: true, order: 3 },
  {
    id: "flash_challenge",
    title: "Sesión rápida",
    enabled: false,
    order: 4,
  },
];

const initialStats: UserStats = {
  name: "",
  username: "",
  title: "En entrenamiento",
  level: 1,
  xp: 0,
  streakDays: 0,
  accuracy: 0,
  completedActivities: 0,
  weeklySessions: 0,
  totalPlayTime: "0 min",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentTab, setCurrentTab } = useScreenNavigation();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  const [userStats, setUserStats] = useState<UserStats>(initialStats);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem("mentia_widgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (w) =>
              defaultWidgets.some((d) => d.id === w.id) &&
              typeof w.order === "number" &&
              typeof w.enabled === "boolean",
          ) &&
          new Set(parsed.map((w) => w.id)).size === parsed.length
        )
          return parsed;
      } catch {
        // fallback
      }
    }
    return defaultWidgets;
  });

  const [isCustomizingLayout, setIsCustomizingLayout] =
    useState<boolean>(false);
  // Estable: JourneyContext lo usa como dependencia de un efecto.
  const updateUser = useCallback(
    (stats: Partial<UserStats>) => setUserStats((prev) => ({ ...prev, ...stats })),
    [],
  );

  const reorderWidgets = (startIndex: number, endIndex: number) => {
    setWidgets((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order);
      const visible = ordered.filter((w) => w.enabled);
      if (
        ![startIndex, endIndex].every(
          (i) => Number.isInteger(i) && i >= 0 && i < visible.length,
        )
      )
        return prev;
      const [removed] = visible.splice(startIndex, 1);
      visible.splice(endIndex, 0, removed);
      let visibleIndex = 0;
      const reindexed = ordered.map((item, index) => ({
        ...(item.enabled ? visible[visibleIndex++] : item),
        order: index,
      }));
      localStorage.setItem("mentia_widgets", JSON.stringify(reindexed));
      return reindexed;
    });
  };

  const toggleWidget = (id: WidgetId) => {
    setWidgets((prev) => {
      const updated = prev.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w,
      );
      localStorage.setItem("mentia_widgets", JSON.stringify(updated));
      return updated;
    });
  };

  const resetWidgets = () => {
    setWidgets(defaultWidgets);
    localStorage.removeItem("mentia_widgets");
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        userStats,
        updateUser,
        widgets,
        reorderWidgets,
        toggleWidget,
        resetWidgets,
        isCustomizingLayout,
        setIsCustomizingLayout,
        hasSeenOnboarding,
        setHasSeenOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
