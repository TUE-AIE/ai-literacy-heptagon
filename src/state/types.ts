import { DimensionCode, Profile } from "../content/dimensions";

export interface Subject {
  name?: string;
  role?: string;
  productArea?: string;      // key from org.ts (e.g. "libraryAndOpenScience")
  team?: string;             // team name (free-form match against org.ts)
}

/**
 * Per-dimension sub-scores. Each entry is an array of length SUBS_PER_DIM
 * (four sub-questions); a missing index means that sub-question is unanswered.
 * `undefined` in the array means unanswered.
 */
export type DraftSubScores = Partial<Record<DimensionCode, (number | undefined)[]>>;

/** During assessment, evidence is free-text per dimension. */
export type EvidenceMap = Partial<Record<DimensionCode, string>>;

/** Optional pilot-phase feedback collected on the results page. */
export interface PilotFeedback {
  clarity?: "yes" | "somewhat" | "no";
  notes?: string;
}

export interface AssessmentDraft {
  /** Schema version of the persisted draft. Bumped whenever the shape changes. */
  version: "3.0";
  subject: Subject;
  /** The actual assessment state — four sub-scores per dimension. */
  subScores: DraftSubScores;
  evidence: EvidenceMap;
  updatedAt: string;         // ISO
}

/** View-state machine. */
export type View =
  | { kind: "landing" }
  | { kind: "scope";      subject: Subject }
  | { kind: "assess";     subject: Subject; subScores: DraftSubScores; evidence: EvidenceMap; index: number }
  | { kind: "results";    subject: Subject; profile: Profile;          subScores: DraftSubScores; evidence: EvidenceMap }
  | { kind: "aggregator" };

export const EMPTY_SUBJECT: Subject = {};
