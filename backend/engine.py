# ─────────────────────────────────────────────────────────────────────────────
# Soil analysis engine — pure Python, no framework dependencies
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Optional

from models import (
    SoilTestInput, SoilAnalysisReport, NutrientRow, Amendment,
    CropRecommendation, ShapEntry, Trend,
)

BASE_SCORE = 100.0


def _nutrient_rows(inp: SoilTestInput) -> list[NutrientRow]:
    return [
        NutrientRow(key="nitrogen",   value=inp.nitrogen,   unit="index",
            status="low" if inp.nitrogen < 40   else ("high" if inp.nitrogen > 130   else "adequate")),
        NutrientRow(key="phosphorus", value=inp.phosphorus, unit="index",
            status="low" if inp.phosphorus < 25 else ("high" if inp.phosphorus > 90  else "adequate")),
        NutrientRow(key="potassium",  value=inp.potassium,  unit="index",
            status="low" if inp.potassium < 40  else ("high" if inp.potassium > 180  else "adequate")),
        NutrientRow(key="ph",         value=inp.ph,         unit="",
            status="acidic" if inp.ph < 6.2     else ("alkaline" if inp.ph > 8.0      else "optimal")),
    ]


def _ideal_score(value: float, lo: float, hi: float, span: float) -> float:
    if lo <= value <= hi:
        return 1.0
    d = (lo - value) if value < lo else (value - hi)
    return max(0.0, 1.0 - d / span)


def _contributions(inp: SoilTestInput) -> list[ShapEntry]:
    def f(v, lo, hi, span, w):
        return (_ideal_score(v, lo, hi, span) - 1) * w
    return [
        ShapEntry(feature="nitrogen",      impact=f(inp.nitrogen,      90,  140, 60,  22)),
        ShapEntry(feature="phosphorus",    impact=f(inp.phosphorus,    30,   90, 18,  18)),
        ShapEntry(feature="potassium",     impact=f(inp.potassium,     50,  180, 60,  15)),
        ShapEntry(feature="ph",            impact=f(inp.ph,           6.3,  7.8, 0.9, 22)),
        ShapEntry(feature="organicMatter", impact=f(inp.organicMatter, 1.0,  2.5, 0.5, 15)),
        ShapEntry(feature="moisture",      impact=f(inp.moisture,      18,   35, 15,   8)),
    ]


# --- Fertilizer Knowledge Base ---
FERTILIZERS = {
    "Urea": {"N": 0.46, "P": 0.0, "K": 0.0},
    "DAP":  {"N": 0.18, "P": 0.46, "K": 0.0},
    "MOP":  {"N": 0.0,  "P": 0.0,  "K": 0.60},
    "SSP":  {"N": 0.0,  "P": 0.16, "K": 0.0},
}

TARGET_N = 130.0  # kg/ha target for optimal health
TARGET_P = 60.0   # kg/ha target for optimal health
TARGET_K = 180.0  # kg/ha target for optimal health

