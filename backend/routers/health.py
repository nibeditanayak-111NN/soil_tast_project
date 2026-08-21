import time
from fastapi import APIRouter
import db

router = APIRouter()
_start = time.time()


@router.get("/api/health", summary="Health Check", tags=["default"])
def health_check():
    """Returns server status, uptime, and number of analyses stored."""
    return {
        "status": "ok",
        "uptime": f"{time.time() - _start:.1f}s",
        "analysesStored": db.count(),
        "framework": "FastAPI",
    }
