import React from "react";
import { useJourney } from "../context/JourneyContext";
import { useApiData } from "../hooks/useApiData";
import { mentiaApi, type ConsistencyGroup, type ConsistencyReport } from "../services/api";
import { Panel } from "./FlowScreens";

/** Por debajo de esta cantidad de usuarios, los promedios de un grupo se marcan como poco representativos. */
const SMALL_GROUP = 5;

const percent = (value?: number | null) => (value == null ? "—" : `${Math.round(value * 100)}%`);
const points = (value?: number | null) =>
  value == null ? "—" : `${value > 0 ? "+" : ""}${Math.round(value * 100)} pp`;
const signed = (value?: number | null, decimals = 2) =>
  value == null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(decimals)}`;

/**
 * Panel admin: evolución del desempeño dentro de MentIA según la constancia de los usuarios, solo en agregados por
 * grupo (el servidor no devuelve datos individuales). Pensado para analizar y presentar resultados.
 */
export function AdminScreen() {
  const { isAdmin, categories } = useJourney();
  const report = useApiData(mentiaApi.consistencyReport, []);

  if (!isAdmin) {
    return <Panel title="Panel admin"><p>No tenés acceso a esta sección.</p></Panel>;
  }
  if (report.error) {
    return <Panel title="Panel admin"><p role="alert">No se pudo cargar el reporte: {report.error}</p></Panel>;
  }
  if (!report.data) {
    return <Panel title="Panel admin"><p role="status">Cargando el reporte…</p></Panel>;
  }

  const data = report.data;
  const trained = data.groups.filter((g) => g.minActiveDays > 0);
  return (
    <Panel title="Panel admin">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
        Evolución del desempeño dentro de MentIA según la constancia: cada usuario cae en un grupo según la cantidad de
        días en los que completó al menos una sesión. Solo hay agregados por grupo, sin datos individuales. No incluye
        cuentas admin.
      </p>

      <section className="admin-tiles mb-5" aria-label="Totales">
        <Tile label="Usuarios" value={data.totals.users} />
        <Tile label="Con evaluación inicial" value={data.totals.usersWithStartingPoint} />
        <Tile label="Con al menos una sesión" value={data.totals.usersWithTraining} />
        <Tile label="Sesiones completadas" value={data.totals.sessionsCompleted} />
        <Tile label="Abandono" value={percent(data.totals.abandonRate)} />
      </section>

      <section className="flow-card mb-5">
        <h2 className="font-bold mb-1">Cambio de precisión por constancia</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          Precisión de la última sesión menos la de la primera, en puntos porcentuales. Solo usuarios con 2 sesiones o más.
        </p>
        <DeltaBars groups={trained} value={(g) => g.avgAccuracyDelta} format={points} scale={0.3} />
      </section>

      <section className="flow-card mb-5">
        <h2 className="font-bold mb-1">Cambio de nivel por constancia</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          Nivel actual menos el nivel de la primera sesión, promediado por usuario y área.
        </p>
        <DeltaBars groups={trained} value={(g) => g.avgLevelDelta} format={(v) => signed(v)} scale={3} />
      </section>

      <section className="flow-card mb-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold">Detalle por grupo</h2>
          <button className="flow-link" onClick={() => downloadCsv(data, categories)}>Descargar CSV</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Constancia</th>
                <th scope="col">Usuarios</th>
                <th scope="col">Sesiones por usuario</th>
                <th scope="col">Abandono</th>
                <th scope="col">Precisión 1.ª → última</th>
                <th scope="col">Cambio de precisión</th>
                <th scope="col">Cambio de nivel</th>
              </tr>
            </thead>
            <tbody>
              {data.groups.map((g) => (
                <tr key={g.label}>
                  <th scope="row">
                    {g.label}
                    {g.users > 0 && g.users < SMALL_GROUP && <span className="admin-small" title="Grupo chico: interpretar con cuidado"> *</span>}
                  </th>
                  <td>{g.users}</td>
                  <td>{g.avgSessionsPerUser ?? "—"}</td>
                  <td>{percent(g.abandonRate)}</td>
                  <td>{g.avgFirstAccuracy == null ? "—" : `${percent(g.avgFirstAccuracy)} → ${percent(g.avgLastAccuracy)}`}</td>
                  <td>{points(g.avgAccuracyDelta)}</td>
                  <td>{signed(g.avgLevelDelta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-3">* Menos de {SMALL_GROUP} usuarios: los promedios son poco representativos.</p>
      </section>

      <section className="flow-card mb-5">
        <h2 className="font-bold mb-3">Cambio de nivel por área</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Constancia</th>
                {categories.filter((c) => c.mvp).map((c) => <th scope="col" key={c.code}>{c.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {trained.map((g) => (
                <tr key={g.label}>
                  <th scope="row">{g.label}</th>
                  {categories.filter((c) => c.mvp).map((c) => {
                    const area = g.categories.find((x) => x.category === c.code);
                    return <td key={c.code}>{area ? `${signed(area.avgLevelDelta)} (${area.users})` : "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-3">Entre paréntesis, los usuarios del grupo que entrenaron esa área.</p>
      </section>

      <p className="text-xs text-slate-500">
        Generado {new Date(data.generatedAt).toLocaleString("es-AR")} · días contados en {data.timeZone}. Los valores describen
        el desempeño dentro de MentIA, no capacidades.
      </p>
    </Panel>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flow-card admin-tile">
      <p className="font-space text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  );
}

/**
 * Barras horizontales desde una línea de cero (los cambios pueden ser negativos). Una sola serie: el título del
 * gráfico la nombra y cada barra lleva su valor; la tabla de detalle es la vista accesible.
 */
function DeltaBars({ groups, value, format, scale }: {
  groups: ConsistencyGroup[];
  value: (g: ConsistencyGroup) => number | null | undefined;
  format: (v?: number | null) => string;
  /** Valor que ocupa media barra como mínimo; si algún valor es mayor, la escala se agranda. */
  scale: number;
}) {
  const max = Math.max(scale, ...groups.map((g) => Math.abs(value(g) ?? 0)));
  return (
    <div className="delta-bars" role="list">
      {groups.map((g) => {
        const v = value(g);
        const width = v == null ? 0 : (Math.abs(v) / max) * 50;
        return (
          <div className="delta-row" role="listitem" key={g.label} title={`${g.label}: ${format(v)} · ${g.users} usuarios`}>
            <span className="delta-label">{g.label}</span>
            <span className="delta-track">
              <span className="delta-zero" />
              {v != null && <span className="delta-bar" style={{ width: `${width}%`, [v >= 0 ? "left" : "right"]: "50%" }} />}
            </span>
            <span className="delta-value">{v == null ? "sin datos" : format(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

function downloadCsv(report: ConsistencyReport, categories: { code: string; name: string; mvp: boolean }[]) {
  const areas = categories.filter((c) => c.mvp);
  const header = ["constancia", "usuarios", "sesiones_completadas", "sesiones_abandonadas", "sesiones_por_usuario",
    "abandono", "usuarios_con_evolucion", "precision_primera", "precision_ultima", "cambio_precision", "cambio_nivel",
    ...areas.map((a) => `cambio_nivel_${a.code.toLowerCase()}`)];
  const cell = (v: unknown) => (v == null ? "" : String(v));
  const rows = report.groups.map((g) => [g.label, g.users, g.sessionsCompleted, g.sessionsAbandoned, g.avgSessionsPerUser,
    g.abandonRate, g.usersWithTrend, g.avgFirstAccuracy, g.avgLastAccuracy, g.avgAccuracyDelta, g.avgLevelDelta,
    ...areas.map((a) => g.categories.find((x) => x.category === a.code)?.avgLevelDelta)].map(cell));
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `mentia-constancia-${report.generatedAt.slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

