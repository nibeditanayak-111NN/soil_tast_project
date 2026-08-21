// GET /api/health — liveness & readiness probe
import { Router } from "express";
import { countReports } from "../db.js";

export const healthRoutes = Router();

healthRoutes.get("/", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(1) + "s",
    reportsInMemory: countReports(),
  });
});
