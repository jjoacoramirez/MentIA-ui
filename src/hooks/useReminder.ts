import { useCallback, useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useJourney } from "../context/JourneyContext";
import { ApiError, mentiaApi } from "../services/api";
import { disableReminder, enableReminder, isReminderOn, pushPermission, pushSupported, testLocalNotification } from "../services/push";

export interface ReminderState {
  /** El navegador y el servidor permiten los avisos: si es false, no hay nada para mostrar. */
  available: boolean;
  on: boolean;
  /** El usuario bloqueó los avisos en el navegador: no se puede volver a pedir desde la app. */
  blocked: boolean;
  busy: boolean;
  error: string;
  toggle: () => Promise<void>;
  repair: () => Promise<void>;
  test: () => Promise<void>;
  message: string;
}

/** Estado y acciones de los recordatorios de entrenamiento para la cuenta con sesión iniciada. */
export function useReminder(): ReminderState {
  const { token } = useJourney();
  const { userStats } = useApp();
  const username = userStats.username;
  const [serverEnabled, setServerEnabled] = useState(false);
  const [on, setOn] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !pushSupported()) return;
    let cancelled = false;
    mentiaApi
      .pushConfig(token)
      .then(async (config) => {
        if (cancelled) return;
        setServerEnabled(config.enabled);
        setBlocked(pushPermission() === "denied");
        setOn(await isReminderOn(username));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token, username]);

  const toggle = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (on) {
        await disableReminder(token, username);
        setOn(false);
      } else {
        const result = await enableReminder(token, username);
        setBlocked(result === "denied");
        setOn(result === "ok");
        if (result === "unavailable") setError("Los recordatorios no están disponibles por ahora.");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos cambiar los recordatorios. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }, [token, username, on]);

  const check = useCallback(async (renew: boolean) => {
    if (!token) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (renew) {
        const result = await enableReminder(token, username, true);
        setBlocked(result === "denied");
        setOn(result === "ok");
        if (result === "ok") setMessage("Se renovó el registro de este dispositivo. Volvé a enviar el aviso desde el panel de administración.");
        else setError("No pudimos renovar las notificaciones. Revisá el permiso del navegador y volvé a intentar.");
      } else {
        await testLocalNotification();
        setMessage("Se solicitó la prueba local. Si no aparece, revisá las notificaciones de tu navegador en los ajustes del dispositivo. Esta prueba permite comprobar la recepción en este dispositivo. El envío desde el servidor se prueba desde administración.");
      }
    } catch (failure) {
      setOn(await isReminderOn(username));
      setError(failure instanceof ApiError ? failure.message : "No pudimos completar la prueba. Revisá la conexión y los permisos del navegador.");
    } finally {
      setBusy(false);
    }
  }, [token, username]);

  return { available: pushSupported() && serverEnabled, on, blocked, busy, error, toggle,
    repair: () => check(true), test: () => check(false), message };
}
