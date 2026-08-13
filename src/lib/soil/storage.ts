import type { SoilReport } from "./types";

const KEY = "soil-reports-v1";

export function loadReports(): SoilReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SoilReport[]) : [];
  } catch {
    return [];
  }
}

export function saveReport(report: SoilReport): SoilReport[] {
  const all = [report, ...loadReports()].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}

export function deleteReport(id: string): SoilReport[] {
  const all = loadReports().filter((r) => r.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}