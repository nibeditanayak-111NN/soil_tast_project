# ─────────────────────────────────────────────────────────────────────────────
# Pydantic models — request / response schemas with full validation
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ── Input ─────────────────────────────────────────────────────────────────────
class SoilTestInput(BaseModel):
    fieldName:     str   = Field(..., json_schema_extra={"example": "North Field"})
    village:       str   = Field(..., json_schema_extra={"example": "Warangal"})
    areaHa:        float = Field(..., gt=0, json_schema_extra={"example": 1.6})
    nitrogen:      float = Field(..., ge=0, json_schema_extra={"example": 55})
    phosphorus:    float = Field(..., ge=0, json_schema_extra={"example": 22})
    potassium:     float = Field(..., ge=0, json_schema_extra={"example": 45})
    ph:            float = Field(..., ge=0, le=14, json_schema_extra={"example": 5.9})
    organicMatter: float = Field(..., ge=0, json_schema_extra={"example": 0.68})
    moisture:      float = Field(..., ge=0, le=100, json_schema_extra={"example": 22})


class AnalyzeSoilRequest(BaseModel):
    soilInput:          SoilTestInput
    soilTypePrediction: Optional[str] = Field(None, json_schema_extra={"example": "Red"},
        description="Soil type from image ML classifier e.g. Red, Black, Alluvial")
    imageDataUrl:       Optional[str] = Field(None, description="Base64 image data from frontend")


# ── Output fragments ──────────────────────────────────────────────────────────
class NutrientRow(BaseModel):
    key:    Literal["nitrogen", "phosphorus", "potassium", "ph"]
    value:  float
    unit:   str
    status: Literal["adequate", "low", "high", "acidic", "alkaline", "optimal"]


class Amendment(BaseModel):
    name:     str
    totalKg:  float
    unit:     str
    schedule: str
    note:     Optional[str] = None


class CropRecommendation(BaseModel):
    crop:         str   = Field(..., description="Recommended crop name")
    score:        int   = Field(..., description="Suitability score out of 100")
    rating:       Literal["excellent", "good", "moderate", "poor"]
    category:     str   = Field(..., description="Crop category e.g. Cereal, Pulse, Fruit")
    season:       str   = Field(..., description="Best growing season e.g. Kharif, Rabi, Annual")
    waterNeed:    Literal["Low", "Medium", "High"] = Field(..., description="Water requirement")
    deficiencies: list[str] = Field(default_factory=list, description="Limiting soil factors for this crop")
    reasons:      list[str] = Field(default_factory=list, description="Positive matches for this crop")


class ShapEntry(BaseModel):
    feature: str  = Field(..., description="Soil feature name")
    impact:  float = Field(..., description="SHAP impact on health score")


class SoilAnalysisReport(BaseModel):
    id:                 str
    analysisNo:         int
    createdAt:          str
    fieldName:          str
    village:            str
    soilTypePrediction: Optional[str]
    imageDataUrl:       Optional[str] = Field(None, description="Cloud storage URL of the soil image")
    healthScore:        float = Field(..., description="Overall soil health score 0–100")
    healthBand:         Literal["poor", "fair", "good", "excellent"]
    degradationRisk:    float
    riskBand:           Literal["low", "moderate", "high", "severe"]
    nutrients:          list[NutrientRow]
    amendments:         list[Amendment]
    crops:              list[CropRecommendation]
    shap:               list[ShapEntry]
    input:              SoilTestInput


class Trend(BaseModel):
    direction:           Literal["declining", "stable", "improving"]
    slopePerSeason:      float  = Field(..., description="Health score change per season (OLS slope)")
    r2Score:             float  = Field(..., description="R² of the regression fit (0-1 confidence)")
    dataPoints:          int    = Field(..., description="Number of historical records used")
    predictedScore3m:    Optional[float] = Field(None, description="Predicted health score in 3 months")
    predictedScore6m:    Optional[float] = Field(None, description="Predicted health score in 6 months")
    predictedScore12m:   Optional[float] = Field(None, description="Predicted health score in 12 months")
    seasonsToCritical:   Optional[int]   = Field(None, description="Seasons until score < 40 if trend continues")
    forecastSummary:     str   = Field(..., description="Human-readable forecast sentence")


class FieldTrendResponse(BaseModel):
    fieldName:    str
    totalRecords: int
    trend:        Optional[Trend]
    history:      list[SoilAnalysisReport]
