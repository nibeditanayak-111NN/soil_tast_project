from fastapi import APIRouter, HTTPException
from app.ml.inference import compute_trend
from app.schemas.models import FieldTrendResponse
from app.core import database as db

router = APIRouter()


@router.get("/api/fields", summary="Get All Fields", tags=["default"])
def get_all_fields():
    """
    Returns all soil analysis reports grouped by field name.
    """
    all_reports = db.get_all()
    field_names = db.all_field_names()

    fields = []
    for name in field_names:
        records = db.get_by_field(name)
        trend   = compute_trend(records)
        fields.append({
            "fieldName":    name,
            "totalRecords": len(records),
            "latestScore":  records[-1].healthScore if records else None,
            "latestBand":   records[-1].healthBand  if records else None,
            "trend":        trend.model_dump() if trend else None,
        })

    return {
        "totalFields":   len(fields),
        "totalAnalyses": len(all_reports),
        "fields":        fields,
    }


@router.get("/api/fields/{field_id}/trends", summary="Get Field Trends", tags=["default"])
def get_field_trends(field_id: str):
    """
    Returns the full history and trend analysis for a specific field.

    - **field_id**: The field name (URL-encoded if it contains spaces)

    Trend data includes:
    - **direction**: improving / stable / declining
    - **pointsPerRecord**: average health score change per analysis
    - **seasonsToCritical**: estimated seasons until score falls below 40
    """
    field_name = field_id.replace("-", " ")
    records    = db.get_by_field(field_name)

    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"No records found for field '{field_name}'. Run /api/analyze-soil first."
        )

    trend = compute_trend(records)

    return FieldTrendResponse(
        fieldName=field_name,
        totalRecords=len(records),
        trend=trend,
        history=records,
    ).model_dump()
