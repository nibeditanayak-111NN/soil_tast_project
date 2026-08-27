import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, LogOut, Sprout, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/soil/CameraCapture";
import { SoilForm } from "@/components/soil/SoilForm";
import { ReportView } from "@/components/soil/ReportView";
import { analyzeSoil, computeTrend } from "@/lib/soil/engine";
import { classifySoilImage } from "@/lib/soil/vision";
import { deleteReport, loadReports, saveReport } from "@/lib/soil/storage";
import { langNames, makeT, type Lang } from "@/lib/soil/i18n";
import type { SoilReport, SoilTestInput } from "@/lib/soil/types";
import { clearSession, getSession } from "@/lib/auth";

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
  const [lang, setLang] = useState<Lang>("en");
  const t = useMemo(() => makeT(lang), [lang]);
  const [user, setUser] = useState(getSession);

  // Auth guard — redirect to login if no session
  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate({ to: "/login" });
  };

  const [tab, setTab] = useState<"new" | "history">("new");
  const [input, setInput] = useState<SoilTestInput>(DEFAULT_INPUT);
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
              className="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-xl gap-2 px-4 pb-2">
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
