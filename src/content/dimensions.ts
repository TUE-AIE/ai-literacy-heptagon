/**
 * The seven dimensions of the AI Literacy Heptagon.
 * Order matters — it fixes the axis sequence of the heptagon (starting at the
 * top vertex, going clockwise). This matches the ordering in Figure 3 of
 * Hackl, Müller, Sailer (2025).
 *
 * Display strings (short label, full name, Bloom anchors per level) are not
 * in this file — they live in the i18n locale bundles so the content pass
 * can translate them without touching code.
 */

export const LEVELS = [0, 1, 2, 3] as const;
export type LevelIndex = (typeof LEVELS)[number];

export const LEVEL_KEYS = ["unaware", "beginner", "intermediate", "expert"] as const;
export type LevelKey = (typeof LEVEL_KEYS)[number];

export interface DimensionMeta {
  /** Two- or three-letter code used by the paper (TKS, AP, CTA, IS, LRK, EAR, SIU). */
  code: string;
  /** Stable i18n key — never change after content is written. */
  key: string;
}

export const DIMENSIONS: readonly DimensionMeta[] = [
  { code: "TKS", key: "technical"  },
  { code: "AP",  key: "application" },
  { code: "IS",  key: "integration" },
  { code: "LRK", key: "legal" },
  { code: "SIU", key: "socialImpact" },
  { code: "EAR", key: "ethical" },
  { code: "CTA", key: "criticalThinking" }
] as const;

export type DimensionCode = (typeof DIMENSIONS)[number]["code"];

/**
 * A profile = a computed mean (0..3, fractional) for each dimension code.
 * Under schema v2.0 this is derived from four sub-scores per dimension; the
 * raw sub-scores live in `DraftSubScores` and in each `ExportDocument`.
 */
export type Profile = Record<DimensionCode, number>;

/** Sample profile — matches the figure used in the phase-0 sketch. */
export const SAMPLE_PROFILE: Profile = {
  TKS: 1,
  AP:  2,
  IS:  2,
  LRK: 0,
  SIU: 2,
  EAR: 2,
  CTA: 2
};
