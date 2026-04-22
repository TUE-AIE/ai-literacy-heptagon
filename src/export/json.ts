import { DIMENSIONS, Profile } from "../content/dimensions";
import { Subject, EvidenceMap } from "../state/types";
import { SUBS_PER_DIM, meanOfSubScores } from "../content/questions";
import { RoleKey } from "../content/targetProfiles";

/**
 * Schema versions. v2.0 replaces the single level-per-dimension with an array
 * of four integer sub-scores; the dimension's level is derived as their mean.
 * v1.0 is deliberately not read — the upgrade requires a fresh assessment.
 */
export const SCHEMA_VERSION   = "2.0";
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
  schemaVersion: string;   // "2.0"
  heptagonVersion: string; // "Hackl2025"
  scope: "individual" | "team";
  subject: {
    name?: string;
    role?: string;
    productArea?: string;
    team?: string;
    participantCount?: number;
    /** Optional LIS role archetype whose target profile applies to this export. */
    roleArchetype?: RoleKey;
  };
  timestamp: string;
  assessments: Record<string, AssessmentCell>;
  notes: string | null;
}

/** Build an export document from current assessment state. */
export function buildExport(
  subject: Subject,
  profile: Profile,
  evidence: EvidenceMap,
  subScores: Record<string, number[]>
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
    scope: subject.scope,
    subject: {
      name: subject.name,
      role: subject.role,
      productArea: subject.productArea,
      team: subject.team,
      participantCount: subject.participantCount,
      roleArchetype: subject.roleArchetype
    },
    timestamp: new Date().toISOString(),
    assessments,
    notes: null
  };
}

function sanitize(s: string | undefined): string {
  return (s ?? "anonymous").replace(/[^A-Za-z0-9\-_]+/g, "-").toLowerCase();
}

export function exportFilename(subject: Subject, when = new Date()): string {
  const stamp = when.toISOString().slice(0, 10); // YYYY-MM-DD
  const who = subject.scope === "team"
    ? sanitize(subject.name ?? subject.team ?? "team")
    : sanitize(subject.name ?? "individual");
  return `heptagon-${subject.scope}-${who}-${stamp}.json`;
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
