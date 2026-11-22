import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExerciseTutorial } from "../src/components/ExerciseTutorial";
import { tutorialFor } from "../src/games/tutorials";
import type { ExerciseType, SessionItem } from "../src/services/api";

const item = (exerciseType: ExerciseType, params = {}): SessionItem => ({
  sessionItemId: "demo", position: 1, exerciseCode: exerciseType, exerciseType, category: "ATENCION",
  modality: "VISUAL", difficultyLevel: 1, variantKey: "v", seed: 7, params, content: {}, instructions: "Consigna original",
});

describe("Ejemplos antes de jugar", () => {
  it.each<ExerciseType>(["VISUAL_RECOGNITION", "SPATIAL_GRID", "ODD_ONE_OUT", "STROOP", "REVERSE_SEQUENCE", "N_BACK", "AUDITORY_SEQUENCE"])("ofrece una demostración completa para %s", (type) => {
    const demo = tutorialFor(item(type));
    expect(demo.summary.length).toBeGreaterThan(30);
    expect(demo.frames.length).toBeGreaterThanOrEqual(3);
    expect(demo.frames.every((frame) => frame.caption && frame.tiles.length)).toBe(true);
    render(<ExerciseTutorial item={item(type)} />);
    expect(screen.getByRole("region", { name: "Cómo jugar" })).toBeInTheDocument();
    expect(screen.getByText(/No suma puntos ni consume tiempo/)).toBeInTheDocument();
  });

  it.each([1, 2, 3])("N-back explica la comparación correcta para n=%i y cuándo no tocar", (n) => {
    const demo = tutorialFor(item("N_BACK", { n }));
    const match = demo.frames[n];
    expect(match.tiles[0].text).toBe(match.tiles[n].text);
    expect(match.tiles[0].selected && match.tiles[n].selected).toBe(true);
    expect(demo.frames[n + 1].caption).toContain("No toques");
    expect(demo.frames[n + 1].tiles[n + 1].text).not.toBe(demo.frames[n + 1].tiles[1].text);
  });

  it("avanza sin empezar el juego, permite pausar y repetir, y termina sin bucle", () => {
    vi.useFakeTimers();
    render(<ExerciseTutorial item={item("STROOP")} />);
    act(() => vi.advanceTimersByTime(4500));
    expect(screen.getByText("2. Elegí «azul»")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    act(() => vi.advanceTimersByTime(9000));
    expect(screen.getByText("2. Elegí «azul»")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Paso siguiente" }));
    expect(screen.getByText("3. Aplicá la misma regla")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Repetir ejemplo" }));
    expect(screen.getByText("1. Mirá el color de la tinta")).toBeInTheDocument();
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(4500));
    expect(screen.getByRole("button", { name: "Reproducir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paso siguiente" })).toBeDisabled();
  });

  it("la pausa de la sesión congela el ejemplo y al desmontarlo limpia el temporizador", () => {
    vi.useFakeTimers();
    const game = item("SPATIAL_GRID");
    const view = render(<ExerciseTutorial item={game} paused />);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByText("1. Memorizá las posiciones")).toBeInTheDocument();
    view.rerender(<ExerciseTutorial item={game} paused={false} />);
    act(() => vi.advanceTimersByTime(4500));
    expect(screen.getByText("2. Las luces se apagan")).toBeInTheDocument();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("respeta movimiento reducido con pasos manuales desde el inicio", () => {
    vi.useFakeTimers();
    const media = vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    try {
      render(<ExerciseTutorial item={item("REVERSE_SEQUENCE")} />);
      expect(screen.getByRole("button", { name: "Reproducir" })).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(9000));
      expect(screen.getByText("Mirá el símbolo 1 de 3")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Paso siguiente" }));
      expect(screen.getByText("Mirá el símbolo 2 de 3")).toBeInTheDocument();
    } finally { media.mockRestore(); }
  });
});
