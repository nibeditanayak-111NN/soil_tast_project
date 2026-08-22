export type SoilTestInput = {
  fieldName: string;
  village: string;
  areaHa: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organicMatter: number;
  moisture: number;
};

export type NutrientStatus = "adequate" | "low" | "high" | "acidic" | "alkaline" | "optimal";

export type NutrientRow = {
  key: "nitrogen" | "phosphorus" | "potassium" | "ph";
  value: number;
  unit: string;
  status: NutrientStatus;
};

export type ImagePrediction = {
  soilType: string;
  confidence: number;
  nextBest: string;
  nextBestConfidence: number;
  reliability: "unknown" | "low" | "moderate" | "high";
  heatmapDataUrl: string;
  focus: string;
  caution?: string | undefined;
};

export type Amendment = {
  name: string;
  totalKg: number;
  unit: string;
  schedule: string;
  note?: string | undefined;
};

export type CropSuggestion = {
  crop: string;
  score: number;
  rating: "excellent" | "good" | "moderate" | "poor";
  category: string;
  season: string;
  waterNeed: "Low" | "Medium" | "High";
  deficiencies: string[];
  reasons: string[];
};

export type SoilReport = {
  id: string;
  analysisNo: number;
  createdAt: string;
  input: SoilTestInput;
  imageDataUrl?: string | undefined;
  image?: ImagePrediction | undefined;
  healthScore: number;
  healthBand: "poor" | "fair" | "good" | "excellent";
  degradationRisk: number;
  riskBand: "low" | "moderate" | "high" | "severe";
  nutrients: NutrientRow[];
  amendments: Amendment[];
  crops: CropSuggestion[];
  shap: { feature: string; impact: number }[];
};

export type Trend = {
  direction: "declining" | "stable" | "improving";
  slopePerSeason: number;
  r2Score: number;
  dataPoints: number;
  predictedScore3m: number | null;
  predictedScore6m: number | null;
  predictedScore12m: number | null;
  seasonsToCritical: number | null;
  forecastSummary: string;
};