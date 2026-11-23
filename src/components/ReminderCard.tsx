import React, { useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { useReminder } from "../hooks/useReminder";

const DISMISS_KEY = "mentia.reminder-prompt.dismissed";

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Recordatorio de entrenamiento por notificación. En "settings" (Perfil) se puede activar y desactivar siempre; en "prompt"
 * (Inicio) solo se ofrece una vez y se puede descartar. Si el navegador o el servidor no lo soportan, no se muestra.
 */
export function ReminderCard({ variant = "settings", className = "" }: { variant?: "settings" | "prompt"; className?: string }) {
  const reminder = useReminder();
  const [dismissed, setDismissed] = useState(wasDismissed);

  if (!reminder.available) return null;
  if (variant === "prompt" && (reminder.on || reminder.blocked || dismissed)) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* sin storage: vuelve a aparecer en la próxima visita */
    }
  }

  return (
    <section className={`flow-card ${className}`} aria-label="Recordatorio de entrenamiento">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 text-accent">{reminder.on ? <Bell size={20} /> : <BellOff size={20} />}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-space font-bold mb-1">Recordatorio de entrenamiento</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            {reminder.on
              ? "Te avisamos a las 19:00 (hora de Argentina) si todavía no entrenaste ese día, aunque aún no tengas racha. Un aviso por dispositivo al día como máximo."
              : "¿Querés un recordatorio para empezar o seguir entrenando? Te avisamos a las 19:00 (hora de Argentina) si todavía no entrenaste ese día. Un aviso por dispositivo al día como máximo, y lo apagás cuando quieras."}
          </p>
          {reminder.blocked && (
            <p className="text-sm mb-3">Bloqueaste las notificaciones en este navegador. Para activarlas, permitilas desde los ajustes del sitio.</p>
          )}
          {reminder.error && <p role="alert" className="text-rose-600 dark:text-rose-300 text-sm mb-3">{reminder.error}</p>}
          {reminder.message && <p role="status" className="text-sm mb-3">{reminder.message}</p>}
          {!reminder.blocked && (
            <button className={reminder.on ? "flow-secondary" : "flow-primary"} disabled={reminder.busy} onClick={reminder.toggle}>
              {reminder.busy ? "Un momento…" : reminder.on ? "Desactivar recordatorio" : "Activar recordatorio"}
            </button>
          )}
          {variant === "settings" && reminder.on && !reminder.blocked && (
            <div className="flex flex-wrap gap-3 mt-3">
              <button className="flow-link" disabled={reminder.busy} onClick={reminder.test}>Probar en este dispositivo</button>
              <button className="flow-link" disabled={reminder.busy} onClick={reminder.repair}>Renovar notificaciones</button>
            </div>
          )}
        </div>
        {variant === "prompt" && (
          <button className="session-icon" aria-label="Ahora no" onClick={dismiss}><X size={18} /></button>
        )}
      </div>
    </section>
  );
}
