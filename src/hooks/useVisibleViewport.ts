import { useEffect } from "react";

/** Ajusta el marco al espacio visible cuando cambia la barra del navegador o el teclado. */
export function useVisibleViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      // El zoom mantiene su desplazamiento natural, sin recalcular el marco de la app.
      if (viewport && viewport.scale !== 1) return;
      const height = Math.min(window.innerHeight, viewport?.height || window.innerHeight);
      if (height > 0) document.documentElement.style.setProperty("--mentia-visible-height", `${height}px`);
    };
    update();
    window.addEventListener("resize", update);
    viewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--mentia-visible-height");
    };
  }, []);
}
