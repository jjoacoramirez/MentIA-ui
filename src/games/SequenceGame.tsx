import React, { useMemo, useState } from "react";
import { GameProps, num, pickAvoiding, seededRandom, strings, useActiveClock, useCountdown } from "./common";
import { PhaseBanner, PhaseStage } from "./PhaseBanner";

const GAP_MS = 250;

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
    // Un mismo elemento no se muestra dos veces seguidas (se confundiría con que la pantalla no cambió).
    const picks: string[] = [];
    for (let i = 0; i < length; i++) picks.push(pickAvoiding(random, palette, [picks[i - 1]]));
    return picks;
  }, [item, length, palette]);
  const expected = reverse ? [...target].reverse() : target;

  const [shown, setShown] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const answering = shown >= length;
  const remaining = useCountdown(displayMs, !answering, paused, () => setShown((s) => s + 1), shown);
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

  // Al final de cada elemento el escenario queda vacío un momento: así se nota cuando el siguiente es igual.
  const visible = remaining > Math.min(GAP_MS, displayMs / 4);
  if (!answering)
    return (
      <PhaseStage phase="study">
        <PhaseBanner tone="study" label="Mirá con atención" />
        <div className="py-2 text-center" aria-live="polite">
          <p className="text-sm mb-2">Elemento {shown + 1} de {length}</p>
          <div className="nback-stage">
            {visible && <span key={shown} className="nback-symbol" aria-label="Elemento de la secuencia">{target[shown]}</span>}
          </div>
        </div>
      </PhaseStage>
    );
  return (
    <PhaseStage phase="answer">
      <PhaseBanner tone="answer" label="Tu turno" />
      <p className="mb-3 text-sm">{reverse ? "Ahora armala al revés: empezá por el último que viste." : "Ahora repetila en el mismo orden."}</p>
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
    </PhaseStage>
  );
}
