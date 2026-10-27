import { LibraryScreen } from "./screens/LibraryScreen";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { GameSessionScreen } from "./screens/GameSessionScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { JourneyProvider, useJourney } from "./context/JourneyContext";
import {
  AuthScreen,
  ConfigurationScreen,
  TrainingScreen,
  ResultsScreen,
  HistoryScreen,
  AchievementsScreen,
} from "./screens/FlowScreens";
import { ProfileScreen } from "./screens/ProfileScreen";

const MainLayout: React.FC = () => {
  const { currentTab, setCurrentTab, viewportMode, setViewportMode } = useApp();
  const journey = useJourney();
  const publicTabs = ["landing", "registro", "ingreso", "recuperacion"];
  React.useEffect(() => {
    if (!journey.username && !publicTabs.includes(currentTab))
      setCurrentTab("ingreso");
    else if (
      journey.username &&
      !journey.configured &&
      ![...publicTabs, "configuracion"].includes(currentTab)
    )
      setCurrentTab("configuracion");
    else if (
      journey.username &&
      !journey.assessed &&
      currentTab === "juego" &&
      !journey.assessment
    )
      setCurrentTab("evaluacion");
  }, [currentTab, journey.username, journey.configured, journey.assessed]);
  const { isDark, toggleTheme } = useTheme();

  const renderActiveScreen = () => {
    switch (currentTab) {
      case "landing":
        return <WelcomeScreen />;
      case "inicio":
        return <HomeScreen />;
      case "biblioteca":
        return <LibraryScreen />;
      case "entrenar":
      case "evaluacion":
        return <TrainingScreen />;
      case "juego":
        return <GameSessionScreen />;
      case "registro":
      case "ingreso":
      case "recuperacion":
        return <AuthScreen key={currentTab} mode={currentTab} />;
      case "configuracion":
        return <ConfigurationScreen />;
      case "resultado":
        return <ResultsScreen />;
      case "historial":
        return <HistoryScreen />;
      case "logros":
        return <AchievementsScreen />;
      case "progreso":
        return <ProgressScreen />;
      case "perfil":
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div
      data-theme={isDark ? "dark" : "light"}
      className={`min-h-screen w-full transition-colors duration-200 flex flex-col items-center justify-start ${
        isDark
          ? "dark bg-[#06090f] text-[#dfe2ee]"
          : "light bg-slate-200/90 text-slate-800"
      }`}
    >
      {/* Top Desktop Presentation Bar for toggling preview modes and quick test controls */}
      <div
        className={`w-full backdrop-blur-md border-b px-4 py-2 flex items-center justify-between text-xs transition-colors z-50 ${
          isDark
            ? "bg-slate-950/80 border-white/10 text-slate-300"
            : "bg-white/95 border-slate-300/80 text-slate-700 shadow-xs"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
            <span className="font-space font-bold tracking-wide">
              MentIA · Prototipo
            </span>
          </div>

          <span className="hidden sm:inline-block opacity-40">|</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick theme toggler */}
          <button
            onClick={toggleTheme}
            title={`Alternar tema (Activo: ${isDark ? "Oscuro" : "Claro"})`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-space text-[11px] font-semibold cursor-pointer ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-accent border border-white/10"
                : "bg-slate-100 hover:bg-slate-200 text-accent border border-slate-300 shadow-xs"
            }`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[16px]"
            >
              {isDark ? "light_mode" : "dark_mode"}
            </span>
            <span>{isDark ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>

          {/* Viewport switch: 390px iPhone vs Fluid */}
          <button
            onClick={() =>
              setViewportMode(
                viewportMode === "mobile-frame" ? "responsive" : "mobile-frame",
              )
            }
            title="Alternar entre marco iPhone 390px y vista fluida"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-space text-[11px] font-semibold transition-colors cursor-pointer ${
              viewportMode === "mobile-frame"
                ? "bg-brand/20 text-accent border border-brand/40"
                : isDark
                  ? "bg-white/10 text-slate-300 hover:bg-white/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[15px]"
            >
              {viewportMode === "mobile-frame" ? "smartphone" : "devices"}
            </span>
            <span>
              {viewportMode === "mobile-frame" ? "Marco 390px" : "Vista Fluida"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full flex-1 flex justify-center items-start p-0 md:p-6 lg:p-8">
        <div
          id="phone-frame-container"
          data-theme={isDark ? "dark" : "light"}
          className={`w-full transition-all duration-300 [transform:translateZ(0)] isolate relative overflow-hidden flex flex-col ${
            viewportMode === "mobile-frame"
              ? "max-w-[390px] h-[844px] min-h-[844px] max-h-[844px] rounded-none md:rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border-0 md:border-[10px] border-slate-800 dark:border-slate-800/80 ring-1 ring-black/10 dark:ring-white/10"
              : "max-w-2xl min-h-screen md:min-h-[90vh] rounded-none md:rounded-3xl shadow-2xl border-0 md:border border-slate-200 dark:border-white/10"
          } ${
            isDark
              ? "dark bg-[#0f131c] text-[#dfe2ee]"
              : "light bg-[#faf8ff] text-[#131b2e]"
          }`}
        >
          {/* Simulated iPhone Dynamic Island & Speaker (Only in mobile-frame mode on desktop) */}
          {viewportMode === "mobile-frame" && (
            <div className="hidden md:flex w-full h-7 items-center justify-between px-6 pt-1 text-[11px] font-space font-semibold select-none bg-inherit shrink-0">
              <span className="text-slate-800 dark:text-slate-300">9:41</span>
              <div className="w-20 h-4 bg-black rounded-full shadow-inner" />
              <div className="flex items-center gap-1 text-[13px] text-slate-800 dark:text-slate-300">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[14px]"
                >
                  signal_cellular_alt
                </span>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[14px]"
                >
                  wifi
                </span>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[14px]"
                >
                  battery_full
                </span>
              </div>
            </div>
          )}

          {/* Screen Top Header (except on landing onboarding screen) */}
          {!publicTabs.includes(currentTab) && currentTab !== "juego" && (
            <Header title="MentIA" />
          )}

          {currentTab !== "juego" && (
            <div className="demo-notice" role="status">
              <span className="demo-dot" /> Vista de demostración · datos temporales
            </div>
          )}
          {journey.username && ["progreso", "historial", "logros"].includes(currentTab) && (
            <nav aria-label="Secciones de progreso" className="section-nav">
              {([
                ["progreso", "Evolución", "monitoring"],
                ["historial", "Historial", "history"],
                ["logros", "Logros", "workspace_premium"],
              ] as const).map(([tab, label, icon]) => (
                <button key={tab} aria-current={currentTab === tab ? "page" : undefined}
                  onClick={() => setCurrentTab(tab)} className={currentTab === tab ? "active" : ""}>
                  <span aria-hidden="true" className="material-symbols-outlined">{icon}</span>{label}
                </button>
              ))}
            </nav>
          )}
          {/* Screen View */}
          <main className="flex-1 w-full flex flex-col overflow-y-auto relative">
            {(journey.username || publicTabs.includes(currentTab)) &&
              renderActiveScreen()}
          </main>

          {/* Bottom Dock Navigation */}
          <BottomNav />

          {/* Home indicator bar (iPhone frame) */}
          {viewportMode === "mobile-frame" && (
            <div className="hidden md:block w-32 h-1 bg-slate-300 dark:bg-white/20 rounded-full mx-auto my-1.5 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <JourneyProvider>
          <MainLayout />
        </JourneyProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
