import type { Role } from "../services/api";

/**
 * Sesión de la pestaña: token, username y rol en sessionStorage, para sobrevivir a una recarga.
 * Se borra al cerrar la pestaña o la sesión. Nunca se guardan contraseñas ni códigos de recuperación.
 */
export interface StoredAuth {
  token: string;
  username: string;
  role: Role;
}

const AUTH = "mentia_auth_v1";
const DONE = "mentia_done_items_v1:";

export function loadAuth(): StoredAuth | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(AUTH) || "null");
    return value && typeof value.token === "string" && typeof value.username === "string"
      && (value.role === "USER" || value.role === "ADMIN") ? value : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth) {
  try {
    sessionStorage.setItem(AUTH, JSON.stringify(auth));
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar.
  }
}

export function clearAuth() {
  try {
    sessionStorage.removeItem(AUTH);
  } catch {
    // Nada que limpiar.
  }
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
