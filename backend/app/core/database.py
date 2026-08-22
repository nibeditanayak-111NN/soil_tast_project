# In-memory store — replace with SQLite/PostgreSQL for production
from app.schemas.models import SoilAnalysisReport

_store: dict[str, SoilAnalysisReport] = {}


def get_all() -> list[SoilAnalysisReport]:
    return sorted(_store.values(), key=lambda r: r.createdAt, reverse=True)


def get_by_field(field_name: str) -> list[SoilAnalysisReport]:
    return sorted(
        [r for r in _store.values() if r.fieldName.lower() == field_name.lower()],
        key=lambda r: r.createdAt,
    )


def get_one(report_id: str) -> SoilAnalysisReport | None:
    return _store.get(report_id)


def save(report: SoilAnalysisReport) -> SoilAnalysisReport:
    _store[report.id] = report
    return report


def delete(report_id: str) -> bool:
    if report_id in _store:
        del _store[report_id]
        return True
    return False


def count() -> int:
    return len(_store)


def all_field_names() -> list[str]:
    return list({r.fieldName for r in _store.values()})
