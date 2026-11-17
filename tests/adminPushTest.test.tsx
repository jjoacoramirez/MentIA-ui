import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminPushTest, describeTestPush } from "../src/components/AdminPushTest";
import { ApiError, mentiaApi } from "../src/services/api";

afterEach(() => vi.restoreAllMocks());

function send(alias: string) {
  fireEvent.change(screen.getByLabelText("Alias de la cuenta"), { target: { value: alias } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar aviso de prueba" }));
}

describe("Probar notificaciones (panel admin)", () => {
  it("manda el aviso al alias en minúsculas y cuenta los dispositivos", async () => {
    const spy = vi.spyOn(mentiaApi, "sendTestPush").mockResolvedValue({ devices: 2, sent: 2, removed: 0, failed: 0 });
    render(<AdminPushTest token="t" />);

    send("  Ana.Perez ");

    expect(await screen.findByRole("status")).toHaveTextContent("Aviso enviado a 2 dispositivos.");
    expect(spy).toHaveBeenCalledWith("t", "ana.perez");
  });

  it("no habilita el botón sin alias", () => {
    render(<AdminPushTest token="t" />);
    expect(screen.getByRole("button", { name: "Enviar aviso de prueba" })).toBeDisabled();
  });

  it("avisa si la cuenta no activó el recordatorio", async () => {
    vi.spyOn(mentiaApi, "sendTestPush").mockResolvedValue({ devices: 0, sent: 0, removed: 0, failed: 0 });
    render(<AdminPushTest token="t" />);

    send("ana");

    expect(await screen.findByRole("status")).toHaveTextContent("no tiene el recordatorio activado");
  });

  it("muestra el error del servidor cuando el alias no existe", async () => {
    vi.spyOn(mentiaApi, "sendTestPush").mockRejectedValue(new ApiError(404, "USER_NOT_FOUND", "No existe una cuenta con ese alias."));
    render(<AdminPushTest token="t" />);

    send("nadie");

    expect(await screen.findByRole("alert")).toHaveTextContent("No existe una cuenta con ese alias.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("describe cada resultado en palabras, sin datos técnicos", () => {
    expect(describeTestPush({ devices: 1, sent: 1, removed: 0, failed: 0 })).toBe("Aviso enviado a 1 dispositivo.");
    expect(describeTestPush({ devices: 3, sent: 1, removed: 1, failed: 1 })).toBe(
      "Aviso enviado a 1 dispositivo. 1 suscripción ya no existía y se borró. 1 envío falló; se puede reintentar.",
    );
  });
});
