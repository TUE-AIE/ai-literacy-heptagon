import { DIMENSIONS } from "../content/dimensions";
import { SUBS_PER_DIM } from "../content/questions";
import { ExportDocument, HEPTAGON_VERSION, SCHEMA_VERSION } from "../export/json";

export type ValidationResult =
  | { ok: true;  doc: ExportDocument }
  | { ok: false; errors: string[] };

/**
 * Validate an unknown value against the v2.0 export schema. Errors are plain
 * English so a team lead can fix a broken file themselves. v1.0 exports are
 * recognised and rejected with a specific message pointing at the upgrade.
 */
export function validateExport(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Not a JSON object."] };
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.schemaVersion !== "string") {
    errors.push("Missing schemaVersion.");
  } else if (r.schemaVersion === "1.0") {
    return { ok: false, errors: [
      `This is a v1.0 export. The assessment has been upgraded to v${SCHEMA_VERSION} (four sub-questions per dimension); please ask the respondent to re-run the assessment.`
    ]};
  } else if (r.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`Unknown schemaVersion "${r.schemaVersion}" (expected "${SCHEMA_VERSION}").`);
  }

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
      const c = cell as Record<string, unknown>;
      const subs = c.subScores;
      if (!Array.isArray(subs) || subs.length !== SUBS_PER_DIM) {
        errors.push(`${d.code} must have an array of ${SUBS_PER_DIM} subScores.`);
      } else if (!subs.every((s) => typeof s === "number" && Number.isInteger(s) && s >= 0 && s <= 3)) {
        errors.push(`${d.code} subScores must each be an integer 0–3.`);
      }
      if (typeof c.level !== "number" || !Number.isFinite(c.level) || c.level < 0 || c.level > 3) {
        errors.push(`${d.code} level must be a number in 0..3.`);
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
