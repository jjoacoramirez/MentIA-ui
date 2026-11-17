import React, { useEffect, useState } from "react";
import { ApiError, apiRequest, mentiaApi } from "../services/api";

interface Report {
  from: string;
  to: string;
  participants: number;
  activity: { day: string; active: number; started: number; completed: number; abandoned: number }[];
  cohorts: { bucket: number; participants: number; comparable: number; improved: number; meanChange: number | null }[];
  exercises: { code: string; name: string; category: string; attempts: number; players?: number; avgLevel?: number; accuracy: number; medianMs: number }[];
  options: { code: string; name: string; category: string; categoryName: string }[];
  // Opcionales: una API más vieja no los manda y el panel sigue funcionando sin esas secciones.
  overview?: { registered: number; newUsers: number; assessed: number; trained: number; reminderUsers: number; medianSessionSeconds: number | null };
  signups?: { day: string; users: number }[];
  hours?: { hour: number; started: number; completed: number }[];
  ageRanges?: { ageRange: string; users: number; active: number }[];
  levels?: { category: string; level: number; users: number }[];
  retention?: { d1Eligible: number; d1Returned: number; d7Eligible: number; d7Returned: number };
}

/** Barras simples: el alto es proporcional al máximo, y cada barra tiene su valor en el título para quien pase el mouse. */
function Bars({ items }: { items: { key: string; value: number; title: string }[] }) {
  const max = Math.max(1, ...items.map(item => item.value));
  return <div className="flex items-end gap-0.5 h-32" aria-hidden="true">
    {items.map(item => <div key={item.key} className="flex flex-1 h-full items-end" title={item.title}>
      <span className={`w-full rounded-t ${item.value ? "bg-brand" : "bg-slate-400/30"}`} style={{ height: item.value ? `${item.value / max * 100}%` : "2px" }} />
    </div>)}
  </div>;
}

