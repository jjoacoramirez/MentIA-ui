import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mentiaApi } from "../src/services/api";
import {
  detachReminder,
  disableReminder,
  enableReminder,
  isReminderOn,
  keyToBytes,
  resyncReminder,
} from "../src/services/push";
import { ReminderCard } from "../src/components/ReminderCard";

vi.mock("../src/context/JourneyContext", () => ({ useJourney: () => ({ token: "token-1" }) }));
vi.mock("../src/context/AppContext", () => ({ useApp: () => ({ userStats: { username: "ana" } }) }));

const ENDPOINT = "https://fcm.googleapis.com/fcm/send/abc";

/** Navegador simulado con soporte de push: una sola suscripción que vive en `state`. */
function installBrowser(permission: NotificationPermission = "default", subscribed = false) {
  const state = { subscription: subscribed ? { endpoint: ENDPOINT, unsubscribe: vi.fn(async () => true) } : null };
  const pushManager = {
    getSubscription: vi.fn(async () => state.subscription),
    subscribe: vi.fn(async () => {
      state.subscription = { endpoint: ENDPOINT, unsubscribe: vi.fn(async () => true) };
      return state.subscription;
    }),
  };
  const registration = { pushManager };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { getRegistration: vi.fn(async () => registration), register: vi.fn(async () => registration) },
  });
  (window as unknown as Record<string, unknown>).PushManager = class {};
  const notification = {
    permission,
    // Como en un navegador real: al contestar el pedido, el permiso queda en el valor elegido.
    requestPermission: vi.fn(async () => {
      notification.permission = permission === "denied" ? "denied" : "granted";
      return notification.permission;
    }),
  };
  (window as unknown as Record<string, unknown>).Notification = notification;
  (globalThis as unknown as Record<string, unknown>).Notification = notification;
  return { state, pushManager, notification };
}

function removeBrowserSupport() {
  Reflect.deleteProperty(navigator, "serviceWorker");
  Reflect.deleteProperty(window, "PushManager");
  Reflect.deleteProperty(window, "Notification");
  Reflect.deleteProperty(globalThis, "Notification");
}

beforeEach(() => {
  vi.spyOn(mentiaApi, "pushConfig").mockResolvedValue({ enabled: true, publicKey: "BD5bHl05Qu_Yu8mxUKbg" });
  vi.spyOn(mentiaApi, "subscribePush").mockResolvedValue(undefined);
  vi.spyOn(mentiaApi, "unsubscribePush").mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  removeBrowserSupport();
});

