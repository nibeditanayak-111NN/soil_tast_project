// ─────────────────────────────────────────────────────────────────────────────
// Soil Health Authentication & Multi-Account Management Service
// Supports: Login, Register, Switch Account, "Use Another Account", Session Persistence
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  village?: string;
  preferredLang?: "en" | "hi" | "kn";
  passwordHash: string;
  createdAt: string;
  lastActive?: string;
}

export interface AuthSession {
  id: string;
  name: string;
  email: string;
  village?: string;
  preferredLang?: "en" | "hi" | "kn";
  loginTime: string;
  rememberMe?: boolean;
}

const SESSION_STORAGE_KEY = "soil_health_active_session";
const USERS_STORAGE_KEY = "soil_health_registered_users";

// Default pre-seeded demo accounts for quick testing
const DEFAULT_DEMO_USERS: UserProfile[] = [
  {
    id: "user-1",
    name: "Nibedita Nayak",
    email: "nibedita@soil.ai",
    village: "Bhubaneswar",
    preferredLang: "en",
    passwordHash: "soil2026",
    createdAt: "2026-02-01T10:00:00Z",
    lastActive: "2026-09-02T12:00:00Z",
  },
  {
    id: "user-2",
    name: "Ramesh Kumar",
    email: "ramesh@farm.in",
    village: "Warangal",
    preferredLang: "en",
    passwordHash: "farmer123",
    createdAt: "2026-01-15T08:00:00Z",
    lastActive: "2026-09-01T15:30:00Z",
  },
  {
    id: "user-3",
    name: "Priya Sharma",
    email: "priya.krishi@agri.gov.in",
    village: "Punjab Field Lab",
    preferredLang: "hi",
    passwordHash: "agri2026",
    createdAt: "2026-02-10T09:00:00Z",
    lastActive: "2026-08-28T11:00:00Z",
  },
];

/** Retrieve all registered / saved users on this device */
export function getAllUsers(): UserProfile[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
      return DEFAULT_DEMO_USERS;
    }
    const users = JSON.parse(raw) as UserProfile[];
    return users.length > 0 ? users : DEFAULT_DEMO_USERS;
  } catch {
    return DEFAULT_DEMO_USERS;
  }
}

/** Register a new user account */
export function registerUser(data: {
  name: string;
  email: string;
  password: string;
  village?: string;
  preferredLang?: "en" | "hi" | "kn";
}): { success: boolean; user?: UserProfile; error?: string } {
  const users = getAllUsers();
  const normalizedEmail = data.email.trim().toLowerCase();

  // Check if user already exists
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: "An account with this email address already exists. Please sign in instead." };
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}`,
    name: data.name.trim(),
    email: normalizedEmail,
    village: data.village?.trim() || "Warangal",
    preferredLang: data.preferredLang || "en",
    passwordHash: data.password,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  const updatedUsers = [newUser, ...users];
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  } catch (e) {
    console.error("[Auth] Failed to persist user list", e);
  }

  return { success: true, user: newUser };
}

/** Authenticate user credentials */
export function authenticateUser(
  email: string,
  password: string,
  rememberMe: boolean = true
): { success: boolean; session?: AuthSession; error?: string } {
  const users = getAllUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    // If user typed a new email + valid password, auto-register for seamless experience
    if (password.length >= 4) {
      const registered = registerUser({
        name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: normalizedEmail,
        password: password,
      });
      if (registered.success && registered.user) {
        return loginWithProfile(registered.user, rememberMe);
      }
    }
    return { success: false, error: "Account not found. Please check your email or create a new account." };
  }

  if (user.passwordHash !== password) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  return loginWithProfile(user, rememberMe);
}

/** Directly log in with an existing user profile (Switch Account) */
export function loginWithProfile(user: UserProfile, rememberMe: boolean = true): { success: boolean; session: AuthSession } {
  // Update last active
  const users = getAllUsers().map((u) =>
    u.id === user.id ? { ...u, lastActive: new Date().toISOString() } : u
  );
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}

  const session: AuthSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    village: user.village,
    preferredLang: user.preferredLang,
    loginTime: new Date().toISOString(),
    rememberMe,
  };

  saveSession(session);
  return { success: true, session };
}

/** Remove a saved account from the local device list */
export function removeSavedAccount(userId: string): UserProfile[] {
  const currentSession = getSession();
  if (currentSession && currentSession.id === userId) {
    clearSession();
  }
  const users = getAllUsers().filter((u) => u.id !== userId);
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
  return users;
}

/** Get active authenticated session */
export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

/** Save active session */
export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("[Auth] Failed to save session", e);
  }
}

/** Clear active session (Logout) */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error("[Auth] Failed to clear session", e);
  }
}

/** Password reset request simulation */
export function requestPasswordReset(email: string): { success: boolean; message: string } {
  const users = getAllUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  return {
    success: true,
    message: `Password reset verification instructions have been dispatched to ${email}.`,
  };
}