const duration = (seconds: number | null | undefined) => {
  if (seconds == null) return "—";
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} min ${Math.round(seconds % 60)} s` : `${Math.round(seconds)} s`;
};

const number = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const signed = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2, signDisplay: "exceptZero" });
const cohortName = (bucket: number) => bucket === 1 ? "1 día" : bucket === 2 ? "2 a 3 días" : "4 días o más";
const percent = (part: number, total: number) => total ? `${number.format(100 * part / total)} %` : "—";
const date = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
const card = "flow-card space-y-3";
const control = "w-full rounded-xl border border-slate-400/40 bg-canvas px-3 py-2 text-ink";
const cell = "px-3 py-2 text-left";

export function AdminMetricsScreen() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState("30");
  const [category, setCategory] = useState("");
  const [exercise, setExercise] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [options, setOptions] = useState<Report["options"]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ days, category, exercise });
    setReport(null);
    setError("");
    apiRequest<Report>(`/admin/metrics?${query}`, { signal: controller.signal }, token)
      .then(data => {
        if (controller.signal.aborted) return;
        setOptions(data.options);
        setReport(data);
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && [401, 403].includes(failure.status)) setToken("");
        setError(failure instanceof ApiError ? failure.message : "No se pudo conectar con MentIA-api.");
      });
    return () => controller.abort();
  }, [token, days, category, exercise, revision]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await mentiaApi.login(username.trim().toLowerCase(), password);
      if (session.role !== "ADMIN") {
        await mentiaApi.logout(session.accessToken).catch(() => {});
        setError("El panel requiere una cuenta con rol ADMIN.");
        return;
      }
      setToken(session.accessToken);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "No se pudo conectar con MentIA-api.");
    } finally {
      setPassword("");
      setBusy(false);
    }
  }

  const totals = report?.activity.reduce((sum, day) => ({
    started: sum.started + day.started,
    completed: sum.completed + day.completed,
    abandoned: sum.abandoned + day.abandoned,
  }), { started: 0, completed: 0, abandoned: 0 });
  const comparable = report?.cohorts.reduce((sum, row) => sum + row.comparable, 0) ?? 0;
  const improved = report?.cohorts.reduce((sum, row) => sum + row.improved, 0) ?? 0;
  const practiced = report?.cohorts.reduce((sum, row) => sum + row.participants, 0) ?? 0;
  const returning = report?.cohorts.filter(row => row.bucket > 1).reduce((sum, row) => sum + row.participants, 0) ?? 0;
  const maxChange = Math.max(1, ...report?.cohorts.map(row => Math.abs(row.meanChange ?? 0)) ?? []);
  const maxActivity = Math.max(1, ...report?.activity.map(row => row.completed) ?? []);
  const categories = [...new Map(options.map(row => [row.category, row.categoryName]))];
  const timeline = report ? Array.from({ length: Number(days) }, (_, index) => {
    const day = new Date(`${report.from}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + index);
    const iso = day.toISOString().slice(0, 10);
    return { day: iso, completed: report.activity.find(row => row.day === iso)?.completed ?? 0 };
  }) : [];
  const signupTimeline = report ? timeline.map(row => ({ day: row.day, users: report.signups?.find(s => s.day === row.day)?.users ?? 0 })) : [];
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, ...(report?.hours?.find(row => row.hour === hour) ?? { started: 0, completed: 0 }) }));
  const peakHour = hourly.reduce((best, row) => row.started > best.started ? row : best, hourly[0]);
  const categoryNames = new Map(categories);
  const levelsByCategory = [...new Set(report?.levels?.map(row => row.category) ?? [])].map(code => {
    const rows = report!.levels!.filter(row => row.category === code);
    const top = Math.max(10, ...rows.map(row => row.level));
    return { code, name: categoryNames.get(code) ?? code, counts: Array.from({ length: top }, (_, i) => rows.find(row => row.level === i + 1)?.users ?? 0) };
  });

  return <main className="min-h-dvh bg-canvas text-ink px-4 py-6 sm:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-accent font-semibold">MentIA · Administración</p>
          <h1 className="text-3xl font-bold">Constancia y progreso</h1></div>
        <div className="flex gap-4 items-center">
          <a href="/" className="flow-link">Volver a MentIA</a>
          {token && <button className="flow-link" onClick={() => {
            const previous = token;
            setToken("");
            setReport(null);
            setOptions([]);
            setCategory("");
            setExercise("");
            setError("");
            void mentiaApi.logout(previous).catch(() => {});
          }}>Cerrar sesión</button>}
        </div>
      </header>
      {error && <p role="alert" className="flow-card text-rose-600 dark:text-rose-300">{error} {token && <button className="flow-link ml-3" onClick={() => setRevision(n => n + 1)}>Reintentar</button>}</p>}
      {!token ? <form className={`${card} max-w-md`} onSubmit={login}>
        <h2 className="text-xl font-bold">Ingreso de administración</h2>
        <label className="block">Alias<input className={control} autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} /></label>
        <label className="block">Contraseña<input className={control} autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="flow-primary" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button>
      </form> : <>
        <section aria-label="Filtros del reporte" className="flow-card grid gap-4 sm:grid-cols-3">
          <label>Período<select className={control} value={days} onChange={e => setDays(e.target.value)}>
            {[7, 30, 90].map(value => <option key={value} value={value}>Últimos {value} días</option>)}
          </select></label>
          <label>Categoría<select className={control} value={category} onChange={e => { setCategory(e.target.value); setExercise(""); }}>
            <option value="">Todas las categorías</option>
            {categories.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select></label>
          <label>Ejercicio<select className={control} value={exercise} onChange={e => setExercise(e.target.value)}>
            <option value="">Todos los ejercicios</option>
            {options.filter(row => !category || row.category === category).map(row => <option key={row.code} value={row.code}>{row.name}</option>)}
          </select></label>
        </section>
        {!report && !error && <p role="status">Cargando métricas…</p>}
        {report && totals && <>
          <p className="text-sm opacity-75">{date(report.from)} al {date(report.to)} · Entrenamientos · Hora de Argentina</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Participantes activos", number.format(report.participants), "Iniciaron al menos un entrenamiento"],
              ["Sesiones completadas", number.format(totals.completed), `${percent(totals.completed, totals.started)} de ${totals.started} iniciadas · ${totals.abandoned} abandonadas`],
              ["Volvieron otro día", percent(returning, practiced), `${returning} de ${practiced} con sesiones completadas`],
              ["Subieron de dificultad", percent(improved, comparable), `${improved} de ${comparable} participantes comparables`],
            ].map(([label, value, note]) => <section className={card} key={label}>
              <h2 className="text-sm font-semibold">{label}</h2>
              <strong className="block text-3xl text-accent tabular-nums">{value}</strong>
              <p className="text-xs opacity-75">{note}</p>
            </section>)}
          </div>
          {report.overview && <section className={card} aria-label="Cuentas">
            <h2 className="text-xl font-bold">Cuentas</h2>
            <p className="text-sm opacity-80">Totales de la plataforma, sin cuentas admin. Solo «nuevas» depende del período elegido.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Registradas", number.format(report.overview.registered), `${report.overview.newUsers} nuevas en el período`],
                ["Con evaluación inicial", percent(report.overview.assessed, report.overview.registered), `${report.overview.assessed} de ${report.overview.registered}`],
                ["Con algún entrenamiento", percent(report.overview.trained, report.overview.registered), `${report.overview.trained} de ${report.overview.registered}`],
                ["Recordatorio activado", percent(report.overview.reminderUsers, report.overview.registered), `${report.overview.reminderUsers} cuentas`],
                ["Duración de una sesión", duration(report.overview.medianSessionSeconds), "Mediana en el período"],
              ].map(([label, value, note]) => <div className="rounded-xl border border-slate-400/25 p-4 space-y-1" key={label}>
                <h3 className="text-sm font-semibold">{label}</h3>
                <strong className="block text-2xl text-accent tabular-nums">{value}</strong>
                <p className="text-xs opacity-75">{note}</p>
              </div>)}
            </div>
          </section>}
          {report.retention && <section className={card} aria-label="Retención">
            <h2 className="text-xl font-bold">Quiénes vuelven</h2>
            <p className="text-sm opacity-80">De quienes completaron su primer entrenamiento en el período, cuántos volvieron a entrenar. Solo cuenta a quien ya tuvo tiempo de volver y no usa los filtros de categoría ni ejercicio.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Al día siguiente", report.retention.d1Returned, report.retention.d1Eligible],
                ["Dentro de los 7 días", report.retention.d7Returned, report.retention.d7Eligible],
              ].map(([label, returned, eligible]) => <div className="rounded-xl border border-slate-400/25 p-4 space-y-1" key={label}>
                <h3 className="text-sm font-semibold">{label}</h3>
                <strong className="block text-3xl text-accent tabular-nums">{percent(Number(returned), Number(eligible))}</strong>
                <p className="text-xs opacity-75">{eligible ? `${returned} de ${eligible} personas` : "Todavía no hay personas que hayan tenido tiempo de volver"}</p>
              </div>)}
            </div>
          </section>}
          {report.signups && <section className={card}>
            <h2 className="text-xl font-bold">Altas por día</h2>
            <Bars items={signupTimeline.map(row => ({ key: row.day, value: row.users, title: `${date(row.day)} · ${row.users}` }))} />
            <div className="flex justify-between text-xs"><span>{date(report.from)}</span><span>{date(report.to)}</span></div>
          </section>}
          {report.hours && <section className={card}>
            <h2 className="text-xl font-bold">A qué hora entrenan</h2>
            <p className="text-sm opacity-80">Entrenamientos iniciados por hora del día (hora de Argentina).{peakHour.started > 0 && ` El pico es a las ${peakHour.hour} h.`}</p>
            <Bars items={hourly.map(row => ({ key: String(row.hour), value: row.started, title: `${row.hour} h · ${row.started} iniciados, ${row.completed} completados` }))} />
            <div className="flex justify-between text-xs"><span>0 h</span><span>12 h</span><span>23 h</span></div>
            <details><summary className="cursor-pointer text-accent">Ver detalle por hora</summary>
              <ul className="mt-2 max-h-48 overflow-auto text-sm">
                {hourly.filter(row => row.started).map(row => <li key={row.hour}>{row.hour} h · {row.started} iniciados · {row.completed} completados</li>)}
                {peakHour.started === 0 && <li>Sin entrenamientos con estos filtros.</li>}
              </ul>
            </details>
          </section>}
          {(report.ageRanges?.length || levelsByCategory.length) ? <div className="grid gap-6 lg:grid-cols-2">
            {report.ageRanges && report.ageRanges.length > 0 && <section className={card}>
              <h2 className="text-xl font-bold">Cuentas por rango etario</h2>
              <div className="overflow-auto"><table className="w-full text-sm">
                <thead><tr>{["Rango", "Cuentas", "Activas en el período"].map(label => <th key={label} scope="col" className={cell}>{label}</th>)}</tr></thead>
                <tbody>{report.ageRanges.map(row => <tr key={row.ageRange} className="border-t border-slate-400/25">
                  <th scope="row" className={cell}>{row.ageRange}</th><td className={cell}>{row.users}</td>
                  <td className={cell}>{row.active} ({percent(row.active, row.users)})</td>
                </tr>)}</tbody>
              </table></div>
              <p className="text-xs opacity-75">Con pocas cuentas en un rango, los porcentajes son poco representativos.</p>
            </section>}
            {levelsByCategory.length > 0 && <section className={card}>
              <h2 className="text-xl font-bold">Personas por nivel</h2>
              <p className="text-sm opacity-80">Cuántas están hoy en cada nivel, del 1 en adelante.</p>
              {levelsByCategory.map(row => <div key={row.code}>
                <h3 className="text-sm font-semibold">{row.name}</h3>
                <Bars items={row.counts.map((users, i) => ({ key: String(i + 1), value: users, title: `Nivel ${i + 1} · ${users}` }))} />
                <div className="flex justify-between text-xs"><span>Nivel 1</span><span>Nivel {row.counts.length}</span></div>
              </div>)}
            </section>}
          </div> : null}
          <section className={card}>
            <h2 className="text-xl font-bold">Cambio de dificultad según días de práctica</h2>
            <p className="text-sm opacity-80">Compara la primera y la última sesión del mismo ejercicio. Cada participante cuenta una vez, con el promedio de sus cambios. La relación es descriptiva.</p>
            {report.cohorts.length === 0 && <p>Todavía no hay entrenamientos completados con estos filtros.</p>}
            <div className="grid gap-3 md:grid-cols-3">
              {report.cohorts.map(row => <div className="rounded-xl border border-slate-400/25 p-4 space-y-2" key={row.bucket}>
                <h3 className="font-semibold">{cohortName(row.bucket)}</h3>
                <p className="text-2xl font-bold">{row.meanChange === null ? "—" : `${signed.format(row.meanChange)} niveles`}</p>
                {row.meanChange !== null && <div className="relative h-3 rounded bg-slate-500/15" aria-hidden="true">
                  <span className="absolute left-1/2 h-full w-px bg-slate-500" />
                  <span className={`absolute h-full rounded ${row.meanChange < 0 ? "bg-amber-500" : "bg-brand"}`}
                    style={{ width: `${Math.abs(row.meanChange) / maxChange * 50}%`, ...(row.meanChange < 0 ? { right: "50%" } : { left: "50%" }) }} />
                </div>}
                <p className="text-sm">{row.comparable} de {row.participants} comparables · {row.improved} subieron</p>
              </div>)}
            </div>
          </section>
          <section className={card}>
            <h2 className="text-xl font-bold">Entrenamientos completados por día</h2>
            <div className="flex items-end gap-0.5 h-32" aria-hidden="true">
              {timeline.map(row => <div key={row.day} className="flex flex-1 h-full items-end" title={`${date(row.day)} · ${row.completed}`}>
                <span className={`w-full rounded-t ${row.completed ? "bg-brand" : "bg-slate-400/30"}`} style={{ height: row.completed ? `${row.completed / maxActivity * 100}%` : "2px" }} />
              </div>)}
            </div>
            <div className="flex justify-between text-xs"><span>{date(report.from)}</span><span>{date(report.to)}</span></div>
            <details><summary className="cursor-pointer text-accent">Ver actividad diaria</summary>
              <ul className="mt-2 max-h-48 overflow-auto text-sm">
                {timeline.map(row => <li key={row.day}>{date(row.day)} · {row.completed} completadas</li>)}
              </ul>
            </details>
          </section>
          <section className={card}>
            <h2 className="text-xl font-bold">Desempeño por ejercicio</h2>
            {report.exercises.length === 0 ? <p>Sin intentos en entrenamientos completados.</p> :
              <div className="overflow-auto"><table className="w-full text-sm">
                <thead><tr>{["Ejercicio", "Jugadores", "Intentos", "Nivel medio", "Precisión media", "Tiempo mediano"].map(label => <th key={label} scope="col" className={cell}>{label}</th>)}</tr></thead>
                <tbody>{report.exercises.map(row => <tr key={row.code} className="border-t border-slate-400/25">
                  <th scope="row" className={cell}>{row.name}</th><td className={cell}>{row.players ?? "—"}</td><td className={cell}>{row.attempts}</td>
                  <td className={cell}>{row.avgLevel == null ? "—" : number.format(row.avgLevel)}</td>
                  <td className={cell}>{percent(row.accuracy, 1)}</td><td className={cell}>{number.format(row.medianMs / 1000)} s</td>
                </tr>)}</tbody>
              </table></div>}
          </section>
        </>}
      </>}
    </div>
  </main>;
}
