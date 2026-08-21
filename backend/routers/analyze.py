from fastapi import APIRouter
from models import AnalyzeSoilRequest
from engine import analyze_soil
import db
import boto3
import uuid
import base64
import os

router = APIRouter()

# Setup S3 client (in production, credentials come from IAM or env vars)
s3_client = boto3.client('s3', region_name='us-east-1')
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "soil-health-images-stub")

def upload_to_s3(data_url: str) -> str:
    """Mock upload to S3. Extracts base64, uploads, and returns a public URL."""
    try:
        # e.g., "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        header, encoded = data_url.split(",", 1)
        ext = header.split(";")[0].split("/")[1]
        file_name = f"soil_captures/{uuid.uuid4().hex}.{ext}"
        
        # In a real environment, we would actually put the object:
        # image_data = base64.b64decode(encoded)
        # s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=file_name, Body=image_data, ContentType=f"image/{ext}")
        
        # Return the public S3 URL
        # return f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{file_name}"
        return data_url # For local testing without a real S3 bucket
    except Exception as e:
        print(f"S3 Upload Error: {e}")
        return data_url # Fallback to data URL if upload fails


@router.post("/api/analyze-soil", summary="Analyze Soil", tags=["default"], status_code=201)
def run_analysis(body: AnalyzeSoilRequest):
    """
    Run a full AI soil analysis and save the report.

    Performs:
    - **Nutrient diagnosis** (N, P, K, pH status)
    - **ML-based health scoring** (SHAP feature contributions)
    - **Fertiliser amendment recommendations**
    - **Crop suitability ranking** (top 5 crops)
    - **Degradation risk assessment**

    Optionally provide **soilTypePrediction** from the image ML classifier
    (e.g. Red, Black, Alluvial) to improve crop matching accuracy.
    """
    analysis_no = db.count() + 1
    report = analyze_soil(body.soilInput, body.soilTypePrediction, analysis_no)
    
    if body.imageDataUrl:
        # Upload to secure cloud storage
        report.imageDataUrl = upload_to_s3(body.imageDataUrl)
    db.save(report)

    print(f"  [OK] analysis #{report.analysisNo} | field: '{report.fieldName}' | score: {report.healthScore} | band: {report.healthBand}")

    return {"success": True, "report": report.model_dump()}
