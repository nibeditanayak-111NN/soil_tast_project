# ─────────────────────────────────────────────────────────────────────────────
# AI Soil Health Assessment System — FastAPI Backend
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.routes import health, analyze, fields, translations

app = FastAPI(
    title="AI Soil Health Assessment System API",
    version="1.0.0",
    description="Backend API for Soil Analysis, Image Processing, ML Classification, and Multilingual Recommendations",
    openapi_tags=[
        {"name": "default"},
    ],
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(translations.router)
app.include_router(analyze.router)
app.include_router(fields.router)


# ── Root → redirect to interactive docs ──────────────────────────────────────
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")
