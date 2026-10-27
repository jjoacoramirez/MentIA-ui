import { streakDays } from "../domain/training";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useJourney } from "../context/JourneyContext";
import { DraggableDashboardCard } from "../components/DraggableDashboardCard";
import { DashboardWidget, WidgetId } from "../types";

export const HomeScreen: React.FC = () => {
  const {
    setCurrentTab,
    userStats,
    widgets,
    isCustomizingLayout,
    setIsCustomizingLayout,
    resetWidgets,
    toggleWidget,
  } = useApp();

  const { history, minutes } = useJourney();
  const [selectedDay, setSelectedDay] = useState<string>("V");
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);

  // Active enabled widgets sorted by order
  const enabledWidgets = [...widgets]
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order);

  const disabledWidgets = [...widgets].filter((w) => !w.enabled);

  const daysData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const sessions = history.filter(
      (r) =>
        r.status === "COMPLETED" &&
        new Date(r.finishedAt).toDateString() === date.toDateString(),
    );
    const xp = sessions.reduce((s, r) => s + r.xpEarned, 0);
    return {
      label: ["D", "L", "M", "X", "J", "V", "S"][date.getDay()],
      full: date.toLocaleDateString("es-AR", { weekday: "long" }),
      height: "h-8",
      heightPercent: Math.min(100, xp),
      minutes: `${Math.round(sessions.reduce((s, r) => s + r.totalTimeMs, 0) / 60000)} min`,
      xp,
      isToday: i === 6,
    };
  });

  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.id) {
      case "next_training":
        return (
          <div className="relative w-full rounded-3xl bg-white dark:bg-[#1c2028] p-5 overflow-hidden shadow-sm dark:shadow-xl border border-slate-200/70 dark:border-white/[0.04] transition-all">
            {/* Ambient background glows */}
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-brand/10 dark:bg-brand/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-indigo-500/10 dark:bg-[#3131c0]/20 blur-xl pointer-events-none" />

            <div className="relative flex flex-col gap-3.5 z-10">
              {/* Header tags */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 dark:bg-brand/15 text-accent">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[15px]"
                  >
                    auto_awesome
                  </span>
                  <span className="font-space text-[10px] tracking-wider uppercase font-bold">
                    Sesión de ejemplo
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#31353e] text-slate-600 dark:text-[#bcc9cd]">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[15px] text-amber-500 dark:text-[#ffb95f]"
                  >
                    timer
                  </span>
                  <span className="font-space text-[11px] font-bold text-slate-800 dark:text-[#dfe2ee]">
                    {minutes} min
                  </span>
                </div>
              </div>

              {/* Title and description */}
              <div className="flex flex-col gap-1">
                <h2 className="font-space text-[20px] md:text-[22px] font-bold text-slate-900 dark:text-[#dfe2ee] leading-tight">
                  Tu próximo entrenamiento
                </h2>
                <p className="font-dmsans text-[14px] text-slate-600 dark:text-[#bcc9cd] leading-snug">
                  Probá tres secuencias visuales mientras preparamos los
                  ejercicios definitivos.
                </p>
              </div>

              {/* Cognitive Tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#262a33] text-slate-700 dark:text-[#bcc9cd] font-space text-[11px] font-semibold">
                  Memoria
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#262a33] text-slate-700 dark:text-[#bcc9cd] font-space text-[11px] font-semibold">
                  Atención
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#262a33] text-slate-700 dark:text-[#bcc9cd] font-space text-[11px] font-semibold">
                  Memoria de trabajo
                </span>
              </div>

              {/* Futuristic Cybernetic Visual */}
              <div className="relative w-full h-36 rounded-2xl bg-brand/10 dark:bg-slate-900 overflow-hidden shadow-inner group">
                <div
                  className="w-full h-full bg-cover bg-center opacity-25 dark:opacity-100 transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDvFUu_CWN5HWmAe59tUrhV37oArunIylT5gkjeiVwgGjCTvSejtuP96H3RkGzdQl_Bz3j6EC5NhtOmFNw4dT-PTxUR50UEpQGA1sHoZ-JfU_0efkKXrwkdjGwhEas43W4REx2fW1aEgFy5-xx2JnzKEiCTyTxWi3FiBTYFL_9fKypMK_7zIfggUO5scEQ7MjhjT1iQmlcdOb8JZwLUrOQlgYo2Gr9-fBt9_uI2ScFI7O9fciQxw_34Hw')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 dark:from-black/85 dark:via-black/40 to-transparent flex items-end p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                    </span>
                    <span className="font-space text-[11px] text-accent font-bold tracking-wider uppercase">
                      Secuencias visuales listas
                    </span>
                  </div>
                </div>
              </div>

              {/* Start CTA Button */}
              <button
                onClick={() => setCurrentTab("entrenar")}
                className="w-full h-14 rounded-full bg-brand hover:bg-brand dark:hover:bg-brand text-brand-ink flex items-center justify-center gap-2 shadow-lg shadow-brand/25 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                <span className="font-space text-[18px] font-bold tracking-tight">
                  Empezar
                </span>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[24px]"
                >
                  play_arrow
                </span>
              </button>
            </div>
          </div>
        );

      case "focus_metrics":
        return (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-space text-[11px] text-slate-500 dark:text-[#bcc9cd] uppercase tracking-wider font-bold">
                Métricas de enfoque
              </span>
              <span className="font-space text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Resumen de actividad
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Card Racha */}
              <div className="flex flex-col justify-between p-4 rounded-3xl bg-white dark:bg-[#181c24] border border-slate-200/70 dark:border-white/[0.04] shadow-sm">
                <div className="flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-amber-500 dark:text-[#ffb95f] text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-[#262a33] text-amber-600 dark:text-[#ffb95f] font-space text-[10px] font-bold">
                    {streakDays(history) ? "En racha" : "Por empezar"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 mt-3">
                  <span className="font-space text-[22px] font-bold text-slate-900 dark:text-[#dfe2ee]">
                    {streakDays(history)} días
                  </span>
                  <span className="font-dmsans text-[12px] text-slate-500 dark:text-[#bcc9cd] leading-tight">
                    Racha de días consecutivos
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  {daysData.map((d) => (
                    <div
                      key={d.full}
                      title={d.full}
                      className={`h-2 flex-1 rounded-full ${d.xp ? "bg-amber-500" : "bg-slate-200 dark:bg-[#31353e]"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Card Sesión Previa */}
              <div className="flex flex-col justify-between p-4 rounded-3xl bg-white dark:bg-[#181c24] border border-slate-200/70 dark:border-white/[0.04] shadow-sm">
                <div className="flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-indigo-500 dark:text-[#c0c1ff] text-[22px]"
                  >
                    history_toggle_off
                  </span>
                  <span className="font-space text-[10px] text-slate-500 dark:text-[#869397] font-semibold uppercase">
                    Completado
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 mt-3">
                  <span className="font-space text-[22px] font-bold text-slate-900 dark:text-[#dfe2ee]">
                    Última sesión
                  </span>
                  <span className="font-dmsans text-[12px] text-indigo-600 dark:text-[#c0c1ff] font-semibold">
                    +
                    {history.find((r) => r.status === "COMPLETED")?.xpEarned ||
                      0}{" "}
                    XP de ejemplo
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-slate-500 dark:text-[#bcc9cd]">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[16px] text-emerald-500 dark:text-accent"
                  >
                    check_circle
                  </span>
                  <span className="font-space text-[10px] font-bold">
                    Bloque 3/3 superado
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "evolution_chart":
        return (
          <div className="w-full rounded-3xl bg-white dark:bg-[#181c24] p-5 flex flex-col gap-4 border border-slate-200/70 dark:border-white/[0.04] shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-space text-[18px] font-bold text-slate-900 dark:text-[#dfe2ee]">
                  Tu evolución
                </h3>
                <p className="font-dmsans text-[13px] text-slate-500 dark:text-[#bcc9cd]">
                  Constancia de entrenamiento durante los últimos 7 días
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand/10 dark:bg-[#1c2028] flex items-center justify-center text-accent shrink-0">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[18px]"
                >
                  trending_up
                </span>
              </div>
            </div>

            {/* 7-Day Interactive Bar Visualizer */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="w-full h-28 flex items-end justify-between px-2 pt-2">
                {daysData.map((d) => {
                  const isSelected = selectedDay === d.label;
                  return (
                    <div
                      key={d.label}
                      onClick={() => setSelectedDay(d.label)}
                      className="flex flex-col items-center gap-1.5 flex-1 group cursor-pointer"
                    >
                      {/* Tooltip on active or hover */}
                      <span
                        className={`font-space text-[9px] font-bold transition-all ${
                          d.isToday
                            ? "text-accent opacity-100 font-extrabold"
                            : isSelected
                              ? "text-slate-800 dark:text-white opacity-100"
                              : "text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {d.isToday ? "Hoy" : `${d.minutes}`}
                      </span>

                      {/* Bar */}
                      <div className="w-full flex justify-center items-end h-16">
                        <div
                          style={{ height: `${d.heightPercent}%` }}
                          className={`w-3.5 rounded-full transition-all duration-300 ${
                            d.isToday
                              ? "bg-brand shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                              : isSelected
                                ? "bg-indigo-500 dark:bg-brand"
                                : d.heightPercent > 30
                                  ? "bg-brand/70 dark:bg-brand/70 group-hover:bg-brand"
                                  : "bg-slate-200 dark:bg-[#31353e] group-hover:bg-slate-300"
                          }`}
                        />
                      </div>

                      <span
                        className={`font-space text-[11px] font-bold ${
                          d.isToday
                            ? "text-accent"
                            : "text-slate-500 dark:text-[#bcc9cd]"
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary of selected day */}
              <div className="px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0a0e16] flex items-center justify-between text-[11px] font-space text-slate-600 dark:text-[#bcc9cd]">
                <span>
                  Día seleccionado:{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {daysData.find((d) => d.label === selectedDay)?.full}
                  </strong>
                </span>
                <span className="text-accent font-bold">
                  {daysData.find((d) => d.label === selectedDay)?.xp} XP
                  acumulados
                </span>
              </div>
            </div>

            {/* Link to full progress */}
            <button
              onClick={() => setCurrentTab("progreso")}
              className="w-full h-12 rounded-full bg-slate-100 dark:bg-[#262a33] hover:bg-slate-200 dark:hover:bg-[#31353e] text-slate-800 dark:text-[#dfe2ee] flex items-center justify-between px-4 transition-colors font-space text-[13px] font-bold cursor-pointer"
            >
              <span>Ver progreso completo</span>
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px] text-accent"
              >
                arrow_forward
              </span>
            </button>
          </div>
        );

      case "agility_tip":
        return (
          <div className="w-full rounded-2xl bg-white dark:bg-[#0a0e16] p-4 flex items-center gap-3.5 border border-slate-200/70 dark:border-white/[0.04] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-[#ffb95f] flex items-center justify-center shrink-0">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[22px]"
              >
                emoji_objects
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-space text-[10px] text-amber-600 dark:text-[#ffb95f] uppercase tracking-wider font-bold">
                Consejo de agilidad
              </span>
              <p className="font-dmsans text-[13px] text-slate-600 dark:text-[#bcc9cd] leading-snug">
                Entrenar en sesiones cortas antes de estudiar o trabajar eleva
                tu estado de flujo natural.
              </p>
            </div>
          </div>
        );

      case "flash_challenge":
        return (
          <div className="w-full rounded-3xl bg-white dark:bg-[#181c24] p-5 text-ink shadow-md border border-brand/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-accent text-[20px]"
                >
                  electric_bolt
                </span>
                <span className="font-space text-[11px] uppercase tracking-wider text-accent font-bold">
                  Secuencias de ejemplo
                </span>
              </div>
              <span className="font-space text-[10px] bg-brand/30 text-accent px-2 py-0.5 rounded-full font-bold">
                XP de ejemplo
              </span>
            </div>
            <p className="font-dmsans text-[13px] text-slate-300">
              Probá el mismo ejercicio provisional de secuencias visuales.
            </p>
            <button
              onClick={() => setCurrentTab("entrenar")}
              className="w-full h-11 rounded-xl bg-brand hover:bg-brand text-slate-950 font-space font-bold text-[13px] flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <span>Comenzar Sprint</span>
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[16px]"
              >
                play_arrow
              </span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen px-4 pt-2 pb-28 select-none bg-canvas text-ink transition-colors">
      {/* Saludo & Nivel Usuario */}
      <div className="flex items-center justify-between gap-3 pt-2 mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="font-space font-bold text-[22px] md:text-[24px] text-slate-900 dark:text-[#dfe2ee] tracking-tight">
              Hola, {userStats.name}
            </h1>
            <span className="text-[20px] select-none animate-bounce">👋</span>
          </div>
          <p className="font-dmsans text-[13px] text-slate-500 dark:text-[#bcc9cd]">
            Sintonizá tu agilidad cognitiva hoy
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#262a33] border border-slate-200/80 dark:border-white/[0.04] text-accent shadow-sm shrink-0">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[16px] text-accent"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            bolt
          </span>
          <span className="font-space text-[11px] font-bold text-slate-800 dark:text-[#dfe2ee]">
            Nivel {userStats.level}{" "}
            <span className="text-slate-400 dark:text-white/30">•</span>{" "}
            {userStats.xp} XP
          </span>
        </div>
      </div>

      {/* Drag & Drop Customizer Banner */}
      {isCustomizingLayout && (
        <div className="mb-4 p-3.5 rounded-2xl bg-brand/10 dark:bg-brand/40 border-2 border-brand/40 flex flex-col gap-2.5 animate-fade-in shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-accent text-[20px]"
              >
                open_with
              </span>
              <span className="font-space text-[13px] font-bold text-accent">
                Organizador Drag &amp; Drop Activo
              </span>
            </div>
            <button
              onClick={() => setIsCustomizingLayout(false)}
              className="px-3 py-1 rounded-full bg-brand text-brand-ink font-space text-[11px] font-bold shadow-sm hover:bg-brand cursor-pointer"
            >
              Listo
            </button>
          </div>

          <p className="font-dmsans text-[12px] text-slate-600 dark:text-slate-300 leading-snug">
            Arrastrá cualquier componente para moverlo de posición. Usá los
            botones de flecha o el menú para añadir más módulos.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowAddWidgetModal(true)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-white dark:bg-[#262a33] text-accent border border-brand dark:border-brand/30 font-space text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[15px]"
              >
                add_circle
              </span>
              <span>Añadir Módulos</span>
            </button>

            <button
              onClick={resetWidgets}
              className="py-1.5 px-3 rounded-xl bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-space text-[11px] font-bold hover:bg-slate-300"
            >
              Restablecer
            </button>
          </div>
        </div>
      )}

      {/* Dynamic List of Draggable Dashboard Widgets */}
      <div className="flex flex-col gap-4">
        {enabledWidgets.map((widget, index) => (
          <DraggableDashboardCard
            key={widget.id}
            widget={widget}
            index={index}
            totalCount={enabledWidgets.length}
          >
            {renderWidgetContent(widget)}
          </DraggableDashboardCard>
        ))}
      </div>

      {/* Add Widget Modal */}
      {showAddWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1c2028] border border-slate-200 dark:border-white/10 rounded-3xl p-5 w-full max-w-[340px] shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-space text-[16px] font-bold text-slate-900 dark:text-[#dfe2ee]">
                Módulos del Dashboard
              </h3>
              <button
                onClick={() => setShowAddWidgetModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#262a33] flex items-center justify-center text-slate-500"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[18px]"
                >
                  close
                </span>
              </button>
            </div>

            <p className="font-dmsans text-[12px] text-slate-500 dark:text-[#bcc9cd]">
              Activá o desactivá los componentes que quieras ver en tu pantalla
              principal:
            </p>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {widgets.map((w) => (
                <div
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    w.enabled
                      ? "bg-brand/10 dark:bg-brand/30 border-brand dark:border-brand/40 text-accent"
                      : "bg-slate-50 dark:bg-[#0a0e16] border-slate-200 dark:border-white/5 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[18px]"
                    >
                      {w.enabled ? "check_box" : "check_box_outline_blank"}
                    </span>
                    <span className="font-space text-[12px] font-semibold">
                      {w.title}
                    </span>
                  </div>
                  <span className="font-space text-[10px] uppercase font-bold">
                    {w.enabled ? "Activo" : "Oculto"}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAddWidgetModal(false)}
              className="mt-2 w-full h-11 rounded-xl bg-brand hover:bg-brand text-brand-ink font-space font-bold text-[13px]"
            >
              Guardar Selección
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
