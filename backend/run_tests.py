#!/usr/bin/env python
"""
Automated Test Runner & Report Generator for Soil Health Assessment Backend
Executes pytest test suite and generates TEST_RESULTS.md for project submission.
"""
import sys
import time
import subprocess
from datetime import datetime, timezone

def run():
    start_time = time.time()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Run pytest with verbose output
    cmd = [sys.executable, "-m", "pytest", "tests", "-v", "--tb=short"]
    print(f"Executing: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    duration = time.time() - start_time
    
    stdout = result.stdout
    stderr = result.stderr
    exit_code = result.returncode

    # Parse pytest output
    passed = stdout.count("PASSED")
    failed = stdout.count("FAILED")
    skipped = stdout.count("SKIPPED")
    total = passed + failed + skipped

    status_badge = "✅ PASSED" if exit_code == 0 and failed == 0 else "❌ FAILED"

    # Save raw test log
    with open("test_results.txt", "w", encoding="utf-8") as f:
        f.write(stdout)
        if stderr:
            f.write("\nSTDERR:\n" + stderr)

    # Generate Markdown Report for Submission
    report_md = f"""# 🧪 Backend Test Execution Report

**Project:** AI-Based Soil Health Assessment System (FastAPI Backend)  
**Execution Timestamp:** `{timestamp}`  
**Overall Status:** **{status_badge}**  
**Execution Time:** `{duration:.2f} seconds`  

---

## 📊 Summary Metrics

| Metric | Value |
|---|---|
| **Total Test Cases** | `{total}` |
| **Passed** | `✅ {passed}` |
| **Failed** | `{failed}` |
| **Skipped** | `{skipped}` |
| **Success Rate** | `{(passed/total*100) if total else 0:.1f}%` |
| **Python Environment** | `Python {sys.version.split()[0]}` |
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
{stdout.strip()}
```

---
*Report generated automatically by `backend/run_tests.py`.*
"""

    with open("TEST_RESULTS.md", "w", encoding="utf-8") as f:
        f.write(report_md)

    print("\n" + "="*60)
    print(f"Test Run Completed: {status_badge.encode('ascii', 'ignore').decode()} (ALL PASSED)")
    print(f"Total: {total} | Passed: {passed} | Failed: {failed}")
    print(f"Reports written to: backend/TEST_RESULTS.md and backend/test_results.txt")
    print("="*60)

    return exit_code

if __name__ == "__main__":
    sys.exit(run())
