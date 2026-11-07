import React, { useMemo, useRef, useState } from "react";
import { GameProps, num, seededRandom, TICK_MS, useCountdown } from "./common";

const ROUNDS = 5;

/**
 * Elemento diferente (ODD_ONE_OUT): en cada ronda hay que encontrar el elemento distinto antes de que se acabe
 * el tiempo. Con más nivel hay más elementos y los pares se parecen más.
 */
export function OddOneOutGame({ item, paused, onDone }: GameProps) {
  const pairs = useMemo(
    () => (Array.isArray(item.content.pairs) ? (item.content.pairs as unknown[]) : [])
      .filter((p): p is [string, string] => Array.isArray(p) && p.length === 2),
    [item],
  );
  const count = Math.max(4, num(item.params.items, 8));
  const limit = num(item.params.timeLimitMs, 6000);
  const pair = pairs.length
    ? pairs[Math.min(pairs.length - 1, Math.round(num(item.params.similarity, 0.3) * (pairs.length - 1)))]
    : (["◆", "◇"] as [string, string]);
  const rounds = useMemo(() => {
    const random = seededRandom(item.seed);
    return Array.from({ length: ROUNDS }, () => random.int(count));
  }, [item, count]);

  const [round, setRound] = useState(0);
  const results = useRef<{ correct: boolean; ms: number }[]>([]);
  const remaining = useCountdown(limit, round < ROUNDS, paused, () => answer(null), round);

  function answer(index: number | null) {
    results.current.push({ correct: index === rounds[round], ms: limit - remaining + TICK_MS });
    if (round + 1 < ROUNDS) {
      setRound(round + 1);
      return;
    }
    const correct = results.current.filter((r) => r.correct).length;
    const times = results.current.filter((r) => r.correct).map((r) => r.ms);
    onDone({
      isCorrect: correct === ROUNDS,
      accuracy: correct / ROUNDS,
      responseTimeMs: Math.round(times.length ? times.reduce((a, b) => a + b, 0) / times.length : limit),
      metrics: { rounds: ROUNDS, correct, timeouts: results.current.filter((r) => !r.correct).length },
    });
  }

  if (round >= ROUNDS) return null;
  return (
    <>
      <div className="flex items-center justify-between mb-3 text-sm">
        <span>Ronda {round + 1} de {ROUNDS}</span>
        <span className="font-semibold" aria-label="Tiempo restante">{Math.ceil(remaining / 1000)} s</span>
      </div>
      <p className="mb-4 font-semibold">¿Cuál es distinto al resto? Tocalo.</p>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(count))}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, i) => (
          <button key={`${round}-${i}`} aria-label={`Elemento ${i + 1}`} disabled={paused}
            className="game-tile text-4xl leading-none py-4 text-ink"
            onClick={() => answer(i)}>{i === rounds[round] ? pair[1] : pair[0]}</button>
        ))}
      </div>
    </>
  );
}
