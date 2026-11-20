import React, { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { InstallAppCard, InstallAppProvider } from "../src/components/InstallApp";

it("recuerda la oferta antes de abrir el perfil e instala solo al pulsar el botón", async () => {
  function Profile() {
    const [open, setOpen] = useState(false);
    return <><button onClick={() => setOpen(true)}>Perfil</button>{open && <InstallAppCard />}</>;
  }
  render(<InstallAppProvider><Profile /></InstallAppProvider>);
  const offer = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: "accepted" }),
  });
  act(() => { window.dispatchEvent(offer); });
  expect(offer.defaultPrevented).toBe(true);
  expect(offer.prompt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Perfil"));
  await act(async () => { fireEvent.click(screen.getByText("Instalar MentIA")); });
  expect(offer.prompt).toHaveBeenCalledOnce();
  act(() => { window.dispatchEvent(new Event("appinstalled")); });
  expect(screen.queryByText("MentIA en tu dispositivo")).not.toBeInTheDocument();
});
