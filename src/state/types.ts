import { DimensionCode, LevelIndex, Profile } from "../content/dimensions";

export type ScopeKind = "individual" | "team";

export interface Subject {
  scope: ScopeKind;
  name?: string;
  role?: string;
  productArea?: string;   // key from org.ts (e.g. "libraryAndOpenScience")
  team?: string;          // team name (free-form match against org.ts)
  participantCount?: number;
}

/** During assessment, any dimension may be unanswered (undefined). */
export type DraftProfile = Partial<Record<DimensionCode, LevelIndex>>;
export type EvidenceMap = Partial<Record<DimensionCode, string>>;

export interface AssessmentDraft {
  subject: Subject;
  levels: DraftProfile;
  evidence: EvidenceMap;
  updatedAt: string;      // ISO
}

/** View-state machine. */
export type View =
  | { kind: "landing" }
  | { kind: "scope";      subject: Subject }
  | { kind: "assess";     subject: Subject; levels: DraftProfile; evidence: EvidenceMap; index: number }
  | { kind: "results";    subject: Subject; profile: Profile;     evidence: EvidenceMap }
  | { kind: "aggregator" };

export const EMPTY_SUBJECT: Subject = { scope: "individual" };
