import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { mentiaApi, type SessionFeedback } from "../services/api";

/** Un pedido por sesión a la vez: así un doble montaje no genera el comentario dos veces. */
const inflight = new Map<string, Promise<SessionFeedback>>();

function load(token: string, sessionId: string): Promise<SessionFeedback> {
  let pending = inflight.get(sessionId);
  if (!pending) {
    pending = mentiaApi.sessionFeedback(token, sessionId).finally(() => inflight.delete(sessionId));
    inflight.set(sessionId, pending);
  }
  return pending;
}

/**
 * Comentario breve sobre la sesión. Lo escribe la IA si está disponible; si no, el servidor manda un texto básico, así
 * que casi siempre hay algo para mostrar. Si el pedido falla, no se muestra nada: el resultado no depende de esto.
 */
export function SessionFeedbackCard({ token, sessionId }: { token: string | null; sessionId: string }) {
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setFeedback(null);
    setLoading(true);
    load(token, sessionId)
      .then((value) => !cancelled && setFeedback(value))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, sessionId]);

  if (!loading && !feedback) return null;
  return (
    <section className="flow-card mb-4" aria-label="Comentario de la sesión">
      <h2 className="font-bold mb-2 flex items-center gap-2"><Sparkles size={16} aria-hidden="true" /> Un comentario sobre tu sesión</h2>
      {loading ? (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Estamos escribiendo un comentario…</p>
      ) : (
        <>
          <p>{feedback!.text}</p>
          {feedback!.source === "AI" && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Escrito con IA a partir de los números de tu sesión. No es una evaluación de tus capacidades.
            </p>
          )}
        </>
      )}
    </section>
  );
}
