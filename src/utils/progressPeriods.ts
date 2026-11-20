export type Granularity = "week" | "month";

// Las fechas de la API son días de calendario, sin conversión a la zona del dispositivo.
export function periodDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function periodLabel(iso: string, granularity: Granularity): string {
  const start = periodDate(iso);
  if (granularity === "month") {
    return start.toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const format = (date: Date) => date.toLocaleDateString("es-AR", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
  return `${format(start)} – ${format(end)}`;
}
