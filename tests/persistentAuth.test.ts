import { afterEach, expect, it, vi } from "vitest";
import { clearAuth, loadAuth, saveAuth, shouldRenewAuth } from "../src/context/authStorage";
import { apiRequest, setReplacementTokenHandler, setUnauthorizedHandler } from "../src/services/api";

const auth = { token: "token-test", username: "explorador", role: "USER" as const };
afterEach(() => { clearAuth(); setReplacementTokenHandler(null); setUnauthorizedHandler(null); vi.unstubAllGlobals(); });

it("migra el acceso de la pestaña y lo conserva al cerrar sessionStorage", () => {
  sessionStorage.setItem("mentia_auth_v1", JSON.stringify(auth));
  expect(loadAuth()).toEqual(auth);
  expect(sessionStorage.getItem("mentia_auth_v1")).toBeNull();
  sessionStorage.clear();
  expect(loadAuth()).toEqual(auth);
  clearAuth();
  expect(loadAuth()).toBeNull();
});

it("renueva una sesión antigua o próxima a vencer, pero nunca considera renovado un token vencido", () => {
  const now = Date.now();
  expect(shouldRenewAuth(auth, now)).toBe(true);
  expect(shouldRenewAuth({ ...auth, renewedAt: now, expiresAt: now + 30 * 864e5 }, now)).toBe(false);
  expect(shouldRenewAuth({ ...auth, renewedAt: now - 2 * 864e5, expiresAt: now + 28 * 864e5 }, now)).toBe(true);
  expect(shouldRenewAuth({ ...auth, renewedAt: now, expiresAt: now + 3600000 }, now)).toBe(true);
  expect(shouldRenewAuth({ ...auth, expiresAt: now - 1 }, now)).toBe(false);
});

it("reintenta una request con token anterior después de renovar sin cerrar la sesión", async () => {
  const expired = vi.fn();
  const fetch = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 401 })).mockResolvedValueOnce(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetch);
  setUnauthorizedHandler(expired);
  setReplacementTokenHandler(async () => "token-renovado");
  await expect(apiRequest("/profile", {}, "token-anterior")).resolves.toEqual({ ok: true });
  expect(new Headers(fetch.mock.calls[1][1].headers).get("Authorization")).toBe("Bearer token-renovado");
  expect(expired).not.toHaveBeenCalled();
});

it("un 401 definitivo elimina el acceso mediante el handler y nunca reintenta en bucle", async () => {
  saveAuth(auth);
  const fetch = vi.fn(async () => new Response("{}", { status: 401 }));
  vi.stubGlobal("fetch", fetch);
  setReplacementTokenHandler(async () => "nuevo");
  setUnauthorizedHandler(() => clearAuth());
  await expect(apiRequest("/profile", {}, auth.token)).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(loadAuth()).toBeNull();
});
