import React from "react";
import { act, renderHook, render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useScreenNavigation } from "../src/context/useScreenNavigation";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
it("el botón Atrás del navegador vuelve entre pantallas sin agregar otra entrada", () => {
  const { result } = renderHook(() => useScreenNavigation());
  act(() => result.current.setCurrentTab("inicio"));
  act(() => result.current.setCurrentTab("historial"));
  const push = vi.spyOn(window.history,"pushState");
  act(() => window.dispatchEvent(new PopStateEvent("popstate",{state:{mentiaTab:"inicio"}})));
  expect(result.current.currentTab).toBe("inicio");
  expect(push).not.toHaveBeenCalled();
  push.mockRestore();
});
it("Atrás durante un ejercicio solicita confirmar la salida y no reinicia juegos terminados", () => {
  const { result } = renderHook(() => useScreenNavigation());
  const go = vi.spyOn(window.history,"go").mockImplementation(() => {});
  const leave = vi.fn();
  window.addEventListener("mentia:leave-session",leave);
  act(() => result.current.setCurrentTab("juego"));
  act(() => window.dispatchEvent(new PopStateEvent("popstate",{state:{mentiaTab:"entrenar"}})));
  expect(result.current.currentTab).toBe("juego");
  expect(leave).toHaveBeenCalledOnce();
  expect(go).toHaveBeenCalledWith(1);
  // Consume the forward event used to restore the active game entry.
  act(() => window.dispatchEvent(new PopStateEvent("popstate",{state:{mentiaTab:"juego"}})));
  act(() => result.current.setCurrentTab("resultado"));
  act(() => window.dispatchEvent(new PopStateEvent("popstate",{state:{mentiaTab:"juego"}})));
  expect(result.current.currentTab).toBe("entrenar");
  go.mockRestore();
  window.removeEventListener("mentia:leave-session",leave);
});
it("el tema predeterminado respeta el sistema y alterna desde el tema efectivo", () => {
  function Probe() { const { isDark,toggleTheme } = useTheme(); return <button onClick={toggleTheme}>{isDark ? "Oscuro" : "Claro"}</button>; }
  render(<ThemeProvider><Probe/></ThemeProvider>);
  expect(screen.getByRole("button",{name:"Claro"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  expect(document.documentElement).toHaveAttribute("data-theme","dark");
  fireEvent.click(screen.getByRole("button"));
  expect(document.documentElement).toHaveAttribute("data-theme","light");
});
