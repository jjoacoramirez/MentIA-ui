import { memoryProgress, streakDays } from "../domain/training";
import React, { createContext, useContext, useState } from "react";
import { useApp } from "./AppContext";
export const categories = [
  { code: "MEMORIA", name: "Memoria" },
  { code: "ATENCION", name: "Atención" },
  { code: "MEMORIA_TRABAJO", name: "Memoria de trabajo" },
];
export interface DemoResult {
  id: string;
  type: "INITIAL_ASSESSMENT" | "TRAINING";
  status: "COMPLETED" | "ABANDONED";
  finishedAt: string;
  accuracy: number;
  correctCount: number;
  itemsCompleted: number;
  totalTimeMs: number;
  xpEarned: number;
  category: string;
  difficultyLevel: number;
}
interface Journey {
  username: string;
  enter: (alias: string, age?: string) => void;
  ageRange: string;
  logout: () => void;
  minutes: number;
  goals: string[];
  configure: (minutes: number, goals: string[]) => void;
  configured: boolean;
  assessed: boolean;
  assessment: boolean;
  sessionLevel: number;
  begin: (assessment: boolean) => void;
  history: DemoResult[];
  selected: DemoResult | null;
  select: (result: DemoResult) => void;
  finish: (
    correct: number,
    count: number,
    elapsed: number,
    abandoned?: boolean,
  ) => void;
}
const Context = createContext<Journey | null>(null);
export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const { setCurrentTab, updateUser } = useApp();
  const [username, setUsername] = useState("");
  const [ageRange, setAgeRange] = useState("18-24");
  const [minutes, setMinutes] = useState(10);
  const [goals, setGoals] = useState([
    "MEMORIA",
    "ATENCION",
    "MEMORIA_TRABAJO",
  ]);
  const [configured, setConfigured] = useState(false);
  const [assessed, setAssessed] = useState(false);
  const [assessment, setAssessment] = useState(false);
  const [sessionLevel, setSessionLevel] = useState(1);
  const [history, setHistory] = useState<DemoResult[]>([]);
  const [selected, setSelected] = useState<DemoResult | null>(null);
  function enter(alias: string, age = "18-24") {
    setAgeRange(age);
    setUsername(alias);
    setMinutes(10);
    setGoals(categories.map((c) => c.code));
    setConfigured(false);
    setAssessed(false);
    setHistory([]);
    setSelected(null);
    updateUser({
      name: alias,
      username: alias,
      xp: 0,
      level: 1,
      completedActivities: 0,
      accuracy: 0,
      streakDays: 0,
    });
    setCurrentTab("configuracion");
  }
  function logout() {
    setUsername("");
    setHistory([]);
    setSelected(null);
    setAssessed(false);
    setConfigured(false);
    setCurrentTab("landing");
  }
  function configure(duration: number, selectedGoals: string[]) {
    setMinutes(duration);
    setGoals(selectedGoals);
    setConfigured(true);
    setCurrentTab(assessed ? "perfil" : "evaluacion");
  }
  function begin(initial: boolean) {
    if (!initial && !assessed) { setCurrentTab("evaluacion"); return; }
    setSessionLevel(initial ? 1 : memoryProgress(history).level);
    setAssessment(initial);
    setCurrentTab("juego");
  }
  function finish(
    correct: number,
    count: number,
    elapsed: number,
    abandoned = false,
  ) {
    const result: DemoResult = {
      id: crypto.randomUUID(),
      type: assessment ? "INITIAL_ASSESSMENT" : "TRAINING",
      status: abandoned ? "ABANDONED" : "COMPLETED",
      finishedAt: new Date().toISOString(),
      category: "MEMORIA",
      difficultyLevel: sessionLevel,
      accuracy: count ? correct / count : 0,
      correctCount: correct,
      itemsCompleted: count,
      totalTimeMs: elapsed,
      xpEarned: abandoned ? 0 : count * 10 + correct * 10,
    };
    const next = [result, ...history];
    setHistory(next);
    setSelected(result);
    if (assessment && !abandoned) setAssessed(true);
    const completed = next.filter((r) => r.status === "COMPLETED");
    const xp = completed.reduce((sum, r) => sum + r.xpEarned, 0);
    const attempts = completed.reduce((sum, r) => sum + r.itemsCompleted, 0);
    updateUser({
      xp,
      level: Math.floor(xp / 200) + 1,
      completedActivities: attempts,
      accuracy: attempts
        ? Math.round(
            (100 * completed.reduce((s, r) => s + r.correctCount, 0)) /
              attempts,
          )
        : 0,
      weeklySessions: completed.length,
      totalPlayTime: `${Math.round(completed.reduce((s, r) => s + r.totalTimeMs, 0) / 60000)} min`,
      streakDays: streakDays(next),
    });
    setCurrentTab(abandoned ? "historial" : "resultado");
  }
  return (
    <Context.Provider
      value={{
        username,
        ageRange,
        enter,
        logout,
        minutes,
        goals,
        configure,
        configured,
        assessed,
        assessment,
        sessionLevel,
        begin,
        history,
        selected,
        select: (r) => {
          setSelected(r);
          setCurrentTab("resultado");
        },
        finish,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useJourney() {
  const context = useContext(Context);
  if (!context) throw new Error("Falta JourneyProvider");
  return context;
}
