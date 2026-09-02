# 🧪 Backend Test Execution Report

**Project:** AI-Based Soil Health Assessment System (FastAPI Backend)  
**Execution Timestamp:** `2026-09-02 11:55:12 UTC`  
**Overall Status:** **✅ PASSED**  
**Execution Time:** `3.63 seconds`  

---

## 📊 Summary Metrics

| Metric | Value |
|---|---|
| **Total Test Cases** | `29` |
| **Passed** | `✅ 29` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Success Rate** | `100.0%` |
| **Python Environment** | `Python 3.13.7` |
| **Test Framework** | `pytest` + `FastAPI TestClient (httpx)` |

---

## 📂 Test Suites Breakdown

### 1. API Endpoints Suite (`tests/test_api_endpoints.py`)
- ✅ `test_root_redirect_to_docs`: Validates root (`/`) redirect to interactive OpenAPI Swagger docs (`/docs`).
- ✅ `test_health_endpoint`: Checks `/api/health` system uptime, database item count, and server status.
- ✅ `test_translations_endpoint_default_english`: Validates default English translation dictionary.
- ✅ `test_translations_endpoint_hindi`: Validates Hindi language translations (`hi`).
- ✅ `test_translations_endpoint_kannada`: Validates Kannada language translations (`kn`).
- ✅ `test_translations_endpoint_fallback_for_unknown`: Tests internationalization fallback mechanism.
- ✅ `test_analyze_soil_success`: Full integration test for `/api/analyze-soil` payload processing and report storage.
- ✅ `test_analyze_soil_validation_error`: Verifies Pydantic schema validation rejects incomplete inputs (422).
- ✅ `test_fields_empty`: Tests `/api/fields` on clean database.
- ✅ `test_fields_after_analyses`: Verifies multi-field grouping, analysis counts, and trend attachment.
- ✅ `test_field_trends_endpoint`: Verifies field trend history retrieval and slug normalization.
- ✅ `test_field_trends_not_found`: Verifies 404 response for non-existent field queries.

### 2. ML & Soil Inference Engine Suite (`tests/test_inference_engine.py`)
- ✅ `test_nutrient_rows_status`: Validates low/adequate/high/acidic/alkaline status categorization thresholds.
- ✅ `test_ideal_score_function`: Tests linear decay scoring function across boundary spans.
- ✅ `test_shap_contributions`: Tests explainable AI (XAI) SHAP contribution calculations for 6 soil factors.
- ✅ `test_amendments_low_nutrients_acidic`: Tests fertilizer dose calculations (Urea, DAP, MOP, Lime, Compost).
- ✅ `test_amendments_alkaline_soil`: Verifies Gypsum amendment generation for alkaline pH soils.
- ✅ `test_crop_recommendations`: Tests suitability ranking and sorting across 25 crop database models.
- ✅ `test_analyze_soil_full_report`: Validates complete schema generation, health score & degradation risk bands.
- ✅ `test_ols_regression`: Validates Ordinary Least Squares (OLS) slope, intercept, and R² calculations.
- ✅ `test_compute_trend_improving`: Validates positive health score trend detection.
- ✅ `test_compute_trend_declining`: Validates degradation trend detection and season-to-critical warnings.
- ✅ `test_compute_trend_insufficient_data`: Validates graceful handling when <2 data points exist.

### 3. Core Database Store Suite (`tests/test_database.py`)
- ✅ `test_save_and_get_one`: Validates CRUD persistence and record retrieval by UUID.
- ✅ `test_get_one_not_found`: Validates safe None return on missing ID.
- ✅ `test_get_all`: Tests sorting and retrieval of all stored reports.
- ✅ `test_get_by_field_case_insensitive`: Tests case-insensitive field name filtering.
- ✅ `test_delete`: Tests deletion of existing report records and idempotency.
- ✅ `test_count_and_all_field_names`: Tests database counting and unique field name extraction.

---

## 💻 Raw Pytest Output

```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0 -- C:\Program Files\Python313\python.exe
cachedir: .pytest_cache
rootdir: D:\soil-health-pwa\backend
plugins: anyio-4.13.0, asyncio-1.4.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 29 items

tests/test_api_endpoints.py::test_root_redirect_to_docs PASSED           [  3%]
tests/test_api_endpoints.py::test_health_endpoint PASSED                 [  6%]
tests/test_api_endpoints.py::test_translations_endpoint_default_english PASSED [ 10%]
tests/test_api_endpoints.py::test_translations_endpoint_hindi PASSED     [ 13%]
tests/test_api_endpoints.py::test_translations_endpoint_kannada PASSED   [ 17%]
tests/test_api_endpoints.py::test_translations_endpoint_fallback_for_unknown PASSED [ 20%]
tests/test_api_endpoints.py::test_analyze_soil_success PASSED            [ 24%]
tests/test_api_endpoints.py::test_analyze_soil_validation_error PASSED   [ 27%]
tests/test_api_endpoints.py::test_fields_empty PASSED                    [ 31%]
tests/test_api_endpoints.py::test_fields_after_analyses PASSED           [ 34%]
tests/test_api_endpoints.py::test_field_trends_endpoint PASSED           [ 37%]
tests/test_api_endpoints.py::test_field_trends_not_found PASSED          [ 41%]
tests/test_database.py::test_save_and_get_one PASSED                     [ 44%]
tests/test_database.py::test_get_one_not_found PASSED                    [ 48%]
tests/test_database.py::test_get_all PASSED                              [ 51%]
tests/test_database.py::test_get_by_field_case_insensitive PASSED        [ 55%]
tests/test_database.py::test_delete PASSED                               [ 58%]
tests/test_database.py::test_count_and_all_field_names PASSED            [ 62%]
tests/test_inference_engine.py::test_nutrient_rows_status PASSED         [ 65%]
tests/test_inference_engine.py::test_ideal_score_function PASSED         [ 68%]
tests/test_inference_engine.py::test_shap_contributions PASSED           [ 72%]
tests/test_inference_engine.py::test_amendments_low_nutrients_acidic PASSED [ 75%]
tests/test_inference_engine.py::test_amendments_alkaline_soil PASSED     [ 79%]
tests/test_inference_engine.py::test_crop_recommendations PASSED         [ 82%]
tests/test_inference_engine.py::test_analyze_soil_full_report PASSED     [ 86%]
tests/test_inference_engine.py::test_ols_regression PASSED               [ 89%]
tests/test_inference_engine.py::test_compute_trend_improving PASSED      [ 93%]
tests/test_inference_engine.py::test_compute_trend_declining PASSED      [ 96%]
tests/test_inference_engine.py::test_compute_trend_insufficient_data PASSED [100%]

============================= 29 passed in 2.84s ==============================
```

---
*Report generated automatically by `backend/run_tests.py`.*
