import { loadDemoProfile, restoreDemoSession, saveDemoProfile, endDemoSession, type AssessmentStatus } from "./demoStorage";
import { memoryProgress, streakDays } from "../domain/training";
import React, { createContext, useContext, useState, useEffect } from "react";
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
  enter: (alias: string, age?: string, registration?: boolean) => void;
  assessmentStatus: AssessmentStatus;
  assessmentRequired: boolean;
  canTrain: boolean;
  skipAssessment: () => void;
  storageAvailable: boolean;
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
  const [restored] = useState(restoreDemoSession);
  const [username, setUsername] = useState(restored?.username || "");
  const [ageRange, setAgeRange] = useState(restored?.ageRange || "18-24");
  const [minutes, setMinutes] = useState(restored?.minutes || 10);
  const [goals, setGoals] = useState(restored?.goals || [
    "MEMORIA",
    "ATENCION",
    "MEMORIA_TRABAJO",
  ]);
  const [configured, setConfigured] = useState(restored?.configured || false);
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus>(restored?.assessmentStatus || "pending");
  const [assessmentRequired, setAssessmentRequired] = useState(restored?.assessmentRequired || false);
  const assessed = assessmentStatus === "completed";
  const canTrain = configured && !assessmentRequired;
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [assessment, setAssessment] = useState(false);
  const [sessionLevel, setSessionLevel] = useState(1);
  const [history, setHistory] = useState<DemoResult[]>(restored?.history || []);
  const [selected, setSelected] = useState<DemoResult | null>(null);
  useEffect(() => {
    if (!username) return;
    setStorageAvailable(saveDemoProfile({ username, ageRange, minutes, goals, configured, assessmentStatus, assessmentRequired, history }));
  }, [username, ageRange, minutes, goals, configured, assessmentStatus, assessmentRequired, history]);
  useEffect(() => {
    if (!restored) return;
    setCurrentTab(!restored.configured ? "configuracion" : restored.assessmentRequired ? "evaluacion" : "inicio");
  }, []);
  function enter(alias: string, age = "18-24", registration = false) {
    const saved = registration ? null : loadDemoProfile(alias);
    setAgeRange(saved?.ageRange || age);
    setUsername(alias);
    setMinutes(saved?.minutes || 10);
    setGoals(saved?.goals || categories.map(c => c.code));
    setConfigured(registration ? false : true);
    setAssessmentStatus(saved?.assessmentStatus || "pending");
    setAssessmentRequired(registration);
    setHistory(saved?.history || []);
    setAssessment(false);
    setSelected(null);
    setCurrentTab(registration ? "configuracion" : "inicio");
  }
  function skipAssessment() {
    if (assessmentStatus !== "completed") setAssessmentStatus("skipped");
    setAssessmentRequired(false);
    setAssessment(false);
    setCurrentTab("inicio");
  }
  function logout() {
    endDemoSession();
    setUsername("");
    setHistory([]);
    setSelected(null);
    setAssessmentStatus("pending");
    setAssessmentRequired(false);
    setConfigured(false);
    setCurrentTab("landing");
  }
  function configure(duration: number, selectedGoals: string[]) {
    setMinutes(duration);
    setGoals(selectedGoals);
    setConfigured(true);
    setCurrentTab(assessmentRequired ? "evaluacion" : "perfil");
  }
  function begin(initial: boolean) {
    if (!initial && assessmentRequired) { setCurrentTab("evaluacion"); return; }
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
    if (assessment && !abandoned) { setAssessmentStatus("completed"); setAssessmentRequired(false); }
    setCurrentTab(abandoned ? "historial" : "resultado");
  }
  useEffect(() => {
    if (!username) return;
    const completed = history.filter((r) => r.status === "COMPLETED");
    const xp = completed.reduce((sum, r) => sum + r.xpEarned, 0);
    const attempts = completed.reduce((sum, r) => sum + r.itemsCompleted, 0);
    updateUser({
      name: username,
      username,
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
      streakDays: streakDays(history),
    });
  }, [username, history]);
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
        assessmentStatus,
        assessmentRequired,
        canTrain,
        skipAssessment,
        storageAvailable,
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
