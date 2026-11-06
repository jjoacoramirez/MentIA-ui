import React, { useMemo, useRef, useState } from "react";
import { GameProps, num, seededRandom, strings, TICK_MS, useCountdown } from "./common";

/**
 * N-back (N_BACK): aparecen elementos de a uno; hay que tocar "Coincide" cuando el actual es igual al que apareció
 * N posiciones antes.
 */
export function NBackGame({ item, paused, onDone }: GameProps) {
  const n = Math.max(1, num(item.params.n, 1));
  const trials = Math.max(n + 1, num(item.params.trials, 20));
  const stimulusMs = num(item.params.stimulusMs, 2000);
  const matchRatio = num(item.params.matchRatio, 0.3);
  const stream = useMemo(() => {
    const symbols = strings(item.content.symbols);
    const pool = symbols.length >= 2 ? symbols : ["A", "B", "C", "D"];
    const random = seededRandom(item.seed);
    const list: string[] = [];
    for (let i = 0; i < trials; i++) {
      if (i >= n && random.next() < matchRatio) list.push(list[i - n]);
      else {
        let next = random.pick(pool);
        if (i >= n && next === list[i - n]) next = pool[(pool.indexOf(next) + 1) % pool.length];
        list.push(next);
      }
    }
    return list;
  }, [item, n, trials, matchRatio]);

  const [index, setIndex] = useState(0);
  const pressed = useRef<Set<number>>(new Set());
  const times = useRef<number[]>([]);
  const [flash, setFlash] = useState(false);
  const remaining = useCountdown(stimulusMs, index < trials, paused, advance, index);

  function press() {
    if (pressed.current.has(index)) return;
    pressed.current.add(index);
    if (index >= n && stream[index] === stream[index - n]) times.current.push(stimulusMs - remaining + TICK_MS);
    setFlash(true);
  }

  function advance() {
    setFlash(false);
    if (index + 1 < trials) {
      setIndex(index + 1);
      return;
    }
    let hits = 0, falseAlarms = 0, correctRejections = 0, misses = 0;
    for (let i = n; i < trials; i++) {
      const match = stream[i] === stream[i - n];
      const tapped = pressed.current.has(i);
      if (match && tapped) hits++;
      else if (match) misses++;
      else if (tapped) falseAlarms++;
      else correctRejections++;
    }
    const scored = trials - n;
    const accuracy = (hits + correctRejections) / scored;
    onDone({
      isCorrect: accuracy >= 0.8,
      accuracy,
      responseTimeMs: Math.round(times.current.length ? times.current.reduce((a, b) => a + b, 0) / times.current.length : stimulusMs),
      metrics: { n, hits, misses, falseAlarms, correctRejections },
    });
  }

  if (index >= trials) return null;
  return (
    <>
      <p className="mb-3 text-sm">{index + 1} de {trials} · ¿es igual al de {n} {n === 1 ? "posición" : "posiciones"} atrás?</p>
      <p className="text-6xl text-center py-8 text-accent" aria-label="Elemento actual">{stream[index]}</p>
      <button className={`flow-primary ${flash ? "opacity-70" : ""}`} disabled={paused || index < n} onClick={press}>Coincide</button>
    </>
  );
}
