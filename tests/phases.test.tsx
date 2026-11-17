import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Game } from "../src/games";
import { EncouragementNote, ENCOURAGEMENTS, encouragementFor } from "../src/components/EncouragementNote";
import type { ExerciseType, SessionItem } from "../src/services/api";

function item(exerciseType: ExerciseType, params: Record<string, unknown>, content: Record<string, unknown>): SessionItem {
  return {
    sessionItemId: "item-1", position: 1, exerciseCode: exerciseType, exerciseType, category: "ATENCION",
    modality: "VISUAL", difficultyLevel: 1, variantKey: "v", seed: 7, params, content, instructions: "",
  };
}

const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 100) act(() => vi.advanceTimersByTime(100));
};

afterEach(() => vi.useRealTimers());

describe("Cambio de fase dentro del juego", () => {
  it("cuadrícula: pasa de «Memorizá» a «Tu turno»", () => {
    vi.useFakeTimers();
    render(<Game item={item("SPATIAL_GRID", { gridSize: 3, cellsToRemember: 2, exposureMs: 1000 }, {})} paused={false} onDone={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Memorizá");
    advance(1000);
    expect(screen.getByRole("status")).toHaveTextContent("Tu turno");
  });

  it("reconocimiento: la cinta de memorizar se reemplaza por la de responder", () => {
    vi.useFakeTimers();
    render(<Game item={item("VISUAL_RECOGNITION", { itemsToMemorize: 2, distractors: 2, exposureMsPerItem: 500 },
      { items: ["🍎", "🍐", "🍊", "🍋"] })} paused={false} onDone={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Memorizá");
    advance(1000);
    expect(screen.getByRole("status")).toHaveTextContent("Tu turno");
  });

  it("secuencia: queda vacío un momento entre elementos y después es «Tu turno»", () => {
    vi.useFakeTimers();
    render(<Game item={item("REVERSE_SEQUENCE", { sequenceLength: 2, itemDisplayMs: 1000 }, { symbols: ["A"] })} paused={false} onDone={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Mirá con atención");
    expect(screen.getByLabelText("Elemento de la secuencia")).toBeInTheDocument();
    advance(800);
    expect(screen.queryByLabelText("Elemento de la secuencia")).not.toBeInTheDocument();
    advance(200);
    expect(screen.getByLabelText("Elemento de la secuencia")).toBeInTheDocument();
    advance(1000);
    expect(screen.getByRole("status")).toHaveTextContent("Tu turno");
  });

  it("elemento diferente y color y palabra muestran el avance por ronda", () => {
    vi.useFakeTimers();
    const { unmount } = render(<Game item={item("ODD_ONE_OUT", { items: 4, similarity: 0, timeLimitMs: 1000 }, { pairs: [["O", "Q"]] })} paused={false} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Ronda 1 de 5")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByLabelText("Ronda 2 de 5")).toBeInTheDocument();
    unmount();
    const colors = [{ name: "rojo", hex: "#ff0000" }, { name: "azul", hex: "#0000ff" }];
    render(<Game item={item("STROOP", { trials: 3, responseLimitMs: 2000 }, { colors })} paused={false} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Ensayo 1 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "rojo" }));
    expect(screen.getByLabelText("Ensayo 2 de 3")).toBeInTheDocument();
  });
});

describe("Cartelito de ánimo", () => {
  it("elige el mensaje de forma determinística", () => {
    expect(encouragementFor(2)).toBe(ENCOURAGEMENTS[2]);
    expect(encouragementFor(2 + ENCOURAGEMENTS.length)).toBe(ENCOURAGEMENTS[2]);
    expect(encouragementFor(-1)).toBe(ENCOURAGEMENTS[ENCOURAGEMENTS.length - 1]);
  });

  it("no usa lenguaje clínico", () => {
    ENCOURAGEMENTS.forEach((m) => expect(m).not.toMatch(/diagn[oó]stic|capacidad|d[eé]ficit|mejora cognitiva/i));
  });

  it("se puede cerrar y recuerda la decisión", () => {
    window.localStorage.removeItem("test.note");
    const { unmount } = render(<EncouragementNote seed={0} dismissKey="test.note" />);
    expect(screen.getByRole("note")).toHaveTextContent(ENCOURAGEMENTS[0]);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar mensaje" }));
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    unmount();
    render(<EncouragementNote seed={0} dismissKey="test.note" />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    window.localStorage.removeItem("test.note");
  });

  it("funciona aunque el storage no esté disponible", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqueado"); });
    render(<EncouragementNote seed={1} dismissKey="x" />);
    expect(screen.getByRole("note")).toBeInTheDocument();
    spy.mockRestore();
  });
});
