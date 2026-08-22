# 🌱 AI Soil Health Nutrient Diagnosis & Crop Recommendation

A full-stack, AI-powered Progressive Web App (PWA) that analyzes soil nutrient levels, predicts field degradation trends, and provides corrective fertilizer and crop suitability recommendations.

## 🎯 Project Overview

This platform leverages **Machine Learning**, **Computer Vision (Camera Capture)**, and **Predictive Analytics** to help farmers and agricultural scientists proactively monitor soil health, diagnose N-P-K (Nitrogen, Phosphorus, Potassium) deficiencies, and receive actionable insights in regional languages.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Tailwind CSS, TanStack |
| Backend | Python, FastAPI |
| Database | PostgreSQL (via in-memory stub/SQLAlchemy) |
| AI / ML | Scikit-learn, SHAP, LightGBM/XGBoost logic |
| Hardware/OS | Browser MediaDevices API (Mobile Camera) |
| Services | Sarvam AI (Text-to-Speech & i18n Translation) |
| DevOps | Docker, GitHub Actions, Terraform (AWS) |

## 📁 Project Structure

```text
soil-health-pwa/
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── api/routes/       # API endpoints (analyze, fields, health)
│   │   ├── core/             # Configuration and Database
│   │   ├── schemas/          # Pydantic schemas (models)
│   │   ├── ml/               # AI/ML inference logic
│   │   └── main.py           # Application Entry Point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React/Vite PWA Frontend
│   ├── src/
│   │   ├── components/       # UI Components (SoilForm, CameraCapture)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Integrations (Sarvam AI, TTS, Engine)
│   │   └── routes/           # Application pages
│   ├── public/               # PWA manifests and icons
│   ├── package.json
│   └── vite.config.ts
├── terraform/                # Infrastructure as Code
├── .github/                  # CI/CD Workflows
└── docker-compose.yml        # Orchestration
```

## 🚀 Getting Started

### Local Development with Docker (Recommended)
You can start the entire stack simultaneously using Docker Compose:
```sh
docker-compose up --build
```
- Frontend will be available at: `http://localhost:8080`
- Backend API will be available at: `http://localhost:3001`

### Manual Development

**1. Start the Backend API:**
```sh
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 3001
```

**2. Start the Frontend PWA:**
```sh
cd frontend
npm install
npm run dev
```