describe("Recordatorios de racha (servicio)", () => {
  it("convierte la clave VAPID base64url a bytes", () => {
    expect(Array.from(keyToBytes("AQID"))).toEqual([1, 2, 3]);
    // «-» y «_» son los reemplazos url-safe de «+» y «/».
    expect(Array.from(keyToBytes("-_8"))).toEqual([251, 255]);
  });

  it("activar pide permiso, suscribe el navegador y avisa al servidor", async () => {
    const { pushManager, notification } = installBrowser();

    expect(await enableReminder("token-1", "ana")).toBe("ok");

    expect(notification.requestPermission).toHaveBeenCalled();
    expect(pushManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
    expect(mentiaApi.subscribePush).toHaveBeenCalledWith("token-1", ENDPOINT);
    expect(await isReminderOn("ana")).toBe(true);
    // La elección es por cuenta: otra cuenta en el mismo navegador no la hereda.
    expect(await isReminderOn("beto")).toBe(false);
  });

  it("si no dan permiso, no suscribe ni llama al servidor", async () => {
    const { pushManager } = installBrowser("denied");

    expect(await enableReminder("token-1", "ana")).toBe("denied");

    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(mentiaApi.subscribePush).not.toHaveBeenCalled();
    expect(await isReminderOn("ana")).toBe(false);
  });

  it("con el servidor sin recordatorios no pide permiso", async () => {
    const { notification } = installBrowser();
    vi.spyOn(mentiaApi, "pushConfig").mockResolvedValue({ enabled: false, publicKey: null });

    expect(await enableReminder("token-1", "ana")).toBe("unavailable");
    expect(notification.requestPermission).not.toHaveBeenCalled();
  });

  it("desactivar borra la suscripción en el servidor y en el navegador", async () => {
    const { state } = installBrowser("granted");
    await enableReminder("token-1", "ana");
    const subscription = state.subscription!;

    await disableReminder("token-1", "ana");

    expect(mentiaApi.unsubscribePush).toHaveBeenCalledWith("token-1", ENDPOINT);
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(await isReminderOn("ana")).toBe(false);
  });

  it("al cerrar sesión desvincula el navegador pero conserva la elección, y al volver lo vincula de nuevo", async () => {
    installBrowser("granted");
    await enableReminder("token-1", "ana");
    vi.mocked(mentiaApi.subscribePush).mockClear();

    await detachReminder("token-1");
    expect(mentiaApi.unsubscribePush).toHaveBeenCalledWith("token-1", ENDPOINT);
    expect(await isReminderOn("ana")).toBe(true);

    await resyncReminder("token-2", "ana");
    expect(mentiaApi.subscribePush).toHaveBeenCalledWith("token-2", ENDPOINT);
  });

  it("otra cuenta en el mismo navegador no se vincula sola", async () => {
    installBrowser("granted");
    await enableReminder("token-1", "ana");
    vi.mocked(mentiaApi.subscribePush).mockClear();

    await resyncReminder("token-2", "beto");

    expect(mentiaApi.subscribePush).not.toHaveBeenCalled();
  });

  it("sin soporte del navegador no falla ni llama al servidor", async () => {
    expect(await enableReminder("token-1", "ana")).toBe("unavailable");
    expect(await isReminderOn("ana")).toBe(false);
    await expect(detachReminder("token-1")).resolves.toBeUndefined();
    expect(mentiaApi.pushConfig).not.toHaveBeenCalled();
  });
});

describe("Cartel de recordatorio", () => {
  it("no se muestra si el navegador no lo soporta", () => {
    const { container } = render(<ReminderCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("no se muestra si el servidor lo tiene apagado", async () => {
    installBrowser();
    vi.spyOn(mentiaApi, "pushConfig").mockResolvedValue({ enabled: false, publicKey: null });
    const { container } = render(<ReminderCard />);
    await waitFor(() => expect(mentiaApi.pushConfig).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("se activa y se desactiva desde el perfil", async () => {
    installBrowser();
    render(<ReminderCard />);

    fireEvent.click(await screen.findByRole("button", { name: "Activar recordatorio" }));
    expect(await screen.findByRole("button", { name: "Desactivar recordatorio" })).toBeInTheDocument();
    expect(mentiaApi.subscribePush).toHaveBeenCalledWith("token-1", ENDPOINT);

    fireEvent.click(screen.getByRole("button", { name: "Desactivar recordatorio" }));
    expect(await screen.findByRole("button", { name: "Activar recordatorio" })).toBeInTheDocument();
    expect(mentiaApi.unsubscribePush).toHaveBeenCalled();
  });

  it("si bloquearon las notificaciones explica cómo permitirlas y no ofrece activar", async () => {
    installBrowser("denied");
    render(<ReminderCard />);

    expect(await screen.findByText(/Bloqueaste las notificaciones/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activar recordatorio" })).not.toBeInTheDocument();
  });

  it("en Inicio se ofrece una sola vez: «Ahora no» lo oculta y lo recuerda", async () => {
    installBrowser();
    const { unmount } = render(<ReminderCard variant="prompt" />);

    fireEvent.click(await screen.findByRole("button", { name: "Ahora no" }));
    expect(screen.queryByRole("region", { name: "Recordatorio de racha" })).not.toBeInTheDocument();

    unmount();
    const { container } = render(<ReminderCard variant="prompt" />);
    await waitFor(() => expect(mentiaApi.pushConfig).toHaveBeenCalledTimes(2));
    expect(container).toBeEmptyDOMElement();
  });
});
