// ─────────────────────────────────────────────────────────────────────────────
// Simple auth helper — persists session in localStorage
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = "soil_health_user";

export interface AuthUser {
  name: string;
  email: string;
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
