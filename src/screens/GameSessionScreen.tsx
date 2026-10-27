import React, { useEffect, useRef, useState } from "react";
import { useJourney } from "../context/JourneyContext";
import { Pause, X, Timer, Brain, CheckCircle2 } from "lucide-react";
const symbols = ["◆", "▲", "●", "■", "★", "⬡", "✚", "◎", "✦"];
function sequence(length: number) {
  const pool = [...symbols];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, length);
}
export const GameSessionScreen: React.FC = () => {
  const { finish, assessment, sessionLevel } = useJourney();
  const objectCount = sessionLevel + 3;
  const [target, setTarget] = useState(() => sequence(objectCount));
  const [answer, setAnswer] = useState<string[]>([]);
  const [phase, setPhase] = useState<"memorize" | "answer" | "feedback">(
    "memorize",
  );
  const [remaining, setRemaining] = useState(6);
  const [paused, setPaused] = useState(false);
  const [exit, setExit] = useState(false);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const submitted = useRef(false);
  useEffect(() => {
    if (paused || exit || phase === "feedback") return;
    const timer = setInterval(() => {
      setElapsed((t) => t + 1000);
      setRemaining((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, paused, exit]);
  useEffect(() => {
    if (remaining > 0 || paused || exit) return;
    if (phase === "memorize") {
      setPhase("answer");
      setRemaining(30);
    } else if (phase === "answer") submit();
  }, [remaining, phase, paused, exit]);
  function submit() {
    if (submitted.current) return;
    submitted.current = true;
    const match =
      answer.length === target.length &&
      answer.every((s, i) => s === target[i]);
    setLastCorrect(match);
    if (match) setCorrect((c) => c + 1);
    setRound((r) => r + 1);
    setPhase("feedback");
  }
  function next() {
    if (round === 3) {
      finish(correct, round, elapsed);
      return;
    }
    submitted.current = false;
    setAnswer([]);
    setTarget(sequence(objectCount));
    setPhase("memorize");
    setRemaining(6);
  }
  return (
    <div className="session-screen">
      <header className="session-header" aria-label="Controles del ejercicio">
        <div className="flex items-center justify-between gap-3">
          <button className="session-icon" aria-label="Salir" onClick={() => setExit(true)}><X size={20} /></button>
          <div className="text-center min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300 font-bold">{assessment ? "Evaluación inicial" : "Entrenamiento"} · demo</p>
            <h1 className="font-space font-bold text-lg">Secuencias visuales</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300">Memoria · Nivel {sessionLevel} · {objectCount} objetos</p>
          </div>
          <button className="session-icon" aria-label="Pausar" onClick={() => setPaused(true)}><Pause size={20} /></button>
        </div>
        <div className="flex justify-between items-center mt-5 mb-3 text-xs font-semibold">
          <span>Secuencia {Math.min(round + (phase === "feedback" ? 0 : 1), 3)} de 3</span>
          <span className="session-timer"><Timer size={14} aria-hidden="true" /><span aria-live="off">{remaining} s</span></span>
        </div>
        <div className="session-progress" role="progressbar" aria-label="Avance de sesión" aria-valuenow={round} aria-valuemin={0} aria-valuemax={3}>
          <div style={{ width: `${round / 3 * 100}%` }} />
        </div>
      </header>
      <div className="session-content">
        <div className="session-phase">
          {phase === "feedback" ? <CheckCircle2 size={16} /> : <Brain size={16} />}
          {phase === "memorize" ? "Fase de memorización" : phase === "answer" ? "Tu turno" : "Resultado del intento"}
        </div>
      <section
        className="flow-card session-card"
        style={{ visibility: paused || exit ? "hidden" : "visible" }}
      >
        <h2 className="text-lg font-bold mb-3">
          {phase === "memorize"
            ? "Memorizá el orden"
            : phase === "answer"
              ? "Repetí la secuencia"
              : lastCorrect
                ? "¡Secuencia correcta!"
                : "Seguí practicando"}
        </h2>
        {phase === "memorize" && (
          <div
            className="grid gap-2 py-8"
            style={{ gridTemplateColumns: `repeat(${objectCount}, minmax(0, 1fr))` }}
            aria-label="Secuencia para memorizar"
          >
            {target.map((s, i) => (
              <span
                key={i}
                className="text-4xl text-center text-cyan-600 dark:text-cyan-300"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {phase === "answer" && (
          <>
            <div
              className="grid gap-2 mb-6"
              style={{ gridTemplateColumns: `repeat(${objectCount}, minmax(0, 1fr))` }}
              aria-label="Tu respuesta"
            >
              {Array.from({ length: objectCount }, (_, i) => (
                <span
                  className="rounded-xl bg-cyan-500/10 text-3xl text-center py-4"
                  key={i}
                >
                  {answer[i] || "·"}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {symbols.map((s, i) => (
                <button
                  key={s}
                  aria-label={`Símbolo ${i + 1}: ${s}`}
                  className="rounded-2xl border border-cyan-500/30 text-3xl py-4 hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-cyan-500"
                  disabled={answer.length === objectCount || paused || exit}
                  onClick={() => setAnswer((a) => [...a, s])}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              className="flow-link my-4"
              onClick={() => setAnswer((a) => a.slice(0, -1))}
            >
              Deshacer último símbolo
            </button>
            <button
              className="flow-primary"
              disabled={answer.length !== objectCount || paused || exit}
              onClick={submit}
            >
              Confirmar respuesta
            </button>
          </>
        )}
        {phase === "feedback" && (
          <div aria-live="polite">
            <p className="mb-3">
              Respuesta esperada:{" "}
              <span className="text-2xl">{target.join(" ")}</span>
            </p>
            <p className="mb-5">
              {lastCorrect
                ? `Reconociste el orden de los ${objectCount} símbolos.`
                : "Este intento se registró. Podés continuar con la próxima secuencia."}
            </p>
            <button className="flow-primary" onClick={next}>
              {round === 3 ? "Ver resultados" : "Siguiente secuencia"}
            </button>
          </div>
        )}
      </section>
      </div>
      {(paused || exit) && (
        <div
          className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
        >
          <div className="flow-card w-full max-w-sm">
            <h2 id="pause-title" className="text-xl font-bold mb-4">
              {exit ? "¿Abandonar la sesión?" : "Sesión pausada"}
            </h2>
            <p className="mb-5">
              {exit
                ? "Los intentos realizados quedarán en el historial de esta demo. No se sumará XP."
                : "La secuencia permanece oculta y el tiempo está detenido."}
            </p>
            <button
              autoFocus
              className="flow-primary"
              onClick={() => {
                setPaused(false);
                setExit(false);
              }}
            >
              Continuar sesión
            </button>
            {exit && (
              <button
                className="flow-link mt-4"
                onClick={() => finish(correct, round, elapsed, true)}
              >
                Abandonar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
