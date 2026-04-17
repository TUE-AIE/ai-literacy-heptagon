import { DIMENSIONS, Profile } from "../content/dimensions";
import { Subject, EvidenceMap } from "../state/types";

export const SCHEMA_VERSION = "1.0";
export const HEPTAGON_VERSION = "Hackl2025";

export interface ExportDocument {
  schemaVersion: string;
  heptagonVersion: string;
  scope: "individual" | "team";
  subject: {
    name?: string;
    role?: string;
    productArea?: string;
    team?: string;
    participantCount?: number;
  };
  timestamp: string;
  assessments: Record<string, { level: number; evidence: string | null }>;
  notes: string | null;
}

export function buildExport(
  subject: Subject,
  profile: Profile,
  evidence: EvidenceMap
): ExportDocument {
  const assessments: Record<string, { level: number; evidence: string | null }> = {};
  for (const d of DIMENSIONS) {
    assessments[d.code] = {
      level: profile[d.code] ?? 0,
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
      participantCount: subject.participantCount
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
