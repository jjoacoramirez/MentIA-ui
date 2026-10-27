import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../src/App";
function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}
function enter() {
  render(<App />);
  click("Comenzar");
  fireEvent.change(screen.getByLabelText("Alias"), {
    target: { value: "explorador_01" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "solo-demo-12345" },
  });
  fireEvent.change(screen.getByLabelText("Repetir contraseña"), {
    target: { value: "solo-demo-12345" },
  });
  click("Crear cuenta de ejemplo");
  expect(screen.getByText(/^DEMO-/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Continuar" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByLabelText("Ya guardé el código"));
  click("Continuar");
  fireEvent.click(screen.getByRole("combobox", { name: "Duración preferida" }));
  fireEvent.click(screen.getByRole("option", { name: "15 minutos" }));
  click("Guardar y continuar");
}
function playRound(correct = true) {
  const target = screen
    .getByLabelText("Secuencia para memorizar")
    .textContent!.split("");
  act(() => vi.advanceTimersByTime(6000));
  for (const s of correct ? target : Array(4).fill(target[0]))
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(`^Símbolo \\d: ${s}$`) }),
    );
  click("Confirmar respuesta");
}
describe("Recorridos de MentIA", () => {
  it("completa evaluación con aciertos y errores, resultados, historial y cierre de sesión", () => {
    vi.useFakeTimers();
    enter();
    click("Comenzar evaluación de ejemplo");
    expect(screen.getByRole("banner", { name: "Controles del ejercicio" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ir al inicio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Avance de sesión" })).toHaveAttribute("aria-valuenow", "0");
    playRound(false);
    expect(screen.getByText("Seguí practicando")).toBeInTheDocument();
    click("Siguiente secuencia");
    playRound();
    click("Siguiente secuencia");
    playRound();
    click("Ver resultados");
    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("+50")).toBeInTheDocument();
    click("Continuar");
    expect(screen.getByText("Hola, explorador_01")).toBeInTheDocument();
    click("Historial");
    expect(
      screen.getByRole("button", { name: /Evaluación inicial · Completada/ }),
    ).toBeInTheDocument();
    click("Entrenar");
    click("Comenzar sesión de ejemplo");
    click("Pausar");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(20000));
    click("Continuar sesión");
    expect(screen.getByText("6 s")).toBeInTheDocument();
    click("Salir");
    click("Abandonar sesión");
    expect(screen.getByText(/Entrenamiento · Abandonada/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Secciones de progreso" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Historial" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Progreso" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("combobox", { name: "Mostrar" }));
    fireEvent.click(screen.getByRole("option", { name: "Completadas" }));
    expect(screen.queryByText(/Entrenamiento · Abandonada/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("combobox", { name: "Mostrar" }));
    fireEvent.click(screen.getByRole("option", { name: "Todas las sesiones" }));
    click("Logros");
    expect(screen.getByRole("heading", { name: "Tus logros" })).toBeInTheDocument();
    click("Volver");
    expect(screen.getByRole("heading", { name: "Tu progreso" })).toBeInTheDocument();
    click("Perfil");
    expect(screen.getByText("15 min / sesión")).toBeInTheDocument();
    click("Cerrar sesión en este dispositivo");
    expect(
      screen.getByRole("button", { name: "Comenzar" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("password")).toBeNull();
  });
  it("la biblioteca asigna el nivel y el siguiente entrenamiento pasa de cuatro a cinco objetos", () => {
    vi.useFakeTimers();
    enter();
    click("Comenzar evaluación de ejemplo");
    for (let i = 0; i < 3; i++) { playRound(); click(i === 2 ? "Ver resultados" : "Siguiente secuencia"); }
    click("Continuar");
    click("Juegos");
    expect(screen.getByText("Memoria · Nivel 1")).toBeInTheDocument();
    for (let session = 0; session < 2; session++) {
      click("Jugar en mi nivel");
      expect(screen.getByLabelText("Secuencia para memorizar").children).toHaveLength(4);
      for (let i = 0; i < 3; i++) { playRound(); click(i === 2 ? "Ver resultados" : "Siguiente secuencia"); }
      click("Continuar");
      click("Juegos");
    }
    expect(screen.getByText("Memoria · Nivel 2")).toBeInTheDocument();
    click("Jugar en mi nivel");
    expect(screen.getByLabelText("Secuencia para memorizar").children).toHaveLength(5);
    playRound();
    expect(screen.getByText("¡Secuencia correcta!")).toBeInTheDocument();
  });
  it("requiere alias válido y coincidencia de contraseñas", () => {
    render(<App />);
    click("Comenzar");
    fireEvent.change(screen.getByLabelText("Alias"), {
      target: { value: "x" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "solo-demo-12345" },
    });
    fireEvent.change(screen.getByLabelText("Repetir contraseña"), {
      target: { value: "solo-demo-12345" },
    });
    click("Crear cuenta de ejemplo");
    expect(screen.getByRole("alert")).toHaveTextContent("alias de 3 a 30");
    fireEvent.change(screen.getByLabelText("Alias"), {
      target: { value: "demo" },
    });
    fireEvent.change(screen.getByLabelText("Repetir contraseña"), {
      target: { value: "otra-clave-12345" },
    });
    click("Crear cuenta de ejemplo");
    expect(screen.getByRole("alert")).toHaveTextContent("no coinciden");
  });
  it("simula recuperación sin email y muestra el nuevo código una sola vez", () => {
    render(<App />);
    click("Ya tengo una cuenta");
    click("Olvidé mi contraseña");
    fireEvent.change(screen.getByLabelText("Alias"), {
      target: { value: "demo" },
    });
    fireEvent.change(screen.getByLabelText("Código de recuperación"), {
      target: { value: "DEMO-EJEMPLO" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "solo-demo-12345" },
    });
    fireEvent.change(screen.getByLabelText("Repetir contraseña"), {
      target: { value: "solo-demo-12345" },
    });
    click("Simular restablecimiento");
    expect(screen.getByText(/^DEMO-/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Ya guardé el código"));
    click("Continuar");
    expect(screen.queryByText(/^DEMO-/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");
  });
  it("cambia el tema global y no inventa datos por categoría", () => {
    enter();
    click("Comenzar evaluación de ejemplo");
    click("Salir");
    click("Abandonar sesión");
    click("Perfil");
    const light = screen.getByText("Claro").closest("button")!;
    fireEvent.click(light);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    fireEvent.click(screen.getByText("Oscuro").closest("button")!);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    click("Progreso");
    expect(screen.getAllByText("Sin datos aún")).toHaveLength(3);
    expect(
      screen.getByText("Completá una sesión para ver tu evolución."),
    ).toBeInTheDocument();
  });
});
