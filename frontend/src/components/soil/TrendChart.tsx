import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Sparkles, AlertTriangle, Layers } from "lucide-react";
import type { SoilReport, Trend } from "@/lib/soil/types";

interface TrendChartProps {
  reports: SoilReport[];
  trend?: Trend | null;
  currentReport?: SoilReport | null;
  title?: string;
  showNutrientsToggle?: boolean;
}

type MetricMode = "health" | "npk" | "ph_om";

export function TrendChart({
  reports,
  trend,
  currentReport,
  title,
  showNutrientsToggle = true,
}: TrendChartProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>("health");

  // Combine and sort chronological reports
  const chartData = useMemo(() => {
    // If we have a list of historical reports
    const all = [...reports];
    if (currentReport && !all.some((r) => r.id === currentReport.id)) {
      all.push(currentReport);
    }
    
    // Sort oldest first
    const sorted = all.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // If we only have 1 or 0 reports, generate a sample baseline so graph is always illustrative
    if (sorted.length === 0) {
      return [];
    }

    const points = sorted.map((r, idx) => {
      const dateStr = new Date(r.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      return {
        name: `#${r.analysisNo || idx + 1} (${dateStr})`,
        score: Number(r.healthScore.toFixed(1)),
        nitrogen: r.input.nitrogen,
        phosphorus: r.input.phosphorus,
        potassium: r.input.potassium,
        ph: r.input.ph,
        organicMatter: Number((r.input.organicMatter * 10).toFixed(1)), // scaled for view
        moisture: r.input.moisture,
        isForecast: false,
      };
    });

    // Append AI Forecast projections if trend is available
    if (trend && points.length > 0) {
      if (trend.predictedScore3m !== null) {
        points.push({
          name: "+3 Mo (AI)",
          score: Number(trend.predictedScore3m.toFixed(1)),
          nitrogen: undefined as any,
          phosphorus: undefined as any,
          potassium: undefined as any,
          ph: undefined as any,
          organicMatter: undefined as any,
          moisture: undefined as any,
          isForecast: true,
        });
      }
      if (trend.predictedScore6m !== null) {
        points.push({
          name: "+6 Mo (AI)",
          score: Number(trend.predictedScore6m.toFixed(1)),
          nitrogen: undefined as any,
          phosphorus: undefined as any,
          potassium: undefined as any,
          ph: undefined as any,
          organicMatter: undefined as any,
          moisture: undefined as any,
          isForecast: true,
        });
      }
      if (trend.predictedScore12m !== null) {
        points.push({
          name: "+12 Mo (AI)",
          score: Number(trend.predictedScore12m.toFixed(1)),
          nitrogen: undefined as any,
          phosphorus: undefined as any,
          potassium: undefined as any,
          ph: undefined as any,
          organicMatter: undefined as any,
          moisture: undefined as any,
          isForecast: true,
        });
      }
    }

    return points;
  }, [reports, currentReport, trend]);

  if (chartData.length === 0) {
    return null;
  }

  const directionIcon =
    trend?.direction === "improving" ? (
      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline mr-1" />
    ) : trend?.direction === "declining" ? (
      <TrendingDown className="w-4 h-4 text-destructive inline mr-1" />
    ) : (
      <Activity className="w-4 h-4 text-amber-500 inline mr-1" />
    );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
      {/* ── Graph Header & Mode Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              {title || "Soil Health Trend & AI Forecast"}
            </h3>
            {trend && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  trend.direction === "improving"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : trend.direction === "declining"
                    ? "bg-destructive/15 text-destructive border border-destructive/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                }`}
              >
                {directionIcon}
                {trend.direction}
              </span>
            )}
          </div>
          {trend?.forecastSummary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {trend.forecastSummary}
            </p>
          )}
        </div>

        {/* Toggle between Metrics */}
        {showNutrientsToggle && (
          <div className="flex items-center rounded-xl bg-muted p-0.5 border border-border shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMetricMode("health")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                metricMode === "health"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Score &amp; Forecast
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("npk")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                metricMode === "npk"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              N-P-K Levels
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("ph_om")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                metricMode === "ph_om"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              pH &amp; Moisture
            </button>
          </div>
        )}
      </div>

      {/* ── Visual Chart Area ── */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricMode === "health" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary, #2e7d32)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary, #2e7d32)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.85 0.01 90)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                        <p className="font-bold text-foreground">{label}</p>
                        <p className="text-primary font-semibold">
                          Health Score: <span className="text-foreground">{data.score} / 100</span>
                        </p>
                        {data.isForecast && (
                          <span className="inline-block text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium">
                            AI Projected Forecast
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Critical threshold line */}
              <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Critical (<40)", fill: "#ef4444", fontSize: 10, position: "insideBottomLeft" }} />
              {/* Good threshold line */}
              <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Optimal (70+)", fill: "#10b981", fontSize: 10, position: "insideTopLeft" }} />
              <Area
                type="monotone"
                dataKey="score"
                name="Health Score"
                stroke="var(--primary, #2e7d32)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#scoreGradient)"
                dot={{ r: 4, fill: "var(--primary, #2e7d32)", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          ) : metricMode === "npk" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.85 0.01 90)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="nitrogen"
                name="Nitrogen (N)"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="phosphorus"
                name="Phosphorus (P)"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="potassium"
                name="Potassium (K)"
                stroke="#ea580c"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.85 0.01 90)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="ph"
                name="Soil pH"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="moisture"
                name="Moisture (%)"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ── Forecast Badges & Warnings Footer ── */}
      {trend && (
        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              OLS Confidence ($R^2$): <strong className="text-foreground font-semibold">{(trend.r2Score * 100).toFixed(0)}%</strong>
            </span>
            <span>
              Data Points: <strong className="text-foreground font-semibold">{trend.dataPoints} analyses</strong>
            </span>
            <span>
              Slope: <strong className="text-foreground font-semibold">{trend.slopePerSeason > 0 ? `+${trend.slopePerSeason}` : trend.slopePerSeason} pts/season</strong>
            </span>
          </div>

          {trend.seasonsToCritical !== null && (
            <div className="flex items-center gap-1.5 text-destructive font-semibold bg-destructive/10 px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Critical (&lt;40) in ~{trend.seasonsToCritical} season(s)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
