/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScreenTab =
  | "landing"
  | "inicio"
  | "entrenar"
  | "progreso"
  | "perfil"
  | "registro"
  | "ingreso"
  | "recuperacion"
  | "configuracion"
  | "evaluacion"
  | "juego"
  | "resultado"
  | "historial"
  | "logros";

export type AppTheme = "dark" | "light" | "system";

export interface SymbolNode {
  id: string; // e.g. "1" to "9"
  numStr: string; // "01" to "09"
  name: string;
  icon: string;
  targetOrder?: number; // expected order if part of sequence
}

export interface SequenceStep {
  slotIndex: number;
  symbol: SymbolNode;
}

export type WidgetId =
  | "next_training"
  | "focus_metrics"
  | "evolution_chart"
  | "agility_tip"
  | "flash_challenge"
  | "neuro_state";

export interface DashboardWidget {
  id: WidgetId;
  title: string;
  enabled: boolean;
  order: number;
}

export interface UserStats {
  name: string;
  username: string;
  title: string;
  level: number;
  xp: number;
  streakDays: number;
  accuracy: number;
  topPercent: number;
  completedActivities: number;
  weeklySessions: number;
  totalPlayTime: string;
  recoveryCode: string;
}