def _amendments(inp: SoilTestInput, rows: list[NutrientRow]) -> list[Amendment]:
    out: list[Amendment] = []
    area  = max(0.1, inp.areaHa)
    
    # Calculate nutrient gaps in kg/ha
    gap_N = max(0.0, TARGET_N - inp.nitrogen)
    gap_P = max(0.0, TARGET_P - inp.phosphorus)
    gap_K = max(0.0, TARGET_K - inp.potassium)
    
    # 1. Prioritize DAP for Phosphorus (P is immobile)
    if gap_P > 0:
        dap_kg_ha = gap_P / FERTILIZERS["DAP"]["P"]
        dap_total = round(dap_kg_ha * area)
        if dap_total > 0:
            out.append(Amendment(name="DAP (18-46-0)", totalKg=dap_total, unit="kg total",
                schedule=f"Basal (at sowing): {dap_total} kg",
                note="Provides primary Phosphorus and initial Nitrogen."))
            # Subtract the N provided by DAP
            gap_N = max(0.0, gap_N - (dap_kg_ha * FERTILIZERS["DAP"]["N"]))
        
    # 2. Fulfill remaining Nitrogen with Urea (N is highly mobile)
    if gap_N > 0:
        urea_kg_ha = gap_N / FERTILIZERS["Urea"]["N"]
        urea_total = round(urea_kg_ha * area)
        if urea_total > 0:
            # Split application for Nitrogen to prevent leaching
            b_n = round(urea_total * 0.3)
            t1_n = round(urea_total * 0.35)
            t2_n = urea_total - b_n - t1_n
            out.append(Amendment(name="Urea (46% N)", totalKg=urea_total, unit="kg total",
                schedule=f"Basal: {b_n} kg | Top dress (30d): {t1_n} kg | Top dress (60d): {t2_n} kg",
                note="Split application minimizes leaching risk."))
                
    # 3. Fulfill Potassium with MOP (K is immobile)
    if gap_K > 0:
        mop_kg_ha = gap_K / FERTILIZERS["MOP"]["K"]
        mop_total = round(mop_kg_ha * area)
        if mop_total > 0:
            out.append(Amendment(name="MOP (60% K)", totalKg=mop_total, unit="kg total",
                schedule=f"Basal (at sowing): {mop_total} kg",
                note="Essential for drought resistance and fruit quality."))

    # 4. Organics & pH Amendments
    if inp.organicMatter < 1.2:
        total = round(5000 * area)
        out.append(Amendment(name="Compost / FYM", totalKg=total, unit="kg total",
            schedule=f"Basal: {int(total)} kg", note="Apply 2-3 weeks before sowing to improve soil structure."))

    if inp.ph < 6.2:
        total = round((6.5 - inp.ph) * 2500 * area)
        out.append(Amendment(name="Lime", totalKg=total, unit="kg total",
            schedule="Basal: 100%", note=f"Apply 2-4 weeks before sowing. Soil pH ({inp.ph:.1f}) is acidic."))

    if inp.ph > 8.0:
        total = round((inp.ph - 7.5) * 1800 * area)
        out.append(Amendment(name="Gypsum", totalKg=total, unit="kg total",
            schedule="Basal: 100%", note=f"Broadcast before irrigation. Soil pH ({inp.ph:.1f}) is alkaline."))

    # 5. Maintenance Fallback
    if not out:
        out.append(Amendment(name="Maintenance NPK (10:26:26)",
            totalKg=round(100 * area), unit="kg total", schedule="Basal: 100%", note="Standard maintenance dose."))
            
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Crop-Soil Compatibility Knowledge Base — 25 crops × 8 soil factors
# Weights: pH (0.25), N (0.18), P (0.13), K (0.12), OM (0.12),
#          Moisture (0.08), SoilType (0.12)
# ─────────────────────────────────────────────────────────────────────────────
CROP_DB = [
    # ── Cereals ──────────────────────────────────────────────────────────────
    {"name": "Rice",                "category": "Cereal",    "season": "Kharif",
     "ph": (5.5, 7.0), "n": (80, 130), "p": (30, 60), "k": (40, 80),
     "om": 1.0, "moisture": (50, 80), "soils": ["Alluvial", "Clay", "Black"],
     "water": "High"},
    {"name": "Wheat",               "category": "Cereal",    "season": "Rabi",
     "ph": (6.0, 7.5), "n": (90, 140), "p": (35, 60), "k": (40, 80),
     "om": 1.0, "moisture": (40, 65), "soils": ["Alluvial", "Loam", "Black"],
     "water": "Medium"},
    {"name": "Maize (Corn)",        "category": "Cereal",    "season": "Kharif",
     "ph": (5.8, 7.0), "n": (80, 130), "p": (30, 60), "k": (60, 100),
     "om": 1.2, "moisture": (45, 65), "soils": ["Alluvial", "Loam", "Sandy"],
     "water": "Medium"},
    {"name": "Sorghum (Jowar)",     "category": "Cereal",    "season": "Kharif",
     "ph": (5.5, 7.5), "n": (50, 100), "p": (20, 50), "k": (40, 80),
     "om": 0.8, "moisture": (25, 50), "soils": ["Black", "Red", "Alluvial"],
     "water": "Low"},
    {"name": "Pearl Millet (Bajra)","category": "Cereal",    "season": "Kharif",
     "ph": (6.0, 8.0), "n": (40, 90), "p": (20, 45), "k": (30, 60),
     "om": 0.6, "moisture": (20, 45), "soils": ["Sandy", "Red", "Loam"],
     "water": "Low"},
    {"name": "Ragi (Finger Millet)","category": "Cereal",    "season": "Kharif",
     "ph": (5.0, 7.5), "n": (40, 80), "p": (15, 40), "k": (30, 60),
     "om": 0.8, "moisture": (30, 55), "soils": ["Red", "Laterite", "Sandy"],
     "water": "Low"},
    # ── Pulses / Legumes ─────────────────────────────────────────────────────
    {"name": "Chickpea (Bengal Gram)","category": "Pulse",   "season": "Rabi",
     "ph": (6.0, 8.0), "n": (20, 50), "p": (30, 60), "k": (30, 60),
     "om": 0.8, "moisture": (25, 50), "soils": ["Black", "Loam", "Alluvial"],
     "water": "Low"},
    {"name": "Pigeon Pea (Tur/Arhar)","category": "Pulse",   "season": "Kharif",
     "ph": (6.0, 7.5), "n": (20, 50), "p": (30, 55), "k": (40, 70),
     "om": 0.8, "moisture": (30, 55), "soils": ["Black", "Red", "Alluvial"],
     "water": "Low"},
    {"name": "Green Gram (Moong)",  "category": "Pulse",     "season": "Zaid",
     "ph": (6.2, 7.5), "n": (20, 50), "p": (30, 55), "k": (30, 60),
     "om": 0.8, "moisture": (30, 50), "soils": ["Alluvial", "Loam", "Sandy"],
     "water": "Low"},
    {"name": "Groundnut",           "category": "Oilseed",   "season": "Kharif",
     "ph": (6.0, 7.5), "n": (20, 50), "p": (30, 55), "k": (50, 80),
     "om": 0.8, "moisture": (35, 60), "soils": ["Red", "Sandy", "Loam"],
     "water": "Low"},
    # ── Cash Crops ───────────────────────────────────────────────────────────
    {"name": "Cotton",              "category": "Cash Crop", "season": "Kharif",
     "ph": (6.0, 8.0), "n": (70, 120), "p": (30, 60), "k": (60, 100),
     "om": 1.0, "moisture": (40, 65), "soils": ["Black", "Red", "Alluvial"],
     "water": "Medium"},
    {"name": "Sugarcane",           "category": "Cash Crop", "season": "Annual",
     "ph": (6.5, 7.5), "n": (100, 150), "p": (40, 70), "k": (70, 120),
     "om": 1.2, "moisture": (55, 80), "soils": ["Alluvial", "Black", "Loam"],
     "water": "High"},
    {"name": "Turmeric",            "category": "Spice",     "season": "Kharif",
     "ph": (5.5, 7.0), "n": (60, 100), "p": (30, 55), "k": (60, 100),
     "om": 1.5, "moisture": (55, 75), "soils": ["Loam", "Red", "Laterite"],
     "water": "Medium"},
    {"name": "Chilli",              "category": "Vegetable", "season": "Kharif",
     "ph": (6.0, 7.5), "n": (60, 110), "p": (30, 55), "k": (60, 100),
     "om": 1.0, "moisture": (45, 65), "soils": ["Alluvial", "Black", "Loam"],
     "water": "Medium"},
    # ── Horticulture / Fruits ────────────────────────────────────────────────
    {"name": "Tomato",              "category": "Vegetable", "season": "Annual",
     "ph": (6.0, 7.0), "n": (70, 120), "p": (35, 60), "k": (70, 110),
     "om": 1.5, "moisture": (50, 70), "soils": ["Alluvial", "Loam", "Sandy"],
     "water": "Medium"},
    {"name": "Onion",               "category": "Vegetable", "season": "Rabi",
     "ph": (6.0, 7.5), "n": (50, 100), "p": (30, 55), "k": (60, 100),
     "om": 1.0, "moisture": (40, 60), "soils": ["Alluvial", "Loam", "Sandy"],
     "water": "Medium"},
    {"name": "Watermelon",          "category": "Fruit",     "season": "Zaid",
     "ph": (5.8, 7.2), "n": (50, 90), "p": (25, 50), "k": (50, 90),
     "om": 0.8, "moisture": (40, 60), "soils": ["Sandy", "Alluvial", "Loam"],
     "water": "Low"},
    {"name": "Muskmelon",           "category": "Fruit",     "season": "Zaid",
     "ph": (6.0, 7.2), "n": (50, 90), "p": (25, 50), "k": (50, 90),
     "om": 0.8, "moisture": (35, 55), "soils": ["Sandy", "Alluvial"],
     "water": "Low"},
    {"name": "Banana",              "category": "Fruit",     "season": "Annual",
     "ph": (6.0, 7.5), "n": (90, 140), "p": (35, 60), "k": (90, 150),
     "om": 1.5, "moisture": (60, 80), "soils": ["Alluvial", "Loam", "Black"],
     "water": "High"},
    {"name": "Mango",               "category": "Fruit",     "season": "Annual",
     "ph": (5.5, 7.5), "n": (40, 80), "p": (20, 45), "k": (40, 80),
     "om": 0.8, "moisture": (40, 65), "soils": ["Laterite", "Alluvial", "Red"],
     "water": "Low"},
    {"name": "Pomegranate",         "category": "Fruit",     "season": "Annual",
     "ph": (5.5, 7.5), "n": (40, 80), "p": (20, 40), "k": (40, 80),
     "om": 0.8, "moisture": (35, 55), "soils": ["Red", "Laterite", "Sandy"],
     "water": "Low"},
    {"name": "Papaya",              "category": "Fruit",     "season": "Annual",
     "ph": (6.0, 7.0), "n": (70, 120), "p": (30, 55), "k": (70, 110),
     "om": 1.2, "moisture": (50, 70), "soils": ["Alluvial", "Loam", "Sandy"],
     "water": "Medium"},
    # ── Oilseeds ─────────────────────────────────────────────────────────────
    {"name": "Sunflower",           "category": "Oilseed",   "season": "Rabi",
     "ph": (6.0, 7.5), "n": (60, 100), "p": (30, 55), "k": (50, 90),
     "om": 0.8, "moisture": (35, 60), "soils": ["Alluvial", "Loam", "Black"],
     "water": "Low"},
    {"name": "Mustard (Rapeseed)",  "category": "Oilseed",   "season": "Rabi",
     "ph": (5.5, 7.5), "n": (60, 100), "p": (25, 50), "k": (40, 80),
     "om": 0.8, "moisture": (30, 55), "soils": ["Alluvial", "Loam", "Sandy"],
     "water": "Low"},
    {"name": "Sesame (Til)",        "category": "Oilseed",   "season": "Kharif",
     "ph": (5.5, 7.5), "n": (30, 70), "p": (20, 45), "k": (30, 60),
     "om": 0.6, "moisture": (25, 45), "soils": ["Sandy", "Red", "Loam"],
     "water": "Low"},
]


