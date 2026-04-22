/**
 * Target AI-literacy profiles per LIS role archetype.
 * Source: "AI Literacy Mapping LIS" (AI Literacy Team, TU/e LIS, 2026).
 *
 * Targets are stored as ranges (min..max). Point targets have min === max.
 * The Heptagon renders the range as a translucent band; numeric deltas use
 * the midpoint — honours "anywhere in this range is fine" without forcing
 * a single number.
 *
 *   B = 1 (Beginner)
 *   I = 2 (Intermediate)
 *   E = 3 (Expert)
 *
 * Baseline expectation for all LIS staff: at least Beginner overall.
 * Differentiation happens from Intermediate onward.
 */

import { DimensionCode } from "./dimensions";

export interface TargetRange {
  /** Lower bound level (0..3). */
  min: number;
  /** Upper bound level (0..3). Equals min for a point target. */
  max: number;
  /** Short rationale shown next to the dimension card. */
  rationale: string;
}

export type TargetProfile = Record<DimensionCode, TargetRange>;

export interface Role {
  /** Stable key used as the value in the scope-form dropdown and in exports. */
  key: string;
  /** i18n key suffix for the role's display name and prose description. */
  i18nKey: string;
  /** Targets per dimension. */
  targets: TargetProfile;
}

/* ---------- shorthand builders ---------- */

const B = 1, I = 2, E = 3;
const point = (lvl: number, rationale: string): TargetRange => ({ min: lvl, max: lvl, rationale });
const band  = (lo: number, hi: number, rationale: string): TargetRange => ({ min: lo, max: hi, rationale });

/* ---------- the six archetypes ---------- */

export const ROLES: Role[] = [
  {
    key: "infoLitTeaching",
    i18nKey: "infoLitTeaching",
    targets: {
      TKS: point(I, "Need to explain AI systems and limitations accurately to students"),
      AP:  point(I, "Regular use of genAI for teaching examples and learning activities"),
      CTA: point(E, "Core role is developing critical evaluation skills"),
      IS:  point(I, "Embed AI discussions into existing IL curricula"),
      LRK: point(I, "Academic integrity, copyright, data protection"),
      EAR: point(E, "Ethical reasoning is central to teaching"),
      SIU: point(E, "Strong focus on societal impact and student agency")
    }
  },
  {
    key: "researchOpenScience",
    i18nKey: "researchOpenScience",
    targets: {
      TKS: point(I, "Understanding AI methods and limits in research contexts"),
      AP:  point(I, "Use of AI for literature, metadata, analysis support"),
      CTA: point(E, "Prevent misuse, over-trust, and flawed research practices"),
      IS:  point(I, "Integration with tools, workflows, repositories"),
      LRK: point(E, "Copyright, data protection, licensing, EU AI Act"),
      EAR: point(I, "Responsible research use"),
      SIU: point(I, "Impact of AI on research ecosystems")
    }
  },
  {
    key: "copyrightLegalPolicy",
    i18nKey: "copyrightLegalPolicy",
    targets: {
      TKS: band(B, I, "Enough to interpret AI use meaningfully"),
      AP:  point(B, "Tool use is not core"),
      CTA: point(I, "Needed to analyse AI-related claims"),
      IS:  point(B, "Limited integration responsibility"),
      LRK: point(E, "Core expertise area"),
      EAR: point(E, "Ethical governance and policy framing"),
      SIU: point(I, "Societal consequences inform policy")
    }
  },
  {
    key: "digitalServicesSystems",
    i18nKey: "digitalServicesSystems",
    targets: {
      TKS: band(I, E, "Need strong understanding of how AI systems function"),
      AP:  band(I, E, "Tool testing, configuration, evaluation"),
      CTA: point(I, "Critical evaluation of vendor claims"),
      IS:  point(E, "Core responsibility: integration into systems"),
      LRK: point(I, "Compliance, procurement, risk awareness"),
      EAR: point(I, "Ethical implications of system choices"),
      SIU: band(B, I, "Secondary but relevant")
    }
  },
  {
    key: "frontOfficeSupport",
    i18nKey: "frontOfficeSupport",
    targets: {
      TKS: point(B, "Conceptual understanding sufficient"),
      AP:  band(B, I, "Basic AI use and referral"),
      CTA: point(I, "Spot misinformation or misuse"),
      IS:  point(B, "Not responsible for system design"),
      LRK: point(B, "Know when issues arise & where to refer"),
      EAR: point(I, "Responsible guidance to students"),
      SIU: point(I, "Understand student impact")
    }
  },
  {
    key: "managementCoordination",
    i18nKey: "managementCoordination",
    targets: {
      TKS: band(B, I, "Strategic understanding rather than technical depth"),
      AP:  point(B, "Informed leadership, not daily use"),
      CTA: point(E, "Evaluate risks, promises, and trade-offs"),
      IS:  point(I, "Strategic integration decisions"),
      LRK: band(I, E, "Institutional compliance responsibility"),
      EAR: point(E, "Governance, accountability"),
      SIU: point(E, "Strategic societal positioning")
    }
  }
];

/* ---------- helpers ---------- */

export const ROLE_KEYS = ROLES.map((r) => r.key);
export type RoleKey = typeof ROLES[number]["key"] | "other";

export function roleByKey(key: string | undefined): Role | undefined {
  if (!key || key === "other") return undefined;
  return ROLES.find((r) => r.key === key);
}

/** Midpoint of a range, used for delta-vs-target numeric comparisons. */
export function midpoint(r: TargetRange): number {
  return (r.min + r.max) / 2;
}
