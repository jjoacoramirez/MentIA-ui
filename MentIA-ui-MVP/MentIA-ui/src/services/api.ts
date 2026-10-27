/** Contrato de transporte para MentIA-api. No se usa como fallback silencioso de la demo. */
const baseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"
).replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      problem.code || "HTTP_ERROR",
      problem.detail || problem.title || "No pudimos completar la solicitud.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export interface ProfileUpdate {
  ageRange?: "18-24" | "25-30" | "31-40" | "41+";
  sessionMinutes?: number;
  goals?: string[];
  onboardingCompleted?: boolean;
}
export const mentiaApi = {
  register: (username: string, password: string, ageRange: string) =>
    apiRequest<{ userId: string; recoveryCode: string | null }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ username, password, ageRange }),
      },
    ),
  login: (username: string, password: string) =>
    apiRequest<{ accessToken: string; tokenType: string; expiresIn: number }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ username, password }) },
    ),
  logout: (token: string) =>
    apiRequest<void>("/auth/logout", { method: "POST" }, token),
  resetPassword: (
    username: string,
    recoveryCode: string,
    newPassword: string,
  ) =>
    apiRequest<{ recoveryCode: string }>("/auth/recovery/reset", {
      method: "POST",
      body: JSON.stringify({ username, recoveryCode, newPassword }),
    }),
  profile: (token: string) =>
    apiRequest<ProfileUpdate & { assessmentCompleted: boolean }>(
      "/profile",
      {},
      token,
    ),
  updateProfile: (token: string, profile: ProfileUpdate) =>
    apiRequest(
      "/profile",
      { method: "PUT", body: JSON.stringify(profile) },
      token,
    ),
};
