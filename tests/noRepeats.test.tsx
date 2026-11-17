import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Game } from "../src/games";
import { pickAvoiding, seededRandom, spreadPicks } from "../src/games/common";
import type { ExerciseType, SessionItem } from "../src/services/api";

function item(exerciseType: ExerciseType, seed: number, params: Record<string, unknown>, content: Record<string, unknown>): SessionItem {
  return {
    sessionItemId: `item-${seed}`, position: 1, exerciseCode: exerciseType, exerciseType, category: "ATENCION",
    modality: "VISUAL", difficultyLevel: 1, variantKey: "v", seed, params, content, instructions: "",
  };
}

const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 1);
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 100) act(() => vi.advanceTimersByTime(100));
};

afterEach(() => vi.useRealTimers());

describe("Sorteo sin repeticiones", () => {
  it("spreadPicks no repite un lugar hasta usar todos, para cualquier semilla", () => {
    for (const seed of seeds) {
      const picks = spreadPicks(seededRandom(seed), 8, 5);
      expect(new Set(picks).size).toBe(5);
      expect(picks.every((p) => p >= 0 && p < 8)).toBe(true);
    }
  });

  it("spreadPicks nunca repite dos seguidos, ni al empezar una vuelta nueva", () => {
    for (const seed of seeds) {
      // 4 lugares y 12 rondas: hay que dar varias vueltas.
      const picks = spreadPicks(seededRandom(seed), 4, 12);
      for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
    }
  });

  it("spreadPicks con un solo lugar no se cuelga", () => {
    expect(spreadPicks(seededRandom(1), 1, 3)).toEqual([0, 0, 0]);
  });

  it("pickAvoiding evita lo indicado y, si no queda nada, elige igual", () => {
    for (const seed of seeds) expect(pickAvoiding(seededRandom(seed), ["A", "B", "C"], ["A", undefined])).not.toBe("A");
    expect(pickAvoiding(seededRandom(1), ["A"], ["A"])).toBe("A");
  });
});

describe("Elemento diferente", () => {
  /** Juega las 5 rondas respondiendo cualquier cosa y devuelve en qué casilla estaba el distinto en cada una. */
  function oddPositions(seed: number) {
    vi.useFakeTimers();
    const { unmount } = render(<Game paused={false} onDone={vi.fn()}
      item={item("ODD_ONE_OUT", seed, { items: 8, timeLimitMs: 6000, similarity: 0 }, { pairs: [["A", "B"]] })} />);
    const positions: number[] = [];
    for (let round = 0; round < 5; round++) {
      const tiles = screen.getAllByRole("button", { name: /^Elemento \d+$/ });
      positions.push(tiles.findIndex((tile) => tile.textContent === "B"));
      fireEvent.click(tiles[0]);
      advance(100);
    }
    unmount();
    return positions;
  }

  it("el distinto cambia de casilla en cada ronda: nunca sale dos veces en el mismo lugar", () => {
    for (const seed of seeds.slice(0, 40)) {
      const positions = oddPositions(seed);
      expect(positions.every((p) => p >= 0)).toBe(true);
      // 8 casillas y 5 rondas: ninguna casilla se repite.
      expect(new Set(positions).size).toBe(5);
    }
  }, 30000);
});

describe("Secuencia", () => {
  it("no muestra el mismo elemento dos veces seguidas", () => {
    for (const seed of seeds.slice(0, 40)) {
      vi.useFakeTimers();
      const { unmount } = render(<Game paused={false} onDone={vi.fn()}
        item={item("REVERSE_SEQUENCE", seed, { sequenceLength: 8, itemDisplayMs: 500 }, { symbols: ["A", "B", "C", "D"] })} />);
      // Se lee cada aparición (hay un hueco vacío entre elementos) hasta que llega el turno de responder.
      const shown: string[] = [];
      let visible = false;
      for (let t = 0; t < 20000 && !screen.queryByLabelText("Tu respuesta"); t += 50) {
        const element = screen.queryByLabelText("Elemento de la secuencia");
        if (element && !visible) shown.push(element.textContent ?? "");
        visible = element !== null;
        act(() => vi.advanceTimersByTime(50));
      }
      expect(shown).toHaveLength(8);
      unmount();
      vi.useRealTimers();
      for (let i = 1; i < shown.length; i++) expect(shown[i]).not.toBe(shown[i - 1]);
    }
  }, 30000);
});
