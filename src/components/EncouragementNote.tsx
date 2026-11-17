import React, { useState } from "react";

/** Mensajes breves para normalizar el error. Nada de lenguaje clínico: hablan de practicar, no de medir. */
export const ENCOURAGEMENTS = [
  "Equivocarte es parte de practicar: cada intento cuenta.",
  "Si no te sale a la primera, es normal. Lo importante es volver a intentar.",
  "Errar no es fallar: es la forma en que se aprende cada ejercicio.",
  "No hay respuestas «malas» acá: cada actividad te muestra por dónde seguir practicando.",
  "Un error de hoy es una pista para la próxima. Tomate el tiempo que necesites.",
] as const;

/** Elige el mensaje de forma determinística: el mismo `seed` siempre da el mismo texto. */
export function encouragementFor(seed: number) {
  const n = ENCOURAGEMENTS.length;
  return ENCOURAGEMENTS[((Math.trunc(seed) % n) + n) % n];
}

function readDismissed(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

/**
 * Cartelito de ánimo. Con `dismissKey` se puede cerrar y recuerda la decisión en localStorage
 * (si el storage no está disponible, simplemente reaparece).
 */
export function EncouragementNote({ seed = 0, text, dismissKey, className = "" }: {
  seed?: number;
  text?: string;
  dismissKey?: string;
  className?: string;
}) {
  const [hidden, setHidden] = useState(() => (dismissKey ? readDismissed(dismissKey) : false));
  if (hidden) return null;
  return (
    <aside className={`encouragement ${className}`} role="note">
      <span aria-hidden="true">💡</span>
      <p>{text ?? encouragementFor(seed)}</p>
      {dismissKey && (
        <button
          type="button"
          aria-label="Cerrar mensaje"
          onClick={() => {
            setHidden(true);
            try {
              window.localStorage.setItem(dismissKey, "1");
            } catch {
              /* sin storage: el cartel puede volver a aparecer */
            }
          }}
        >
          ✕
        </button>
      )}
    </aside>
  );
}
