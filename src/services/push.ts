import { mentiaApi } from "./api";

/**
 * Recordatorios de racha por web push. El navegador entrega una URL de suscripción y el servidor la usa para avisar
 * aunque la app esté cerrada. No se piden ni se guardan datos personales: solo esa URL, atada a la cuenta.
 *
 * Todo es "mejor esfuerzo": si el navegador no lo soporta o el servidor lo tiene apagado, la app funciona igual.
 */

const flagKey = (username: string) => `mentia.push.enabled.${username}`;

/** Recordar la elección por cuenta, con try/catch: el storage puede no estar disponible. */
function readFlag(username: string): boolean {
  try {
    return localStorage.getItem(flagKey(username)) === "1";
  } catch {
    return false;
  }
}

function writeFlag(username: string, on: boolean) {
  try {
    if (on) localStorage.setItem(flagKey(username), "1");
    else localStorage.removeItem(flagKey(username));
  } catch {
    /* sin storage: se vuelve a pedir en la próxima sesión */
  }
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** "default" (no se pidió), "granted" o "denied". */
export function pushPermission(): NotificationPermission {
  return pushSupported() ? Notification.permission : "denied";
}

/** Convierte la clave VAPID (base64url) al formato que pide `pushManager.subscribe`. */
export function keyToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/sw.js")) ?? navigator.serviceWorker.register("/sw.js");
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await registration();
  return reg.pushManager.getSubscription();
}

/** True si esta cuenta eligió recibir avisos y este navegador sigue suscripto. */
export async function isReminderOn(username: string): Promise<boolean> {
  if (!pushSupported() || !readFlag(username) || pushPermission() !== "granted") return false;
  try {
    return (await currentSubscription()) !== null;
  } catch {
    return false;
  }
}

export type EnableResult = "ok" | "denied" | "unavailable";

/** Pide permiso, suscribe este navegador y le avisa al servidor. */
export async function enableReminder(token: string, username: string): Promise<EnableResult> {
  if (!pushSupported()) return "unavailable";
  const config = await mentiaApi.pushConfig(token);
  if (!config.enabled || !config.publicKey) return "unavailable";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const reg = await registration();
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(config.publicKey) }));
  await mentiaApi.subscribePush(token, subscription.endpoint);
  writeFlag(username, true);
  return "ok";
}

/** Apaga los avisos: se borra en el servidor y se cancela la suscripción del navegador. */
export async function disableReminder(token: string, username: string): Promise<void> {
  writeFlag(username, false);
  if (!pushSupported()) return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  await mentiaApi.unsubscribePush(token, subscription.endpoint).catch(() => undefined);
  await subscription.unsubscribe().catch(() => undefined);
}

/**
 * Al iniciar sesión con los avisos ya elegidos, vuelve a registrar este navegador (es idempotente). Hace falta
 * porque al cerrar sesión se lo desvincula de la cuenta: si no, quien use el dispositivo después recibiría sus avisos.
 */
export async function resyncReminder(token: string, username: string): Promise<void> {
  if (!(await isReminderOn(username))) return;
  const subscription = await currentSubscription();
  if (subscription) await mentiaApi.subscribePush(token, subscription.endpoint).catch(() => undefined);
}

/** Al cerrar sesión: el navegador deja de estar atado a la cuenta, pero la elección queda guardada. */
export async function detachReminder(token: string): Promise<void> {
  if (!pushSupported()) return;
  try {
    const subscription = await currentSubscription();
    if (subscription) await mentiaApi.unsubscribePush(token, subscription.endpoint);
  } catch {
    /* si falla, el servidor lo reasigna cuando otra cuenta active los avisos */
  }
}
