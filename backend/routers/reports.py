from fastapi import APIRouter, HTTPException
from engine import compute_trend
import db

router = APIRouter()


@router.get("/")
def list_reports():
    """List all saved reports with trend analysis."""
    all_reports = db.get_all()
    trend = compute_trend(all_reports)
    return {
        "total": len(all_reports),
        "trend": trend.model_dump() if trend else None,
        "reports": [r.model_dump() for r in all_reports],
    }


@router.get("/{report_id}")
def get_report(report_id: str):
    """Get a single report by its UUID."""
    report = db.get_one(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")
    return {"report": report.model_dump()}


@router.delete("/{report_id}")
def delete_report(report_id: str):
    """Delete a report by its UUID."""
    deleted = db.delete(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")
    return {"success": True, "message": f"Report '{report_id}' deleted"}
