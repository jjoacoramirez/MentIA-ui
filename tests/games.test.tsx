import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Game, type GameOutcome } from "../src/games";
import { seededRandom } from "../src/games/common";
import type { ExerciseType, SessionItem } from "../src/services/api";

function item(exerciseType: ExerciseType, params: Record<string, unknown>, content: Record<string, unknown>): SessionItem {
  return {
    sessionItemId: "item-1", position: 1, exerciseCode: exerciseType, exerciseType, category: "ATENCION",
    modality: "VISUAL", difficultyLevel: 1, variantKey: "v", seed: 7, params, content, instructions: "",
  };
}

function play(game: SessionItem) {
  const done = vi.fn<(o: GameOutcome) => void>();
  render(<Game item={game} paused={false} onDone={done} />);
  return done;
}

/** De a un tick: React aplica cada cambio de estado antes del siguiente, como en el navegador. */
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 100) act(() => vi.advanceTimersByTime(100));
};

describe("Mecánicas", () => {
  it("el mismo seed genera los mismos estímulos", () => {
    const a = seededRandom(123456789012);
    const b = seededRandom(123456789012);
    expect([a.next(), a.int(10), a.next()]).toEqual([b.next(), b.int(10), b.next()]);
    expect(seededRandom(1).next()).not.toEqual(seededRandom(2).next());
  });

  it("secuencia inversa: se responde al revés", () => {
    vi.useFakeTimers();
    const done = play(item("REVERSE_SEQUENCE", { sequenceLength: 2, itemDisplayMs: 500 }, { symbols: ["A"] }));
    advance(1000);
    fireEvent.click(screen.getByRole("button", { name: "Elegir A" }));
    fireEvent.click(screen.getByRole("button", { name: "Elegir A" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar respuesta" }));
    expect(done).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: true, accuracy: 1 }));
  });

  it("color y palabra: elegir siempre el color de la tinta acierta todo", () => {
    vi.useFakeTimers();
    const colors = [{ name: "rojo", hex: "#ff0000" }, { name: "azul", hex: "#0000ff" }];
    const done = play(item("STROOP", { trials: 3, incongruentRatio: 1, responseLimitMs: 2000 }, { colors }));
    for (let i = 0; i < 3; i++) {
      const word = screen.getByLabelText(/^Palabra/);
      const ink = colors.find((c) => word.style.color === hexToRgb(c.hex))!.name;
      fireEvent.click(screen.getByRole("button", { name: ink }));
    }
    expect(done).toHaveBeenCalledWith(expect.objectContaining({ accuracy: 1, isCorrect: true }));
  });

  it("elemento diferente: si se acaba el tiempo la ronda cuenta como error", () => {
    vi.useFakeTimers();
    const done = play(item("ODD_ONE_OUT", { items: 4, similarity: 0, timeLimitMs: 1000 }, { pairs: [["O", "Q"]] }));
    for (let round = 0; round < 5; round++) {
      if (round < 2) fireEvent.click(screen.getAllByRole("button").find((b) => b.textContent === "Q")!);
      else advance(1000);
    }
    expect(done).toHaveBeenCalledWith(expect.objectContaining({ accuracy: 2 / 5, isCorrect: false }));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("cuadrícula: hay que marcar las mismas casillas", () => {
    vi.useFakeTimers();
    const done = play(item("SPATIAL_GRID", { gridSize: 3, cellsToRemember: 2, exposureMs: 1000 }, { highlightColor: "#ff0000" }));
    const lit = screen.getAllByRole("button").map((b, i) => (b.style.background.includes("255, 0, 0") ? i : -1)).filter((i) => i >= 0);
    expect(lit).toHaveLength(2);
    advance(1000);
    lit.forEach((i) => fireEvent.click(screen.getByRole("button", { name: `Casilla ${i + 1}` })));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(done).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: true, accuracy: 1 }));
  });

  it("reconocimiento visual: marcar un distractor resta", () => {
    vi.useFakeTimers();
    const done = play(item("VISUAL_RECOGNITION", { itemsToMemorize: 2, distractors: 2, exposureMsPerItem: 500 },
      { items: ["🍎", "🍐", "🍊", "🍋"] }));
    const seen = Array.from(screen.getByLabelText("Imágenes para memorizar").children).map((c) => c.textContent!);
    advance(1000);
    seen.forEach((s) => fireEvent.click(screen.getByRole("button", { name: `Imagen ${s}` })));
    const distractor = ["🍎", "🍐", "🍊", "🍋"].find((s) => !seen.includes(s))!;
    fireEvent.click(screen.getByRole("button", { name: `Imagen ${distractor}` }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar selección" }));
    expect(done).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: false, accuracy: 0.5 }));
  });

  it("n-back: entre un símbolo y el siguiente la pantalla queda vacía un momento", () => {
    vi.useFakeTimers();
    play(item("N_BACK", { n: 1, trials: 4, matchRatio: 0.5, stimulusMs: 2000 }, { symbols: ["A", "B"] }));
    expect(screen.getByText("¿Es igual al símbolo anterior?")).toBeInTheDocument();
    expect(screen.getByLabelText("Elemento actual")).toBeInTheDocument();
    advance(1700);
    expect(screen.queryByLabelText("Elemento actual")).not.toBeInTheDocument();
    advance(400);
    expect(screen.getByLabelText("Elemento actual")).toBeInTheDocument();
    expect(screen.getByLabelText("Símbolo 2 de 4")).toBeInTheDocument();
  });

  it("n-back: sin tocar nada se aciertan los rechazos y se pierden las coincidencias", () => {
    vi.useFakeTimers();
    const done = play(item("N_BACK", { n: 1, trials: 6, matchRatio: 0.5, stimulusMs: 500 }, { symbols: ["A", "B", "C"] }));
    advance(3000);
    const outcome = done.mock.calls[0][0];
    const metrics = outcome.metrics as { hits: number; misses: number; correctRejections: number };
    expect(metrics.hits).toBe(0);
    expect(metrics.misses + metrics.correctRejections).toBe(5);
    expect(outcome.accuracy).toBeCloseTo(metrics.correctRejections / 5);
  });
});

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
