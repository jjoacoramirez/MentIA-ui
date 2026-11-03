import React, { useMemo, useState } from "react";
import { GameProps, num, seededRandom, strings, useActiveClock, useCountdown } from "./common";

/**
 * Secuencias (REVERSE_SEQUENCE; AUDITORY_SEQUENCE se muestra visual hasta tener audio).
 * Se muestra un elemento por vez y después se repite la secuencia: al revés en "Secuencia inversa".
 */
export function SequenceGame({ item, paused, onDone }: GameProps) {
  const reverse = item.exerciseType === "REVERSE_SEQUENCE";
  const length = num(item.params.sequenceLength ?? item.params.length, 4);
  const displayMs = num(item.params.itemDisplayMs ?? item.params.itemIntervalMs, 900);
  const palette = useMemo(() => {
    const symbols = strings(item.content.symbols);
    return symbols.length ? symbols : ["◆", "▲", "●", "■", "★", "✚"];
  }, [item]);
  const target = useMemo(() => {
    const random = seededRandom(item.seed);
    return Array.from({ length }, () => random.pick(palette));
  }, [item, length, palette]);
  const expected = reverse ? [...target].reverse() : target;

  const [shown, setShown] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const answering = shown >= length;
  useCountdown(displayMs, !answering, paused, () => setShown((s) => s + 1), shown);
  const clock = useActiveClock(answering, paused);

  function confirm() {
    const correct = expected.filter((s, i) => answer[i] === s).length;
    onDone({
      isCorrect: correct === length,
      accuracy: correct / length,
      responseTimeMs: clock.current,
      response: { sequence: answer },
      metrics: { length, correctPositions: correct },
    });
  }

  if (!answering)
    return (
      <div className="py-8 text-center" aria-live="polite">
        <p className="text-sm mb-4">Elemento {shown + 1} de {length}</p>
        <span className="text-6xl text-accent" aria-label="Elemento de la secuencia">{target[shown]}</span>
      </div>
    );
  return (
    <>
      <p className="mb-3 text-sm">{reverse ? "Repetí la secuencia en orden inverso." : "Repetí la secuencia en el mismo orden."}</p>
      <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: `repeat(${Math.min(length, 6)}, minmax(0, 1fr))` }} aria-label="Tu respuesta">
        {Array.from({ length }, (_, i) => (
          <span key={i} className="rounded-xl bg-brand/10 text-2xl text-center py-3">{answer[i] || "·"}</span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {palette.map((s) => (
          <button key={s} aria-label={`Elegir ${s}`} disabled={answer.length === length || paused}
            className="rounded-2xl border border-brand/30 text-2xl py-3 hover:bg-brand/20"
            onClick={() => setAnswer((a) => [...a, s])}>{s}</button>
        ))}
      </div>
      <button className="flow-link my-4" disabled={!answer.length} onClick={() => setAnswer((a) => a.slice(0, -1))}>Deshacer</button>
      <button className="flow-primary" disabled={answer.length !== length || paused} onClick={confirm}>Confirmar respuesta</button>
    </>
  );
}
