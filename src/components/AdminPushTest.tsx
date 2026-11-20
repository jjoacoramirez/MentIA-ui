import React, { useState } from "react";
import { ApiError, mentiaApi, type TestPushResult } from "../services/api";

/** Texto del resultado en palabras: no se muestra nada técnico del dispositivo. */
export function describeTestPush(result: TestPushResult): string {
  if (result.devices === 0) return "Esa cuenta no tiene el recordatorio activado en ningún dispositivo.";
  const parts: string[] = [];
  if (result.sent) parts.push(`Aviso enviado a ${result.sent} ${result.sent === 1 ? "dispositivo" : "dispositivos"}.`);
  if (result.removed) parts.push(`${result.removed} ${result.removed === 1 ? "suscripción ya no existía y se borró" : "suscripciones ya no existían y se borraron"}.`);
  if (result.failed) parts.push(`${result.failed} ${result.failed === 1 ? "envío falló" : "envíos fallaron"}. Desde el perfil, probá en este dispositivo y renová las notificaciones. Si persiste, revisá el error del envío en el backend.`);
  return parts.join(" ");
}

/**
 * Herramienta de debug para admins: manda un aviso de prueba a una cuenta elegida por su alias. El alias se escribe a
 * mano: el panel no lista usuarios.
 */
export function AdminPushTest({ token }: { token: string }) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      setMessage(describeTestPush(await mentiaApi.sendTestPush(token, username.trim().toLowerCase())));
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "No pudimos mandar el aviso. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flow-card space-y-3" aria-label="Probar notificaciones">
      <h2 className="text-xl font-bold">Probar notificaciones</h2>
      <p className="text-sm opacity-80">
        Herramienta de debug: manda ahora el aviso de recordatorio a una cuenta, sin mirar su racha. La cuenta tiene que
        haber activado el recordatorio en su navegador. No cuenta como el aviso del día.
      </p>
      <form className="flex flex-wrap items-end gap-3" onSubmit={send}>
        <label className="flex-1 min-w-48">
          Alias de la cuenta
          <input className="w-full rounded-xl border border-slate-400/40 bg-canvas px-3 py-2 text-ink" required maxLength={30}
            autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <button className="flow-primary" disabled={busy || !username.trim()}>
          {busy ? "Enviando…" : "Enviar aviso de prueba"}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="text-rose-600 dark:text-rose-300">{error}</p>}
    </section>
  );
}
