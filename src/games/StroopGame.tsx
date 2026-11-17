import React, { useMemo, useRef, useState } from "react";
import { GameProps, num, seededRandom, spreadPicks, TICK_MS, useCountdown } from "./common";
import { PhaseStage, RoundDots } from "./PhaseBanner";

interface Color { name: string; hex: string }

/** Color y palabra (STROOP): hay que elegir el color de la tinta, no lo que dice la palabra. */
export function StroopGame({ item, paused, onDone }: GameProps) {
  const colors = useMemo<Color[]>(() => {
    const list = Array.isArray(item.content.colors) ? (item.content.colors as Color[]) : [];
    const valid = list.filter((c) => typeof c?.name === "string" && typeof c?.hex === "string");
    return valid.length >= 2 ? valid : [{ name: "rojo", hex: "#E53935" }, { name: "azul", hex: "#1E88E5" }];
  }, [item]);
  const trials = Math.max(1, num(item.params.trials, 10));
  const limit = num(item.params.responseLimitMs, 2500);
  const incongruent = num(item.params.incongruentRatio, 0.5);
  const sequence = useMemo(() => {
    const random = seededRandom(item.seed);
    // Con 3 colores o más, la tinta cambia de un ensayo al siguiente (nunca se ve dos veces seguidas la misma palabra
    // con el mismo color). Con 2 sería alternar siempre y el ensayo se volvería predecible.
    const inks = colors.length >= 3
      ? spreadPicks(random, colors.length, trials)
      : Array.from({ length: trials }, () => random.int(colors.length));
    return inks.map((ink) => {
      let word = ink;
      if (random.next() < incongruent) word = (ink + 1 + random.int(colors.length - 1)) % colors.length;
      return { ink, word };
    });
  }, [item, trials, incongruent, colors]);

  const [trial, setTrial] = useState(0);
  const results = useRef<{ correct: boolean; ms: number }[]>([]);
  const remaining = useCountdown(limit, trial < trials, paused, () => answer(null), trial);

  function answer(index: number | null) {
    results.current.push({ correct: index === sequence[trial].ink, ms: limit - remaining + TICK_MS });
    if (trial + 1 < trials) {
      setTrial(trial + 1);
      return;
    }
    const correct = results.current.filter((r) => r.correct).length;
    const times = results.current.filter((r) => r.correct).map((r) => r.ms);
    onDone({
      isCorrect: correct / trials >= 0.8,
      accuracy: correct / trials,
      responseTimeMs: Math.round(times.length ? times.reduce((a, b) => a + b, 0) / times.length : limit),
      metrics: { trials, correct, errors: trials - correct },
    });
  }

  if (trial >= trials) return null;
  const current = sequence[trial];
  return (
    <PhaseStage phase={trial}>
      <RoundDots total={trials} current={trial} label={`Ensayo ${trial + 1} de ${trials}`} />
      <p className="mb-3 text-sm">{trial + 1} de {trials} · ¿De qué color está pintada la palabra?</p>
      <p className="text-5xl font-bold text-center py-8 uppercase" style={{ color: colors[current.ink].hex }}
        aria-label={`Palabra ${colors[current.word].name}`}>{colors[current.word].name}</p>
      <div className="grid grid-cols-2 gap-2">
        {colors.map((c, i) => (
          <button key={c.name} disabled={paused} className="rounded-2xl border border-brand/30 py-3 font-bold"
            onClick={() => answer(i)}>{c.name}</button>
        ))}
      </div>
    </PhaseStage>
  );
}
