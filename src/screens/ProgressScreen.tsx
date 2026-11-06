import { Select } from "../components/Select";
import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { categoryName, useJourney } from "../context/JourneyContext";
import { Panel } from "./FlowScreens";
import { useApiData } from "../hooks/useApiData";
import { mentiaApi } from "../services/api";

export const ProgressScreen: React.FC = () => {
  const { setCurrentTab } = useApp();
  const { summary, gamification, categories } = useJourney();
  const [granularity, setGranularity] = useState<"week" | "month">("week");
  const performance = useApiData(mentiaApi.performance);
  const evolution = useApiData((t) => mentiaApi.categoryProgress(t, granularity), [granularity]);
  const periodLabel = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", granularity === "week" ? { day: "numeric", month: "short" } : { month: "short", year: "2-digit" });

  return (
    <Panel title="Tu progreso">
      <section className="flow-card mb-4">
        <div className="flex justify-between">
          <div>
            <span className="text-sm">Nivel de MentIA</span>
            <strong className="block text-2xl font-space">Nivel {gamification?.level ?? 1}</strong>
          </div>
          <strong className="text-accent">{gamification?.xp ?? 0} XP</strong>
        </div>
        {gamification && (
          <div className="mt-3" role="progressbar" aria-label="Avance al próximo nivel"
            aria-valuenow={gamification.xpIntoLevel} aria-valuemin={0} aria-valuemax={gamification.xpForNextLevel}>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-[#31353e]">
              <div className="h-2 rounded-full bg-brand" style={{ width: `${(100 * gamification.xpIntoLevel) / gamification.xpForNextLevel}%` }} />
            </div>
            <p className="text-xs mt-1">{gamification.xpForNextLevel - gamification.xpIntoLevel} XP para el nivel {gamification.level + 1}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
          <span><b className="block text-xl">{summary?.sessionsCompleted ?? 0}</b>Sesiones</span>
          <span><b className="block text-xl">{summary?.activeDaysLast30 ?? 0}</b>Días activos (30)</span>
          <span><b className="block text-xl">{summary?.currentStreakDays ?? 0}</b>Días de racha</span>
        </div>
      </section>

      <section className="flow-card mb-4">
        <h2 className="font-bold text-lg mb-3">Desempeño por área</h2>
        {performance.loading && <p>Cargando…</p>}
        {performance.error && <p role="alert">{performance.error}</p>}
        {performance.data && !performance.data.categories.length && (
          <p className="text-sm">Completá la evaluación inicial para ver tu punto de partida en cada área.</p>
        )}
        {performance.data?.categories.map((c) => (
          <div className="py-3 border-b border-slate-300/20" key={c.category}>
            <div className="flex justify-between">
              <span>{categoryName(categories, c.category)}</span>
              <span className="text-sm">Nivel {c.level}</span>
            </div>
            <div className="h-2 mt-2 rounded-full bg-slate-200 dark:bg-[#31353e]" role="img" aria-label={`Desempeño ${Math.round(c.score)} de 100`}>
              <div className="h-2 rounded-full bg-brand" style={{ width: `${c.score}%` }} />
            </div>
          </div>
        ))}
        <p className="text-xs mt-4">Describe tu desempeño dentro de MentIA (0 a 100) y el nivel con el que seguís en cada área.</p>
      </section>

      <section className="flow-card mb-4">
        <h2 className="font-bold text-lg mb-3">Evolución por área</h2>
        <label>
          Agrupar por
          <Select value={granularity} onChange={(e) => setGranularity(e.target.value as "week" | "month")}>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </Select>
        </label>
        {evolution.loading && <p className="mt-3">Cargando…</p>}
        {evolution.data && !evolution.data.length && <p className="my-4">Completá una sesión para ver tu evolución.</p>}
        {evolution.data?.map((c) => (
          <div key={c.category} className="mt-5">
            <h3 className="font-bold text-sm mb-2">{categoryName(categories, c.category)}</h3>
            <div className="flex items-end gap-1 h-24" role="img" aria-label={`Precisión por período en ${categoryName(categories, c.category)}`}>
              {c.points.map((p) => (
                <div key={p.periodStart} className="flex-1 flex flex-col justify-end h-full"
                  title={`${periodLabel(p.periodStart)}: ${Math.round(p.accuracy * 100)}% · nivel ${p.avgDifficultyLevel.toFixed(1)}`}>
                  <div className="rounded-t-md bg-brand min-h-1" style={{ height: `${p.accuracy * 100}%` }} />
                  <span className="text-[9px] text-center mt-1">{periodLabel(p.periodStart)}</span>
                </div>
              ))}
            </div>
            <details className="mt-2">
              <summary className="flow-link">Ver valores</summary>
              <ul className="text-sm mt-2 space-y-1">
                {c.points.map((p) => (
                  <li key={p.periodStart}>
                    {periodLabel(p.periodStart)}: {Math.round(p.accuracy * 100)}% de precisión · nivel promedio {p.avgDifficultyLevel.toFixed(1)} · {p.sessions} {p.sessions === 1 ? "sesión" : "sesiones"}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </section>
      <button className="flow-primary" onClick={() => setCurrentTab("entrenar")}>
        Preparar una sesión
      </button>
    </Panel>
  );
};
