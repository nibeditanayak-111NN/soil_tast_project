# 🌱 Soil Health Assessment System — FastAPI Backend

Python REST API backend using **FastAPI**, **Pydantic v2**, and **Scikit-Learn/SHAP logic** for the Soil Health Assessment Platform.

## 🛠️ Stack

| Layer | Tech |
|---|---|
| Runtime | Python 3.13 |
| Framework | **FastAPI** |
| Server | Uvicorn (ASGI) |
| Validation | Pydantic v2 |
| ML / Explainability | Scikit-Learn, SHAP feature attribution |
| Storage | In-memory dict store (swap for SQLite/PostgreSQL) |
| Testing | pytest, httpx, FastAPI TestClient |

## 🚀 Quick Start

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run dev server (auto-reload)
python -m uvicorn app.main:app --reload --port 3001
```

Server starts at **http://localhost:3001**

## 📖 Interactive API Docs (Swagger / OpenAPI)

| URL | Description |
|---|---|
| `http://localhost:3001/docs` | **Swagger UI** — test all endpoints interactively |
| `http://localhost:3001/redoc` | **ReDoc** — clean API reference |
| `http://localhost:3001/openapi.json` | Raw OpenAPI schema |

## 📡 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Redirects to `/docs` |
| `GET` | `/api/health` | Server health, uptime & analysis count |
| `GET` | `/api/translations` | Multilingual UI strings (English, Hindi, Kannada) |
| `POST` | `/api/analyze-soil` | Full AI soil health analysis, nutrient diagnosis & amendments |
| `GET` | `/api/fields` | Grouped field analytics and health history |
| `GET` | `/api/fields/{field_id}/trends` | Historical degradation trend and OLS forecasting |

## 🧪 Testing Suite & Test Reports

Run the complete automated backend test suite:

```bash
# Run tests with pytest
python -m pytest tests -v

# Or run test runner script to regenerate TEST_RESULTS.md
python run_tests.py
```

- **Markdown Test Submission Report:** [`TEST_RESULTS.md`](./TEST_RESULTS.md)
- **Raw Test Output Log:** [`test_results.txt`](./test_results.txt)

## 📁 Project Structure

```text
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── analyze.py        # POST /api/analyze-soil
│   │       ├── fields.py         # GET  /api/fields & trends
│   │       ├── health.py         # GET  /api/health
│   │       └── translations.py   # GET  /api/translations
│   ├── core/
│   │   └── database.py           # In-memory storage CRUD
│   ├── ml/
│   │   └── inference.py          # Soil analysis, SHAP & OLS trend engine
│   ├── schemas/
│   │   └── models.py             # Pydantic v2 schemas
│   └── main.py                   # FastAPI app entry point
├── tests/
│   ├── test_api_endpoints.py     # FastAPI integration tests
│   ├── test_inference_engine.py  # ML algorithms & calculations unit tests
│   └── test_database.py          # Database CRUD unit tests
├── run_tests.py                  # Automated test runner & report generator
├── TEST_RESULTS.md               # Submission-ready test report
├── test_results.txt              # Raw pytest console log
├── requirements.txt
└── Dockerfile
```
