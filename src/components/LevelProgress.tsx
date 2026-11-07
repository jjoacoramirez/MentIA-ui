import React from "react";

/** Puntos dentro del nivel (0 a 100): al llegar a 100 se sube de nivel y al llegar a 0 se baja. */
export function LevelProgress({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="level-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
      <span style={{ width: `${clamped}%` }} />
    </div>
  );
}

/** Qué pasó con el progreso del área en una sesión, en palabras. */
export function progressChange(levelBefore: number, levelAfter: number, before?: number | null, after?: number | null) {
  if (levelAfter > levelBefore) return `¡Subiste al nivel ${levelAfter}!`;
  if (levelAfter < levelBefore) return `Volvés al nivel ${levelAfter} para afianzar`;
  if (before == null || after == null) return null;
  const delta = after - before;
  if (delta > 0) return `+${delta} puntos en el nivel`;
  if (delta < 0) return `${delta} puntos en el nivel`;
  return "Sin cambios en el nivel";
}
