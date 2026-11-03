import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError, mentiaApi, type Session } from "../src/services/api";
import { Game } from "../src/games";

/**
 * Prueba de punta a punta contra MentIA-api real (no corre con `npm test`). Requiere el backend y el
 * servidor de Vite levantados; ver README. Recorre lo que hace la app con el mismo cliente HTTP y además
 * renderiza cada actividad real con su componente de juego.
 */
const PASSWORD = "una-clave-larga-e2e";

function smokeRender(session: Session) {
  for (const item of session.items) {
    render(<Game item={item} paused={false} onDone={() => undefined} />);
    expect(document.body.textContent?.length, `${item.exerciseType} no muestra nada`).toBeGreaterThan(0);
    cleanup();
  }
}

async function playAll(token: string, session: Session, accuracy: number) {
  for (const item of session.items) {
    await mentiaApi.recordAttempt(token, session.id, {
      clientAttemptId: crypto.randomUUID(),
      sessionItemId: item.sessionItemId,
      isCorrect: accuracy >= 0.8,
      accuracy,
      responseTimeMs: 600,
      metrics: { e2e: true },
    });
  }
}

describe("MentIA-api real", () => {
  it("recorre registro, evaluación, entrenamiento, progreso, logros y cierre", async () => {
    const username = `e2e_${Date.now().toString(36)}`;
    const registered = await mentiaApi.register(username, PASSWORD, "25-30");
    expect(registered.recoveryCode).toMatch(/^[2-9A-HJ-NP-Z]{5}(-[2-9A-HJ-NP-Z]{5}){3}$/);

    const { accessToken: token, role } = await mentiaApi.login(username, PASSWORD);
    expect(role).toBe("USER");

    const categories = await mentiaApi.categories(token);
    expect(categories.map((c) => c.code)).toEqual(expect.arrayContaining(["ATENCION", "MEMORIA_VISUAL", "MEMORIA_TRABAJO"]));
    const profile = await mentiaApi.updateProfile(token, { sessionMinutes: 10, goals: ["ATENCION"], onboardingCompleted: true });
    expect(profile).toMatchObject({ sessionMinutes: 10, onboardingCompleted: true, assessmentCompleted: false });

    // Sin evaluación no se puede entrenar.
    await expect(mentiaApi.createSession(token)).rejects.toMatchObject({ code: "ASSESSMENT_REQUIRED" });
    await expect(mentiaApi.skipAssessment(token)).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });

    // Evaluación: 6 actividades que el front sabe mostrar.
    const assessment = await mentiaApi.startAssessment(token);
    expect(assessment.items).toHaveLength(6);
    smokeRender(assessment);
    await mentiaApi.startSession(token, assessment.id);
    await playAll(token, assessment, 0.95);
    const assessmentResult = await mentiaApi.completeSession(token, assessment.id);
    expect(assessmentResult.categories.every((c) => c.difficultyLevelAfter === 5)).toBe(true);
    expect(assessmentResult.gamification?.xpEarned).toBeGreaterThan(0);
    expect((await mentiaApi.profile(token)).assessmentCompleted).toBe(true);

    // Entrenamiento: sesión generada por el servidor con la duración del perfil.
    const training = await mentiaApi.createSession(token);
    expect(training.plannedMinutes).toBe(10);
    expect(training.items.every((i) => i.difficultyLevel === 5)).toBe(true);
    smokeRender(training);
    await mentiaApi.startSession(token, training.id);
    await playAll(token, training, 0.5);
    const trainingResult = await mentiaApi.completeSession(token, training.id);
    expect(trainingResult.comparison).toBeNull();
    expect(await mentiaApi.sessionResult(token, training.id)).toEqual(trainingResult);

    // Una sesión de una sola área, que después se abandona.
    const abandoned = await mentiaApi.createSession(token, { durationMinutes: 5, category: "ATENCION" });
    expect(abandoned.items.length).toBeGreaterThan(0);
    expect(abandoned.items.every((i) => i.category === "ATENCION")).toBe(true);
    await mentiaApi.abandonSession(token, abandoned.id);

    const [summary, history, performance, evolution, gamification, achievements] = await Promise.all([
      mentiaApi.progressSummary(token),
      mentiaApi.sessions(token),
      mentiaApi.performance(token),
      mentiaApi.categoryProgress(token, "week"),
      mentiaApi.gamification(token),
      mentiaApi.achievements(token),
    ]);
    expect(summary).toMatchObject({ sessionsCompleted: 2, sessionsAbandoned: 1, currentStreakDays: 1 });
    expect(history.totalElements).toBe(3);
    expect(performance.categories).toHaveLength(3);
    expect(evolution.length).toBeGreaterThan(0);
    expect(gamification.xp).toBe(summary.gamification?.xp);
    expect(achievements.filter((a) => a.unlocked).map((a) => a.code)).toEqual(expect.arrayContaining(["FIRST_SESSION"]));

    // Regenerar el código pide la contraseña.
    await expect(mentiaApi.regenerateRecoveryCode(token, "otra-clave-cualquiera")).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });

    await mentiaApi.logout(token);
    const afterLogout = await mentiaApi.profile(token).catch((e: ApiError) => e);
    expect(afterLogout).toMatchObject({ status: 401 });
    screen.queryByText(""); // mantiene a jsdom activo hasta el final
  }, 60_000);
});
