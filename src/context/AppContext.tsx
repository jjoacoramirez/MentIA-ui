/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from "react";
import { ScreenTab, UserStats, DashboardWidget, WidgetId } from "../types";

interface AppContextType {
  currentTab: ScreenTab;
  setCurrentTab: (tab: ScreenTab) => void;
  userStats: UserStats;
  addXp: (amount: number) => void;
  updateUser: (stats: Partial<UserStats>) => void;
  widgets: DashboardWidget[];
  reorderWidgets: (startIndex: number, endIndex: number) => void;
  toggleWidget: (id: WidgetId) => void;
  resetWidgets: () => void;
  isCustomizingLayout: boolean;
  setIsCustomizingLayout: (active: boolean) => void;
  viewportMode: "mobile-frame" | "responsive";
  setViewportMode: (mode: "mobile-frame" | "responsive") => void;
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
    title: "Sesión rápida de ejemplo",
    enabled: false,
    order: 4,
  },
];

const initialStats: UserStats = {
  name: "explorador",
  username: "explorador",
  title: "Exploradora Ágil",
  level: 3,
  xp: 420,
  streakDays: 4,
  accuracy: 96,
  topPercent: 8,
  completedActivities: 28,
  weeklySessions: 5,
  totalPlayTime: "2h 45m",
  recoveryCode: "MTIA-9482-XK",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTab, setCurrentTab] = useState<ScreenTab>("landing");
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
  const [viewportMode, setViewportMode] = useState<
    "mobile-frame" | "responsive"
  >("responsive");

  const addXp = (amount: number) => {
    setUserStats((prev) => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 200) + 1;
      return {
        ...prev,
        xp: newXp,
        level: Math.max(prev.level, newLevel),
        completedActivities: prev.completedActivities + 1,
      };
    });
  };

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
        addXp,
        updateUser: (stats) => setUserStats((prev) => ({ ...prev, ...stats })),
        widgets,
        reorderWidgets,
        toggleWidget,
        resetWidgets,
        isCustomizingLayout,
        setIsCustomizingLayout,
        viewportMode,
        setViewportMode,
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
