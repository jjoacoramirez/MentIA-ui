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
  const { currentTab, setCurrentTab } = useApp();
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
      journey.assessmentRequired &&
      currentTab === "juego" &&
      !journey.assessment
    )
      setCurrentTab("evaluacion");
    else if (journey.assessed && currentTab === "evaluacion") setCurrentTab("inicio");
  }, [currentTab, journey.username, journey.configured, journey.assessmentRequired, journey.assessed]);
  const { isDark } = useTheme();

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
      className={`app-root min-h-screen w-full transition-colors duration-200 flex flex-col items-center justify-start ${
        isDark
          ? "dark bg-[#06090f] text-[#dfe2ee]"
          : "light bg-slate-200/90 text-slate-800"
      }`}
    >
      {/* Main Container */}
      <div className="app-workspace">
        <div
          id="phone-frame-container"
          data-screen={currentTab}
          data-navigation={["inicio", "entrenar", "biblioteca", "progreso", "perfil", "historial", "logros", "resultado"].includes(currentTab)}
          data-theme={isDark ? "dark" : "light"}
          className={`app-frame ${isDark ? "dark" : "light"}`}
        >
          {/* Screen Top Header (except on landing onboarding screen) */}
          {!publicTabs.includes(currentTab) && currentTab !== "juego" && (
            <Header title="MentIA" />
          )}

          {currentTab !== "juego" && (
            <div className="demo-notice" role="status">
              <span className="demo-dot" /> Demo · perfil guardado en este navegador
            </div>
          )}
          {!journey.storageAvailable && <p role="alert" className="px-4 py-2 text-sm text-amber-800 dark:text-amber-200">No se pudo guardar el perfil en este navegador. Podés continuar, pero el recorrido se perderá al recargar.</p>}
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
          <main className="app-content" key={currentTab} id="app-content" tabIndex={-1}>
            {(journey.username || publicTabs.includes(currentTab)) &&
              renderActiveScreen()}
          </main>

          {/* Bottom Dock Navigation */}
          <BottomNav />

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
