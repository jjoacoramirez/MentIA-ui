export type Granularity = "day" | "week" | "month";
export type ProgressView = "week" | "month" | "history";

// La API agrupa por días de Argentina. Se usa UTC solo para operar fechas sin hora.
export function periodDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}
export function dateIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
export function addDays(iso: string, days: number): string {
  const date = periodDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return dateIso(date);
}
export function argentinaToday(): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (name: string) => parts.find((item) => item.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function isoWeek(iso: string): { week: number; year: number } {
  const thursday = periodDate(iso);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const year = thursday.getUTCFullYear();
  const firstDay = periodDate(`${year}-01-01`);
  return { week: Math.ceil(((thursday.getTime() - firstDay.getTime()) / 86400000 + 1) / 7), year };
}
export function periodLabel(iso: string, granularity: Granularity): string {
  const start = periodDate(iso);
  if (granularity === "month") {
    return start.toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  const format = (day: string) => periodDate(day).toLocaleDateString("es-AR", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
  if (granularity === "day") return format(iso);
  const { week, year } = isoWeek(iso);
  return `Semana ${week} de ${year} · ${format(iso)} – ${format(addDays(iso, 6))}`;
}
export function progressPeriod(view: ProgressView, anchor: string) {
  const date = periodDate(anchor);
  const monday = addDays(anchor, 1 - (date.getUTCDay() || 7));
  if (view === "month") {
    const first = new Date(date);
    first.setUTCDate(1);
    const last = new Date(first);
    last.setUTCMonth(last.getUTCMonth() + 1, 0);
    return { from: dateIso(first), to: dateIso(last), granularity: "day" as const, label: periodLabel(dateIso(first), "month") };
  }
  if (view === "history") {
    return { from: addDays(monday, -77), to: addDays(monday, 6), granularity: "week" as const, label: "Últimas 12 semanas" };
  }
  return { from: monday, to: addDays(monday, 6), granularity: "day" as const, label: periodLabel(monday, "week") };
}
export function movePeriod(view: ProgressView, anchor: string, direction: number): string {
  if (view === "month") {
    const date = periodDate(anchor);
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + direction);
    return dateIso(date);
  }
  return addDays(anchor, direction * 7);
}
