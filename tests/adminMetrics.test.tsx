import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminMetricsScreen } from "../src/screens/AdminMetricsScreen";

const base = {
  from: "2026-10-19",
  to: "2026-11-17",
  participants: 4,
  activity: [{ day: "2026-11-16", active: 3, started: 4, completed: 3, abandoned: 1 }],
  cohorts: [{ bucket: 1, participants: 4, comparable: 2, improved: 1, meanChange: 0.5 }],
  exercises: [{ code: "STROOP_1", name: "Color y palabra", category: "ATENCION", attempts: 12, players: 3, avgLevel: 2.5, accuracy: 0.8, medianMs: 1500 }],
  options: [{ code: "STROOP_1", name: "Color y palabra", category: "ATENCION", categoryName: "Atención" }],
};

const extra = {
  overview: { registered: 10, newUsers: 3, assessed: 8, trained: 5, reminderUsers: 2, medianSessionSeconds: 245 },
  signups: [{ day: "2026-11-16", users: 2 }],
  hours: [{ hour: 19, started: 6, completed: 5 }, { hour: 8, started: 1, completed: 1 }],
  ageRanges: [{ ageRange: "18-24", users: 7, active: 4 }, { ageRange: "25-30", users: 3, active: 1 }],
  levels: [{ category: "ATENCION", level: 1, users: 2 }, { category: "ATENCION", level: 3, users: 4 }],
  retention: { d1Eligible: 4, d1Returned: 1, d7Eligible: 0, d7Returned: 0 },
};

function mockApi(report: unknown) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input);
    const body = path.includes("/auth/login") ? { accessToken: "t", tokenType: "Bearer", expiresIn: 1, role: "ADMIN" }
      : path.includes("/admin/metrics") ? report : {};
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  }));
}

async function signIn() {
  render(<AdminMetricsScreen />);
  fireEvent.change(screen.getByLabelText("Alias"), { target: { value: "admin" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "una-clave-larga" } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  await screen.findByText(/Entrenamientos · Hora de Argentina/);
}

afterEach(() => vi.unstubAllGlobals());

describe("Panel admin de uso", () => {
  it("muestra cuentas, retención, horarios, rango etario y niveles", async () => {
    mockApi({ ...base, ...extra });
    await signIn();

    const accounts = screen.getByRole("region", { name: "Cuentas" });
    expect(within(accounts).getByText("10")).toBeInTheDocument();
    expect(within(accounts).getByText("3 nuevas en el período")).toBeInTheDocument();
    expect(within(accounts).getByText("80 %")).toBeInTheDocument();
    expect(within(accounts).getByText("4 min 5 s")).toBeInTheDocument();

    const retention = screen.getByRole("region", { name: "Retención" });
    expect(within(retention).getByText("25 %")).toBeInTheDocument();
    expect(within(retention).getByText("1 de 4 personas")).toBeInTheDocument();
    // Nadie tuvo todavía 7 días para volver: no se inventa un porcentaje.
    expect(within(retention).getByText(/Todavía no hay personas/)).toBeInTheDocument();

    expect(screen.getByText(/El pico es a las 19 h/)).toBeInTheDocument();
    expect(screen.getByText("18-24")).toBeInTheDocument();
    expect(screen.getByText("4 (57,14 %)")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Personas por nivel" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nivel medio" })).toBeInTheDocument();
  });

  it("sigue funcionando con una API que todavía no manda los datos nuevos", async () => {
    mockApi(base);
    await signIn();

    expect(screen.getByText("Participantes activos")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Cuentas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Retención" })).not.toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Color y palabra" })).toBeInTheDocument();
  });
});
