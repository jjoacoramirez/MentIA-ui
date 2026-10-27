import { Select } from "../components/Select";
import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useJourney, categories } from "../context/JourneyContext";
import { Panel } from "./FlowScreens";
export const ProgressScreen: React.FC = () => {
  const { userStats, setCurrentTab } = useApp();
  const { history } = useJourney();
  const [range, setRange] = useState(7);
  const completed = history.filter((r) => r.status === "COMPLETED");
  const days = Array.from({ length: range }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - range + 1 + i);
    const sessions = completed.filter(
      (r) => new Date(r.finishedAt).toDateString() === date.toDateString(),
    );
    return {
      date,
      sessions,
      accuracy: sessions.length
        ? Math.round(
            (sessions.reduce((s, r) => s + r.accuracy, 0) / sessions.length) *
              100,
          )
        : 0,
    };
  });
  return (
    <Panel title="Tu progreso">
      <section className="flow-card mb-4">
        <div className="flex justify-between">
          <div>
            <span className="text-sm">Nivel de ejemplo</span>
            <strong className="block text-2xl font-space">
              Nivel {userStats.level}
            </strong>
          </div>
          <strong className="text-accent">
            {userStats.xp} XP
          </strong>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
          <span>
            <b className="block text-xl">{completed.length}</b>Sesiones
          </span>
          <span>
            <b className="block text-xl">{userStats.accuracy}%</b>Precisión
          </span>
          <span>
            <b className="block text-xl">{userStats.totalPlayTime}</b>Tiempo
          </span>
        </div>
      </section>
      <section className="flow-card mb-4">
        <h2 className="font-bold text-lg mb-3">Precisión por día</h2>
        <label>
          Período
          <Select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
          </Select>
        </label>
        {!completed.length && (
          <p className="my-4">Completá una sesión para ver tu evolución.</p>
        )}
        <div
          className="flex items-end gap-1 h-40 mt-5"
          role="img"
          aria-label="Gráfico de precisión media por día"
        >
          {days.map(({ date, sessions, accuracy }) => (
            <div
              key={date.toISOString()}
              className="flex-1 flex flex-col justify-end h-full"
              title={`${date.toLocaleDateString("es-AR")}: ${sessions.length ? accuracy + "%" : "sin sesiones"}`}
            >
              <div
                className="rounded-t-md bg-brand min-h-1"
                style={{ height: `${accuracy}%` }}
              />
              <span className="text-[9px] text-center mt-2">
                {range === 7 ? date.getDate() : ""}
              </span>
            </div>
          ))}
        </div>
        <details className="mt-4">
          <summary className="flow-link">Ver valores del gráfico</summary>
          <ul className="text-sm mt-2 space-y-2">
            {days.map((d) => (
              <li key={d.date.toISOString()}>
                {d.date.toLocaleDateString("es-AR")}:{" "}
                {d.sessions.length
                  ? `${d.accuracy}% · ${d.sessions.length} sesiones`
                  : "Sin sesiones"}
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section className="flow-card mb-4">
        <h2 className="font-bold text-lg mb-3">Desempeño por categoría</h2>
        {categories.map((c) => (
          <div
            className="flex justify-between py-3 border-b border-slate-300/20"
            key={c.code}
          >
            <span>{c.name}</span>
            <span className="text-sm">Sin datos aún</span>
          </div>
        ))}
        <p className="text-sm mt-4">
          El ejercicio provisional no asigna puntajes a las categorías. Estos
          valores se incorporarán con los ejercicios definitivos.
        </p>
      </section>
      <button
        className="flow-primary"
        onClick={() => setCurrentTab("entrenar")}
      >
        Preparar una sesión
      </button>
    </Panel>
  );
};
