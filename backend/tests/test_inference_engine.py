import pytest
from app.schemas.models import SoilTestInput, SoilAnalysisReport, NutrientRow
from app.ml.inference import (
    analyze_soil,
    compute_trend,
    _nutrient_rows,
    _ideal_score,
    _contributions,
    _amendments,
    _crops,
    _ols,
    CROP_DB,
    FERTILIZERS
)

def test_nutrient_rows_status():
    # Test low, adequate, high classifications
    inp_low = SoilTestInput(
        fieldName="Field 1",
        village="Village 1",
        areaHa=1.0,
        nitrogen=30.0,    # < 40 -> low
        phosphorus=15.0,  # < 25 -> low
        potassium=30.0,   # < 40 -> low
        ph=5.5,           # < 6.2 -> acidic
        organicMatter=0.5,
        moisture=20.0
    )
    rows = _nutrient_rows(inp_low)
    status_map = {r.key: r.status for r in rows}
    assert status_map["nitrogen"] == "low"
    assert status_map["phosphorus"] == "low"
    assert status_map["potassium"] == "low"
    assert status_map["ph"] == "acidic"

    inp_high = SoilTestInput(
        fieldName="Field 2",
        village="Village 2",
        areaHa=1.0,
        nitrogen=140.0,   # > 130 -> high
        phosphorus=95.0,  # > 90 -> high
        potassium=190.0,  # > 180 -> high
        ph=8.5,           # > 8.0 -> alkaline
        organicMatter=2.0,
        moisture=30.0
    )
    rows_high = _nutrient_rows(inp_high)
    status_map_high = {r.key: r.status for r in rows_high}
    assert status_map_high["nitrogen"] == "high"
    assert status_map_high["phosphorus"] == "high"
    assert status_map_high["potassium"] == "high"
    assert status_map_high["ph"] == "alkaline"

def test_ideal_score_function():
    # Value inside range [10, 20]
    assert _ideal_score(15.0, 10.0, 20.0, 5.0) == 1.0
    # Value below range (5, span 5)
    assert _ideal_score(5.0, 10.0, 20.0, 5.0) == 0.0
    # Value above range (25, span 5)
    assert _ideal_score(25.0, 10.0, 20.0, 5.0) == 0.0

def test_shap_contributions():
    inp = SoilTestInput(
        fieldName="Test", village="V", areaHa=1.0,
        nitrogen=100.0, phosphorus=50.0, potassium=100.0, ph=7.0,
        organicMatter=1.5, moisture=25.0
    )
    shap = _contributions(inp)
    assert len(shap) == 6
    # In ideal conditions, impact is near 0
    for s in shap:
        assert s.impact <= 0.0

def test_amendments_low_nutrients_acidic():
    inp = SoilTestInput(
        fieldName="Test", village="V", areaHa=2.0,
        nitrogen=50.0, phosphorus=20.0, potassium=40.0, ph=5.5,
        organicMatter=0.8, moisture=20.0
    )
    rows = _nutrient_rows(inp)
    amendments = _amendments(inp, rows)
    names = [a.name for a in amendments]

    # Should include DAP for P, Urea for N, MOP for K, Lime for Acidic, Compost for low OM
    assert any("DAP" in n for n in names)
    assert any("Urea" in n for n in names)
    assert any("MOP" in n for n in names)
    assert any("Lime" in n for n in names)
    assert any("Compost" in n for n in names)

def test_amendments_alkaline_soil():
    inp = SoilTestInput(
        fieldName="Test", village="V", areaHa=1.5,
        nitrogen=130.0, phosphorus=60.0, potassium=180.0, ph=8.5,
        organicMatter=1.5, moisture=25.0
    )
    rows = _nutrient_rows(inp)
    amendments = _amendments(inp, rows)
    names = [a.name for a in amendments]
    assert any("Gypsum" in n for n in names)

