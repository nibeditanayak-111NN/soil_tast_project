// CRUD routes for soil reports
// GET    /api/reports        — list all reports
// GET    /api/reports/:id    — get one report
// DELETE /api/reports/:id    — delete a report
import { Router } from "express";
import { getAllReports, getReport, removeReport } from "../db.js";
import { computeTrend } from "../engine.js";

export const reportsRoutes = Router();

// ── GET /api/reports ──────────────────────────────────────────────────────────
reportsRoutes.get("/", (_req, res) => {
  const all = getAllReports();
  const trend = computeTrend(all);

  return res.json({
    total: all.length,
    trend,
    reports: all,
  });
});

// ── GET /api/reports/:id ──────────────────────────────────────────────────────
reportsRoutes.get("/:id", (req, res) => {
  const report = getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: `Report '${req.params.id}' not found` });
  }
  return res.json({ report });
});

// ── DELETE /api/reports/:id ───────────────────────────────────────────────────
reportsRoutes.delete("/:id", (req, res) => {
  const existed = removeReport(req.params.id);
  if (!existed) {
    return res.status(404).json({ error: `Report '${req.params.id}' not found` });
  }
  return res.json({ success: true, message: `Report '${req.params.id}' deleted` });
});
