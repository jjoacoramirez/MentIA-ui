import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProgressScreen } from "../src/screens/ProgressScreen";
import type { CategoryProgress } from "../src/services/api";
import { mentiaApi } from "../src/services/api";
import { progressPeriod, movePeriod, isoWeek, periodLabel } from "../src/utils/progressPeriods";

vi.mock("../src/context/AppContext", () => ({ useApp: () => ({ setCurrentTab: vi.fn() }) }));
vi.mock("../src/context/JourneyContext", () => ({
  useJourney: () => ({ token: "token", categories: [], summary: null, gamification: null }),
  categoryName: (_categories: unknown, category: string) => category,
}));
afterEach(() => vi.restoreAllMocks());

it("identifica el mes con año completo y las semanas que cruzan mes o año", () => {
  expect(isoWeek("2026-11-20")).toEqual({ week: 47, year: 2026 });
  expect(isoWeek("2027-01-01")).toEqual({ week: 53, year: 2026 });
  expect(progressPeriod("week", "2026-11-20")).toMatchObject({ from: "2026-11-16", to: "2026-11-22", granularity: "day" });
  expect(progressPeriod("month", "2028-02-29")).toMatchObject({ from: "2028-02-01", to: "2028-02-29" });
  expect(movePeriod("month", "2026-03-31", -1)).toBe("2026-02-01");
  expect(periodLabel("2026-11-01", "month")).toBe("noviembre de 2026");
  expect(periodLabel("2026-11-16", "week")).toMatch(/16 de nov de 2026.*22 de nov de 2026/);
  expect(periodLabel("2026-12-28", "week")).toMatch(/28 de dic de 2026.*3 de ene de 2027/);
});

it("cambia la consulta y oculta los puntos anteriores durante la carga y si falla", async () => {
  vi.spyOn(Date, "now").mockReturnValue(new Date("2026-11-20T15:00:00Z").getTime());
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T15:00:00Z"));
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
  expect(progress).toHaveBeenLastCalledWith("token", "day", "2026-11-01", "2026-11-20");
  expect(screen.queryByRole("region", { name: "Gráfico de Memoria" })).not.toBeInTheDocument();
  await act(async () => finish([{ category: "Memoria", points: [{ periodStart: "2026-11-01", accuracy: .9, avgDifficultyLevel: 3, sessions: 4 }] }]));
  expect(screen.getByText(/1 de nov de 2026: 90%/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "Semana" }));
  await act(async () => fail(new Error("falló")));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Gráfico de Memoria" })).not.toBeInTheDocument();
});

it("separa precisión y dificultad y no une la línea a través de días sin actividad", async () => {
  const { ProgressLineChart } = await import("../src/components/ProgressLineChart");
  const points = [
    { periodStart: "2026-11-19", accuracy: .6, avgDifficultyLevel: 2, sessions: 1 },
    { periodStart: "2026-11-21", accuracy: .8, avgDifficultyLevel: 3, sessions: 1 },
  ];
  const { container, rerender } = render(<ProgressLineChart name="Memoria" points={points} granularity="day" from="2026-11-19" to="2026-11-21" metric="accuracy" />);
  expect(container.querySelectorAll("circle")).toHaveLength(2);
  const path = container.querySelector("path")!.getAttribute("d")!;
  expect(path.match(/M/g)).toHaveLength(2);
  expect(path).not.toContain("L");
  expect(screen.getByText("60%")).toBeInTheDocument();
  rerender(<ProgressLineChart name="Memoria" points={points} granularity="day" from="2026-11-19" to="2026-11-21" metric="difficulty" />);
  expect(screen.getByText("Dificultad promedio practicada · nivel de los ejercicios realizados")).toBeInTheDocument();
  expect(screen.getByText("2.0")).toBeInTheDocument();
});

it("permite consultar semanas anteriores y bloquea avanzar al futuro", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T15:00:00Z"));
  vi.spyOn(mentiaApi, "performance").mockResolvedValue({ categories: [] });
  const query = vi.spyOn(mentiaApi, "categoryProgress").mockResolvedValue([]);
  render(<ProgressScreen />);
  await screen.findByText(/No hay sesiones completadas/);
  expect(screen.getByLabelText("Período siguiente")).toBeDisabled();
  fireEvent.click(screen.getByLabelText("Período anterior"));
  expect(query).toHaveBeenLastCalledWith("token", "day", "2026-11-09", "2026-11-15");
  expect(screen.getByLabelText("Período siguiente")).not.toBeDisabled();
});
