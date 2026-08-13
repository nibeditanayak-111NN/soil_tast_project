import type {
  Amendment,
  CropSuggestion,
  NutrientRow,
  SoilReport,
  SoilTestInput,
  Trend,
  ImagePrediction,
} from "./types";

/** Structured-data model (gradient-boosting style additive scoring). */
function nutrientRows(i: SoilTestInput): NutrientRow[] {
  return [
    {
      key: "nitrogen",
      value: i.nitrogen,
      unit: "index",
      status: i.nitrogen < 40 ? "low" : i.nitrogen > 130 ? "high" : "adequate",
    },
    {
      key: "phosphorus",
      value: i.phosphorus,
      unit: "index",
      status: i.phosphorus < 25 ? "low" : i.phosphorus > 90 ? "high" : "adequate",
    },
    {
      key: "potassium",
      value: i.potassium,
      unit: "index",
      status: i.potassium < 40 ? "low" : i.potassium > 180 ? "high" : "adequate",
    },
    {
      key: "ph",
      value: i.ph,
      unit: "",
      status: i.ph < 6.2 ? "acidic" : i.ph > 8.0 ? "alkaline" : "optimal",
    },
  ];
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

function idealScore(value: number, lo: number, hi: number, span: number) {
  if (value >= lo && value <= hi) return 1;
  const d = value < lo ? lo - value : value - hi;
  return Math.max(0, 1 - d / span);
}

/**
 * SHAP-style additive feature contributions against a healthy baseline of 100.
 * A feature inside its agronomic optimum contributes 0; deficiency subtracts
 * up to the feature's full weight.
 */
const BASE_SCORE = 100;

function contributions(i: SoilTestInput) {
  const f = (v: number, lo: number, hi: number, span: number, w: number) =>
    (idealScore(v, lo, hi, span) - 1) * w;
  return [
    { feature: "nitrogen", impact: f(i.nitrogen, 90, 140, 60, 22) },
    { feature: "phosphorus", impact: f(i.phosphorus, 30, 90, 18, 18) },
    { feature: "potassium", impact: f(i.potassium, 50, 180, 60, 15) },
    { feature: "ph", impact: f(i.ph, 6.3, 7.8, 0.9, 22) },
    { feature: "organicMatter", impact: f(i.organicMatter, 1.0, 2.5, 0.5, 15) },
    { feature: "moisture", impact: f(i.moisture, 18, 35, 15, 8) },
  ];
}

function amendments(i: SoilTestInput, rows: NutrientRow[]): Amendment[] {
  const out: Amendment[] = [];
  const area = Math.max(0.1, i.areaHa);
  const nRow = rows[0]!;
  const pRow = rows[1]!;
  const kRow = rows[2]!;

  if (nRow.status === "low" || pRow.status === "low") {
    const dapPerHa = 60 + Math.max(0, 60 - i.phosphorus) * 1.1 + Math.max(0, 90 - i.nitrogen) * 0.35;
    const total = Math.round(dapPerHa * area * 10) / 10;
    out.push({
      name: "DAP",
      totalKg: total,
      unit: "kg total",
      schedule: `basal day 0: ${(total / 2).toFixed(1)} kg | top dress day 30: ${(total / 4).toFixed(1)} kg | top dress day 60: ${(total / 4).toFixed(1)} kg`,
    });
  }
  if (kRow.status === "low") {
    const total = Math.round((45 + Math.max(0, 60 - i.potassium)) * area * 10) / 10;
    out.push({
      name: "MOP (Potash)",
      totalKg: total,
      unit: "kg total",
      schedule: `basal day 0: ${(total / 2).toFixed(1)} kg | top dress day 40: ${(total / 2).toFixed(1)} kg`,
    });
  }
  if (i.organicMatter < 1.2) {
    const total = Math.round(5000 * area);
    out.push({
      name: "Compost / FYM",
      totalKg: total,
      unit: "kg total",
      schedule: `basal day 0: ${total} kg`,
    });
  }
  if (i.ph < 6.2) {
    const total = Math.round((6.5 - i.ph) * 2500 * area);
    out.push({
      name: "Lime",
      totalKg: total,
      unit: "kg total",
      schedule: `apply 2-4 weeks before sowing`,
      note: `pH ${i.ph.toFixed(1)} is slightly acidic`,
    });
  }
  if (i.ph > 8.0) {
    const total = Math.round((i.ph - 7.5) * 1800 * area);
    out.push({
      name: "Gypsum",
      totalKg: total,
      unit: "kg total",
      schedule: `broadcast and incorporate before irrigation`,
      note: `pH ${i.ph.toFixed(1)} is alkaline`,
    });
  }
  if (out.length === 0) {
    out.push({
      name: "Maintenance dose NPK 10:26:26",
      totalKg: Math.round(100 * area),
      unit: "kg total",
      schedule: "basal day 0",
    });
  }
  return out;
}

const CROPS: {
  crop: string;
  ph: [number, number];
  n: number;
  p: number;
  k: number;
  soils: string[];
}[] = [
  { crop: "Rice", ph: [5.5, 7.0], n: 90, p: 40, k: 60, soils: ["Alluvial", "Clay"] },
  { crop: "Wheat", ph: [6.0, 7.5], n: 100, p: 45, k: 60, soils: ["Alluvial", "Black"] },
  { crop: "Cotton", ph: [6.0, 8.0], n: 80, p: 40, k: 70, soils: ["Black", "Red"] },
  { crop: "Groundnut", ph: [6.0, 7.5], n: 40, p: 40, k: 60, soils: ["Red", "Sandy"] },
  { crop: "Pomegranate", ph: [5.5, 7.5], n: 50, p: 25, k: 50, soils: ["Red", "Laterite", "Sandy"] },
  { crop: "Watermelon", ph: [5.8, 7.2], n: 60, p: 30, k: 55, soils: ["Sandy", "Alluvial"] },
  { crop: "Muskmelon", ph: [6.0, 7.2], n: 60, p: 30, k: 55, soils: ["Sandy", "Alluvial"] },
  { crop: "Mango", ph: [5.5, 7.5], n: 55, p: 25, k: 50, soils: ["Laterite", "Alluvial", "Red"] },
  { crop: "Sugarcane", ph: [6.5, 7.5], n: 120, p: 50, k: 80, soils: ["Alluvial", "Black"] },
  { crop: "Ragi (Finger millet)", ph: [5.0, 7.5], n: 45, p: 20, k: 40, soils: ["Red", "Laterite"] },
];

function crops(i: SoilTestInput, soilType?: string): CropSuggestion[] {
  const scored = CROPS.map((c) => {
    const phFit = i.ph >= c.ph[0] && i.ph <= c.ph[1] ? 1 : Math.max(0, 1 - Math.min(Math.abs(i.ph - c.ph[0]), Math.abs(i.ph - c.ph[1])) / 1.5);
    const nFit = Math.min(1, i.nitrogen / c.n);
    const pFit = Math.min(1, i.phosphorus / c.p);
    const kFit = Math.min(1, i.potassium / c.k);
    const soilFit = soilType && c.soils.includes(soilType) ? 1 : 0.75;
    const score = Math.round(
      (phFit * 0.3 + nFit * 0.2 + pFit * 0.15 + kFit * 0.15 + soilFit * 0.2) * 100,
    );
    const rating: CropSuggestion["rating"] =
      score >= 85 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "moderate" : "poor";
    return { crop: c.crop, score, rating };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function analyzeSoil(
  input: SoilTestInput,
  image: ImagePrediction | undefined,
  imageDataUrl: string | undefined,
  analysisNo: number,
): SoilReport {
  const rows = nutrientRows(input);
  const shap = contributions(input);
  let score = BASE_SCORE + shap.reduce((s, c) => s + c.impact, 0);
  // hybrid fusion: image confidence nudges the structured score
  if (image) score += (image.confidence - 0.85) * 6;
  score = clamp(Math.round(score * 10) / 10);

  const risk = Math.round(clamp(100 - score + (input.organicMatter < 0.8 ? 8 : 0), 0, 100)) / 100;

  return {
    id: crypto.randomUUID(),
    analysisNo,
    createdAt: new Date().toISOString(),
    input,
    imageDataUrl,
    image,
    healthScore: score,
    healthBand: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 55 ? "fair" : "poor",
    degradationRisk: risk,
    riskBand: risk < 0.25 ? "low" : risk < 0.5 ? "moderate" : risk < 0.75 ? "high" : "severe",
    nutrients: rows,
    amendments: amendments(input, rows),
    crops: crops(input, image?.soilType),
    shap: shap.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
  };
}

export function computeTrend(reports: SoilReport[]): Trend | null {
  if (reports.length < 2) return null;
  const ordered = [...reports].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const first = ordered[0]!;
  const last = ordered[ordered.length - 1]!;
  const delta = (last.healthScore - first.healthScore) / (ordered.length - 1);
  const direction: Trend["direction"] = delta < -1 ? "declining" : delta > 1 ? "improving" : "stable";
  const seasonsToCritical =
    delta < -0.5 ? Math.max(1, Math.round((last.healthScore - 40) / -delta)) : null;
  return { direction, pointsPerRecord: Math.round(delta * 10) / 10, seasonsToCritical };
}