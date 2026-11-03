import React, { useEffect, useState } from "react";
import { categoryName, useJourney } from "../context/JourneyContext";
import { useApp } from "../context/AppContext";
import { Pause, X, Brain, CheckCircle2 } from "lucide-react";
import { exerciseNames, Game, type GameOutcome } from "../games";
import { ApiError } from "../services/api";

/**
 * Ejecuta una sesión del servidor: muestra cada ítem con su mecánica, registra el intento y al final la cierra.
 * Al retomar una sesión (por ejemplo, después de recargar) saltea los ítems ya respondidos.
 */
export const GameSessionScreen: React.FC = () => {
  const { session, doneItems, recordAttempt, finish, abandon, assessment, categories, busy } = useJourney();
  const { setCurrentTab } = useApp();
  const pending = session ? session.items.filter((i) => !doneItems.includes(i.sessionItemId)) : [];
  const item = pending[0];
  const total = session?.items.length ?? 0;
  const done = total - pending.length;
  const [phase, setPhase] = useState<"intro" | "play" | "saving" | "feedback">("intro");
  const [last, setLast] = useState<GameOutcome | null>(null);
  const [paused, setPaused] = useState(false);
  const [exit, setExit] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const requestExit = () => setExit(true);
    window.addEventListener("mentia:leave-session", requestExit);
    return () => window.removeEventListener("mentia:leave-session", requestExit);
  }, []);

  if (!session)
    return (
      <div className="flow-page">
        <p className="mb-4">No hay una sesión en curso.</p>
        <button className="flow-primary" onClick={() => setCurrentTab("entrenar")}>Preparar una sesión</button>
      </div>
    );

  async function onDone(outcome: GameOutcome) {
    if (!item) return;
    setPhase("saving");
    setError("");
    try {
      await recordAttempt(item, outcome);
      setLast(outcome);
      setPhase("feedback");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos guardar el resultado. Probá de nuevo.");
      setLast(outcome);
      setPhase("feedback");
    }
  }

  async function retrySave() {
    if (last) await onDone(last);
  }

  // `item` ya avanzó al siguiente pendiente cuando el intento se guardó; el feedback es del anterior.
  const finished = !item && phase !== "saving";
  return (
    <div className="session-screen">
      <header className="session-header" aria-label="Controles del ejercicio">
        <div className="flex items-center justify-between gap-3">
          <button className="session-icon" aria-label="Salir" onClick={() => setExit(true)}><X size={20} /></button>
          <div className="text-center min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-bold">{assessment ? "Evaluación inicial" : "Entrenamiento"}</p>
            <h1 className="font-space font-bold text-lg">{item ? exerciseNames[item.exerciseType] : "Sesión completa"}</h1>
            {item && <p className="text-xs text-slate-600 dark:text-slate-300">{categoryName(categories, item.category)} · Nivel {item.difficultyLevel}</p>}
          </div>
          <button className="session-icon" aria-label="Pausar" onClick={() => setPaused(true)}><Pause size={20} /></button>
        </div>
        <div className="flex justify-between items-center mt-5 mb-3 text-xs font-semibold">
          <span>Actividad {Math.min(done + 1, total)} de {total}</span>
        </div>
        <div className="session-progress" role="progressbar" aria-label="Avance de sesión" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
          <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </header>
      <div className="session-content">
        <div className="session-phase">
          {phase === "feedback" ? <CheckCircle2 size={16} /> : <Brain size={16} />}
          {phase === "intro" ? "Instrucciones" : phase === "play" ? "En juego" : phase === "saving" ? "Guardando" : "Resultado de la actividad"}
        </div>
        <section className="flow-card session-card" style={{ visibility: paused || exit ? "hidden" : "visible" }}>
          {phase === "intro" && item && (
            <>
              <h2 className="text-lg font-bold mb-3">{exerciseNames[item.exerciseType]}</h2>
              <p className="mb-5">{item.instructions}</p>
              <button className="flow-primary" onClick={() => setPhase("play")}>Comenzar actividad</button>
            </>
          )}
          {phase === "play" && item && (
            <Game key={item.sessionItemId} item={item} paused={paused || exit} onDone={onDone} />
          )}
          {phase === "saving" && <p aria-live="polite">Guardando tu resultado…</p>}
          {phase === "feedback" && last && (
            <div aria-live="polite">
              <h2 className="text-lg font-bold mb-3">{last.isCorrect ? "¡Muy bien!" : "Seguí practicando"}</h2>
              <p className="mb-5">Precisión de esta actividad: {Math.round(last.accuracy * 100)}%.</p>
              {error ? (
                <>
                  <p role="alert" className="text-rose-600 dark:text-rose-300 mb-4">{error}</p>
                  <button className="flow-primary" onClick={retrySave}>Reintentar</button>
                </>
              ) : finished ? (
                <button className="flow-primary" disabled={busy} onClick={finish}>Ver resultados</button>
              ) : (
                <button className="flow-primary" onClick={() => setPhase("intro")}>Siguiente actividad</button>
              )}
            </div>
          )}
          {phase === "intro" && !item && (
            <>
              <p className="mb-5">Ya respondiste todas las actividades de esta sesión.</p>
              <button className="flow-primary" disabled={busy} onClick={finish}>Ver resultados</button>
            </>
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
                ? "Las actividades que ya respondiste quedan en tu historial, pero la sesión no suma XP ni cambia tu nivel."
                : "La actividad permanece oculta y el tiempo está detenido."}
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
              <button className="flow-link mt-4" disabled={busy} onClick={abandon}>
                Abandonar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
