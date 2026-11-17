import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminContentGenerator, describeGeneration } from "../src/components/AdminContentGenerator";
import { SessionFeedbackCard } from "../src/components/SessionFeedbackCard";
import { ApiError, mentiaApi } from "../src/services/api";

afterEach(() => vi.restoreAllMocks());

describe("Comentario de cierre de sesión", () => {
  it("muestra el texto y avisa que lo escribió la IA, sin afirmar nada sobre capacidades", async () => {
    vi.spyOn(mentiaApi, "sessionFeedback").mockResolvedValue({ text: "¡Buena sesión! Subiste de nivel en Atención.", source: "AI" });
    render(<SessionFeedbackCard token="t" sessionId="s-1" />);

    expect(screen.getByRole("status")).toHaveTextContent("Estamos escribiendo un comentario");
    expect(await screen.findByText("¡Buena sesión! Subiste de nivel en Atención.")).toBeInTheDocument();
    expect(screen.getByText(/Escrito con IA/)).toHaveTextContent("No es una evaluación de tus capacidades");
  });

  it("con el texto básico no menciona a la IA", async () => {
    vi.spyOn(mentiaApi, "sessionFeedback").mockResolvedValue({ text: "Sesión completa: 6 actividades con 70% de precisión.", source: "BASIC" });
    render(<SessionFeedbackCard token="t" sessionId="s-2" />);

    expect(await screen.findByText(/Sesión completa/)).toBeInTheDocument();
    expect(screen.queryByText(/Escrito con IA/)).not.toBeInTheDocument();
  });

  it("si el pedido falla no muestra nada: el resultado no depende del comentario", async () => {
    vi.spyOn(mentiaApi, "sessionFeedback").mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "Error"));
    const { container } = render(<SessionFeedbackCard token="t" sessionId="s-3" />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("no pide nada sin sesión iniciada", () => {
    const spy = vi.spyOn(mentiaApi, "sessionFeedback");
    render(<SessionFeedbackCard token={null} sessionId="s-4" />);
    expect(spy).not.toHaveBeenCalled();
  });

  it("un doble montaje no genera el comentario dos veces", async () => {
    const spy = vi.spyOn(mentiaApi, "sessionFeedback").mockResolvedValue({ text: "Un comentario de prueba largo.", source: "BASIC" });
    render(<><SessionFeedbackCard token="t" sessionId="s-5" /><SessionFeedbackCard token="t" sessionId="s-5" /></>);

    await screen.findAllByText("Un comentario de prueba largo.");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("Generar contenido con IA (panel admin)", () => {
  it("pide el tipo y la cantidad elegidos y resume el lote", async () => {
    const spy = vi.spyOn(mentiaApi, "generateContent").mockResolvedValue({
      requested: 2,
      created: [{ exerciseCode: "X", variantKey: "ia-naturaleza-1a2b3", theme: "naturaleza", active: true }],
      rejected: 1,
      stoppedReason: null,
    });
    render(<AdminContentGenerator token="t" />);

    fireEvent.change(screen.getByLabelText("Ejercicio"), { target: { value: "N_BACK" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Generar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Se creó 1 variante nueva. 1 no pasó la validación y se descartó.");
    expect(screen.getByText("naturaleza")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("t", "N_BACK", 3);
  });

  it("marca lo que quedó inactivo para revisar", async () => {
    vi.spyOn(mentiaApi, "generateContent").mockResolvedValue({
      requested: 1,
      created: [{ exerciseCode: "X", variantKey: "ia-a-1", theme: "frutas", active: false }],
      rejected: 0,
      stoppedReason: null,
    });
    render(<AdminContentGenerator token="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Generar" }));

    expect(await screen.findByText(/inactiva: falta revisarla/)).toBeInTheDocument();
  });

  it("muestra el error cuando la IA está apagada", async () => {
    vi.spyOn(mentiaApi, "generateContent").mockRejectedValue(new ApiError(503, "AI_UNAVAILABLE", "La IA está desactivada en el servidor."));
    render(<AdminContentGenerator token="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Generar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La IA está desactivada en el servidor.");
  });

  it("describe un lote cortado a la mitad", () => {
    expect(describeGeneration({ requested: 3, created: [], rejected: 0, stoppedReason: "LIMIT_EXCEEDED" })).toBe(
      "No se creó ninguna variante. Se cortó antes de terminar: se alcanzó el límite de gasto de IA.",
    );
  });
});
