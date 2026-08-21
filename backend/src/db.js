// ── In-memory "database" ─────────────────────────────────────────────────────
// Stores reports for the lifetime of the server process.
// Replace with a real DB (SQLite / PostgreSQL / MongoDB) in production.
const reports = new Map();   // id → SoilReport

export function getAllReports() {
  return [...reports.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getReport(id) {
  return reports.get(id) ?? null;
}

export function saveReport(report) {
  reports.set(report.id, report);
  return report;
}

export function removeReport(id) {
  return reports.delete(id);
}

export function countReports() {
  return reports.size;
}
