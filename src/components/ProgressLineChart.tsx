import React, { useEffect, useRef, useState } from "react";
import type { CategoryProgress } from "../services/api";
import { addDays, addMonths, isoWeek, periodDate, periodLabel, type Granularity } from "../utils/progressPeriods";

export type ProgressMetric = "accuracy" | "difficulty";
export function ProgressLineChart({ points, name, granularity, from, to, metric }: {
  points: CategoryProgress["points"];
  name: string;
  granularity: Granularity;
  from: string;
  to: string;
  metric: ProgressMetric;
}) {
  const difficulty = metric === "difficulty";
  const title = difficulty ? "Dificultad promedio practicada" : "Precisión";
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => {
      const available = element.getBoundingClientRect().width;
      if (available > 0) setWidth(available);
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const allDates: string[] = [];
  for (let day = from; day <= to; day = granularity === "month" ? addMonths(day, 1) : addDays(day, granularity === "week" ? 7 : 1)) allDates.push(day);
  const sideMonths = Math.max(1, Math.min(5, Math.floor((width - 100) / 140)));
  const center = Math.floor(allDates.length / 2);
  const dates = granularity === "month" ? allDates.slice(center - sideMonths, center + sideMonths + 1) : allDates;
  const byDate = new Map(points.map((point) => [point.periodStart, point]));
  const labelCount = Math.max(2, Math.floor((width - 100) / 60));
  const visibleLabels = Math.min(labelCount, dates.length);
  const labelIndexes = new Set(Array.from({ length: visibleLabels }, (_, index) =>
    visibleLabels === 1 ? 0 : Math.round(index * (dates.length - 1) / (visibleLabels - 1))));
  const maximum = difficulty ? Math.max(2, Math.ceil(Math.max(0, ...points.map((point) => point.avgDifficultyLevel)))) : 100;
  const value = (point: CategoryProgress["points"][number]) => difficulty ? point.avgDifficultyLevel : point.accuracy * 100;
  const formatValue = (number: number) => difficulty ? number.toFixed(1) : `${Math.round(number)}%`;
  const coordinates = dates.map((date, index) => {
    const point = byDate.get(date);
    return { date, point, x: dates.length === 1 ? width / 2 : 52 + index / (dates.length - 1) * (width - 104),
      y: point ? 175 - Math.max(0, Math.min(maximum, value(point))) / maximum * 140 : null };
  });
  // Un día sin actividad interrumpe la línea, sin inventar un valor de precisión o dificultad.
  const path = coordinates.map((point, index) => point.y === null ? ""
    : `${index > 0 && coordinates[index - 1].y !== null ? "L" : "M"}${point.x},${point.y}`).join(" ");
  return (
    <>
      <p className="text-xs mb-2">{title}{difficulty ? " · nivel de los ejercicios realizados" : " · promedio de aciertos en los ejercicios"}</p>
      <div ref={container} className="w-full min-w-0 overflow-hidden rounded-xl" role="region" aria-label={`Gráfico de ${name}`}>
        <svg viewBox={`0 0 ${width} 230`} width="100%" height="230" className="block w-full text-accent" role="img"
          aria-label={`${title} en ${name}. Valores disponibles debajo del gráfico.`}>
          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick}>
              <line x1="45" x2={width - 30} y1={175 - tick * 35} y2={175 - tick * 35} stroke="currentColor" opacity="0.15" />
              <text x="36" y={179 - tick * 35} textAnchor="end" fill="currentColor" fontSize="11">{formatValue(tick * maximum / 4)}</text>
            </g>
          ))}
          <path d={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          {coordinates.map(({ date, point, x, y }, index) => (
            <g key={date}>
              {point && <>
                <circle cx={x} cy={y!} r="5" fill="currentColor" tabIndex={0}>
                  <title>{periodLabel(date, granularity)} · {Math.round(point.accuracy * 100)}% de precisión · dificultad promedio {point.avgDifficultyLevel.toFixed(1)} · {point.sessions} sesiones</title>
                </circle>
                {(granularity !== "week" || labelIndexes.has(index)) && <text x={x} y={y! - 12} textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold">{formatValue(value(point))}</text>}
              </>}
              {(granularity === "month" || labelIndexes.has(index)) && <text x={x} y="202" textAnchor="middle" fill="currentColor" fontSize="10">
                {granularity === "week" ? `S${isoWeek(date).week}` : periodDate(date).toLocaleDateString("es-AR", granularity === "month" ? { month: "short", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" })}
              </text>}
            </g>
          ))}
        </svg>
      </div>
      {points.length === 1 && <p className="text-xs mt-1">Hay un período con actividad. Al entrenar en otra fecha podrás comparar los puntos.</p>}
    </>
  );
}