def _range_fit(value: float, lo: float, hi: float) -> float:
    """Returns 1.0 if value in [lo, hi], decays linearly below lo or above hi."""
    if value < lo:
        span = lo * 0.5  # allow 50% below lo before score hits 0
        return max(0.0, (value - (lo - span)) / span)
    if value > hi:
        span = hi * 0.5
        return max(0.0, (hi + span - value) / span)
    return 1.0


def _crops(inp: SoilTestInput, soil_type: Optional[str]) -> list[CropRecommendation]:
    results = []
    for c in CROP_DB:
        # ── factor scores (all 0-1) ──────────────────────────────────────────
        ph_s   = _range_fit(inp.ph,            *c["ph"])
        n_s    = _range_fit(inp.nitrogen,      *c["n"])
        p_s    = _range_fit(inp.phosphorus,    *c["p"])
        k_s    = _range_fit(inp.potassium,     *c["k"])
        om_s   = min(1.0, inp.organicMatter / c["om"])
        mo_s   = _range_fit(inp.moisture,      *c["moisture"])
        soil_s = 1.0 if (soil_type and soil_type in c["soils"]) else 0.70

        # ── weighted composite score ──────────────────────────────────────────
        score = round((
            ph_s  * 0.25 +
            n_s   * 0.18 +
            p_s   * 0.13 +
            k_s   * 0.12 +
            om_s  * 0.12 +
            mo_s  * 0.08 +
            soil_s* 0.12
        ) * 100)

        # ── identify deficiencies ─────────────────────────────────────────────
        deficiencies: list[str] = []
        if ph_s   < 0.7: deficiencies.append(f"pH out of ideal range ({inp.ph:.1f}, needs {c['ph'][0]}-{c['ph'][1]})")
        if n_s    < 0.7: deficiencies.append(f"Nitrogen low ({inp.nitrogen}, needs {c['n'][0]}+)")
        if p_s    < 0.7: deficiencies.append(f"Phosphorus low ({inp.phosphorus}, needs {c['p'][0]}+)")
        if k_s    < 0.7: deficiencies.append(f"Potassium low ({inp.potassium}, needs {c['k'][0]}+)")
        if om_s   < 0.7: deficiencies.append(f"Organic matter low ({inp.organicMatter:.1f}%, needs {c['om']}%+)")
        if soil_s < 1.0 and soil_type: deficiencies.append(f"Soil type ({soil_type}) not ideal (prefers {', '.join(c['soils'][:2])})")

        # ── reasons (positive matches) ────────────────────────────────────────
        reasons: list[str] = []
        if ph_s   >= 0.9: reasons.append("pH is ideal")
        if n_s    >= 0.9: reasons.append("Nitrogen level is good")
        if p_s    >= 0.9: reasons.append("Phosphorus level is good")
        if k_s    >= 0.9: reasons.append("Potassium level is good")
        if om_s   >= 0.9: reasons.append("Good organic matter")
        if soil_s == 1.0: reasons.append(f"Compatible soil type ({soil_type})")

        rating = ("excellent" if score >= 85 else
                  "good"      if score >= 70 else
                  "moderate"  if score >= 55 else "poor")

        results.append(CropRecommendation(
            crop=c["name"],
            score=score,
            rating=rating,
            category=c["category"],
            season=c["season"],
            waterNeed=c["water"],
            deficiencies=deficiencies,
            reasons=reasons,
        ))

    return sorted(results, key=lambda x: x.score, reverse=True)[:8]



