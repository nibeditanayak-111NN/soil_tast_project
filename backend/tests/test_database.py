import pytest
from app.core import database as db
from app.schemas.models import SoilTestInput, SoilAnalysisReport, NutrientRow

@pytest.fixture(autouse=True)
def clean_db():
    """Clear in-memory database store before each test."""
    db._store.clear()
    yield
    db._store.clear()

def _sample_report(report_id="rep-1", field_name="North Field", health_score=75.0):
    inp = SoilTestInput(
        fieldName=field_name,
        village="Warangal",
        areaHa=2.0,
        nitrogen=90,
        phosphorus=45,
        potassium=60,
        ph=6.8,
        organicMatter=1.5,
        moisture=25.0
    )
    return SoilAnalysisReport(
        id=report_id,
        analysisNo=1,
        createdAt="2026-09-02T10:00:00Z",
        fieldName=field_name,
        village="Warangal",
        input=inp,
        soilTypePrediction="Alluvial",
        healthScore=health_score,
        healthBand="good",
        degradationRisk=0.25,
        riskBand="moderate",
        nutrients=[
            NutrientRow(key="nitrogen", value=90, unit="index", status="adequate"),
            NutrientRow(key="phosphorus", value=45, unit="index", status="adequate"),
            NutrientRow(key="potassium", value=60, unit="index", status="adequate"),
            NutrientRow(key="ph", value=6.8, unit="", status="optimal"),
        ],
        amendments=[],
        crops=[],
        shap=[]
    )

def test_save_and_get_one():
    rep = _sample_report("rep-101", "East Field")
    saved = db.save(rep)
    assert saved.id == "rep-101"
    
    fetched = db.get_one("rep-101")
    assert fetched is not None
    assert fetched.fieldName == "East Field"
    assert fetched.healthScore == 75.0

def test_get_one_not_found():
    assert db.get_one("nonexistent-id") is None

def test_get_all():
    rep1 = _sample_report("rep-1", "Field A", 80.0)
    rep2 = _sample_report("rep-2", "Field B", 65.0)
    db.save(rep1)
    db.save(rep2)

    all_reports = db.get_all()
    assert len(all_reports) == 2
    ids = [r.id for r in all_reports]
    assert "rep-1" in ids and "rep-2" in ids

def test_get_by_field_case_insensitive():
    rep1 = _sample_report("rep-1", "North Field", 70.0)
    rep2 = _sample_report("rep-2", "north field", 75.0)
    rep3 = _sample_report("rep-3", "South Field", 85.0)
    db.save(rep1)
    db.save(rep2)
    db.save(rep3)

    records = db.get_by_field("North Field")
    assert len(records) == 2
    records_lower = db.get_by_field("NORTH FIELD")
    assert len(records_lower) == 2

def test_delete():
    rep = _sample_report("rep-to-del", "Field Del")
    db.save(rep)
    assert db.count() == 1

    deleted = db.delete("rep-to-del")
    assert deleted is True
    assert db.count() == 0
    assert db.get_one("rep-to-del") is None

    # Deleting again returns False
    assert db.delete("rep-to-del") is False

def test_count_and_all_field_names():
    assert db.count() == 0
    assert db.all_field_names() == []

    db.save(_sample_report("r1", "Field Alpha"))
    db.save(_sample_report("r2", "Field Beta"))
    db.save(_sample_report("r3", "Field Alpha"))

    assert db.count() == 3
    names = db.all_field_names()
    assert set(names) == {"Field Alpha", "Field Beta"}
