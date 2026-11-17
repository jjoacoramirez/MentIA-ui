import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../src/App";
import { installFakeApi } from "./fakeApi";

const PASSWORD = "una-clave-larga";
let api: ReturnType<typeof installFakeApi>;

beforeEach(() => {
  api = installFakeApi();
  sessionStorage.clear();
});

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}
async function clickWhenReady(name: string | RegExp) {
  fireEvent.click(await screen.findByRole("button", { name }, { timeout: 4000 }));
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function register(alias = "explorador_01") {
  render(<App />);
  click("Comenzar");
  fill("Alias", alias);
  fill("Contraseña", PASSWORD);
  fill("Repetir contraseña", PASSWORD);
  click("Crear cuenta");
  expect(await screen.findByText("7KQ2M-X9PTD-4HBWE-RC6ZN")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  fireEvent.click(screen.getByLabelText("Ya guardé el código"));
  click("Continuar");
  expect(await screen.findByRole("heading", { name: "Tu entrenamiento" })).toBeInTheDocument();
}

async function login(alias: string, password = PASSWORD) {
  render(<App />);
  click("Ya tengo una cuenta");
  fill("Alias", alias);
  fill("Contraseña", password);
  click("Ingresar");
}

/** Las actividades simuladas son "Secuencia inversa" de dos elementos iguales ("A"). */
async function playSession() {
  for (let i = 0; i < 2; i++) {
    await clickWhenReady("Comenzar actividad");
    await clickWhenReady("Elegir A");
    click("Elegir A");
    click("Confirmar respuesta");
    if (i === 0) await clickWhenReady("Siguiente actividad");
  }
  await clickWhenReady("Ver resultados");
}

describe("Recorrido contra la API", () => {
  it("registra, configura, hace la evaluación y muestra resultado, historial y logros", async () => {
    await register();
    fireEvent.click(screen.getByRole("combobox", { name: "Duración preferida" }));
    fireEvent.click(screen.getByRole("option", { name: "15 minutos" }));
    click("Guardar y continuar");
    await clickWhenReady("Comenzar evaluación");
    expect(await screen.findByRole("banner", { name: "Controles del ejercicio" })).toBeInTheDocument();
    await playSession();

    expect(await screen.findByRole("heading", { name: "Evaluación completada" })).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.getByText("+25")).toBeInTheDocument();
    expect(screen.getByText(/nivel 3 ↑ 5/)).toBeInTheDocument();
    expect(screen.getByText("★ Primer paso")).toBeInTheDocument();
    expect(api.calls.filter((c) => c.path.endsWith("/attempts"))).toHaveLength(2);
    expect(api.calls.find((c) => c.method === "PUT" && c.path === "/profile")?.body).toEqual({
      sessionMinutes: 15, goals: ["ATENCION", "MEMORIA_TRABAJO", "MEMORIA_VISUAL"], onboardingCompleted: true,
    });

    click("Continuar");
    expect(await screen.findByText("Hola, explorador_01")).toBeInTheDocument();
    click("Progreso");
    click("Historial");
    await clickWhenReady(/Evaluación inicial · Completada/);
    expect(await screen.findByRole("heading", { name: "Evaluación completada" })).toBeInTheDocument();
    click("Progreso");
    click("Logros");
    expect(await screen.findByText(/Obtenido/)).toBeInTheDocument();

    click("Perfil");
    expect(screen.getByText("15 min / sesión")).toBeInTheDocument();
    click("Cerrar sesión en este dispositivo");
    expect(await screen.findByRole("button", { name: "Comenzar" })).toBeInTheDocument();
    expect(sessionStorage.getItem("mentia_auth_v1")).toBeNull();
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(PASSWORD);
    expect(api.calls.some((c) => c.path === "/auth/logout")).toBe(true);
  });

  it("sin evaluación el servidor pide hacerla antes de entrenar", async () => {
    await register("sin_evaluar");
    click("Guardar y continuar");
    await clickWhenReady("Hacerla más tarde");
    expect(await screen.findByText("Hola, sin_evaluar")).toBeInTheDocument();
    click("Entrenar");
    await clickWhenReady("Comenzar sesión");
    expect(await screen.findByText("Antes de entrenar necesitás completar la evaluación inicial.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evaluación inicial" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saltear (admin)" })).not.toBeInTheDocument();
  });

  it("solo un admin puede saltear la evaluación", async () => {
    api.users.set("admin_01", {
      password: PASSWORD, role: "ADMIN", hasLevels: false,
      profile: { ageRange: "18-24", sessionMinutes: 10, goals: ["ATENCION"], onboardingCompleted: true, assessmentCompleted: false },
    });
    await login("admin_01");
    expect(await screen.findByText("Hola, admin_01")).toBeInTheDocument();
    click("Perfil");
    click("Hacer evaluación inicial");
    await clickWhenReady("Saltear (admin)");
    expect(await screen.findByText("Hola, admin_01")).toBeInTheDocument();
    expect(api.calls.some((c) => c.path === "/assessment/skip")).toBe(true);
  });

  it("solo un admin ve el panel con los datos agregados por constancia", async () => {
    api.users.set("admin_02", {
      password: PASSWORD, role: "ADMIN", hasLevels: true,
      profile: { ageRange: "18-24", sessionMinutes: 10, goals: ["ATENCION"], onboardingCompleted: true, assessmentCompleted: true },
    });
    await login("admin_02");
    await screen.findByText("Hola, admin_02");
    click("Panel admin");
    expect(await screen.findByRole("heading", { name: "Detalle por grupo" })).toBeInTheDocument();
    expect(screen.getByText("Sesiones completadas").previousSibling).toHaveTextContent("30");
    const row = screen.getAllByRole("row", { name: /4 a 7 días/ })[0];
    expect(row).toHaveTextContent("+15 pp");
    expect(row).toHaveTextContent("+1.25");
    expect(screen.getByRole("button", { name: "Descargar CSV" })).toBeInTheDocument();
  });

  it("un usuario común no tiene acceso al panel admin", async () => {
    api.users.set("comun_01", {
      password: PASSWORD, role: "USER", hasLevels: true,
      profile: { ageRange: "18-24", sessionMinutes: 10, goals: ["ATENCION"], onboardingCompleted: true, assessmentCompleted: true },
    });
    await login("comun_01");
    await screen.findByText("Hola, comun_01");
    expect(screen.queryByRole("button", { name: "Panel admin" })).not.toBeInTheDocument();
  });

  it("desde Juegos se entrena un área sola o todas juntas", async () => {
    api.users.set("por_area", {
      password: PASSWORD, role: "USER", hasLevels: true,
      profile: { ageRange: "25-30", sessionMinutes: 10, goals: ["ATENCION"], onboardingCompleted: true, assessmentCompleted: true },
    });
    await login("por_area");
    await screen.findByText("Hola, por_area");
    click("Juegos");
    expect(await screen.findByText("35/100 puntos en este nivel")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progreso en el nivel de Atención" })).toHaveAttribute("aria-valuenow", "35");
    await clickWhenReady("Jugar Atención");
    await clickWhenReady("Comenzar actividad");
    expect(api.calls.find((c) => c.method === "POST" && c.path === "/sessions")?.body).toEqual({ category: "ATENCION" });

    await clickWhenReady("Salir");
    click("Abandonar sesión");
    await screen.findByText(/Entrenamiento · Abandonada/);
    click("Juegos");
    await clickWhenReady("Jugar en mi nivel");
    await clickWhenReady("Comenzar actividad");
    expect(api.calls.filter((c) => c.method === "POST" && c.path === "/sessions").at(-1)?.body).toBeUndefined();
  });

  it("abandonar una sesión la deja en el historial sin resultado", async () => {
    api.users.set("entrena", {
      password: PASSWORD, role: "USER", hasLevels: true,
      profile: { ageRange: "25-30", sessionMinutes: 10, goals: ["ATENCION"], onboardingCompleted: true, assessmentCompleted: true },
    });
    await login("entrena");
    await screen.findByText("Hola, entrena");
    click("Entrenar");
    await clickWhenReady("Comenzar sesión");
    await clickWhenReady("Salir");
    click("Abandonar sesión");
    expect(await screen.findByText(/Entrenamiento · Abandonada/)).toBeInTheDocument();
    expect(api.calls.some((c) => c.method === "POST" && /\/sessions\/.+\/abandon$/.test(c.path))).toBe(true);
  });

  it("muestra el error del servidor con credenciales inválidas", async () => {
    await login("nadie", "otra-clave-larga");
    expect(await screen.findByRole("alert")).toHaveTextContent("El nombre de usuario o la contraseña no son correctos.");
  });

  it("recupera el acceso con el código y muestra el nuevo una sola vez", async () => {
    api.users.set("olvido", {
      password: "clave-vieja-123", role: "USER", hasLevels: true,
      profile: { ageRange: "18-24", sessionMinutes: 10, goals: [], onboardingCompleted: true, assessmentCompleted: true },
    });
    render(<App />);
    click("Ya tengo una cuenta");
    click("Olvidé mi contraseña");
    fill("Alias", "olvido");
    fill("Código de recuperación", "7KQ2M-X9PTD-4HBWE-RC6ZN");
    fill("Nueva contraseña", PASSWORD);
    fill("Repetir contraseña", PASSWORD);
    click("Restablecer contraseña");
    expect(await screen.findByText("ABCDE-FGHJK-LMNPQ-RSTUV")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Ya guardé el código"));
    click("Continuar");
    expect(await screen.findByText("Hola, olvido")).toBeInTheDocument();
  });

  it("al recargar restaura la sesión de la pestaña, y si el token venció vuelve al ingreso", async () => {
    api.users.set("recarga", {
      password: PASSWORD, role: "USER", hasLevels: true,
      profile: { ageRange: "18-24", sessionMinutes: 20, goals: ["ATENCION"], onboardingCompleted: true, assessmentCompleted: true },
    });
    await login("recarga");
    await screen.findByText("Hola, recarga");

    // Recargar: se desmonta y se vuelve a montar con lo guardado en sessionStorage.
    expect(sessionStorage.getItem("mentia_auth_v1")).not.toBeNull();
    cleanup();
    render(<App />);
    expect(await screen.findByText("Hola, recarga")).toBeInTheDocument();

    // El token deja de valer (por ejemplo, venció): la próxima request devuelve 401.
    api.fetchMock.mockImplementationOnce(async () =>
      new Response(JSON.stringify({ status: 401, code: "UNAUTHORIZED", title: "No autenticado" }), { status: 401 }));
    click("Progreso");
    expect(await screen.findByText(/Tu sesión se cerró o venció/)).toBeInTheDocument();
    await waitFor(() => expect(sessionStorage.getItem("mentia_auth_v1")).toBeNull());
  });
});
