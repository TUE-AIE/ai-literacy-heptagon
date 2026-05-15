import { DIMENSIONS, Profile } from "../content/dimensions";
import { Subject, EvidenceMap, PilotFeedback } from "../state/types";
import { SUBS_PER_DIM, meanOfSubScores } from "../content/questions";

/**
 * Schema versions. v3.0 drops team mode and role archetypes; otherwise the
 * per-dimension assessment shape is unchanged from v2.0. The aggregator
 * still accepts v2.0 files for the transition period.
 */
export const SCHEMA_VERSION   = "3.0";
export const HEPTAGON_VERSION = "Hackl2025";

export interface AssessmentCell {
  /** Four integer sub-scores (0..3), one per sub-question in the dimension. */
  subScores: number[];
  /** Computed mean of the sub-scores (0..3, fractional). Stored for convenience; do not rely on it as the source of truth — always reconcile against `subScores`. */
  level: number;
  /** Free-text evidence the respondent attached at the dimension level. */
  evidence: string | null;
}

export interface ExportDocument {
  schemaVersion: string;   // "3.0"
  heptagonVersion: string; // "Hackl2025"
  scope: "individual";
  subject: {
    name?: string;
    role?: string;
    productArea?: string;
    team?: string;
  };
  timestamp: string;
  assessments: Record<string, AssessmentCell>;
  pilotFeedback: PilotFeedback | null;
  notes: string | null;
}

/** Build an export document from current assessment state. */
export function buildExport(
  subject: Subject,
  profile: Profile,
  evidence: EvidenceMap,
  subScores: Record<string, number[]>,
  pilotFeedback?: PilotFeedback | null
): ExportDocument {
  const assessments: Record<string, AssessmentCell> = {};
  for (const d of DIMENSIONS) {
    const subs = subScores[d.code] ?? [];
    const mean = meanOfSubScores(subs) ?? profile[d.code] ?? 0;
    assessments[d.code] = {
      subScores: subs.slice(0, SUBS_PER_DIM),
      level: mean,
      evidence: evidence[d.code]?.trim() || null
    };
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    heptagonVersion: HEPTAGON_VERSION,
    scope: "individual",
    subject: {
      name: subject.name,
      role: subject.role,
      productArea: subject.productArea,
      team: subject.team
    },
    timestamp: new Date().toISOString(),
    assessments,
    pilotFeedback: pilotFeedback ?? null,
    notes: null
  };
}

function sanitize(s: string | undefined): string {
  return (s ?? "anonymous").replace(/[^A-Za-z0-9\-_]+/g, "-").toLowerCase();
}

export function exportFilename(subject: Subject, when = new Date()): string {
  const stamp = when.toISOString().slice(0, 10); // YYYY-MM-DD
  const who = sanitize(subject.name ?? "individual");
  return `heptagon-individual-${who}-${stamp}.json`;
}

export function downloadJson(doc: ExportDocument, filename: string): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick before revoking so the download kicks off cleanly.
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