def analyze_soil(inp: SoilTestInput, soil_type: Optional[str], analysis_no: int) -> SoilAnalysisReport:
    rows  = _nutrient_rows(inp)
    shap  = _contributions(inp)
    score = BASE_SCORE + sum(s.impact for s in shap)
    score = round(max(0.0, min(100.0, score)) * 10) / 10
    risk  = round(max(0.0, min(100.0, 100 - score + (8 if inp.organicMatter < 0.8 else 0)))) / 100

    return SoilAnalysisReport(
        id=str(uuid.uuid4()),
        analysisNo=analysis_no,
        createdAt=datetime.now(timezone.utc).isoformat(),
        fieldName=inp.fieldName,
        village=inp.village,
        input=inp,
        soilTypePrediction=soil_type,
        healthScore=score,
        healthBand="excellent" if score >= 85 else ("good" if score >= 70 else ("fair" if score >= 55 else "poor")),
        degradationRisk=risk,
        riskBand="low" if risk < 0.25 else ("moderate" if risk < 0.5 else ("high" if risk < 0.75 else "severe")),
        nutrients=rows,
        amendments=_amendments(inp, rows),
        crops=_crops(inp, soil_type),
        shap=sorted(shap, key=lambda x: abs(x.impact), reverse=True),
    )


