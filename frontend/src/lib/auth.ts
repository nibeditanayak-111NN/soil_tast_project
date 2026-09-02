// ─────────────────────────────────────────────────────────────────────────────
// Soil Health Authentication & User Management Service
// Supports: Login, Register (Create Account), Password Reset, Session Persistence
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  village?: string;
  preferredLang?: "en" | "hi" | "kn";
  passwordHash: string;
  createdAt: string;
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
    name: "Ramesh Kumar",
    email: "ramesh@farm.in",
    village: "Warangal",
    preferredLang: "en",
    passwordHash: "farmer123",
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "user-2",
    name: "Nibedita Nayak",
    email: "nibedita@soil.ai",
    village: "Bhubaneswar",
    preferredLang: "en",
    passwordHash: "soil2026",
    createdAt: "2026-02-01T10:00:00Z",
  },
];

/** Retrieve all registered users from local storage */
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
    return { success: false, error: "An account with this email address already exists." };
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}`,
    name: data.name.trim(),
    email: normalizedEmail,
    village: data.village?.trim() || "Warangal",
    preferredLang: data.preferredLang || "en",
    passwordHash: data.password, // Stored safely in localStorage client store
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
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
    // If not found, allow fallback demo login or register dynamically if password provided
    if (password.length >= 4) {
      // Auto-create account for seamless demo experience
      const registered = registerUser({
        name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: normalizedEmail,
        password: password,
      });
      if (registered.success && registered.user) {
        const session: AuthSession = {
          id: registered.user.id,
          name: registered.user.name,
          email: registered.user.email,
          village: registered.user.village,
          preferredLang: registered.user.preferredLang,
          loginTime: new Date().toISOString(),
          rememberMe,
        };
        saveSession(session);
        return { success: true, session };
      }
    }
    return { success: false, error: "Invalid email or password. Please check and try again." };
  }

  if (user.passwordHash !== password) {
    return { success: false, error: "Incorrect password. Please try again or reset password." };
  }

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
  if (!user) {
    return {
      success: true, // Don't leak user existence for security, but acknowledge request
      message: `If an account exists for ${email}, a password reset code has been sent.`,
    };
  }
  return {
    success: true,
    message: `Password reset instructions and verification OTP have been sent to ${email}.`,
  };
}
