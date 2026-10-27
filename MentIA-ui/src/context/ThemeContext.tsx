/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppTheme } from "../types";

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem("mentia_theme") as AppTheme;
    return saved === "light" || saved === "dark" || saved === "system"
      ? saved
      : "dark";
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("mentia_theme") as AppTheme;
    if (saved === "light") return false;
    if (saved === "dark") return true;
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem("mentia_theme", theme);

    const updateEffectiveDark = () => {
      let effectiveDark = true;
      if (theme === "system") {
        effectiveDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        effectiveDark = theme === "dark";
      }

      setIsDark(effectiveDark);

      const root = document.documentElement;
      const body = document.body;

      if (effectiveDark) {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
        body.classList.add("dark");
        body.classList.remove("light");
        body.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
        body.classList.remove("dark");
        body.classList.add("light");
        body.setAttribute("data-theme", "light");
      }
    };

    updateEffectiveDark();

    if (theme === "system" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => updateEffectiveDark();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
