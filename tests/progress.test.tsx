import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProgressScreen } from "../src/screens/ProgressScreen";
import type { CategoryProgress } from "../src/services/api";
import { mentiaApi } from "../src/services/api";
import { periodLabel } from "../src/utils/progressPeriods";

vi.mock("../src/context/AppContext", () => ({ useApp: () => ({ setCurrentTab: vi.fn() }) }));
vi.mock("../src/context/JourneyContext", () => ({
  useJourney: () => ({ token: "token", categories: [], summary: null, gamification: null }),
  categoryName: (_categories: unknown, category: string) => category,
}));
afterEach(() => vi.restoreAllMocks());

it("identifica el mes con año completo y las semanas que cruzan mes o año", () => {
  expect(periodLabel("2026-11-01", "month")).toBe("noviembre de 2026");
  expect(periodLabel("2026-11-16", "week")).toMatch(/16 de nov de 2026.*22 de nov de 2026/);
  expect(periodLabel("2026-12-28", "week")).toMatch(/28 de dic de 2026.*3 de ene de 2027/);
});

it("cambia la consulta y oculta los puntos anteriores durante la carga y si falla", async () => {
  vi.spyOn(mentiaApi, "performance").mockResolvedValue({ categories: [] });
  let finish: (value: CategoryProgress[]) => void;
  let fail: (error: Error) => void;
  const progress = vi.spyOn(mentiaApi, "categoryProgress")
    .mockResolvedValueOnce([{ category: "Memoria", points: [{ periodStart: "2026-11-16", accuracy: .8, avgDifficultyLevel: 2, sessions: 3 }] }])
    .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }))
    .mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
  render(<ProgressScreen />);
  await screen.findByRole("region", { name: "Gráfico de Memoria" });
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "Mes" }));
  expect(progress).toHaveBeenLastCalledWith("token", "month");
  expect(screen.queryByRole("region", { name: "Gráfico de Memoria" })).not.toBeInTheDocument();
  await act(async () => finish([{ category: "Memoria", points: [{ periodStart: "2026-11-01", accuracy: .9, avgDifficultyLevel: 3, sessions: 4 }] }]));
  expect(screen.getByText(/noviembre de 2026: 90%/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "Semana" }));
  await act(async () => fail(new Error("falló")));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Gráfico de Memoria" })).not.toBeInTheDocument();
});
