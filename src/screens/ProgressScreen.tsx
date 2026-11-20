import { ProgressLineChart, type ProgressMetric } from "../components/ProgressLineChart";
import { argentinaToday, movePeriod, progressPeriod, periodLabel, type ProgressView } from "../utils/progressPeriods";
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
  const [view, setView] = useState<ProgressView>("week");
  const [anchor, setAnchor] = useState(argentinaToday);
  const [metric, setMetric] = useState<ProgressMetric>("accuracy");
  const today = argentinaToday();
  const period = progressPeriod(view, view === "history" ? today : anchor);
  const queryEnd = period.to < today ? period.to : today;
  const currentPeriod = progressPeriod(view, today);
  const performance = useApiData(mentiaApi.performance);
  const evolution = useApiData((t) => mentiaApi.categoryProgress(t, period.granularity, period.from, queryEnd), [period.granularity, period.from, queryEnd]);

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
          Período
          <Select value={view} onChange={(e) => { setView(e.target.value as ProgressView); setAnchor(today); }}>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="history">Histórico</option>
          </Select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <strong className="text-sm" aria-live="polite">{period.label}</strong>
          {view !== "history" && <div className="flex gap-3">
            <button className="flow-link" aria-label="Período anterior" onClick={() => setAnchor(movePeriod(view, anchor, -1))}>Anterior</button>
            <button className="flow-link disabled:opacity-40" aria-label="Período siguiente" disabled={period.from >= currentPeriod.from}
              onClick={() => setAnchor(movePeriod(view, anchor, 1))}>Siguiente</button>
          </div>}
        </div>
        <div className="flex gap-2 my-4" role="group" aria-label="Dato del gráfico">
          <button className={metric === "accuracy" ? "flow-primary" : "flow-secondary"} aria-pressed={metric === "accuracy"} onClick={() => setMetric("accuracy")}>Precisión</button>
          <button className={metric === "difficulty" ? "flow-primary" : "flow-secondary"} aria-pressed={metric === "difficulty"} onClick={() => setMetric("difficulty")}>Dificultad</button>
        </div>
        <p className="text-xs mt-3">{view === "history" ? "Cada punto resume una semana de lunes a domingo." : view === "month" ? "Cada punto resume un mes. El mes seleccionado queda en el centro y los meses futuros quedan vacíos." : "Cada punto resume un día de entrenamiento."} Se usan los ejercicios de sesiones completadas, según la fecha de Argentina. Los días sin actividad quedan sin punto. El período actual se actualiza al completar sesiones.</p>
        {evolution.loading && <p className="mt-3">Cargando…</p>}
        {evolution.error && <p role="alert" className="mt-3">{evolution.error}</p>}
        {!evolution.loading && !evolution.error && evolution.data && !evolution.data.length && <p className="my-4">No hay sesiones completadas en este período. Podés consultar períodos anteriores.</p>}
        {!evolution.loading && !evolution.error && evolution.data?.map((c) => (
          <div key={c.category} className="mt-5">
            <h3 className="font-bold text-sm mb-2">{categoryName(categories, c.category)}</h3>
            <ProgressLineChart points={c.points} name={categoryName(categories, c.category)} granularity={period.granularity} from={period.from} to={period.to} metric={metric} />
            <details className="mt-2">
              <summary className="flow-link">Ver valores</summary>
              <ul className="text-sm mt-2 space-y-1">
                {c.points.map((p) => (
                  <li key={p.periodStart}>
                    {periodLabel(p.periodStart, period.granularity)}: {Math.round(p.accuracy * 100)}% de precisión · dificultad promedio {p.avgDifficultyLevel.toFixed(1)} · {p.sessions} {p.sessions === 1 ? "sesión" : "sesiones"}
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
