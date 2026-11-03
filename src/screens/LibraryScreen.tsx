import React from "react";
import { Brain, Focus, Layers, Play } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useJourney } from "../context/JourneyContext";
import { Panel } from "./FlowScreens";
import { useApiData } from "../hooks/useApiData";
import { mentiaApi } from "../services/api";

const icons: Record<string, typeof Brain> = { ATENCION: Focus, MEMORIA_TRABAJO: Layers };

export function LibraryScreen() {
  const { categories, canTrain, begin, busy } = useJourney();
  const { setCurrentTab } = useApp();
  const performance = useApiData(mentiaApi.performance);
  const levelOf = (code: string) => performance.data?.categories.find((c) => c.category === code)?.level;
  return <Panel title="Áreas de entrenamiento">
    <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">MentIA elige las actividades de cada sesión según tu nivel en cada área y las va rotando. La dificultad cambia entre sesiones, nunca en medio de una actividad.</p>
    {!canTrain && <section className="flow-card mb-4"><h2 className="font-bold mb-2">Primero, tu punto de partida</h2><p className="text-sm mb-4">Completá la evaluación inicial para comenzar a entrenar.</p><button className="flow-primary" onClick={() => setCurrentTab("evaluacion")}>Ir a evaluación inicial</button></section>}
    <div className="library-grid">
      {categories.map((c) => {
        const Icon = icons[c.code] ?? Brain;
        const level = levelOf(c.code);
        return <section className="flow-card mb-4" key={c.code}>
          <div className="flex items-center justify-between mb-3"><Icon className="text-accent" /><span className="status-badge completed">{level ? `Nivel ${level}` : "Sin evaluar"}</span></div>
          <h2 className="font-space font-bold text-lg">{c.name}</h2>
          {c.description && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{c.description}</p>}
        </section>;
      })}
    </div>
    <button className="flow-primary flex! items-center justify-center gap-2" disabled={!canTrain || busy} onClick={() => begin("training")}><Play size={16} aria-hidden="true" />Entrenar en mi nivel</button>
  </Panel>;
}
