import React, { useMemo, useState } from "react";
import { GameProps, num, seededRandom, strings, useActiveClock, useCountdown } from "./common";

/**
 * Reconocimiento visual (VISUAL_RECOGNITION): se memoriza un grupo de imágenes y después se marcan
 * solo las que se vieron, entre distractores.
 */
export function RecognitionGame({ item, paused, onDone }: GameProps) {
  const pool = useMemo(() => strings(item.content.items), [item]);
  const study = Math.min(num(item.params.itemsToMemorize, 4), Math.max(1, pool.length - 1));
  const distractors = Math.min(num(item.params.distractors, 4), pool.length - study);
  const exposure = num(item.params.exposureMsPerItem, 1200) * study;
  const { targets, options } = useMemo(() => {
    const random = seededRandom(item.seed);
    const shuffled = random.shuffle(pool);
    const targets = shuffled.slice(0, study);
    return { targets, options: random.shuffle([...targets, ...shuffled.slice(study, study + distractors)]) };
  }, [item, pool, study, distractors]);

  const [testing, setTesting] = useState(false);
  const [marked, setMarked] = useState<string[]>([]);
  const remaining = useCountdown(exposure, !testing, paused, () => setTesting(true));
  const clock = useActiveClock(testing, paused);

  function confirm() {
    const hits = marked.filter((m) => targets.includes(m)).length;
    const falseAlarms = marked.length - hits;
    onDone({
      isCorrect: hits === targets.length && falseAlarms === 0,
      accuracy: Math.max(0, (hits - falseAlarms) / targets.length),
      responseTimeMs: clock.current,
      response: { selected: marked },
      metrics: { hits, falseAlarms, omissions: targets.length - hits },
    });
  }

  if (!testing)
    return (
      <>
        <p className="mb-3 text-sm">Tratá de recordar estas imágenes · {Math.ceil(remaining / 1000)} s</p>
        <div className="grid grid-cols-4 gap-3 py-4" aria-label="Imágenes para memorizar">
          {targets.map((t) => <span key={t} className="text-4xl text-center">{t}</span>)}
        </div>
      </>
    );
  return (
    <>
      <p className="mb-3 text-sm">¿Cuáles viste recién? Tocá para marcarlas y después confirmá.</p>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {options.map((o) => {
          const on = marked.includes(o);
          return (
            <button key={o} aria-pressed={on} aria-label={`Imagen ${o}`} disabled={paused}
              className="game-tile text-3xl py-3"
              onClick={() => setMarked((m) => (on ? m.filter((x) => x !== o) : [...m, o]))}>{o}</button>
          );
        })}
      </div>
      <button className="flow-primary" disabled={paused} onClick={confirm}>Confirmar selección</button>
    </>
  );
}
