# Soil Health AI Nutrient Diagnosis

A full-stack, mobile-first Progressive Web App (PWA) for AI-driven soil health diagnosis and recommendations.

## Architecture

This project uses a modern monorepo structure:

- **/frontend**: A Vite + React application configured as an installable PWA with offline support.
- **/backend**: A FastAPI (Python) backend featuring a machine learning inference engine and structured PostgreSQL schemas.

## Features

- 📸 **Camera Capture**: Directly take photos of soil from the field using the native browser `MediaDevices` API.
- 🧪 **Nutrient Diagnostics**: Analyze Nitrogen (N), Phosphorus (P), Potassium (K), pH, and organic matter levels.
- 🤖 **ML Inference**: Machine learning recommendations for fertilizer formulations, crop suitability, and long-term soil degradation trend prediction.
- 🗣️ **Sarvam AI & i18n**: Multi-lingual interface (Hindi, Kannada) with AI-powered regional text-to-speech for farmers.
- 📥 **PDF Reports**: Native Print-to-PDF export capabilities for offline reading.

## Getting Started

### Using Docker (Recommended)
You can start the entire stack simultaneously using Docker Compose:
```sh
docker-compose up --build
```
- Frontend will be available at: `http://localhost:8080`
- Backend API will be available at: `http://localhost:3001`

### Running Locally

**1. Start the Backend:**
```sh
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 3001
```

**2. Start the Frontend:**
```sh
cd frontend
npm install
npm run dev
```
