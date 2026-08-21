// POST /api/analyze — run a full soil analysis and persist the result
import { Router } from "express";
import { analyzeSoil } from "../engine.js";
import { saveReport, countReports } from "../db.js";

export const analyzeRoutes = Router();

// ── Input validation ──────────────────────────────────────────────────────────
function validateInput(body) {
  const errors = [];
  const required = ["fieldName", "village", "areaHa", "nitrogen", "phosphorus", "potassium", "ph", "organicMatter", "moisture"];

  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      errors.push(`'${field}' is required`);
    }
  }

  if (!errors.length) {
    if (typeof body.areaHa !== "number" || body.areaHa <= 0)          errors.push("'areaHa' must be a positive number");
    if (typeof body.nitrogen !== "number" || body.nitrogen < 0)        errors.push("'nitrogen' must be >= 0");
    if (typeof body.phosphorus !== "number" || body.phosphorus < 0)    errors.push("'phosphorus' must be >= 0");
    if (typeof body.potassium !== "number" || body.potassium < 0)      errors.push("'potassium' must be >= 0");
    if (typeof body.ph !== "number" || body.ph < 0 || body.ph > 14)   errors.push("'ph' must be between 0 and 14");
    if (typeof body.organicMatter !== "number" || body.organicMatter < 0) errors.push("'organicMatter' must be >= 0");
    if (typeof body.moisture !== "number" || body.moisture < 0 || body.moisture > 100) errors.push("'moisture' must be 0–100");
  }

  return errors;
}

// ── POST /api/analyze ─────────────────────────────────────────────────────────
analyzeRoutes.post("/", (req, res) => {
  const { soilInput, soilTypePrediction } = req.body;

  if (!soilInput) {
    return res.status(400).json({ error: "Request body must contain a 'soilInput' object" });
  }

  const errors = validateInput(soilInput);
  if (errors.length) {
    return res.status(422).json({ error: "Validation failed", details: errors });
  }

  try {
    const analysisNo = countReports() + 1;
    const report = analyzeSoil(soilInput, soilTypePrediction ?? null, analysisNo);
    saveReport(report);

    console.log(`  ✅ analysis #${report.analysisNo} — field: "${soilInput.fieldName}" — score: ${report.healthScore}`);

    return res.status(201).json({
      success: true,
      report,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Analysis failed: " + err.message });
  }
});
