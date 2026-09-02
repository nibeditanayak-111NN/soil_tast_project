import { useState, useRef } from "react";
import type { SoilReport, Trend } from "@/lib/soil/types";
import type { Lang } from "@/lib/soil/i18n";
import { speakReport } from "@/lib/soil/tts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { TrendChart } from "./TrendChart";

type Props = {
  report: SoilReport;
  trend?: Trend | null;
  t: (k: string) => string;
  lang?: Lang;
};

function StatusChip({ status, t }: { status: string; t: (k: string) => string }) {
  const good = status === "adequate" || status === "optimal";
  const warn = status === "high" || status === "alkaline";
  return (
    <span
      className={`inline-block min-w-[92px] rounded-sm px-2 py-1 text-center text-[11px] font-semibold tracking-wide ${
        good
          ? "bg-leaf text-leaf-foreground"
          : warn
            ? "bg-ochre text-ochre-foreground"
            : "bg-destructive text-destructive-foreground"
      }`}
    >
      {t(status).toUpperCase()}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function ReportView({ report, trend, t, lang = "en" }: Props) {
  const r = report;
  const date = new Date(r.createdAt);
  const [speaking, setSpeaking] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const reportRef = useRef<HTMLElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleSpeak = async () => {
    if (speaking) { stopRef.current?.(); setSpeaking(false); return; }
    const stop = await speakReport(
      report, lang,
      () => setSpeaking(true),
      () => setSpeaking(false),
      (err) => { setSpeaking(false); console.error(err); }
    );
    stopRef.current = stop;
  };

  const handleDownloadPdf = () => {
    // html2canvas fails with Tailwind v4 oklch colors, so we use the robust native print API
    window.print();
  };

  return (
    <article ref={reportRef} className="space-y-5 rounded-xl border border-border bg-paper p-5 shadow-sm">
      <header>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold uppercase tracking-tight">{t("report")}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 disabled:opacity-50"
            >
              {downloading ? "⏳" : "📥 PDF"}
            </button>
            <button
              type="button"
              onClick={() => void handleSpeak()}
              aria-label={speaking ? "Stop listening" : "Listen to report"}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                speaking
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-leaf/20 text-leaf hover:bg-leaf/30"
              }`}
            >
              {speaking ? "⏹ Stop" : "🔊 Listen"}
            </button>
          </div>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3 text-xs text-muted-foreground">
          <div>
            <p className="text-sm text-foreground">
              {r.input.village} | {r.input.fieldName}
            </p>
            <p>
              {t("analysis")} #{r.analysisNo} · {date.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground">{r.input.areaHa} ha</p>
            <p>{r.input.village}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-terracotta p-4 text-terracotta-foreground">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">{t("score")}</p>
          <p className="mt-2 text-3xl font-bold leading-none">
            {r.healthScore.toFixed(1)}
            <span className="text-base font-medium opacity-80"> / 100</span>
          </p>
          <p className="mt-2 text-right text-xs font-semibold">{t(r.healthBand)}</p>
        </div>
        <div className="rounded-md bg-ochre p-4 text-ochre-foreground">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">{t("risk")}</p>
          <p className="mt-2 text-3xl font-bold leading-none">{r.degradationRisk.toFixed(2)}</p>
          <p className="mt-2 text-right text-xs font-semibold">{t(r.riskBand)}</p>
        </div>
      </div>

      <Section title={t("nutrientLevels")}>
        <ul className="space-y-2">
          {r.nutrients.map((n) => (
            <li key={n.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex-1">{t(n.key)}</span>
              <span className="w-24 font-semibold">
                {n.value} {n.unit}
              </span>
              <StatusChip status={n.status} t={t} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("organicMatter")}: {r.input.organicMatter}% · {t("moisture")}: {r.input.moisture}%
        </p>
      </Section>

      {r.image && (
        <Section title={t("soilTypeFromPhoto")}>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-lg font-bold">{r.image.soilType}</p>
              <p className="text-sm text-muted-foreground">
                {(r.image.confidence * 100).toFixed(1)}% {t("confidence")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("modelReliability")}: {r.image.reliability} | {t("nextBest")}: {r.image.nextBest} (
                {(r.image.nextBestConfidence * 100).toFixed(0)}%)
              </p>
              {r.image.caution && (
                <p className="mt-2 text-xs font-medium text-terracotta">{r.image.caution}</p>
              )}
            </div>
            <figure className="w-28 shrink-0">
              <img
                src={r.image.heatmapDataUrl}
                alt="Grad-CAM heatmap of the soil photo"
                loading="lazy"
                className="h-24 w-28 rounded-sm object-cover"
              />
              <figcaption className="mt-1 text-[10px] text-muted-foreground">
                {t("gradcam")}: {r.image.focus}
              </figcaption>
            </figure>
          </div>
        </Section>
      )}

      <Section title={t("whatToApply")}>
        <ul className="space-y-3">
          {r.amendments.map((a) => (
            <li key={a.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold">{a.name}</span>
                <span className="font-semibold">
                  {a.totalKg} {a.unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{a.schedule}</p>
              {a.note && <p className="text-xs text-muted-foreground">{a.note}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("bestCrops")}>
        <ul className="space-y-3">
          {r.crops.map((c, i) => {
            const barColor =
              c.rating === "excellent" ? "bg-leaf" :
              c.rating === "good"      ? "bg-emerald-500" :
              c.rating === "moderate"  ? "bg-ochre" : "bg-destructive";
            const waterIcon =
              c.waterNeed === "High"   ? "💧💧💧" :
              c.waterNeed === "Medium" ? "💧💧" : "💧";
            return (
              <li key={c.crop} className="rounded-lg border border-border bg-background p-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold">{c.crop}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{c.score}%</span>
                </div>

                {/* Score bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${c.score}%` }} />
                </div>

                {/* Meta badges */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {c.category}
                  </span>
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {c.season}
                  </span>
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {waterIcon} Water: {c.waterNeed}
                  </span>
                </div>

                {/* Deficiencies */}
                {(c.deficiencies?.length ?? 0) > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {c.deficiencies!.map((d) => (
                      <p key={d} className="flex items-start gap-1 text-[10px] text-destructive">
                        <span className="mt-px shrink-0">▼</span>
                        {d}
                      </p>
                    ))}
                  </div>
                )}

                {/* Reasons */}
                {(c.reasons?.length ?? 0) > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {c.reasons!.map((r) => (
                      <span key={r} className="rounded-sm bg-leaf/20 px-1.5 py-0.5 text-[10px] font-medium text-leaf">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={t("featureImportance")}>
        <ul className="space-y-2">
          {r.shap.map((s) => (
            <li key={s.feature} className="text-xs">
              <div className="flex justify-between">
                <span>{t(s.feature)}</span>
                <span className={s.impact >= 0 ? "text-leaf" : "text-destructive"}>
                  {s.impact >= 0 ? "+" : ""}
                  {s.impact.toFixed(1)}
                </span>
              </div>
              <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="flex w-1/2 justify-end">
                  {s.impact < 0 && (
                    <div
                      className="h-full bg-destructive"
                      style={{ width: `${Math.min(100, Math.abs(s.impact) * 6)}%` }}
                    />
                  )}
                </div>
                <div className="flex w-1/2">
                  {s.impact >= 0 && (
                    <div
                      className="h-full bg-leaf"
                      style={{ width: `${Math.min(100, s.impact * 6)}%` }}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {trend && (
        <Section title={`${t("longTermTrend")} — ${t(trend.direction)}`}>
          <div className="-mx-1 sm:mx-0">
            <TrendChart
              reports={[]}
              trend={trend}
              currentReport={report}
              showNutrientsToggle={true}
            />
          </div>
        </Section>
      )}

      <p className="border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
        {t("disclaimer")}
      </p>
    </article>
  );
}