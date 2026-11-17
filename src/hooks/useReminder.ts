import { useCallback, useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useJourney } from "../context/JourneyContext";
import { ApiError, mentiaApi } from "../services/api";
import { disableReminder, enableReminder, isReminderOn, pushPermission, pushSupported } from "../services/push";

export interface ReminderState {
  /** El navegador y el servidor permiten los avisos: si es false, no hay nada para mostrar. */
  available: boolean;
  on: boolean;
  /** El usuario bloqueó los avisos en el navegador: no se puede volver a pedir desde la app. */
  blocked: boolean;
  busy: boolean;
  error: string;
  toggle: () => Promise<void>;
}

/** Estado y acciones de los recordatorios de racha para la cuenta con sesión iniciada. */
export function useReminder(): ReminderState {
  const { token } = useJourney();
  const { userStats } = useApp();
  const username = userStats.username;
  const [serverEnabled, setServerEnabled] = useState(false);
  const [on, setOn] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  return { available: pushSupported() && serverEnabled, on, blocked, busy, error, toggle };
}
