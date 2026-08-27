import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sprout, Eye, EyeOff, Loader2 } from "lucide-react";
import { saveSession, getSession } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Soil Health AI" },
      { name: "description", content: "Sign in to access your AI soil health dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect to home
  useEffect(() => {
    if (getSession()) navigate({ to: "/" });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    // Simulate a brief loading state (no real backend auth needed for this demo)
    await new Promise((r) => setTimeout(r, 900));
    saveSession({ name: name.trim(), email: email.trim() });
    setLoading(false);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left Panel — Hero ── */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.32 0.09 145) 0%, oklch(0.45 0.14 80) 60%, oklch(0.55 0.16 42) 100%)",
        }}
      >
        {/* subtle dot grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Soil Health AI</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Smarter farming<br />starts with<br />
            <span className="text-yellow-200">healthy soil.</span>
          </h1>
          <p className="text-white/75 text-base leading-relaxed max-w-xs">
            AI-powered nutrient deficiency detection, crop recommendations, and field trend analysis — in your language.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
          {[
            { value: "95%", label: "Accuracy" },
            { value: "3", label: "Languages" },
            { value: "10+", label: "Crops covered" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-4">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-white/70 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Soil Health AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back 👋</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Sign in to access your soil dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="login-name" className="block text-sm font-medium text-foreground mb-1.5">
                Full Name
              </label>
              <input
                id="login-name"
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium rounded-lg bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            For demonstration purposes — any name, email &amp; password work.
          </p>
        </div>
      </div>
    </div>
  );
}