def test_crop_recommendations():
    inp = SoilTestInput(
        fieldName="Test", village="V", areaHa=1.0,
        nitrogen=100.0, phosphorus=45.0, potassium=60.0, ph=6.5,
        organicMatter=1.2, moisture=60.0
    )
    crops = _crops(inp, "Alluvial")
    assert len(crops) > 0
    assert len(crops) <= 8
    # Scores should be sorted descending
    scores = [c.score for c in crops]
    assert scores == sorted(scores, reverse=True)

def test_analyze_soil_full_report():
    inp = SoilTestInput(
        fieldName="North Green Field",
        village="Warangal",
        areaHa=2.5,
        nitrogen=95.0,
        phosphorus=40.0,
        potassium=70.0,
        ph=6.8,
        organicMatter=1.4,
        moisture=26.0
    )
    report = analyze_soil(inp, soil_type="Black", analysis_no=1)
    
    assert report.id is not None
    assert report.analysisNo == 1
    assert report.fieldName == "North Green Field"
    assert report.village == "Warangal"
    assert report.soilTypePrediction == "Black"
    assert 0.0 <= report.healthScore <= 100.0
    assert report.healthBand in ["excellent", "good", "fair", "poor"]
    assert 0.0 <= report.degradationRisk <= 1.0
    assert report.riskBand in ["low", "moderate", "high", "severe"]
    assert len(report.nutrients) == 4
    assert len(report.crops) > 0
    assert len(report.shap) == 6

def test_ols_regression():
    # Perfect linear positive slope: y = 2x + 1
    xs = [1.0, 2.0, 3.0, 4.0]
    ys = [3.0, 5.0, 7.0, 9.0]
    slope, intercept, r2 = _ols(xs, ys)
    assert pytest.approx(slope, 0.01) == 2.0
    assert pytest.approx(intercept, 0.01) == 1.0
    assert pytest.approx(r2, 0.01) == 1.0

def test_compute_trend_improving():
    def _rep(num, score, ts):
        inp = SoilTestInput(
            fieldName="F1", village="V1", areaHa=1.0,
            nitrogen=80, phosphorus=40, potassium=60, ph=6.5, organicMatter=1.0, moisture=20
        )
        return SoilAnalysisReport(
            id=f"r-{num}", analysisNo=num, createdAt=ts,
            fieldName="F1", village="V1", input=inp,
            soilTypePrediction="Alluvial", healthScore=score, healthBand="good",
            degradationRisk=0.2, riskBand="low", nutrients=[], amendments=[], crops=[], shap=[]
        )

    reports = [
        _rep(1, 50.0, "2026-01-01T00:00:00Z"),
        _rep(2, 60.0, "2026-02-01T00:00:00Z"),
        _rep(3, 70.0, "2026-03-01T00:00:00Z"),
    ]
    trend = compute_trend(reports)
    assert trend is not None
    assert trend.direction == "improving"
    assert trend.slopePerSeason > 0
    assert trend.dataPoints == 3

def test_compute_trend_declining():
    def _rep(num, score, ts):
        inp = SoilTestInput(
            fieldName="F1", village="V1", areaHa=1.0,
            nitrogen=80, phosphorus=40, potassium=60, ph=6.5, organicMatter=1.0, moisture=20
        )
        return SoilAnalysisReport(
            id=f"r-{num}", analysisNo=num, createdAt=ts,
            fieldName="F1", village="V1", input=inp,
            soilTypePrediction="Alluvial", healthScore=score, healthBand="good",
            degradationRisk=0.4, riskBand="moderate", nutrients=[], amendments=[], crops=[], shap=[]
        )

    reports = [
        _rep(1, 80.0, "2026-01-01T00:00:00Z"),
        _rep(2, 70.0, "2026-02-01T00:00:00Z"),
        _rep(3, 60.0, "2026-03-01T00:00:00Z"),
    ]
    trend = compute_trend(reports)
    assert trend is not None
    assert trend.direction == "declining"
    assert trend.slopePerSeason < 0
    assert trend.dataPoints == 3

def test_compute_trend_insufficient_data():
    reports = []
    assert compute_trend(reports) is None
