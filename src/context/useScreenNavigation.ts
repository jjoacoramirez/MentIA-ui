import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ScreenTab } from "../types";
const tabs: ScreenTab[] = ["landing","inicio","entrenar","biblioteca","progreso","perfil","registro","ingreso","recuperacion","configuracion","evaluacion","juego","resultado","historial","logros"];
export function useScreenNavigation() {
  const [currentTab, updateTab] = useState<ScreenTab>("landing");
  const current = useRef<ScreenTab>("landing");
  const restoring = useRef(false);
  useLayoutEffect(() => {
    // A reload starts a fresh demo; history entries contain no credentials.
    window.history.replaceState({ mentiaTab: "landing" }, "");
    function onPop(event: PopStateEvent) {
      if (restoring.current) { restoring.current = false; return; }
      if (current.current === "juego") {
        restoring.current = true;
        window.history.go(1);
        window.dispatchEvent(new Event("mentia:leave-session"));
        return;
      }
      const requested = event.state?.mentiaTab;
      let target: ScreenTab = tabs.includes(requested) ? requested : "landing";
      // A completed/abandoned game must not restart when going back to its entry.
      if (target === "juego") {
        target = "entrenar";
        window.history.replaceState({ mentiaTab: target }, "");
      }
      current.current = target;
      updateTab(target);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const setCurrentTab = useCallback((tab: ScreenTab) => {
    if (current.current === tab) return;
    window.history.pushState({ mentiaTab: tab }, "");
    current.current = tab;
    updateTab(tab);
  }, []);
  return { currentTab, setCurrentTab };
}
