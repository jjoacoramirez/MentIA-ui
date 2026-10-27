/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { DashboardWidget } from "../types";

interface DraggableDashboardCardProps {
  widget: DashboardWidget;
  index: number;
  totalCount: number;
  children: React.ReactNode;
}

export const DraggableDashboardCard: React.FC<DraggableDashboardCardProps> = ({
  widget,
  index,
  totalCount,
  children,
}) => {
  const { isCustomizingLayout, reorderWidgets, toggleWidget } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (!isNaN(sourceIndex) && sourceIndex !== index) {
      reorderWidgets(sourceIndex, index);
    }
  };

  return (
    <div
      draggable={isCustomizingLayout}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-all duration-200 rounded-3xl ${
        isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"
      } ${
        isDragOver
          ? "ring-2 ring-brand ring-offset-2 dark:ring-offset-[#0f131c] shadow-lg shadow-brand/20"
          : ""
      } ${isCustomizingLayout ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-brand/50" : ""}`}
    >
      {/* Layout Edit Toolbar overlay when customizer is active */}
      {isCustomizingLayout && (
        <div className="mb-2 p-2 px-3 rounded-2xl bg-brand/10 dark:bg-[#181c24]/90 border border-brand dark:border-brand/30 flex items-center justify-between shadow-sm animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-accent text-[18px]"
            >
              drag_indicator
            </span>
            <span className="font-space text-[12px] font-bold text-slate-800 dark:text-[#dfe2ee] truncate">
              {widget.title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Move Up */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (index > 0) reorderWidgets(index, index - 1);
              }}
              disabled={index === 0}
              title="Mover arriba"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#262a33] text-slate-600 dark:text-[#bcc9cd] disabled:opacity-30 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[16px]"
              >
                arrow_upward
              </span>
            </button>

            {/* Move Down */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (index < totalCount - 1) reorderWidgets(index, index + 1);
              }}
              disabled={index === totalCount - 1}
              title="Mover abajo"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-[#262a33] text-slate-600 dark:text-[#bcc9cd] disabled:opacity-30 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[16px]"
              >
                arrow_downward
              </span>
            </button>

            {/* Hide/Remove */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWidget(widget.id);
              }}
              title="Ocultar componente"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors shadow-xs ml-1"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[16px]"
              >
                visibility_off
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Actual Component Content */}
      {children}
    </div>
  );
};
