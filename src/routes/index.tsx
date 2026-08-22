import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/soil/CameraCapture";
import { SoilForm } from "@/components/soil/SoilForm";
import { langNames, makeT, type Lang } from "@/lib/soil/i18n";
import type { SoilTestInput } from "@/lib/soil/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soil Health — Data Ingestion Pipeline" },
      {
        name: "description",
        content: "Data ingestion pipeline for capturing soil photographs and test readings.",
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
  const [lang, setLang] = useState<Lang>("en");
  const t = useMemo(() => makeT(lang), [lang]);

  const [input, setInput] = useState<SoilTestInput>(DEFAULT_INPUT);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
              <p className="text-[11px] text-muted-foreground">Milestone 1: Data Ingestion Pipeline</p>
            </div>
          </div>
          <div className="flex gap-1">
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-5 px-4 py-5">
        {submitted ? (
          <div className="rounded-xl border border-border bg-paper p-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Data Ingested Successfully!</h2>
            <p className="text-sm text-muted-foreground">
              Soil imagery and parameters have been collected and normalized for field: <strong>{input.fieldName}</strong>.
            </p>
            <Button className="w-full" onClick={() => setSubmitted(false)}>
              Ingest Another Sample
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="rounded-xl border border-border bg-paper p-4">
              <h2 className="mb-3 text-sm font-bold">{t("step1")}</h2>
              <CameraCapture value={photo} onChange={setPhoto} t={t} />
            </section>
            <section className="rounded-xl border border-border bg-paper p-4">
              <h2 className="mb-3 text-sm font-bold">{t("step2")}</h2>
              <SoilForm value={input} onChange={setInput} t={t} />
            </section>
            <Button className="w-full" size="lg" type="submit">
              Submit Ingestion Data
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

