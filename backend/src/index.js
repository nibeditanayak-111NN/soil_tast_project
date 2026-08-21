// ─────────────────────────────────────────────────────────────────────────────
// Soil Health PWA — Express REST API Backend
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { analyzeRoutes } from "./routes/analyze.js";
import { reportsRoutes } from "./routes/reports.js";
import { healthRoutes } from "./routes/health.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "15mb" }));   // images are base64 encoded
app.use(express.urlencoded({ extended: true }));

// Attach a request-id to every call for tracing
app.use((req, _res, next) => {
  req.requestId = uuidv4();
  next();
});

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}  (id: ${req.requestId})`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/health",  healthRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/reports", reportsRoutes);

// ── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: "Soil Health API",
    version: "1.0.0",
    status: "running",
    endpoints: [
      "GET  /api/health             — server health check",
      "POST /api/analyze            — run full soil analysis",
      "GET  /api/reports            — list all saved reports",
      "GET  /api/reports/:id        — get a single report",
      "DELETE /api/reports/:id      — delete a report",
    ],
  });
});

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌱 Soil Health API running on http://localhost:${PORT}`);
  console.log(`   Docs: http://localhost:${PORT}/\n`);
});
