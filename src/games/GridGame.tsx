import React, { useMemo, useState } from "react";
import { GameProps, num, seededRandom, useActiveClock, useCountdown } from "./common";

/** Cuadrícula (SPATIAL_GRID): se iluminan casillas y después hay que marcar las mismas. */
export function GridGame({ item, paused, onDone }: GameProps) {
  const size = Math.max(2, num(item.params.gridSize, 3));
  const count = Math.min(num(item.params.cellsToRemember, 3), size * size - 1);
  const exposure = num(item.params.exposureMs, 2000);
  const color = typeof item.content.highlightColor === "string" ? item.content.highlightColor : "#22d3ee";
  const radius = item.content.cellShape === "circle" ? "9999px" : item.content.cellShape === "rounded" ? "12px" : "4px";
  const targets = useMemo(() => {
    const random = seededRandom(item.seed);
    return random.shuffle(Array.from({ length: size * size }, (_, i) => i)).slice(0, count);
  }, [item, size, count]);

  const [answering, setAnswering] = useState(false);
  const [marked, setMarked] = useState<number[]>([]);
  useCountdown(exposure, !answering, paused, () => setAnswering(true));
  const clock = useActiveClock(answering, paused);

  function confirm() {
    const hits = marked.filter((m) => targets.includes(m)).length;
    onDone({
      isCorrect: hits === count && marked.length === count,
      accuracy: hits / count,
      responseTimeMs: clock.current,
      response: { cells: marked },
      metrics: { hits, falseAlarms: marked.length - hits, gridSize: size },
    });
  }

  return (
    <>
      <p className="mb-3 text-sm">
        {answering ? `Tocá las ${count} casillas que se encendieron (${marked.length} de ${count}).` : "Mirá bien qué casillas se encienden."}
      </p>
      <div className="grid gap-2 mb-5 mx-auto max-w-xs" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        aria-label={answering ? "Cuadrícula para responder" : "Cuadrícula para memorizar"}>
        {Array.from({ length: size * size }, (_, i) => {
          const lit = answering ? marked.includes(i) : targets.includes(i);
          return (
            <button key={i} aria-label={`Casilla ${i + 1}`} aria-pressed={answering ? lit : undefined}
              disabled={!answering || paused || (!lit && marked.length >= count)}
              className="game-tile aspect-square"
              style={{ borderRadius: radius, background: lit ? color : "transparent" }}
              onClick={() => setMarked((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))} />
          );
        })}
      </div>
      {answering && <button className="flow-primary" disabled={marked.length !== count || paused} onClick={confirm}>Confirmar</button>}
    </>
  );
}
