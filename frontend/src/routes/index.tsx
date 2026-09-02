import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  LogOut,
  Sprout,
  Trash2,
  User,
  Users,
  ChevronDown,
  UserPlus,
  Check,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/soil/CameraCapture";
import { SoilForm } from "@/components/soil/SoilForm";
import { ReportView } from "@/components/soil/ReportView";
import { analyzeSoil, computeTrend } from "@/lib/soil/engine";
import { classifySoilImage } from "@/lib/soil/vision";
import { deleteReport, loadReports, saveReport } from "@/lib/soil/storage";
import { langNames, makeT, type Lang } from "@/lib/soil/i18n";
import type { SoilReport, SoilTestInput } from "@/lib/soil/types";
import {
  clearSession,
  getSession,
  getAllUsers,
  loginWithProfile,
  type UserProfile,
} from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soil Health — AI Nutrient Diagnosis & Crop Advice" },
      {
        name: "description",
        content:
          "Photograph your field soil or enter lab readings to get an AI soil health score, nutrient deficiency diagnosis, fertiliser doses and crop recommendations.",
      },
      { property: "og:title", content: "Soil Health — AI Nutrient Diagnosis & Crop Advice" },
      {
        property: "og:description",
        content:
          "AI soil health reports with fertiliser and crop recommendations in English, Hindi and Kannada.",
      },
    ],
  }),
  component: Index,
});

const DEFAULT_INPUT: SoilTestInput = {
  fieldName: "North Field",
  village: "Warangal",
  areaHa: 1.6,
  nitrogen: 55,
  phosphorus: 22,
  potassium: 45,
  ph: 5.9,
  organicMatter: 0.68,
  moisture: 22,
};

function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getSession);
  const [savedUsers, setSavedUsers] = useState<UserProfile[]>(() => getAllUsers());
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [lang, setLang] = useState<Lang>(() => user?.preferredLang || "en");
  const t = useMemo(() => makeT(lang), [lang]);

  // Auth guard — redirect to login if no session
  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      clearSession();
      setUser(null);
      navigate({ to: "/login" });
    }
  };

  const handleSwitchAccount = (targetUser: UserProfile) => {
    loginWithProfile(targetUser, true);
    setUser(targetUser);
    if (targetUser.preferredLang) setLang(targetUser.preferredLang);
    if (targetUser.village) {
      setInput((prev) => ({ ...prev, village: targetUser.village || prev.village }));
    }
    setShowAccountMenu(false);
  };

  const handleUseAnotherAccount = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  const [tab, setTab] = useState<"new" | "history">("new");
  const [input, setInput] = useState<SoilTestInput>(() => ({
    ...DEFAULT_INPUT,
    village: user?.village || DEFAULT_INPUT.village,
  }));
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<SoilReport[]>([]);
  const [current, setCurrent] = useState<SoilReport | null>(null);

  useEffect(() => setReports(loadReports()), []);

  if (!user) return null; // avoid flash before redirect

  const trend = useMemo(() => computeTrend(reports), [reports]);

  const run = async () => {
    setBusy(true);
    try {
      const prediction = photo ? await classifySoilImage(photo) : undefined;
      const soilTypePrediction = prediction ? prediction.soilType : undefined;

      const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:3001"
        : `http://${window.location.hostname}:3001`;

      const res = await fetch(`${baseUrl}/api/analyze-soil`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soilInput: input,
          soilTypePrediction,
        }),
      });

      if (!res.ok) {
        throw new Error("Backend analysis failed");
      }

      const data = await res.json();
      const report = data.report;
      
      // Re-attach local image data which isn't sent to the backend
      report.imageDataUrl = photo;
      report.image = prediction;

      setReports(saveReport(report));
      setCurrent(report);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Error analyzing soil. Is the FastAPI backend running on port 3001?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 border-b border-border bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-leaf p-1.5 text-leaf-foreground">
              <Sprout className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h1 className="text-sm font-bold leading-tight">{t("appName")}</h1>
              <p className="text-[11px] text-muted-foreground">{t("tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(Object.keys(langNames) as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  lang === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {langNames[l]}
              </button>
            ))}
            <button
              id="logout-btn"
              type="button"
              onClick={handleLogout}
              title={`Logout (${user?.name})`}
              className="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* User Account & Switcher Bar */}
        <div className="relative mx-auto max-w-xl bg-muted/40 border-t border-border/50">
          <div className="flex items-center justify-between px-4 py-1.5 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-1.5 truncate hover:text-foreground transition group"
              title="Click to Switch Account"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden />
              <span className="truncate">
                Signed in as <strong className="text-foreground font-semibold group-hover:underline">{user?.name}</strong>
                {user?.village ? ` • ${user.village}` : ""}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0 transition" />
            </button>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Users className="w-3 h-3" />
                Switch Account
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive font-medium flex items-center gap-1 transition"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Account Dropdown Menu */}
          {showAccountMenu && (
            <div className="absolute left-4 right-4 top-full mt-1 z-30 bg-card border border-border rounded-2xl shadow-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-border pb-2 px-1">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Saved Accounts on this Device
                </span>
                <button
                  type="button"
                  onClick={() => setShowAccountMenu(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Saved accounts list */}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {savedUsers.map((u) => {
                  const isActive = u.id === user?.id || u.email.toLowerCase() === user?.email.toLowerCase();
                  return (
                    <div
                      key={u.id}
                      onClick={() => !isActive && handleSwitchAccount(u)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                        isActive
                          ? "bg-primary/10 border border-primary/30 text-primary font-semibold"
                          : "hover:bg-accent text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                          {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold truncate">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="border-t border-border pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUseAnotherAccount}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border hover:bg-accent text-xs font-semibold text-foreground transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-primary" />
                  Use Another Account
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-xs font-semibold text-destructive transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out All
                </button>
              </div>
            </div>
          )}
        </div>
        <nav className="mx-auto flex max-w-xl gap-2 px-4 py-2">
          {(["new", "history"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                tab === k ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              }`}
            >
              {k === "new" ? t("newAnalysis") : `${t("history")} (${reports.length})`}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-xl space-y-5 px-4 py-5">
        {tab === "new" ? (
          current ? (
            <>
              <ReportView report={current} trend={trend} t={t} lang={lang} />
              <Button
                className="w-full"
                onClick={() => {
                  setCurrent(null);
                  setPhoto(undefined);
                }}
              >
                {t("saveAndNew")}
              </Button>
            </>
          ) : (
            <>
              <section className="rounded-xl border border-border bg-paper p-4">
                <h2 className="mb-3 text-sm font-bold">{t("step1")}</h2>
                <CameraCapture value={photo} onChange={setPhoto} t={t} />
              </section>
              <section className="rounded-xl border border-border bg-paper p-4">
                <h2 className="mb-3 text-sm font-bold">{t("step2")}</h2>
                <SoilForm value={input} onChange={setInput} t={t} />
              </section>
              <Button className="w-full" size="lg" disabled={busy} onClick={() => void run()}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? t("analysing") : t("analyze")}
              </Button>
            </>
          )
        ) : reports.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("noHistory")}</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-paper p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => {
                      setCurrent(r);
                      setTab("new");
                    }}
                  >
                    <p className="text-sm font-semibold">
                      {r.input.fieldName} · {r.healthScore.toFixed(1)}/100
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("analysis")} #{r.analysisNo} · {new Date(r.createdAt).toLocaleDateString()} ·{" "}
                      {t(r.healthBand)}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("delete")}
                    onClick={() => setReports(deleteReport(r.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
