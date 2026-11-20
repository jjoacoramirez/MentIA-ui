import React from "react";
import type { CategoryProgress } from "../services/api";
import { periodDate, periodLabel, type Granularity } from "../utils/progressPeriods";

export function ProgressLineChart({ points, name, granularity }: {
  points: CategoryProgress["points"];
  name: string;
  granularity: Granularity;
}) {
  const sorted = [...points].sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  if (!sorted.length) return <p className="text-sm">Todavía no hay sesiones en esta área.</p>;
  const first = periodDate(sorted[0].periodStart).getTime();
  const last = periodDate(sorted[sorted.length - 1].periodStart).getTime();
  const periods = granularity === "week"
    ? (last - first) / (7 * 24 * 60 * 60 * 1000)
    : (periodDate(sorted[sorted.length - 1].periodStart).getUTCFullYear() - periodDate(sorted[0].periodStart).getUTCFullYear()) * 12
      + periodDate(sorted[sorted.length - 1].periodStart).getUTCMonth() - periodDate(sorted[0].periodStart).getUTCMonth();
  const width = Math.max(560, (periods + 1) * 100);
  const coordinates = sorted.map((point) => ({
    ...point,
    x: first === last ? width / 2 : 52 + (periodDate(point.periodStart).getTime() - first) / (last - first) * (width - 104),
    y: 175 - Math.max(0, Math.min(1, point.accuracy)) * 140,
  }));
  return (
    <>
      <div className="overflow-x-auto rounded-xl" tabIndex={0} role="region" aria-label={`Gráfico de ${name}`}>
        <svg viewBox={`0 0 ${width} 230`} style={{ minWidth: width }} className="w-full max-h-80 text-accent" role="img"
          aria-label={`Evolución de precisión en ${name}. Valores disponibles debajo del gráfico.`}>
          {[0, 25, 50, 75, 100].map((value) => (
            <g key={value}>
              <line x1="45" x2={width - 30} y1={175 - value * 1.4} y2={175 - value * 1.4} stroke="currentColor" opacity="0.15" />
              <text x="36" y={179 - value * 1.4} textAnchor="end" fill="currentColor" fontSize="11">{value}%</text>
            </g>
          ))}
          <polyline points={coordinates.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          {coordinates.map((point) => (
            <g key={point.periodStart}>
              <circle cx={point.x} cy={point.y} r="5" fill="currentColor" tabIndex={0}>
                <title>{periodLabel(point.periodStart, granularity)} · {Math.round(point.accuracy * 100)}% de precisión · nivel promedio {point.avgDifficultyLevel.toFixed(1)} · {point.sessions} sesiones</title>
              </circle>
              <text x={point.x} y={point.y - 12} textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold">{Math.round(point.accuracy * 100)}%</text>
              <text x={point.x} y="202" textAnchor="middle" fill="currentColor" fontSize="11">
                {periodDate(point.periodStart).toLocaleDateString("es-AR", granularity === "month"
                  ? { month: "short", year: "numeric", timeZone: "UTC" }
                  : { day: "numeric", month: "short", timeZone: "UTC" })}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {sorted.length === 1 && <p className="text-xs mt-1">Este es tu primer punto. Al completar sesiones en otro período verás la línea de evolución.</p>}
    </>
  );
}
