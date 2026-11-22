import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { SessionItem } from "../services/api";
import { tutorialFor } from "../games/tutorials";
import "./ExerciseTutorial.css";

export function ExerciseTutorial({ item, paused = false }: { item: SessionItem; paused?: boolean }) {
  const tutorial = useMemo(() => tutorialFor(item), [item]);
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const [playing, setPlaying] = useState(!reduced);
  const [hidden, setHidden] = useState(document.hidden);
  const last = tutorial.frames.length - 1;
  const frame = tutorial.frames[step];

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => { setReduced(!!media?.matches); if (media?.matches) setPlaying(false); };
    const visibility = () => setHidden(document.hidden);
    media?.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => { media?.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useEffect(() => {
    if (!playing || paused || hidden) return;
    const timer = window.setTimeout(() => {
      if (step === last) setPlaying(false);
      else setStep((value) => value + 1);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [step, last, playing, paused, hidden]);

  function move(next: number) { setPlaying(false); setStep(next); }
  return (
    <section className="exercise-tutorial" aria-label="Cómo jugar">
      <p className="tutorial-summary">{tutorial.summary}</p>
      <figure className="tutorial-demo" data-reduced-motion={reduced}>
        <div className="tutorial-demo-header"><span>Ejemplo guiado</span><span>{step + 1} / {tutorial.frames.length}</span></div>
        <p className="tutorial-title">{frame.title}</p>
        <div key={step} className={`tutorial-board ${frame.grid ? "tutorial-grid" : ""}`} aria-hidden="true">
          {frame.tiles.map((tile, i) => <span key={i} className="tutorial-tile" data-selected={tile.selected || undefined} style={{ color: tile.color }}>{tile.text}{tile.selected && <small>✓</small>}</span>)}
        </div>
        <div className="tutorial-action" aria-hidden="true">{frame.action || "Observá el ejemplo"}</div>
        <figcaption>{frame.caption}</figcaption>
        <div className="tutorial-controls" aria-label="Controles del ejemplo">
          <button type="button" aria-label="Paso anterior" disabled={step === 0} onClick={() => move(step - 1)}><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => {
            if (playing) setPlaying(false);
            else { if (step === last) setStep(0); setPlaying(true); }
          }}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? "Pausar" : "Reproducir"}</button>
          <button type="button" aria-label="Paso siguiente" disabled={step === last} onClick={() => move(step + 1)}><ChevronRight size={18} /></button>
          <button type="button" aria-label="Repetir ejemplo" onClick={() => { setStep(0); setPlaying(!reduced); }}><RotateCcw size={17} /></button>
        </div>
      </figure>
      <p className="tutorial-note">Es solo un ejemplo. No suma puntos ni consume tiempo de juego. La cantidad de elementos y la velocidad pueden cambiar según tu nivel. Empezás cuando toques «Comenzar actividad».</p>
    </section>
  );
}
