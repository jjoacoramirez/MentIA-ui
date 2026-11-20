import React from "react";

type Tone = "study" | "answer";

/**
 * Cinta de fase de un juego: «Memorizá» (ámbar, con barra de tiempo que se vacía) o «Tu turno» (verde).
 * Al cambiar de fase se vuelve a montar (key) y se repite la animación, para que el cambio se note.
 */
export function PhaseBanner({ tone, label, remainingMs, totalMs }: {
  tone: Tone;
  label: string;
  remainingMs?: number;
  totalMs?: number;
}) {
  const timed = tone === "study" && remainingMs != null && totalMs != null && totalMs > 0;
  const ratio = timed ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  return (
    <div key={tone} className="phase-banner" data-tone={tone} role="status" aria-live="polite">
      <span>{tone === "study" ? "👀" : "✋"} {label}</span>
      {timed && <span className="phase-bar" aria-hidden="true"><span style={{ width: `${ratio * 100}%` }} /></span>}
    </div>
  );
}

/** Contenedor del escenario: cada vez que cambia `phase` se vuelve a montar y da un destello corto. */
export function PhaseStage({ phase, children }: { phase: React.Key; children: React.ReactNode }) {
  return <div key={phase} className="phase-stage">{children}</div>;
}

/** Puntitos de avance por ronda o ensayo (mismo estilo que el N-back). */
export function RoundDots({ total, current, label }: { total: number; current: number; label: string }) {
  return (
    <div className="nback-dots" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} data-state={i < current ? "done" : i === current ? "current" : "next"} />
      ))}
    </div>
  );
}
