// ─────────────────────────────────────────────────────────────────────────────
// Soil analysis engine — pure business logic (no DOM, no browser APIs)
// Mirrors the algorithm in src/lib/soil/engine.ts but runs on Node.js
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from "uuid";

const BASE_SCORE = 100;

// ── Nutrient thresholds ───────────────────────────────────────────────────────
function nutrientRows(input) {
  return [
    {
      key: "nitrogen",
      value: input.nitrogen,
      unit: "index",
      status: input.nitrogen < 40 ? "low" : input.nitrogen > 130 ? "high" : "adequate",
    },
    {
      key: "phosphorus",
      value: input.phosphorus,
      unit: "index",
      status: input.phosphorus < 25 ? "low" : input.phosphorus > 90 ? "high" : "adequate",
    },
    {
      key: "potassium",
      value: input.potassium,
      unit: "index",
      status: input.potassium < 40 ? "low" : input.potassium > 180 ? "high" : "adequate",
    },
    {
      key: "ph",
      value: input.ph,
      unit: "",
      status: input.ph < 6.2 ? "acidic" : input.ph > 8.0 ? "alkaline" : "optimal",
    },
  ];
}

// ── SHAP-style feature contributions ─────────────────────────────────────────
function idealScore(value, lo, hi, span) {
  if (value >= lo && value <= hi) return 1;
  const d = value < lo ? lo - value : value - hi;
  return Math.max(0, 1 - d / span);
}

function contributions(input) {
  const f = (v, lo, hi, span, w) => (idealScore(v, lo, hi, span) - 1) * w;
  return [
    { feature: "nitrogen",      impact: f(input.nitrogen, 90, 140, 60, 22) },
    { feature: "phosphorus",    impact: f(input.phosphorus, 30, 90, 18, 18) },
    { feature: "potassium",     impact: f(input.potassium, 50, 180, 60, 15) },
    { feature: "ph",            impact: f(input.ph, 6.3, 7.8, 0.9, 22) },
    { feature: "organicMatter", impact: f(input.organicMatter, 1.0, 2.5, 0.5, 15) },
    { feature: "moisture",      impact: f(input.moisture, 18, 35, 15, 8) },
  ];
}

// ── Fertiliser amendments ─────────────────────────────────────────────────────
function amendments(input, rows) {
  const out = [];
  const area = Math.max(0.1, input.areaHa);
  const [nRow, pRow, kRow] = rows;

  if (nRow.status === "low" || pRow.status === "low") {
    const dapPerHa = 60 + Math.max(0, 60 - input.phosphorus) * 1.1 + Math.max(0, 90 - input.nitrogen) * 0.35;
    const total = Math.round(dapPerHa * area * 10) / 10;
    out.push({
      name: "DAP",
      totalKg: total,
      unit: "kg total",
      schedule: `basal day 0: ${(total / 2).toFixed(1)} kg | top dress day 30: ${(total / 4).toFixed(1)} kg | top dress day 60: ${(total / 4).toFixed(1)} kg`,
    });
  }
  if (kRow.status === "low") {
    const total = Math.round((45 + Math.max(0, 60 - input.potassium)) * area * 10) / 10;
    out.push({
      name: "MOP (Potash)",
      totalKg: total,
      unit: "kg total",
      schedule: `basal day 0: ${(total / 2).toFixed(1)} kg | top dress day 40: ${(total / 2).toFixed(1)} kg`,
    });
  }
  if (input.organicMatter < 1.2) {
    const total = Math.round(5000 * area);
    out.push({ name: "Compost / FYM", totalKg: total, unit: "kg total", schedule: `basal day 0: ${total} kg` });
  }
  if (input.ph < 6.2) {
    const total = Math.round((6.5 - input.ph) * 2500 * area);
    out.push({ name: "Lime", totalKg: total, unit: "kg total", schedule: "apply 2-4 weeks before sowing", note: `pH ${input.ph.toFixed(1)} is acidic` });
  }
  if (input.ph > 8.0) {
    const total = Math.round((input.ph - 7.5) * 1800 * area);
    out.push({ name: "Gypsum", totalKg: total, unit: "kg total", schedule: "broadcast and incorporate before irrigation", note: `pH ${input.ph.toFixed(1)} is alkaline` });
  }
  if (out.length === 0) {
    out.push({ name: "Maintenance dose NPK 10:26:26", totalKg: Math.round(100 * area), unit: "kg total", schedule: "basal day 0" });
  }
  return out;
}

