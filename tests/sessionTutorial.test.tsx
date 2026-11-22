import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GameSessionScreen } from "../src/screens/GameSessionScreen";

const { recordAttempt } = vi.hoisted(() => ({ recordAttempt: vi.fn() }));
vi.mock("../src/context/AppContext", () => ({ useApp: () => ({ setCurrentTab: vi.fn() }) }));
vi.mock("../src/context/JourneyContext", () => ({
  categoryName: () => "Atención",
  useJourney: () => ({
    session: { items: [{ sessionItemId: "first", exerciseType: "STROOP", category: "ATENCION", difficultyLevel: 1, params: {}, instructions: "Consigna original" }] },
    doneItems: [], recordAttempt, categories: [], assessment: false, busy: false,
  }),
}));
vi.mock("../src/games", async (original) => ({
  ...await original<typeof import("../src/games")>(),
  Game: () => <p>Juego real iniciado</p>,
}));

it("el ejemplo queda en la explicación y nunca inicia ni registra una actividad por su cuenta", () => {
  vi.useFakeTimers();
  render(<GameSessionScreen />);
  expect(screen.getByRole("region", { name: "Cómo jugar" })).toBeInTheDocument();
  for (let i = 0; i < 10; i++) act(() => vi.advanceTimersByTime(4500));
  expect(screen.queryByText("Juego real iniciado")).not.toBeInTheDocument();
  expect(recordAttempt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Comenzar actividad" }));
  expect(screen.getByText("Juego real iniciado")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Cómo jugar" })).not.toBeInTheDocument();
});
