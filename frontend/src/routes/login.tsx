import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Sprout,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  MapPin,
  Globe2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import {
  getSession,
  authenticateUser,
  registerUser,
  requestPasswordReset,
  getAllUsers,
} from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Authentication — Soil Health AI Platform" },
      {
        name: "description",
        content: "Sign in or create a new account to access your AI Soil Health and Crop Recommendation dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "login" | "register" | "forgot";

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regVillage, setRegVillage] = useState("Warangal");
  const [regLang, setRegLang] = useState<"en" | "hi" | "kn">("en");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (getSession()) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = authenticateUser(loginEmail, loginPassword, rememberMe);
    setLoading(false);

    if (result.success) {
      navigate({ to: "/" });
    } else {
      setError(result.error || "Failed to sign in. Please verify your credentials.");
    }
  };

  // Handle Register (Create New Account)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!regEmail.includes("@") || !regEmail.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please re-type your password.");
      return;
    }
    if (!acceptTerms) {
      setError("Please agree to the Terms of Service & Agricultural Privacy Policy.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const result = registerUser({
      name: regName,
      email: regEmail,
      village: regVillage,
      preferredLang: regLang,
      password: regPassword,
    });

    if (result.success && result.user) {
      // Automatically log them in
      authenticateUser(result.user.email, regPassword, true);
      setLoading(false);
      navigate({ to: "/" });
    } else {
      setLoading(false);
      setError(result.error || "Registration failed. Please try a different email.");
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setError("Please enter a valid registered email address.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);

    const result = requestPasswordReset(forgotEmail);
    setSuccessMsg(
      `${result.message} (Demo OTP: 849201. Use your previous password or create a new account).`
    );
  };

  // Quick Demo Login Handler
  const handleQuickDemoLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setError("");
    authenticateUser(email, pass, true);
    navigate({ to: "/" });
  };

  // Password Strength Calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "bg-muted", width: "0%" };
    if (pass.length < 6) return { label: "Weak", color: "bg-destructive", width: "30%" };
    if (pass.length < 10) return { label: "Medium", color: "bg-yellow-500", width: "65%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength(regPassword);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* ── Left Side: Brand Story & Impact Panel ── */}
      <div
        className="hidden md:flex md:w-5/12 lg:w-1/2 flex-col justify-between p-10 lg:p-14 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.28 0.08 145) 0%, oklch(0.38 0.12 110) 45%, oklch(0.48 0.15 50) 100%)",
        }}
      >
        {/* Subtle Decorative Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/25">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight block">Soil Health AI</span>
              <span className="text-xs text-white/75 font-medium tracking-wide uppercase">
                Agritech Intelligence Platform
              </span>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4 tracking-tight">
            Intelligent Soil Diagnosis &amp; <br />
            <span className="text-amber-200">Sustainable Yield Forecasting.</span>
          </h1>
          <p className="text-white/80 text-sm lg:text-base leading-relaxed max-w-md">
            Empowering farmers, agronomists, and researchers with AI-driven nutrient detection,
            computer-vision soil profiling, fertilizer optimization, and automated advisory in local languages.
          </p>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 space-y-3 my-6">
          {[
            {
              title: "Precise N-P-K Nutrient Mapping",
              desc: "Instant deficiency diagnosis with automated fertilizer split dosages.",
            },
            {
              title: "AI Crop Recommendations",
              desc: "Ranked suitability matching across 25+ crops and multi-season cycles.",
            },
            {
              title: "Multilingual Voice Advisory",
              desc: "Native Text-to-Speech playback in English, Hindi (हिन्दी) & Kannada (ಕನ್ನಡ).",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-black/15 backdrop-blur-sm rounded-xl p-3.5 border border-white/10"
            >
              <CheckCircle2 className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                <p className="text-xs text-white/75 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Metrics Bar */}
        <div className="relative z-10 grid grid-cols-3 gap-3 text-center pt-4 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-xl font-bold">98.4%</div>
            <div className="text-[11px] text-white/70">Engine Accuracy</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-xl font-bold">25+</div>
            <div className="text-[11px] text-white/70">Crop Models</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-xl font-bold">Real-time</div>
            <div className="text-[11px] text-white/70">PWA Offline Mode</div>
          </div>
        </div>
      </div>

      {/* ── Right Side: Interactive Authentication Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="flex items-center gap-3 md:hidden mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">Soil Health AI</span>
              <span className="text-xs text-muted-foreground block">Farmer Intelligence Portal</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-muted p-1 border border-border">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In (Log In)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === "register"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Header Info */}
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {mode === "login" && "Welcome Back 👋"}
              {mode === "register" && "Create Farmer Account 🌱"}
              {mode === "forgot" && "Reset Your Password 🔑"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {mode === "login" && "Enter your registered credentials to access your soil analyses."}
              {mode === "register" && "Join the platform to track field health and receive tailored advice."}
              {mode === "forgot" && "Enter your email to receive password recovery instructions."}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 text-xs sm:text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2">
              <span className="text-base leading-none">✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* 1. SIGN IN (LOG IN) FORM                                   */}
          {/* ══════════════════════════════════════════════════════════ */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="farmer@soil.ai"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  autoComplete="email"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle Password Visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  Keep me signed in on this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-[0.99] transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Credentials…
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Logins */}
              <div className="pt-3 border-t border-border space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block text-center">
                  ⚡ 1-Click Quick Demo Accounts
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("nibedita@soil.ai", "soil2026")}
                    className="p-2 text-xs rounded-lg border border-border bg-card hover:bg-accent text-left transition"
                  >
                    <div className="font-semibold text-foreground truncate">Nibedita Nayak</div>
                    <div className="text-[10px] text-muted-foreground">nibedita@soil.ai</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("ramesh@farm.in", "farmer123")}
                    className="p-2 text-xs rounded-lg border border-border bg-card hover:bg-accent text-left transition"
                  >
                    <div className="font-semibold text-foreground truncate">Ramesh Kumar</div>
                    <div className="text-[10px] text-muted-foreground">ramesh@farm.in</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* 2. CREATE A NEW ACCOUNT (REGISTER) FORM                    */}
          {/* ══════════════════════════════════════════════════════════ */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nibedita Nayak"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@farm.org"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              {/* Location & Language in 2-Columns */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Village / Region
                  </label>
                  <input
                    type="text"
                    placeholder="Warangal"
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Language
                  </label>
                  <select
                    value={regLang}
                    onChange={(e) => setRegLang(e.target.value as any)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Create Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength Meter */}
                {regPassword && (
                  <div className="pt-1">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Strength: <strong className="text-foreground">{strength.label}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-type your password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              {/* Consent Terms */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground leading-snug">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 mt-0.5"
                  />
                  <span>
                    I agree to the <strong>Terms of Service</strong> &amp; acknowledge that soil recommendations are AI-assisted estimates.
                  </span>
                </label>
              </div>

              {/* Submit Register */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-[0.99] transition disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Your Account…
                  </>
                ) : (
                  <>
                    Complete Registration &amp; Sign In
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* 3. FORGOT PASSWORD FORM                                    */}
          {/* ══════════════════════════════════════════════════════════ */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your-email@farm.org"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Recovery Code…
                  </>
                ) : (
                  <>
                    Send Recovery Code
                    <KeyRound className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
                className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground pt-2"
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* Bottom Switcher */}
          <div className="text-center pt-2">
            {mode === "login" && (
              <p className="text-xs text-muted-foreground">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Create a New Account
                </button>
              </p>
            )}
            {mode === "register" && (
              <p className="text-xs text-muted-foreground">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign In here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
