import { DIMENSIONS } from "../content/dimensions";
import { ExportDocument, HEPTAGON_VERSION } from "../export/json";

export type ValidationResult =
  | { ok: true;  doc: ExportDocument }
  | { ok: false; errors: string[] };

/**
 * Check an unknown value matches the export schema. Errors are plain English,
 * aimed at a team lead who might be looking at the file themselves to fix it.
 */
export function validateExport(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Not a JSON object."] };
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.schemaVersion !== "string")  errors.push("Missing schemaVersion.");
  if (r.heptagonVersion !== HEPTAGON_VERSION) {
    errors.push(`Unknown heptagonVersion (expected "${HEPTAGON_VERSION}").`);
  }
  if (r.scope !== "individual" && r.scope !== "team") {
    errors.push('Scope must be "individual" or "team".');
  }
  if (!r.subject || typeof r.subject !== "object") {
    errors.push("Missing subject block.");
  }
  if (typeof r.timestamp !== "string" || Number.isNaN(Date.parse(r.timestamp as string))) {
    errors.push("Missing or invalid timestamp.");
  }
  if (!r.assessments || typeof r.assessments !== "object") {
    errors.push("Missing assessments block.");
  } else {
    const a = r.assessments as Record<string, unknown>;
    for (const d of DIMENSIONS) {
      const cell = a[d.code];
      if (!cell || typeof cell !== "object") {
        errors.push(`Missing ${d.code} assessment.`);
        continue;
      }
      const lv = (cell as Record<string, unknown>).level;
      if (typeof lv !== "number" || !Number.isFinite(lv) || lv < 0 || lv > 3 || Math.floor(lv) !== lv) {
        errors.push(`${d.code} level must be an integer 0–3.`);
      }
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, doc: r as unknown as ExportDocument };
}

/** Read a File as text; used by the Dropzone. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload  = () => resolve(String(fr.result ?? ""));
    fr.onerror = () => reject(fr.error ?? new Error("Read failed"));
    fr.readAsText(file);
  });
}
