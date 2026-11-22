import type { Role } from "../services/api";

/**
 * Sesión persistente del dispositivo. Nunca guarda contraseñas ni códigos de recuperación.
 * El servidor sigue validando la vigencia, el rol y las revocaciones de cada token.
 */
export interface StoredAuth {
  token: string;
  username: string;
  role: Role;
  renewedAt?: number;
  expiresAt?: number;
}

const AUTH = "mentia_auth_v1";
const DONE = "mentia_done_items_v1:";

export function loadAuth(): StoredAuth | null {
  try {
    const value = JSON.parse(localStorage.getItem(AUTH) || sessionStorage.getItem(AUTH) || "null");
    if (!value || typeof value.token !== "string" || typeof value.username !== "string"
      || (value.role !== "USER" && value.role !== "ADMIN")) return null;
    // Migra una sesión anterior que todavía esté abierta en esta pestaña.
    saveAuth(value);
    return value;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth) {
  try {
    localStorage.setItem(AUTH, JSON.stringify(auth));
    sessionStorage.removeItem(AUTH);
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar.
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH);
    sessionStorage.removeItem(AUTH);
  } catch {
    // Nada que limpiar.
  }
}

/** Solo planifica la renovación; la validez del JWT siempre la decide el servidor. */
export function shouldRenewAuth(auth: StoredAuth, now = Date.now()): boolean {
  if (auth.expiresAt && auth.expiresAt <= now) return false;
  return !auth.renewedAt || now - auth.renewedAt >= 864e5 || (!!auth.expiresAt && auth.expiresAt - now <= 864e5);
}

/** Ítems ya respondidos de una sesión en curso, para retomarla después de recargar sin repetirlos. */
export function loadDoneItems(sessionId: string): string[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(DONE + sessionId) || "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function saveDoneItems(sessionId: string, items: string[] | null) {
  try {
    if (items) sessionStorage.setItem(DONE + sessionId, JSON.stringify(items));
    else sessionStorage.removeItem(DONE + sessionId);
  } catch {
    // Si no se puede guardar, al retomar se vuelven a mostrar (el servidor no duplica intentos).
  }
}
