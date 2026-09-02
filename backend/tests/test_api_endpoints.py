import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core import database as db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_database():
    db._store.clear()
    yield
    db._store.clear()

def test_root_redirect_to_docs():
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "uptime" in data
    assert data["analysesStored"] == 0
    assert data["framework"] == "FastAPI"

def test_translations_endpoint_default_english():
    response = client.get("/api/translations")
    assert response.status_code == 200
    data = response.json()
    assert data["lang"] == "en"
    assert "en" in data["availableLanguages"]
    assert data["translations"]["language"] == "English"
    assert data["translations"]["appName"] == "Soil Health"
    assert "nitrogen" in data["translations"]

def test_translations_endpoint_hindi():
    response = client.get("/api/translations?lang=hi")
    assert response.status_code == 200
    data = response.json()
    assert data["lang"] == "hi"
    assert data["translations"]["language"] == "हिन्दी"
    assert data["translations"]["appName"] == "मृदा स्वास्थ्य"

def test_translations_endpoint_kannada():
    response = client.get("/api/translations?lang=kn")
    assert response.status_code == 200
    data = response.json()
    assert data["lang"] == "kn"
    assert data["translations"]["language"] == "ಕನ್ನಡ"
    assert data["translations"]["appName"] == "ಮಣ್ಣಿನ ಆರೋಗ್ಯ"

def test_translations_endpoint_fallback_for_unknown():
    response = client.get("/api/translations?lang=fr")
    assert response.status_code == 200
    data = response.json()
    assert data["lang"] == "fr"
    # Fallback to English translation values
    assert data["translations"]["appName"] == "Soil Health"

def test_analyze_soil_success():
    payload = {
        "soilInput": {
            "fieldName": "Valley Orchard",
            "village": "Warangal",
            "areaHa": 3.0,
            "nitrogen": 85.0,
            "phosphorus": 35.0,
            "potassium": 55.0,
            "ph": 6.5,
            "organicMatter": 1.2,
            "moisture": 24.0
        },
        "soilTypePrediction": "Alluvial"
    }
    response = client.post("/api/analyze-soil", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "report" in data
    report = data["report"]
    assert report["fieldName"] == "Valley Orchard"
    assert report["village"] == "Warangal"
    assert report["soilTypePrediction"] == "Alluvial"
    assert "healthScore" in report
    assert "healthBand" in report
    assert "nutrients" in report
    assert "amendments" in report
    assert "crops" in report
    assert "shap" in report

    # Verify report was saved into database
    assert db.count() == 1
    stored = db.get_one(report["id"])
    assert stored is not None
    assert stored.fieldName == "Valley Orchard"

def test_analyze_soil_validation_error():
    # Missing required fields in soilInput
    payload = {
        "soilInput": {
            "fieldName": "Incomplete Field"
        }
    }
    response = client.post("/api/analyze-soil", json=payload)
    assert response.status_code == 422

def test_fields_empty():
    response = client.get("/api/fields")
    assert response.status_code == 200
    data = response.json()
    assert data["totalFields"] == 0
    assert data["totalAnalyses"] == 0
    assert data["fields"] == []

def test_fields_after_analyses():
    # Submit analysis for Field Alpha
    client.post("/api/analyze-soil", json={
        "soilInput": {
            "fieldName": "Field Alpha",
            "village": "Village 1",
            "areaHa": 1.0,
            "nitrogen": 70,
            "phosphorus": 30,
            "potassium": 50,
            "ph": 6.5,
            "organicMatter": 1.0,
            "moisture": 20
        }
    })
    # Submit second analysis for Field Alpha
    client.post("/api/analyze-soil", json={
        "soilInput": {
            "fieldName": "Field Alpha",
            "village": "Village 1",
            "areaHa": 1.0,
            "nitrogen": 80,
            "phosphorus": 40,
            "potassium": 60,
            "ph": 6.6,
            "organicMatter": 1.1,
            "moisture": 21
        }
    })
    # Submit analysis for Field Beta
    client.post("/api/analyze-soil", json={
        "soilInput": {
            "fieldName": "Field Beta",
            "village": "Village 2",
            "areaHa": 2.0,
            "nitrogen": 60,
            "phosphorus": 25,
            "potassium": 45,
            "ph": 6.2,
            "organicMatter": 0.8,
            "moisture": 18
        }
    })

    response = client.get("/api/fields")
    assert response.status_code == 200
    data = response.json()
    assert data["totalFields"] == 2
    assert data["totalAnalyses"] == 3
    
    alpha_info = next(f for f in data["fields"] if f["fieldName"] == "Field Alpha")
    assert alpha_info["totalRecords"] == 2
    assert alpha_info["latestScore"] is not None

def test_field_trends_endpoint():
    # Submit two analyses for "South Farm"
    for n in [50, 75]:
        client.post("/api/analyze-soil", json={
            "soilInput": {
                "fieldName": "South Farm",
                "village": "Village S",
                "areaHa": 1.5,
                "nitrogen": n,
                "phosphorus": 35,
                "potassium": 55,
                "ph": 6.7,
                "organicMatter": 1.2,
                "moisture": 22
            }
        })

    # Test GET /api/fields/South-Farm/trends (hyphen converted to space)
    response = client.get("/api/fields/South-Farm/trends")
    assert response.status_code == 200
    data = response.json()
    assert data["fieldName"] == "South Farm"
    assert data["totalRecords"] == 2
    assert "trend" in data
    assert len(data["history"]) == 2

def test_field_trends_not_found():
    response = client.get("/api/fields/Non-Existent-Field/trends")
    assert response.status_code == 404
    assert "No records found" in response.json()["detail"]