def _ols(xs: list[float], ys: list[float]) -> tuple[float, float, float]:
    """Ordinary Least Squares regression. Returns (slope, intercept, r2)."""
    n = len(xs)
    if n < 2:
        return 0.0, ys[0] if ys else 0.0, 0.0
    mx = sum(xs) / n
    my = sum(ys) / n
    ss_xy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    ss_xx = sum((x - mx) ** 2 for x in xs)
    if ss_xx == 0:
        return 0.0, my, 0.0
    slope = ss_xy / ss_xx
    intercept = my - slope * mx
    # R² = 1 - SS_res / SS_tot
    ss_tot = sum((y - my) ** 2 for y in ys)
    if ss_tot == 0:
        r2 = 1.0
    else:
        y_pred = [slope * x + intercept for x in xs]
        ss_res = sum((y - yp) ** 2 for y, yp in zip(ys, y_pred))
        r2 = max(0.0, 1.0 - ss_res / ss_tot)
    return slope, intercept, r2


def compute_trend(reports: list[SoilAnalysisReport]) -> Optional[Trend]:
    """ML regression-based long-term soil health trend predictor."""
    if len(reports) < 2:
        return None

    ordered = sorted(reports, key=lambda r: r.createdAt)

    # Build time series: x = season index (0, 1, 2, …), y = health score
    xs = list(range(len(ordered)))
    ys = [r.healthScore for r in ordered]

    slope, intercept, r2 = _ols(xs, ys)

    # Project future scores: assume 1 season ≈ 90 days
    # x_now = last recorded index; x_3m/6m/12m = + 1/2/4 seasons
    x_last = xs[-1]

    def _predict(x: float) -> float:
        return round(max(0.0, min(100.0, slope * x + intercept)), 1)

    pred_3m  = _predict(x_last + 1)
    pred_6m  = _predict(x_last + 2)
    pred_12m = _predict(x_last + 4)

    # Seasons until score < 40 (critical)
    current = ys[-1]
    if slope < -0.5 and current > 40:
        seasons_to_critical = max(1, round((current - 40) / abs(slope)))
    else:
        seasons_to_critical = None

    # Direction classification
    if slope < -1.0:
        direction = "declining"
    elif slope > 1.0:
        direction = "improving"
    else:
        direction = "stable"

    # Human-readable forecast
    conf_pct = round(r2 * 100)
    slope_r  = round(slope, 1)
    if direction == "declining":
        summary = (
            f"Soil health is declining by {abs(slope_r):.1f} pts/season "
            f"(R²={conf_pct}%). Predicted score in 12 months: {pred_12m}/100."
        )
        if seasons_to_critical:
            summary += f" Critical (<40) in ~{seasons_to_critical} season(s) if untreated."
    elif direction == "improving":
        summary = (
            f"Soil health is improving by {slope_r:.1f} pts/season "
            f"(R²={conf_pct}%). Predicted score in 12 months: {pred_12m}/100."
        )
    else:
        summary = (
            f"Soil health is stable ({slope_r:+.1f} pts/season, R²={conf_pct}%). "
            f"Predicted score in 12 months: {pred_12m}/100."
        )

    return Trend(
        direction=direction,
        slopePerSeason=round(slope, 2),
        r2Score=round(r2, 3),
        dataPoints=len(ordered),
        predictedScore3m=pred_3m,
        predictedScore6m=pred_6m,
        predictedScore12m=pred_12m,
        seasonsToCritical=seasons_to_critical,
        forecastSummary=summary,
    )