// ── Crop matching ─────────────────────────────────────────────────────────────
const CROPS = [
  { crop: "Rice",              ph: [5.5, 7.0], n: 90,  p: 40, k: 60, soils: ["Alluvial", "Clay"] },
  { crop: "Wheat",             ph: [6.0, 7.5], n: 100, p: 45, k: 60, soils: ["Alluvial", "Black"] },
  { crop: "Cotton",            ph: [6.0, 8.0], n: 80,  p: 40, k: 70, soils: ["Black", "Red"] },
  { crop: "Groundnut",         ph: [6.0, 7.5], n: 40,  p: 40, k: 60, soils: ["Red", "Sandy"] },
  { crop: "Pomegranate",       ph: [5.5, 7.5], n: 50,  p: 25, k: 50, soils: ["Red", "Laterite", "Sandy"] },
  { crop: "Watermelon",        ph: [5.8, 7.2], n: 60,  p: 30, k: 55, soils: ["Sandy", "Alluvial"] },
  { crop: "Muskmelon",         ph: [6.0, 7.2], n: 60,  p: 30, k: 55, soils: ["Sandy", "Alluvial"] },
  { crop: "Mango",             ph: [5.5, 7.5], n: 55,  p: 25, k: 50, soils: ["Laterite", "Alluvial", "Red"] },
  { crop: "Sugarcane",         ph: [6.5, 7.5], n: 120, p: 50, k: 80, soils: ["Alluvial", "Black"] },
  { crop: "Ragi (Finger millet)", ph: [5.0, 7.5], n: 45, p: 20, k: 40, soils: ["Red", "Laterite"] },
];

function crops(input, soilType) {
  const scored = CROPS.map((c) => {
    const phFit =
      input.ph >= c.ph[0] && input.ph <= c.ph[1]
        ? 1
        : Math.max(0, 1 - Math.min(Math.abs(input.ph - c.ph[0]), Math.abs(input.ph - c.ph[1])) / 1.5);
    const nFit     = Math.min(1, input.nitrogen   / c.n);
    const pFit     = Math.min(1, input.phosphorus / c.p);
    const kFit     = Math.min(1, input.potassium  / c.k);
    const soilFit  = soilType && c.soils.includes(soilType) ? 1 : 0.75;
    const score    = Math.round((phFit * 0.3 + nFit * 0.2 + pFit * 0.15 + kFit * 0.15 + soilFit * 0.2) * 100);
    const rating   = score >= 85 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "moderate" : "poor";
    return { crop: c.crop, score, rating };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ── Main export ───────────────────────────────────────────────────────────────
export function analyzeSoil(input, soilTypePrediction, analysisNo) {
  const rows  = nutrientRows(input);
  const shap  = contributions(input);
  let score   = BASE_SCORE + shap.reduce((s, c) => s + c.impact, 0);
  score = Math.max(0, Math.min(100, Math.round(score * 10) / 10));

  const risk  = Math.round(Math.max(0, Math.min(100, 100 - score + (input.organicMatter < 0.8 ? 8 : 0)))) / 100;

  return {
    id:             uuidv4(),
    analysisNo:     analysisNo ?? 1,
    createdAt:      new Date().toISOString(),
    input,
    soilTypePrediction: soilTypePrediction ?? null,
    healthScore:    score,
    healthBand:     score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 55 ? "fair" : "poor",
    degradationRisk: risk,
    riskBand:       risk < 0.25 ? "low" : risk < 0.5 ? "moderate" : risk < 0.75 ? "high" : "severe",
    nutrients:      rows,
    amendments:     amendments(input, rows),
    crops:          crops(input, soilTypePrediction),
    shap:           shap.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
  };
}

export function computeTrend(reports) {
  if (reports.length < 2) return null;
  const ordered = [...reports].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const delta   = (ordered.at(-1).healthScore - ordered[0].healthScore) / (ordered.length - 1);
  return {
    direction:          delta < -1 ? "declining" : delta > 1 ? "improving" : "stable",
    pointsPerRecord:    Math.round(delta * 10) / 10,
    seasonsToCritical:  delta < -0.5 ? Math.max(1, Math.round((ordered.at(-1).healthScore - 40) / -delta)) : null,
  };
}
